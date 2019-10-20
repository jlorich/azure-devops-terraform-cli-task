import { injectable } from "inversify";

/**
 * A Provider for Terraform
 */
@injectable()
export abstract class TerraformProvider {
    /**
     * Configures the file system and process environment variables necessary to run Terraform
     * in an authenticated manner.
     * 
     * @param exportToEnv - Should authentication params be set in the Process env
     *                      so they can be used in later tasks
     * 
     * @returns Variables to set for auth in the spawned process env
     */
    abstract authenticate(exportToProcessEnv : boolean) : Promise<{ [key: string]: string; }>;

    /**
     * Get's a dictionary containing the backend-config parameters
     * to set on init
     */
    abstract getBackendConfigOptions() : Promise<{ [key: string]: string; }>;
}