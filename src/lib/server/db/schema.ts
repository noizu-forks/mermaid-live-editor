import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  index,
  uniqueIndex,
  check
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable(
  'users',
  {
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    handle: text('handle'),
    id: text('id').primaryKey(),
    image: text('image'),
    name: text('name'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('idx_users_email').on(table.email),
    uniqueIndex('idx_users_handle').on(table.handle)
  ]
);

export const accounts = pgTable(
  'accounts',
  {
    accessToken: text('access_token'),
    accountId: text('account_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    id: text('id').primaryKey(),
    idToken: text('id_token'),
    password: text('password'),
    providerId: text('provider_id').notNull(),
    refreshToken: text('refresh_token'),
    scope: text('scope'),
    tokenType: text('token_type'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' })
  },
  (table) => [index('idx_accounts_user_id').on(table.userId)]
);

export const sessions = pgTable(
  'sessions',
  {
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    id: text('id').primaryKey(),
    ipAddress: text('ip_address'),
    token: text('token').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' })
  },
  (table) => [
    uniqueIndex('idx_sessions_token').on(table.token),
    index('idx_sessions_user_id').on(table.userId)
  ]
);

export const verifications = pgTable(
  'verifications',
  {
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    value: text('value').notNull()
  },
  (table) => [index('idx_verifications_identifier').on(table.identifier)]
);

// ─── Invite tokens ────────────────────────────────────────────────────────

export const inviteTokens = pgTable(
  'invite_tokens',
  {
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: text('created_by'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    id: text('id').primaryKey(),
    maxUses: integer('max_uses').default(1).notNull(),
    token: text('token').notNull(),
    useCount: integer('use_count').default(0).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    usedBy: text('used_by')
  },
  (table) => [uniqueIndex('idx_invite_tokens_token').on(table.token)]
);

// ─── Diagram persistence (Phase 1) ─────────────────────────────────────────

export const folders = pgTable(
  'folders',
  {
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    parentId: text('parent_id').references((): unknown => folders.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' })
  },
  (table) => [
    index('idx_folders_user_id').on(table.userId),
    index('idx_folders_parent_id').on(table.parentId)
  ]
);

export const diagrams = pgTable(
  'diagrams',
  {
    code: text('code').notNull(),
    config: text('config'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    folderId: text('folder_id').references(() => folders.id, { onDelete: 'set null' }),
    id: text('id').primaryKey(),
    starred: boolean('starred').notNull().default(false),
    thumbnail: text('thumbnail'),
    title: text('title'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    visibility: text('visibility').notNull().default('private')
  },
  (table) => [
    index('idx_diagrams_user_updated').on(table.userId, sql`updated_at DESC`),
    index('idx_diagrams_folder_id').on(table.folderId),
    index('idx_diagrams_visibility').on(table.visibility),
    index('idx_diagrams_starred').using('btree', table.userId, table.starred),
    check('chk_visibility', sql`visibility IN ('private', 'unlisted', 'public')`)
  ]
);

// ─── Organizations & sharing (Phase 2 — schema defined early) ───────────────

export const organizations = pgTable(
  'organizations',
  {
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [uniqueIndex('idx_organizations_slug').on(table.slug)]
);

export const orgMembers = pgTable(
  'org_members',
  {
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    id: text('id').primaryKey(),
    orgId: text('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' })
  },
  (table) => [
    uniqueIndex('idx_org_members_unique').on(table.orgId, table.userId),
    index('idx_org_members_user_id').on(table.userId)
  ]
);

export const diagramShares = pgTable(
  'diagram_shares',
  {
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    diagramId: text('diagram_id')
      .notNull()
      .references(() => diagrams.id, { onDelete: 'cascade' }),
    id: text('id').primaryKey(),
    permission: text('permission').notNull().default('view'),
    sharedWithOrgId: text('shared_with_org_id').references(() => organizations.id, {
      onDelete: 'cascade'
    }),
    sharedWithUserId: text('shared_with_user_id').references(() => users.id, {
      onDelete: 'cascade'
    })
  },
  (table) => [
    index('idx_diagram_shares_diagram').on(table.diagramId),
    index('idx_diagram_shares_user').on(table.sharedWithUserId),
    index('idx_diagram_shares_org').on(table.sharedWithOrgId),
    check(
      'chk_share_target',
      sql`shared_with_user_id IS NOT NULL OR shared_with_org_id IS NOT NULL`
    )
  ]
);
