require('dotenv').config();

import express from 'express';
import EWSHelper from './helpers/ews_helper';
import { EWSEvent } from './model';
const ewsHelper = new EWSHelper();

const hbs = require('hbs');
const i18n = require("i18n");

i18n.configure({
    locales:['et', 'en', 'ru'],
    directory: './locales',
    defaultLocale: 'et',
    queryParameter: 'lang',
    register: global,
    autoReload: true,
});

i18n.setLocale(process.env.LANG);

hbs.registerHelper('appName', () => {
    return process.env.APP_NAME;
});

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(i18n.init);

hbs.registerHelper('__', function () {
    // @ts-ignore
    return i18n.__.apply(this, arguments);
});

function timeConvert(endDate: Date, translationString: string) {
    var now = new Date();    
    var timeToEndMS = endDate.getTime() - now.getTime();
    var timeToEndInMinutes = Math.floor((timeToEndMS/1000/60) << 0)

    var hours = (timeToEndInMinutes / 60);
    var rhours = Math.floor(hours);
    var minutes = (hours - rhours) * 60;
    var rminutes = Math.round(minutes);

    let response = "";
    if(rhours > 0) {
        response += i18n.__n(translationString+"_hours", rhours);
    }
    if(rminutes > 0) {
        response += i18n.__n(translationString+"_minutes", rminutes);
    }
    return response; //timeToEndInMinutes + " minutes = " + rhours + " hour(s) and " + rminutes + " minute(s).";
}

io.on('connection', (socket:any) => {
	function dateTime() {
        var now = new Date();
        let currentTime = ('0'+now.getHours()).substr(-2)+":"+('0'+now.getMinutes()).substr(-2);
        
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
            i18n.__("december")
        ];

        let currentDate = now.getDay()+". "+monthNames[now.getMonth()]+" "+now.getFullYear();
		socket.emit('tick', { time: currentTime, date: currentDate });
    };
    dateTime();
    setInterval(dateTime, 1000 * 60);
    
    function update() {
        let now = new Date();
        let loading = true;
        let roomFree = true;
        let roomEndTime = "";
        let roomOrganizer = "";

        let hasCurrent = false;
        
        let nextEvent:null|EWSEvent = null;
        let nextMonth:null|number = null;
        ewsHelper.pullEvents().then((events: EWSEvent[]) => {
            loading = false;
            if(events.length > 0) {                
                for (let index = 0; index < events.length; index++) {
                    const event = events[index];
                    if(event.event_start <= now && event.event_end >= now) {
                        hasCurrent = true;
                        roomFree = false;
                        roomEndTime = timeConvert(event.event_end, "opens"); //('0'+event.event_end.getHours()).substr(-2)+":"+('0'+event.event_end.getMinutes()).substr(-2);
                        roomOrganizer = event.organizer;
                    } 

                    if(event.event_start >= now) {
                        nextEvent = event;
                        nextMonth = nextEvent.event_start.getMonth()+1;
                        if(!hasCurrent) {
                            if(nextEvent.event_start.getDate() == now.getDate() 
                            && nextEvent.event_start.getMonth() == now.getMonth()
                            && nextEvent.event_start.getFullYear() == now.getFullYear()) {
                                roomEndTime = timeConvert(nextEvent.event_start, "until"); //('0'+nextEvent.event_start.getHours()).substr(-2)+":"+('0'+nextEvent.event_start.getMinutes()).substr(-2);
                            } else {
                                roomEndTime = ""; //('0'+nextEvent.event_start.getDate()).substr(-2)+"."+('0'+nextMonth).substr(-2)+"."+nextEvent.event_start.getFullYear()+" @ "+('0'+nextEvent.event_start.getHours()).substr(-2)+":"+('0'+nextEvent.event_start.getMinutes()).substr(-2);
                            }                            
                        }
                        
                        break;
                    }
                }
            }

            let socketData = {
                loadingData: loading,
                room: {
                    is_free: roomFree,
                    status: (roomFree) ? i18n.__("room_free") : i18n.__("room_busy"),
                    end_time: (roomFree) ? i18n.__("until %s", roomEndTime) : i18n.__("opens %s", roomEndTime),
                    organizer: roomOrganizer
                },
                next: {
                    has: (nextEvent !== null) ? true : false,
                    date: (nextEvent !== null) ? ('0'+nextEvent.event_start.getDate()).substr(-2)+"."+('0'+nextMonth).substr(-2)+"."+nextEvent.event_start.getFullYear() : null,
                    time: (nextEvent !== null) ? ('0'+nextEvent.event_start.getHours()).substr(-2)+":"+('0'+nextEvent.event_start.getMinutes()).substr(-2) : "",
                    organizer: (nextEvent !== null) ? nextEvent.organizer : ""
                }
            }
        
            socket.emit('events', socketData);
        });     

    }

    update();
    setInterval(update, 1000 * 60);
});

const port = process.env.PORT || 3002;

app.enable('trust proxy');
app.set('port', port);

app.set('views', './views');
app.set('view engine', 'hbs');
app.use('/static', express.static('public'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    i18n.setLocale(req, process.env.LANG);
    res.render("index");
});

app.use('/details', require('./routes/details'));

http.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
