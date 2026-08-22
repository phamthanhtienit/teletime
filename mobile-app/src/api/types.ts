export type Role = "ADMIN" | "AGENT";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: Role;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface ShiftRegistration {
  id: string;
  date: string;
  status: RequestStatus;
  shift: Shift;
}

export interface Attendance {
  id: string;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
}

export interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: RequestStatus;
}
