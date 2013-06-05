/* GAMBIT Interface
*
* Copyright (C) USC Information Sciences Institute
* Author: Nibir Bora <nbora@usc.edu>
* URL: <http://cbg.isi.edu/>
* For license information, see LICENSE
*/

$(function() {
	//--- MAP
	var light_map_style = [{
	    featureType: "all",
	    stylers: [{
	        saturation: -65,
	      }, {
	        inverse_lightness: true
	      }
	    ]
	  }
	];
	var mapOptions = {
		center : new google.maps.LatLng(34.0522, -118.2428),
		zoom : 11,
		mapTypeId : google.maps.MapTypeId.ROADMAP,

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
	//var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
	var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
	map.mapTypes.set('map_style', new google.maps.StyledMapType(light_map_style));
	map.setMapTypeId('map_style');
	//-----

	//--- API URLs
	var API_DATA = "data/";
	//-----


	//--- Load points
	var points = {};

	$("#play-button").attr('disabled', true);
	$.ajax({
		url: API_DATA + 'roseparade.json',
		type: 'GET',
		dataType: 'json',
		error: function(data) {
			console.log('Error! roseparade.json');
			console.log(data)
			$("#play-button").attr('disabled', false);
		},
		success: function(data) {
			points = data;
			$("#play-button").attr('disabled', false);

			//testPoints();
		}
	});

	function testPoints() {
		$.each(points, function(i, latlng) {
			//console.log(latlng);
			console.log(latlng.length);
		});
	}

	//--- Execute
	var heatmap_data = null;
	var heatmap = null;
	google.maps.event.addDomListener(document.getElementById('clear-button'), 'click', function() {
		if (heatmap != null) {
			heatmap.setMap(null);
			heatmap_data = null;
			heatmap = null;
		}
	});

	google.maps.event.addDomListener(document.getElementById('play-button'), 'click', function() {
		
		heatmap_data = new google.maps.MVCArray();
		heatmap = new google.maps.visualization.HeatmapLayer({
		  map: map,
		  data: heatmap_data,
		  radius: 45,
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
				'rgba(255, 0, 0, 1)'],
		});

		// Show
		setTimeout(function () {
			show(0);
		}, 10000);
	});

	//------
	var N_INTERVAL = 6;
	var DELAY = 10;
	var INTERVALS = 287;

	function show(index) {
		console.log(index);
		// Execute this set
		if(index < N_INTERVAL) {
			for (i=0; i<points[index].length; i++) {
				latlng = points[index][i];
				heatmap_data.push(new google.maps.LatLng(latlng[0], latlng[1]));
			}

		}
		else {
			out = index - N_INTERVAL
			common = Math.min(points[index].length, points[out].length);
			for (i=0; i<common; i++) {
				heatmap_data.removeAt(0);
				latlng = points[index][i];
				heatmap_data.push(new google.maps.LatLng(latlng[0], latlng[1]));					
			}

			for (i=common; i<points[out].length; i++) {
				heatmap_data.removeAt(0);
			}
			for (i=common; i<points[index].length; i++) {
				latlng = points[index][i];
				heatmap_data.push(new google.maps.LatLng(latlng[0], latlng[1]));
			}
		}

		// Call next set
		if(index < INTERVALS) {
			setTimeout(function () {
				show(index + 1);
			}, DELAY);
		}
	}

	/*
	var N_POINTS = 150;
	var DELAY = 0.0001;
	function show(index) {
		console.log(index);
		// Execute this set
		if(index < N_POINTS) {
			latlng = points[index];
			heatmap_data.push(new google.maps.LatLng(latlng[0], latlng[1]));
		}
		else {
			heatmap_data.removeAt(0);
			latlng = points[index];
			heatmap_data.push(new google.maps.LatLng(latlng[0], latlng[1]));
		}

		// Call next set
		if(index < points.length) {
			setTimeout(function () {
				show(index + 1);
			}, DELAY);
		}
	}
	*/

	/*
	function show(set) {
		console.log('Showing set ' + set);
		// Execute this set
		if(set == 0) {
			$.each(points[set], function(i, latlng) {
				heatmap_data.push(new google.maps.LatLng(latlng[0], latlng[1]));
			});
		}
		else {
			// Remove previous
			while(heatmap_data.getLength() > 0) {
				heatmap_data.removeAt(0);	
			}
			// Insert next
			$.each(points[set], function(i, latlng) {
				heatmap_data.push(new google.maps.LatLng(latlng[0], latlng[1]));
			});
		}

		// Call next set
		if(set < N_POINTS) {
			setTimeout(function () {
				show(set + 1)
			}, DELAY);
		}
	}*/

});	