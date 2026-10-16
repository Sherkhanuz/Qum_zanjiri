// Bazaga ulanish. Serverda — Neon (HTTP orqali, har so'rov alohida va qisqa).
// Mahalliy ishga tushirish va sinovlarda scripts/dev.mjs globalThis.__QZ_DB__ ni o'rnatadi.
import { neon } from '@neondatabase/serverless';

let sql = null;

export function dbUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
}

// Natija: qatorlar massivi (har qator — obyekt). Parametrlar faqat matn, son yoki null.
export async function q(text, params = []) {
  if (globalThis.__QZ_DB__) return globalThis.__QZ_DB__(text, params);
  if (!sql) {
    const url = dbUrl();
    if (!url) {
      const e = new Error('DATABASE_URL sozlanmagan');
      e.qz = 'no_database';
      throw e;
    }
    sql = neon(url);
  }
  return sql.query(text, params);
}

// Kolleksiyalar
export const JOURNALS = ['reys', 'vagon', 'tex', 'mat', 'xar', 'inv'];
export const SYNC_COLLS = ['config', 'reys', 'vagon', 'tex', 'mat', 'xar', 'inv', 'karyer'];
export const ALL_COLLS = ['config', 'reys', 'vagon', 'tex', 'mat', 'xar', 'inv', 'karyer', 'log', 'cfglog'];
