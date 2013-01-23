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

	/* URLs for the three APIs */
	API_TEMPLATE_URL = 'http://brain.isi.edu:4000/api/v1/grid/template/';
	API_GRID_URL = 'http://brain.isi.edu:4000/api/v1/grid/data/';

	/* Global variables */
	var drawing_manager;
	var base_selection = {};
	var view_selection = {};
	var base_overlay = {};
	var view_overlay = {};
	
	var base_dates = [];
	var view_dates = [];
	
	var base_data;
	var view_data;
	
	var base_or_view = null;
	
	
	var base_cell_status = {};
	// To store status of each grid; selected/not-selected : 1/0
	var view_cell_status = {};
	var multi_select_set = false;
	
	var chart_data = [{
		name: 'Base',
		data: []
	}, {
		name: 'View',
		data: []
	}];
	//

	/* OnLoad process */
	initializeDrawingManager();
	$('#multi-date').multiDatesPicker({
		dateFormat : "yy-m-dd"
	});
	
	$('#graph-panel').toggle();
	google.maps.event.addDomListener(document.getElementById('graph-panel-button'), 'click', function() {
		$('#graph-panel').toggle();
	});
	$('#graph-panel-button').trigger('click');
	renderChart();
	
	//-----

	/* Event listners */
	google.maps.event.addDomListener(document.getElementById('load-button'), 'click', loadButtonClick);
	google.maps.event.addDomListener(document.getElementById('base-button'), 'click', baseButtonClick);
	google.maps.event.addDomListener(document.getElementById('view-button'), 'click', viewButtonClick);
	google.maps.event.addDomListener(document.getElementById('clear-button'), 'click', clearButtonClick);
	google.maps.event.addListener(drawing_manager, 'rectanglecomplete', function(rectangle) {
		overlayDrawn(rectangle);
	});
	google.maps.event.addDomListener(document.getElementById('plot-button'), 'click', function() {
		updateData();
		
	});

	/* Grid styling */
	var base_selected = {
		strokeColor : "blue",
		strokeOpacity : 0.7,
		strokeWeight : 0.5,
		fillColor : "blue",
		fillOpacity : 0.25,
	};
	var view_selected = {
		strokeColor : "red",
		strokeOpacity : 0.7,
		strokeWeight : 0.5,
		fillColor : "red",
		fillOpacity : 0.25,
	};

	/* Function listing */
	function initializeDrawingManager() {
	/* This function initalizes the drawing manager. The Drawing
	* panel is however not shown on map.
	*/
	// Drawing Manager
	drawing_manager = new google.maps.drawing.DrawingManager({
		drawingMode : null, // No initial drawing mode
		drawingControl : false, // Do not display drawing controls
		drawingControlOptions : {
			drawingModes : [google.maps.drawing.OverlayType.RECTANGLE]
		},
	});
	drawing_manager.setMap(map);
}
	
	function loadButtonClick() {
		$('#load-button').button('loading');
		//loadGridForLocation($('#location-list option:selected').val());
	}

	function baseButtonClick() {
		if (base_or_view == null) {
			drawing_manager.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE);
			if(base_dates.length !=0 ) {
				$('#multi-date').multiDatesPicker({
					addDates: base_dates
				});
			}
			
			base_or_view = 'base';
			$('#base-button').button('toggle');
		} else if (base_or_view == 'base') {
			drawing_manager.setDrawingMode(null);
			base_dates = $('#multi-date').multiDatesPicker('getDates');
			$('#multi-date').multiDatesPicker('resetDates');
			
			base_or_view = null;
			$('#base-button').button('toggle');
		} else if (base_or_view == 'view') {
			$('#view-button').button('toggle');
			view_dates = $('#multi-date').multiDatesPicker('getDates');
			$('#multi-date').multiDatesPicker('resetDates');
			if(base_dates.length !=0 ) {
				$('#multi-date').multiDatesPicker({
					addDates: base_dates
				});
			}
			
			base_or_view = 'base';
			$('#base-button').button('toggle');
		}
	}

	function viewButtonClick() {
		if (base_or_view == null) {
			drawing_manager.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE);
			if(view_dates.length !=0 ) {
				$('#multi-date').multiDatesPicker({
					addDates: view_dates
				});
			}
			
			base_or_view = 'view';
			$('#view-button').button('toggle');
		} else if (base_or_view == 'view') {
			drawing_manager.setDrawingMode(null);
			view_dates = $('#multi-date').multiDatesPicker('getDates');
			$('#multi-date').multiDatesPicker('resetDates');
			
			base_or_view = null;
			$('#view-button').button('toggle');
		} else if (base_or_view == 'base') {
			$('#base-button').button('toggle');
			base_dates = $('#multi-date').multiDatesPicker('getDates');
			$('#multi-date').multiDatesPicker('resetDates');
			if(view_dates.length !=0 ) {
				$('#multi-date').multiDatesPicker({
					addDates: view_dates
				});
			}
			
			base_or_view = 'view';
			$('#view-button').button('toggle');
		}
	}
	
	function overlayDrawn(rectangle) {
		if(base_or_view == 'base') {
			var new_bounds = [rectangle.getBounds().getSouthWest().lat(), rectangle.getBounds().getSouthWest().lng(), rectangle.getBounds().getNorthEast().lat(), rectangle.getBounds().getNorthEast().lng()];
			var last_prop = 0;
			for(last_prop in base_selection);
			base_selection[Number(last_prop) + 1] = new_bounds;
			rectangle.setOptions(base_selected);
			base_overlay[Number(last_prop) + 1] = rectangle;
			google.maps.event.addDomListener(base_overlay[Number(last_prop) + 1], 'click', function() {
				deleteBaseOverlay(Number(last_prop) + 1);
			});
		}
		else if(base_or_view == 'view') {
			var new_bounds = [rectangle.getBounds().getSouthWest().lat(), rectangle.getBounds().getSouthWest().lng(), rectangle.getBounds().getNorthEast().lat(), rectangle.getBounds().getNorthEast().lng()];
			var last_prop = 0;
			for(last_prop in view_selection);
			view_selection[Number(last_prop) + 1] = new_bounds;
			rectangle.setOptions(view_selected);
			view_overlay[Number(last_prop) + 1] = rectangle;
			google.maps.event.addDomListener(view_overlay[Number(last_prop) + 1], 'click', function() {
				deleteViewOverlay(Number(last_prop) + 1);
			});
		}
		else {
			rectangle.setMap(null);
		}
		//drawing_manager.setDrawingMode(null);
	}
	
	function deleteBaseOverlay(id) {
		delete base_selection[id];
		base_overlay[id].setMap(null)
	}
	
	function deleteViewOverlay(id) {
		delete view_selection[id];
		view_overlay[id].setMap(null)
	}
	
	function clearButtonClick() {
		$.each(base_overlay, function(i, rectangle) {
			rectangle.setMap(null);
		})
		$.each(view_overlay, function(i, rectangle) {
			rectangle.setMap(null);
		})
		
		$('#multi-date').multiDatesPicker('resetDates');
		
		if(base_or_view == 'base') {
			$('#base-button').button('toggle');
		}
		else if(base_or_view == 'view') {
			$('#view-button').button('toggle');
		}
		
		base_or_view = null;
		base_selection = [];
		view_selection = [];
		base_overlay = [];
		view_overlay = [];
		base_dates = [];
		view_dates = [];
		
		base_data = null;
		view_data = null;
	}
	
	function updateData() {
		var base_query = makeBaseQuery();
		var view_query = makeViewQuery();
		
		console.log(base_query);
		console.log(view_query);
	}
	
	function makeBaseQuery() {
		query_string = '?';
		query_string += 'location_id=' + $('#location-list option:selected').val();
		var arr_selection = [];
		$.each(base_selection, function(i, value) {
			arr_selection.push(value);
		});
		query_string += '&selection=' + $.toJSON(arr_selection);
		if(base_or_view == 'base') {
			base_dates = $('#multi-date').multiDatesPicker('getDates');
		}
		query_string += '&dates=' + $.toJSON(base_dates);
		
		return query_string;
	}
	
	function makeViewQuery() {
		query_string = '?';
		query_string += 'location_id=' + $('#location-list option:selected').val();
		var arr_selection = [];
		$.each(view_selection, function(i, value) {
			arr_selection.push(value);
		});
		query_string += '&selection=' + $.toJSON(arr_selection);
		if(base_or_view == 'view') {
			view_dates = $('#multi-date').multiDatesPicker('getDates');
		}
		query_string += '&dates=' + $.toJSON(view_dates);
		
		return query_string;
	}
	
	
	

	function plotButtonClick() {
		$('#calc-button').button('loading');
		$('#calc-button').button('...');
        getBaseData();
		//getViewData();	//TODO better way of ajax execution 
		
		/*
		setTimeout(function() {
			console.log($.toJSON(chart_data));
			renderChart(chart_data);
			$('#calc-button').button('reset');
		}, 2000);
		*/
	}
	
	/*
	function plotButtonClick() {
		//console.log($.toJSON(chart_data));
		renderChart(chart_data);
	}
	*/
	
	function getBaseData() {
		var query_string = "";
		query_string = query_string + '?' + getDateQuery('base');
		query_string = query_string + '&ids=' + getCellQuery(base_cell_status);
		
		console.log(API_GRID_URL + query_string);
		$.getJSON(API_GRID_URL + query_string, function(data) {
			var vector = averageAllCells(data);
			vector = splitAndAvgByDay(vector);
			if($('#normalize option:selected').val() == '0') {
				//console.log('no norm');
			}
			else if($('#normalize option:selected').val() == '1') {
				vector = maxNormalize(vector);
				//console.log('max norm');
			}
			else if($('#normalize option:selected').val() == '2') {
				vector = areaNormalize(vector);
				//console.log('area norm');
			}
			
			chart_data[0].data = loseKeys(vector);
			
			// TODO Better way for ajax execution
			getViewData();
		});
	}
	
	function getViewData() {
		var query_string = "";
		query_string = query_string + '?' + getDateQuery('view');
		query_string = query_string + '&ids=' + getCellQuery(view_cell_status);
		
		console.log(API_GRID_URL + query_string);
		$.getJSON(API_GRID_URL + query_string, function(data) {
			var vector = averageAllCells(data);
			vector = splitAndAvgByDay(vector);
			if($('#normalize option:selected').val() == '0') {
				//console.log('no norm');
			}
			else if($('#normalize option:selected').val() == '1') {
				vector = maxNormalize(vector);
				//console.log('max norm');
			}
			else if($('#normalize option:selected').val() == '2') {
				vector = areaNormalize(vector);
				//console.log('area norm');
			}
			
			chart_data[1].data = loseKeys(vector);
			
			// TODO Better way for ajax execution
			//console.log($.toJSON(chart_data));
			renderChart();
			$('#calc-button').button('reset');
			//
		});
	}
	
	function renderChart() {
		chart = new Highcharts.Chart({
            chart: {renderTo: "graph-canvas", type: 'area'},
            title: {text: ''},
            xAxis: {title: {text: '24 hours of a day'}, categories: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]},
            yAxis: {title: {text: 'Tweet count'}},
            legend: {layout: 'vertical',align: 'right',verticalAlign: 'middle',},
            series: chart_data
		});
	}

	function getDateQuery(which) {
		var date_query = "";
		if(which == 'base') {
			var from_date = new Date($("#base-from-date").val());	
		}
		else {
			var from_date = new Date($("#view-from-date").val());
		}
		var to_date = new Date(from_date);
		to_date.setDate(to_date.getDate() + Number($('#base-date-range').val()));
		date_query += "ts_start=" + from_date.getFullYear() + "-" + (from_date.getMonth() + 1) + "-" + from_date.getDate() + "T00:00:00";
		date_query += "&ts_end=" + to_date.getFullYear() + "-" + (to_date.getMonth() + 1) + "-" + to_date.getDate() + "T23:59:59";
		return date_query;
	}

	function getCellQuery(arr) {
		var out = [];
		$.each(arr, function(id, val) {
			if (val == 1) {
				out.push(Number(id));
			}
		});
		return $.toJSON(out);
	}

	// MATH tools
	function averageAllCells(data) {
		if(data.length != 1) {
			for(var i=0; i<data[0].data.length; i++) {
				for(var j=1; j<data.length; j++) {
					data[0].data[i] += data[j].data[i];
				}
			}
		}
		var count = data.length;
		for(var i=0; i<data[0].data.length; i++) {
			data[0].data[i] /= count;
			data[0].data[i] = Number(data[0].data[i].toFixed(3));
		}
		return data[0].data;
	}







	function splitAndAvgByDay(vector) {
		/* Takes a vector of size n, n is a multiple of 24, and converts
		 * to a single vector of length 24 with values averages for each
		 * 24 length vector in 'vector'.
		 */
		if (vector.length == 24) {
			return vector;
		} else {
			var out_vector = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
			var i;

			for ( i = 0; i < vector.length; i++) {
				out_vector[i % 24] = out_vector[i % 24] + vector[i];
			}
			var count = vector.length / 24;
			for ( i = 0; i < out_vector.length; i++) {
				out_vector[i] /= count;
				out_vector[i] = Number(out_vector[i].toFixed(2));
			}
			return out_vector;
		}
	}

	function maxNormalize(vector) {
		var max_num = vector[0];
		for (var i = 1; i < vector.length; i++) {
			if (vector[i] > max_num) {
				max_num = vector[i];
			}
		}
		for ( i = 0; i < vector.length; i++) {
			vector[i] /= max_num;
			vector[i] = Number(vector[i].toFixed(3));
		}
		return vector;
	}

	function areaNormalize(vector) {
		var area = 0;
		for (var i = 0; i < vector.length; i++) {
			area += vector[i];
		}
		for (i = 0; i < vector.length; i++) {
			vector[i] /= area;
			vector[i] = Number(vector[i].toFixed(3));
		}
		return vector;
	}
	
	function loseKeys(vector) {
		var new_vector = [];
		for (var i = 0; i < vector.length; i++) {
			new_vector.push(vector[i]);
		}
		return new_vector;
	}

});
