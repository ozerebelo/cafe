/* GET /api/state — tudo o que a página precisa para desenhar: a escala e
   os dias registados. É também o que o cliente volta a pedir de poucos em
   poucos segundos para apanhar o que os outros dispositivos registaram. */

import { db, route } from './_lib.js';

export default route(['GET'], async (req, res) => {
  const sql = await db();

  const people = await sql`
    select id, name, color, to_char(created_at, 'YYYY-MM-DD') as "createdAt"
    from people
    order by created_at, name`;

  const runs = await sql`
    select to_char(run_date, 'YYYY-MM-DD') as date,
           coalesce(person_id, '') as "personId",
           person_name as "personName",
           guest
    from runs
    order by run_date desc
    limit 2000`;

  return res.status(200).json({ people, runs });
});
