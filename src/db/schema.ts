import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const presets = sqliteTable('presets', {
  id: text('id').primaryKey(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  durationSec: integer('duration_sec').notNull(),
  inWidget: integer('in_widget', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const runningTimers = sqliteTable('running_timers', {
  id: text('id').primaryKey(),
  presetId: text('preset_id'),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  durationSec: integer('duration_sec').notNull(),
  endAt: integer('end_at').notNull(),
  state: text('state', { enum: ['running', 'paused', 'finished'] })
    .notNull()
    .default('running'),
  pausedRemainingSec: integer('paused_remaining_sec'),
  createdAt: integer('created_at').notNull(),
});

export const meta = sqliteTable('meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
