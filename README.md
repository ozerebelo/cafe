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
Paulinho e Zé, criados automaticamente na primeira abertura.

Um dia registado por **Outro** aparece no calendário a cinzento e é somado à
linha «fora da escala», mas não entra no cálculo da quota nem no saldo de
ninguém.

### Como é calculada a quota justa

Cada dia registado vale um café, repartido em partes iguais pelas pessoas que já
faziam parte da escala nesse dia. Quem entra a meio não fica a dever o passado, e
quem sai deixa de contar. O saldo de cada pessoa é `idas − quota`.

Quem entra no mesmo dia conta como uma leva. Se um dia anterior for preenchido à
posteriori, a data de entrada da leva inteira recua, para que esse café se
reparta por toda a gente em vez de cair em cima de quem o registou.

## Onde correm os dados

O ficheiro `index.html` é a aplicação inteira, sem dependências. A camada de
armazenamento escolhe-se sozinha ao arrancar:

| Contexto | Armazenamento | Partilha |
| --- | --- | --- |
| Publicado como Artifact do Claude | capacidade `db` do Artifact | partilhado e em tempo real entre dispositivos |
| Servido como página estática (ex.: GitHub Pages) | `localStorage` do browser | só naquele dispositivo |

O estado da ligação aparece sempre no canto superior direito: *partilhado* ou
*só neste dispositivo*.

## Publicar

**Como Artifact (partilhado).** Gera a versão sem `<head>`/`<body>` — o
publicador acrescenta esse envelope — e publica-a com a capacidade `db`:

```bash
./scripts/build-artifact.sh          # escreve dist/artifact.html
```

**Como página estática.** Serve o `index.html` tal como está:

```bash
npx http-server . -p 8080
```

## Estrutura dos dados

```
config/roster        { seeded, at }
people/<id>          { name, color, createdAt }
runs/<AAAA-MM-DD>    { date, personId, personName, guest?, updatedAt }
```

Uma ida registada por «Outro» tem `personId` vazio e `guest: true`. O documento
`config/roster` marca que a escala inicial já foi criada, e a criação é protegida
por um *lease* para que dois dispositivos a abrirem ao mesmo tempo não dupliquem
os nomes.

O identificador do documento de cada ida é a própria data, por isso não há
maneira de registar o mesmo dia duas vezes.
