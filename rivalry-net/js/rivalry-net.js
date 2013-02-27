/* GAMBIT Interface
*
* Copyright (C) USC Information Sciences Institute
* Author: Nibir Bora <nbora@usc.edu>
* URL: <http://cbg.isi.edu/>
* For license information, see LICENSE
*/

$(function() {
	// Uber blog map styles
	// http://blog.uber.com/2012/01/09/uberdata-san-franciscomics/
	var uberStyle = [
		{
			featureType: "all",
			stylers: [{
				saturation: -80
			},
			{
				inverse_lightness: true
			}]
		},
		{
    	featureType: "all",
    	elementType: "labels",
    	stylers: [
      	{ visibility: "off" }
    	]
  	},
		{
			featureType: "road",
			stylers: [{
				visibility: "off"
			}]
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
	var uberMapType = new google.maps.StyledMapType(uberStyle);
	map.mapTypes.set('uber_map', uberMapType);
	map.setMapTypeId('uber_map');
	

	//--- API urls
	var API_V2_LOCATION_LIST = "http://brain.isi.edu:4002/api/v2/location/list";
	//var JSON_URL = 'http://brain.isi.edu/~gambit/v2.0/data/json-gang-move/';
	//var JSON_URL = 'http://nibir/~gambit/gang-move/data/';
	var JSON_URL = "data/";
	//-----

	// LOAD functions
	var loc_data = {};
	var rivalry_matrix = {};
	var gang_tweet_counts = {};
	var visit_matrix = {};

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
				loadGangTweetCounts();
			}
		});
	}

	// Load Gang Tweet counts
	function loadGangTweetCounts() {
		$.ajax({
			url: JSON_URL + 'gang_tweet_counts.json',
			type: 'GET',
			dataType: 'json',
			error: function(data) {
				console.log('Error! Loading gang_tweet_counts.json');
				console.log(data)
			},
			success: function(data) {
				gang_tweet_counts = data;
				//console.log(gang_tweet_counts);
				console.log('Done loading gang_tweet_counts.')
				loadVisitMat();
			}
		});
	}

	// Load visit matrix
	function loadVisitMat() {
		$.ajax({
			url: JSON_URL + 'visit_matrix.json',
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
				start();
			}
		});
	}
	//-----


	// PLOT functions
	var gang_pols = {};
	var gang_labels = {};
	var gang_circles = {};
	var gang_show = {};
	var visit_lines = {};
	var hold_lines = {};

	// Start plotting data
	function start() {
		plotGangPols();
		initializeShowStatus();
		initializeHoldStatus();
		plotGangCircles();
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
        zIndex: 5
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
		});
	}

	// Initialize visitation shoe status
	function initializeShowStatus() {
		for(var gang_id=23; gang_id<=54; gang_id+=1) {
			gang_show[gang_id] = false;
		}
	}
	function initializeHoldStatus() {
		for(var gang_id=23; gang_id<=54; gang_id+=1) {
			hold_lines[gang_id] = false;
		}
	}

	// Plot each gang's home circle
	function plotGangCircles() {
		$.each(loc_data, function(gang_id, loc) {
    	gang_circles[gang_id] = new google.maps.Circle({
        strokeColor: "#4DAF4A",
        strokeOpacity: 0.75,
        strokeWeight: 1,
        fillColor: "#4DAF4A",
        fillOpacity: 0.5,
        map: map,
        center: new google.maps.LatLng(loc.centroid[0], loc.centroid[1]),
        radius: Math.log(gang_tweet_counts[gang_id])*50,
        zIndex: 20
      });
   		//A65628,4DAF4A

      // Add events
      google.maps.event.addListener(gang_circles[gang_id], 'click', function() {
      	toggleVisitLines(gang_id);
      });
      google.maps.event.addListener(gang_circles[gang_id], 'mouseover', function() {
      	showVisitLines(gang_id);
      });
      google.maps.event.addListener(gang_circles[gang_id], 'mouseout', function() {
      	hideVisitLine(gang_id);
      });
		});
	}


	function showVisitLines(gang_id) {
		if(gang_show[gang_id] == false) {
			//console.log('SHOW: ' + loc_data[gang_id].name);
			gang_show[gang_id] = true;

			var from = new google.maps.LatLng(loc_data[gang_id]['out_point'][0], loc_data[gang_id]['out_point'][1]);
			visit_lines[gang_id] = {};
			$.each(rivalry_matrix[gang_id]['rival'], function(i, rival_id) {
				if(visit_matrix[gang_id][rival_id] != 0) {
					var to = new google.maps.LatLng(loc_data[rival_id]['in_point'][0], loc_data[rival_id]['in_point'][1]);
					var count = visit_matrix[gang_id][rival_id];
					count = count == 1 ? count + 1 : count;
					var line = [from, to];

					visit_lines[gang_id][rival_id] = new google.maps.Polyline({
	          path: line,
	          strokeColor: "#F781BF",
	          strokeOpacity: 0.75,
	          strokeWeight: Math.log(count)*1.5,
	          //strokeWeight: count/4,
	          zIndex: 10,
	          map: map
	        });
				}
			});
			$.each(rivalry_matrix[gang_id]['nonrival'], function(i, rival_id) {
				if(visit_matrix[gang_id][rival_id] != 0) {
					var to = new google.maps.LatLng(loc_data[rival_id]['in_point'][0], loc_data[rival_id]['in_point'][1]);
					var count = visit_matrix[gang_id][rival_id];
					count = count == 1 ? count + 1 : count;
					var line = [from, to];

					visit_lines[gang_id][rival_id] = new google.maps.Polyline({
	          path: line,
	          strokeColor: "#377EB8",
	          strokeOpacity: 0.75,
	          strokeWeight: Math.log(count)*1.5,
	          //strokeWeight: count/4,
	          zIndex: 10,
	          map: map
	        });
				}
			});
		}
	}

	function hideVisitLine(gang_id) {
		if(gang_show[gang_id] == true && hold_lines[gang_id] == false) {
			//console.log('HIDE: ' + loc_data[gang_id].name);
			gang_show[gang_id] = false;

			$.each(visit_lines[gang_id], function(rival_id) {
				visit_lines[gang_id][rival_id].setMap(null);
			})
			delete visit_lines[gang_id];
		}
	}

	function toggleVisitLines(gang_id) {
		//console.log('TOGGLE: ' + loc_data[gang_id].name);
		if(gang_show[gang_id] == true && hold_lines[gang_id] == true) {
			hold_lines[gang_id] = false;
			hideVisitLine(gang_id);
		}
		else if(gang_show[gang_id] == true && hold_lines[gang_id] == false) {
			hold_lines[gang_id] = true;
		}
		else if(gang_show[gang_id] == false && hold_lines[gang_id] == false) {
			hold_lines[gang_id] = true;
			showVisitLines(gang_id);
		}
	}


	// BUTTON events
	google.maps.event.addDomListener(document.getElementById('show-all-button'), 'click', function() {
		for(var gang_id=23; gang_id<=54; gang_id+=1) {
			hold_lines[gang_id] = true;
			showVisitLines(gang_id)
		}
	});
	google.maps.event.addDomListener(document.getElementById('clear-button'), 'click', function() {
		for(var gang_id=23; gang_id<=54; gang_id+=1) {
			hold_lines[gang_id] = false;
			hideVisitLine(gang_id)
		}
	});

});