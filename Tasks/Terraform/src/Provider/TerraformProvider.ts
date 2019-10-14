import { injectable } from "inversify";

/**
 * A Provider for Terraform
 */
@injectable()
export abstract class TerraformProvider {
    /**
     * Get's a dictionary containing the environment variables needed
     * to authenticate Terraform with the given Provider
     */
    abstract configure() : Promise<void>;

    /**
     * Get's a dictionary containing the environment variables needed
     * to authenticate Terraform with the given Provider
     */
    abstract getEnv() : Promise<{ [key: string]: string; }>;

    /**
     * Get's a dictionary containing the backend-config parameters
     * to set on init
     */
    abstract getBackendConfig() : Promise<{ [key: string]: string; }>;
}