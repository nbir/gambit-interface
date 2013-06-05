/* GAMBIT Interface
*
* Copyright (C) USC Information Sciences Institute
* Author: Nibir Bora <nbora@usc.edu>
* URL: <http://cbg.isi.edu/>
* For license information, see LICENSE
*/

$(function() {
	$('#region-tabs a[href="#hbk"]').click(function (e) {
		loadPlotsFor('hbk/');
	});
	$('#region-tabs a[href="#west-la"]').click(function (e) {
		loadPlotsFor('west-la/');
	});
	$('#region-tabs a[href="#south-la"]').click(function (e) {
		loadPlotsFor('south-la/');
	});
	$('#region-tabs a[href="#south-bay"]').click(function (e) {
		loadPlotsFor('south-bay/');
	});

	// Load plots for selected path - initiator
	function loadPlotsFor(path) {
    $("#plot-container").empty();
    loadUserIDs(path);
	}

	// Load user IDs for selected path
	var JSON_URL = "data/";
	var user_ids = [];
	function loadUserIDs(path) {
		$.ajax({
			url: JSON_URL + path + 'user_list.json',
			type: 'GET',
			dataType: 'json',
			error: function(data) {
				console.log('Error! user_list.json');
				console.log(data);
			},
			success: function(data) {
				user_ids = data;
				//console.log(data);
				//console.log('Done loading user_list.')
				showImages(path);
			}
		});
	}

	// Display plots for selected path
	function showImages(path) {
		$.each(user_ids, function(i, user_id) {
			var img_tag = '<img class="span3" style="margin:0;padding:0;float:left;" src="data/' + path + user_id + '.png" />'
			$("#plot-container").append(img_tag);
		});
	}

});

