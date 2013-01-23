$(function() {
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
	var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
	
	var all_coord = {};
	var markers_on_map = [];
	var size_arr = [];
	var home_bound;
	var global_bound = new google.maps.LatLngBounds();
	var arr_overlay = [];
	var arr_bounds = [];
	var arr_traces = [];
	//
	var ft_users = [];
	var hd_users = [];
	var ft_disp = null;
	var ft_overlay = null;
	var hd_disp = null;
	var hd_overlay = null;
	//var KML_URL = 'http://brain.isi.edu/~gambit/v2.0/data/user-disp/';
	var KML_URL = 'data/';

	
	//Load FT and HD json lists
	//var API_URL = "../data/user-disp/";
	var API_URL = "data/";
	$.getJSON(API_URL + 'ft_users_rank.json', function(data) {
		ft_users = data;
	});
	
	$.getJSON(API_URL + 'hd_users_rank.json', function(data) {
		hd_users = data;
	});
	
	google.maps.event.addDomListener(document.getElementById('ft-disp-lines-button'), 'click', function() {
		if(ft_disp == null && $('#ft-user-rank').val() != '') {
			clearHDkml();
			
			var rank = $('#ft-user-rank').val();
			kml_url = KML_URL + 'ft_kml/' + ft_users[rank] + '_disp.kml';
			ft_disp = new google.maps.KmlLayer(kml_url);
			console.log(ft_disp);
			ft_disp.setMap(map);
			$('#ft-disp-lines-button').button('toggle');
		}
		else if(ft_disp) {
			ft_disp.setMap(null);
			ft_disp = null;
			$('#ft-disp-lines-button').button('toggle');
		}
	});
	google.maps.event.addDomListener(document.getElementById('ft-disp-overlay-button'), 'click', function() {
		if(ft_overlay == null && $('#ft-user-rank').val() != '') {
			clearHDkml();
			
			var rank = $('#ft-user-rank').val();
			kml_url = KML_URL + 'ft_kml/' + ft_users[rank] + '_overlay.kml';
			ft_overlay = new google.maps.KmlLayer(kml_url);
			ft_overlay.setMap(map);
			$('#ft-disp-overlay-button').button('toggle');
		}
		else if(ft_overlay) {
			ft_overlay.setMap(null);
			ft_overlay = null;
			$('#ft-disp-overlay-button').button('toggle');
		}
	});
	
	google.maps.event.addDomListener(document.getElementById('ft-clear-button'), 'click', function() {
		clearFTkml();
	});
		
	function clearFTkml() {
		if(ft_disp) {
			ft_disp.setMap(null);
			ft_disp = null;
			$('#ft-disp-lines-button').button('toggle');
		}
		if(ft_overlay) {
			ft_overlay.setMap(null);
			ft_overlay = null;
			$('#ft-disp-overlay-button').button('toggle');
		}
		$('#ft-user-rank').attr('value', '');
	}
	
	google.maps.event.addDomListener(document.getElementById('hd-disp-lines-button'), 'click', function() {
		if(hd_disp == null && $('#hd-user-rank').val() != '') {
			clearFTkml();
			
			var rank = $('#hd-user-rank').val();
			kml_url = KML_URL + 'hd_kml/' + hd_users[rank] + '_disp.kml';
			hd_disp = new google.maps.KmlLayer(kml_url);
			hd_disp.setMap(map);
			$('#hd-disp-lines-button').button('toggle');
		}
		else if(hd_disp) {
			hd_disp.setMap(null);
			hd_disp = null;
			$('#hd-disp-lines-button').button('toggle');
		}
	});
	google.maps.event.addDomListener(document.getElementById('hd-disp-overlay-button'), 'click', function() {
		if(hd_overlay == null && $('#hd-user-rank').val() != '') {
			clearFTkml();
			
			var rank = $('#hd-user-rank').val();
			kml_url = KML_URL + 'hd_kml/' + hd_users[rank] + '_overlay.kml';
			hd_overlay = new google.maps.KmlLayer(kml_url);
			hd_overlay.setMap(map);
			$('#hd-disp-overlay-button').button('toggle');
		}
		else if(hd_overlay) {
			hd_overlay.setMap(null);
			hd_overlay = null;
			$('#hd-disp-overlay-button').button('toggle');
		}
	});
	
	google.maps.event.addDomListener(document.getElementById('hd-clear-button'), 'click', function() {
		clearHDkml();
	});
		
	function clearHDkml() {
		if(hd_disp) {
			hd_disp.setMap(null);
			hd_disp = null;
			$('#hd-disp-lines-button').button('toggle');
		}
		if(hd_overlay) {
			hd_overlay.setMap(null);
			hd_overlay = null;
			$('#hd-disp-overlay-button').button('toggle');
		}
		$('#hd-user-rank').attr('value', '');
	}
});
