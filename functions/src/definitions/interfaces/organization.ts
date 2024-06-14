export interface Organization {
    name: string;
    secretTOTP: string;
}

export interface OrganizationWithId extends Organization {
    id: string;
}
