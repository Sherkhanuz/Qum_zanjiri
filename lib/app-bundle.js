// Sahifa dasturi: siqilgan bo'laklarni birlashtirib ochadi (bo'laklarni scripts/pack.mjs yig'adi)
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import p1 from './app-code-1.js';
import p2 from './app-code-2.js';
import p3 from './app-code-3.js';
import p4 from './app-code-4.js';

export const CODE = zlib.brotliDecompressSync(Buffer.from(p1 + p2 + p3 + p4, 'base64')).toString('utf8');
export const HASH = crypto.createHash('sha256').update(CODE).digest('hex').slice(0, 32);
