/* GET /api/state — tudo o que a página precisa para desenhar: a escala e
   os dias registados. É também o que o cliente volta a pedir de poucos em
   poucos segundos para apanhar o que os outros dispositivos registaram. */

import { db, route, today, adminRequired, isAdmin } from './_lib.js';

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

  /* `today` vem do servidor para que a página não dependa do relógio do
     telemóvel ao decidir que dias já passaram. */
  return res.status(200).json({
    today: await today(sql),
    people,
    runs,
    admin: { required: adminRequired(), ok: isAdmin(req) },
  });
});
