/**
 * A Provider for Terraform
 */
export interface TerraformProvider {
    /**
     * Get's a dictionary containing the environment variables needed
     * to authenticate Terraform with the given Provider
     */
    configure() : Promise<void>;

    /**
     * Get's a dictionary containing the environment variables needed
     * to authenticate Terraform with the given Provider
     */
    getEnv() : Promise<{ [key: string]: string; }>;

    /**
     * Get's a dictionary containing the backend-config parameters
     * to set on init
     */
    getBackendConfig() : Promise<{ [key: string]: string; }>;
}