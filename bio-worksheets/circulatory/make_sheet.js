// ＜循環系＞血液・心臓の観察 実験シート（B4横・2段組）生成スクリプト
// 使い方: node make_sheet.js        → 生徒用
//         node make_sheet.js answer → 解答（教師用）
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  BorderStyle, AlignmentType, VerticalAlign, PageOrientation, HeightRule, ShadingType,
} = require('docx');

const ANSWER = process.argv[2] === 'answer';
const FONT = 'BIZ UDゴシック';
const SZ = 18; // 9pt
const RED = 'C00000';
const ACCENT = '1F4E79';
const mm = (v) => Math.round(v * 56.693);

// ---------- helpers ----------
const t = (text, o = {}) => new TextRun({ text, font: FONT, size: o.size || SZ, bold: o.bold, color: o.color, underline: o.underline });
const p = (runs, o = {}) => new Paragraph({
  children: Array.isArray(runs) ? runs : [typeof runs === 'string' ? t(runs) : runs],
  spacing: { before: o.before || 0, after: o.after || 0, line: o.line || 260 },
  alignment: o.align, indent: o.indent, border: o.border, shading: o.shading,
});
// 穴埋め：生徒用は空欄、解答は赤字
const blank = (ans, w = 8) => {
  if (ANSWER) return [t('（ '), t(ans, { color: RED, bold: true }), t(' ）')];
  return [t('（' + '　'.repeat(w) + '）')];
};
// 【結合・解離】の選択：解答では正解に赤丸の代わりに赤字
const choice = (opts, ans) => {
  const r = [t('【 ')];
  opts.forEach((o, i) => {
    if (i) r.push(t('・'));
    r.push(ANSWER && o === ans ? t(o, { color: RED, bold: true, underline: {} }) : t(o));
  });
  r.push(t(' 】'));
  return r;
};
const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };
const line = (c = '999999', s = BorderStyle.SINGLE, size = 4) => ({ style: s, size, color: c });
const boxBorders = (c = '444444', s = BorderStyle.SINGLE, size = 6) => ({ top: line(c, s, size), bottom: line(c, s, size), left: line(c, s, size), right: line(c, s, size) });

const cell = (children, width, o = {}) => new TableCell({
  children, width: { size: width, type: WidthType.DXA },
  borders: o.borders || { top: NONE, bottom: NONE, left: NONE, right: NONE },
  verticalAlign: o.valign || VerticalAlign.TOP,
  margins: o.margins || { top: 40, bottom: 40, left: 80, right: 80 },
  shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
  columnSpan: o.span,
});
const table = (widths, rows, o = {}) => new Table({
  width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
  columnWidths: widths, rows, borders: o.borders || noBorders,
});
const row = (cells, h, rule = HeightRule.EXACT) => new TableRow({ children: cells, height: h ? { value: h, rule } : undefined, cantSplit: true });

// 見出し（左に色帯）
const heading = (text, before = 80) => p([t(text, { size: 22, bold: true, color: ACCENT })], {
  before, after: 40,
  border: { left: { style: BorderStyle.SINGLE, size: 24, color: ACCENT, space: 4 }, bottom: { style: BorderStyle.SINGLE, size: 4, color: ACCENT, space: 1 } },
});
const subhead = (text) => p([t(text, { bold: true, color: ACCENT })], { before: 40, after: 20 });
const label = (lab, body) => p([t(lab, { bold: true }), t(body)]);
const writeLines = (n, w = IN) => [table([w], Array.from({ length: n }, () => row([cell([p('')], w, { borders: { top: NONE, left: NONE, right: NONE, bottom: line('999999', BorderStyle.DOTTED, 6) } })], mm(7.5))))];

// 写真貼付枠
const photoBox = (w, h, caption, extra = []) => table([w], [
  row([cell([p([t(caption, { bold: true, color: 'FFFFFF' })], { align: AlignmentType.CENTER })], w, { fill: ACCENT, borders: boxBorders(ACCENT), margins: { top: 20, bottom: 20, left: 40, right: 40 } })], mm(6)),
  row([cell([
    p([t('写真をはる', { color: 'BBBBBB', size: 16 })], { align: AlignmentType.CENTER }),
  ], w, { borders: boxBorders('777777', BorderStyle.DASHED, 6), valign: VerticalAlign.CENTER })], h),
  ...extra.map((e) => row([cell(e, w, { borders: boxBorders('777777'), margins: { top: 30, bottom: 30, left: 80, right: 60 } })], mm(7.5))),
]);

// ---------- 幅 ----------
const PAGE_W = mm(364), PAGE_H = mm(257), MARGIN = mm(10);
const USABLE = PAGE_W - 2 * MARGIN;
const GAP = mm(8);
const COL = Math.floor((USABLE - GAP) / 2);
const IN = COL - 160; // セル内余白分

// ========== 左段 ==========
const left = [];
// タイトル
left.push(table([IN], [row([cell([
  p([t('生物基礎　実験シート', { size: 16, color: 'FFFFFF' }), ...(ANSWER ? [t('　【解答例】', { size: 18, bold: true, color: 'FFFF66' })] : [])]),
  p([t('＜循環系＞血液・心臓の観察', { size: 32, bold: true, color: 'FFFFFF' })], { line: 360 }),
], IN, { fill: ACCENT, margins: { top: 60, bottom: 60, left: 160, right: 120 } })])]));
{
  const ul = { top: NONE, left: NONE, right: NONE, bottom: line('444444', BorderStyle.SINGLE, 6) };
  const W = [mm(52), mm(14), mm(8), mm(12), mm(8), mm(12), mm(8), mm(12), IN - mm(126)];
  const txt = ['実施日　　月　　日（　）', '', '年', '', '組', '', '番', '氏名', ''];
  left.push(p('', { line: 120 }));
  left.push(table(W, [row(txt.map((x, i) => cell([p([t(x, { size: 19 })], { align: x ? AlignmentType.CENTER : undefined })], W[i],
    { borders: (i === 0 || x === '') ? ul : undefined, margins: { top: 20, bottom: 20, left: 20, right: 20 }, valign: VerticalAlign.BOTTOM })), mm(8))]));
}

// Ⅰ
left.push(heading('Ⅰ. 血液成分の観察'));
const IW1 = Math.round(IN * 0.62), IW2 = IN - IW1;
left.push(table([IW1, IW2], [row([
  cell([
    label('【目的】', '血液の特徴について理解する。'),
    label('【準備】', 'ブタ血液、試験管'),
    label('【方法】', '血液を静かにおいておくと、その成分が分離する。'),
    p([t('　　　　その様子を観察する。')]),
    p([t('【質問】', { bold: true })], { before: 60 }),
    p([t('　血液の成分は液体成分である'), ...blank('血しょう', 6), t('と固形成分の')], { line: 340 }),
    p([...blank('赤血球', 6), t('・'), ...blank('白血球', 6), t('・'), ...blank('血小板', 6), t('からなる。')], { line: 340 }),
  ], IW1, { margins: { top: 0, bottom: 0, left: 0, right: 80 } }),
  cell([
    p([t('【結果】 分離のようす（スケッチ・メモ）', { size: 15, bold: true })]),
    ...(ANSWER ? [p([t('上：淡黄色の液体（血しょう）', { size: 15, color: RED })]), p([t('下：赤い沈殿（血球）', { size: 15, color: RED })])] : []),
  ], IW2, { borders: boxBorders('777777') }),
], mm(39))]));

// Ⅱ
left.push(heading('Ⅱ. ヘモグロビンの性質', 100));
left.push(label('【目的】', '血液中に含まれる色素の働きを理解する。'));
left.push(label('【準備】', 'ブタ血液、試験管、酸素ボンベ、二酸化炭素ボンベ、チューブ、ストロー'));
left.push(label('【方法】', 'ブタの血液に酸素と二酸化炭素を吹き込み、血液の様子を比較・観察する。'));
left.push(p([t('　　☆勢いよく吹き込むと、血液が試験管からあふれたり飛び出したりするので、', { bold: true })]));
left.push(p([t('　　　ゆっくりと様子を見ながら、少しずつ吹き込むこと。', { bold: true })]));
left.push(p([t('【結果】', { bold: true }), t('　① 血液の様子（写真）　※同じ明るさ・背景で撮影し、色を比べよう', { size: 16 })], { before: 60, after: 30 }));

const PB = Math.floor((IN - 2 * mm(3)) / 3);
const PBG = Math.floor((IN - 3 * PB) / 2);
const colorRow = (ans) => [p([t('色'), ...blank(ans, 7)])];
const memoRow = (ans) => [p([t('気づき：', { size: 16 }), ...(ANSWER ? [t(ans, { size: 15, color: RED })] : [])])];
left.push(table([PB, PBG, PB, PBG, PB], [row([
  cell([photoBox(PB - 20, mm(60), '通常（何もしない）', [colorRow('暗赤色'), memoRow('比較の基準')])], PB, { margins: { top: 0, bottom: 0, left: 0, right: 0 } }),
  cell([p('')], PBG, { margins: { top: 0, bottom: 0, left: 0, right: 0 } }),
  cell([photoBox(PB - 20, mm(60), '酸素を吹き込む', [colorRow('鮮紅色'), memoRow('明るい赤になった')])], PB, { margins: { top: 0, bottom: 0, left: 0, right: 0 } }),
  cell([p('')], PBG, { margins: { top: 0, bottom: 0, left: 0, right: 0 } }),
  cell([photoBox(PB - 20, mm(60), '二酸化炭素を吹き込む', [colorRow('暗赤色'), memoRow('黒っぽい赤になった')])], PB, { margins: { top: 0, bottom: 0, left: 0, right: 0 } }),
])]));
left.push(p([t('【考察】', { bold: true }), t('　色が変わったのはなぜか。「ヘモグロビン」「酸素」という語を使って説明しよう。', { size: 16 })], { before: 80 }));
if (ANSWER) {
  left.push(p([t('赤血球中のヘモグロビンは酸素と結合すると鮮紅色の酸素ヘモグロビンになり、酸素を離す（解離する）と暗赤色にもどるため。', { color: RED, size: 16 })], { line: 300 }));
  left.push(p([t('酸素を吹き込むと動脈血、二酸化炭素を吹き込むと静脈血に近い色になる。', { color: RED, size: 16 })], { line: 300 }));
} else left.push(...writeLines(3));

// ========== 右段 ==========
const right = [];
right.push(heading('Ⅲ. ブタの心臓の観察', 0));
right.push(p([t('② 心臓の写真をはり、気づいたことや部位の名前を', { size: 16 }), t('矢印や線で書き込もう', { size: 16, bold: true }), t('（外側・断面など）。', { size: 16 })], { after: 40 }));
const HP = Math.round(IN * 0.71), HC = IN - HP;
const check = (s) => p([t('□ ' + s, { size: 16 })], { line: 250 });
right.push(table([HP, HC], [row([
  cell([p([t('写真をはる（周りに書き込みスペースを残そう）', { color: 'BBBBBB', size: 16 })], { align: AlignmentType.CENTER })], HP,
    { borders: boxBorders('777777', BorderStyle.DASHED, 6), valign: VerticalAlign.CENTER }),
  cell([
    p([t('観察のポイント', { bold: true, color: ACCENT, size: 16 })]),
    p([t('見つけたら□に✓', { size: 14 })], { after: 30 }),
    check('右心房・左心房'), check('右心室・左心室'), check('大動脈'), check('肺動脈'),
    check('大静脈・肺静脈'), check('弁'), check('心室の壁の厚さ'), p([t('　（左右で比べる）', { size: 14 })]),
    check('冠動脈（心臓の'), p([t('　表面の血管）', { size: 14 })]),
  ], HC, { borders: boxBorders('777777'), fill: 'F2F6FA', margins: { top: 60, bottom: 40, left: 100, right: 60 } }),
], mm(88))]));
right.push(p([t('気づいたこと：', { bold: true, size: 16 }), ...(ANSWER ? [t('左心室の壁は右心室より厚い。動脈は壁が厚く弾力があり、静脈は壁が薄い。', { color: RED, size: 16 })] : [])], { before: 50, line: 360, border: { bottom: line('AAAAAA', BorderStyle.DOTTED, 4) } }));
if (!ANSWER) right.push(...writeLines(1));

// まとめ
right.push(heading('まとめ　実験から生物基礎の知識へ', 120));
right.push(subhead('1. 血液の成分　〔Ⅰとつなげる〕'));
right.push(p([t('液体成分＝'), ...blank('血しょう', 5), t('が約55％、有形成分＝'), ...blank('血球', 4), t('が約45％。血球は'), ...blank('骨髄', 3), t('でつくられる。')]));
const TW = [mm(20), mm(12), mm(26), IN - mm(58)];
const th = (s, w) => cell([p([t(s, { bold: true, size: 16 })], { align: AlignmentType.CENTER })], w, { borders: boxBorders('777777', BorderStyle.SINGLE, 4), fill: 'DCE6F0', margins: { top: 10, bottom: 10, left: 40, right: 40 } });
const td = (runs, w, center) => cell([p(runs, { align: center ? AlignmentType.CENTER : undefined })], w, { borders: boxBorders('777777', BorderStyle.SINGLE, 4), margins: { top: 10, bottom: 10, left: 60, right: 40 } });
right.push(table(TW, [
  row([th('成分', TW[0]), th('核', TW[1]), th('数（/mm³）', TW[2]), th('はたらき', TW[3])], mm(5.5)),
  row([td([t('赤血球')], TW[0], 1), td(blank('無', 1), TW[1], 1), td([t('450万～500万', { size: 16 })], TW[2], 1), td([...blank('酸素', 4), t('の運搬')], TW[3])], mm(5.5)),
  row([td([t('白血球')], TW[0], 1), td(blank('有', 1), TW[1], 1), td([t('4000～8000', { size: 16 })], TW[2], 1), td(blank('免疫', 6), TW[3])], mm(5.5)),
  row([td([t('血小板')], TW[0], 1), td(blank('無', 1), TW[1], 1), td([t('10～40万', { size: 16 })], TW[2], 1), td(blank('血液凝固', 6), TW[3])], mm(5.5)),
  row([td([t('血しょう')], TW[0], 1), td([t('－')], TW[1], 1), td([t('－')], TW[2], 1), td([t('栄養分・老廃物の運搬、血液凝固、免疫', { size: 16 })], TW[3])], mm(5.5)),
]));

right.push(subhead('2. ヘモグロビンと血液の色　〔Ⅱとつなげる〕'));
right.push(p([t('◇ 赤血球に含まれるタンパク質'), ...blank('ヘモグロビン', 6), t('は、')]));
right.push(p([t('　酸素濃度が高いところでは酸素と'), ...choice(['結合', '解離'], '結合'), t('し、'), ...blank('酸素ヘモグロビン', 7), t('になる。')]));
right.push(p([t('　酸素濃度が低いところでは酸素と'), ...choice(['結合', '解離'], '解離'), t('する。')]));
right.push(p([t('◇ 酸素が多い'), ...blank('動脈血', 4), t('は'), ...blank('鮮紅', 3), t('色、酸素が少ない'), ...blank('静脈血', 4), t('は'), ...blank('暗赤', 3), t('色。')]));
right.push(p([t('◇ 二酸化炭素は'), ...blank('炭酸水素イオン', 7), t('となり、'), ...blank('血しょう', 4), t('に溶けて運ばれる。')]));

right.push(subhead('3. 心臓・血管のつくり　〔Ⅲとつなげる〕'));
right.push(p([t('◇'), ...blank('心房', 3), t('：肺や全身から戻ってきた血液を心室に送り出す。'), ...blank('心室', 3), t('：肺や全身に血液を送り出す。')]));
right.push(p([t('◇'), ...blank('洞房結節', 6), t('（ペースメーカー）：規則的な電気信号を発生し、収縮のリズムをつくる。')]));
right.push(p([t('◇ 動脈は高い血圧に耐えるため壁が'), ...blank('厚い', 2), t('。静脈には逆流を防ぐ'), ...blank('弁', 2), t('がある。')]));
right.push(p([t('◇ 血液の流れ　肺循環：右心室→'), ...blank('肺動脈', 4), t('→肺→'), ...blank('肺静脈', 4), t('→左心房')]));
right.push(p([t('　　　　　　　 体循環：左心室→'), ...blank('大動脈', 4), t('→全身→'), ...blank('大静脈', 4), t('→右心房')]));
right.push(p([t('考えよう', { bold: true, color: ACCENT }), t('　左心室の壁が右心室より厚いのはなぜか。', { size: 16 })], { before: 40 }));
if (ANSWER) right.push(p([t('左心室は全身へ血液を送り出すため、肺へ送る右心室より強い力（高い圧力）が必要だから。', { color: RED, size: 16 })], { line: 300 }));
else right.push(...writeLines(1));

// ========== 組み立て ==========
const outer = new Table({
  width: { size: COL * 2 + GAP, type: WidthType.DXA },
  columnWidths: [COL, GAP, COL],
  borders: noBorders,
  rows: [new TableRow({ children: [
    cell(left, COL, { margins: { top: 0, bottom: 0, left: 80, right: 80 } }),
    cell([p('')], GAP, { borders: { top: NONE, bottom: NONE, left: NONE, right: NONE }, margins: { top: 0, bottom: 0, left: 0, right: 0 } }),
    cell(right, COL, { margins: { top: 0, bottom: 0, left: 80, right: 80 } }),
  ] })],
});

const doc = new Document({
  styles: { default: { document: { run: { font: { ascii: FONT, eastAsia: FONT, hAnsi: FONT }, size: SZ } } } },
  sections: [{
    properties: { page: {
      size: { width: PAGE_H, height: PAGE_W, orientation: PageOrientation.LANDSCAPE },
      margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN, header: 0, footer: 0 },
    } },
    children: [outer, p([t('', { size: 2 })], { line: 20 })],
  }],
});
const name = ANSWER ? '循環系_血液・心臓の観察_解答.docx' : '循環系_血液・心臓の観察_実験シート.docx';
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(name, b); console.log('wrote', name); });
