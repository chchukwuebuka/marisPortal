import { api } from "@/lib/api";

export interface HostelBed {
  id: number;
  label: string;
  status: "available" | "occupied" | "reserved" | "maintenance";
}

export interface HostelRoom {
  id: number;
  room_number: string;
  room_type: string;
  room_type_display: string;
  floor: number;
  capacity: number;
  beds?: HostelBed[];
}

export interface HostelBlock {
  id: number;
  name: string;
  code: string;
  rooms?: HostelRoom[];
}

export interface Hostel {
  id: number;
  name: string;
  code: string;
  gender: "male" | "female" | "mixed";
  gender_display: string;
  campus: string;
  description: string;
  capacity: number;
  is_active: boolean;
  blocks?: HostelBlock[];
}

export interface HostelApplication {
  id: number;
  student: number;
  student_matric: string;
  student_name: string;
  session: number;
  session_name: string;
  preferred_hostel: number | null;
  preferred_hostel_name: string | null;
  preferred_room_type: string;
  special_requirements: string;
  status: "pending" | "approved" | "allocated" | "rejected" | "cancelled";
  created_at: string;
}

export interface Roommate {
  matric_number: string;
  name: string;
  programme: string;
  level: string;
  bed: string;
}

export interface HostelAllocation {
  allocated: boolean;
  message?: string;
  allocation_id?: number;
  hostel_name?: string;
  gender?: string;
  block_name?: string;
  room_number?: string;
  room_type?: string;
  floor?: number;
  bed_number?: string;
  allocated_at?: string;
  session?: string;
  roommates?: Roommate[];
}

export interface HostelMaintenance {
  id: number;
  issue_type: "plumbing" | "electrical" | "furniture" | "damage" | "other";
  issue_type_display: string;
  description: string;
  status: "pending" | "in_progress" | "resolved";
  status_display: string;
  reported_at: string;
  resolved_at: string | null;
}

export async function getHostelsAvailable(): Promise<Hostel[]> {
  const res = await api.get<any>("/hostels/available/");
  return Array.isArray(res) ? res : res.results || [];
}

export async function getMyHostelApplications(): Promise<HostelApplication[]> {
  const res = await api.get<any>("/hostels/apply/");
  return Array.isArray(res) ? res : res.results || [];
}

export async function applyForHostel(data: {
  session_id?: number;
  preferred_hostel_id?: number;
  preferred_room_type?: string;
  special_requirements?: string;
}): Promise<HostelApplication> {
  return api.post<HostelApplication>("/hostels/apply/", data);
}

export async function getMyHostelAllocation(): Promise<HostelAllocation> {
  return api.get<HostelAllocation>("/hostels/my-allocation/");
}

export async function reportHostelMaintenance(data: {
  issue_type: string;
  description: string;
}): Promise<HostelMaintenance> {
  return api.post<HostelMaintenance>("/hostels/maintenance/report/", data);
}
