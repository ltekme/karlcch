import path = require("path");

export class Config {
    projectName: string = '';
    domainName: string = '';
    motdSubProjectNotifyEmails: string[];

    region: string = 'us-east-1';

    constructor() {
        this.projectName = "ltekme";
        this.domainName = "ltek.me";
        this.motdSubProjectNotifyEmails = ['karl@ltek.me'];
    }

}