import { Timestamp } from "firebase-admin/firestore";

export enum Role {
    admin = "admin",
    employee = "employee",
    guest = "guest"
}

export interface Break {
    start: Timestamp;
    end: Timestamp|null;
    description: string;
}

export interface Attendance {
    timeIn: Timestamp;
    timeOut: Timestamp|null;
    breaks: Break[];
}

export interface User {
    uid: string;
    name: string;
    surname: string;
    email: string;
    createdAt: Timestamp;
    role: Role;
    attendance: Attendance[];
}