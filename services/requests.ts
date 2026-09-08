import { api } from "@/lib/api";

export interface RequestTariffItem {
  type: string;
  name: string;
  fee: string;
}

export interface StudentRequestItem {
  id: number;
  request_type: string;
  request_type_display: string;
  reason: string;
  supporting_doc_url: string;
  status: "pending_payment" | "submitted" | "in_review" | "approved" | "rejected" | "completed" | "cancelled";
  status_display: string;
  fee_amount: string;
  is_paid: boolean;
  payment_link?: string | null;
  staff_notes?: string;
  created_at: string;
  reviewed_at?: string | null;
  target_programme?: string | null;
  target_department?: string | null;
  defer_until_session?: string | null;
}

export async function getMyStudentRequests(): Promise<StudentRequestItem[]> {
  const res = await api.get<any>("/requests/my-requests/");
  return Array.isArray(res) ? res : res.results || [];
}

export async function getRequestTariffSchedule(): Promise<RequestTariffItem[]> {
  const res = await api.get<any>("/requests/tariff-schedule/");
  return Array.isArray(res) ? res : [];
}

export async function submitStudentRequest(data: {
  request_type: string;
  reason: string;
  target_programme_id?: number;
  target_department_id?: number;
  defer_until_session_id?: number;
  supporting_doc_url?: string;
}): Promise<StudentRequestItem> {
  return api.post<StudentRequestItem>("/requests/my-requests/", data);
}

export async function getLmsSsoLaunchToken(): Promise<{
  sso_url: string;
  token: string;
  lms_provider: string;
}> {
  return api.post<{ sso_url: string; token: string; lms_provider: string }>("/lms/sso/launch/", {});
}
