import os = require("os");
import task = require('azure-pipelines-task-lib/task');
import fs = require("fs");

import { Container, injectable, inject } from "inversify";
import { ToolRunner, IExecOptions, IExecSyncResult } from "azure-pipelines-task-lib/toolrunner";
import { TaskOptions } from "./TaskOptions";
import { TerraformAuthentication } from "./TerraformAuthentication";

@injectable()
export class Terraform {
    private readonly terraform : ToolRunner;

    constructor(
        private options: TaskOptions,
        private auth: TerraformAuthentication
    ) {
        this.terraform = this.createTerraformToolRunner();
    }

    /**
     * Initializes Terraform
     */
    public init() : IExecSyncResult {
        console.log("Initializing Terraform...");

        let result = this.terraform.arg("init").execSync({
            cwd: this.options.Cwd,
            env: {
                ...process.env,
                ...this.auth.ToEnv()
            }
        } as unknown as IExecOptions);

        console.log(result.error == null ? result.stdout : result.stderr);
        
        return result;
    }

    /**
     * Executes a script within an authenticated Terraform environment
     * @param script The location of the script to run
     */
    public exec(script: string) : IExecSyncResult {
        console.log("Executing terraform script");
        let content = fs.readFileSync(script,'utf8');

        console.log(content);

        let tool = this.createCliToolRunner(script);
        
        let result = tool.execSync({
            cwd: this.options.Cwd,
            env: {
                ...process.env,
                ...this.auth.ToEnv()
            }
        } as unknown as IExecOptions);

        console.log(result.error == null ? result.stdout : result.stderr);

        return result;
    }

    private createTerraformToolRunner() : ToolRunner {
        let terraformPath = task.which("terraform", true);
        let terraform: ToolRunner = task.tool(terraformPath);

        return terraform;
    }

    private createCliToolRunner(scriptPath : string) : ToolRunner {
        var tool;

        if (os.type() != "Windows_NT") {
            tool = task.tool(task.which("bash", true));
            tool.arg(scriptPath);
        } else {
            tool = task.tool(task.which(scriptPath, true));
        }

        return tool;
    }
}
