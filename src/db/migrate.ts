import { expoDb } from './client';

// schema.ts と一致させる。端末内ローカルDBのため、起動時に冪等な DDL を適用する。
// （drizzle-kit generate の出力は参照用に drizzle/ に残してある）
const DDL = `
CREATE TABLE IF NOT EXISTS \`presets\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`icon\` text NOT NULL,
  \`color\` text NOT NULL,
  \`duration_sec\` integer NOT NULL,
  \`in_widget\` integer DEFAULT false NOT NULL,
  \`sort_order\` integer DEFAULT 0 NOT NULL
);
CREATE TABLE IF NOT EXISTS \`running_timers\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`preset_id\` text,
  \`icon\` text NOT NULL,
  \`color\` text NOT NULL,
  \`duration_sec\` integer NOT NULL,
  \`end_at\` integer NOT NULL,
  \`state\` text DEFAULT 'running' NOT NULL,
  \`paused_remaining_sec\` integer,
  \`created_at\` integer NOT NULL
);
CREATE TABLE IF NOT EXISTS \`launch_history\` (
  \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  \`preset_id\` text,
  \`duration_sec\` integer NOT NULL,
  \`started_at\` integer NOT NULL,
  \`source\` text NOT NULL
);
CREATE TABLE IF NOT EXISTS \`meta\` (
  \`key\` text PRIMARY KEY NOT NULL,
  \`value\` text NOT NULL
);
`;

export function runMigrations(): void {
  expoDb.execSync(DDL);
}
