/* GAMBIT Interface
 *
 * Copyright (C) USC Information Sciences Institute
 * Author: Nibir Bora <nbora@usc.edu>
 * URL: <http://cbg.isi.edu/>
 * For license information, see LICENSE
 */

function initializeToolbar() {
	/* Initializes all elements of the toolbar */
	populateLocationNames();

	assignButtonsToDateFilter();

	initializeDrawingManager();
	assignButtonsToDrawingTool();

	assignOtherButtons();
}

// LOCATION NAMES
function populateLocationNames() {
	/* Gets the list of locations from the API and loads them to the
	* location select list
	*/

	// To collect location center coordinates
	//var temp_var = {};

	var location_api_url = "http://brain.isi.edu:4000/api/v1/location/list";

	$.getJSON(location_api_url, function(data) {
		$.each(data, function(i, location) {

			center_lng = (location.bounding_box[0] + location.bounding_box[2]) / 2;
			center_lat = (location.bounding_box[1] + location.bounding_box[3]) / 2;

			// To collect location center coordinates
			//temp_var[location.id] = [center_lat, center_lng];

			if (location.name == "LACounty") {
				$("#location-list").append('<option selected="selected" value="' + location.id + '">' + location.name + '</option>');
			} else {
				$("#location-list").append('<option value="' + location.id + '">' + location.name + '</option>');
			}
		});
		// To collect location center coordinates
		//console.log(JSON.stringify(temp_var));
	});
}

// LOCATION FILTER TOOL
function assignButtonsToDateFilter() {
	$('#location-list').button();
	$("#location-exact").button();

	$("#date-calendar").button({
		text : false,
		icons : {
			primary : "ui-icon-calendar"
		}
	}).unbind('mouseenter mouseleave');

	$("#from-date").button();
	$("#to-date").button();

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
	}).attr('readonly', 'readonly');

	$("#to-date").datepicker({
		dateFormat : "d M, y",
		maxDate : '0',
		onSelect : function(dateText, inst) {
			if ($("#from-date").val() == "From") {
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
	}).attr('readonly', 'readonly').parent().buttonset();
	;

	$("#location-go").button({
		text : false,
		icons : {
			primary : "ui-icon-play"
		}
	});
}

// DRAW FILTER TOOL
function initializeDrawingManager() {
	/* This function initalizes the drawing manager. The Drawing
	* panel is however not shown on map.
	*/
	// Drawing Manager
	drawing_manager = new google.maps.drawing.DrawingManager({
		drawingMode : null, // No initial drawing mode
		drawingControl : false, // Do not display drawing controls
		drawingControlOptions : {
			drawingModes : [google.maps.drawing.OverlayType.CIRCLE, google.maps.drawing.OverlayType.POLYGON, google.maps.drawing.OverlayType.POLYLINE, google.maps.drawing.OverlayType.RECTANGLE]
		},
	});
	drawing_manager.setMap(map);
}

function assignButtonsToDrawingTool() {
	/* This function assigns buttons to the customs buttons that
	* mimic the api Drawing controls.
	*/
	// Drawing tool button-set
	$("#draw-polygon").button({
		text : false,
		icons : {
			primary : "ui-icon-pencil"
		}
	});

	$("#draw-rectangle").button({
		text : false,
		icons : {
			primary : "ui-icon-circlesmall-plus"
		}
	});

	$("#draw-circle").button({
		text : false,
		icons : {
			primary : "ui-icon-radio-on"
		}
	});

	$("#draw-line").button({
		text : false,
		icons : {
			primary : "ui-icon-minus"
		}
	}).parent().buttonset();

	// Disable circle & polyline
	$("#draw-circle").attr('disabled', true);
	$("#draw-line").attr('disabled', true);
}

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

// OTHER BUTTONS

function assignOtherButtons() {
	$("#side-panel-button").button({
		text : false,
		icons : {
			primary : "ui-icon-comment"
		}
	})
	$("#side-panel").toggle();

	$("#clear-button").button({
		text : false,
		icons : {
			primary : "ui-icon-trash"
		}
	});

	$("#go-button").button({
		text : false,
		icons : {
			primary : "ui-icon-play"
		}
	});
}

function showHideSidePanel() {
	$("#side-panel").toggle();
}
