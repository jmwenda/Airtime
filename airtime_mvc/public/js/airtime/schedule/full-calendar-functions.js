/**
*
*   Full Calendar callback methods.
*
*/

function scheduleRefetchEvents(json) {
    if(json.show_error == true){
        alert($.i18n._("The show instance doesn't exist anymore!"));
    }
    if(json.show_id) {
        var dialog_id = parseInt($("#add_show_id").val(), 10);

        //if you've deleted the show you are currently editing, close the add show dialog.
        if (dialog_id === json.show_id) {
            $("#add-show-close").click();
        }
    }
    $("#schedule_calendar").fullCalendar( 'refetchEvents' );
}

function openAddShowForm() {
     if($("#add-show-form").length == 1) {
        if( ($("#add-show-form").css('display')=='none')) {
            $("#add-show-form").show();
            var windowWidth = $(window).width();
            // margin on showform are 16 px on each side
            var calendarWidth = 100-(($("#schedule-add-show").width() + (16 * 4))/windowWidth*100);
            var widthPercent = parseInt(calendarWidth)+"%";
            $("#schedule_calendar").css("width", widthPercent);

            // 200 px for top dashboard and 50 for padding on main content
            // this calculation was copied from schedule.js line 326
            var mainHeight = document.documentElement.clientHeight - 200 - 50;
            $('#schedule_calendar').fullCalendar('option', 'contentHeight', mainHeight);
        }
        $("#schedule-show-what").show(0, function(){
            $add_show_name = $("#add_show_name");
            $add_show_name.focus();
            $add_show_name.select();
        });
    }
}

function makeAddShowButton(){
    $('.fc-header-left')
        .append('<span class="fc-header-space"></span>')
        .append('<span class="fc-button"><a href="#" class="add-button"><span class="add-icon"></span>'+$.i18n._("Show")+'</a></span>')
        .find('span.fc-button:last > a')
            .click(function(){
                openAddShowForm();
                removeAddShowButton();
            });
}

function removeAddShowButton(){
    var aTag = $('.fc-header-left')
        .find("span.fc-button:last > a");

    var span = aTag.parent();
    span.prev().remove();
    span.remove();
}

function makeTimeStamp(date){
    var sy, sm, sd, h, m, s, timestamp;
    sy = date.getFullYear();
    sm = date.getMonth() + 1;
    sd = date.getDate();
    h = date.getHours();
    m = date.getMinutes();
    s = date.getSeconds();

    timestamp = sy+"-"+ pad(sm, 2) +"-"+ pad(sd, 2) +" "+ pad(h, 2) +":"+ pad(m, 2) +":"+ pad(s, 2);
    return timestamp;
}

function dayClick(date, allDay, jsEvent, view){
    // The show from will be preloaded if the user is admin or program manager.
    // Hence, if the user if DJ then it won't open anything.
    if(userType == "A" || userType == "P"){
        var now, today, selected, chosenDate, chosenTime;

        now = adjustDateToServerDate(new Date(), serverTimezoneOffset);

        if(view.name === "month") {
            today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            selected = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        }
        else {
            today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
            selected = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes());
        }

        if(selected >= today) {
            var addShow = $('.add-button');

            //remove the +show button if it exists.
            if(addShow.length == 1){
                 var span = $(addShow).parent();
                $(span).prev().remove();
                $(span).remove();
            }

            // get current duration value on the form
            var duration_string = $.trim($("#add_show_duration").val());
            var duration_info = duration_string.split(" ");
            var duration_h = 0;
            var duration_m = 0;
            if(duration_info[0] != null){
                duration_h = parseInt(duration_info[0], 10);
            }
            if(duration_info[1] != null){
                duration_m = parseInt(duration_info[1], 10);
            }
            // duration in milisec
            var duration = (duration_h * 60 * 60 * 1000) + (duration_m * 60 * 1000);

            var startTime_string;
            var startTime = 0;
            // get start time value on the form
            if(view.name === "month") {
                startTime_string = $("#add_show_start_time").val();
                var startTime_info = startTime_string.split(':');
                if (startTime_info.length == 2) {
                    var start_time_temp = (parseInt(startTime_info[0],10) * 60 * 60 * 1000) 
                        + (parseInt(startTime_info[1], 10) * 60 * 1000);
                    if (!isNaN(start_time_temp)) {
                        startTime = start_time_temp;
                    }
                }
            }else{
                // if in day or week view, selected has all the time info as well
                // so we don't ahve to calculate it explicitly
                startTime_string = pad(selected.getHours(),2)+":"+pad(selected.getMinutes(),2)
                startTime = 0
            }

            // calculate endDateTime
            var endDateTime = new Date(selected.getTime() + startTime + duration);

            chosenDate = selected.getFullYear() + '-' + pad(selected.getMonth()+1,2) + '-' + pad(selected.getDate(),2);
            var endDateFormat = endDateTime.getFullYear() + '-' + pad(endDateTime.getMonth()+1,2) + '-' + pad(endDateTime.getDate(),2);

            $("#add_show_start_date").val(chosenDate);
            $("#add_show_end_date_no_repeat").val(endDateFormat);
            $("#add_show_end_date").val(endDateFormat);
            if(view.name !== "month") {
                var endTimeString = pad(endDateTime.getHours(),2)+":"+pad(endDateTime.getMinutes(),2);
                $("#add_show_start_time").val(startTime_string)
                $("#add_show_end_time").val(endTimeString)
            }
            $("#schedule-show-when").show();

            openAddShowForm();
        }
    }
}

function viewDisplay( view ) {
    view_name = view.name;
	
    if(view.name === 'agendaDay' || view.name === 'agendaWeek') {

        var calendarEl = this;

        var select = $('<select class="schedule_change_slots input_select"/>')
            .append('<option value="1">'+$.i18n._("1m")+'</option>')
            .append('<option value="5">'+$.i18n._("5m")+'</option>')
            .append('<option value="10">'+$.i18n._("10m")+'</option>')
            .append('<option value="15">'+$.i18n._("15m")+'</option>')
            .append('<option value="30">'+$.i18n._("30m")+'</option>')
            .append('<option value="60">'+$.i18n._("60m")+'</option>')
            .change(function(){
                var slotMin = $(this).val();
                var opt = view.calendar.options;
                var date = $(calendarEl).fullCalendar('getDate');

                opt.slotMinutes = parseInt(slotMin);
                opt.events = getFullCalendarEvents;
                opt.defaultView = view.name;

                //re-initialize calendar with new slotmin options
                $(calendarEl)
                    .fullCalendar('destroy')
                    .fullCalendar(opt)
                    .fullCalendar( 'gotoDate', date );

                //save slotMin value to db
                var url = baseUrl+'Schedule/set-time-interval/format/json';
                $.post(url, {timeInterval: slotMin});
            });

        var topLeft = $(view.element).find("table.fc-agenda-days > thead th:first");

        select.width(topLeft.width())
            .height(topLeft.height());

        topLeft.empty()
            .append(select);

        var slotMin = view.calendar.options.slotMinutes;
        $('.schedule_change_slots option[value="'+slotMin+'"]').attr('selected', 'selected');
    }

    if(($("#add-show-form").length == 1) && ($("#add-show-form").css('display')=='none') && ($('.fc-header-left > span').length == 5)) {

        //userType is defined in bootstrap.php, and is derived from the currently logged in user.
        if(userType == "A" || userType == "P"){
            makeAddShowButton();
        }
    }

    //save view name to db
    var url = baseUrl+'Schedule/set-time-scale/format/json';
    $.post(url, {timeScale: view.name});
}

function eventRender(event, element, view) {
    $(element).attr("id", "fc-show-instance-"+event.id);
    $(element).attr("data-show-id", event.showId);
    $(element).attr("data-show-linked", event.linked);
    $(element).data("event", event);

    //only put progress bar on shows that aren't being recorded.
    if((view.name === 'agendaDay' || view.name === 'agendaWeek') && event.record === 0) {
        var div = $('<div/>');
        div
            .height('5px')
            .width('95%')
            .css('margin-top', '1px')
            .css('margin-left', 'auto')
            .css('margin-right', 'auto')
            .progressbar({
                value: event.percent
            });

        $(element).find(".fc-event-content").append(div);
    }
   
    //add the record/rebroadcast/soundcloud icons if needed
    if (event.record === 1) {
        if (view.name === 'agendaDay' || view.name === 'agendaWeek') {
            if (event.soundcloud_id === -1) {
                $(element).find(".fc-event-time").before('<span class="small-icon recording"></span>');
            } else if ( event.soundcloud_id > 0) {
                $(element).find(".fc-event-time").before('<span class="small-icon recording"></span><span class="small-icon soundcloud"></span>');
            } else if (event.soundcloud_id === -2) {
                $(element).find(".fc-event-time").before('<span class="small-icon recording"></span><span class="small-icon progress"></span>');
            } else if (event.soundcloud_id === -3) {
                $(element).find(".fc-event-time").before('<span class="small-icon recording"></span><span class="small-icon sc-error"></span>');
            }
        } else if (view.name === 'month') {
            if(event.soundcloud_id === -1) {
                $(element).find(".fc-event-title").after('<span class="small-icon recording"></span>');
            } else if (event.soundcloud_id > 0) {
                $(element).find(".fc-event-title").after('<span class="small-icon recording"></span><span class="small-icon soundcloud"></span>');
            } else if (event.soundcloud_id === -2) {
                $(element).find(".fc-event-title").after('<span class="small-icon recording"></span><span class="small-icon progress"></span>');
            } else if (event.soundcloud_id === -3) {
                $(element).find(".fc-event-title").after('<span class="small-icon recording"></span><span class="small-icon sc-error"></span>');
            }
        }
    }

    if (event.record === 0 && event.rebroadcast === 0) {
        if (view.name === 'agendaDay' || view.name === 'agendaWeek') {
            if (event.show_empty === 1) {
                if (event.linked) {
                    $(element)
                    .find(".fc-event-time")
                    .before('<span class="small-icon linked"></span><span class="small-icon show-empty"></span>');
                } else {
                    $(element)
                        .find(".fc-event-time")
                        .before('<span class="small-icon show-empty"></span>');
                }
            } else if (event.show_partial_filled === true) {
                if (event.linked) {
                    $(element)
                        .find(".fc-event-time")
                        .before('<span class="small-icon linked"></span><span class="small-icon show-partial-filled"></span>');
                } else {
                    $(element)
                        .find(".fc-event-time")
                        .before('<span class="small-icon show-partial-filled"></span>');
                }
            } else {
                if (event.linked) {
                    $(element)
                        .find(".fc-event-time")
                        .before('<span class="small-icon linked"></span>');
                }
            }
        } else if (view.name === 'month') {
            if (event.show_empty === 1) {
                if (event.linked) {
                    $(element)
                        .find(".fc-event-title")
                        .after('<span class="small-icon linked"></span><span title="'+$.i18n._("Show is empty")+'" class="small-icon show-empty"></span>');
                } else {
                    $(element)
                        .find(".fc-event-title")
                        .after('<span title="'+$.i18n._("Show is empty")+'" class="small-icon show-empty"></span>');
                }
            } else if (event.show_partial_filled === true) {
                if (event.linked) {
                    $(element)
                    .find(".fc-event-title")
                    .after('<span class="small-icon linked"></span><span title="'+$.i18n._("Show is partially filled")+'" class="small-icon show-partial-filled"></span>');
                } else {
                    $(element)
                        .find(".fc-event-title")
                        .after('<span title="'+$.i18n._("Show is partially filled")+'" class="small-icon show-partial-filled"></span>');
                }
            } else {
                if (event.linked) {
                    $(element)
                        .find(".fc-event-title")
                        .after('<span class="small-icon linked"></span>');
                }
            }
        }
    }

    //rebroadcast icon
    if (event.rebroadcast === 1) {
        if (view.name === 'agendaDay' || view.name === 'agendaWeek') {
            $(element).find(".fc-event-time").before('<span class="small-icon rebroadcast"></span>');
        } else if (view.name === 'month') {
            $(element).find(".fc-event-title").after('<span class="small-icon rebroadcast"></span>');
        }
    }
}

function eventAfterRender( event, element, view ) {

    $(element).find(".small-icon").live('mouseover',function(){
        addQtipsToIcons($(this), event.id);
    });
}

function eventDrop(event, dayDelta, minuteDelta, allDay, revertFunc, jsEvent, ui, view) {
    var url = baseUrl+'Schedule/move-show/format/json';

    $.post(url,
        {day: dayDelta, min: minuteDelta, showInstanceId: event.id},
        function(json){
            if(json.show_error == true){
                alertShowErrorAndReload();
            }
            if(json.error) {
                alert(json.error);
                revertFunc();
            }
        });
}

function eventResize( event, dayDelta, minuteDelta, revertFunc, jsEvent, ui, view ) {
    var url = baseUrl+'Schedule/resize-show/format/json';

    $.post(url,
        {day: dayDelta, min: minuteDelta, showId: event.showId},
        function(json){
            if(json.show_error == true){
                alertShowErrorAndReload();
            }
            if(json.error) {
                alert(json.error);
                revertFunc();
            }

            scheduleRefetchEvents(json);
        });
}

function preloadEventFeed () {
    var url = baseUrl+'Schedule/event-feed-preload';
    var d = new Date();

    $.post(url, {format: "json", cachep: d.getTime()}, function(json){
        calendarEvents = json.events;
        createFullCalendar({calendarInit: calendarPref});
    });
}

var initialLoad = true;
function getFullCalendarEvents(start, end, callback) {
    
    if (initialLoad) {
        initialLoad = false;
        callback(calendarEvents);
    } else {
        var url, start_date, end_date;

        start_date = makeTimeStamp(start);
        end_date = makeTimeStamp(end);
        url = baseUrl+'Schedule/event-feed';

        var d = new Date();
            $.post(url, {format: "json", start: start_date, end: end_date, cachep: d.getTime()}, function(json){
                callback(json.events);
            });
    }
}

function checkSCUploadStatus(){
    var url = baseUrl+'Library/get-upload-to-soundcloud-status/format/json',
    	id;
    $("span[class*=progress]").each(function(){
        id = $(this).parents("div.fc-event").data("event").id;
        
        $.post(url, {format: "json", id: id, type:"show"}, function(json){
            if (json.sc_id > 0){
                $("#fc-show-instance-"+id)
                	.find(".progress")
                	.removeClass("progress")
                	.addClass("soundcloud");
            }
            else if (json.sc_id == "-3"){
            	$("#fc-show-instance-"+id)
	            	.find(".progress")
	            	.removeClass("progress")
	            	.addClass("sc-error");
            }
            
            setTimeout(checkSCUploadStatus, 5000);
        });
    });
}
/** This function adds and removes the current
 *  show icon
 */
function getCurrentShow(){
    var url = baseUrl+'Schedule/get-current-show/format/json',
        id,
        $el;
    $.post(url, {format: "json"}, function(json) {
        if (json.current_show === true) {
            $el = $("div[class*=fc-event-time]");
            if (view_name === 'agendaDay' || view_name === 'agendaWeek') {

                /* Need to remove now-playing class because if user
                 * is switching from week view to day view (and vice versa)
                 * the icon may already be there from previous view
                 */ 
                $el.siblings().remove("span.now-playing");
                if (!$el.siblings().hasClass("small-icon now-playing")) {
                    if ($el.siblings().hasClass("small-icon recording")) {

                        /* Without removing recording icon, the now playing
                         * icon will overwrite it.
                         */  
                        $el.siblings().remove("span.recording");
                        $el.before('<span class="small-icon now-playing"></span><span class="small-icon recording"></span>');
                    } else if ($el.siblings().hasClass("small-icon rebroadcast")) {

                        /* Without removing rebroadcast icon, the now playing
                         * icon will overwrite it.
                         */ 
                        $el.siblings().remove("span.rebroadcast");
                        $el.before('<span class="small-icon now-playing"></span><span class="small-icon rebroadcast"></span>');
                    } else {
                        $el.before('<span class="small-icon now-playing"></span>');
                    }
                }
            } else if (view_name === 'month') {
                if (!$("span[class*=fc-event-title]").siblings().hasClass("now-playing")) {
                    $("span[class*=fc-event-title]").after('<span class="small-icon now-playing"></span>');
                }
            }
        }
        //remove icon from shows that have ended
        $(".now-playing").each(function(){
        	id = $(this).parents("div.fc-event").data("event").id;
           
            if (id != json.si_id) {
                $(this).remove("span.now-playing");	
            }    	
        });
        
        setTimeout(getCurrentShow, 5000);
    }); 	
}

function addQtipsToIcons(ele, id){
    
    if ($(ele).hasClass("progress")){
        $(ele).qtip({
            content: {
                text: $.i18n._("Uploading in progress...")
            },
            position:{
                adjust: {
                resize: true,
                method: "flip flip"
                },
                at: "right center",
                my: "left top",
                viewport: $(window)
            },
            style: {
                classes: "ui-tooltip-dark file-md-long"
            },
            show: {
                ready: true // Needed to make it show on first mouseover event
            }
        });
    }else if($(ele).hasClass("soundcloud")){
        $(ele).qtip({
            content: {
                text: $.i18n._("Retreiving data from the server..."),
                ajax: {
                    url: baseUrl+"Library/get-upload-to-soundcloud-status",
                    type: "post",
                    data: ({format: "json", id : id, type: "show"}),
                    success: function(json, status){
                        this.set('content.text', $.i18n._("The soundcloud id for this file is: ")+json.sc_id);
                    }
                }
            },
            position:{
                adjust: {
                resize: true,
                method: "flip flip"
                },
                at: "right center",
                my: "left top",
                viewport: $(window)
            },
            style: {
                classes: "ui-tooltip-dark file-md-long"
            },
            show: {
                ready: true // Needed to make it show on first mouseover event
            }
        });
    }else if($(ele).hasClass("sc-error")){
        $(ele).qtip({
            content: {
                text: $.i18n._("Retreiving data from the server..."),
                ajax: {
                    url: baseUrl+"Library/get-upload-to-soundcloud-status",
                    type: "post",
                    data: ({format: "json", id : id, type: "show"}),
                    success: function(json, status){
                        this.set('content.text', $.i18n._("There was error while uploading to soundcloud.")+"<br>"+$.i18n._("Error code: ")+json.error_code+
                                "<br>"+$.i18n._("Error msg: ")+json.error_msg+"<br>");
                    }
                }
            },
            position:{
                adjust: {
                resize: true,
                method: "flip flip"
                },
                at: "right center",
                my: "left top",
                viewport: $(window)
            },
            style: {
                classes: "ui-tooltip-dark file-md-long"
            },
            show: {
                ready: true // Needed to make it show on first mouseover event
            }
        });
    }else if ($(ele).hasClass("show-empty")){
        $(ele).qtip({
            content: {
                text: $.i18n._("This show has no scheduled content.")
            },
            position:{
                adjust: {
                resize: true,
                method: "flip flip"
                },
                at: "right center",
                my: "left top",
                viewport: $(window)
            },
            style: {
                classes: "ui-tooltip-dark file-md-long"
            },
            show: {
                ready: true // Needed to make it show on first mouseover event
            }
        });
    } else if ($(ele).hasClass("show-partial-filled")){
        $(ele).qtip({
            content: {
                text: $.i18n._("This show is not completely filled with content.")
            },
            position:{
                adjust: {
                resize: true,
                method: "flip flip"
                },
                at: "right center",
                my: "left top",
                viewport: $(window)
            },
            style: {
                classes: "ui-tooltip-dark file-md-long"
            },
            show: {
                ready: true // Needed to make it show on first mouseover event
            }
        });
    }
}
//Alert the error and reload the page
//this function is used to resolve concurrency issue
function alertShowErrorAndReload(){
  alert($.i18n._("The show instance doesn't exist anymore!"));
  window.location.reload();
}

preloadEventFeed();
$(document).ready(function(){
    checkSCUploadStatus();
    getCurrentShow();
});

var view_name;
