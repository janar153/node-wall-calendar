import { EWSEvent, EWSConfig } from "../model";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const EWS = require("node-ews");

export default class EWSHelper {
  events: EWSEvent[] = [];
  startDate: Date = new Date();
  startTime: null | string = null;

  endDate: Date = new Date();
  endTime: null | string = "23:59:59";

  dateOptions: any = { year: "numeric", month: "2-digit", day: "2-digit" };

  ews: any = null;
  ewsFunction: any = "FindItem";
  ewsArgs : unknown = null;

  constructor() {
    const ewsConfig: null | EWSConfig = this.setConfig();

    this.ews = new EWS(ewsConfig);

    const startHours: string = ("0" + this.startDate.getUTCHours()).slice(-2);
    const startMinutes: string = ("0" + this.startDate.getUTCMinutes()).slice(-2);
    const startSeconds: string = ("0" + this.startDate.getUTCSeconds()).slice(-2);

    this.startTime = startHours + ":" + startMinutes + ":" + startSeconds;
    this.endDate.setDate(this.endDate.getDate() + 14);

    this.ewsArgs = {
      attributes: {
        Traversal: "Shallow",
      },
      ItemShape: {
        BaseShape: "Default",
      },
      CalendarView: {
        attributes: {
          MaxEntriesReturned: 5,
          StartDate:
            this.startDate.toLocaleDateString("en-CA", this.dateOptions) +
            "T" +
            this.startTime,
          EndDate:
            this.endDate.toLocaleDateString("en-CA", this.dateOptions) +
            "T" +
            this.endTime,
        },
      },
      ParentFolderIds: {
        DistinguishedFolderId: {
          attributes: {
            Id: "calendar",
          },
        },
      },
    };
  }

  setConfig(): null | EWSConfig {
    const ewsType: undefined | string = process.env.EWS_TYPE;
    let ewsConfig: null | EWSConfig = null;

    if (ewsType === "exchange") {
      ewsConfig = {
        username: process.env.EWS_USER,
        password: process.env.EWS_PASSWORD,
        host: process.env.EWS_HOST,
      };
    } else if (ewsType === "outlook") {
      ewsConfig = {
        username: process.env.EWS_USER,
        password: process.env.EWS_PASSWORD,
        host: process.env.EWS_HOST,
        auth: "basic",
      };
    }

    return ewsConfig;
  }

  setFunction(funcName: string): void {
    this.ewsFunction = funcName;
  }

  setArgs(args: any): void {
    this.ewsArgs = args;
  }

  addEvent(minutesToAdd: number): Promise<any> {
    const endDate = new Date(this.startDate.getTime() + minutesToAdd*60000);
    const endHours: string = ("0" + endDate.getUTCHours()).slice(-2);
    const endMinutes: string = ("0" + endDate.getUTCMinutes()).slice(-2);
    const endSeconds: string = ("0" + endDate.getUTCSeconds()).slice(-2);

    const endTime = endHours + ":" + endMinutes + ":" + endSeconds;
    const args = {
      attributes: {
        SendMeetingInvitations: "SendToNone"
      },
      Items: {
        CalendarItem: {
          Subject: "Koosolek",
          Body: "Koosolek",
          Start: this.startDate.toLocaleDateString("en-CA", this.dateOptions) + "T" + this.startTime + ".000Z",
          End: endDate.toLocaleDateString("en-CA", this.dateOptions) + "T" + endTime + ".000Z",
          Location: process.env.APP_NAME
        }
      }
    }

    return new Promise((resolve, reject) => {
      this.ews
        .run("CreateItem", args)
        .then((result: any) => {
          resolve(result);
        })
        .catch((err: any) => {
          reject(err);
        });
    });
  }

  pullEvents(): Promise<any> {
    this.events = [];
    return new Promise((resolve, reject) => {
      this.ews
        .run(this.ewsFunction, this.ewsArgs)
        .then((result: any) => {
          const response = result.ResponseMessages.FindItemResponseMessage;
          if (response.ResponseCode === "NoError") {
            const itemsCount = parseInt(
              response.RootFolder.attributes.TotalItemsInView
            );
            if (itemsCount !== 0) {
              const items = response.RootFolder.Items.CalendarItem;
              if (items.length !== undefined) {
                items.forEach((item: any) => {
                  this.events.push({
                    id: item.ItemId.attributes.Id,
                    subject: item.Subject,
                    event_start: new Date(item.Start),
                    event_end: new Date(item.End),
                    location: item.Location,
                    organizer: item.Organizer.Mailbox.Name,
                  });
                });
              } else {
                this.events.push({
                  id: items.ItemId.attributes.Id,
                  subject: items.Subject,
                  event_start: new Date(items.Start),
                  event_end: new Date(items.End),
                  location: items.Location,
                  organizer: items.Organizer.Mailbox.Name,
                });
              }
            }
          }
          resolve(this.events);
        })
        .catch((err: any) => {
          reject(err);
        });
    });
  }
}
