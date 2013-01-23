/* GAMBIT Interface
*
* Copyright (C) USC Information Sciences Institute
* Author: Nibir Bora <nbora@usc.edu>
* URL: <http://cbg.isi.edu/>
* For license information, see LICENSE
*/

$(function() {
	var map = initMap('map-canvas', {
		center : [34.0522, -118.2428],
		zoom : 11,
		map_type : 'ROADMAP'
	});

	//--- GLOBALs
	var API_V2_LOCATION_LIST = "http://brain.isi.edu:4002/api/v2/location/list";
	var API_V2_TWEET_FILTER = "http://brain.isi.edu:4002/api/v2/tweet/filter";

	var location_bounds = {};

	var drawing_manager;
	var current_overlay = null;
	var current_overlay_type = null;

	var drawing_manager_trim;
	//-----


	//--- Populate locations
	$("#show-button").attr('disabled', true);
	$.ajax({
		url: API_V2_LOCATION_LIST,
		type: 'GET',
		dataType: 'json',
		error: function(data) {
			console.log('Error! APIv2 location::list');
			console.log(data)

			$("#show-button").attr('disabled', false);
		},
		success: function(data) {
			$.each(data, function(i, location) {
				if (location.name == "LACounty") {
					$("#location-list").append('<option selected="selected" value="' + location.id + '">' + location.name + '</option>');
				} else {
					$("#location-list").append('<option value="' + location.id + '">' + location.name + '</option>');
				}

				location_bounds[location.id] = new google.maps.LatLngBounds();
				$.each(location.polygon, function(i, latlng) {
					location_bounds[location.id].extend(new google.maps.LatLng(latlng[0], latlng[1]));
				});
			});

			$("#show-button").attr('disabled', false);
		}
	});
	//--- Location change
	google.maps.event.addDomListener(document.getElementById("location-list"), 'change', function() {
		clearData(true, true);
		map.fitBounds(location_bounds[Number($('#location-list option:selected').val())]);
	});
	//-----

	//--- Datepicker auto-fill
	$("#from-date").datepicker({
		dateFormat : "d M, y",
		maxDate : '0',
		onSelect : function(dateText, inst) {
			if ($("#to-date").val() == "To") {
				/* If to_date is not set and from_date is set, then
				 * set to_date = from_date + 2
				 */
				var to_date = new Date(dateText);
				to_date.setDate(to_date.getDate() + 2)
				$("#to-date").datepicker("setDate", to_date);
			} else {
				var from_date = new Date(dateText);
				var to_date = $("#to-date").datepicker("getDate");
				if (to_date < from_date) {
					/* If from_date > to_date, then
					 * set from_date = to_date - 2
					 */
					from_date.setDate(from_date.getDate() + 2)
					$("#to-date").datepicker("setDate", from_date);
				}
			}
		}
	});
	$("#to-date").datepicker({
		dateFormat : "d M, y",
		maxDate : '0',
		onSelect : function(dateText, inst) {
			if ($("#from-date").val() == "") {
				/* If from_date is not set and to_date is set, then
				 * set from_date = to_date - 2
				 */
				var from_date = $("#to-date").datepicker("getDate");
				from_date.setDate(from_date.getDate() - 2)
				$("#from-date").datepicker("setDate", from_date);
			} else {
				var to_date = new Date(dateText);
				var from_date = $("#from-date").datepicker("getDate");
				if (to_date < from_date) {
					/* If from_date > to_date, then
					 * set from_date = to_date - 2
					 */
					to_date.setDate(to_date.getDate() - 2)
					$("#from-date").datepicker("setDate", to_date);
				}
			}
		}
	});
	//-----

	//--- Side panel
	$("#side-panel").toggle();
	google.maps.event.addDomListener(document.getElementById("side-panel-button"), 'click', function() {
		$("#side-panel").toggle();
	});
	//-----

	//--- Drawing manager - overlay query
	drawing_manager = new google.maps.drawing.DrawingManager({
		drawingMode : null, // No initial drawing mode
		drawingControl : false, // Do not display drawing controls
		drawingControlOptions : {
			drawingModes : [google.maps.drawing.OverlayType.POLYGON, google.maps.drawing.OverlayType.RECTANGLE]
		},
	});
	drawing_manager.setMap(map);
	//--- Overlay button events
	google.maps.event.addDomListener(document.getElementById("draw-polygon"), 'click', function() {
		clickOverlayButton(google.maps.drawing.OverlayType.POLYGON);
	});
	google.maps.event.addDomListener(document.getElementById("draw-rectangle"), 'click', function() {
		clickOverlayButton(google.maps.drawing.OverlayType.RECTANGLE);
	});
	google.maps.event.addListener(drawing_manager, 'polygoncomplete', function(polygon) {
		clearOverlay();
		current_overlay = polygon;
		current_overlay_type = google.maps.drawing.OverlayType.POLYGON;
		drawing_manager.setDrawingMode(null);
	});
	google.maps.event.addListener(drawing_manager, 'rectanglecomplete', function(rectangle) {
		clearOverlay();
		current_overlay = rectangle;
		current_overlay_type = google.maps.drawing.OverlayType.RECTANGLE;
		drawing_manager.setDrawingMode(null);
	});
	//--- Overlay functions
	function clickOverlayButton(overlay_type) {
		/* This function selects the current overlay drawing mode
		 * if no other mode is selected. It clears the mode
		 * and any overlay if the same mode is selected.
		 * It clears overlays and switches overlay mode if a
		 * different mode is selected.
		 */

		if (drawing_manager.drawingMode == overlay_type) {
			// Same drawing mode was selected
			drawing_manager.setDrawingMode(null);
		} else {
			// No drawing mode was selected or different mode is selected
			drawing_manager.setDrawingMode(overlay_type);
		}

		clearOverlay();
	}
	function clearOverlay() {
		/* This function clears any overlays on the maps. */
		if (current_overlay != null || current_overlay_type != null) {
			current_overlay.setMap(null);
		}
		current_overlay = null;
		current_overlay_type = null;
	}
	//-----

	//--- Query & plot tweets
	google.maps.event.addDomListener(document.getElementById('show-button'), 'click', function() {
		$("#show-button").attr('disabled', true);

		// Build query
		var query_string = {};
		if (current_overlay == null && current_overlay_type == null) {
			query_string['location_id'] = Number($('#location-list option:selected').val());
		}
		if (current_overlay != null && current_overlay_type != null) {
			switch(current_overlay_type) {
				case google.maps.drawing.OverlayType.POLYGON :
					var temp_string = "";
					var path_coordinates = current_overlay.getPath().b;
					for (index in path_coordinates) {
						for(coord in path_coordinates[index]) {
							if(typeof path_coordinates[index][coord] == 'number') {
								temp_string = temp_string + path_coordinates[index][coord] + ","; // since API variable names might change
							}
						}
					}
					temp_string = temp_string.substring(0, temp_string.length - 1);
					query_string['polygon'] = temp_string;
					break;
				case google.maps.drawing.OverlayType.RECTANGLE :
					query_string['bbox'] = current_overlay.getBounds().toUrlValue();
					break;
			}
		}
		if ($("#from-date").val() != "") {
			var from_date = new Date($("#from-date").val());
			var to_date = new Date($("#to-date").val());

			query_string['ts_start'] = from_date.getFullYear() + "-" + (from_date.getMonth() + 1) + "-" + from_date.getDate() + "T00:00:00";
			query_string['ts_end'] = to_date.getFullYear() + "-" + (to_date.getMonth() + 1) + "-" + to_date.getDate() + "T23:59:59";
		}
		if ($("#match-text").val() != "") {
			query_string['text'] = $("#match-text").val();
		}
		if ($("#struct-query").val() != "") {
			query_string['textq'] = JSON.stringify($("#struct-query").val());
		}
		query_string['limit'] = 5000;
		//query_string['sort'] = 'rnd';
		console.log(query_string);
		
		// Get tweets
		$.ajax({
			url: API_V2_TWEET_FILTER,
			data: query_string,
			type: 'GET',
			dataType: 'json',
			error: function(data) {
				console.log('Error! APIv2 tweet::filter');
				console.log(data)

				$("#show-button").attr('disabled', false);
			},
			success: function(data) {
				var tweet_data = [];
				$.each(data, function(i, tweet) {
					tweet_data.push({
						id : Number(tweet.id),
						latitude : tweet.lat,
						longitude : tweet.lng,
						timestamp : tweet.timestamp,
						group_id : tweet.user_id,
						text : tweet.text,
					});
				});

				// Library calls
				setData(tweet_data);
				//console.log(lib_data);
				if(view_type == 'marker') {
					plotMarkers();
				}
				if(view_type == 'heatmap') {
					plotHeatmap();
				}
				loadContentToSidePanel();

				$("#show-button").attr('disabled', false);
			}
		});
		clearOverlay();
	});
	//--- Clear
	google.maps.event.addDomListener(document.getElementById('clear-button'), 'click', function() {
		clearData(true, true);

		$('#match-text').val('');
		$('#struct-query').val('');
		$('#from-date').val('');
		$('#to-date').val('');
	});
	//-----
	
	//--- Plot type
	var view_type = 'heatmap';
	$("#view-heatmap").button('toggle');

	google.maps.event.addDomListener(document.getElementById('view-marker'), 'click', function() {
		if(view_type != 'marker') {
			view_type = 'marker';
			$("#view-marker").button('toggle');
			$("#view-heatmap").button('toggle');
			plotMarkers();
		}
	});
	google.maps.event.addDomListener(document.getElementById('view-heatmap'), 'click', function() {
		if(view_type != 'heatmap') {
			view_type = 'heatmap';
			$("#view-heatmap").button('toggle');
			$("#view-marker").button('toggle');
			plotHeatmap();
		}
	});
	//--- Show numbers

	//-----


	//--- TRIM tool
	drawing_manager_trim = new google.maps.drawing.DrawingManager({
		drawingMode : null, // No initial drawing mode
		drawingControl : false, // Do not display drawing controls
		drawingControlOptions : {
			drawingModes : [google.maps.drawing.OverlayType.POLYGON, google.maps.drawing.OverlayType.RECTANGLE]
		},
	});
	drawing_manager_trim.setMap(map);
	//--- Overlay button events
	google.maps.event.addDomListener(document.getElementById("trim-polygon"), 'click', function() {
		clickTrimOverlayButton(google.maps.drawing.OverlayType.POLYGON);
	});
	google.maps.event.addDomListener(document.getElementById("trim-rectangle"), 'click', function() {
		clickTrimOverlayButton(google.maps.drawing.OverlayType.RECTANGLE);
	});
	google.maps.event.addListener(drawing_manager_trim, 'polygoncomplete', function(polygon) {
		trimData(polygon, 'polygon');
		polygon.setMap(null);
		drawing_manager_trim.setDrawingMode(null);
	});
	google.maps.event.addListener(drawing_manager_trim, 'rectanglecomplete', function(rectangle) {
		trimData(rectangle, 'rectangle');
		rectangle.setMap(null);
		drawing_manager_trim.setDrawingMode(null);
	});
	function clickTrimOverlayButton(overlay_type) {
		/* This function selects the current overlay drawing mode
		 * if no other mode is selected. It clears the mode
		 * and any overlay if the same mode is selected.
		 * It clears overlays and switches overlay mode if a
		 * different mode is selected.
		 */

		if (drawing_manager_trim.drawingMode == overlay_type) {
			// Same drawing mode was selected
			drawing_manager_trim.setDrawingMode(null);
		} else {
			// No drawing mode was selected or different mode is selected
			drawing_manager_trim.setDrawingMode(overlay_type);
		}
	}
	//-----
});	