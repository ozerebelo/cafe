/* Os dias registados.
   POST   /api/runs           — regista ou troca quem foi num dia
   DELETE /api/runs?date=…    — apaga o registo desse dia
   DELETE /api/runs?all=1     — apaga todos os registos, mantendo a escala */

import { db, route, readJson, isDate, cleanName } from './_lib.js';

export default route(['POST', 'DELETE'], async (req, res) => {
  const sql = await db();

  if (req.method === 'POST') {
    const body = await readJson(req);
    if (!isDate(body.date)) {
      return res.status(400).json({ error: 'data_invalida' });
    }

    let personId = null;
    let personName;
    let guest;

    if (body.personId) {
      /* O nome vem sempre da escala, nunca do cliente, para que um
         registo não possa inventar um nome para uma pessoa existente. */
      const found = await sql`select name from people where id = ${body.personId}`;
      if (!found.length) return res.status(400).json({ error: 'pessoa_desconhecida' });
      personId = body.personId;
      personName = found[0].name;
      guest = false;
    } else {
      personName = cleanName(body.personName);
      if (!personName) return res.status(400).json({ error: 'nome_em_falta' });
      guest = true;
    }

    await sql`
      insert into runs (run_date, person_id, person_name, guest, updated_at)
      values (${body.date}, ${personId}, ${personName}, ${guest}, now())
      on conflict (run_date) do update
        set person_id = excluded.person_id,
            person_name = excluded.person_name,
            guest = excluded.guest,
            updated_at = now()`;

    return res.status(200).json({ ok: true });
  }

  const url = new URL(req.url, 'http://localhost');
  if (url.searchParams.get('all') === '1') {
    await sql`delete from runs`;
    return res.status(200).json({ ok: true });
  }

  const date = url.searchParams.get('date');
  if (!isDate(date)) return res.status(400).json({ error: 'data_invalida' });
  await sql`delete from runs where run_date = ${date}`;
  return res.status(200).json({ ok: true });
});
