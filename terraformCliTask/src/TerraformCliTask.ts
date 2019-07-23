import path = require("path");
import fs = require("fs");
import os = require("os");

import { injectable } from "inversify";
import { Terraform } from "./Terraform";
import { TaskOptions } from './TaskOptions';

@injectable()
export class TerraformCliTask {

    constructor(private terraform : Terraform, private options: TaskOptions) {
        
    }

    public async run() {
        if(this.options.Initialize) {
            await this.terraform.init();
        }

        let scriptPath = this.InitScriptAtPath();
        await this.terraform.exec(scriptPath);
    }

    private InitScriptAtPath(): string {
        let scriptPath: string;

        if (this.options.ScriptLocation === "scriptPath") {
            scriptPath = this.options.ScriptPath;
        }
        else {
            var tmpDir = this.options.TempDir || os.tmpdir();

            if (os.type() != "Windows_NT") {
                scriptPath = path.join(tmpDir, "terraformclitaskscript" + new Date().getTime() + ".sh");
            }
            else {
                scriptPath = path.join(tmpDir, "terraformclitaskscript" + new Date().getTime() + ".bat");
            }
            
            this.createFile(scriptPath, this.options.Script);
        }

        return scriptPath;
    }

    private createFile(filePath: string, data: string) {
        try {
            fs.writeFileSync(filePath, data);
        }
        catch (err) {
            this.deleteFile(filePath);
            throw err;
        }
    }

    private deleteFile(filePath: string): void {
        if (fs.existsSync(filePath)) {
            try {
                //delete the publishsetting file created earlier
                fs.unlinkSync(filePath);
            }
            catch (err) {
                //error while deleting should not result in task failure
                console.error(err.toString());
            }
        }
    }
}