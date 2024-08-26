import path = require("path");

export class Config {
    projectName: string = '';
    domainName: string = '';

    route53ImportZoneFile: boolean = false;
    route53ImportZoneFileLocation: string = path.join(__dirname, 'zone_file.txt');

    constructor() {
        this.projectName = "ltekme"
        this.domainName = "ltek.me"
        this.route53ImportZoneFile = true;
    }

}