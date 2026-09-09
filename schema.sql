-- As funções em api/ criam isto sozinhas no primeiro arranque.
-- Este ficheiro serve para quem preferir preparar a base de dados à mão,
-- no editor SQL da Neon.

create table if not exists meta (
  k text primary key,
  v text not null
);

create table if not exists people (
  id         text primary key,
  name       text not null,
  color      text not null,
  created_at date not null default current_date
);

create table if not exists runs (
  run_date    date primary key,
  person_id   text references people(id) on delete set null,
  person_name text not null,
  guest       boolean not null default false,
  updated_at  timestamptz not null default now()
);

-- A escala inicial. A marca em meta impede que volte a ser semeada
-- depois de alguém ser removido de propósito.
insert into meta (k, v) values ('seeded', '1') on conflict (k) do nothing;

insert into people (id, name, color) values
  ('p1', 'André',    '#2451B2'),
  ('p2', 'Carol',    '#1C7A6E'),
  ('p3', 'Duarte',   '#9C4A2E'),
  ('p4', 'Maria',    '#6B4C9A'),
  ('p5', 'Paulinho', '#B0862B'),
  ('p6', 'Zé',       '#3D7A31')
on conflict (id) do nothing;
