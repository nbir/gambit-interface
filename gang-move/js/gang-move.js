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
			saturation: -80
		},{
			inverse_lightness: true
		}]},
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
			saturation: -80
		},{
			inverse_lightness: true
		}]},
		{
  	featureType: "all",
  	elementType: "labels",
  	stylers: [
    	{ visibility: "off" }
  	]
	}];

	var mapOptions = {
		disableDefaultUI: true,
		center : new google.maps.LatLng(34.053, -118.2),
		zoom : 13,
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
	var API_V2_LOCATION_LIST = "http://brain.isi.edu:4002/api/v2/location/list";
	//var JSON_URL = 'http://brain.isi.edu/~gambit/v2.0/data/json-gang-move/';
	//var JSON_URL = 'http://nibir/~gambit/gang-move/data/';
	var JSON_URL = "data/";
	//-----
	
	// LOAD functions
	var loc_data = {};
	var rivalry_matrix = {};
	var gang_tweet_locs = {};
	var gang_latlng = {};

	var data_selected = 2;

	loadLocation();		// Call first function
	// Load location data
	function loadLocation() {
		$.ajax({
			//url: API_V2_LOCATION_LIST,
			url: JSON_URL + 'loc_data.json',
			type: 'GET',
			//data: {
				//class: 'dist',
			//},
			dataType: 'json',
			error: function(data) {
				console.log('Error! APIv2 location::list');
				console.log(data)

				//$("#show-button").attr('disabled', false);
			},
			success: function(data) {
				$.each(data, function(i, location) {
					loc_data[location.id] = location;
					loc_data[location.id]['name']=loc_data[location.id]['name'].replace('HBK_', '').replace('_HBK', '').replace('.kml', '').replace('_', ' ');
					lat = loc_data[location.id]['centroid'][0];
					lng = loc_data[location.id]['centroid'][1];
					d_lat = 0.00025;
					d_lng = 0.0003;
					loc_data[location.id]['in_point'] = [lat+d_lat, lng-d_lng];
					loc_data[location.id]['out_point'] = [lat-d_lat, lng+d_lng];
					/*
					var m1 = new google.maps.Marker({
			      position: new google.maps.LatLng(loc_data[location.id]['in_point'][0], loc_data[location.id]['in_point'][1]),
			      map: map
			  	});
					var m2 = new google.maps.Marker({
			      position: new google.maps.LatLng(loc_data[location.id]['out_point'][0], loc_data[location.id]['out_point'][1]),
			      map: map
			  	});
					*/
				});
				delete loc_data[20];
				//console.log(loc_data);
				//$("#show-button").attr('disabled', false);
				console.log('Done loading loc_data.')
				loadRivalryMat();
			}
		});
	}

	// Load Rivalry matrix
	function loadRivalryMat() {
		$.ajax({
			url: JSON_URL + 'rivalry_matrix.json',
			type: 'GET',
			dataType: 'json',
			error: function(data) {
				console.log('Error! Loading rivalry_matrix.json');
				console.log(data)
			},
			success: function(data) {
				rivalry_matrix = data;
				//console.log(rivalry_matrix);
				console.log('Done loading rivalry_matrix.')
				loadGangTweetLocs();
			}
		});
	}

	// Load Gang Tweet locations
	function loadGangTweetLocs() {
		$.ajax({
			url: JSON_URL + 'gang_tweet_locs2.json',
			type: 'GET',
			dataType: 'json',
			error: function(data) {
				console.log('Error! Loading gang_tweet_locs.json');
				console.log(data)
			},
			success: function(data) {
				$.each(data, function(gang_id, locs) {
					gang_latlng[gang_id] = [];
					$.each(locs, function(i, latlng) {
						gang_latlng[gang_id].push(new google.maps.LatLng(latlng[0], latlng[1]));
					});
					//console.log(gang_latlng[gang_id].length);
	 			});
				//console.log(gang_latlng);
				console.log('Done loading gang_tweet_locs.')
				$("#load-data-2").button('toggle');
				start();
			}
		});
	}
	//-----


	// PLOT functions
	var show_roads = true;
	var gang_pols = {};
	var gang_labels = {};
	
	var show_status = {};
	var show_type = null;

	// Start plotting data
	function start() {
		$("#show-roads").button('toggle');

		initializeShowStatus();
		show_type = 'marker';
		$("#view-marker").button('toggle');

		plotGangPols();
	}

	// Initialize visitation show status
	function initializeShowStatus() {
		for(var gang_id=23; gang_id<=54; gang_id+=1) {
			show_status[gang_id] = false;
		}
	}

	// Plot each gang's polygon
	function plotGangPols() {
		$.each(loc_data, function(gang_id, loc) {
			gt_points=[];
			$.each(loc.polygon, function(i, latlng) {
				gt_points.push(new google.maps.LatLng(latlng[0], latlng[1]));
			});
			gt_points.pop();

			gang_pols[gang_id] = new google.maps.Polygon({
		    paths: gt_points,
		    strokeColor: "#555555",
        strokeOpacity: 1,
        strokeWeight: 1.5,
        fillOpacity: 0,
        zIndex: 10
		  });
		  gang_pols[gang_id].setMap(map);

		  // Assigne gang labels
		  gang_labels[gang_id] = new MapLabel({
        text: loc.name,
        position: new google.maps.LatLng(loc.centroid[0], loc.centroid[1]),
        map: map,
        fontSize: 11,
        align: 'center'
      });

      // Add events
      google.maps.event.addListener(gang_pols[gang_id], 'click', function() {
      	if(show_type == 'heatmap') {
      		toggleHeatmapFor(gang_id);
      	}
      	else if(show_type == 'marker') {
      		toggleMarkerFor(gang_id);
      	}
      });
      google.maps.event.addListener(gang_pols[gang_id], 'mouseover', function() {
      	if(show_status[gang_id] == false) {
      		gang_pols[gang_id].setOptions({
						fillColor: "#555555",
						fillOpacity: 0.25
					});
      	}
      });
      google.maps.event.addListener(gang_pols[gang_id], 'mouseout', function() {
      	if(show_status[gang_id] == false) {
      		gang_pols[gang_id].setOptions({
						fillColor: null,
						fillOpacity: 0
					});
      	}
      });
		});
	}

	var gang_markers = {};
	// Toggle show/hide marker for gang_id
	function toggleMarkerFor(gang_id) {
		if(show_status[gang_id] == false) {
			if(gang_latlng[gang_id].length > 0) {
				show_status[gang_id] = 'marker';
				mark_rivals(gang_id);

				gang_markers[gang_id] = [];
				$.each(gang_latlng[gang_id], function(i, latlng) {
	 				gang_markers[gang_id].push(new google.maps.Marker({
						position : latlng,
						map : map,
						icon : '../img/blue-point.png',
        		zIndex: 5
					}));
	 			});
			}
		}
		else {	// clear
			$.each(gang_markers[gang_id], function(i, latlng) {
				latlng.setMap(null);
			});
			gang_markers[gang_id] = [];

			unmark_rivals(gang_id);
			show_status[gang_id] = false;
		}
	}

	var gang_heatmap = {};
	// Toggle show/hide heatmap for gang_id
	function toggleHeatmapFor(gang_id) {
		if(show_status[gang_id] == false) {
			if(gang_latlng[gang_id].length > 0) {
				show_status[gang_id] = 'heatmap';
				mark_rivals(gang_id);

				gang_heatmap[gang_id] = new google.maps.visualization.HeatmapLayer({
			  	data: gang_latlng[gang_id],
			  	radius: 20,
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
						'rgba(255, 0, 0, 1)'
					],
			  	map: map
				});
			}
		}
		else {	// clear
			gang_heatmap[gang_id].setMap(null);
			gang_heatmap[gang_id] = [];

			unmark_rivals(gang_id);
			show_status[gang_id] = false;
		}
	}

	// Mark the rival territories of gang_id in red
	function mark_rivals(gang_id) {
		gang_pols[gang_id].setOptions({
			strokeColor: "#377EB8",
			fillColor: "#377EB8",
			fillOpacity: 0.15
		});

		$.each(rivalry_matrix[gang_id]['rival'], function(i, rival_id) {
			gang_pols[rival_id].setOptions({
				strokeColor: "#E41A1C",
				strokeOpacity: 0.65,
				fillColor: "#E41A1C",
				fillOpacity: 0.15
			});
		});
	}

	// Unark the rival territories of gang_id in red
	function unmark_rivals(gang_id) {
		gang_pols[gang_id].setOptions({
			strokeColor: "#555555",
			fillColor: null,
			fillOpacity: 0
		});

		$.each(rivalry_matrix[gang_id]['rival'], function(i, rival_id) {
			gang_pols[rival_id].setOptions({
				strokeColor: "#555555",
				strokeOpacity: 1,
				fillColor: null,
				fillOpacity: 0
			});
		});
	}


	// BUTTON events
	// Switch to marker view
	google.maps.event.addDomListener(document.getElementById('view-marker'), 'click', function() {
		if(show_type == 'heatmap') {
			$("#view-heatmap").button('toggle');
			$("#view-marker").button('toggle');
			show_type = 'marker';

			$.each(show_status, function(gang_id, val) {
				if(show_status[gang_id] == 'heatmap') {
					toggleHeatmapFor(gang_id);
					toggleMarkerFor(gang_id);
				}
			});

			if(show_counts == true) {
				clearCounts();
			}			
		}
	});

	// Switch to heatmap view
	google.maps.event.addDomListener(document.getElementById('view-heatmap'), 'click', function() {
		if(show_type == 'marker') {
			$("#view-marker").button('toggle');
			$("#view-heatmap").button('toggle');
			show_type = 'heatmap';

			$.each(show_status, function(gang_id, val) {
				if(show_status[gang_id] == 'marker') {
					toggleMarkerFor(gang_id);
					toggleHeatmapFor(gang_id);
				}
			});
		}
	});

	// Show all gang data
	google.maps.event.addDomListener(document.getElementById('show-all-button'), 'click', function() {
		$.each(show_status, function(gang_id, val) {
			if(show_status[gang_id] == false) {
				if(show_type == 'marker') {
					toggleMarkerFor(gang_id);
				}
				else if(show_type = 'heatmap') {
					toggleHeatmapFor(gang_id);
				}
			}
		})
	});

	// Clear all gang data
	google.maps.event.addDomListener(document.getElementById('clear-button'), 'click', clear_map);
	function clear_map() {
		$.each(show_status, function(gang_id, val) {
			if(show_status[gang_id]) {
				if(show_type == 'marker') {
					toggleMarkerFor(gang_id);
				}
				else if(show_type = 'heatmap') {
					toggleHeatmapFor(gang_id);
				}
			}
		})
		if(show_counts == true) {
			clearCounts();
		}
	}

	// Show hide roads on map
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


	// Toggle show/hide counts for active gang_ids
	var show_counts = false;
	google.maps.event.addDomListener(document.getElementById('show-counts'), 'click', function() {
		if(show_counts == false) {
			updateCounts();
		}
		else {
			clearCounts();
		}
	});
	
	var marker_cluster_markers = [];
	var marker_cluster = null;

	// update counts for active gang_ids and display
	function updateCounts() {
		if(show_type == 'heatmap') {
			show_counts = true;
			$("#show-counts").button('toggle');

			$.each(show_status, function(gang_id, val) {
				if(show_status[gang_id] != false) {
					$.each(gang_latlng[gang_id], function(i, latlng) {
		 				marker_cluster_markers.push(new google.maps.Marker({
							position : latlng,
							visible: true
						}));
		 			});
				}
			});

 			marker_cluster = new MarkerClusterer(map, marker_cluster_markers, {
				averageCenter: true,
				zoomOnClick: false,
				minimumClusterSize: 1,
			});
		}
	}
	// CLear counts from map
	function clearCounts() {
		marker_cluster.clearMarkers();
		marker_cluster = null;
		marker_cluster_markers = [];

		show_counts = false;
		$("#show-counts").button('toggle');
	}


	// LOAD DIFFERENT DATASETS - *** -
	google.maps.event.addDomListener(document.getElementById('load-data-1'), 'click', function() {
		if(data_selected == 2) {
			$("#load-data-2").button('toggle');
		}
		if(data_selected != 1) {
			clear_map();
			$.ajax({
				url: JSON_URL + 'gang_tweet_locs1.json',
				type: 'GET',
				dataType: 'json',
				error: function(data) {
					console.log('Error! Loading gang_tweet_locs.json');
					console.log(data)
				},
				success: function(data) {
					$.each(data, function(gang_id, locs) {
						gang_latlng[gang_id] = [];
						$.each(locs, function(i, latlng) {
							gang_latlng[gang_id].push(new google.maps.LatLng(latlng[0], latlng[1]));
						});
		 			});
					console.log('Done loading gang_tweet_locs.')
				}
			});
			data_selected = 1;
			$("#load-data-1").button('toggle');
		}
	});

	google.maps.event.addDomListener(document.getElementById('load-data-2'), 'click', function() {
		if(data_selected == 1) {
			$("#load-data-1").button('toggle');
		}
		if(data_selected != 2) {
			clear_map();
			$.ajax({
				url: JSON_URL + 'gang_tweet_locs2.json',
				type: 'GET',
				dataType: 'json',
				error: function(data) {
					console.log('Error! Loading gang_tweet_locs.json');
					console.log(data)
				},
				success: function(data) {
					$.each(data, function(gang_id, locs) {
						gang_latlng[gang_id] = [];
						$.each(locs, function(i, latlng) {
							gang_latlng[gang_id].push(new google.maps.LatLng(latlng[0], latlng[1]));
						});
		 			});
					console.log('Done loading gang_tweet_locs.')
				}
			});
			data_selected = 2;
			$("#load-data-2").button('toggle');
		}
	});



	// *** AUXILLARY FUNCTIONS ***
	// Show/hide border lines
	show_border_lines = false;
	border_lines = [];
	google.maps.event.addDomListener(document.getElementById('show-border-lines'), 'click', function() {
		$("#show-border-lines").button('toggle');

		if(show_border_lines == false) {
			$.ajax({
				url: JSON_URL + 'border_lines.json',
				type: 'GET',
				dataType: 'json',
				error: function(data) {
					console.log('Error! Loading border_lines.json');
					console.log(data)
				},
				success: function(data) {
					$.each(data, function(i, line) {
						line_coord = [new google.maps.LatLng(line[0][0], line[0][1]), new google.maps.LatLng(line[1][0], line[1][1])]
						border_lines.push(new google.maps.Polyline({
					    path: line_coord,
					    strokeColor: "#000000",
					    strokeOpacity: 1.0,
					    strokeWeight: 3,
					    map: map
					  }));
		 			});
					show_border_lines = true;
				}
			});
		}
		else {
			$.each(border_lines, function(i, line) {
				line.setMap(null);
			});
			border_lines = [];
			show_border_lines = false;
		}
	});

	// Show/hide border points
	show_border_points = false;
	border_points = [];
	google.maps.event.addDomListener(document.getElementById('show-border-points'), 'click', function() {
		$("#show-border-points").button('toggle');

		if(show_border_points == false) {
			$.ajax({
				url: JSON_URL + 'border_points.json',
				type: 'GET',
				dataType: 'json',
				error: function(data) {
					console.log('Error! Loading border_points.json');
					console.log(data)
				},
				success: function(data) {
					$.each(data, function(i, latlng) {
		 				border_points.push(new google.maps.Marker({
							position : new google.maps.LatLng(latlng[0], latlng[1]),
							map : map,
							icon : '../img/red-point.png',
	        		zIndex: 5
						}));
		 			});

					show_border_points = true;
				}
			});
		}
		else {
			$.each(border_points, function(i, point) {
				point.setMap(null);
			});
			border_points = [];
			show_border_points = false;
		}
	});
	// *** ***
});

