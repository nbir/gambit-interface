/* GAMBIT Interface
*
* Copyright (C) USC Information Sciences Institute
* Author: Nibir Bora <nbora@usc.edu>
* URL: <http://cbg.isi.edu/>
* For license information, see LICENSE
*/

$(function() {
	var light_map_style = [{
    "stylers": [
      { "saturation": -74 },
      { "gamma": 0.9 },
      { "weight": 0.3 },
      { "hue": "#00aaff" }
    ]
  }, {
	    featureType: "all",
	    elementType: "labels",
	    stylers: [{
	        visibility: "off"
	      }
	    ]
	  }, {
	    featureType: "road",
	    stylers: [{
	        visibility: "off"
	      }
	    ]
	  }
	];

	var light_map_road_style = [{
    "stylers": [
      { "saturation": -74 },
      //{ "lightness": 25 },
      { "gamma": 0.9 },
      { "weight": 0.3 },
      { "hue": "#00aaff" }
    ]
  }, {
	    featureType: "all",
	    elementType: "labels",
	    stylers: [{
	        visibility: "off"
	      }
	    ]
	  }
	];

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

	/*
	bbox = [new google.maps.LatLng(34.29, -118.64),
					new google.maps.LatLng(34.29, -117.09),
					new google.maps.LatLng(33.5, -117.09),
					new google.maps.LatLng(33.5, -118.64)];

	bbox_pol = new google.maps.Polygon({
    paths: bbox,
    strokeColor: '#ffffff',
    strokeOpacity: 1,
    strokeWeight: 1,
    fillOpacity: 0,
    map: map
  });
	*/

////////////////////////////////////////////////////////////////////////////////

	// Show hide roads on map
	var show_roads = true;
	$("#show-roads").button('toggle');

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
	
	//--- API urls
	var JSON_URL = "data/";
	//-----

	var tool = 'lines';
	init_DispLines();

	google.maps.event.addDomListener(document.getElementById('tool-disp-lines'), 'click', function() {
		if (tool != 'lines') {
			kill_DispPoints();
			kill_DispScatter();

			init_DispLines();
			tool = 'lines';
		}
	});


	google.maps.event.addDomListener(document.getElementById('tool-disp-points'), 'click', function() {
		if (tool != 'points') {
			kill_DispLines();
			kill_DispScatter();

			init_DispPoints();
			tool = 'points';
		}
	});

	google.maps.event.addDomListener(document.getElementById('tool-disp-scatter'), 'click', function() {
		if (tool != 'scatter') {
			kill_DispLines();
			kill_DispPoints();

			init_DispScatter();
			tool = 'scatter';
		}
	});


////////////////////////////////////////////////////////////////////////////////
// DISPLACEMENT SCATTER

	var region_names = ['hbk', 'south-la', 'west-la', 'south-bay', 'pomona', 'bernardino', 'riverside']
	var homes = {};
	var points = {};
	var marker_imgs = ['sq_blue_1px.png', 'sq_brown_1px.png', 'sq_orange_1px.png', 'sq_purple_1px.png', 'sq_gray_1px.png', 'sq_green_1px.png', 'sq_red_1px.png']
	var marker = {};
	var show_status = {}

	// INIT call
	//init_DispScatter();

	function init_DispScatter() {
		$.each(region_names, function(i, region) {
			homes[region] = [];
			points[region] = [];
			marker[region] = marker_imgs.pop();

			show_status[region] = false;
		});

		$("#disp-scatter").show();

		google.maps.event.addDomListener(document.getElementById('show-hbk'), 'change', function() { toggleRegion('hbk'); });
		google.maps.event.addDomListener(document.getElementById('show-south-la'), 'change', function() { toggleRegion('south-la'); });
		google.maps.event.addDomListener(document.getElementById('show-west-la'), 'change', function() { toggleRegion('west-la'); });
		google.maps.event.addDomListener(document.getElementById('show-south-bay'), 'change', function() { toggleRegion('south-bay'); });

		google.maps.event.addDomListener(document.getElementById('show-pomona'), 'change', function() { toggleRegion('pomona'); });
		google.maps.event.addDomListener(document.getElementById('show-bernardino'), 'change', function() { toggleRegion('bernardino'); });
		google.maps.event.addDomListener(document.getElementById('show-riverside'), 'change', function() { toggleRegion('riverside'); });
	}

	function kill_DispScatter() {
		$.each(show_status, function(region, status) {
			if (show_status[region] == true) {
				$.each(points[region], function(i, latlng) {
					points[region][i].setMap(null);
				});
				$.each(homes[region], function(i, latlng) {
					homes[region][i].setMap(null);
				});
				points[region] = [];
				homes[region] = [];

				show_status[region] = false;
			}
		});
		homes = {};
		points = {};

		google.maps.event.clearInstanceListeners(document.getElementById('show-hbk'));
		google.maps.event.clearInstanceListeners(document.getElementById('show-south-la'));
		google.maps.event.clearInstanceListeners(document.getElementById('show-west-la'));
		google.maps.event.clearInstanceListeners(document.getElementById('show-south-bay'));

		google.maps.event.clearInstanceListeners(document.getElementById('show-pomona'));
		google.maps.event.clearInstanceListeners(document.getElementById('show-bernardino'));
		google.maps.event.clearInstanceListeners(document.getElementById('show-riverside'));

		$("#disp-scatter").hide();
	}

	function toggleRegion(region) {
		console.log(region);

		if (show_status[region] == false) {
			loadHomes(region);
		}
		else {
			$.each(points[region], function(i, latlng) {
				points[region][i].setMap(null);
			});
			$.each(homes[region], function(i, latlng) {
				homes[region][i].setMap(null);
			});
			points[region] = [];
			homes[region] = [];

			show_status[region] = false;
		}
	}

	function loadHomes(region) {
		$.ajax({
			url: JSON_URL + region + '/' + 'homes.json',
			type: 'GET',
			dataType: 'json',
			error: function(data) {
				console.log('Error! homes.json');
				console.log(data);
			},
			success: function(data) {
				$.each(data, function(i, latlng) {	
					homes[region].push(new google.maps.Marker({
		      	position: new google.maps.LatLng(latlng[0], latlng[1]),
		     	 	//map: map,
		    	  icon : '../img/black_house_5px.png',
		 			}));
				});

				loadPoints(region);
			}
		});
	}

	function loadPoints(region) {
		$.ajax({
			url: JSON_URL + region + '/' + 'points.json',
			type: 'GET',
			dataType: 'json',
			error: function(data) {
				console.log('Error! points.json');
				console.log(data);
			},
			success: function(data) {
				$.each(data, function(i, latlng) {	
					points[region].push(new google.maps.Marker({
		      	position: new google.maps.LatLng(latlng[0], latlng[1]),
		     	 	map: map,
		    	  //icon : '../img/black_house_5px.png',
		    	  icon : '../img/' + marker[region],
		 			}));
				});

				//$('#loading').hide();
				show_status[region] = true;
			}
		});
	}


////////////////////////////////////////////////////////////////////////////////
// DISPLACEMENT LINES

	var region = null;
	var visit_mat_file = 'visit_matrix';
	var loc_data = {};
	var visit_matrix = {};

	var hood_pols = {};
	var hood_labels = {};
	var hood_circles = {};
	var hood_show = {};
	var visit_lines = {};
	var hold_for = {};

	function init_DispLines() {
		$("#disp-lines").show();

		google.maps.event.addDomListener(document.getElementById('select-region-south-la'), 'click', function() { selectRegion('south-la'); });
		google.maps.event.addDomListener(document.getElementById('select-region-west-la'), 'click', function() { selectRegion('west-la'); });
		google.maps.event.addDomListener(document.getElementById('select-region-south-bay'), 'click', function() { selectRegion('south-bay'); });
		google.maps.event.addDomListener(document.getElementById('select-region-hbk'), 'click', function() { selectRegion('hbk'); });

		google.maps.event.addDomListener(document.getElementById('show-all-button'), 'click', function() {
			$.each(visit_matrix, function(h_id, v) {
				hold_for[h_id] = true;
				showVisitLines(h_id);
			});
		});
		google.maps.event.addDomListener(document.getElementById('clear-button'), 'click', function() {
			$.each(visit_matrix, function(h_id, v) {
				hold_for[h_id] = false;
				hideVisitLine(h_id);
			});
		});

		google.maps.event.addDomListener(document.getElementById('visit-mat-1'), 'click', function() {
			visit_mat_file = 'visit_matrix';
			reloadVisitMat();
		});
		google.maps.event.addDomListener(document.getElementById('visit-mat-2'), 'click', function() {
			visit_mat_file = 'visit_matrix__norm';
			reloadVisitMat();
		});
		google.maps.event.addDomListener(document.getElementById('visitor-mat-1'), 'click', function() {
			visit_mat_file = 'visitor_matrix';
			reloadVisitMat();
		});
	}

	function kill_DispLines() {
		clearRegion();
		loc_data = {};
		visit_matrix = {};

		google.maps.event.clearInstanceListeners(document.getElementById('select-region-south-la'));
		google.maps.event.clearInstanceListeners(document.getElementById('select-region-west-la'));
		google.maps.event.clearInstanceListeners(document.getElementById('select-region-south-bay'));
		google.maps.event.clearInstanceListeners(document.getElementById('select-region-hbk'));
		
		google.maps.event.clearInstanceListeners(document.getElementById('show-all-button'));
		google.maps.event.clearInstanceListeners(document.getElementById('clear-button'));
		google.maps.event.clearInstanceListeners(document.getElementById('visit-mat-1'));
		google.maps.event.clearInstanceListeners(document.getElementById('visit-mat-2'));
		google.maps.event.clearInstanceListeners(document.getElementById('visitor-mat-1'));

		$("#disp-lines").hide();

		map.setZoom(10);
	}

	function selectRegion(name) {
		console.log('SELECT: ' + name);
		clearRegion();

		region = name;
		loc_data = {};
		visit_matrix = {};
		nhood_points = {};

		loadLocPols(name);
	}

	// Clear any active region
	function clearRegion() {
		// Disp lines specific
		$.each(visit_matrix, function(h_id, v) {
			hold_for[h_id] = false;
			hideVisitLine(h_id);
			hood_circles[h_id].setMap(null);
		});

		// Disp points specific
		$.each(nhood_points, function(h_id, v) {
			hold_for[h_id] = false;
			hideNhoodPoints(h_id);
		});

		// Generic
		$.each(hood_pols, function(h_id, v) {
			hood_pols[h_id].setMap(null);
			hood_labels[h_id].setMap(null);
		});

		hood_pols = {};
		hood_labels = {};
		hood_circles = {};

		visit_lines = {};
		hood_show = {};
		hold_for = {};
	}

	// Load location data (polygon info)
	function loadLocPols() {
		$.ajax({
			url: JSON_URL + region + '/' + 'loc_data.json',
			type: 'GET',
			dataType: 'json',
			error: function(data) {
				console.log('Error! loc_data.json');
				console.log(data)
			},
			success: function(data) {
				$.each(data, function(i, location) {
					loc_data[location.id] = location;
					loc_data[location.id]['name']=loc_data[location.id]['name'].replace('HBK_', '').replace('_HBK', '').replace('.kml', '').replace('_', ' ');
					loc_data[location.id]['centroid'] = _calcCentroid(location.polygon);
					lat = loc_data[location.id]['centroid'][0];
					lng = loc_data[location.id]['centroid'][1];
					d_lat = 0.00025;
					d_lng = 0.0003;
					loc_data[location.id]['in_point'] = [lat+d_lat, lng-d_lng];
					loc_data[location.id]['out_point'] = [lat-d_lat, lng+d_lng];
				});
				//console.log(loc_data);
				console.log('Done loading loc_data.');

				if (tool == 'lines') {
					loadVisitMat();
				}
				else if (tool == 'points') {
					loadNhoodPoints();
				}
			}
		});
	}
	// Calculate centroid of a polygon
	function _calcCentroid(polygon) {
		centroid = [0.0, 0.0];
		$.each(polygon, function(i, latlng) {
			centroid[0] += latlng[0];
			centroid[1] += latlng[1];
		});
		centroid[0] /= polygon.length;
		centroid[1] /= polygon.length;

		return centroid;
	}

	// Load visit matrix
	function loadVisitMat() {
		$.ajax({
			url: JSON_URL + region + '/' + visit_mat_file + '.json',
			type: 'GET',
			dataType: 'json',
			error: function(data) {
				console.log('Error! Loading visit_matrix.json');
				console.log(data)
			},
			success: function(data) {
				visit_matrix = data;
				//console.log(visit_matrix);
				console.log('Done loading visit_matrix.')
				plotNhoodPols();
			}
		});
	}


	// Plot each nhood's polygon
	function plotNhoodPols() {
		var region_bounds = new google.maps.LatLngBounds();

		$.each(loc_data, function(h_id, loc) {
			gt_points=[];
			$.each(loc.polygon, function(i, latlng) {
				gt_points.push(new google.maps.LatLng(latlng[0], latlng[1]));
				region_bounds.extend(new google.maps.LatLng(latlng[0], latlng[1]));
			});
			gt_points.pop();

			hood_pols[h_id] = new google.maps.Polygon({
		    paths: gt_points,
		    strokeColor: "#555555",
        strokeOpacity: 1,
        strokeWeight: 1.5,
        fillOpacity: 0,
        zIndex: 5
		  });
		  hood_pols[h_id].setMap(map);

		  // Assigne hood labels
		  hood_labels[h_id] = new MapLabel({
        text: loc.name,
        position: new google.maps.LatLng(loc.centroid[0], loc.centroid[1]),
        map: map,
        fontSize: 11,
        align: 'center'
      });

		  if (tool == 'points') {
	      // Add events
		    google.maps.event.addListener(hood_pols[h_id], 'click', function() {
		    	toggleNhoodPoints(h_id);
		    });
		    google.maps.event.addListener(hood_pols[h_id], 'mouseover', function() {
		    	hilightPol(h_id);
		    });
		    google.maps.event.addListener(hood_pols[h_id], 'mouseout', function() {
		    	unhilightPol(h_id);
		    });
		  }
		});

		map.fitBounds(region_bounds);

		if (tool == 'lines') {
			plotNhoodCircles();
		}
		initializeShowStatus();
		initializeHoldStatus();
	}

	// Plot each nhood's home circle
	function plotNhoodCircles() {
		$.each(loc_data, function(h_id, loc) {
			var count = 0
			$.each(visit_matrix[h_id], function(i, v) { count += v});
    	hood_circles[h_id] = new google.maps.Circle({
        strokeColor: "#A65628",
        strokeOpacity: 0.75,
        strokeWeight: 1,
        fillColor: "#A65628",
        fillOpacity: 0.25,
        map: map,
        center: new google.maps.LatLng(loc.centroid[0], loc.centroid[1]),
        radius: Math.log(count)*75,
        zIndex: 20
      });
   		//A65628,4DAF4A,FF7F00,984EA3,E41A1C

      // Add events
      google.maps.event.addListener(hood_circles[h_id], 'click', function() {
      	toggleVisitLines(h_id);
      });
      google.maps.event.addListener(hood_circles[h_id], 'mouseover', function() {
      	showVisitLines(h_id);
      });
      google.maps.event.addListener(hood_circles[h_id], 'mouseout', function() {
      	hideVisitLine(h_id);
      });
		});
	}

	// Initialize visitation shoe status
	function initializeShowStatus() {
		$.each(hood_pols, function(h_id, v) {
			hood_show[h_id] = false;
		});
	}
	function initializeHoldStatus() {
		$.each(hood_pols, function(h_id, v) {
			hold_for[h_id] = false;
		});
	}

	function toggleVisitLines(h_id) {
		//console.log('TOGGLE: ' + loc_data[h_id].name);
		if(hood_show[h_id] == true && hold_for[h_id] == true) {
			hold_for[h_id] = false;
			hideVisitLine(h_id);
		}
		else if(hood_show[h_id] == true && hold_for[h_id] == false) {
			hold_for[h_id] = true;
		}
		else if(hood_show[h_id] == false && hold_for[h_id] == false) {
			hold_for[h_id] = true;
			showVisitLines(h_id);
		}
	}

	function showVisitLines(h_id) {
		if(hood_show[h_id] == false) {
			//console.log('SHOW: ' + loc_data[h_id].name);
			hood_show[h_id] = true;
			hood_pols[h_id].setOptions({
				fillColor: "#555555",
				fillOpacity: 0.25
			});

			var from = new google.maps.LatLng(loc_data[h_id]['out_point'][0], loc_data[h_id]['out_point'][1]);
			visit_lines[h_id] = {};
			$.each(visit_matrix[h_id], function(to_id, visits) {
				if (visits != 0) {
					var to = new google.maps.LatLng(loc_data[to_id]['in_point'][0], loc_data[to_id]['in_point'][1]);
					visits = visits == 1 ? visits + 1 : visits;
					var line = [from, to];

					visit_lines[h_id][to_id] = new google.maps.Polyline({
	          path: line,
	          strokeColor: "#984EA3",
	          strokeOpacity: 0.65,
	          strokeWeight: Math.log(visits)*1.25,
	          zIndex: 11,
	          map: map
	        });
				}
			});
		}
	}
  //A65628,4DAF4A,FF7F00,984EA3,E41A1C


	function hideVisitLine(h_id) {
		if(hood_show[h_id] == true && hold_for[h_id] == false) {
			//console.log('HIDE: ' + loc_data[h_id].name);
			hood_show[h_id] = false;
			hood_pols[h_id].setOptions({
				fillColor: null,
				fillOpacity: 0
			});

			$.each(visit_lines[h_id], function(rival_id) {
				visit_lines[h_id][rival_id].setMap(null);
			})
			delete visit_lines[h_id];
		}
	}

	function reloadVisitMat() {
		$.ajax({
			url: JSON_URL + region + '/' + visit_mat_file + '.json',
			type: 'GET',
			dataType: 'json',
			error: function(data) {
				console.log('Error! Loading visit_matrix.json');
				console.log(data)
			},
			success: function(data) {
				visit_matrix = data;
				//console.log(visit_matrix);
				console.log('Done loading visit_matrix.')
			}
		});
	}

////////////////////////////////////////////////////////////////////////////////
// DISPLACEMENT POINTS

	var region = null;
	var loc_data = {};
	var nhood_points = {};

	var hood_pols = {};
	var hood_labels = {};
	var hood_show = {};
	var hold_for = {};

	function init_DispPoints() {
		google.maps.event.addDomListener(document.getElementById('select-region-south-la'), 'click', function() { selectRegion('south-la'); });
		google.maps.event.addDomListener(document.getElementById('select-region-west-la'), 'click', function() { selectRegion('west-la'); });
		google.maps.event.addDomListener(document.getElementById('select-region-south-bay'), 'click', function() { selectRegion('south-bay'); });
		google.maps.event.addDomListener(document.getElementById('select-region-hbk'), 'click', function() { selectRegion('hbk'); });

		google.maps.event.addDomListener(document.getElementById('show-all-button'), 'click', function() {
			$.each(nhood_points, function(h_id, v) {
				hold_for[h_id] = true;
				showNhoodPoints(h_id);
			});
		});
		google.maps.event.addDomListener(document.getElementById('clear-button'), 'click', function() {
			$.each(nhood_points, function(h_id, v) {
				hold_for[h_id] = false;
				hideNhoodPoints(h_id);
			});
		});
	}

	function kill_DispPoints() {
		clearRegion();

		google.maps.event.clearInstanceListeners(document.getElementById('select-region-south-la'));
		google.maps.event.clearInstanceListeners(document.getElementById('select-region-west-la'));
		google.maps.event.clearInstanceListeners(document.getElementById('select-region-south-bay'));
		google.maps.event.clearInstanceListeners(document.getElementById('select-region-hbk'));
		
		google.maps.event.clearInstanceListeners(document.getElementById('show-all-button'));
		google.maps.event.clearInstanceListeners(document.getElementById('clear-button'));

		map.setZoom(10);
	}

	function loadNhoodPoints() {
		var marker = {
			'south-la' : 'sq_pink_2px.png',
			'west-la' : 'sq_green_2px.png',
			'south-bay' : 'sq_brown_2px.png',
			'hbk' : 'sq_blue_2px.png',
		}

		$.ajax({
			url: JSON_URL + region + '/' + 'nhood_points.json',
			type: 'GET',
			dataType: 'json',
			error: function(data) {
				console.log('Error! Loading nhood_points.json');
				console.log(data)
			},
			success: function(data) {
				$.each(data, function(h_id, points) {	
					nhood_points[h_id] = [];
					$.each(points, function(i, latlng) {
						nhood_points[h_id].push(new google.maps.Marker({
			      	position: new google.maps.LatLng(latlng[0], latlng[1]),
			    	  icon : '../img/' + 'sq_brown_2px.png',
			    	  //icon : '../img/' + marker[region],
			 			}));
					});
				});

				//console.log(nhood_points);
				console.log('Done loading nhood_points.')
				plotNhoodPols();
			}
		});
	}

	function toggleNhoodPoints(h_id) {
		if(hood_show[h_id] == true && hold_for[h_id] == true) {
			hold_for[h_id] = false;
			hideNhoodPoints(h_id);
		}
		else if(hood_show[h_id] == false && hold_for[h_id] == false) {
			hold_for[h_id] = true;
			showNhoodPoints(h_id);
		}
	}

	function showNhoodPoints(h_id) {
		if(hood_show[h_id] == false) {
			hood_show[h_id] = true;

			$.each(nhood_points[h_id], function(i, latlng) {
				nhood_points[h_id][i].setMap(map);
			});
		}
	}

	function hideNhoodPoints(h_id) {
		if(hood_show[h_id] == true && hold_for[h_id] == false) {
			hood_show[h_id] = false;

			$.each(nhood_points[h_id], function(i, latlng) {
				nhood_points[h_id][i].setMap(null);
			});
		}
	}

	function hilightPol(h_id) {
		if(hood_show[h_id] == false) {
  		hood_pols[h_id].setOptions({
				fillColor: "#555555",
				fillOpacity: 0.25
			});
  	}
	}

	function unhilightPol(h_id) {
		if(hold_for[h_id] == false) {
  		hood_pols[h_id].setOptions({
				fillColor: null,
				fillOpacity: 0
			});
  	}
	}

});

