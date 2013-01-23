/* GAMBIT Interface
 *
 * Copyright (C) USC Information Sciences Institute
 * Author: Nibir Bora <nbora@usc.edu>
 * URL: <http://cbg.isi.edu/>
 * For license information, see LICENSE
 */

function goButtonClick() {
	/* This function is triggered when the GO button is clicked.
	 * If there are no tweets loaded, then it builds the query
	 * string, gets tweets from the API, and plots them on the
	 * map. If there are tweets loaded, and an overlay is drawn
	 * it trims the set of tweets, and removes corresponding
	 * markers. It refreshes the side panel and clears overlays.
	 */

	$("#go-button").attr('disabled', true);
	//Disable Go button while loading

	if (Object.keys(status_id_list).length == 0) {
		//If there are no tweets then get tweets from API

		var query_string = buildQueryString();
		getTweetsFromAPI(query_string);

		//loadTweetsToSidePanel();
	} else if (current_overlay_type != null) {
		//And if there are tweets and an overly has been drawn

		trimTweetsOutsideOverlay();
		loadTweetsToSidePanel();
		clearOverlay();
		
		// Update marker clusters as well
		if(marker_cluster) {
			deleteMarkerClusters();
			createMarkerClusters();
		}

		$("#go-button").attr('disabled', false);
		//Enable Go button when done
	} else {
		$("#go-button").attr('disabled', false);
	}
}

function buildQueryString() {
	/* This function builds the query string to send to the API, by
	 * considering all filters selected.
	 */
	var query_string = "";
	query_string += "?sort_dsc=post_time&limit=5000";

	//Location
	if (current_overlay == null && current_overlay_type == null) {
		if($('#location-list option:selected').val() < 20) {
			query_string += "&location_id=" + $('#location-list option:selected').val();
		}
		else {
			query_string += "&within_loc_polygon=" + $('#location-list option:selected').val();
		}
		
		if ($("#location-exact").is(":checked")) {
			query_string += "&location_exact=1";
		}
	}
	//Date
	if ($("#from-date").val() != "") {
		var from_date = new Date($("#from-date").val());
		var to_date = new Date($("#to-date").val());

		query_string += "&ts_start=" + from_date.getFullYear() + "-" + (from_date.getMonth() + 1) + "-" + from_date.getDate() + "T00:00:00";
		query_string += "&ts_end=" + to_date.getFullYear() + "-" + (to_date.getMonth() + 1) + "-" + to_date.getDate() + "T23:59:59";
	}
	//Overlay
	if (current_overlay != null && current_overlay_type != null) {
		switch(current_overlay_type) {
			case google.maps.drawing.OverlayType.POLYGON :
				query_string += "&location_polygon=";
				var path_coordinates = current_overlay.getPath().b;
				for (index in path_coordinates) {
					// To check exact variable names returned by Google.
					//console.log(path_coordinates[index]);
					//query_string += path_coordinates[index].Xa + "," + path_coordinates[index].Ya + ",";
					query_string += path_coordinates[index].$a + "," + path_coordinates[index].ab + ",";
				}
				query_string = query_string.substring(0, query_string.length - 1);
				break;
			case google.maps.drawing.OverlayType.CIRCLE :
				console.log(current_overlay.getCenter().Xa + ", " + current_overlay.getCenter().Ya);
				console.log(current_overlay.getRadius());
				break;
			case google.maps.drawing.OverlayType.RECTANGLE :
				query_string += "&location_box=" + current_overlay.getBounds().toUrlValue();
				break;
			case google.maps.drawing.OverlayType.POLYLINE :
				var path_coordinates = current_overlay.getPath().b;
				for (index in path_coordinates) {
					console.log(path_coordinates[index].Xa + ", " + path_coordinates[index].Ya);
				}
				break;
		}
	}
	//query_string = "?sort_dsc=post_time&limit=500" + query_string;
	return query_string;
}

function getTweetsFromAPI(query_string) {
	/* This function gets tweets from the API, filtered by the given
	 * query string, places markers for all the tweets, and populate
	 * global variables status_id_list, location_list and tweet_list.
	 */

	var API_URL = "http://brain.isi.edu:4000/api/v1/tweet/filter";

	console.log(API_URL + query_string);

	// Store in global variables
	$.getJSON(API_URL + query_string, function(data) {
		$.each(data, function(i, tweet) {
			status_id = Number(tweet.status_id);

			status_id_list[status_id] = status_id;

			location_list[status_id] = {
				latitude : tweet.latitude,
				longitude : tweet.longitude
			};

			tweet_list[status_id] = {
				text : tweet.text,
				timestamp : tweet.timestamp,
				user_id : tweet.user_id,
				location_id : tweet.location_id,
				place_name : tweet.place_name
			};

			//Cannot call from outside getJSON.
			addMarker(new google.maps.LatLng(tweet.latitude, tweet.longitude), status_id);
		});

		//Functions to call after getJSON
		clearOverlay();
		$("#go-button").attr('disabled', false);
		//Enable Go button able loading
		loadTweetsToSidePanel();
	});
}

function loadTweetsToSidePanel() {
	/* This function populates the side pannel with the current
	 * tweets in global variables.
	 */
	$("#side-panel").empty();
	
	$("#side-panel").append('<div class="callout-box" style="height:45px;"></div>');

	$.each(status_id_list, function(status_id, value) {
		$("#side-panel").append(getTweetContentHTML(status_id));
		//consol.log(getContentStringOfCallout(status_id));
	});
}

// TRIM TOOL

function trimTweetsOutsideOverlay() {
	/* This function deletes those tweets from the global
	 * variables status_id_list, location_list and tweet_list
	 * that are not in the drawn overlay.
	 */

	$.each(location_list, function(status_id, location) {
		switch(current_overlay_type) {
			case google.maps.drawing.OverlayType.POLYGON :
				// Polygon check condition
				if (!google.maps.geometry.poly.containsLocation(new google.maps.LatLng(location.latitude, location.longitude), current_overlay)) {
					deleteMarkerForStatusID(status_id);
				}
				break;

			case google.maps.drawing.OverlayType.RECTANGLE :
				// Rectangle check condition
				if (!current_overlay.getBounds().contains(new google.maps.LatLng(location.latitude, location.longitude))) {
					deleteMarkerForStatusID(status_id);
				}
				break;

		}
	});
}

function deleteMarkerForStatusID(status_id) {
	/* This function removes a marker from the map and
	 * deletes it, deletes all tweet information from the global
	 * variables status_id_list, location_list and tweet_list
	 * corresponding to the given status_id.
	 */

	markers_on_map[status_id].setMap(null);
	markers_on_map[status_id] = null;
	delete status_id_list[status_id];
	delete location_list[status_id];
	delete tweet_list[status_id];
}

// MARKER CLUSTER

function markerClusterClick() {
	/* This function checks if there are markers on the map and forms
	 * clusters of them. It does nothing if there are no markers. If 
	 * clusters already exist, this function clears them and plots the
	 * original markers.
	 */
	
	if (Object.keys(status_id_list).length != 0) {
		//If there are markers on map
		if(marker_cluster == null) {
			createMarkerClusters();
		}
		else {
			//Clusters already exist
			deleteMarkerClusters();
		}
	}
}
