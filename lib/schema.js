// Baza sxemasi. Har bir element — bitta SQL buyruq (Neon HTTP bir so'rovda bitta buyruq bajaradi).
// Hammasi takror ishga tushirishga chidamli: mavjud jadval va ma'lumotga tegmaydi.
export const SCHEMA_VERSION = 1;

export const SCHEMA = [
  `CREATE SEQUENCE IF NOT EXISTS docs_seq`,

  // Hujjatlar: sahifa ishlatadigan «kolleksiya / hujjat» tuzilmasi. seq — o'zgarish tartib raqami (sinxronlash uchun).
  `CREATE TABLE IF NOT EXISTS docs (
     coll text NOT NULL,
     id text NOT NULL,
     body jsonb NOT NULL,
     seq bigint NOT NULL DEFAULT 0,
     size integer NOT NULL DEFAULT 0,
     updated_at timestamptz NOT NULL DEFAULT now(),
     updated_by text,
     PRIMARY KEY (coll, id)
   )`,
  `CREATE INDEX IF NOT EXISTS docs_seq_i ON docs (seq)`,
  `CREATE INDEX IF NOT EXISTS docs_day_i ON docs (coll, (body->>'d'))`,

  `CREATE TABLE IF NOT EXISTS users (
     id serial PRIMARY KEY,
     login text NOT NULL UNIQUE,
     name text NOT NULL,
     role text NOT NULL CHECK (role IN ('admin','operator','viewer')),
     site text,
     pass text NOT NULL,
     pv integer NOT NULL DEFAULT 1,
     active boolean NOT NULL DEFAULT true,
     created_at timestamptz NOT NULL DEFAULT now(),
     last_login timestamptz
   )`,

  // Noto'g'ri parol urinishlari hisobi
  `CREATE TABLE IF NOT EXISTS throttle (
     k text PRIMARY KEY,
     n integer NOT NULL,
     since timestamptz NOT NULL,
     until timestamptz
   )`,

  // Server jurnali: har bir yozish amali. Faqat qo'shiladi.
  `CREATE TABLE IF NOT EXISTS audit (
     n bigserial PRIMARY KEY,
     at timestamptz NOT NULL DEFAULT now(),
     uid integer,
     act text NOT NULL,
     coll text,
     doc text,
     info jsonb
   )`,
  `CREATE INDEX IF NOT EXISTS audit_at_i ON audit (at)`,

  // Chuqur birlashtirish: ichma-ich obyektlar birlashadi; massiv, son, matn va null — almashtiriladi.
  // Sahifaning update() amali aynan shu qoidaga tayanadi (bitta qator o'zgarsa, qolganlari joyida qoladi).
  `CREATE OR REPLACE FUNCTION jsonb_deep_merge(a jsonb, b jsonb) RETURNS jsonb
   LANGUAGE sql IMMUTABLE AS $fn$
     SELECT CASE
       WHEN jsonb_typeof(a) = 'object' AND jsonb_typeof(b) = 'object' THEN (
         SELECT coalesce(jsonb_object_agg(k, v), '{}'::jsonb) FROM (
           SELECT coalesce(ea.key, eb.key) AS k,
                  CASE
                    WHEN ea.key IS NULL THEN eb.value
                    WHEN eb.key IS NULL THEN ea.value
                    WHEN jsonb_typeof(ea.value) = 'object' AND jsonb_typeof(eb.value) = 'object'
                      THEN jsonb_deep_merge(ea.value, eb.value)
                    ELSE eb.value
                  END AS v
           FROM jsonb_each(a) AS ea FULL JOIN jsonb_each(b) AS eb ON ea.key = eb.key
         ) s)
       ELSE b
     END
   $fn$`,

  // Har yozishda: yangi tartib raqami, hajm, vaqt. Juda katta hujjat rad etiladi.
  `CREATE OR REPLACE FUNCTION docs_stamp() RETURNS trigger LANGUAGE plpgsql AS $fn$
   BEGIN
     NEW.seq := nextval('docs_seq');
     NEW.size := octet_length(NEW.body::text);
     NEW.updated_at := clock_timestamp();
     IF NEW.size > 1500000 THEN
       RAISE EXCEPTION 'hujjat juda katta' USING ERRCODE = '54000';
     END IF;
     RETURN NEW;
   END
   $fn$`,
  `CREATE OR REPLACE TRIGGER docs_stamp_t BEFORE INSERT OR UPDATE ON docs FOR EACH ROW EXECUTE FUNCTION docs_stamp()`,

  `CREATE OR REPLACE FUNCTION audit_lock() RETURNS trigger LANGUAGE plpgsql AS $fn$
   BEGIN
     RAISE EXCEPTION 'server jurnali o''zgartirilmaydi' USING ERRCODE = '42501';
   END
   $fn$`,
  `CREATE OR REPLACE TRIGGER audit_lock_t BEFORE UPDATE OR DELETE ON audit FOR EACH ROW EXECUTE FUNCTION audit_lock()`,
];
