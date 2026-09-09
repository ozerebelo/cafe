/* Peças partilhadas pelas funções em api/: ligação à base de dados,
   arranque do esquema, autenticação e leitura do corpo do pedido. */

import { neon } from '@neondatabase/serverless';
import { timingSafeEqual } from 'node:crypto';

export const PALETTE = [
  '#2451B2', '#1C7A6E', '#9C4A2E', '#6B4C9A', '#B0862B',
  '#3D7A31', '#A83B62', '#2E6E9E', '#8A5A2B', '#4A5568',
];

const ROSTER = ['André', 'Carol', 'Duarte', 'Maria', 'Paulinho', 'Zé'];

let cachedSql = null;

/* Devolve um template etiquetado: sql`select …` resolve para as linhas.
   Por omissão fala com a Neon por HTTP, que é o que serve funções
   serverless sem pool de ligações. Com PG_DRIVER=pg usa o cliente
   Postgres normal, para correr contra uma base de dados local. */
async function getSql() {
  if (cachedSql) return cachedSql;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL não está definida');

  if (process.env.PG_DRIVER === 'pg') {
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: url });
    cachedSql = async (strings, ...values) => {
      const text = strings.reduce(
        (acc, part, i) => acc + part + (i < values.length ? '$' + (i + 1) : ''),
        '',
      );
      const result = await pool.query(text, values);
      return result.rows;
    };
  } else {
    cachedSql = neon(url);
  }
  return cachedSql;
}

let bootstrap = null;

/* Cria as tabelas e, à primeira, a escala inicial. Corre uma vez por
   arranque a frio; o `if not exists` torna as chamadas seguintes baratas. */
async function prepare(sql) {
  await sql`create table if not exists meta (
    k text primary key,
    v text not null
  )`;
  await sql`create table if not exists people (
    id text primary key,
    name text not null,
    color text not null,
    created_at date not null default current_date
  )`;
  await sql`create table if not exists runs (
    run_date date primary key,
    person_id text references people(id) on delete set null,
    person_name text not null,
    guest boolean not null default false,
    updated_at timestamptz not null default now()
  )`;

  /* Quem conseguir inserir a marca é quem semeia. A inserção é atómica,
     por isso dois arranques em simultâneo não duplicam a escala, e uma
     remoção deliberada não é desfeita no arranque seguinte. */
  const claimed = await sql`
    insert into meta (k, v) values ('seeded', '1')
    on conflict (k) do nothing
    returning k`;
  if (!claimed.length) return;

  for (let i = 0; i < ROSTER.length; i++) {
    await sql`insert into people (id, name, color)
              values (${'p' + (i + 1)}, ${ROSTER[i]}, ${PALETTE[i % PALETTE.length]})
              on conflict (id) do nothing`;
  }
}

export async function db() {
  const sql = await getSql();
  if (!bootstrap) {
    bootstrap = prepare(sql).catch((err) => {
      bootstrap = null;
      throw err;
    });
  }
  await bootstrap;
  return sql;
}

/* Sem APP_PASSWORD a aplicação fica aberta a quem tiver o endereço. */
export function authorized(req) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return true;
  const given = req.headers['x-escala-key'];
  if (typeof given !== 'string') return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}

export const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
export const isColor = (v) => typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v);
export const cleanName = (v) => String(v == null ? '' : v).trim().replace(/\s+/g, ' ').slice(0, 40);

/* Envolve um handler com o método permitido, a autenticação e o
   tratamento de erros, para que cada rota fique só com o seu trabalho. */
export function route(methods, handler) {
  return async (req, res) => {
    res.setHeader('cache-control', 'no-store');
    if (!methods.includes(req.method)) {
      res.setHeader('allow', methods.join(', '));
      return res.status(405).json({ error: 'method_not_allowed' });
    }
    if (!authorized(req)) return res.status(401).json({ error: 'unauthorized' });
    try {
      return await handler(req, res);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'server_error' });
    }
  };
}
