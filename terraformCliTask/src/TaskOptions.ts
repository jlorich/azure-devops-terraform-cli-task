import task = require('azure-pipelines-task-lib/task');
import { injectable } from "inversify";

/**
 * Strong-type accessor for Task configuration
 */
@injectable()
export class TaskOptions {

    readonly ArmServiceConnectionName : string;
    readonly ScriptLocation : string;
    readonly ScriptPath : string;
    readonly Cwd : string;
    readonly InlineScript : string;
    readonly Init : boolean;
    readonly TempDir : string;

    constructor() {
        this.ArmServiceConnectionName = task.getInput("ArmServiceConnection", true)
        this.ScriptLocation = task.getInput("scriptLocation", true)
        this.ScriptPath = task.getInput("scriptPath")
        this.InlineScript = task.getInput("inlineScript")
        this.Cwd = task.getInput("cwd")
        this.Init = task.getInput("initialize") === "true";
        this.TempDir = task.getVariable("Agent.TempDirectory");
    }
}