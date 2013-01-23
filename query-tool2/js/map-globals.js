/* GAMBIT Interface
 * 
 * Copyright (C) USC Information Sciences Institute
 * Author: Nibir Bora <nbora@usc.edu>
 * URL: <http://cbg.isi.edu/>
 * For license information, see LICENSE
 */

// MAP
var map;
/* Map variable for the google map canvas */

// DRAW TOOL
var drawing_manager;
/* Inscance for drawing panel tool. The actual pannel
 * is not show on the window, but the operations are 
 * mimiced by buttons.
 */ 

// TWEETS
var status_id_list = {};
/* Stores the list of status_id for each tweet in
 * location_list and tweet_list.
 * 
 * status_id_list[status_id] = tweet.status_id
 */
var location_list = {};
/* Stores the latitude and longitudes of each status_id
 * in the status_id_list. Each pair is identified
 *  by the status_id (property).
 * 
 * location_list[status_id] = {
 * 	latitude : tweet.latitude,
 *  longitude : tweet.longitude
 * };
 */
var tweet_list = {};
/* Stores tweet text, timestamp, user_id, place_name
 * for each status_id in the status_id_list
 * 
 * tweet_list[status_id] = {
 * 	text : tweet.text,
 *  timestamp : tweet.timestamp,
 *  user_id : tweet.user_id,
 *  location_id : tweet.location_id,
 *  place_name : tweet.place_name
 * };
 */

// PLOTS
var markers_on_map = [];
/* Stores all the Google Maps marker objects that are 
 * plotted on the map.
 */

// DRAWING
var current_overlay = null;
/* Stores the current overlay being drawn by the user
 */
var current_overlay_type = null;
/* Stores the current overlay type being drawn
 */

// CLUSTERING
var marker_cluster = null;
/* Object of class MarkerCluster used for on-the-fly clustering
 * of markers on map.
 */

var traces_on_map = {};
var trace_bounds = {};


function initializeMap() {
	/* This function initializes the map on the map-canvas id 
	 * and sets positions of the map controls.
	 */ 

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

	map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
}
