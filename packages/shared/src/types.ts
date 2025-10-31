/**
 * Shared API types and contracts for mack.link
 * This ensures type consistency between worker, admin, and mobile
 */

import { z } from 'zod';

// ============================================================================
// Link Types
// ============================================================================

export const LinkSchema = z.object({
  shortcode: z.string(),
  url: z.string().url(),
  description: z.string().optional().default(''),
  redirectType: z.number().int().refine(val => [301, 302, 307, 308].includes(val)).default(301),
  tags: z.array(z.string()).default([]),
  archived: z.boolean().default(false),
  activatesAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  created: z.string(),
  updated: z.string(),
  clicks: z.number().int().default(0),
  lastClicked: z.string().nullable().optional(),
  passwordEnabled: z.boolean().default(false),
});

export type Link = z.infer<typeof LinkSchema>;

export const CreateLinkSchema = z.object({
  shortcode: z.string().min(2).max(50),
  url: z.string().url(),
  description: z.string().max(200).optional(),
  redirectType: z.number().int().refine(val => [301, 302, 307, 308].includes(val)).optional(),
  tags: z.array(z.string().max(32)).max(20).optional(),
  archived: z.boolean().optional(),
  activatesAt: z.string().optional(),
  expiresAt: z.string().optional(),
  password: z.string().min(8).max(128).optional(),
});

export type CreateLinkData = z.infer<typeof CreateLinkSchema>;

export const UpdateLinkSchema = CreateLinkSchema.partial().omit({ shortcode: true });
export type UpdateLinkData = z.infer<typeof UpdateLinkSchema>;

export const LinksResponseSchema = z.record(z.string(), LinkSchema);
export type LinksResponse = z.infer<typeof LinksResponseSchema>;

export const ListLinksResponseSchema = z.object({
  links: LinksResponseSchema,
  cursor: z.string().nullable().optional(),
});
export type ListLinksResponse = z.infer<typeof ListLinksResponseSchema>;

// ============================================================================
// Analytics Types
// ============================================================================

export const AnalyticsOverviewSchema = z.object({
  totalClicks: z.number().int(),
  clicksToday: z.number().int(),
  weeklyTotal: z.number().int(),
  averageDaily: z.number(),
  trend: z.array(z.object({
    day: z.string(),
    clicks: z.number().int(),
  })).optional(),
});

export type AnalyticsOverview = z.infer<typeof AnalyticsOverviewSchema>;

export const TimeseriesPointSchema = z.object({
  date: z.string(),
  clicks: z.number().int(),
});

export const TimeseriesResponseSchema = z.object({
  points: z.array(TimeseriesPointSchema),
});

export type TimeseriesResponse = z.infer<typeof TimeseriesResponseSchema>;

export const TimeseriesLinksSeriesSchema = z.object({
  shortcode: z.string(),
  total: z.number().int(),
  values: z.array(z.number().int()),
});

export const TimeseriesLinksResponseSchema = z.object({
  labels: z.array(z.string()),
  series: z.array(TimeseriesLinksSeriesSchema),
});

export type TimeseriesLinksResponse = z.infer<typeof TimeseriesLinksResponseSchema>;

export const BreakdownItemSchema = z.object({
  key: z.string(),
  clicks: z.number().int(),
});

export const BreakdownResponseSchema = z.object({
  items: z.array(BreakdownItemSchema),
});

export type BreakdownResponse = z.infer<typeof BreakdownResponseSchema>;

// ============================================================================
// Auth Types
// ============================================================================

export const UserSchema = z.object({
  login: z.string(),
  id: z.number().int(),
  name: z.string(),
  avatar_url: z.string().url(),
  email: z.string().email().optional(),
});

export type User = z.infer<typeof UserSchema>;

// ============================================================================
// Password Protection Types
// ============================================================================

export const PasswordVerificationRequestSchema = z.object({
  shortcode: z.string(),
  password: z.string(),
});

export const PasswordVerificationResponseSchema = z.object({
  success: z.boolean(),
  sessionToken: z.string().optional(),
  url: z.string().url().optional(),
  message: z.string().optional(),
});

// ============================================================================
// Reserved Paths Types
// ============================================================================

export const ReservedPathsResponseSchema = z.object({
  reserved: z.array(z.string()),
  count: z.number().int(),
  updatedAt: z.string(),
});

export type ReservedPathsResponse = z.infer<typeof ReservedPathsResponseSchema>;

// ============================================================================
// Bulk Operations Types
// ============================================================================

export const BulkCreateRequestSchema = z.object({
  items: z.array(CreateLinkSchema).max(100),
});

export const BulkCreateResponseSchema = z.object({
  created: z.array(LinkSchema),
  conflicts: z.array(z.string()),
  errors: z.array(z.object({
    shortcode: z.string().optional(),
    error: z.string(),
  })),
});

export type BulkCreateResponse = z.infer<typeof BulkCreateResponseSchema>;

export const BulkDeleteRequestSchema = z.object({
  shortcodes: z.array(z.string()).max(100),
});

export const BulkDeleteResponseSchema = z.object({
  message: z.string(),
  results: z.object({
    deleted: z.array(z.string()),
    notFound: z.array(z.string()),
    errors: z.array(z.object({
      shortcode: z.string(),
      error: z.string(),
    })),
  }),
});

export type BulkDeleteResponse = z.infer<typeof BulkDeleteResponseSchema>;

// ============================================================================
// Error Types
// ============================================================================

export const APIErrorSchema = z.object({
  error: z.string(),
  category: z.string().optional(),
  timestamp: z.string().optional(),
});

export type APIError = z.infer<typeof APIErrorSchema>;

