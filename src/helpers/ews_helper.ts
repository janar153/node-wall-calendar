import { EWSEvent, EWSConfig } from "../model";

const EWS = require('node-ews');

export default class EWSHelper {
    events: EWSEvent[] = [];
    startDate: Date = new Date();
    startTime: null|string = null;

    endDate: Date = new Date();
    endTime: null|string = "23:59:59";
    
    dateOptions:{} = { year: 'numeric', month: '2-digit', day: '2-digit' };

    ews:any = null;
    ewsFunction: string = 'FindItem';
    ewsArgs: null|{} = null;

    constructor() {
        const ewsConfig : null|EWSConfig = this.setConfig();

        this.ews = new EWS(ewsConfig);
        
        let startHours:string = ('0'+this.startDate.getUTCHours()).slice(-2);
        let startMinutes:string = ('0'+this.startDate.getUTCMinutes()).slice(-2);
        let startSeconds:string = ('0'+this.startDate.getUTCSeconds()).slice(-2);

        this.startTime = startHours+":"+startMinutes+":"+startSeconds;
        this.endDate.setDate(this.endDate.getDate() + 14);

        this.ewsArgs = {
            'attributes': {
                'Traversal': 'Shallow'
            },
            'ItemShape': {
                'BaseShape': 'Default'
            },
            'CalendarView': {
                'attributes': {
                    'MaxEntriesReturned': 5,
                    'StartDate': this.startDate.toLocaleDateString("en-CA", this.dateOptions)+"T"+this.startTime,
                    'EndDate': this.endDate.toLocaleDateString("en-CA", this.dateOptions)+"T"+this.endTime,
                }
            },
            'ParentFolderIds' : {
                'DistinguishedFolderId': {
                    'attributes': {
                        'Id': 'calendar'
                    }
                }
            }
        };   
    }

    setConfig(): null|EWSConfig {
        let ewsType: undefined|string = process.env.EWS_TYPE;
        let ewsConfig: null|EWSConfig = null;

        if(ewsType === "exchange") {
            ewsConfig = {
                username: process.env.EWS_USER,
                password: process.env.EWS_PASSWORD,
                host: process.env.EWS_HOST
            };
        } else if(ewsType === "outlook") {
            ewsConfig = {
                username: process.env.EWS_USER,
                password: process.env.EWS_PASSWORD,
                host: process.env.EWS_HOST,
                auth: 'basic'
            };
        }
        
        return ewsConfig;
    }

    setFunction(funcName: string):void {
        this.ewsFunction = funcName;
    }

    setArgs(args:{}):void {
        this.ewsArgs = args;
    }

    pullEvents(): Promise<any> {
        this.events = [];
        return new Promise((resolve, reject) => {
            this.ews.run(this.ewsFunction, this.ewsArgs).then((result:any) => {
                let response = result.ResponseMessages.FindItemResponseMessage;
                if(response.ResponseCode === "NoError") {
                    let itemsCount = parseInt(response.RootFolder.attributes.TotalItemsInView);        
                    if(itemsCount !== 0) {
                        let items = response.RootFolder.Items.CalendarItem;
                        if(items.length !== undefined) {
                            items.forEach((item:any) => {
                                this.events.push({
                                    "id": item.ItemId.attributes.Id, 
                                    "subject": item.Subject,
                                    "event_start": new Date(item.Start),
                                    "event_end": new Date(item.End),
                                    "location": item.Location,
                                    "organizer": item.Organizer.Mailbox.Name
                                });
                            });
                        } else {    
                            this.events.push({
                                "id": items.ItemId.attributes.Id, 
                                "subject": items.Subject,
                                "event_start": new Date(items.Start),
                                "event_end": new Date(items.End),
                                "location": items.Location,
                                "organizer": items.Organizer.Mailbox.Name
                            });
                        }
                        resolve(this.events);
                    }
                }
                
            }).catch((err:any) => {
                reject(err);
            });
        });
        
    }
}
