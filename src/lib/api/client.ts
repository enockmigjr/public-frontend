import type { components } from "@/lib/api/schema";
import type { SupportContext } from "@/lib/auth/support-context";
import { z } from "zod";
import {
  attachmentSchema,
  botReplySchema,
  catalogSchema,
  challengeSchema,
  commentSchema,
  confirmationSchema,
  conversationDetailSchema,
  conversationSchema,
  draftSavedSchema,
  paginationSchema,
  preferencesSchema,
  restoredSchema,
  revokedSchema,
  ticketDetailSchema,
  ticketSchema,
  timelineEntrySchema,
  knowledgeSearchResultSchema,
  trustedDeviceSchema,
  verifiedSchema,
} from "@/lib/api/runtime-schemas";

type Schemas = components["schemas"];
export type PublicTicket = Schemas["PublicTicketSummaryDto"];
export type PublicTicketDetail = Schemas["PublicTicketDetailDto"];
export type TimelineEntry = Schemas["PublicTimelineEntryDto"];
export type PublicAttachment = Schemas["PublicAttachmentDataDto"];
export type PublicPreferences = Schemas["PublicPreferencesDataDto"];
export type TrustedDevice = Schemas["TrustedDeviceDataDto"];
export type TicketDraft = Schemas["SavePublicTicketDraftDto"];
export type PublicCatalog = Schemas["PublicCatalogDataDto"];

interface Envelope<T> {
  readonly success: true;
  readonly data: T;
  readonly meta?: Schemas["PublicPaginationMetaDto"];
  readonly message?: string;
}

const errorEnvelopeSchema = z.object({
  success: z.literal(false).optional(),
  error: z.object({ code: z.string().optional(), message: z.string().optional() }).optional(),
  message: z.string().optional(),
});

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code = "UNKNOWN_ERROR",
  ) {
    super(message);
  }
}

const csrfTokens: Record<SupportContext, string | null> = { portal: null, widget: null };

async function csrf(context: SupportContext): Promise<string> {
  if (csrfTokens[context]) return csrfTokens[context];
  const response = await fetch(`/api/auth/csrf?context=${context}`, { cache: "no-store" });
  const payload: unknown = await response.json();
  const parsed = z.object({ success: z.literal(true), data: z.object({ csrfToken: z.string().min(20) }) }).safeParse(payload);
  if (!response.ok || !parsed.success) throw new ApiError("La protection de la requête est indisponible.", response.status, "INVALID_CSRF_RESPONSE");
  csrfTokens[context] = parsed.data.data.csrfToken;
  return parsed.data.data.csrfToken;
}

async function request<T>(context: SupportContext, path: string, dataSchema: z.ZodType<T>, init: RequestInit = {}, mutation = false, retryCsrf = true): Promise<Envelope<T>> {
  const headers = new Headers(init.headers);
  headers.set("x-support-context", context);
  if (mutation) headers.set("x-csrf-token", await csrf(context));
  const response = await fetch(path, { ...init, headers, cache: "no-store" });
  const payload: unknown = await response.json();
  const parsedError = errorEnvelopeSchema.safeParse(payload);
  const error = parsedError.success ? parsedError.data : undefined;
  if (!response.ok || error) {
    if (response.status === 401) {
      csrfTokens[context] = null;
      if (context === "portal" && typeof window !== "undefined") window.dispatchEvent(new Event("public-session-expired"));
    }
    if (response.status === 403 && error?.error?.code === "CSRF_INVALID") {
      csrfTokens[context] = null;
      if (mutation && retryCsrf) return request(context, path, dataSchema, init, mutation, false);
    }
    throw new ApiError(error?.error?.message ?? error?.message ?? "Une erreur est survenue.", response.status, error?.error?.code);
  }
  const parsed = z.object({ success: z.literal(true), data: dataSchema, meta: paginationSchema.optional(), message: z.string().optional() }).safeParse(payload);
  if (!parsed.success) throw new ApiError("La réponse du support est invalide.", 502, "INVALID_API_RESPONSE");
  return parsed.data;
}

function mutationHeaders(key: string, json = true): HeadersInit {
  return {
    ...(json ? { "content-type": "application/json" } : {}),
    "Idempotency-Key": key,
  };
}

function createPublicApi(context: SupportContext) {
  return {
    restore: async () => { const result = await request(context, "/api/auth/session/restore", restoredSchema, { method: "POST" }, true); csrfTokens[context] = null; return result; },
    requestCode: (email: string) => request(context, "/api/auth/email/request", challengeSchema, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) }, true),
    consumeCode: async (challengeId: string, code: string) => { const result = await request(context, "/api/auth/email/consume", verifiedSchema, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ challengeId, code }) }, true); csrfTokens[context] = null; return result; },
    catalog: () => request(context, "/api/public/catalog", catalogSchema),
    tickets: (page = 1) => request(context, `/api/public/tickets?page=${page}&limit=10`, z.array(ticketSchema)),
    ticket: (id: string) => request(context, `/api/public/tickets/${id}`, ticketDetailSchema),
    timeline: (id: string) => request(context, `/api/public/tickets/${id}/timeline`, z.array(timelineEntrySchema)),
    attachments: (id: string) => request(context, `/api/public/tickets/${id}/attachments`, z.array(attachmentSchema)),
    conversationAttachments: (id: string) =>
      request(context, `/api/public/conversations/${id}/attachments`, z.array(attachmentSchema)),
    preferences: () => request(context, "/api/public/preferences", preferencesSchema.nullable()),
    devices: () => request(context, "/api/public/session/devices", z.array(trustedDeviceSchema)),
    createConversation: (key: string, serviceKey?: string) => request(context, "/api/public/conversations", conversationSchema, { method: "POST", headers: mutationHeaders(key), body: JSON.stringify({ ...(serviceKey ? { serviceKey } : {}) }) }, true),
    conversation: (id: string) => request(context, `/api/public/conversations/${id}`, conversationDetailSchema),
    saveDraft: (id: string, draft: TicketDraft) => request(context, `/api/public/conversations/${id}/draft`, draftSavedSchema, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) }, true),
    confirm: (id: string, key: string) => request(context, `/api/public/conversations/${id}/confirm`, confirmationSchema, { method: "POST", headers: mutationHeaders(key), body: JSON.stringify({ confirmed: true }) }, true),
    comment: (id: string, content: string, key: string) => request(context, `/api/public/tickets/${id}/comments`, commentSchema, { method: "POST", headers: mutationHeaders(key), body: JSON.stringify({ content }) }, true),
    submitSatisfaction: (id: string, token: string, note: number, comment?: string) =>
      request(context, `/api/public/tickets/${id}/satisfaction`, z.object({ message: z.string() }).passthrough(), { method: "POST", headers: mutationHeaders(token), body: JSON.stringify({ token, note, comment }) }, true),
    updatePreferences: (value: { displayName?: string; locale?: string }, key: string) => request(context, "/api/public/preferences", preferencesSchema.nullable(), { method: "PATCH", headers: mutationHeaders(key), body: JSON.stringify(value) }, true),
    revokeDevice: (id: string) => request(context, `/api/public/session/devices/${id}`, revokedSchema, { method: "DELETE" }, true),
    forgetCurrentDevice: () => request(context, "/api/auth/session/revoke-device", revokedSchema, { method: "POST" }, true),
    upload: (id: string, file: File, key: string) => { const body = new FormData(); body.set("file", file); return request(context, `/api/public/tickets/${id}/attachments`, attachmentSchema, { method: "POST", headers: mutationHeaders(key, false), body }, true); },
    conversationUpload: (id: string, file: File, key: string) => {
      const body = new FormData();
      body.set("file", file);
      return request(context, `/api/public/conversations/${id}/attachments`, attachmentSchema, { method: "POST", headers: mutationHeaders(key, false), body }, true);
    },
    conversationAttachmentStatus: (id: string, attachmentId: string) =>
      request(context, `/api/public/conversations/${id}/attachments/${attachmentId}/status`, attachmentSchema),
    knowledgeSearch: (q: string, limit = 5) => request(context, `/api/public/knowledge/search?q=${encodeURIComponent(q)}&limit=${limit}`, z.array(knowledgeSearchResultSchema)),
    knowledgeArticle: (slug: string) => request(context, `/api/public/knowledge/${slug}`, knowledgeSearchResultSchema),
    botReply: (conversationId: string, message: string, key: string) => request(context, `/api/public/conversations/${conversationId}/bot`, botReplySchema, { method: "POST", headers: mutationHeaders(key), body: JSON.stringify({ message }) }, true),
  };
}

export type PublicApi = ReturnType<typeof createPublicApi>;
export const publicApi = createPublicApi("portal");
export const widgetApi = createPublicApi("widget");
