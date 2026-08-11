import { z } from "zod";
import type { components } from "@/lib/api/schema";

type Schemas = components["schemas"];

const uuid = z.uuid();
const dateTime = z.iso.datetime();
const publicStatus = z.enum([
  "RECEIVED",
  "IN_PROGRESS",
  "WAITING_FOR_CUSTOMER",
  "RESOLVED",
  "CLOSED",
]);

export const paginationSchema: z.ZodType<Schemas["PublicPaginationMetaDto"]> = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

const ticketObjectSchema = z.object({
  id: uuid,
  ticketNumber: z.string().min(1),
  title: z.string().min(1),
  status: publicStatus,
  createdAt: dateTime,
  updatedAt: dateTime,
});
export const ticketSchema: z.ZodType<Schemas["PublicTicketSummaryDto"]> = ticketObjectSchema;

export const ticketDetailSchema: z.ZodType<Schemas["PublicTicketDetailDto"]> = ticketObjectSchema.extend({
  description: z.string(),
  firstResponseDueAt: dateTime.nullable().optional(),
  resolutionDueAt: dateTime.nullable().optional(),
  resolvedAt: dateTime.nullable().optional(),
  closedAt: dateTime.nullable().optional(),
});

export const timelineEntrySchema: z.ZodType<Schemas["PublicTimelineEntryDto"]> = z.object({
  id: uuid,
  type: z.enum(["COMMENT", "STATUS"]),
  content: z.string().optional(),
  correctsCommentId: uuid.nullable().optional(),
  author: z.string().optional(),
  status: publicStatus.optional(),
  createdAt: dateTime,
});

export const attachmentSchema: z.ZodType<Schemas["PublicAttachmentDataDto"]> = z.object({
  id: uuid,
  filename: z.string().min(1),
  mimeType: z.string().optional(),
  fileSize: z.number().int().nonnegative(),
  scanStatus: z.enum(["NOT_REQUIRED", "QUARANTINED", "PENDING", "SCANNING", "CLEAN", "INFECTED", "ERROR"]),
  error: z.string().nullable().optional(),
  createdAt: dateTime.optional(),
});

export const preferencesSchema: z.ZodType<Schemas["PublicPreferencesDataDto"]> = z.object({
  displayName: z.string().nullable().optional(),
  locale: z.string().min(2),
  lastSeenAt: dateTime.nullable().optional(),
});

export const trustedDeviceSchema: z.ZodType<Schemas["TrustedDeviceDataDto"]> = z.object({
  id: uuid,
  current: z.boolean(),
  createdAt: dateTime,
  lastUsedAt: dateTime.nullable().optional(),
  expiresAt: dateTime,
  revokedAt: dateTime.nullable().optional(),
});

export const catalogSchema: z.ZodType<Schemas["PublicCatalogDataDto"]> = z.object({
  categories: z.array(z.object({ id: uuid, name: z.string().min(1), description: z.string().nullable().optional() })),
  services: z.array(z.object({ key: z.string().min(1), label: z.string().min(1) })),
});

export const knowledgeSearchResultSchema: z.ZodType<Schemas["KnowledgeSearchResultDto"]> = z.object({
  id: uuid,
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().nullable().optional(),
  content: z.string().min(1),
  language: z.string().min(1),
  updatedAt: dateTime,
});

export const botReplySchema = z.object({
  mode: z.enum(["disabled", "unavailable", "reply"]),
  reply: z.string().nullable(),
  suggestedActions: z.array(z.string()),
});

export const conversationSchema = z.object({ id: uuid, state: z.string().min(1) });
const ticketDraftDataSchema = z.object({
  categoryId: uuid,
  title: z.string(),
  description: z.string(),
  impact: z.enum(["LOW", "MEDIUM", "HIGH"]),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH"]),
  customerAccountNumber: z.string().optional(),
  serviceKey: z.string().optional(),
});
export const conversationDetailSchema = z.object({
  id: uuid,
  state: z.string().min(1),
  status: z.string().min(1),
  createdAt: dateTime,
  lastMessageAt: dateTime.nullable().optional(),
  ticketId: uuid.nullable().optional(),
  draft: ticketDraftDataSchema.nullable().optional(),
});
export const challengeSchema = z.object({ challengeId: uuid });
export const verifiedSchema = z.object({ verified: z.boolean() });
export const restoredSchema = z.object({ restored: z.boolean() });
export const confirmationSchema = z.object({ conversationId: uuid, ticketId: uuid, ticketNumber: z.string().min(1) });
export const commentSchema = z.object({ id: uuid, content: z.string() });
export const revokedSchema = z.object({ revoked: z.literal(true) });
export const draftSavedSchema = z.object({
  id: uuid,
  state: z.enum(["QUALIFY", "DRAFT"]),
  draft: ticketDraftDataSchema,
});
