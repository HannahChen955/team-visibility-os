import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// ── Members ──────────────────────────────────────────────────────────────────
export const members = sqliteTable('members', {
  id:            text('id').primaryKey(),
  name:          text('name').notNull(),
  baseLocation:  text('base_location').notNull(),
  scope:         text('scope'),
  isActive:      integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt:     text('created_at').notNull().default(''),
})

// ── Tags ─────────────────────────────────────────────────────────────────────
export const tags = sqliteTable('tags', {
  id:        text('id').primaryKey(),
  name:      text('name').notNull(),
  category:  text('category').notNull(), // 'office'|'onsite_cm'|'wfh'|'leave'|'holiday'|'vn'
  colorHex:  text('color_hex').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(''),
})

// ── Locations ─────────────────────────────────────────────────────────────────
export const locations = sqliteTable('locations', {
  id:        text('id').primaryKey(),
  name:      text('name').notNull(),
  type:      text('type').notNull().default('office'), // 'office'|'cm_site'|'overseas'
  isBase:    integer('is_base', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(''),
})

// ── Status Entries ────────────────────────────────────────────────────────────
export const statusEntries = sqliteTable('status_entries', {
  id:         text('id').primaryKey(),
  memberId:   text('member_id').notNull().references(() => members.id),
  tagId:      text('tag_id').notNull().references(() => tags.id),
  locationId: text('location_id').references(() => locations.id),
  startDate:  text('start_date').notNull(), // YYYY-MM-DD
  endDate:    text('end_date').notNull(),   // YYYY-MM-DD
  notes:      text('notes'),
  createdAt:  text('created_at').notNull().default(''),
  updatedAt:  text('updated_at').notNull().default(''),
})

// ── Public Holidays ───────────────────────────────────────────────────────────
export const publicHolidays = sqliteTable('public_holidays', {
  id:        text('id').primaryKey(),
  date:      text('date').notNull().unique(), // YYYY-MM-DD
  name:      text('name').notNull(),
  isWorkday: integer('is_workday', { mode: 'boolean' }).notNull().default(false), // 补班日
  year:      integer('year').notNull(),
  createdAt: text('created_at').notNull().default(''),
})
