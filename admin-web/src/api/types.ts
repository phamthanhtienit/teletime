export type Role = "ADMIN" | "AGENT";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface ShiftRegistration {
  id: string;
  userId: string;
  shiftId: string;
  date: string;
  status: RequestStatus;
  note?: string | null;
  user: { id: string; fullName: string; email: string };
  shift: Shift;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  checkInIp: string | null;
  checkOutIp: string | null;
  user?: { id: string; fullName: string; email: string };
}

export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: RequestStatus;
  user: { id: string; fullName: string; email: string };
}

export interface OfficeSetting {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  allowedIps: string[];
}
