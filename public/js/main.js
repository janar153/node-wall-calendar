var io = io.connect(location.host);

$('input[name="bookingTime"]').on('click', function() {
  $("#booking-submit-error").addClass("hidden");
});

$("#bookNowSubmit").on("click", function() {
  $("#booking-submit-error").addClass("hidden");

  var bookingTime = $('input[name="bookingTime"]:checked').val();
  if (bookingTime == undefined) {
    $("#booking-submit-error").removeClass("hidden");
  } else {
    $.post("/book", { meeting_length: bookingTime })
      .done(function (result) {
        if (result.ResponseMessages.CreateItemResponseMessage.ResponseCode == "NoError") {
          document.location.href = "/";
        } else {
          alert(result.ResponseMessages.CreateItemResponseMessage.ResponseCode);
        }
      });
  }
});

io.on("tick", function (data) {
  $("#time").html(data.time);
  $("#date").html(data.date);
});

$(".booking-form").addClass("hidden");
$("#book-now-button").addClass("hidden");
$(".booking-message").addClass("hidden");
$("#book-end-now-button").addClass("hidden");

io.on("events", function (data) {
  let roomFree = data.room.is_free;
  if (roomFree) {
    $("#app")
      .removeClass("bg-success")
      .removeClass("bg-warning")
      .removeClass("bg-danger")
      .addClass("bg-" + data.room.bg_color);
  } else {
    $("#app")
      .removeClass("bg-success")
      .removeClass("bg-warning")
      .removeClass("bg-danger")
      .addClass("bg-" + data.room.bg_color);
  }

  var timeOptions = [15, 30, 60, 120, 240, 480];
  timeOptions.forEach(timeOption => {
    
    var optionAvailable = data.room.time_to_start_in_minutes > timeOption;
    
    $("#booking" + timeOption).attr('disabled', !optionAvailable);

  });

  $("#book-end-now-button").removeClass("hidden").addClass("hidden");
  console.log("bg_color", data.room.bg_color);
  if (data.room.bg_color != "success") {
    $(".booking-form").removeClass("hidden").addClass("hidden");
    $("#book-now-button").removeClass("hidden").addClass("hidden");
    $(".booking-message").removeClass("hidden");

    if(data.room.bg_color == "danger") {
      $("#book-end-now-button").removeClass("hidden");
      $("#book-end-now-button").attr("href","/end?eventId=" + data.room.id + "&changeKey=" + data.room.eventChangeId);
      console.log("event id: ", data.room.id);
    }
  } else if (data.room.bg_color == "success") {
    $(".booking-form").removeClass("hidden");
    $("#book-now-button").removeClass("hidden");
    $(".booking-message").addClass("hidden");
  }  

  if (!data.room.booking_enabled) {
    $("#book-now-button").removeClass("hidden").addClass("hidden");
  }

  $("#roomStatus").html(data.room.status);
  $("#roomEndTime").html(data.room.end_time);
  $("#roomCurrentOrganizer").html(data.room.organizer);

  if (data.room.organizer != "") {
    $("#roomCurrentOrganizerIcon").removeClass("hidden");
  } else {
    $("#roomCurrentOrganizerIcon").removeClass("hidden").addClass("hidden");
  }

  if (data.next.has) {
    $("#nextBlock").removeClass("hidden");
  } else {
    $("#nextBlock").removeClass("hidden").addClass("hidden");
  }

  $("#roomEndTime").removeClass("hidden");
  if (data.room.is_free && !data.next.has) {
    $("#roomEndTime").removeClass("hidden").addClass("hidden");
  }

  $("#nextMeetingStartDate").html(data.next.date);
  $("#nextMeetingStartTime").html(data.next.time);
  $("#nextMeetingOrganizer").html(data.next.organizer);
});

