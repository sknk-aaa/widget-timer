import { expoDb } from './client';

// schema.ts と一致させる。端末内ローカルDBのため、起動時に冪等な DDL を適用する。
// （drizzle-kit generate の出力は参照用に drizzle/ に残してある）
const DDL = `
CREATE TABLE IF NOT EXISTS \`presets\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`name\` text DEFAULT '' NOT NULL,
  \`icon\` text NOT NULL,
  \`color\` text NOT NULL,
  \`duration_sec\` integer NOT NULL,
  \`in_widget\` integer DEFAULT false NOT NULL,
  \`sort_order\` integer DEFAULT 0 NOT NULL,
  \`sound\` text DEFAULT 'default' NOT NULL
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
  \`created_at\` integer NOT NULL,
  \`sound\` text DEFAULT 'default' NOT NULL
);
CREATE TABLE IF NOT EXISTS \`boards\` (
  \`id\` text PRIMARY KEY NOT NULL,
  \`name\` text DEFAULT '' NOT NULL,
  \`sort_order\` integer DEFAULT 0 NOT NULL
);
CREATE TABLE IF NOT EXISTS \`board_presets\` (
  \`board_id\` text NOT NULL,
  \`preset_id\` text NOT NULL,
  \`sort_order\` integer DEFAULT 0 NOT NULL
);
CREATE TABLE IF NOT EXISTS \`meta\` (
  \`key\` text PRIMARY KEY NOT NULL,
  \`value\` text NOT NULL
);
CREATE TABLE IF NOT EXISTS \`launch_history\` (
  \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  \`preset_id\` text,
  \`duration_sec\` integer NOT NULL,
  \`started_at\` integer NOT NULL,
  \`source\` text NOT NULL
);
`;

export function runMigrations(): void {
  expoDb.execSync(DDL);
  // 既存インストール向け：CREATE TABLE IF NOT EXISTS では追加されない新カラムを冪等に補う。
  ensureColumn('presets', 'sound', "text NOT NULL DEFAULT 'default'");
  ensureColumn('presets', 'name', "text NOT NULL DEFAULT ''");
  ensureColumn('running_timers', 'sound', "text NOT NULL DEFAULT 'default'");
}

function ensureColumn(table: string, column: string, def: string): void {
  const cols = expoDb.getAllSync<{ name: string }>(`PRAGMA table_info('${table}')`);
  if (!cols.some((c) => c.name === column)) {
    expoDb.execSync(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
  }
}
