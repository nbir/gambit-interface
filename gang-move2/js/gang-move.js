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
	

	//-----
	//var JSON_URL = 'http://brain.isi.edu/~gambit/v2.0/data/json-gang-move/'
	//var JSON_URL = 'http://nibir/~gambit/gang-move/json-gang-move/'
	var JSON_URL = "data/";
	//-----
	var gt_points=[];
	var gang_territory = null;
	var home_marker = null;
	var activity_points = [];
	var heatmap = null;
	var activity_points_in = [];
	var heatmap_inside = null;
	//-----

	google.maps.event.addDomListener(document.getElementById('show-button'), 'click', function() {
		clearAllOverlay();

		var file_name = $('#user-list option:selected').val() + '.json';
		//console.log(JSON_URL + file_name);
		$.getJSON(JSON_URL + file_name, function(data) {
			
			// Gang teritory polygon
			gt_points=[];
			$.each(data.location_polygon, function(i, latlng) {
				gt_points.push(new google.maps.LatLng(latlng[0], latlng[1]));
			});
			gt_points.pop();

			gang_territory = new google.maps.Polygon({
		    paths: gt_points,
		    strokeColor: "#FF0000",
		    strokeOpacity: 0.8,
		    strokeWeight: 2,
		    fillColor: "#FF0000",
		    fillOpacity: 0.1
		  });
		  gang_territory.setMap(map);

		  // Home market
		  home_marker = new google.maps.Marker({
      	position: new google.maps.LatLng(data.home[0], data.home[1]),
     	 	map: map,
    	  title: 'user_id: ' + data.user_id
 			});

 			// Activity heatmap
 			activity_points = [];
 			$.each(data.points, function(i, latlng) {
 				activity_points.push(new google.maps.LatLng(latlng[0], latlng[1]));
 			});
 			heatmap = new google.maps.visualization.HeatmapLayer({
			  data: activity_points,
			  radius: 20,
			});
			heatmap.setMap(map);

			// Activity inside gang territory heatmap
			if(data.points_inside) {
				activity_points_in = [];
	 			$.each(data.points_inside, function(i, latlng) {
	 				activity_points_in.push(new google.maps.LatLng(latlng[0], latlng[1]));
	 			});
	 			heatmap_inside = new google.maps.visualization.HeatmapLayer({
				  data: activity_points_in,
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
						'rgba(255, 0, 0, 1)'
					]
					*/
				});
				heatmap_inside.setMap(map);
			}

		});
	});

	google.maps.event.addDomListener(document.getElementById('clear-map-button'), 'click', function() {
		clearAllOverlay();
	});

	function clearAllOverlay() {
		if(gang_territory) {
			gang_territory.setMap(null);
			gang_territory = null;
			home_marker.setMap(null);
			home_marker = null;
			heatmap.setMap(null);
			heatmap = null;
		}
		if(heatmap_inside) {
			heatmap_inside.setMap(null);
			heatmap_inside = null;
		}
	}

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
    heatmap.setOptions({
      gradient: heatmap.get('gradient') ? null : gradient
    });
    if(heatmap_inside) {
	    heatmap_inside.setOptions({
	      gradient: heatmap_inside.get('gradient') ? null : gradient
	    });
	  }
	});
});