/* GAMBIT Interface
*
* Copyright (C) USC Information Sciences Institute
* Author: Nibir Bora <nbora@usc.edu>
* URL: <http://cbg.isi.edu/>
* For license information, see LICENSE
*/

// Body load
$(function() {	initializeMap();

	initializeToolbar();
	addEventListners();

	//changeMapCenter();
});

function addEventListners() {
	/* Adds event listners to IDs */

	// TOOLBAR EVENTS
	google.maps.event.addDomListener(document.getElementById("location-list"), 'change', mapChangeLocation);

	google.maps.event.addDomListener(document.getElementById("draw-polygon"), 'click', function() {
		clickOverlayButton(google.maps.drawing.OverlayType.POLYGON);
	});
	google.maps.event.addDomListener(document.getElementById("draw-rectangle"), 'click', function() {
		clickOverlayButton(google.maps.drawing.OverlayType.RECTANGLE);
	});
	/*
	google.maps.event.addDomListener(document.getElementById("draw-circle"), 'click', function() {
		clickOverlayButton(google.maps.drawing.OverlayType.CIRCLE);
	});
	google.maps.event.addDomListener(document.getElementById("draw-line"), 'click', function() {
		clickOverlayButton(google.maps.drawing.OverlayType.POLYLINE);
	});
	*/
	
	google.maps.event.addDomListener(document.getElementById("button-cluster-markers"), 'click', markerClusterClick);

	google.maps.event.addDomListener(document.getElementById("side-panel-button"), 'click', showHideSidePanel);
	google.maps.event.addDomListener(document.getElementById("clear-button"), 'click', clearButtonClick);
	google.maps.event.addDomListener(document.getElementById("go-button"), 'click', goButtonClick);


	// MAP EVENTS
	// Drawing tool events
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
	google.maps.event.addListener(drawing_manager, 'circlecomplete', function(circle) {
		clearOverlay();
		current_overlay = circle;
		current_overlay_type = google.maps.drawing.OverlayType.CIRCLE;
		drawing_manager.setDrawingMode(null);
	});
	google.maps.event.addListener(drawing_manager, 'polylinecomplete', function(polyline) {
		clearOverlay();
		current_overlay = polyline;
		current_overlay_type = google.maps.drawing.OverlayType.POLYLINE;
		drawing_manager.setDrawingMode(null);
	});
}