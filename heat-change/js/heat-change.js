/* GAMBIT Interface
*
* Copyright (C) USC Information Sciences Institute
* Author: Nibir Bora <nbora@usc.edu>
* URL: <http://cbg.isi.edu/>
* For license information, see LICENSE
*/

$(function() {
	//--- MAP
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
	//-----

	//--- API URLs
	var API_V2_LOCATION_LIST = "http://brain.isi.edu:4002/api/v2/location/list";
	var API_V2_TWEET_FILTER = "http://brain.isi.edu:4002/api/v2/tweet/filter";
	//-----


	//--- Populate locations
	var location_bounds = {};

	$("#show-button").attr('disabled', true);
	$.ajax({
		url: API_V2_LOCATION_LIST,
		type: 'GET',
		data: {
			class: 'city',
		},
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

	//--- Datepicker
	$("#from-date").datepicker({
		dateFormat : "d M, y",
		maxDate : '0',
	});
	//-----

	//----- DATA variables
	var q_ts_bounds = {};
	var data = {};

	//--- Execute
	google.maps.event.addDomListener(document.getElementById('play-button'), 'click', function() {
		var from_date = new Date($("#from-date").val());
		//from_date.setHours(0,0,0,0);
		//console.log(from_date.toISOString());

		for(var i=1; i<=20; i++) {
			var ts_start = from_date.toISOString();
			ts_start = ts_start.substring(0, ts_start.length - 5)
			
			var to_date = new Date(from_date.getTime());
			to_date.setSeconds(to_date.getSeconds()+21599);
			var ts_end = to_date.toISOString();
			ts_end = ts_end.substring(0, ts_end.length - 5)
			
			q_ts_bounds[i] = {
				ts_start: ts_start,
				ts_end: ts_end,
				label: from_date.toDateString() + ', ' + from_date.toLocaleTimeString(),
			}
			from_date.setHours(from_date.getHours()+6);
		}

		show(1);
	});
	//------


	//--- Show function
	var now_showing = null;
	var heatmap = null;

	function show(id) {
		if(data[id] == null) {
			//if no data for id, initiate query
			$.ajax({
				success: function() {
					query(id);
				}
			});

			//call on self
			console.log('Waiting, to show ' + id + '.');
			setTimeout(function () {
				show(id);
			}, 1000);
		}
		else {
			//show heatmap
			$("#label-ts").empty();
			$("#label-ts").append(q_ts_bounds[id]['label']);
			$("#label-day").empty();
			$("#label-day").append('Day ' + (Math.floor((id-1)/4) + 1) + ', Quarter ' + ((id-1)%4 + 1));

			if(heatmap) {
				//heatmap.setMap(null);
				heatmap.setData(data[id]);
			}
			else {
				heatmap = new google.maps.visualization.HeatmapLayer({
				  data: data[id],
				  radius: 25,
					gradient: [
						'rgba(0, 255, 255, 0)',
						'rgba(0, 255, 255, 1)',
						'rgba(0, 191, 255, 1)',
						'rgba(0, 127, 255, 1)',
						'rgba(0, 63, 255, 1)',
						'rgba(0, 0, 255, 1)',
						'rgba(0, 0, 223, 1)',
						'rgba(0, 0, 191, 1)',
						'rgba(0, 0, 159, 1)',
						'rgba(0, 0, 127, 1)',
						'rgba(63, 0, 91, 1)',
						'rgba(127, 0, 63, 1)',
						'rgba(191, 0, 31, 1)',
						'rgba(255, 0, 0, 1)'],
				});
				heatmap.setMap(map);
			}
			console.log('Now showing ' + id + '.');
			now_showing = id;
			
			// delete id-3 data
			//if(idInBounds(id-3) && data[id-3] != null) {
				//delete data[id-3];
			//}

			// initiate next show
			setTimeout(function () {
				if(idInBounds(id+1)) {
					show(id+1);
				}
			}, 2000);
		}
	}
	//--- Query function
	var now_querying = null;

	function query(id) {
		if (now_querying != null) {
			// wait if one query in progress
			console.log('Waiting, to query ' + id + '.');
			setTimeout(function () {
				query(id);
			}, 1000);
		}
		else {
			if(idInBounds(id) && id <= (now_showing+4)) {
				if(data[id] == null) {
					now_querying = id;
					// API CALL 
					var query_string = {
						geo_only: 1,
						location_id: Number($('#location-list option:selected').val()),
						ts_start: q_ts_bounds[id]['ts_start'],
						ts_end: q_ts_bounds[id]['ts_end'],
					};
					//console.log(query_string);
					console.log('Now querying ' + id + '.');
					$.ajax({
						url: API_V2_TWEET_FILTER,
						data: query_string,
						type: 'GET',
						dataType: 'json',
						error: function(data) {
							console.log('Error! APIv2 tweet::filter');
							console.log(data)
						},
						success: function(json_response) {
							data[id] = [];
							$.each(json_response, function(i, latlng) {
								data[id].push(new google.maps.LatLng(latlng[0], latlng[1]));
							});

							now_querying = null;
							console.log('Completed querying ' + id + '.');

							if(idInBounds(id+1)) {
								query(id+1);
							}
						}
					});
				}
				else {
					query(id+1);	// initial design say inside ajax
				}
			}
		}
	}
	//-----
	function idInBounds(id) {
		if(id>=1 && id<=20) {
			return true;
		}
		return false;
	}
	//-----


	//--- Clear
	google.maps.event.addDomListener(document.getElementById('clear-button'), 'click', function() {
		if(heatmap) {
			heatmap.setMap(null);
			heatmap=null;
		}
		now_showing = null;
		q_ts_bounds = {};
		data = {};
		now_querying = null;

		$("#label-ts").empty();
		$("#label-ts").append('Date/time of heatmap');
		$("#label-day").empty();
		$("#label-day").append('Day#/quarter#');
	});
	//-----

});	





	//----- AJAX FLIP -----//
	/*
	var test_var = 1;
	test_flip();
	test(1);

	function test(id) {
		$.ajax({
			success: function() {
				if(test_var==1) {
					setTimeout(function () {
						console.log(id + ' trying after 1 sec');
						test(id);
					}, 1000);
				}
				else
				{
					console.log(id + ' done');
					test(id+1);
				}
			}
		});
	}

	function test_flip() {
		$.ajax({
			success: function() {
				setTimeout(function () {
					console.log('flip test_var');
					if(test_var == 0) {
						test_var = 1;
					}
					else {
						test_var = 0;
					}
					test_flip();
				}, 3000);
			}
		});
	}
	*/
	//-----  -----//