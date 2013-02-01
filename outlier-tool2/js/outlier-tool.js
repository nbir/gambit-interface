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
	var grid_cells = {};
	var cell_id_list = [];
	// To store NE and SW coordinates of each grid cell
	var base_overlay = {};
	// To store the GoogleMaps overlay object for each grid
	var view_overlay = {};
	var base_cell_status = {};
	// To store status of each grid; selected/not-selected : 1/0
	var view_cell_status = {};
	var base_or_view = null;
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
	assignButtonsToDateFilter();
	$(".various").fancybox({
		fitToView	: false,
		width		: '850px',
		height		: '550px',
		autoSize	: false,
		closeClick	: false,
		openEffect	: 'none',
		closeEffect	: 'none'
	});
	initializeDrawingManager();
	//-----

	/* Event listners */
	google.maps.event.addDomListener(document.getElementById('load-button'), 'click', loadButtonClick);
	google.maps.event.addDomListener(document.getElementById('base-button'), 'click', baseButtonClick);
	google.maps.event.addDomListener(document.getElementById('multi-select-button'), 'click', multiSelectButtonClick);
	google.maps.event.addListener(drawing_manager, 'rectanglecomplete', function(rectangle) {
		multiSelectFrom(rectangle);
		rectangle.setMap(null);
		drawing_manager.setDrawingMode(null);
		multi_select_set = false;
	});
	google.maps.event.addDomListener(document.getElementById('view-button'), 'click', viewButtonClick);
	google.maps.event.addDomListener(document.getElementById('plot-button'), 'click', plotButtonClick);

	/* Grid styling */
	var base_not_selected = {
		strokeColor : "blue",
		strokeOpacity : 0.7,
		strokeWeight : 0.5,
		fillColor : "blue",
		fillOpacity : 0,
	};
	var base_selected = {
		strokeColor : "blue",
		strokeOpacity : 0.7,
		strokeWeight : 0.5,
		fillColor : "blue",
		fillOpacity : 0.25,
	};
	var view_not_selected = {
		strokeColor : "red",
		strokeOpacity : 0.7,
		strokeWeight : 0.5,
		fillColor : "red",
		fillOpacity : 0,
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
		loadGridForLocation($('#location-list option:selected').val());
	}

	function loadGridForLocation(location_id) {
		/* Load all grid information for currently location from the API
		 * and store them locally.
		 */
		$.getJSON(API_TEMPLATE_URL + '?location_id=' + location_id, function(data) {
			$.each(data.cells, function(i, cell) {
				var id = Number(cell.id);
				cell_id_list.push(id);
				var new_box = {// Load grid coordinates
					sw : cell.box[0],
					ne : cell.box[1]
				};
				grid_cells[id] = new_box;

				base_cell_status[id] = 0;
				// Initialize cell status.
				view_cell_status[id] = 0;
			});
			console.log('Loaded!');
			//alert("You're ready to go!");
			
			// TODO better way of ajax call
			plotBaseGrid();
			plotViewGrid();
			
			$('#load-button').button('reset');
		});
	}

	function baseButtonClick() {
		if (base_or_view == null) {
			$('#base-button').button('loading');
			setBaseGrid();
			base_or_view = 'base';
			$('#base-button').button('reset');
			$('#base-button').button('toggle');
		} else if (base_or_view == 'base') {
			removeBaseGrid();
			base_or_view = null;
			$('#base-button').button('toggle');
		} else if (base_or_view == 'view') {
			removeViewGrid();
			$('#view-button').button('toggle');
			$('#base-button').button('loading');
			setBaseGrid();
			base_or_view = 'base';
			$('#base-button').button('reset');
			$('#base-button').button('toggle');
		}
	}

	function viewButtonClick() {
		if (base_or_view == null) {
			$('#view-button').button('loading');
			setViewGrid();
			base_or_view = 'view';
			$('#view-button').button('reset');
			$('#view-button').button('toggle');
		} else if (base_or_view == 'view') {
			removeViewGrid();
			base_or_view = null;
			$('#view-button').button('toggle');
		} else if (base_or_view == 'base') {
			removeBaseGrid();
			$('#base-button').button('toggle');
			$('#view-button').button('loading');
			setViewGrid();
			base_or_view = 'view';
			$('#view-button').button('reset');
			$('#view-button').button('toggle');
		}
	}

	function plotBaseGrid() {
		/* Plot all base cells for current grid, and render selected cells
		 * different from unselected.
		 */
		$.each(grid_cells, function(id, box) {
			base_overlay[id] = new google.maps.Rectangle();
			var ne = new google.maps.LatLng(box.ne[0], box.ne[1]);
			var sw = new google.maps.LatLng(box.sw[0], box.sw[1]);
			var cell_bounds = new google.maps.LatLngBounds(sw, ne);
			if (base_cell_status[id] == 0) {
				base_overlay[id].setOptions(base_not_selected);
			} else {
				base_overlay[id].setOptions(base_selected);
			}
			base_overlay[id].setBounds(cell_bounds);
			//base_overlay[id].setMap(map);
			google.maps.event.addListener(base_overlay[id], 'click', function() {
				clickBaseCell(id);
			});
		});
	}
	
	function setBaseGrid() {
		/* Set current base grid on map.
		 */
		$.each(cell_id_list, function(i, id) {
			base_overlay[id].setMap(map);
		});
	}
	
	function removeBaseGrid() {
		/* Remove current base grid from map.
		 */
		$.each(cell_id_list, function(i, id) {
			base_overlay[id].setMap(null);
		});
	}

	function clickBaseCell(id) {
		if (base_cell_status[id] == 0) {
			base_cell_status[id] = 1;
			base_overlay[id].setOptions(base_selected);
		} else {
			base_cell_status[id] = 0;
			base_overlay[id].setOptions(base_not_selected);
		}
	}

	function plotViewGrid() {
		$.each(grid_cells, function(id, box) {
			view_overlay[id] = new google.maps.Rectangle();
			var ne = new google.maps.LatLng(box.ne[0], box.ne[1]);
			var sw = new google.maps.LatLng(box.sw[0], box.sw[1]);
			var cell_bounds = new google.maps.LatLngBounds(sw, ne);
			if (view_cell_status[id] == 0) {
				view_overlay[id].setOptions(view_not_selected);
			} else {
				view_overlay[id].setOptions(view_selected);
			}
			view_overlay[id].setBounds(cell_bounds);
			//view_overlay[id].setMap(map);
			google.maps.event.addListener(view_overlay[id], 'click', function() {
				clickViewCell(id);
			});
		});
	}
	
	function setViewGrid() {
		$.each(cell_id_list, function(i, id) {
			view_overlay[id].setMap(map);
		});
	}

	function removeViewGrid() {
		$.each(cell_id_list, function(i, id) {
			view_overlay[id].setMap(null);
		});
	}

	function clickViewCell(id) {
		if (view_cell_status[id] == 0) {
			view_cell_status[id] = 1;
			view_overlay[id].setOptions(view_selected);
		} else {
			view_cell_status[id] = 0;
			view_overlay[id].setOptions(view_not_selected);
		}
	}
	
	function multiSelectButtonClick() {
		if(!multi_select_set) {
			drawing_manager.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE);
			multi_select_set = true;
		}
		else {
			drawing_manager.setDrawingMode(null);
			multi_select_set = false;
		}
	}
	
	function multiSelectFrom(rectangle) {
		if(base_or_view != null) {
			$.each(grid_cells, function(id, box) {
				var ne = new google.maps.LatLng(box.ne[0], box.ne[1]);
				var sw = new google.maps.LatLng(box.sw[0], box.sw[1]);
				
				var box_bound = new google.maps.LatLngBounds(sw, ne);
				
				if(box_bound.intersects(rectangle.getBounds())) {
					if(base_or_view == 'base') {
						clickBaseCell(id);
					}
					else if(base_or_view = 'view') {
						clickViewCell(id);
					}
				}
			});
		}
		//clear
	}
	
	// Plot window
	function assignButtonsToDateFilter() {
		$("#base-from-date").datepicker({
			dateFormat : "d M, y",
			minDate : new Date(2012, 11 - 1, 1),
			maxDate : new Date(2012, 11 - 1, 7),
			/*
			onSelect : function(dateText, inst) {
				var from_date = new Date(dateText);
				for(var i=0; i<=6; i++) {
					$('#base_day_'+i).attr('data-toggle', 'button');
					$('#base_day_'+i).append(from_date.getDate());
					from_date.setDate(from_date.getDate() + 1)
				}
			}
			*/
		});

		$("#view-from-date").datepicker({
			dateFormat : "d M, y",
			minDate : new Date(2012, 11 - 1, 1),
			maxDate : new Date(2012, 11 - 1, 7),
			/*
			onSelect : function(dateText, inst) {
				var from_date = new Date(dateText);
				for(var i=0; i<=6; i++) {
					$('#view_day_'+i).attr('data-toggle', 'button');
					$('#view_day_'+i).append(from_date.getDate());
					from_date.setDate(from_date.getDate() + 1)
				}
			}
			*/
		});
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
			renderChart(chart_data);
			$('#calc-button').button('reset');
			//
		});
	}
	
	function renderChart(series_data) {
		chart = new Highcharts.Chart({
            chart: {renderTo: "chart-container", type: 'area'},
            title: {text: ''},
            xAxis: {title: {text: '24 hours of a day'}, categories: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]},
            yAxis: {title: {text: 'Tweet count (normalized to 1)'}},
            series: series_data
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
