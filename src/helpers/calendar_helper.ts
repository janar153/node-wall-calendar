import { I18n } from "i18n";

export default class CalendarHelper {
  i18n : I18n
  
  constructor(i18n: I18n) {
    this.i18n = i18n;
  }
  
  getEndInMinutes(endDate: Date)  {
    const now = new Date();
    const timeToEndMS = endDate.getTime() - now.getTime();
  
    return Math.floor((timeToEndMS / 1000 / 60) << 0);
  }

  timeConvert(endDate: Date, translationString: string) {
    const timeToEndInMinutes = this.getEndInMinutes(endDate);
  
    const hours = timeToEndInMinutes / 60;
    const rhours = Math.floor(hours);
    const minutes = (hours - rhours) * 60;
    const rminutes = Math.round(minutes);
  
    let response = "";
    if (rhours > 0) {
      response += this.i18n.__n(translationString + "_hours", rhours);
    }
    if (rminutes > 0) {
      response += this.i18n.__n(translationString + "_minutes", rminutes);
    }
    return response; //timeToEndInMinutes + " minutes = " + rhours + " hour(s) and " + rminutes + " minute(s).";
  }
  
}
