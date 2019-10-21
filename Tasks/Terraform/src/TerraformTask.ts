import path = require("path");
import fs = require("fs");
import os = require("os");

import { injectable } from "inversify";
import { TerraformCommandRunner } from "./TerraformCommandRunner";
import { TaskOptions } from './TaskOptions';

@injectable()
export class TerraformTask {

    constructor(
        private terraform : TerraformCommandRunner,
        private options: TaskOptions)
    {
        
    }

    public async run() {
        switch(this.options.command) {
            case "init":
                await this.terraform.init(["-input=false"]);
                break;
            case "validate":
                await this.terraform.exec(["validate"], false);
                break;
            case "plan":
                await this.terraform.exec(["plan", "-input=false"]);
                break;
            case "apply":
                await this.terraform.exec(["apply", "-input=false", "-auto-approve"]);
                break;
            case "destroy":
                await this.terraform.exec(["destroy", "-auto-approve=true"]);
                break;
            case "authenticate":
                await this.terraform.authenticate();
                break;
            default:
                throw new Error("Invalid command");
        }
    }
}