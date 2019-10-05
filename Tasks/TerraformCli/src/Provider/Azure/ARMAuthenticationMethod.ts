/**
 * Different ways to authenticate from an ARM connected service
 */
export enum ARMAuthenticationMethod {
    Unknown = 1,
    ServicePrincipalKey,
    ServicePrincipalCertificate,
    ManagedIdentity,
}