/* 碧の高座（正座の落語）の所作と表情 ── rakugo.js（試作 v0.2・2026-10-13）
   本人（2026-10-12）：「落語などの動作も同様です。表情も大事です。」（碧の動きを人の自然な動作に近づける、の続き）
   調べたこと＝02_プロジェクト/01_公開中（HP公開）/05_Qualia_rakugo/資料/落語の所作_調べ.md・研究_落語の所作.md。
   設計の説明＝02_プロジェクト/01_公開中（HP公開）/05_Qualia_rakugo/_dev/試作_2026-10-13_所作/README.md。

   aoi_motion.js（立つ・歩く・話す碧の共通部品）の上に重ねる「高座の層」。aoi_motion.js そのものは変えない。
   ・すべて時刻 t だけで決まる（動画の書き出しは一コマずつ・やり直しても同じ絵になる）。
   ・表情の語彙（calm・warm・curious・thinking・concern・surprise …）は aoi_motion.js の EMOTIONS をそのまま使い、高座の人物の顔を足す。

   中身：
     buildScore(TL, { lip, marks })   台本の時間割（森羅寄席の timeline.json）と口の時刻表（build_rk_lip.py）から「高座の譜」をつくる
     createStageLayer(ctx, score)     森羅寄席の高座（stage.html）に重ねる。{ pose(t), post(t), extendActs(ACTDEF, ACTS) }
     driveAoiMotion(m, score, t, o)   ほかのアプリで、AoiMotion の公開の呼び口（express・lookAt）だけで顔と目を動かす
     SHOSA                            仕草の型（扇子を刷毛にして塗る・扇子で相手を指す）。stage.html の ACTDEF と同じ書き方
   台本の印（提案。いまは marks の JSON で渡す）：［所作：塗る＠ヌッタ］（語に合わせる）／［顔：驚き］／［上下：上手］
*/

// ---------------------------------------------------------------- 表情の語彙（aoi_motion.js から借りる。読めないときは同じ値の控え）
const EMO_FALLBACK = {
  calm: { smile: .14, squint: .05, browJoy: .10 }, warm: { smile: .32, squint: .17, browJoy: .2 }, smile: { smile: .5, squint: .27, browJoy: .3 },
  curious: { smile: .08, browUp: .34, wide: .1 }, thinking: { squint: .12, browSad: .2, eyeSad: .05 },
  concern: { browSad: .42, eyeSad: .12, browUp: .06 }, surprise: { browUp: .62, wide: .32 },
};
let EMO = EMO_FALLBACK;
let addFaceMorphs = null;   // aoi_motion.js v3 の「下まぶただけ上がる（AoiLidLow）」「頬が上がる（AoiCheek）」を足す関数（読むだけ）
try { const m = await import("./aoi_motion.js"); if (m && m.EMOTIONS) EMO = { ...EMO_FALLBACK, ...m.EMOTIONS }; if (m && m.addFaceMorphs) addFaceMorphs = m.addFaceMorphs; } catch (e) { /* 共通部品の更新中でも高座は動く */ }
export { EMO as EMOTIONS };

// 顔の形（VRoid の Fcl_*）。aoi_motion.js の CH と同じ割りあてに、高座で使う四つを足した（VRoid の前髪で眉が隠れやすいので、驚きは目でも見せる）
export const CHANNELS = {
  smile: "Fcl_MTH_Fun", squint: "Fcl_EYE_Fun", browUp: "Fcl_BRW_Surprised", browSad: "Fcl_BRW_Sorrow", browJoy: "Fcl_BRW_Fun",
  wide: "Fcl_EYE_Spread", eyeSad: "Fcl_EYE_Sorrow", browAngry: "Fcl_BRW_Angry", pucker: "Fcl_MTH_Small", mthUp: "Fcl_MTH_Up", eyeSurp: "Fcl_EYE_Surprised", lidLow: "AoiLidLow", cheek: "AoiCheek",
};

// 人物の顔・姿勢・拍子（試作の値。調べ §7 の「推測（要確認）」に当たるものは README に書いた）
//   yaw は stage.html と同じ（目下＝八っつぁん＝画面の右、目上＝ご隠居＝画面の左）。ここでは振りの順と配分だけを変える
export const ROLES = {
  makura: { face: { smile: .24, squint: .04, lidLow: .22, cheek: .30, browJoy: .14 }, lids: 0,   relaxed: .16, yawK: 1, lean: 0,     chin: 0,     shoulder: 0,    nod: .028, nodGap: 1.1, brow: .16, gest: .55, gestGap: 2.6, mouth: 1.0,  sacc: .05 },
  // 2026-10-13 第 4 回（11 人中 7 人「寄りの顔が同じ形・八っつぁんとご隠居で顔が変わらない」）→ 二人の顔と姿勢の差を一段広げた
  //   八っつぁん＝目を大きく・眉を上げ・口角を上げて口を大きく、前のめりで見上げる／ご隠居＝まぶたを下ろして目を細め・口は小さく、背を立てて見下ろす
  hachi:  { face: { smile: .30, browUp: .34, wide: .42, mthUp: .30, cheek: .22 }, lids: 0, relaxed: .04, yawK: .95, lean: .12, chin: -.11, shoulder: .06, roll: .05, nod: .058, nodGap: .75, brow: .24, gest: 1.0, gestGap: 1.7, mouth: 1.18, sacc: .07 },
  ooya:   { face: { smile: .14, squint: .10, lidLow: .52, cheek: .32, browJoy: 0, browSad: .10 }, lids: .20, relaxed: .14, yawK: .82, lean: -.07, chin: .10, shoulder: -.02, roll: 0, nod: .02, nodGap: 1.5, brow: .06, gest: .6, gestGap: 3.0, mouth: .68, sacc: .03 },
};
// 一言の顔（台詞の文から決める。marks の faces で上書きできる）
export const BEAT_FACES = {
  surprise: { browUp: 1.0, wide: .62, eyeSurp: .22, smile: -.18, mthUp: .10 },   // 第 6 回：黒目が小さくなりすぎてぎょっとする → 黒目の縮みは控えめに          // 「へっ？」「えっ」
  question: { browUp: .52, wide: .20, tilt: 1 },                     // 問いの語尾（「？」「〜かい」）
  thinking: { browSad: .32, squint: .16, eyeSad: .10, smile: -.06 },     // 「……」のあと（しみじみ）
  pout:     { browAngry: .48, pucker: .62, smile: -.22, cheek: -.1 },   // 「ちえっ」（第 8 回：口をもっとすぼめる）
  proud:    { smile: .52, browUp: .24, cheek: .38, lidLow: .22, mthUp: .15 },       // 「目立つでしょう」
  knowing:  { smile: .32, lidLow: .26, cheek: .34, browJoy: .10 },                    // ご隠居が八っつぁんの早合点を受ける
  delight:  { smile: .58, lidLow: .46, cheek: .62, browJoy: .36 },      // 「看板！」・サゲ
};

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const bump = (t, a, b, c, d) => ease((t - a) / (b - a)) * (1 - ease((t - c) / (d - c)));
const addF = (o, f, k = 1) => { for (const [n, v] of Object.entries(f || {})) o[n] = (o[n] || 0) + v * k; return o; };

// ---------------------------------------------------------------- 譜をつくる
export function buildScore(TL, { lip = null, marks = null } = {}) {
  const L = TL.lines;
  const roleOf = l => (l.role in ROLES ? l.role : "makura");
  // 人物の切りかえ（stage.html の上下と同じ時刻：次の台詞の頭の 0.42 秒前から 0.32 秒で）
  const sw = [];
  for (let i = 0; i < L.length; i++) {
    const r = roleOf(L[i]), p = i ? roleOf(L[i - 1]) : "makura";
    if (r !== p) sw.push({ t: L[i].start - 0.42, from: p, to: r });
  }
  // 拍子（うなずき・眉・手）：口の時刻表の句の頭とアクセントの核から、人物ごとの間隔で間引く
  const beats = [], brows = [], gests = [];
  const M = lip?.m || [];
  const lineAtT = t => { for (const l of L) if (t >= l.start - 0.02 && t <= l.end + 0.02) return l; return null; };
  if (lip) {
    let lastNod = -9, lastGest = -9, prevEnd = -9;
    const pset = new Set((lip.p || []).map(x => x.toFixed(3)));
    for (const tb of lip.b || []) {
      const l = lineAtT(tb); if (!l) continue;
      const R = ROLES[roleOf(l)];
      if (tb - lastNod >= R.nodGap) { beats.push({ t: tb, a: R.nod * (0.75 + 0.5 * rnd(tb * 7)), role: roleOf(l) }); lastNod = tb; }
      if (!l.sage && l.end - l.start > 1.4 && tb - lastGest >= R.gestGap && tb > l.start + 0.15 && tb < l.end - 0.6) {
        gests.push({ t: tb, a: R.gest * (0.7 + 0.3 * rnd(tb * 3)), role: roleOf(l), side: roleOf(l) === "ooya" ? (rnd(tb) > 0.4 ? 1 : -1) : roleOf(l) === "hachi" ? -1 : (rnd(tb * 5) > 0.5 ? 1 : -1), line: l.i });
        lastGest = tb;
      }
    }
    // 眉：息つぎのあと（0.25 秒より長い間）に始まる句の頭で、小さく上がる
    for (let j = 0; j < M.length; j++) {
      const m = M[j], gap = j ? m[0] - (M[j - 1][0] + M[j - 1][1]) : 9;
      if (gap > 0.25 && pset.has(m[0].toFixed(3))) { const l = lineAtT(m[0]); if (l) brows.push({ t: m[0], a: ROLES[roleOf(l)].brow * (0.6 + 0.4 * rnd(j)) }); }
      prevEnd = m[0] + m[1];
    }
  }
  // 一言の顔（文の決まり）
  const faces = [];
  for (const l of L) {
    const tx = l.text.replace(/[「」]/g, ""), r = roleOf(l), dur = l.end - l.start;
    if (/^(へっ|えっ|へえっ|ええっ)/.test(tx)) faces.push({ t0: l.start - 0.25, t1: l.start + 0.9, f: "surprise", w: 1 });
    else if (/^(へえ|ほう)/.test(tx)) faces.push({ t0: l.start - 0.2, t1: l.start + 0.8, f: "surprise", w: 0.5 });
    if (/^ちえっ/.test(tx)) faces.push({ t0: l.start - 0.15, t1: l.start + 1.0, f: "pout", w: 1 });
    if (/^……/.test(tx)) faces.push({ t0: l.start - 0.6, t1: l.start + 0.9, f: "thinking", w: 0.9, gazeDown: 1 });
    if (/[？?]」?$|(かい|ですか|かね)」?$/.test(l.text) && r !== "makura") faces.push({ t0: l.end - Math.min(1.2, dur * 0.5), t1: l.end + 0.35, f: "question", w: 1 });
    if (/！/.test(tx) && r === "hachi") { const k = tx.indexOf("！") / Math.max(1, tx.length);
      // 第 6 回（「看板！」の驚きが弱く、目を閉じた笑顔になる）：文の頭の「！」は、0.4 秒ほどの驚きの山（目を見開き眉を上げる）を作ってから喜びへ移る
      if (k < 0.35) { faces.push({ t0: l.start - 0.12, t1: l.start + 0.65, f: "surprise", w: 0.85 }); faces.push({ t0: l.start + 0.8, t1: l.start + dur * k + 1.3, f: "delight", w: 0.5 }); }   // 第 7 回：山を 0.7 秒に（引きの画でも写る長さ）
      else faces.push({ t0: l.start + dur * k - 0.5, t1: l.start + dur * k + 0.6, f: "delight", w: 0.7 }); }
    if (l.sage) faces.push({ t0: l.start + dur * 0.4, t1: l.end + 2.2, f: "delight", w: 0.8 });
  }
  for (const f of marks?.faces || []) { const l = L[f.line]; if (!l) continue; const t0 = f.at ? findKana(M, f.line, f.at) ?? l.start : l.start; faces.push({ t0: t0 - (f.lead ?? 0.2), t1: t0 + (f.len ?? 1.0), f: f.face, w: f.w ?? 1, gazeDown: f.gazeDown }); }
  // 息を吸う（間のあと、話しはじめる前に胸と肩が少し上がる）
  const breaths = [];
  for (let i = 0; i < L.length; i++) { const gap = i ? L[i].start - L[i - 1].end : 9; if (gap > 0.45) breaths.push({ t: L[i].start, a: clamp(gap / 1.2, 0.4, 1) }); }
  // 目の小さな動き（話している間、0.6〜1.8 秒ごとに数 cm 先へ）
  const sacc = []; { let t = 0.5, i = 0; while (t < TL.duration + 2) { sacc.push({ t, x: rnd(i * 3 + 1) - 0.5, y: rnd(i * 3 + 2) - 0.5 }); t += 0.6 + 1.2 * rnd(i++ * 3 + 3); } }
  return { TL, L, lip, M, sw, beats, brows, gests, faces, breaths, sacc, marks: marks || {} };
}

// 台詞の中の語（エンジンが読んだかな）の頭の時刻
export function findKana(M, line, kana) {
  const ms = M.filter(m => m[5] === line); const s = ms.map(m => m[4]).join("");
  const k = s.indexOf(kana); if (k < 0) return null;
  let n = 0; for (const m of ms) { if (n >= k) return m[0]; n += m[4].length; }
  return null;
}

// 人物の重み（切りかえは首の回りと同じ時刻・同じ長さで。顔は首といっしょに替わる）
export function roleWeights(score, t, lag = 0) {
  const w = { makura: 1, hachi: 0, ooya: 0 }; let cur = "makura";
  for (const s of score.sw) {
    const k = ease((t - lag - s.t) / 0.34);
    if (k <= 0) break;
    w[s.from] = (w[s.from] || 0) * (1 - k); w[s.to] = (w[s.to] || 0) + (1 - (w[s.to] || 0)) * k;
    for (const r of Object.keys(w)) if (r !== s.from && r !== s.to) w[r] *= (1 - k);
    cur = s.to;
  }
  const sum = Object.values(w).reduce((a, b) => a + b, 0) || 1; for (const r in w) w[r] /= sum;
  return w;
}

// ---------------------------------------------------------------- 一コマの値（純粋な関数）
export function frameAt(score, t) {
  const W = roleWeights(score, t), R = k => Object.entries(W).reduce((s, [r, w]) => s + (ROLES[r]?.[k] || 0) * w, 0);
  // 顔：人物の地の顔 → 一言の顔 → 眉の拍子
  const face = {};
  for (const [r, w] of Object.entries(W)) addF(face, ROLES[r]?.face, w);
  let gazeDown = 0, recoil = 0;
  for (const f of score.faces) { if (t < f.t0 - 0.3 || t > f.t1 + 0.5) continue; const k = f.w * bump(t, f.t0 - 0.12, f.t0 + 0.12, f.t1 - 0.1, f.t1 + 0.35); addF(face, BEAT_FACES[f.f] || EMO[f.f], k); if (f.gazeDown) gazeDown = Math.max(gazeDown, k);
    if (f.f === "surprise") recoil = Math.max(recoil, f.w * bump(t, f.t0, f.t0 + 0.12, f.t0 + 0.3, f.t0 + 0.8)); }   // 驚きは首が小さく引く
  for (const b of score.brows) { const d = t - b.t; if (d > -0.15 && d < 0.6) face.browUp = (face.browUp || 0) + b.a * bump(d, -0.12, 0.02, 0.18, 0.55); }
  // 首のうなずき（アクセントの核に、下へ小さく・すぐ戻る）
  let nod = 0;
  for (const b of score.beats) { const d = t - b.t; if (d > -0.12 && d < 0.4) nod += b.a * Math.sin(Math.PI * clamp((d + 0.1) / 0.42, 0, 1)) * (d < 0.06 ? 1 : 1 - 0.3 * (d - 0.06) / 0.34); }
  // 息を吸う
  let inh = 0; for (const b of score.breaths) { const d = t - b.t; if (d > -0.7 && d < 0.4) inh = Math.max(inh, b.a * bump(d, -0.6, -0.15, 0.0, 0.35)); }
  // 手の拍子（右手＝扇子・左手＝手のひら）
  let gR = 0, gL = 0, gDir = 0;
  for (const g of score.gests) { const d = t - g.t; if (d < -0.45 || d > 1.3) continue; const v = g.a * bump(d, -0.40, -0.05, 0.25, 1.15); if (g.side < 0) { if (v > gR) { gR = v; gDir = g.role === "hachi" ? 1 : g.role === "ooya" ? -1 : 0; } } else if (v > gL) gL = v; }
  // 目の小さな動き
  let sx = 0, sy = 0; for (const s of score.sacc) { if (s.t > t) break; sx = s.x; sy = s.y; }
  return { W, face, gazeDown, recoil, nod, inh, gR, gL, gDir, sx: sx * R("sacc"), sy: sy * R("sacc") * 0.6,
           lean: R("lean"), chin: R("chin"), roll: R("roll"), shoulder: R("shoulder"), lids: R("lids"), relaxed: R("relaxed"), mouthK: R("mouth") };
}

// 口：拍の母音と、唇を閉じる子音。口は声より少し先に形をつくる（lead 秒）
// 2026-10-14（11 人 第 12 回・3 人「a・e・o がどれも横長の同じ形で、o の丸み（すぼまり）がない」）：
// e は「い」寄りの横の形だけだと細い線に見えた（テ・エ）→ あごの開き（aa）を少し足す。o は「お」の縦の開きを少し控え「う」の丸めを足し、口の幅を狭める形（PUCK＝Fcl_MTH_Small）を強める。u も少しすぼめる。次の拍が o・u なら手前から丸めはじめる
const VIS = { a: { aa: .80, oh: .06 }, i: { ih: .62, ee: .18 }, u: { ou: .58 }, e: { ee: .58, aa: .26 }, o: { oh: .62, ou: .30 }, N: { ou: .08 }, cl: {}, A: { aa: .12 }, I: { ih: .1 }, U: { ou: .1 }, E: { ee: .12 }, O: { oh: .12, ou: .06 } };
const PUCK = { o: .50, u: .26, O: .14, U: .08 };   // 日本語の「う」は丸めが弱い（唇を寄せるだけ）
export function mouthAt(score, t, env, lead = 0.045) {
  const M = score.M, tt = t + lead; const out = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0, pucker: 0 };
  if (!M.length) return null;
  // 二分探索
  let lo = 0, hi = M.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (M[mid][0] <= tt) lo = mid; else hi = mid - 1; }
  const m = M[lo]; if (!m || tt < m[0] || tt > m[0] + m[1] + 0.06) return out;   // 拍の外＝閉じる（env が残っていても）
  const u = clamp((tt - m[0]) / Math.max(0.03, m[1]), 0, 1), nx = M[lo + 1] && M[lo + 1][0] - (m[0] + m[1]) < 0.05 ? M[lo + 1] : null;
  const A = VIS[m[2]] || {}, Bn = nx ? VIS[nx[2]] || {} : {};
  const k = nx ? ease((u - 0.68) / 0.32) * 0.45 : 0;   // 次の拍へ寄せる（調音の重なり）
  let open = clamp(Math.max(env, 0.32) * 1.0, 0, 1);
  if (m[3]) open *= ease((tt - m[0] - 0.035) / Math.max(0.03, Math.min(0.07, m[1] * 0.45)));   // マ・バ・パ行：唇をいったん閉じる
  if (nx && nx[3]) open *= 1 - ease((u - 0.78) / 0.22) * 0.85;                                   // 次がマ行なら閉じに向かう
  for (const [kk, v] of Object.entries(A)) out[kk] += v * (1 - k) * open;
  for (const [kk, v] of Object.entries(Bn)) out[kk] += v * k * open;
  out.pucker = ((PUCK[m[2]] || 0) * (1 - k) + (nx ? (PUCK[nx[2]] || 0) * k : 0)) * (0.55 + 0.45 * open);   // 唇の丸めは声の大きさにあまりよらない
  return out;
}

// ---------------------------------------------------------------- 仕草の型（stage.html の ACTDEF と同じ書き方：胸から見た手の位置 p・親指 th・手のひら n。x＋が碧の左）
export const SHOSA = {
  // 扇子を刷毛に：膝の先の空間に「戸の面」を一枚立て（胸から前へ約 0.5 m）、その面の上で扇子の先を上から下へ塗り下ろす。
  // はじめの 0.2 秒で目が戸の面を見て、塗り終わりの 2 割で客席へ戻る（look・lookUntil）。周期は 0.82 秒（一往復）
  nuru: { headX: 0.10, leftCurl: 0.5, loop: 0.95, poleR: [-0.45, -0.88, 0.1], aim: [-0.05, 0.62, 0.78], look: [-0.06, -0.02, 0.95], lookUntil: 0.8, keys: [
    { u: 0.00, R: { p: [-0.11, 0.04, 0.46], th: [-0.10, 0.80, 0.58], n: [0.15, 0, 1] }, L: { p: [0.10, -0.14, 0.30], th: [0, 0, 1], n: [0, 1, 0] } },
    { u: 0.12, R: { p: [-0.11, 0.04, 0.46], th: [-0.10, 0.80, 0.58], n: [0.15, 0, 1] }, L: { p: [0.10, -0.14, 0.30], th: [0, 0, 1], n: [0, 1, 0] } },
    { u: 0.48, R: { p: [-0.10, -0.18, 0.49], th: [-0.10, 0.62, 0.78], n: [0.15, 0, 1] }, L: { p: [0.10, -0.14, 0.30], th: [0, 0, 1], n: [0, 1, 0] } },
    { u: 0.62, R: { p: [-0.10, -0.18, 0.49], th: [-0.10, 0.62, 0.78], n: [0.15, 0, 1] }, L: { p: [0.10, -0.14, 0.30], th: [0, 0, 1], n: [0, 1, 0] } },
    { u: 1.00, R: { p: [-0.11, 0.04, 0.46], th: [-0.10, 0.80, 0.58], n: [0.15, 0, 1] }, L: { p: [0.10, -0.14, 0.30], th: [0, 0, 1], n: [0, 1, 0] } }] },
  // 塗る：上と下の端で一瞬止まる（刷毛が戸の面に当たって向きを変える手がかり。v5）
  // 扇子で相手を指す：右手を胸の前へ出し（肘は胸の高さまで・伸ばしきらない）、閉じた扇子の先を、話し相手の胸の高さへ斜め前に向ける。
  // 手の向きの型（th・n）だけでは、手首の角の決まり（stage.html の 40°）で扇子が立ってしまうので、
  // 扇子の先の向き aim（胸から見た向き）へ、層が手首を最後に向け直す（2.2 rad まで）。
  // 指しているあいだは、目も扇子の先の相手へ（look。見下ろしの人物でも、目は相手）。戻りは 0.8 秒ほどかけて膝へ納める
  sasu: { headX: 0.0, poleR: [-0.6, -0.8, 0.0], aim: [-0.50, 0.22, 0.84], look: [-1.0, 0.18, 1.7], lookUntil: 0.62, keys: [
    { u: 0.00, R: { p: [-0.16, -0.12, 0.38], th: [-0.35, 0.55, 0.76], n: [0.85, 0.5, 0] } },
    { u: 0.20, R: { p: [-0.16, -0.09, 0.45], th: [-0.40, 0.40, 0.82], n: [0.85, 0.5, 0] } },
    { u: 0.58, R: { p: [-0.16, -0.08, 0.46], th: [-0.40, 0.40, 0.82], n: [0.85, 0.5, 0] } },
    { u: 1.00, R: { p: [-0.16, -0.24, 0.32], th: [-0.3, 0.4, 0.86], n: [1, 0, 0] } }] },
};
const GRIP = { left: [0.075, -0.02, 0], right: [-0.075, -0.02, 0] };   // 手の骨から握りの中心まで（T ポーズの向き：指＝外・手のひら＝下）
const KANAME = 0.045;                                                   // 握りの中心から要（扇子の根）の端まで

// ---------------------------------------------------------------- 森羅寄席の高座（stage.html）に重ねる
// ctx＝{ THREE, B, vrm, gaze, AUD, head0, TL, L, P, MOUTH, actAt, yawAt, bowAt, roleAt, titleEl }
export function createStageLayer(ctx, score, opt = {}) {
  const { B, vrm, THREE } = ctx;
  const em = vrm.expressionManager;
  // 上下の量：stage.html の ±0.58 rad を上限に、ふだんは八っつぁん ×0.92・ご隠居 ×0.80（目上は小さくゆっくり＝調べ §7.2）
  const Y0 = t => { const w = roleWeights(score, t); return ctx.yawAt(t) * ((w.makura || 0) + (w.hachi || 0) * ROLES.hachi.yawK + (w.ooya || 0) * ROLES.ooya.yawK); };
  // 戸をたたく所作のあいだは、先に上手（八っつぁんの向き）へ回しておく（v5。調べ §1：訪ねて来た人は上手を向いて戸をたたく）
  const knockTurn = t => { for (const k of KNOCKS) if (t >= k.h0 - 0.4 && t <= k.b1 + 0.4) return ease((t - (k.h0 - 0.4)) / 0.4); return 0; };
  const Y = t => { const y = Y0(t), k = knockTurn(t); return k > 0 ? y + (0.58 * ROLES.hachi.yawK - y) * k : y; };
  const BOW_TITLE = opt.titleBow !== false;
  // 顔の形の場所
  // 2026-10-13：addFaceMorphs のあと、顔の網の形の名前（Fcl_*）が番号（"0"〜"56"）に置きかわっていた（形を足すと名前の表が作りなおされる）。
  // そのため高座の顔の形（眉・目・口角）が、AoiLidLow・AoiCheek 以外ひとつも効いていなかった（11 人の第 4・5 回「表情の差が数 px」）。
  // → 足す前の名前の表を控え、足したあとに名前を戻す（番号はそのまま。足した形は後ろに付くだけ）
  const nameKeep = []; vrm.scene.traverse(o => { if (o.morphTargetDictionary) nameKeep.push([o, { ...o.morphTargetDictionary }]); });
  if (addFaceMorphs) { try { addFaceMorphs(vrm); } catch (e) { /* 形を足せなくても動く */ } }
  for (const [o, d] of nameKeep) for (const [k, i] of Object.entries(d)) if (o.morphTargetDictionary && o.morphTargetDictionary[k] == null) o.morphTargetDictionary[k] = i;
  const binds = {}; const meshes = [];
  vrm.scene.traverse(o => { if (o.morphTargetDictionary && o.morphTargetDictionary.Fcl_BRW_Surprised != null) meshes.push(o); });
  for (const [ch, name] of Object.entries(CHANNELS)) binds[ch] = meshes.map(m => [m, m.morphTargetDictionary[name]]).filter(([, i]) => i != null);
  // 第 6・7 回（6 人「開いた口の中が一色の平たいピンクで、ゴムの板に見える」）：口の中（舌・歯・奥）は顔の光をそのまま受けて明るすぎた。
  // 口の中の材質だけを暗く・赤みを残して落とす（奥は暗いのが自然）。顔の肌・目は触らない
  if (opt.mouthDark !== false) vrm.scene.traverse(o => { for (const mt of [].concat(o.material || [])) {
    if (!/FaceMouth/i.test(mt.name || "") || mt.userData.rkDark) continue; mt.userData.rkDark = true;
    // 第 8 回（「平たいピンク」が「平たい赤」になっただけ）→ もう一段暗く・赤みを抑えて、奥の陰に見える色へ
    // 第 9 回（暗い赤の一色で「濃い紅」に見える）→ 暗くしすぎず、舌と歯の色の差が残る程度に（明るい所は残し、陰の側を深く）
    // 第 11 回（歯や舌の差が見えない）：材質ごと暗くすると歯まで暗くなっていた → 口の絵（テクスチャ）の赤い所（口の奥・舌）だけを暗くし、
    // 白い所（歯）は残す。絵が読めないときは前の材質ごとの暗さにする
    const u = mt.uniforms || {}, tex = u.map?.value, img = tex?.image;
    let done = false;
    try { if (img && img.width) { const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const g = c.getContext("2d"); g.drawImage(img, 0, 0);
      const D = g.getImageData(0, 0, c.width, c.height), a = D.data;
      for (let i = 0; i < a.length; i += 4) { const r = a[i], gg = a[i + 1], b = a[i + 2], red = (r - (gg + b) / 2) / 255;   // 赤み（歯の白は 0 に近い）
        if (red > 0.08) { const k = 1 - Math.min(0.62, red * 1.6); a[i] = r * (k + 0.06); a[i + 1] = gg * k; a[i + 2] = b * k; } }
      g.putImageData(D, 0, 0); const nt = new THREE.CanvasTexture(c); nt.colorSpace = tex.colorSpace; nt.flipY = tex.flipY; nt.wrapS = tex.wrapS; nt.wrapT = tex.wrapT; nt.needsUpdate = true;
      u.map.value = nt; if (u.shadeMultiplyTexture?.value === tex) u.shadeMultiplyTexture.value = nt; done = true; } } catch (e) { done = false; }
    if (u.shadeColorFactor?.value?.multiplyScalar) u.shadeColorFactor.value.multiplyScalar(done ? 0.5 : 0.25);
    if (!done && u.litFactor?.value?.multiply) u.litFactor.value.multiply(new THREE.Color(0.56, 0.44, 0.44)); } });
  let F = null, MO = null;
  const stageNod = (t, fi) => 0.05 * (ctx.TL.mouth[fi] || 0) * Math.sin(t * 9.0);   // stage.html の、口の開きに付いた速い首ふり（外す。ゆっくりの揺れは残す）
  const tiltOf = r => (r === "ooya" ? 0.05 : r === "hachi" ? -0.06 : 0);

  // 冒頭の礼（題の札のあいだに下げていて、札が消えてから上げるのを見せる）
  function titleBow(t) {
    const a = ctx.TL.title_sec;   // 声の始まり
    if (t >= a) return null;
    return 1 - ease((t - (a - 1.05)) / 0.9);   // 下げたまま止めて、a−1.05 から上げはじめ、a−0.15 で上がりきる
  }
  // ---- 手を置く（二つの骨の IK＝stage.html の ik2）。target＝手の骨の行き先（世界）・Rq＝手の向き（世界）・w＝今の形からの寄せ具合
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  function placeHand(side, target, Rq, w, poleArr) {
    if (w <= 0.001) return;
    const hd = B(side + "Hand"); vrm.scene.updateMatrixWorld(true);
    const p0 = hd.getWorldPosition(V3(0, 0, 0)), q0 = hd.getWorldQuaternion(new THREE.Quaternion());
    const cq = ctx.CHEST().getWorldQuaternion(new THREE.Quaternion());
    ctx.ik2(side, p0.clone().lerp(target, w), V3(...poleArr).normalize().applyQuaternion(cq));
    const qw = q0.clone().slerp(Rq, w), pq = hd.parent.getWorldQuaternion(new THREE.Quaternion());
    hd.quaternion.copy(pq.invert().multiply(qw)); hd.updateMatrixWorld(true);
  }
  function curl(side, c) {   // stage.html の fingers() と同じ曲げ方
    const s = side === "right" ? 1 : -1;
    ["Index", "Middle", "Ring", "Little"].forEach((Fn, i) => { const k = [1.15, 1.25, 1.3, 1.35][i] * c;
      const a = B(side + Fn + "Proximal"), b = B(side + Fn + "Intermediate"), d = B(side + Fn + "Distal");
      if (a) a.rotation.set(0, 0, s * k * 0.95); if (b) b.rotation.set(0, 0, s * k * 1.05); if (d) d.rotation.set(0, 0, s * k * 0.7); });
    const tm = B(side + "ThumbMetacarpal") || B(side + "ThumbProximal"), tpx = B(side + "ThumbProximal"), td = B(side + "ThumbDistal");
    if (tm) tm.rotation.set(0, -s * 0.35 * c, s * 0.25 * c); if (tpx && tpx !== tm) tpx.rotation.set(0, -s * 0.45 * c, 0); if (td) td.rotation.set(0, -s * 0.4 * c, 0);
  }
  const gripW = (side, Rq) => V3(...GRIP[side]).applyQuaternion(Rq);
  // 戸をたたく所（stage.html の所作 knock の打音の時刻）。扇子を渡す・打つ・戻す の段取り
  const KNOCKS = score.L.filter(l => l.act && l.act.type === "knock" && (l.act.taps || []).length).map(l => {
    const tp = l.act.taps, a = tp[0], z = tp[tp.length - 1];
    // b1＝stage.html の knock の所作が抜けるまで（台詞の終わり＋0.15＋0.5）。戻したあとは扇子を膝の前に横に持つ（縦に立てない）
    return { taps: tp, h0: a - 0.85, hs: a - 0.52, b0: z + 0.30, bs: z + 0.62, rest: z + 1.0, b1: Math.max(z + 1.4, l.end + 0.65) };
  });
  function knockAt(t) { for (const k of KNOCKS) if (t >= k.h0 && t <= k.b1) { k.w = ease((t - k.h0) / 0.3) * (1 - ease((t - (k.b1 - 0.38)) / 0.38)); k.left = t >= k.hs && t < k.bs; return k; } return null; }
  function tapOf(t, taps) {   // stage.html と同じ打つ形（溜め→振り下ろし→床で 2 コマ→跳ね返り）。1＝床
    let tap = 0;
    for (const [kk, tt] of taps.entries()) { const d = t - tt, wu = kk === 0 ? 0.30 : 0.12; let v = 0;
      if (d > -0.12 - wu && d <= -0.12) v = -0.35 * ease((d + 0.12 + wu) / wu);
      else if (d > -0.12 && d <= 0) v = -0.35 + 1.35 * ease((d + 0.12) / 0.12);
      else if (d > 0 && d <= 0.066) v = 1; else if (d > 0.066 && d < 0.18) v = 1 - ease((d - 0.066) / 0.114);
      else if (d >= 0.18 && d < 0.34) v = -0.22 * Math.sin(Math.PI * (d - 0.18) / 0.16);
      if (Math.abs(v) > Math.abs(tap)) tap = v; }
    return tap;
  }
  function handsKnock(t, K) {
    const ch = ctx.CHEST(); vrm.scene.updateMatrixWorld(true);
    const cq = ch.getWorldQuaternion(new THREE.Quaternion()), toW = a => ch.localToWorld(V3(...a)), dW = a => V3(...a).normalize().applyQuaternion(cq);
    const up = V3(0, 1, 0), tap = tapOf(t, K.taps);
    // 受け渡しの所：胸の前・腹の高さで、扇子を縦（先が上）にして両手で
    const O = toW([-0.01, -0.13, 0.31]);
    const RqRm = ctx.handQuatW("right", up, dW([1, 0, 0])), RqL = ctx.handQuatW("left", up, dW([-1, 0, 0]));
    const Rm = O.clone().sub(gripW("right", RqRm)), Lm = O.clone().add(V3(0, 0.035, 0)).sub(gripW("left", RqL));
    // 打つ形：左手の扇子は先が上・根（要）が下。根が左膝の外の座布団を打つ（調べ §7.5「座布団の前か右」の左右を、左手なので左に）。12 cm 上まで振り上げる
    const FL = V3(0.25, ctx.KOZA_Y + ctx.ZB_H + 0.004, 0.27), hgt = 0.16 * (1 - Math.max(-0.4, Math.min(1, tap)));
    const Lk = FL.clone().add(V3(0, KANAME + hgt, 0)).sub(gripW("left", RqL));
    // 右手は空の拳で、戸を叩く手つき。戸は上手（碧の左＝胸の x＋）の前。肘を曲げて胸の前から上手前方へ、打つ瞬間に 4 cm 前へ
    //（2026-10-13 第 3 回 まさひろ「拳が下手へ出ている」＝v3 の動画は胸の x−（下手）だった。ここで上手へ直した）
    const RqRk = ctx.handQuatW("right", dW([1, 0, 0]), dW([0, -1, 0]));
    // v6：拳は世界の高さで決める（体の前かがみにつられて沈まない）。座った頭の高さの 0.25 m 下＝帯の上（胸の高さにはまだ届いていない＝第 6 回）・上手の前。前へ 5 cm 打って 2 コマ止まり、3 cm 戻る
    const Rk = V3(0.15, ctx.head0.y - 0.25, 0.36).add(V3(0.30, 0, 1).normalize().multiplyScalar(0.05 * Math.max(0, tap) - 0.085 * Math.max(0, -tap)));   // 胸の高さ・上手の前（v5）。溜めで 3.5 cm 引き、打つ瞬間に 6 cm 前で 2 コマ止まる
    const s2 = ease((t - K.hs - 0.03) / 0.22), s3 = ease((t - K.b0) / 0.25), s4 = ease((t - K.bs - 0.02) / (K.rest - K.bs));
    const pick = (a, b, c) => s3 > 0 ? b.clone().lerp(c, s3) : a.clone().lerp(b, s2);
    const Lt = pick(Lm, Lk, Lm); let Rt = pick(Rm, Rk, Rm);
    let qR = s3 > 0 ? RqRk.clone().slerp(RqRm, s3) : RqRm.clone().slerp(RqRk, s2);
    // 戻したあと：扇子は閉じたまま、膝の前に横向き（先が碧の左）に持つ。左手は左の腿へ（stage の休めの形へ戻す）
    const RqRr = ctx.handQuatW("right", dW([1, 0, 0.15]), dW([0, -1, 0]));
    const Rr = toW([-0.10, -0.33, 0.27]).sub(gripW("right", RqRr));
    if (s4 > 0) { Rt = Rm.clone().lerp(Rr, s4); qR = RqRm.clone().slerp(RqRr, s4); }
    const wL = K.w * (1 - s4);
    placeHand("left", Lt, RqL, wL, [0.75, -0.55, -0.25]);
    placeHand("right", Rt, qR, K.w, [-0.45, -0.85, -0.2]);   // 肘を下げて体に寄せる（袂が胸の前で板にならない）
    curl("left", 0.2 + 0.8 * wL * (K.left ? 1 : 0.6)); curl("right", 0.75 + 0.25 * (1 - K.w));
    // 打つあいだは左へ少し体を傾け、根が床に届くように
    const lean = K.w * s2 * (1 - s3);
    B("spine").rotation.x += 0.14 * lean; B("spine").rotation.z += -0.06 * lean; B("chest").rotation.x += 0.06 * lean;
  }
  // 冒頭の礼：扇子は膝の前（座布団の前の端）に横に置き（要が碧の右）、右手はその要のそば、左手は左に。上げはじめに右手で取る
  const OK_P = () => V3(-0.06, ctx.KOZA_Y + ctx.ZB_H + 0.012, 0.40);
  const OK_Q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(V3(0, 0, 1), V3(1, 0, 0), V3(0, 1, 0)));
  const obW = t => 1 - ease((t - (ctx.TL.title_sec - 0.85)) / 0.7);
  const obPicked = t => t >= ctx.TL.title_sec - 0.85;
  function handsOpenBow(t) {
    const w = obW(t); if (w <= 0.001) return;
    const RqR = ctx.handQuatW("right", V3(1, 0, 0), V3(0, -1, 0)), RqL = ctx.handQuatW("left", V3(-1, 0, 0), V3(0, -1, 0));
    const Rt = OK_P().sub(gripW("right", RqR)), Lt = V3(0.11, ctx.KOZA_Y + ctx.ZB_H + 0.02, 0.38);
    placeHand("right", Rt, RqR, w, [-0.75, -0.55, -0.25]);
    placeHand("left", Lt, RqL, w, [0.75, -0.55, -0.25]);
    curl("left", 0.2 * w + 0.2 * (1 - w));
  }
  let fanS0 = null, fanL = null, fanK = null;
  const QD = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), V3(0, 0, 1));   // 扇子の軸＝親指の向き（stage.html の attachFan と同じ）
  function fans(t) {
    const fan = ctx.getFan && ctx.getFan(); if (!fan || !ctx.scene) return;
    if (!fanS0) fanS0 = fan.scale.clone();
    const mk = () => { const f = fan.clone(); f.scale.set(1, 1, 1); f.matrixAutoUpdate = false; f.visible = false; ctx.scene.add(f); return f; };
    if (!fanL) fanL = mk(); if (!fanK) fanK = mk();
    const K = knockAt(t), inL = !!(K && K.left);
    const inK = BOW_TITLE && t < ctx.TL.title_sec && !obPicked(t);
    fan.scale.copy(fanS0).multiplyScalar(inL || inK ? 1e-4 : 1);
    fanL.visible = inL; fanK.visible = inK;
    if (inL) { vrm.scene.updateMatrixWorld(true); const hd = B("leftHand"), q = hd.getWorldQuaternion(new THREE.Quaternion()), p = hd.getWorldPosition(V3(0, 0, 0)).add(gripW("left", q));
      fanL.matrix.compose(p, q.clone().multiply(QD), V3(1, 1, 1)); fanL.matrixWorldNeedsUpdate = true; fanL.updateMatrixWorld(true); }
    if (inK) { fanK.matrix.compose(OK_P(), OK_Q, V3(1, 1, 1)); fanK.matrixWorldNeedsUpdate = true; fanK.updateMatrixWorld(true); }
  }
  function pose(t) {
    const fi = Math.min(ctx.TL.mouth.length - 1, Math.max(0, Math.round(t * ctx.TL.fps)));
    const A = ctx.actAt(t); const busy = A && A.w > 0.01;
    F = frameAt(score, t);
    // 1) stage.html の上下・目線の高さ・口のうなずきを外し、目→首→胸の順に回し直す
    const y0 = ctx.yawAt(t), r0 = ctx.roleAt(t), bowS = ctx.bowAt(t);   // stage.html が足した量そのもの（v5 で直した：前は人物の倍率を掛けた値を引いていた）
    const rot = (n, x, y, z) => { const b = B(n); if (b) { b.rotation.x += x; b.rotation.y += y; b.rotation.z += z; } };
    rot("spine", 0, -y0 * 0.18, 0); rot("chest", 0, -y0 * 0.20, 0); rot("upperChest", 0, -y0 * 0.10, 0); rot("neck", 0, -y0 * 0.25, 0); rot("head", 0, -y0 * 0.34, y0 * 0.12);
    const sn = stageNod(t, fi); rot("head", -sn, 0, 0); rot("neck", -sn * 0.4, 0, 0);
    rot("head", -tiltOf(r0) * (1 - (busy ? A.w : 0)), 0, 0);
    // 首が先・胸はあと（およそ 0.1 秒遅れ・小さく）。頭はわずかに行き過ぎて戻る
    const yH = Y(t), yN = Y(t - 0.04), yC = Y(t - 0.10), yS = Y(t - 0.15);
    const over = 0.07 * (Y(t - 0.08) - Y(t - 0.30));   // 回り終わりの小さな行き過ぎ（向きの変化に比例・すぐ消える）
    // 配分は首 6：胸 4（首だけで振ると、首をねじったように見える＝調べ §1・§7.2）
    // 第 4 回（3 人「上下が首の振りだけで、誰の台詞か絵で分かりにくい」）→ 胸と腰もはっきり相手へ向ける（首 5：胸 5 ほど）
    rot("spine", 0, yS * 0.19, 0); rot("chest", 0, yC * 0.24, 0); rot("upperChest", 0, yC * 0.13, 0);
    rot("neck", 0, yN * 0.26, 0); rot("head", 0, (yH + over) * 0.34, -yH * 0.10);
    // 2) 人物の姿勢と目の高さ：八っつぁんは前のめり・肩が上がり気味・少し見上げる、ご隠居は背を立てて少し見下ろす（stage.html の高さを、首の回りと同じ時刻でなめらかに替える）
    const bowK = 1 - Math.min(1, bowS * 1.5);
    rot("spine", F.lean * 0.6 * bowK, 0, 0); rot("chest", F.lean * 0.5 * bowK, 0, 0); rot("head", F.chin * bowK, 0, F.roll * bowK);
    rot("leftShoulder", 0, 0, -F.shoulder); rot("rightShoulder", 0, 0, F.shoulder);
    // 3) うなずき（アクセントの核）・息を吸う
    // 驚きは首が引いてあごが少し上がる（第 8 回：眉が前髪に隠れて上がって見えない → 顔を少し起こして、眉と見開いた目が前髪の下から見えるように）
    rot("head", F.nod * bowK - 0.12 * F.recoil, 0, 0.11 * (F.face.tilt || 0) * bowK); rot("neck", F.nod * 0.35 * bowK - 0.05 * F.recoil, 0, 0); rot("chest", -0.03 * F.recoil, 0, 0);   // 問いの語尾で首を少しかしげる・驚きは首が引く
    rot("chest", -0.022 * F.inh, 0, 0); rot("upperChest", -0.012 * F.inh, 0, 0); rot("leftShoulder", 0, 0, -0.018 * F.inh); rot("rightShoulder", 0, 0, 0.018 * F.inh);
    // 4) 冒頭の礼を見せる
    if (BOW_TITLE) { const tb = titleBow(t); if (tb != null) { const d = tb - bowS; rot("spine", 0.46 * d + 0.30 * tb, 0, 0); rot("chest", 0.12 * d + 0.10 * tb, 0, 0); rot("neck", 0.12 * d, 0, 0); rot("head", 0.14 * d, 0, 0); } }   // v5：背から深く（両手を座布団の前へつける深さ）
    // 5) 手：所作のないときだけ。stage.html の手振りの代わりに、句の拍子で小さく（右＝扇子の先が上がる・左＝手のひらを返す）
    let shot = null, age = 9; try { shot = ctx.shotKind ? ctx.shotKind(t) : null; age = ctx.cutAge ? (ctx.cutAge(t) ?? 9) : 9; } catch (e) { shot = null; }
    const fresh = 1 - ease((age - 0.35) / 0.4);   // 画が切りかわった直後（0.35 秒）は、目の小さな動き・半目・まばたきを入れない（横目・半目に見えない）
    if (shot === "CU") { F.gR *= 0.35; F.gL *= 0.35; }   // 顔の寄りでは手の拍子を弱める（扇子の角が画面の下から出入りしない）
    if (!busy) {
      const P = ctx.P, bow = BOW_TITLE && titleBow(t) != null ? titleBow(t) : bowS;
      for (const [s, side, g] of [[1, "left", F.gL], [-1, "right", F.gR]]) {
        const ua = B(side + "UpperArm"), la = B(side + "LowerArm"), hd = B(side + "Hand");
        const toward = side === "right" ? F.gDir * 0.12 * g : 0;   // 相手の側へ少し
        ua.rotation.set(P.uaX - 0.16 * g - 0.30 * bow, s * (P.uaY + 0.08 * g) + toward, -s * (P.uaZ - 0.08 * g));
        la.rotation.set(0, s * (P.laY - 0.62 * g + 0.30 * bow), s * P.laZ);
        hd.rotation.set(side === "left" ? -0.35 * g : 0, s * 0.05 * g, -s * (P.handX + 0.04 * g) + (side === "left" ? 0.5 * g : 0));
      }
    }
    // 5b) 仕草の扇子の先を向け直す（aim のある型）。扇子の先の向きを、胸から見た向きへ、手首だけで回す
    if (busy && A.D && A.D.aim && ctx.getFan && ctx.CHEST) {
      const fan = ctx.getFan(), hd = B("rightHand");
      if (fan && hd) {
        vrm.scene.updateMatrixWorld(true);
        const o = fan.getWorldPosition(new THREE.Vector3()), tip = fan.localToWorld(new THREE.Vector3(0, 0.23, 0)).sub(o).normalize();
        const cq = ctx.CHEST().getWorldQuaternion(new THREE.Quaternion());
        const want = new THREE.Vector3(...A.D.aim).normalize().applyQuaternion(cq);
        const qd = new THREE.Quaternion().setFromUnitVectors(tip, want), ang = 2 * Math.acos(Math.min(1, Math.abs(qd.w)));
        const k = Math.min(1, A.w) * Math.min(1, 2.2 / Math.max(1e-6, ang));
        const qd2 = new THREE.Quaternion().slerp(qd, k);
        const hw = hd.getWorldQuaternion(new THREE.Quaternion()), pw = hd.parent.getWorldQuaternion(new THREE.Quaternion());
        hd.quaternion.copy(pw.invert().multiply(qd2.multiply(hw))); hd.updateMatrixWorld(true);
      }
    }
    // 5c) 戸をたたく（調べ §2：右手は戸を叩く手つき、左手に持った扇子の根で床を打つ）。扇子を右手から左手へ渡して打ち、終わったら戻す
    const KN = knockAt(t);
    if (KN && ctx.ik2) handsKnock(t, KN);
    // 5d) 冒頭の礼：扇子を膝の前に横に置き、両手をその手前について下げる。上げながら右手で扇子を取る
    const OB = BOW_TITLE && ctx.ik2 ? titleBow(t) : null;
    if (OB != null) handsOpenBow(t);
    // 6) 目：首より先に動く・話しながら小さく動く・考えるときは下へ
    if (busy && A.D && A.D.look && ctx.CHEST && A.a) {   // 仕草の間は、目を仕草の先（戸の面・指す相手）へ。終わりの 2 割で客席へ戻す
      const lp = ctx.CHEST().localToWorld(new THREE.Vector3(...A.D.look));
      const pr = (t - A.a.t0) / Math.max(0.1, A.a.t1 - A.a.t0);
      const k = Math.min(1, A.w) * ease(pr / 0.12) * (1 - ease((pr - (A.D.lookUntil ?? 0.8)) / 0.15));
      ctx.gaze.position.lerp(lp, k);
    }
    if (KN) ctx.gaze.position.lerp(new THREE.Vector3(1.0, ctx.head0.y - 0.05, 2.4), KN.w);   // 戸は上手（訪ねて来た人は上手を向いて戸をたたく）
    if (!busy) {
      const yE = Y(t + 0.10), W = F.W;
      const gp = ctx.AUD.clone(); gp.x += Math.sin(yE) * 3.2; gp.y -= 0.2 * bowS;
      gp.y += (W.ooya || 0) * -0.35 + (W.hachi || 0) * 0.3;
      // 2026-10-13 本人「冒頭は正面を向いていてください」：礼から名乗りのあいだは、目も客席の真ん中のまま（目の小さな動きは二つ目の文から）
      const opening = score.L[1] ? ease((t - score.L[1].start) / 1.0) : 1;
      // 2026-10-14（自然さ）：言い終わりの 0.7 秒は目の小さな動きを止め、聞き手（まくらは客席の真ん中・本題は相手）をまっすぐ見る
      const ln = score.L.find(l => t >= l.start && t <= l.end + 0.3), endK = ln ? 1 - ease((t - (ln.end - 0.7)) / 0.3) : 1;
      gp.x += F.sx * 3.2 * (1 - fresh) * opening * endK; gp.y += F.sy * 3.2 * (1 - fresh) * opening * endK - F.gazeDown * 0.9;
      ctx.gaze.position.copy(gp);
    }
    // 7) 口・まぶた・やわらぎ（表情の器の値。直接の形は post で）
    // 2026-10-14（2 人「テで口の開くのが 0.1 秒遅れる」）：タ・カ行などは子音のあいだ音が小さく、声の大きさだけで開くと母音の頭まで開かない。
    // 唇を使わない子音の口は、子音のあいだに次の母音の形をもうつくっている → 声の大きさを 0.1 秒（3 こま）先まで見る（拍の外・促音・マ行の閉じは mouthAt が閉じる）
    const env = Math.max(ctx.MOUTH[fi] || 0, ctx.MOUTH[fi + 1] || 0, ctx.MOUTH[fi + 2] || 0, ctx.MOUTH[fi + 3] || 0);
    MO = mouthAt(score, t, Math.min(1, env * 0.9));
    if (MO) {
      // 決めの所で歯が見えないよう、開きの上限を下げた（v4）。第 6 回（開いた口の中が一色のピンクで板に見える）→ 大きく開く「あ」「お」をもう一段控えめに
      const VC = { aa: 0.52, oh: 0.50, ee: 0.40, ou: 0.42, ih: 0.30 };   // 第 9 回：寄りで口の中が大きく見えすぎる → もう一段小さく（話し言葉の口の開きはふつう小さい）
      for (const k of ["aa", "ih", "ou", "ee", "oh"]) em.setValue(k, clamp(MO[k] * F.mouthK, 0, VC[k]));
      // 第 8 回（「ちえっ」が細い赤い線で、とがらせた口に見えない）：とがらす顔のあいだは「う」の形を足し、横に開く形を弱める
      const pk = clamp(F.face.pucker || 0, 0, 1);
      if (pk > 0.03) { em.setValue("ou", Math.max(em.getValue("ou"), 0.55 * pk)); for (const k of ["aa", "ee", "ih"]) em.setValue(k, em.getValue(k) * (1 - 0.7 * pk)); }
    }
    // 決めの瞬間（仕草の山・一言の顔）にはまばたきを入れない
    const afterSw = score.sw.some(sw => t > sw.t + 0.25 && t < sw.t + 1.5);   // 人物が替わった直後（首を回すときの一回のまばたきのあと）は、まばたきを重ねない（v5）
    const hold = fresh > 0.5 || afterSw || (score.marks.acts || []).some(a => a._t0 != null && t > a._t0 + 0.15 && t < a._t1) || score.faces.some(f => t > f.t0 && t < Math.min(f.t1, f.t0 + 0.9));
    const bl = hold ? 0 : em.getValue("blink");
    em.setValue("blink", Math.max(bl, F.lids * (1 - 0.7 * fresh) * (1 - Math.min(1, F.face.wide * 3 || 0))));
    if (t < ctx.END.bowUp0) em.setValue("relaxed", F.relaxed);
    // 札：冒頭の礼が見えるよう、題の札を早めに消す（声の始まりの 2.1 秒前から 0.45 秒で）。下げたまま 0.5 秒ほど見せてから上げる
    if (BOW_TITLE && ctx.titleEl) { const a = ctx.TL.title_sec; ctx.titleEl.style.opacity = t < a - 2.1 ? 1 : 1 - ease((t - (a - 2.1)) / 0.45); }
  }
  function post(t) {
    if (!F) return;
    fans(t);
    const v = { ...F.face }; if (MO) v.pucker = (v.pucker || 0) + MO.pucker;
    for (const [ch, list] of Object.entries(binds)) { const x = clamp(v[ch] || 0, 0, 1); for (const [m, i] of list) m.morphTargetInfluences[i] = x; }
  }
  // 仕草を足す（marks の acts：{ line, type, at, lead, len }）
  function extendActs(ACTDEF, ACTS) {
    Object.assign(ACTDEF, SHOSA);
    for (const a of score.marks.acts || []) {
      const l = score.L[a.line]; if (!l || !ACTDEF[a.type]) continue;
      const t0 = (a.at ? findKana(score.M, a.line, a.at) ?? l.start : l.start) - (a.lead ?? 0.3);
      a._t0 = t0; a._t1 = t0 + (a.len ?? 1.4);
      ACTS.push({ type: a.type, t0, t1: a._t1, taps: [], line: l });
    }
    ACTS.sort((x, y) => x.t0 - y.t0);
  }
  return { pose, post, extendActs, frameAt: t => frameAt(score, t) };
}

// ---------------------------------------------------------------- ほかのアプリ（AoiMotion）で：顔と目だけを、公開の呼び口で
// 正座の体は AoiMotion にまだない（立つ・歩くが前提）。ここでは m.express と m.lookAt だけを使う。
// target＝見る先に使う Object3D（呼ぶ側が用意。碧の前方 2〜3 m）。毎こま呼ぶ
const _lastRole = new WeakMap();
export function driveAoiMotion(m, score, t, { target = null, center = null, dist = 2.6 } = {}) {
  const F = frameAt(score, t), r = Object.entries(F.W).sort((a, b) => b[1] - a[1])[0][0];
  if (_lastRole.get(m) !== r) {
    _lastRole.set(m, r);
    m.express(r === "ooya" ? "calm" : r === "hachi" ? "curious" : "warm", r === "hachi" ? 0.45 : 0.8, 99);
  }
  for (const f of score.faces) if (t >= f.t0 && t < f.t0 + 0.05 && EMO[f.f === "question" ? "curious" : f.f === "pout" ? "concern" : f.f === "delight" ? "smile" : f.f]) {
    m.express(f.f === "question" ? "curious" : f.f === "pout" ? "concern" : f.f === "delight" ? "smile" : f.f, f.w, f.t1 - f.t0);
  }
  if (target && center) {
    const y = (F.W.hachi || 0) * 0.58 - (F.W.ooya || 0) * 0.58;
    target.position.set(center.x + Math.sin(y) * dist, center.y + (F.W.hachi || 0) * 0.2 - (F.W.ooya || 0) * 0.2, center.z + Math.cos(y) * dist);
    m.lookAt(target);
  }
  return F;
}
