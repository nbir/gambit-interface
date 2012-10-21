# Gambit Interface

GUI for Gambit
| [CBG](http://cbg.isi.edu) ISI, University of Southern California, Los Angeles, CA

---
### License

Copyright (c) 2012 Nibir Bora, Vladimir Zaytsev

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---
### Contributors

* [Nibir Bora](http://nibir.me/) | <nbora@usc.edu>
* [Vladimir Zaytsev](http://zvm.me/) | <zaytsev@usc.edu>

---

## File structure

	..
	|-	index.html
	|	
	|-	css
	|	|-	style-document.css
	|	|-	style-toolbar.css
	|	|-	style-tweet-callout.css
	|
	|-	img
	|	|-	red-dot.png
	|
	|-	js
	|	|-	event-listners.js
	|	|-	filter-functions.js
	|	|-	map-functions.js
	|	|-	map-globals.js
	|	|-	toolbar-functions.js
	|-	jquery
		|-	//jQuery files

---
## Event structure

	ON window_load:
     	~INITIALIZE global variables
     	INITIALIZE map
     	INITIALIZE toolbar
     	ADD event_listners
     	SET map_center


	ON location_change:
     	CLEAR markers
     	CLEAR overlays
     	EMPTY tweet_list
     	EMPTY side_panel
     	SET map_center


    ON from_date SET:
     	IF to_date IS NOT SET:
       		SET to_date = from_date + 2 || to_date = current_date
     	ELSE, IF to_date IS SET:
          	IF to_date < from_date:
               SET to_date = from_date + 2 || to_date = current_date  

	ON to_date SET:
     	IF from_date IS NOT SET:
          	SET from_date = to_date - 2
     	ELSE, IF from_date IS SET:
          	IF to_date < from_date:
               SET to_date = from_date + 2 || to_date = current_date

	ON overlay_button CLICK:
     	CLEAR overlays
     	IF NO drawing_option SELECTED || ANY OTHER drawing_option SELECTED:
          	SET drawing_option
     	IF SAME drawing_option SELECTED
          	SET drawing_option TO null


	ON go_button CLICK:
    	IF tweet_list IS EMPTY:
          	BUILD query_string FROM SELECTED filters
               ADD from_time
               ADD to_time
               ADD overlay
          	SEND query AND GET results FROM API
          	LOAD global_variables
          	SET markers
          	DELETE overlay
          	LOAD tweets ONTO side_panel

     	ELSE IF tweet_list IS NOT EMPTY
          	IF overlay IS SET:
               TRIM tweet_set OF tweets OUTSIDE overlay
               DELETE overlay
               LOAD tweets ONTO side_panel


	ON user_trace_button CLICK:
    	Create sub_list OF tweets.location OF selected_user ONLY
     	DRAW polyline OF tweets FROM selected_user
     	RESIZE map TO FIT NEW bounds


