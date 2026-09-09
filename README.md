# Escala do Café

Registo diário de quem foi buscar o café ao trabalho. Uma pessoa por dia, um
toque para registar, e uma conta que mostra quem se anda a escapar à tarefa.

## O que faz

- **Hoje** — quem foi buscar o café hoje, com sugestão de quem devia ir a seguir.
- **Calendário** — o mês inteiro em azulejo: cada dia registado fica com a cor da
  pessoa. Toca num dia para registar, trocar ou apagar.
- **A conta do café** — idas por pessoa, quota justa e saldo. Saldo negativo é
  quem ficou a dever cafés. Filtra por 30 dias, 90 dias ou desde sempre.
- **Equipa** — adicionar, renomear, mudar de cor e remover pessoas.

### Como é calculada a quota justa

Cada dia registado vale um café, repartido em partes iguais pelas pessoas que já
faziam parte da equipa nesse dia. Quem entra a meio não fica a dever o passado, e
quem sai deixa de contar. O saldo de cada pessoa é `idas − quota`.

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
people/<id>          { name, color, createdAt }
runs/<AAAA-MM-DD>    { date, personId, personName, updatedAt }
```

O identificador do documento de cada ida é a própria data, por isso não há
maneira de registar o mesmo dia duas vezes.
