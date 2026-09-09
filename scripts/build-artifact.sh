#!/usr/bin/env bash
# Extrai a versão "conteúdo apenas" do index.html para publicar como Artifact do Claude.
# O publicador embrulha o ficheiro em <!doctype html><head>…</head><body>, por isso
# o doctype, o <html>, o <head> e o <body> do index.html têm de sair.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
out="${1:-$root/dist/artifact.html}"
mkdir -p "$(dirname "$out")"
sed -n '/<!-- ARTIFACT:BEGIN -->/,/<!-- ARTIFACT:END -->/p' "$root/index.html" \
  | grep -vxF '<!-- ARTIFACT:BEGIN -->' \
  | grep -vxF '<!-- ARTIFACT:SPLIT -->' \
  | grep -vxF '<!-- ARTIFACT:END -->' \
  | grep -vxF '</head>' \
  | grep -vxF '<body>' > "$out"
echo "escrito: $out ($(wc -c < "$out") bytes)"
