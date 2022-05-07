console.log("host: " + location.host);

var io = io.connect(location.host);

io.on('tick', function(data) {
    $("#time").html(data.time);
    $("#date").html(data.date);
});

io.on('events', function(data) {
    let roomFree = data.room.is_free;
    if(roomFree) {
        $("#app").removeClass("bg-success").removeClass("bg-warning").removeClass("bg-danger").addClass("bg-" + data.room.bg_color);
    } else {
        $("#app").removeClass("bg-success").removeClass("bg-warning").removeClass("bg-danger").addClass("bg-" + data.room.bg_color);
    }

    $("#roomStatus").html(data.room.status);
    $("#roomEndTime").html(data.room.end_time);
    $("#roomCurrentOrganizer").html(data.room.organizer);

    if (data.room.organizer != "") {
        $("#roomCurrentOrganizerIcon").removeClass("hidden");
    } else {
        $("#roomCurrentOrganizerIcon").removeClass("hidden").addClass("hidden");
    }

    if(data.next.has) {
        $("#nextBlock").removeClass("hidden");        
    } else {
        $("#nextBlock").removeClass("hidden").addClass("hidden");
    }
    $("#nextMeetingStartDate").html(data.next.date);
    $("#nextMeetingStartTime").html(data.next.time);
    $("#nextMeetingOrganizer").html(data.next.organizer); 
});
