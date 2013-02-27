/* GAMBIT Interface
*
* Copyright (C) USC Information Sciences Institute
* Author: Nibir Bora <nbora@usc.edu>
* URL: <http://cbg.isi.edu/>
* For license information, see LICENSE
*/

$(function() {
		var mapOptions = {
		center : new google.maps.LatLng(34.0522, -118.2428),
		zoom : 11,
		mapTypeId : google.maps.MapTypeId.SATELLITE,

		mapTypeControl : true,
		mapTypeControlOptions : {
			style : google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
			position : google.maps.ControlPosition.RIGHT_BOTTOM
		},
		panControl : true,
		panControlOptions : {
			position : google.maps.ControlPosition.RIGHT_CENTER
		},
		zoomControl : true,
		zoomControlOptions : {
			style : google.maps.ZoomControlStyle.LARGE,
			position : google.maps.ControlPosition.RIGHT_CENTER
		},
		scaleControl : true,
		scaleControlOptions : {
			position : google.maps.ControlPosition.RIGHT_BOTTOM
		},
		streetViewControl : true,
		streetViewControlOptions : {
			position : google.maps.ControlPosition.RIGHT_CENTER
		}
	};
	var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
	

	//--- GLOBALs
	var API_V2_LOCATION_LIST = "http://brain.isi.edu:4002/api/v2/location/list";
	//var JSON_URL = 'http://brain.isi.edu/~gambit/v2.0/data/json-gang-move/';
	//var JSON_URL = 'http://nibir/~gambit/gang-move/data/';
	var JSON_URL = "data/";
	//-----
	var gt_points=[];
	var gang_territory = null;
	var home_marker = {};
	var points_outside = [];
	var heatmap_outside = null;
	var points_inside = [];
	var heatmap_inside = null;
	//-----

	//----- Populate gang territory id
	/*
	var location_api_url = "http://brain.isi.edu:4000/api/v1/location/list";

	$.getJSON(location_api_url, function(data) {
		$.each(data, function(i, location) {
			if (location.id >= 23 && location.id <= 54) {
				$("#location-list").append('<option value="' + location.id + '">' + location.name + '</option>');
			}
		});
	});
*/
	//-----

	//--- Rival territory info & polygons
	var rival_locations = {
		26: [33, 41, 39],
		27: [30, 51, 49, 39, 34],
		29: [41, 25, 31],
		32: [36, 37, 33],
		33: [42, 44, 26, 32, 37],
		36: [37, 32, 41],
		39: [52, 48, 26, 49, 51, 30, 34, 43, 40],
		40: [39, 43],
		44: [33],
		45: [53, 23, 38, 54],
		49: [28, 51, 30, 39],
		50: [34, 30],
		51: [49, 39, 43, 34, 30],
		54: [23, 53, 45, 38, 35, 30]
	};
	//load location polygons
	var location_polygons = {};
	var hbk_polygon = null;

	$("#show-button").attr('disabled', true);	// Disable while loading
	$.ajax({
		url: API_V2_LOCATION_LIST,
		type: 'GET',
		dataType: 'json',
		error: function(data) {
			console.log('Error! APIv2 location::list');
			console.log(data);

			$("#show-button").attr('disabled', false);
		},
		success: function(data) {
			$.each(data, function(i, location) { 
				if(location.id >= 23 && location.id <= 54) {
					gt_points=[];
					$.each(location.polygon, function(i, latlng) {
						gt_points.push(new google.maps.LatLng(latlng[0], latlng[1]));
					});
					gt_points.pop();
					location_polygons[location.id] = new google.maps.Polygon({
						paths: gt_points,
				    strokeColor: "red",
				    strokeOpacity: 0.75,
				    strokeWeight: 1,
				    fillColor: "red",
				    fillOpacity: 0.15
					});
				}
				else if(location.id == 20) {
					hbk_polygon = new google.maps.Rectangle({
				    strokeColor: "white",
				    strokeOpacity: 0.75,
				    strokeWeight: 2,
				    fillColor: "white",
				    fillOpacity: 0
					});
					hbk_polygon.setBounds(new google.maps.LatLngBounds(new google.maps.LatLng(location.polygon[0][0], location.polygon[0][1]), new google.maps.LatLng(location.polygon[2][0], location.polygon[2][1])));
				}
			});	
			
			$("#show-button").attr('disabled', false);
		}
	});
	//-----

	//--- Show gang activity
	google.maps.event.addDomListener(document.getElementById('show-button'), 'click', function() {
		clearAllOverlay();

		var location_id = Number($('#location-list option:selected').val());
		var file_name = $('#location-list option:selected').val() + '.json';
		//console.log(JSON_URL + file_name);

		$.getJSON(JSON_URL + file_name, function(data) {
			//console.log(data);
			hbk_polygon.setMap(map);
			// Gang teritory polygon
			gt_points=[];
			$.each(data.location_polygon, function(i, latlng) {
				gt_points.push(new google.maps.LatLng(latlng[0], latlng[1]));
			});
			gt_points.pop();

			gang_territory = new google.maps.Polygon({
		    paths: gt_points,
		    strokeColor: "blue",
		    strokeOpacity: 0.8,
		    strokeWeight: 2,
		    fillColor: "blue",
		    fillOpacity: 0.1
		  });
		  gang_territory.setMap(map);

		  // Each user
		  $.each(data.users, function(id, user_data) {
			  // Home market
			  home_marker[id] = new google.maps.Marker({
	      	position: new google.maps.LatLng(user_data.home[0], user_data.home[1]),
	     	 	map: map,
	    	  title: 'user_id: ' + user_data.user_id
	 			});

	 			// Points outside
	 			$.each(user_data.points_outside, function(i, latlng) {
	 				points_outside.push(new google.maps.LatLng(latlng[0], latlng[1]));
	 			});
	 			
				// Points inside gang territory heatmap
				if(user_data.points_inside) {
		 			$.each(user_data.points_inside, function(i, latlng) {
		 				points_inside.push(new google.maps.LatLng(latlng[0], latlng[1]));
		 			});
				}
			});

			// Rival locations
			$.each(rival_locations[location_id], function(i, rival_id) {
				location_polygons[rival_id].setMap(map);
			});

			// Heatmaps
			heatmap_outside = new google.maps.visualization.HeatmapLayer({
			  data: points_outside,
			  radius: 20,
			});
			heatmap_outside.setMap(map);
			heatmap_inside = new google.maps.visualization.HeatmapLayer({
			  data: points_inside,
			  radius: 7,
			  /*
			  gradient: [
					'rgba(0, 255, 255, 0)',
					'rgba(0, 255, 255, 1)',
					'rgba(0, 191, 255, 1)',
					'rgba(0, 127, 255, 1)',
					'rgba(0, 63, 255, 1)',
					'rgba(0, 0, 255, 1)',
					'rgba(0, 0, 223, 1)',
					'rgba(0, 0, 191, 1)',
					'rgba(0, 0, 159, 1)',
					'rgba(0, 0, 127, 1)',
					'rgba(63, 0, 91, 1)',
					'rgba(127, 0, 63, 1)',
					'rgba(191, 0, 31, 1)',
					'rgba(255, 0, 0, 1)']
				*/
			});
			heatmap_inside.setMap(map);
		});
	});

	google.maps.event.addDomListener(document.getElementById('clear-map-button'), 'click', function() {
		clearAllOverlay();
	});
	//---
	google.maps.event.addDomListener(document.getElementById('toggle-gradient'), 'click', function() {
		var gradient = [
			'rgba(0, 255, 255, 0)',
			'rgba(0, 255, 255, 1)',
			'rgba(0, 191, 255, 1)',
			'rgba(0, 127, 255, 1)',
			'rgba(0, 63, 255, 1)',
			'rgba(0, 0, 255, 1)',
			'rgba(0, 0, 223, 1)',
			'rgba(0, 0, 191, 1)',
			'rgba(0, 0, 159, 1)',
			'rgba(0, 0, 127, 1)',
			'rgba(63, 0, 91, 1)',
			'rgba(127, 0, 63, 1)',
			'rgba(191, 0, 31, 1)',
			'rgba(255, 0, 0, 1)'
		]
    heatmap_outside.setOptions({
      gradient: heatmap_outside.get('gradient') ? null : gradient
    });
    if(heatmap_inside) {
	    heatmap_inside.setOptions({
	      gradient: heatmap_inside.get('gradient') ? null : gradient
	    });
	  }
	});
	//--- Clear
	function clearAllOverlay() {
		if(gang_territory) {
			gang_territory.setMap(null);
			gang_territory = null;
			
			points_outside = [];
		  points_inside = [];
			heatmap_outside.setMap(null);
			heatmap_outside = null;
		}
		if(home_marker) {
			$.each(home_marker, function(id, marker) {
				marker.setMap(null);
			});
			home_marker = {};
		}
		if(heatmap_inside) {
			heatmap_inside.setMap(null);
			heatmap_inside = null;
		}
		$.each(location_polygons, function(id, pol) {
			location_polygons[id].setMap(null);
		});
		hbk_polygon.setMap(null);

		// Counts
		if(marker_cluster_set) {
			removeNumbers();
		}
		$("#tweet-count").empty();
		$("#tweet-count").append(0);
	}
	//-----


	//--- Marker clusterer
	var marker_cluster_set = false;
	var marker_cluster = null;
	google.maps.event.addDomListener(document.getElementById("numbers-button"), 'click', function() {
		if(!marker_cluster_set && (points_inside.length > 0 || points_outside.length >0)) {
			showNumbers();
			marker_cluster_set = true;
			$("#numbers-button").button('toggle');
		}
		else if(marker_cluster_set) {
			removeNumbers();
		}
	});

	function showNumbers() {
		var marker_arr = [];
		$.each(points_inside, function(i, latlng) {
			marker_arr.push(new google.maps.Marker({	
				position: latlng,
				visible: true
			}));
		});
		$.each(points_outside, function(i, latlng) {
			marker_arr.push(new google.maps.Marker({
				position: latlng,
				visible: true
			}));
		});

		marker_cluster = new MarkerClusterer(map, marker_arr, {
			averageCenter: true,
			zoomOnClick: false,
			minimumClusterSize: 1,
		});
	}
	function removeNumbers() {
		marker_cluster.clearMarkers();
		marker_cluster = null;
		marker_cluster_set = false;
		$("#numbers-button").button('toggle');
	}
	//-----


	//--- Count tweets
	var drawing_manager = new google.maps.drawing.DrawingManager({
		drawingMode : null, // No initial drawing mode
		drawingControl : false, // Do not display drawing controls
		drawingControlOptions : {
			drawingModes : [google.maps.drawing.OverlayType.RECTANGLE]
		},
	});
	drawing_manager.setMap(map);
	//--- Overlay button events
	google.maps.event.addDomListener(document.getElementById("count-button"), 'click', function() {
		if (drawing_manager.drawingMode == google.maps.drawing.OverlayType.RECTANGLE) {
			drawing_manager.setDrawingMode(null);
		} else {
			drawing_manager.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE);
		}
	});
	google.maps.event.addListener(drawing_manager, 'rectanglecomplete', function(rectangle) {
		var count = 0;
		var rectangle_bounds = rectangle.getBounds();

		$.each(points_inside, function(i, latlng) {
			if(rectangle_bounds.contains(latlng)) {
				count += 1;
			}
		});
		$.each(points_outside, function(i, latlng) {
			if(rectangle_bounds.contains(latlng)) {
				count += 1;
			}
		});

		$("#tweet-count").empty();
		$("#tweet-count").append(count);
		rectangle.setMap(null);
	});
	google.maps.event.addListener(map, 'rightclick', function(rectangle) {
		drawing_manager.setDrawingMode(null);
		$("#count-button").button('toggle');
	});
	//-----


	//---------------------//
	//--- AUX FUNCTIONS ---//
	google.maps.event.addDomListener(document.getElementById('hbk-all-button'), 'click', function() {
		$("#hbk-all-button").attr('disabled', true);

		$.each(location_polygons, function(i, polygon) {
			polygon.setMap(map);
		});
		hbk_polygon.setMap(map);
		console.log(hbk_polygon.getBounds().toString());

		var large_bounds = new google.maps.Rectangle({
	    strokeColor: "white",
	    strokeOpacity: 0.75,
	    strokeWeight: 2,
	    fillColor: "white",
	    fillOpacity: 0
		});
		large_bounds.setBounds(new google.maps.LatLngBounds(new google.maps.LatLng(33.988, -118.255), new google.maps.LatLng(34.138, -118.105)));
		large_bounds.setMap(map);

		$.ajax({
			url: 'hbk-all/user_home_locations_hbk.json',
			type: 'GET',
			dataType: 'json',
			error: function(data) {
				console.log('Error! All homes json');
				console.log(data);

				$("#hbk-all-button").attr('disabled', false);
			},
			success: function(data) {
				var count = 0;
				$.each(data, function(id, latlng) {
					// plot homes inside large bounds
					//if(large_bounds.getBounds().contains(new google.maps.LatLng(latlng[0], latlng[1]))) {
					// plot homes inside hbk bounds
					//if(hbk_polygon.getBounds().contains(new google.maps.LatLng(latlng[0], latlng[1]))) {
						home_marker[id] = new google.maps.Marker({
			      	position: new google.maps.LatLng(latlng[0], latlng[1]),
			     	 	map: map,
			    	  title: 'user_id: ' + id
			 			});
			 			count += 1;
					//}
				});
				console.log('Homes inside HBK : ' + count);

				$("#hbk-all-button").attr('disabled', false);
			}
		});
	});
	//---------------------//
});