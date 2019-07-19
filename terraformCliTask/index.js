"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("azure-pipelines-task-lib/task");
const path = require("path");
const fs = require("fs");
const os = require("os");
class TerraformCliTask {
    constructor() {
        // User supplied parameters
        this.scriptLocation = "";
        this.cwd = "";
        this.connectedService = "";
        this.script = "";
        this.scriptPath = "";
        this.tenantId = "";
        try {
            this.scriptLocation = tl.getInput("scriptLocation");
            this.cwd = tl.getPathInput("cwd", false, false);
            this.connectedService = tl.getInput("connectedServiceNameARM", true);
            this.script = tl.getInput("inlineScript", true);
        }
        catch (err) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    }
    run() {
        this.InitScriptPath();
        this.tool = this.GetTool();
        var terraformAuthEnv = this.GetTerraformAuthEnv(this.connectedService);
        this.tool.exec({
            env: terraformAuthEnv
        });
    }
    InitScriptPath() {
        if (this.scriptLocation === "scriptPath") {
            this.scriptPath = tl.getPathInput("scriptPath", true, true);
            // if user didn"t supply a cwd (advanced), then set cwd to folder script is in.
            // All "script" tasks should do this
            if (!tl.filePathSupplied("cwd")) {
                this.cwd = path.dirname(this.scriptPath);
            }
        }
        else {
            var tmpDir = tl.getVariable('Agent.TempDirectory') || os.tmpdir();
            var script = tl.getInput("inlineScript", true);
            if (os.type() != "Windows_NT") {
                this.scriptPath = path.join(tmpDir, "terraformclitaskscript" + new Date().getTime() + ".sh");
            }
            else {
                this.scriptPath = path.join(tmpDir, "terraformclitaskscript" + new Date().getTime() + ".bat");
            }
            TerraformCliTask.createFile(this.scriptPath, script);
        }
    }
    GetTool() {
        var tool;
        if (os.type() != "Windows_NT") {
            tool = tl.tool(tl.which("bash", true));
            tool.arg(this.scriptPath);
        }
        else {
            tool = tl.tool(tl.which(this.scriptPath, true));
        }
        return tool;
    }
    GetTerraformAuthEnv(connectedService) {
        var authScheme = tl.getEndpointAuthorizationScheme(connectedService, true);
        var subscriptionID = tl.getEndpointDataParameter(connectedService, "SubscriptionID", true);
        if (authScheme.toLowerCase() == "serviceprincipal") {
            let authType = tl.getEndpointAuthorizationParameter(connectedService, 'authenticationType', true);
            let cliPassword = "";
            var servicePrincipalId = tl.getEndpointAuthorizationParameter(connectedService, "serviceprincipalid", false);
            var tenantId = tl.getEndpointAuthorizationParameter(connectedService, "tenantid", false);
            if (authType == "spnCertificate") {
                tl.debug('certificate based endpoint');
                let certificateContent = tl.getEndpointAuthorizationParameter(connectedService, "servicePrincipalCertificate", false);
                cliPassword = path.join(tl.getVariable('Agent.TempDirectory') || tl.getVariable('system.DefaultWorkingDirectory'), 'spnCert.pem');
                fs.writeFileSync(cliPassword, certificateContent);
                return Object.assign({}, process.env, { ARM_CLIENT_ID: servicePrincipalId, ARM_CLIENT_CERTIFICATE_PATH: cliPassword, ARM_TENANT_ID: tenantId, ARM_SUBSCRIPTION_ID: subscriptionID });
            }
            else {
                tl.debug('key based endpoint');
                cliPassword = tl.getEndpointAuthorizationParameter(connectedService, "serviceprincipalkey", false);
                return Object.assign({}, process.env, { ARM_CLIENT_ID: servicePrincipalId, ARM_CLIENT_SECRET: cliPassword, ARM_TENANT_ID: tenantId, ARM_SUBSCRIPTION_ID: subscriptionID });
            }
        }
        else if (authScheme.toLowerCase() == "managedserviceidentity") {
            return Object.assign({}, process.env, { ARM_TENANT_ID: this.tenantId, ARM_SUBSCRIPTION_ID: this.tenantId, ARM_USE_MSI: "true" });
        }
        else {
            throw tl.loc('AuthSchemeNotSupported', authScheme);
        }
    }
    static createFile(filePath, data) {
        try {
            fs.writeFileSync(filePath, data);
        }
        catch (err) {
            this.deleteFile(filePath);
            throw err;
        }
    }
    static deleteFile(filePath) {
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
exports.TerraformCliTask = TerraformCliTask;
var task = new TerraformCliTask();
task.run();
