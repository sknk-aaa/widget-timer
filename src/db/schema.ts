import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const presets = sqliteTable('presets', {
  id: text('id').primaryKey(),
  // 任意の表示名（空文字＝名前なし）。
  name: text('name').notNull().default(''),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  durationSec: integer('duration_sec').notNull(),
  inWidget: integer('in_widget', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  // アラート音ID（'default' or バンドル音 xylophone/digital/whale）。プリセットごとに選べる。
  sound: text('sound').notNull().default('default'),
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
  sound: text('sound').notNull().default('default'),
});

export const meta = sqliteTable('meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

// 起動履歴（「最近使った」「統計」の土台）。タイマー起動のたびに1行。
export const launchHistory = sqliteTable('launch_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  presetId: text('preset_id'),
  durationSec: integer('duration_sec').notNull(),
  startedAt: integer('started_at').notNull(),
  source: text('source', {
    enum: ['app', 'widget', 'liveactivity', 'quick'],
  }).notNull(),
});
