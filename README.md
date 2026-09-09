# Escala do Café

Registo diário de quem foi buscar o café ao trabalho. Uma pessoa por dia, um
toque para registar, e uma conta que mostra quem se anda a escapar à tarefa.

## O que faz

- **Hoje** — quem foi buscar o café hoje, com sugestão de quem devia ir a seguir.
- **Calendário** — o mês inteiro em azulejo: cada dia registado fica com a cor da
  pessoa. Toca num dia para registar, trocar ou apagar.
- **A conta do café** — idas por pessoa, quota justa e saldo. Saldo negativo é
  quem ficou a dever cafés. Filtra por 30 dias, 90 dias ou desde sempre.
- **A escala** — a lista de nomes que aparece no registo, com cor e nome
  editáveis.

### A escala é fechada

O registo diário só oferece os nomes da escala, mais a opção **Outro**, que abre
um campo de texto livre. A escala arranca com André, Carol, Duarte, Maria,
Paulinho e Zé, criados sozinhos na primeira utilização.

Um dia registado por **Outro** aparece no calendário a cinzento e é somado à
linha «fora da escala», mas não entra no cálculo da quota nem no saldo de
ninguém. O mesmo acontece aos dias de quem for removido da escala mais tarde:
ficam no calendário com o nome de então, sem mexer nas contas de quem lá está.

### Como é calculada a quota justa

Cada dia registado vale um café, repartido em partes iguais pelas pessoas que já
faziam parte da escala nesse dia. Quem entra a meio não fica a dever o passado, e
quem sai deixa de contar. O saldo de cada pessoa é `idas − quota`.

Quem entra no mesmo dia conta como uma leva. Se um dia anterior for preenchido à
posteriori, a data de entrada da leva inteira recua, para que esse café se
reparta por toda a gente em vez de cair em cima de quem o registou.

## Onde correm os dados

O `index.html` é a aplicação inteira, sem dependências no browser. A camada de
armazenamento escolhe-se sozinha ao arrancar, e o canto superior direito diz
sempre qual saiu.

| Contexto | Armazenamento | Partilha |
| --- | --- | --- |
| Publicado na Vercel | Postgres na Neon, através de `api/` | partilhado com quem tiver o endereço |
| Publicado como Artifact do Claude | capacidade `db` do Artifact | partilhado dentro da organização |
| Ficheiro aberto à mão, sem servidor | `localStorage` do browser | só naquele dispositivo |

A Neon não empurra alterações, por isso o que os outros dispositivos registam
chega ao voltar a pedir o estado: de seis em seis segundos com o separador à
vista, e logo que ele volte a estar.

## Publicar na Vercel com uma base de dados Neon

1. **Base de dados.** Em [neon.com](https://neon.com), cria um projeto e copia a
   *connection string* com pooling, a que tem `-pooler` no anfitrião.
2. **Projeto.** Em [vercel.com/new](https://vercel.com/new), importa este
   repositório. Não há framework a escolher: as funções em `api/` e o
   `index.html` na raiz bastam.
3. **Variáveis de ambiente**, em Settings → Environment Variables:

   | Nome | Obrigatória | Para que serve |
   | --- | --- | --- |
   | `DATABASE_URL` | sim | a *connection string* da Neon |
   | `APP_PASSWORD` | não | palavra-passe única para abrir a app |

4. **Deploy.** As tabelas e a escala inicial criam-se no primeiro pedido. Não é
   preciso correr nada à mão.

Sem `APP_PASSWORD` a app fica aberta a quem tiver o endereço. Com ela, a página
pede a palavra-passe uma vez por dispositivo e guarda-a no browser; a API recusa
tudo o resto.

O `schema.sql` traz as mesmas tabelas, para quem preferir prepará-las no editor
SQL da Neon.

## Correr localmente

```bash
npm install
export DATABASE_URL="postgres://…"   # a da Neon, ou um Postgres local
export PG_DRIVER=pg                  # só com um Postgres local
npm run dev                          # http://localhost:3000
```

`PG_DRIVER=pg` troca o driver HTTP da Neon pelo cliente Postgres normal. Em
produção fica por definir.

## Publicar como Artifact do Claude

```bash
npm run artifact     # escreve dist/artifact.html
```

O publicador acrescenta o `<head>` e o `<body>`, por isso o script tira-os. A
página publicada usa a capacidade `db` e só é visível para quem tiver sessão
iniciada no Claude dentro da mesma organização.

## A API

Todas as rotas devolvem JSON e, com `APP_PASSWORD` definida, exigem o cabeçalho
`x-escala-key`.

| Rota | Faz |
| --- | --- |
| `GET /api/state` | a escala e os dias registados, tudo o que a página desenha |
| `POST /api/runs` | regista ou troca quem foi num dia |
| `DELETE /api/runs?date=…` | apaga o registo de um dia |
| `DELETE /api/runs?all=1` | apaga todos os registos, mantendo a escala |
| `POST /api/people` | junta alguém à escala |
| `PATCH /api/people` | muda o nome ou a cor |
| `DELETE /api/people?id=…` | tira alguém da escala |

O nome de quem está na escala vem sempre da base de dados, nunca do corpo do
pedido, para que um registo não possa inventar um nome para uma pessoa
existente.

## Estrutura dos dados

```
meta   (k, v)                                    marca que a escala já foi semeada
people (id, name, color, created_at)
runs   (run_date, person_id, person_name, guest, updated_at)
```

O dia é a chave primária de `runs`, por isso não há maneira de registar o mesmo
dia duas vezes. `person_id` fica a `null` quando alguém sai da escala, e o dia
passa a contar como «fora da escala» com o nome que tinha.
