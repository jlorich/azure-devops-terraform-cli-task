import task = require('azure-pipelines-task-lib/task');
import { injectable } from "inversify";

/**
 * Strong-type accessor for Task configuration
 */
@injectable()
export class TaskOptions {

    readonly ConnectedServiceName : string;
    readonly UseTargetSubscriptionForBackend : boolean;
    readonly BackendConnectedServiceName : string;
    readonly TargetStorageAccountName : string;
    readonly BackendStorageAccountName : string;
    readonly BackendContainerName : string;
    readonly BackendStateFileKey : string;
    readonly ScriptLocation : string;
    readonly ScriptPath : string;
    readonly Cwd : string;
    readonly Script : string;
    readonly Initialize : boolean;
    readonly TempDir : string;

    constructor() {
        this.ConnectedServiceName = task.getInput("connectedServiceName", true)
        this.UseTargetSubscriptionForBackend = task.getInput("useTargetSubscriptionForBackend") === "true";
        this.BackendConnectedServiceName = task.getInput("backendConnectedServiceName", false)
        this.BackendStorageAccountName = task.getInput("backendStorageAccountName", false)
        this.TargetStorageAccountName = task.getInput("targetStorageAccountName", false)
        this.BackendContainerName = task.getInput("backendContainerName", true)
        this.BackendStateFileKey = task.getInput("backendStateFileKey", true)
        this.ScriptLocation = task.getInput("scriptLocation", true)
        this.ScriptPath = task.getInput("scriptPath")
        this.Script = task.getInput("script")
        this.Cwd = task.getInput("cwd")
        this.Initialize = task.getInput("initialize") === "true";
        
        this.TempDir = task.getVariable("Agent.TempDirectory");
    }
}