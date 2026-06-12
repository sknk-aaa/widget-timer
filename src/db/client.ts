import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

export const expoDb = openDatabaseSync('imasugu.db');

export const db = drizzle(expoDb, { schema });

export type Db = typeof db;
