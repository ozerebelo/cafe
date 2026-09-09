/* A escala: os nomes que aparecem no registo diário.
   POST   /api/people        — junta alguém
   PATCH  /api/people        — muda o nome ou a cor
   DELETE /api/people?id=…   — tira alguém da escala

   Quem sai deixa os dias já registados de pé: passam a contar como
   "fora da escala", com o nome que tinham na altura. */

import { db, route, readJson, isColor, cleanName, isAdmin, PALETTE } from './_lib.js';
import { randomUUID } from 'node:crypto';

export default route(['POST', 'PATCH', 'DELETE'], async (req, res) => {
  const sql = await db();

  if (req.method === 'POST') {
    const body = await readJson(req);
    const name = cleanName(body.name);
    if (!name) return res.status(400).json({ error: 'nome_em_falta' });

    const [{ total }] = await sql`select count(*)::int as total from people`;
    const color = isColor(body.color) ? body.color : PALETTE[total % PALETTE.length];
    const id = 'p' + randomUUID().slice(0, 8);

    await sql`insert into people (id, name, color) values (${id}, ${name}, ${color})`;
    return res.status(201).json({ id });
  }

  if (req.method === 'PATCH') {
    const body = await readJson(req);
    if (!body.id) return res.status(400).json({ error: 'id_em_falta' });

    const name = body.name === undefined ? null : cleanName(body.name);
    if (name === '') return res.status(400).json({ error: 'nome_em_falta' });
    const color = body.color === undefined ? null : (isColor(body.color) ? body.color : null);
    if (name === null && color === null) return res.status(400).json({ error: 'nada_a_mudar' });

    const updated = await sql`
      update people
         set name  = coalesce(${name}, name),
             color = coalesce(${color}, color)
       where id = ${body.id}
      returning id`;
    if (!updated.length) return res.status(404).json({ error: 'pessoa_desconhecida' });

    /* Os dias já registados guardam o nome de então; ao renomear, quem
       está na escala passa a aparecer com o nome novo em todo o lado. */
    if (name !== null) {
      await sql`update runs set person_name = ${name} where person_id = ${body.id}`;
    }
    return res.status(200).json({ ok: true });
  }

  /* Sair da escala apaga a dívida de quem sai, por isso vale a mesma
     regra que apagar registos. */
  if (!isAdmin(req)) return res.status(403).json({ error: 'so_administrador' });

  const url = new URL(req.url, 'http://localhost');
  const id = url.searchParams.get('id');
  if (!id) return res.status(400).json({ error: 'id_em_falta' });
  await sql`delete from people where id = ${id}`;
  /* A chave em runs fica a null, e os dias dessa pessoa passam a contar
     como "fora da escala", com o nome que tinham na altura. */
  await sql`update runs set guest = true where person_id is null and guest = false`;
  return res.status(200).json({ ok: true });
});
