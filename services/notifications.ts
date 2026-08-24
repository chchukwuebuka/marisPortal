/**
 * In-app notifications. The list endpoint is paginated (unlike the catalogue
 * lists); `unread-count` declares no schema, so it is parsed permissively.
 */

import { api } from "@/lib/api";
import { toDomainNotification } from "@/lib/api/adapters";
import type { ApiNotification, ApiPaginated } from "@/lib/api/types";
import type { AppNotification } from "@/types/domain";

export interface NotificationPage {
  notifications: AppNotification[];
  count: number;
  hasNext: boolean;
}

/** GET /notifications/ — one page of the applicant's notifications. */
export async function getNotifications(
  page = 1,
  pageSize = 20,
): Promise<NotificationPage> {
  const data = await api.get<ApiPaginated<ApiNotification>>("/notifications/", {
    query: { page, page_size: pageSize },
  });
  return {
    notifications: (data.results ?? []).map(toDomainNotification),
    count: data.count ?? 0,
    hasNext: Boolean(data.next),
  };
}

/** GET /notifications/unread-count/ — number of unread notifications. */
export async function getUnreadCount(): Promise<number> {
  const raw = await api.get<unknown>("/notifications/unread-count/");
  if (typeof raw === "number") return raw;
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const key of ["unread_count", "count", "unread"]) {
      if (typeof o[key] === "number") return o[key] as number;
    }
  }
  return 0;
}

/** POST /notifications/{id}/read/ — mark a single notification read. */
export async function markRead(id: number | string): Promise<void> {
  await api.post<void>(`/notifications/${id}/read/`);
}

/** POST /notifications/read-all/ — mark every notification read. */
export async function markAllRead(): Promise<void> {
  await api.post<void>("/notifications/read-all/");
}
