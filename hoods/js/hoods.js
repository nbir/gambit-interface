/* GAMBIT Interface
*
* Copyright (C) USC Information Sciences Institute
* Author: Nibir Bora <nbora@usc.edu>
* URL: <http://cbg.isi.edu/>
* For license information, see LICENSE
*/

$(function() {
	var light_map_style = [{
		featureType: "all",
		stylers: [{
			saturation: -80,
		},{
			inverse_lightness: true
		},
		{ "weight": 0.3 },
		]},
		{
  	featureType: "all",
  	elementType: "labels",
  	stylers: [
    	{ visibility: "off" }
  	]},{
			featureType: "road",
			stylers: [{
				visibility: "off"
			}]
		}];

	var light_map_road_style = [{
		featureType: "all",
		stylers: [{
			//lightness: 100,
			saturation: -80
		},{
			inverse_lightness: true
		},
		{ "weight": 0.3 },
		]},
		{
  	featureType: "all",
  	elementType: "labels",
  	stylers: [
    	{ visibility: "off" }
  	]
	}];

	var mapOptions = {
		disableDefaultUI: true,
		center : new google.maps.LatLng(34.042988,-118.24791),
		zoom : 10,
		mapTypeIds: [google.maps.MapTypeId.TERRAIN, 'uber_map'],

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
	map.mapTypes.set('map_style', new google.maps.StyledMapType(light_map_road_style));
	map.setMapTypeId('map_style');

	
	//--- API urls
	var JSON_URL = "data/";
	//-----

	// Region colors
	var colors = ["#4DAF4A","#3B3B3B","#984EA3","#E41A1C","#A65628","#FA71AF","#FF7F00","#377EB8"]
	
	// LOAD functions
	var loc_data = {};
	var id_list = [];
	var region_col = {};

	loadLocation();		// Call first function
	// Load location data
	function loadLocation() {
		$.ajax({
			url: JSON_URL + 'hoods_data.json',
			type: 'GET',
			dataType: 'json',
			error: function(data) {
				console.log('Error! hoods_data.json');
				console.log(data)
			},
			success: function(data) {
				$.each(data, function(i, location) {
					//loc_data[location.id] = location;
					loc_data[location.id] = {};
					id_list.push(location.id);
					loc_data[location.id]['id']=parseInt(location.id);
					loc_data[location.id]['name']=location.name;
					loc_data[location.id]['region']=location.region;
					loc_data[location.id]['polygon'] = location.polygon;

					if(!region_col[location.region]) {
						region_col[location.region] = colors.pop();
					}
				});
				//console.log(loc_data);
				console.log('Done loading loc_data.')
				start();
			}
		});
	}

	// PLOT functions
	var hood_pols = {};
	var gang_labels = {};
	
	var show_status = {};

	// Start plotting data
	function start() {
		$("#show-roads").button('toggle');

		initializeShowStatus();
		plotGangPols();
	}

	// Initialize visitation show status
	function initializeShowStatus() {
		$.each(id_list, function(i, h_id) {
			show_status[h_id] = false;
		});
	}

	// Plot each gang's polygon
	function plotGangPols() {
		$.each(loc_data, function(h_id, loc) {
			gt_points=[];
			$.each(loc.polygon, function(i, latlng) {
				gt_points.push(new google.maps.LatLng(latlng[0], latlng[1]));
			});
			gt_points.pop();

			hood_pols[h_id] = new google.maps.Polygon({
		    paths: gt_points,
		    strokeColor: region_col[loc_data[h_id]['region']],
		        strokeOpacity: 1,
		        strokeWeight: 1.5,
		        fillOpacity: 0,
		        //zIndex: 10
		  	});
		  	hood_pols[h_id].setMap(map);
		  	
		  	
		  	//Housekeeping
		  	/*
		  	google.maps.event.addListener(hood_pols[h_id], 'click', function(e) {
		  		console.log(h_id + ': (' + e.latLng.lng() + ', ' + e.latLng.lat() + '),');
		  		click_markers.push(new google.maps.Marker({ position: e.latLng, map: map }));
		  	});
			*/

			// Add events
			google.maps.event.addListener(hood_pols[h_id], 'click', function() {
				if(show_status[h_id] == false) {
					hood_pols[h_id].setOptions({
							fillColor: region_col[loc_data[h_id]['region']],
							fillOpacity: 0.25
						});
					show_status[h_id] = true;
				}
				else {
					hood_pols[h_id].setOptions({
							fillColor: null,
							fillOpacity: 0
						});
						show_status[h_id] = false;
				}
			});
			google.maps.event.addListener(hood_pols[h_id], 'mouseover', function() {
					$("#label-name").append(loc_data[h_id]['name']);
				if(show_status[h_id] == false) {
					hood_pols[h_id].setOptions({
							fillColor: region_col[loc_data[h_id]['region']],
							fillOpacity: 0.25
						});
				}
			});
			google.maps.event.addListener(hood_pols[h_id], 'mouseout', function() {
				$("#label-name").empty();
				if(show_status[h_id] == false) {
					hood_pols[h_id].setOptions({
							fillColor: null,
							fillOpacity: 0
						});
				}
			});

		});
	}


	// Show hide roads on map
	var show_roads = true;
	google.maps.event.addDomListener(document.getElementById('show-roads'), 'click', function() {
		$("#show-roads").button('toggle');
		if(show_roads == false) {
			show_roads = true;
			map.mapTypes.set('map_style', new google.maps.StyledMapType(light_map_road_style));
			map.setMapTypeId('map_style');
		}
		else {
			show_roads = false;
			map.mapTypes.set('map_style', new google.maps.StyledMapType(light_map_style));
			map.setMapTypeId('map_style');
		}
	});

	// Lighten map background
	var map_light = false;
	google.maps.event.addDomListener(document.getElementById('show-light-map'), 'click', function() {
		$("#show-light-map").button('toggle');

		if(map_light == false) {
			map_light = true;
			map.mapTypes.set('map_style', new google.maps.StyledMapType(
				[{
					featureType: "all",
					stylers: [{
						lightness: 100,
					}]
				},
				{
	  			featureType: "all",
	  			elementType: "labels",
	  			stylers: [{
	  				visibility: "off"
	  			}]
	  		},
	  		{
					featureType: "road",
					stylers: [{
						visibility: "off"
					}]
				}]
			));
			map.setMapTypeId('map_style');
		}
		else {
			map_light = false;
			if(show_roads == true) {
				map.mapTypes.set('map_style', new google.maps.StyledMapType(light_map_road_style));
				map.setMapTypeId('map_style');
			}
			else {
				map.mapTypes.set('map_style', new google.maps.StyledMapType(light_map_style));
				map.setMapTypeId('map_style');
			}
		}
		
	});


	// Select all territories
	google.maps.event.addDomListener(document.getElementById('select-all'), 'click', function() {
		$.each(show_status, function(h_id, status) {
			if(status == false) {
				show_status[h_id] = true;
				hood_pols[h_id].setOptions({
					fillColor: region_col[loc_data[h_id]['region']],
					fillOpacity: 0.25
				});
			}
		});
	});

	// Clear all territories
	google.maps.event.addDomListener(document.getElementById('clear-all'), 'click', function() {
		$.each(show_status, function(h_id, status) {
			if(status == true) {
				show_status[h_id] = false;
				hood_pols[h_id].setOptions({
					fillColor: null,
					fillOpacity: 0
				});
			}
		});
	});


	////////////////////////////////////////////////////////////////////////////////
	// HOMES
	// Show/Hide all home locations 
	var show_homes = false;
	var home_marker = [];
	google.maps.event.addDomListener(document.getElementById('show-all-homes'), 'click', function() {
		$("#show-all-homes").button('toggle');

		if(show_homes == false) {
			$.ajax({
				url: JSON_URL + 'user_home_all.json',
				type: 'GET',
				dataType: 'json',
				error: function(data) {
					console.log('Error! All homes json');
					console.log(data);
				},
				success: function(data) {
					var count = 0;
					$.each(data, function(id, latlng) {	
						home_marker.push(new google.maps.Marker({
			      	position: new google.maps.LatLng(latlng[0], latlng[1]),
			     	 	map: map,
			    	  title: 'user_id: ' + id,
			    	  icon : '../img/black_house_5px.png',
			 			}));
			 			count += 1;
					});
					console.log('Number of users : ' + count);
				}
			});
			show_homes = true;
		}
		else {
			$.each(home_marker, function(id, marker) {
				home_marker[id].setMap(null);
			});
			home_marker = [];
			show_homes = false;
		}
	});


	////////////////////////////////////////////////////////////////////////////////
	// HOUSEKEEPING
	// Download all territories as JSON file
	google.maps.event.addDomListener(document.getElementById('dl-hood-all'), 'click', function() {
		var all_loc = []
		$.each(raw_hood_data, function(r_id, regions) {
			console.log(r_id);
			$.each(regions, function(i, hood) {
				temp_obj = {};
				temp_obj['id'] = hood['id'];
				temp_obj['name'] = hood['properties']['name'];
				temp_obj['region'] = r_id;
				temp_obj['polygon'] = [];
				var pol = null;
				if(hood['geometry']['coordinates'].length > 1 && hood['geometry']['coordinates'][1][0].length > hood['geometry']['coordinates'][0][0].length) {
					pol = hood['geometry']['coordinates'][1][0];
				}
				else {
					pol = hood['geometry']['coordinates'][0][0]
				}
				$.each(pol, function(i, latlng) {
					temp_obj['polygon'].push([latlng[1], latlng[0]])
				});
				
				all_loc.push(temp_obj);
			});
		});
		json = JSON.stringify(all_loc);
		window.open("data:text/json;charset=utf-8," + json);
	});

	// Download Selected territories as JSON file
	google.maps.event.addDomListener(document.getElementById('dl-hood-select'), 'click', function() {
		var json = [];
		$.each(show_status, function(h_id, status) {
			if(status == true) {
				temp_obj = {};
				temp_obj['id'] = h_id;
				temp_obj['name'] = loc_data[h_id]['name'];
				temp_obj['polygon'] = loc_data[h_id]['polygon'];
				json.push(temp_obj);
			}
		});
		json = JSON.stringify(json);
		window.open("data:text/json;charset=utf-8," + json);
	});


	// Download Selected territory IDs as JSON file
	google.maps.event.addDomListener(document.getElementById('dl-hood-id-select'), 'click', function() {
		var json = [];
		$.each(show_status, function(h_id, status) {
			if(status == true) {
				json.push(h_id);
			}
		});
		json = JSON.stringify(json);
		window.open("data:text/json;charset=utf-8," + json);
	});


	// Calculate convex hull of selected nhoods
	var hull_pol = null;
	google.maps.event.addDomListener(document.getElementById('convex-hull'), 'click', function() {
		if(hull_pol != null) {
			hull_pol.setMap(null);
			hull_pol = null;
		}

		var points = [];
		var hullPoints = [];
		var hullPoints_size;

		// Add points to the array
		$.each(show_status, function(h_id, status) {
			if(status == true) {
				$.each(loc_data[h_id]['polygon'], function(i, latlng) {
					points.push(new google.maps.LatLng(latlng[0], latlng[1]));
				});
			}
		});
		// Sort the points by X, then by Y (required by the algorithm)
		points.sort(sortPointY);
		points.sort(sortPointX);

		// Calculate the convex hull
		chainHull_2D(points, points.length, hullPoints);

		hull_pol = new google.maps.Polygon({
	    paths: hullPoints,
	    strokeColor: 'blue',
      strokeOpacity: 12,
      strokeWeight: 1.5,
      fillOpacity: 0,
      zIndex: 10
	  });
	  hull_pol.setMap(map);
	});

	// Clear convex hull of selected nhoods
	google.maps.event.addDomListener(document.getElementById('clear-hull'), 'click', function() {
		if(hull_pol != null) {
			hull_pol.setMap(null);
			hull_pol = null;
		}
	});


	// Draw polygon
	var draw_pol = null;
	var drawing_manager = new google.maps.drawing.DrawingManager({
		drawingMode : null, // No initial drawing mode
		drawingControl : false, // Do not display drawing controls
		drawingControlOptions : {
			drawingModes : [google.maps.drawing.OverlayType.POLYLINE, google.maps.drawing.OverlayType.POLYGON]
		},
		drawingMode : null,
		map : map,
	});
	google.maps.event.addDomListener(document.getElementById('draw-polygon'), 'click', function() {
		$('#draw-polygon').button('toggle');

		if(drawing_manager.getDrawingMode() == null) {
			drawing_manager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
		}
		else {
			drawing_manager.setDrawingMode(null);
			draw_pol.setMap(null);
			draw_pol = null;
		}
	});
	google.maps.event.addListener(drawing_manager, 'polygoncomplete', function(polygon) {
		draw_pol = polygon;
	});

	// Download drawn polygon
	google.maps.event.addDomListener(document.getElementById('dl-polygon'), 'click', function() {
		points = [];
		draw_pol.getPath().forEach(function(latlng) {
			points.push([latlng.lat(), latlng.lng()]);
		});
		points[points.length] = points[0];

		json = JSON.stringify(points);
		window.open("data:text/json;charset=utf-8," + json);
	});	

	// Place marker on map
	var place_marker = false;
	var click_markers = [];
	google.maps.event.addDomListener(document.getElementById('place-marker'), 'click', function() {
		$('#place-marker').button('toggle');
		
		if(place_marker == false) {
			google.maps.event.addListener(map, 'click', function(e) {
			    var position = e.latLng;
			    click_markers.push(new google.maps.Marker({ position: position, map: map }));
			    console.log('(' + position.lng() + ', ' + position.lat() + ')')
				});
			place_marker = true;
		}
		else {
			$.each(click_markers, function(i, marker) {
				click_markers[i].setMap(null);
			});
			click_markers = [];
			place_marker = false;
		}
	});


});

