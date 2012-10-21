/* GAMBIT Interface
*
* Copyright (C) USC Information Sciences Institute
* Author: Nibir Bora <nbora@usc.edu>
* URL: <http://cbg.isi.edu/>
* For license information, see LICENSE
*/

// LOCATION CHANGE UTILITY
function mapChangeLocation() {
	/* This function clears all currently plotted
	 * markers on map, overlays, and repositions the
	 * map center to the selected location.
	 */

	clearAllMarkers();
	clearOverlay();
	clearAllTraces();
	clearTweetList();
	loadTweetsToSidePanel();
	changeMapCenter();
}

function clearAllMarkers() {
	/* This function cleares out all the currently loaded
	* coordinates, and deletes the markers from the map.
	*/

	//Delete all markers on map
	$.each(status_id_list, function(status_id, value) {
		markers_on_map[status_id].setMap(null);
	});

	markers_on_map = [];
}

function clearOverlay() {
	/* This function clears any overlays on the maps. */
	if (current_overlay != null || current_overlay_type != null) {
		current_overlay.setMap(null);
	}
	current_overlay = null;
	current_overlay_type = null;
}

function clearAllTraces() {
	/* This function clears all user traces on the map.
	 */
	$.each(traces_on_map, function(status_id, value) {
		traces_on_map[status_id].setMap(null);
		delete traces_on_map[status_id];
	});
	
	trace_bounds = {};
}

function clearTweetList() {
	/* This function empties all the map global variables */
	status_id_list = {};
	location_list = {};
	tweet_list = {};

	$("#side-panel").empty();
}

function clearButtonClick() {
	/* This function clears all markers, overlays,
	 * user traces, and clears global variables,
	 */
	clearAllMarkers();
	clearOverlay();
	clearAllTraces();
	clearTweetList();
}


function changeMapCenter() {
	/* This function sets the map center to the latitude and
	 * longitude of the location_id currently selected.
	 */

	location_id = document.getElementById("location-list").value;

	location_center_coordinates = {
		"1" : [12.99863105, 77.58684725],
		"2" : [30.059010999999998, 31.2485725],
		"3" : [41.9273315, -87.7652156],
		"4" : [25.225469, 55.3188205],
		"5" : [-26.05533055, 28.040027600000002],
		"6" : [34.23324825, -118.25271839999999],
		"7" : [6.4900205, 3.417757],
		"8" : [51.526575199999996, -0.10797109999999999],
		"9" : [55.7461115, 37.7216564],
		"10" : [19.17725445, 72.98548895],
		"11" : [40.803276100000005, -73.8291256],
		"12" : [-23.671598449999998, -46.58476385],
		"13" : [37.6067224, -122.082046],
		"14" : [1.3257721999999998, 103.85838749999999],
		"15" : [-33.7990972, 151.08948750000002],
		"16" : [35.6976655, 51.415357],
		"17" : [35.75414875, 139.7010761],
		"18" : [43.4962178, -79.63477270000001],
		"19" : [39.04468845, -77.1304805],
		"20" : [34.063, -118.1925]
	}
	//alert(location_center_coordinates[location_id][0] + ", " + location_center_coordinates[location_id][1]);
	map.setCenter(new google.maps.LatLng(location_center_coordinates[location_id][0], location_center_coordinates[location_id][1]));
}

// MARKER PLOT

function addMarker(location, status_id) {
	if (!markers_on_map[status_id]) {// In case of repeated data returned by the API
		// Create Marker
		markers_on_map[status_id] = new google.maps.Marker({
			position : location,
			map : map,
			icon : 'img/red-dot.png'
		});

		// Generate call-out overlay (info-window)
		var content_window_string = getTweetContentHTML(status_id);

		var infowindow = new google.maps.InfoWindow({
			content : content_window_string
		});

		// Add event listener to the Trace button
		/*
		google.maps.event.addListener(document.getElementById("trace-path-button-"+status_id), 'click', function() {
		traceUserForStatusID(status_id);
		});
		*/

		// Add mouse over even to the markers to show tweet details
		google.maps.event.addListener(markers_on_map[status_id], 'click', function() {
			infowindow.open(map, markers_on_map[status_id]);
			//render button
			$(".trace-path").button({
				text : false,
				icons : {
					primary : "ui-icon-flag"
				}
			});
		});
		// Call-out close event
		google.maps.event.addListener(markers_on_map[status_id], 'mouseout', function() {
			window.setTimeout(function() {
				infowindow.close();
			}, 2000);
		});
		google.maps.event.addListener(map, 'click', function() {
			infowindow.close();
		});
	}
}

function getTweetContentHTML(status_id) {
	/* This function returns the HTML string for call-out corresponding
	 * to the given status_id
	 */
	var tweet_date = new Date(tweet_list[status_id].timestamp);

	var content_window_string = '<div class="callout-box"><div class="callout-header">';
	content_window_string += '<button id="trace-path-button-' + status_id + '" class="trace-path" onclick="javascript:traceUserForStatusID(' + status_id + ');">Trace</button>';
	content_window_string += '<p class="callout-date">' + (tweet_date.getMonth() + 1) + '/' + tweet_date.getDate() + '/' + tweet_date.getFullYear() + '</p>';
	content_window_string += '<p class="callout-time">' + tweet_date.getHours() + ':' + tweet_date.getMinutes() + '</p>';
	if (tweet_list[status_id].place_name != null) {
		content_window_string += '<p class="callout-place">' + tweet_list[status_id].place_name + '</p>';
	}
	content_window_string += '</div>';
	content_window_string += '<p class="callout-tweet">' + tweet_list[status_id].text + '</p></div>';

	return content_window_string;
}

//TRIM

// TRACE
function traceUserForStatusID(status_id) {
	/* This function traces plots for the specified user_id
	 * by choosing tweets from among the one currently in the
	 * global variables.
	 */
	user_id = tweet_list[status_id].user_id;

	var trace_path = [];
	var temp_path = [];
	var temp_value = {};
	var temp_date;
	var flag_already_traced = false;

	if (!( user_id in traces_on_map) && !( user_id in trace_bounds)) {
		$.each(tweet_list, function(status_id, tweet) {
			if (tweet.user_id == user_id) {

				temp_date = new Date(tweet_list[status_id].timestamp);

				temp_value = {
					timestamp : temp_date.getTime(),
					status_id : status_id
				};

				temp_path.push(temp_value);
			}
		});

		temp_path.sort(function(ts1, ts2) {
			return (ts1.timestamp - ts2.timestamp);
		});

		trace_bounds[status_id] = new google.maps.LatLngBounds();
		var temp_latlng;

		$.each(temp_path, function(i, temp_value) {
			temp_latlng = new google.maps.LatLng(location_list[temp_value.status_id].latitude, location_list[temp_value.status_id].longitude);
			trace_bounds[status_id].extend(temp_latlng);
			trace_path.push(temp_latlng);
		});

		if (trace_path.length > 1) {
			traces_on_map[user_id] = new google.maps.Polyline({
				strokeColor : '#FF0000',
				strokeOpacity : 1.0,
				strokeWeight : 2
			});

			traces_on_map[user_id].setPath(trace_path);
			traces_on_map[user_id].setMap(map);
		}
		else {
			trace_bounds[status_id] = new google.maps.LatLngBounds(new google.maps.LatLng(location_list[status_id].latitude, location_list[status_id].longitude), new google.maps.LatLng(location_list[status_id].latitude-0.000005, location_list[status_id].longitude+0.000005));
		}
	}
	map.fitBounds(trace_bounds[status_id]);
}