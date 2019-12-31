console.log("host: " + location.host);

var io = io.connect(location.host);

io.on('tick', function(data) {
    $("#time").html(data.time);
    $("#date").html(data.date);

});

io.on('events', function(data) {
    let roomFree = data.room.is_free;
    if(roomFree) {
        $("#app").removeClass("bg-success").removeClass("bg-danger").addClass("bg-success");
    } else {
        $("#app").removeClass("bg-success").removeClass("bg-danger").addClass("bg-danger");
    }

    $("#roomStatus").html(data.room.status);
    $("#roomEndTime").html(data.room.end_time);
    $("#roomCurrentOrganizer").html(data.room.organizer);

    if(data.next.has) {
        $("#nextBlock").removeClass("hidden");        
    } else {
        $("#nextBlock").removeClass("hidden").addClass("hidden");
    }
    $("#nextMeetingStartDate").html(data.next.date);
    $("#nextMeetingStartTime").html(data.next.time);
    $("#nextMeetingOrganizer").html(data.next.organizer); 
});