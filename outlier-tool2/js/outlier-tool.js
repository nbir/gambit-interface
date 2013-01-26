$(function() {
	var map = initMap('map-canvas', {
		center : [34.0522, -118.2428],
		zoom : 11,
		map_type : 'ROADMAP'
	});

	//--- API URLs
	var API_V2_GRID_CELLDATA = 'http://brain.isi.edu:4002/api/v2/grid/celldata/';
	var API_V2_LOCATION_LIST = "http://brain.isi.edu:4002/api/v2/location/list";
	//-----


	//--- Populate locations
	var location_bounds = {};

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


	//--- BASE/VIEW select
	var base_overlay = {};
	var view_overlay = {};

	var base_dates = [];
	var view_dates = [];
	
	var base_or_view = null;

	// Date Picker
	$('#multi-date').multiDatesPicker({
		dateFormat : "yy.m.dd"
	});

	// Drawing manager
	var drawing_manager = new google.maps.drawing.DrawingManager({
		drawingMode : null, // No initial drawing mode
		drawingControl : false, // Do not display drawing controls
		drawingControlOptions : {
			drawingModes : [google.maps.drawing.OverlayType.RECTANGLE]
		},
	});
	drawing_manager.setMap(map);
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

	// Switch between BASE and VIEW
	google.maps.event.addDomListener(document.getElementById('base-button'), 'click', function() {
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
	});
	google.maps.event.addDomListener(document.getElementById('view-button'), 'click', function() {
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
	});

	// Area selection
	google.maps.event.addListener(drawing_manager, 'rectanglecomplete', function(rectangle) {
		if(base_or_view == 'base') {
			var last_prop = 0;
			for(last_prop in base_overlay);
			rectangle.setOptions(base_selected);
			base_overlay[Number(last_prop) + 1] = rectangle;
			google.maps.event.addDomListener(base_overlay[Number(last_prop) + 1], 'click', function() {
				deleteBaseOverlay(Number(last_prop) + 1);
			});
		}
		else if(base_or_view == 'view') {
			var last_prop = 0;
			for(last_prop in view_overlay);
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
	});
	function deleteBaseOverlay(id) {
		base_overlay[id].setMap(null);
		delete base_overlay[id];
	}
	
	function deleteViewOverlay(id) {
		view_overlay[id].setMap(null);
		delete view_overlay[id];
	}
	// Clear
	google.maps.event.addDomListener(document.getElementById('clear-button'), 'click', function() {
		$.each(base_overlay, function(i, rectangle) {
			if(rectangle) {
				rectangle.setMap(null);
			}
		})
		$.each(view_overlay, function(i, rectangle) {
			if(rectangle) {
				rectangle.setMap(null);
			}
		})
		
		$('#multi-date').multiDatesPicker('resetDates');
		
		if(base_or_view == 'base') {
			$('#base-button').button('toggle');
		}
		else if(base_or_view == 'view') {
			$('#view-button').button('toggle');
		}
		
		base_or_view = null;
		base_overlay = [];
		view_overlay = [];
		base_dates = [];
		view_dates = [];
		
		base_data = null;
		view_data = null;

		chart_data[0].data = [];
		chart_data[1].data = [];
		renderChart(chart_data);
	});
	//-----


	//--- Plot panel
	$("#plot-panel").toggle();
	google.maps.event.addDomListener(document.getElementById("show-plot-button"), 'click', function() {
		$("#plot-panel").toggle();
	});
	//-----


	//--- Query API and store data
	var base_data;
	var view_data;

	function buildQuery(which) {
		var query_string = {};
		query_string['location_id'] = Number($('#location-list option:selected').val());
		query_string['bbox'] = '';
		if(which == 'base') {
			$.each(base_overlay, function(i, rectangle) {
				if(rectangle) {
					query_string['bbox'] += rectangle.getBounds().getSouthWest().toUrlValue() + ',' + rectangle.getBounds().getNorthEast().toUrlValue() + ',';
				}
			});
		}
		else if(which == 'view') {
			$.each(view_overlay, function(i, rectangle) {
				if(rectangle) {
					query_string['bbox'] += rectangle.getBounds().getSouthWest().toUrlValue() + ',' + rectangle.getBounds().getNorthEast().toUrlValue() + ',';
				}
			});
		}
		query_string['bbox'] = query_string['bbox'].substring(0, query_string['bbox'].length - 1);

		if(which == 'base') {
			if(base_or_view == 'base') {
				base_dates = $('#multi-date').multiDatesPicker('getDates');
			}
			query_string['days'] = $.toJSON(base_dates);
		}
		else if(which == 'view') {
			if(base_or_view == 'view') {
				view_dates = $('#multi-date').multiDatesPicker('getDates');
			}
			query_string['days'] = $.toJSON(view_dates);
		}
		query_string['td'] = 30;

		return query_string;
	}

	google.maps.event.addDomListener(document.getElementById('load-button'), 'click', function() {
		$("#load-button").attr('disabled', true);
		//base call
		console.log(buildQuery('base'));
		$.ajax({
			url: API_V2_GRID_CELLDATA,
			data: buildQuery('base'),
			type: 'GET',
			dataType: 'json',
			error: function(data) {
				console.log('Error! APIv2 grid::celldata');
				console.log(data);

				$("#load-button").attr('disabled', false);
			},
			success: function(data) {
				base_data = data;
				console.log(base_data.length);
				$("#load-button").attr('disabled', false);
			}
		});
		//View call
		console.log(buildQuery('view'));
		$.ajax({
			url: API_V2_GRID_CELLDATA,
			data: buildQuery('view'),
			type: 'GET',
			dataType: 'json',
			error: function(data) {
				console.log('Error! APIv2 grid::celldata');
				console.log(data);

				$("#load-button").attr('disabled', false);
			},
			success: function(data) {
				view_data = data;
				console.log(view_data.length);
				$("#load-button").attr('disabled', false);
			}
		});	

	});
	//-----

	//--- CHART data process/plot
	var chart_data = [{
		name: 'Base',
		data: []
	}, {
		name: 'View',
		data: []
	}];
	renderChart(chart_data);

	// Math operations
	function combineVectors(matrix) {
		var out_vector = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		var count = 0;

		$.each(matrix, function(i, vector) {
			for (i = 0; i < vector.length; i++) {
				out_vector[i] += vector[i];
			}
			count += 1;
		});
		for (i = 0; i < out_vector.length; i++) {
			out_vector[i] /= count;
		}
		return out_vector;
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
	//--- Plot functions
	function renderChart(series_data) {
		chart = new Highcharts.Chart({
	    chart: {renderTo: "plot-canvas", type: 'area'},
	    title: {text: ''},
	    xAxis: {title: {text: '24 hours of a day'}, categories: [1,'',2,'',3,'',4,'',5,'',6,'',7,'',8,'',9,'',10,'',11,'',12,'',13,'',14,'',15,'',16,'',17,'',18,'',19,'',20,'',21,'',22,'',23,'',24,'']},
	    yAxis: {title: {text: 'Tweet count (normalized to 1)'}},
	    series: series_data
		});
	}
	google.maps.event.addDomListener(document.getElementById('norm-max'), 'click', function() {
		if(base_data && view_data) {
			chart_data[0].data = loseKeys(maxNormalize(combineVectors(base_data)));
			chart_data[1].data = loseKeys(maxNormalize(combineVectors(view_data)));
			renderChart(chart_data);
		}
	});
	google.maps.event.addDomListener(document.getElementById('norm-area'), 'click', function() {
		if(base_data && view_data) {
			chart_data[0].data = loseKeys(areaNormalize(combineVectors(base_data)));
			chart_data[1].data = loseKeys(areaNormalize(combineVectors(view_data)));
			renderChart(chart_data);
		}
	});
	google.maps.event.addDomListener(document.getElementById('norm-none'), 'click', function() {
		if(base_data && view_data) {
			chart_data[0].data = loseKeys(combineVectors(base_data));
			chart_data[1].data = loseKeys(combineVectors(view_data));
			renderChart(chart_data);
		}
	});
	//-----
});
