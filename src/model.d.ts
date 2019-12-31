export interface EWSEvent {
    id: string;
    subject: string;
    event_start: Date;
    event_end: Date;
    location: string;
    organizer: string;
}

declare module "*.json"
{ const value: any;
    export default value;
}
