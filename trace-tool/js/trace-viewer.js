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

	assignButtonsToDateFilter()
	function assignButtonsToDateFilter() {
		$("#from-date").datepicker({
			dateFormat : "d M, y",
			maxDate : '0',
			onSelect : function(dateText, inst) {
				if ($("#to-date").val() == "") {
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
	}

	//Trace working

	var trace_id_list = {};
	var traces_on_map = {};
	var segments_on_map = {};
	var trace_bounds = {};
	var global_bound = new google.maps.LatLngBounds();

	API_URL = "http://brain.isi.edu:4000/api/v1/trace/filter/";

	google.maps.event.addDomListener(document.getElementById('load-button'), 'click', function() {
		// Query string
		var query_string = "?";
		query_string += "location_id=" + $('#location-list option:selected').val();
		query_string += "&min_k=" + $('#min-points option:selected').val();
		query_string += "&sort=" + $('#trace-order option:selected').val();
		query_string += "&limit=" + $('#no-of-traces').val();
		if ($("#from-date").val() != "") {
			var from_date = new Date($("#from-date").val());
			var to_date = new Date($("#to-date").val());
			query_string += "&dt_start=" + from_date.getFullYear() + "-" + (from_date.getMonth() + 1) + "-" + from_date.getDate();
			query_string += "&dt_end=" + to_date.getFullYear() + "-" + (to_date.getMonth() + 1) + "-" + to_date.getDate();
		}
		console.log(API_URL + query_string);
		
		// Get data from API
		$.getJSON(API_URL + query_string, function(data) {
			$.each(data, function(i, trace) {
				trace_id_list[trace.id] = trace.id;
				traces_on_map[trace.id] = trace;
				
				day_trace=[];
				night_trace=[];
				trace_bounds[trace.id] = new google.maps.LatLngBounds();
				//console.log("clear");
				change_color=false;
				$.each(trace.points, function(i, point) {
					var new_date = getActualTime(point[3], trace.location_id);
					//console.log(new_date.getHours());
					if(!change_color && new_date.getHours() >= 18) {	// TODO: Add hour range from 12am to 5am
						change_color=true;
						day_trace.push(new google.maps.LatLng(point[1], point[2]));
					}
					
					if(!change_color) {	//Day
						day_trace.push(new google.maps.LatLng(point[1], point[2]));
					}
					else {	//Night
						night_trace.push(new google.maps.LatLng(point[1], point[2]));
					}
					trace_bounds[trace.id].extend(new google.maps.LatLng(point[1], point[2]));
					global_bound.extend(new google.maps.LatLng(point[1], point[2]));
				});
				
				//Plot trace
				traces_on_map[trace.id].day = new google.maps.Polyline({
					strokeColor : 'blue',
					strokeOpacity : 1.0,
					strokeWeight : 2
				});
				traces_on_map[trace.id]["day"].setPath(day_trace);
				//traces_on_map[trace.id]["day"].setMap(map);
				
				traces_on_map[trace.id].night = new google.maps.Polyline({
					strokeColor : 'red',
					strokeOpacity : 1.0,
					strokeWeight : 2
				});
				traces_on_map[trace.id]["night"].setPath(night_trace);
				//traces_on_map[trace.id]["night"].setMap(map);
				
				$("#trace-list").append('<option value="' + trace.id + '">' + trace.id + '</option>');
			});
		});
	});
	
	google.maps.event.addDomListener(document.getElementById('show-button'), 'click', function() {
		if($('#trace-list option:selected').val() == '') {
			console.log("empty");
		}
		if($('#trace-list option:selected').val() != '' && traces_on_map[$('#trace-list option:selected').val()]) {
			if(traces_on_map[$('#trace-list option:selected').val()]["day"].getMap() == null){
				trace_id = $('#trace-list option:selected').val();
				traces_on_map[trace_id]["day"].setMap(map);
				traces_on_map[trace_id]["night"].setMap(map);
			}
		}
		if(traces_on_map[$('#trace-list option:selected').val()])
		{
			map.fitBounds(trace_bounds[$('#trace-list option:selected').val()]);
		}
	});
	
	google.maps.event.addDomListener(document.getElementById('show-all-button'), 'click', function() {
		var is_empty = true;
		$.each(trace_id_list, function(i, trace_id) {
			is_empty = false;
			if(traces_on_map[trace_id]["day"].getMap() == null) {
				traces_on_map[trace_id]["day"].setMap(map);
				traces_on_map[trace_id]["night"].setMap(map);
			}
		});
		if(!is_empty) {
			map.fitBounds(global_bound);
		}
	});


	google.maps.event.addDomListener(document.getElementById('clear-content-button'), 'click', function() {
		$("#trace-list").empty();
	});


	google.maps.event.addDomListener(document.getElementById('clear-map-button'), 'click', function() {
		clearAllContent();
		resetVariables();
	});
	
	function clearAllContent() {
		$("#trace-list").empty();
		$.each(trace_id_list, function(i, trace_id) {
			traces_on_map[trace_id]["day"].setMap(null);
			traces_on_map[trace_id]["night"].setMap(null);
		});
	}
	
	function resetVariables() {
		trace_id_list = {};
		traces_on_map = {};
		segments_on_map = {};
		trace_bounds = {};
		global_bound = new google.maps.LatLngBounds();
	}
	
	// Time conversion
	function getActualTime(timestamp, location_id) {
		var utc_offsets = {
			6 : -480,
			8 : 0,
			11 : -300
		};
		
		var non_utc_date = new Date(timestamp);
		non_utc_date.setMinutes(non_utc_date.getMinutes() + utc_offsets[location_id]);
		return non_utc_date;
	}

});
