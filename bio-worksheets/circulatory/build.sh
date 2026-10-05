#!/bin/sh
# docx（生徒用・解答）を生成し、PDFに変換する
set -e
cd "$(dirname "$0")"
node make_sheet.js
node make_sheet.js answer
T=$(mktemp -d)
cp 循環系_血液・心臓の観察_実験シート.docx "$T/s.docx"
cp 循環系_血液・心臓の観察_解答.docx "$T/a.docx"
soffice --headless --convert-to pdf --outdir "$T" "$T/s.docx" "$T/a.docx" >/dev/null 2>&1
cp "$T/s.pdf" 循環系_血液・心臓の観察_実験シート.pdf
cp "$T/a.pdf" 循環系_血液・心臓の観察_解答.pdf
rm -rf "$T"
