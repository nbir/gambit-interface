/* GAMBIT Interface
 *
 * Copyright (C) USC Information Sciences Institute
 * Author: Nibir Bora <nbora@usc.edu>
 * URL: <http://cbg.isi.edu/>
 * For license information, see LICENSE
 */
$(function () {
    var light_map_style = [{
        featureType: "all",
        stylers: [{
            saturation: -80,
        }, {
            inverse_lightness: true
        }, {
            "weight": 0.3
        }, ]
    }, {
        featureType: "all",
        elementType: "labels",
        stylers: [{
            visibility: "off"
        }]
    }, {
        featureType: "road",
        stylers: [{
            visibility: "off"
        }]
    }];

    var light_map_road_style = [{
        featureType: "all",
        stylers: [{
            //lightness: 100,
            saturation: -80
        }, {
            inverse_lightness: true
        }, {
            "weight": 0.3
        }, ]
    }, {
        featureType: "all",
        elementType: "labels",
        stylers: [{
            visibility: "off"
        }]
    }];

    var mapOptions = {
        disableDefaultUI: true,
        center: new google.maps.LatLng(34.042988, -118.24791),
        zoom: 10,
        mapTypeIds: [google.maps.MapTypeId.TERRAIN, 'uber_map'],

        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        panControl: true,
        panControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER
        },
        zoomControl: true,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.LARGE,
            position: google.maps.ControlPosition.RIGHT_CENTER
        },
        scaleControl: true,
        scaleControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        streetViewControl: true,
        streetViewControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER
        }
    };
    var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
    map.mapTypes.set('map_style', new google.maps.StyledMapType(light_map_road_style));
    map.setMapTypeId('map_style');


    //--- API urls
    var JSON_URL = "data/";
    //-----

    // Region colors
    var colors = ["#4DAF4A", "#3B3B3B", "#984EA3", "#E41A1C", "#A65628", "#FA71AF", "#FF7F00", "#377EB8"]
    var colors = {
        "77th": "#4DAF4A", //medium green
        "Central": "#A65628", //brown
        "Devonshire": "#984EA3", //purple
        "Foothill": "#2C3B63", //navy blue
        "Harbor": "#3B3B3B", //grey
        "Hollywood": "#FA71AF", //baby pink
        "Mission": "#FF7F00", //orange
        "Newton": "#377EB8", //sky blue
        "North Hollywood": "#E41A1C", //red
        "Northeast": "#8F0A26", //magenta
        "Olympic": "#6A6A32", //dirty green
        "Pacific": "#8CDD2A", //bright green
        "Rampart": "#E49C24", //dark yellow
        "Southeast": "#F8B4C7", //light pink
        "Southwest": "#838270", //olive
        "Topanga": "#46A492", //kelly
        "Van Nuys": "#6C5936", //mud brown
        "West Los Angeles": "#C94949", //some red
        "West Valley": "#DEB497", //skin
        "Wilshire": "#605B78", //light purple
    };

    // LOAD functions
    var loc_data = [];
    var div_list = {};
    var hood_pols = {};

    loadLocation(); // Call first function
    // Load location data

    function loadLocation() {
        $.ajax({
            url: JSON_URL + 'loc_data.json',
            type: 'GET',
            dataType: 'json',
            error: function (data) {
                console.log('Error! loc_data.json');
                console.log(data)
            },
            success: function (data) {
                $.each(data, function (i, location) {
                    var entry = {
                        'name': location['name'],
                        'division': location['division'],
                        'polygon': []
                    };
                    $.each(location['geo']['coordinates'][0], function (i, cord) {
                        entry['polygon'].push(cord);
                    });
                    loc_data.push(entry);

                    div_list[location['division']] = 1;
                });
                //console.log(loc_data);
                console.log('Done loading loc_data.')
                start();
            }
        });
    }

    // PLOT functions
    function start() {
        $("#show-roads").button('toggle');

        plotGangPols();
        listDivisionNames();
    }

    // Plot each gang's polygon
    function plotGangPols() {
        $.each(loc_data, function (h_id, loc) {
            gt_points = [];
            $.each(loc.polygon, function (i, latlng) {
                gt_points.push(new google.maps.LatLng(latlng[0], latlng[1]));
            });
            gt_points.pop();

            hood_pols[h_id] = new google.maps.Polygon({
                paths: gt_points,
                strokeColor: colors[loc['division']],
                //strokeColor: '#3B3B3B',
                strokeOpacity: 1,
                strokeWeight: 1.5,
                fillColor: colors[loc['division']],
                fillOpacity: 0.5
                //zIndex: 10
            });
            hood_pols[h_id].setMap(map);

            google.maps.event.addListener(hood_pols[h_id], 'mouseover', function() {
					$("#label-name").append(loc_data[h_id]['name']);
			});
			google.maps.event.addListener(hood_pols[h_id], 'mouseout', function() {
				$("#label-name").empty();
			});
        });
    }

    function listDivisionNames() {
    	var html = '';
    	$.each(div_list, function(name, v) {
    		html += '<div class="span2" style="background-color:'+ colors[name] +';text-align:center;font-weight:bold;"><p>'+ name +'</p></div>';
    	});
    	$('#div-names').html(html);
    }


    // Show hide roads on map
    var show_roads = true;
    google.maps.event.addDomListener(document.getElementById('show-roads'), 'click', function () {
        $("#show-roads").button('toggle');
        if (show_roads == false) {
            show_roads = true;
            map.mapTypes.set('map_style', new google.maps.StyledMapType(light_map_road_style));
            map.setMapTypeId('map_style');
        } else {
            show_roads = false;
            map.mapTypes.set('map_style', new google.maps.StyledMapType(light_map_style));
            map.setMapTypeId('map_style');
        }
    });

    // Lighten map background
    var map_light = false;
    google.maps.event.addDomListener(document.getElementById('show-light-map'), 'click', function () {
        $("#show-light-map").button('toggle');

        if (map_light == false) {
            map_light = true;
            map.mapTypes.set('map_style', new google.maps.StyledMapType(
                [{
                    featureType: "all",
                    stylers: [{
                        lightness: 100,
                    }]
                }, {
                    featureType: "all",
                    elementType: "labels",
                    stylers: [{
                        visibility: "off"
                    }]
                }, {
                    featureType: "road",
                    stylers: [{
                        visibility: "off"
                    }]
                }]
            ));
            map.setMapTypeId('map_style');
        } else {
            map_light = false;
            if (show_roads == true) {
                map.mapTypes.set('map_style', new google.maps.StyledMapType(light_map_road_style));
                map.setMapTypeId('map_style');
            } else {
                map.mapTypes.set('map_style', new google.maps.StyledMapType(light_map_style));
                map.setMapTypeId('map_style');
            }
        }

    });



});