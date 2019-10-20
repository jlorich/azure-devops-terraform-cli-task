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
        if (!this.options.command) {
            throw new Error("No command specified");
        }

        switch(this.options.command) {
            case "init":
                this.terraform.init();
                break;
            case "authenticate":
                this.terraform.authenticate();
                break;
            default:
                this.terraform.exec(this.options.command, []);
        }
    }
}