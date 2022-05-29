import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import EWSHelper from "./helpers/ews_helper";
import { EWSEvent } from "./model";
const ewsHelper = new EWSHelper();

import hbs from "hbs";
import { I18n } from 'i18n';

const i18n = new I18n();

i18n.configure({
  locales: ["et", "en", "ru"],
  directory: "./locales",
  defaultLocale: "et",
  queryParameter: "lang",
  register: global,
  autoReload: true,
});

const appLang = process.env.APP_LANG || "et";
const bookingEnabled = process.env.BOOKING_ENABLED || true;

i18n.setLocale(appLang);

hbs.registerHelper("appName", () => {
  return process.env.APP_NAME;
});

const app = express();
import http from "http";
const server = http.createServer(app);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const io = require("socket.io")(server);

app.use(i18n.init);

hbs.registerHelper("__", function (str) {
  return (i18n != undefined ? i18n.__(str) : str);
});

function getEndInMinutes(endDate: Date) {
  const now = new Date();
  const timeToEndMS = endDate.getTime() - now.getTime();
  const timeToEndInMinutes = Math.floor((timeToEndMS / 1000 / 60) << 0);

  return timeToEndInMinutes;
}

function timeConvert(endDate: Date, translationString: string) {
  const timeToEndInMinutes = getEndInMinutes(endDate);

  const hours = timeToEndInMinutes / 60;
  const rhours = Math.floor(hours);
  const minutes = (hours - rhours) * 60;
  const rminutes = Math.round(minutes);

  let response = "";
  if (rhours > 0) {
    response += i18n.__n(translationString + "_hours", rhours);
  }
  if (rminutes > 0) {
    response += i18n.__n(translationString + "_minutes", rminutes);
  }
  return response; //timeToEndInMinutes + " minutes = " + rhours + " hour(s) and " + rminutes + " minute(s).";
}

io.on("connection", (socket: { emit: (arg0: string, arg1: { time?: string; date?: string; loadingData?: boolean; room?: { is_free: boolean; status: string; end_time: string; bg_color: string; organizer: string; }; next?: { has: boolean; date: string | null; time: string; organizer: string; }; }) => void; }) => {
  function dateTime() {
    const now = new Date();
    const currentTime =
      ("0" + now.getHours()).slice(-2) +
      ":" +
      ("0" + now.getMinutes()).slice(-2);

    const monthNames = [
      i18n.__("january"),
      i18n.__("february"),
      i18n.__("march"),
      i18n.__("april"),
      i18n.__("may"),
      i18n.__("june"),
      i18n.__("july"),
      i18n.__("august"),
      i18n.__("september"),
      i18n.__("october"),
      i18n.__("november"),
      i18n.__("december"),
    ];

    const currentDate =
      now.getDate() +
      ". " +
      monthNames[now.getMonth()] +
      " " +
      now.getFullYear();
    socket.emit("tick", { time: currentTime, date: currentDate });
    return { time: currentTime, date: currentDate };
  }
  dateTime();
  setInterval(dateTime, 1000 * 60);

  function update() {
    const now = new Date();
    let loading = true;
    let roomFree = true;
    let roomEndTime = "";
    let endInMinutes = 0;
    let startInMinutes = 500;
    let roomOrganizer = "";

    let hasCurrent = false;

    let nextEvent: null | EWSEvent = null;
    let nextMonth: null | number = null;
    ewsHelper.pullEvents().then((events: EWSEvent[]) => {
      loading = false;
      if (events.length > 0) {
        for (let index = 0; index < events.length; index++) {
          const event = events[index];
          if (event.event_start <= now && event.event_end >= now) {
            hasCurrent = true;
            roomFree = false;
            roomEndTime = timeConvert(event.event_end, "opens");
            endInMinutes = getEndInMinutes(event.event_end);
            startInMinutes = getEndInMinutes(event.event_start);
            roomOrganizer = event.organizer;
          }

          if (event.event_start >= now) {
            nextEvent = event;
            nextMonth = nextEvent.event_start.getMonth() + 1;
            if (!hasCurrent) {
              if (
                nextEvent.event_start.getDate() == now.getDate() &&
                nextEvent.event_start.getMonth() == now.getMonth() &&
                nextEvent.event_start.getFullYear() == now.getFullYear()
              ) {
                roomEndTime = timeConvert(nextEvent.event_start, "until");
                endInMinutes = getEndInMinutes(nextEvent.event_start);
                startInMinutes = getEndInMinutes(nextEvent.event_start);
              } else {
                roomEndTime = ""; 
              }
            }

            break;
          }
        }
      }

      let color = "success";
      if (roomFree) {
        if (endInMinutes <= 15 && endInMinutes > 0) {
          color = "warning";
        }
      } else if (!roomFree) {
        color = "danger";
      }

      const socketData = {
        loadingData: loading,
        room: {
          is_free: roomFree,
          booking_enabled: bookingEnabled == "true",
          status: roomFree ? i18n.__("room_free") : i18n.__("room_busy"),
          time_to_start_in_minutes: startInMinutes,
          time_to_end_in_minutes: endInMinutes,
          end_time: roomFree
            ? i18n.__("until %s", roomEndTime)
            : i18n.__("opens %s", roomEndTime),
          bg_color: color,
          organizer: roomOrganizer,
        },
        next: {
          has: nextEvent !== null ? true : false,
          date:
            nextEvent !== null
              ? ("0" + nextEvent.event_start.getDate()).slice(-2) +
                "." +
                ("0" + nextMonth).slice(-2) +
                "." +
                nextEvent.event_start.getFullYear()
              : null,
          time:
            nextEvent !== null
              ? ("0" + nextEvent.event_start.getHours()).slice(-2) +
                ":" +
                ("0" + nextEvent.event_start.getMinutes()).slice(-2)
              : "",
          organizer: nextEvent !== null ? nextEvent.organizer : "",
        },
      };

      socket.emit("events", socketData);
      console.log(now.toUTCString() + " - INFO [Pulling events - found " + events.length + " events] Next event starts in " + startInMinutes + " minutes");
    });
    
  }

  update();
  setInterval(update, 1000 * 60);
});

const port = process.env.PORT || 3002;

app.enable("trust proxy");
app.set("port", port);

app.set("views", "./views");
app.set("view engine", "hbs");
app.use("/static", express.static("public"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  i18n.setLocale(req, appLang);
  res.render("index");
});

if (bookingEnabled == "true") {
  app.get("/book", (req, res) => {
    i18n.setLocale(req, appLang);
    res.render("book");
  });
  
  app.post("/book", (req, res) => {
    i18n.setLocale(req, appLang);
    const minutesToAdd = req.body.meeting_length;
  
    ewsHelper.addEvent(minutesToAdd).then((result: any) => {
      res.json(result);
    });
    
  });
}

// redirect any page, that doesn't exists
app.get('*', function(req, res){
  res.redirect("/");
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
