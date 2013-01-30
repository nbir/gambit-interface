/* GAMBIT Interface - Visualization library
*
* Copyright (C) USC Information Sciences Institute
* Author: Nibir Bora <nbora@usc.edu>
* URL: <http://cbg.isi.edu/>
* For license information, see LICENSE
*/

//--- GLOBALs
//-----

//--- MAP Initialize
var lib_map = null;

function initMap(canvas, options) {
	var map_options = {
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
	}

	if(options['center']) {
		map_options['center'] = new google.maps.LatLng(options['center'][0], options['center'][1]);
	}
	if(options['zoom']) {
		map_options['zoom'] = options['zoom'];
	}
	if(options['map_type']) {
		map_options['mapTypeId'] = google.maps.MapTypeId[options['map_type']];
	}
	lib_map = new google.maps.Map($('#'+canvas).get(0), map_options);

	return lib_map;
}
//-----


//--- DATA on map
var lib_data = {};

function setData(data) {
	$.each(data, function(index, data_element) {
		lib_data[data_element['id']] = data_element;
	});
}

function clearData(clear_overlay, clear_side_panel) {
	if(clear_overlay) {
		clearPlot();
	}

	if(clear_side_panel) {
		$("#side-panel").empty();
	}

	lib_data = {};
}

function trimData(overlay, overlay_type) {
	$.each(lib_data, function(id, data) {
		switch(overlay_type) {
			case 'polygon' :
				// Polygon check condition
				if (!google.maps.geometry.poly.containsLocation(new google.maps.LatLng(data.latitude, data.longitude), overlay)) {
					delete lib_data[id];
				}
				break;

			case 'rectangle' :
				// Rectangle check condition
				if (!overlay.getBounds().contains(new google.maps.LatLng(data.latitude, data.longitude))) {
					delete lib_data[id];
				}
				break;
		}
	});

	if(Object.keys(lib_data).length > 0) {
		if(lib_plot_type == 'marker') {
			plotMarkers();
		}
		else if(lib_plot_type == 'heatmap') {
			plotHeatmap();
		}
	}
}
//-----


//--- PLOTs
var lib_plot_type = null;
var lib_markers_on_map = {};
var lib_heatmap = null;

function plotMarkers() {
	if(Object.keys(lib_data).length > 0) {
		clearPlot();
		lib_plot_type = 'marker';

		$.each(lib_data, function(id, data_element) {
			if (!lib_markers_on_map[id]) {// In case of repeated data returned by the API
				// Create Marker
				lib_markers_on_map[id] = new google.maps.Marker({
					position : new google.maps.LatLng(data_element.latitude, data_element.longitude),
					map : lib_map,
					icon : 'img/red-dot.png'
				});

				// Generate call-out overlay (info-window)
				var content_window_string = getCalloutContentHTML(id);
				var infowindow = new google.maps.InfoWindow({
					content : content_window_string
				});

				// Add mouse over even to the markers to show tweet details
				google.maps.event.addListener(lib_markers_on_map[id], 'click', function() {
					infowindow.open(lib_map, lib_markers_on_map[id]);
				});
				// Call-out close event
				google.maps.event.addListener(lib_markers_on_map[id], 'mouseout', function() {
					window.setTimeout(function() {
						infowindow.close();
					}, 2000);
				});
				google.maps.event.addListener(lib_map, 'click', function() {
					infowindow.close();
				});
			}
		});
	}
}

function plotHeatmap() {
	if(Object.keys(lib_data).length > 0) {
		clearPlot();
		lib_plot_type = 'heatmap';

		var heatmap_points = [];
		$.each(lib_data, function(id, data_element) {
			heatmap_points.push(new google.maps.LatLng(data_element.latitude, data_element.longitude));
		});

		lib_heatmap = new google.maps.visualization.HeatmapLayer({
		  data: heatmap_points,
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
		lib_heatmap.setMap(lib_map);

		showNumbers();
	}
}

function clearPlot() {
	if(lib_plot_type == 'marker') {
		$.each(lib_markers_on_map, function(id, marker) {
			lib_markers_on_map[id].setMap(null);
		});
		lib_markers_on_map = {};
	}
	else if(lib_plot_type == 'heatmap') {
		lib_heatmap.setMap(null);
		removeNumbers();
	}
	lib_plot_type = null;
}
//--- Heatmap show numbers
var marker_cluster = null;

function showNumbers() {
	var marker_arr = [];
	$.each(lib_data, function(id, data_element) {
		marker_arr.push(new google.maps.Marker({	
			position: new google.maps.LatLng(data_element.latitude, data_element.longitude),
			visible: true
		}));
	});

	marker_cluster = new MarkerClusterer(lib_map, marker_arr, {
		averageCenter: true,
		zoomOnClick: false,
		minimumClusterSize: 1,
	});
}
function removeNumbers() {
	marker_cluster.clearMarkers();
	marker_cluster = null;
}
//-----


//--- SIDE PANEL
function loadContentToSidePanel() {
	/* This function populates the side pannel with the current
	 * tweets in global variables.
	 */
	$("#side-panel").empty();
	
	$("#side-panel").append('<div class="callout-box" style="height:45px;"></div>');

	$.each(lib_data, function(id, data_element) {
		$("#side-panel").append(getCalloutContentHTML(id));
		//consol.log(getContentStringOfCallout(status_id));
	});
}
function getCalloutContentHTML(status_id) {
	/* This function returns the HTML string for call-out corresponding
	 * to the given status_id
	 */
	var tweet_date = new Date(lib_data[status_id].timestamp);

	var content_window_string = '<div class="callout-box"><div class="callout-header">';
	content_window_string += '<p class="callout-date">' + (tweet_date.getMonth() + 1) + '/' + tweet_date.getDate() + '/' + tweet_date.getFullYear() + '</p>';
	content_window_string += '<p class="callout-time">' + tweet_date.getHours() + ':' + tweet_date.getMinutes() + '</p>';
	if (lib_data[status_id].place_name != null) {
		content_window_string += '<p class="callout-place">' + lib_data[status_id].place_name + '</p>';
	}
	content_window_string += '</div>';
	content_window_string += '<p class="callout-tweet">' + lib_data[status_id].text + '</p></div>';

	return content_window_string;
}
//-----