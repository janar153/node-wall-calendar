import { EWSEvent } from "../model";

const EWS = require('node-ews');

export default class EWSHelper {
    events: EWSEvent[] = [];
    startDate: Date = new Date();
    startTime: null|string = null;

    endDate: Date = new Date();
    endTime: null|string = "23:59:59";
    
    dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };

    ewsConfig: null|{} = null;

    ews:any = null;
    ewsFunction: string = 'FindItem';
    ewsArgs: null|{} = null;

    constructor() {
        this.setConfig();
        
        this.ews = new EWS(this.ewsConfig);

        this.startTime = ('0'+this.startDate.getUTCHours()).substr(-2)+":"+('0'+this.startDate.getUTCMinutes()).substr(-2)+":"+('0'+this.startDate.getUTCSeconds()).substr(-2);
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
                    'StartDate': this.startDate.toLocaleDateString("et-EE", this.dateOptions)+"T"+this.startTime,
                    'EndDate': this.endDate.toLocaleDateString("et-EE", this.dateOptions)+"T"+this.endTime,
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

    setConfig():void {
        let ewsType = process.env.EWS_TYPE;

        if(ewsType === "exhange") {
            this.ewsConfig = {
                username: process.env.EWS_USER,
                password: process.env.EWS_PASSWORD,
                host: process.env.EWS_HOST
            };
        } else if(ewsType === "outlook") {
            this.ewsConfig = {
                username: process.env.EWS_USER,
                password: process.env.EWS_PASSWORD,
                host: process.env.EWS_HOST,
                auth: 'basic'
            };
        }        
        
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
                console.error(err.message);
                reject(err);
            });
        });
        
    }
}
