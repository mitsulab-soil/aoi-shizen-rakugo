/* 羽織を脱ぐ布 ── haori_cloth.js（2026-10-13）
   本人（2026-10-13）「羽織を脱ぐ姿が機械的です。もっと人間らしく。あと話しながら脱いでください。脱ぐときに羽織が浮くのがおかしいです。」
   調べたこと＝02_プロジェクト/01_公開中（HP公開）/05_Qualia_rakugo/資料/羽織を脱ぐ所作_調べ.md

   前の作り（stage.html の haoriSnap／haoriPost）：衿を持った瞬間の羽織の形を写し取り、手の高さに合わせて形ごと動かしていた。
   布が体から離れて宙に浮き、肩の外へ開いてから背へ回っていた（腕を横へ広げる動きと合わせて「機械的」「浮く」に見えた）。

   ここでは羽織を一枚の布（点と、点と点の長さ）として動かす（位置ベースの布＝ベルレ積分と長さの拘束）：
   1. 着ているあいだの羽織（高座のスキンと袖の布の層が毎こま作る形）を「目当ての形」とし、はじめは布を目当てに留めておく（pin＝1）。
   2. 脱ぎはじめると、呼ぶ側が点ごとに留める強さ（pin）と、目当てのずらし（肩から背へすべり落ちる道すじ）を渡す。
      留めが弱まった所から、布は重さで下がり、体（胴の断面を重ねた楕円）・腕・脚（カプセル）・座布団と高座の床に当たって止まる。
      → 布はいつも体に触れたまますべり、最後は重さで背の後ろへ落ちて、座布団の上にたまる（浮かない）。
   3. 点の位置から、もとの網の頂点（縫い目で分かれた頂点）へ書きもどし、面の向き（法線）も点で計算しなおす（縫い目で割れない）。
   すべて呼ぶ側の時刻のこまで進める（同じ順に進めれば同じ絵）。点 1,800・長さ 5,000 ほど。1 こま 4 小刻み×6 回で数 ms。 */

export class GarmentCloth {
  constructor(THREE, positions, index, { weld = 5e-4 } = {}) {
    this.THREE = THREE;
    const n = positions.length / 3; this.nv = n;
    const map = new Int32Array(n), key = new Map(); let np = 0; const first = [];
    for (let i = 0; i < n; i++) {
      const k = Math.round(positions[i * 3] / weld) + ',' + Math.round(positions[i * 3 + 1] / weld) + ',' + Math.round(positions[i * 3 + 2] / weld);
      let p = key.get(k); if (p === undefined) { p = np++; key.set(k, p); first.push(i); }
      map[i] = p;
    }
    this.map = map; this.np = np; this.first = Int32Array.from(first);
    const E = new Set(), tris = [];
    for (let f = 0; f < index.length; f += 3) {
      const a = map[index[f]], b = map[index[f + 1]], c = map[index[f + 2]];
      if (a === b || b === c || a === c) continue;
      tris.push(a, b, c);
      for (const [x, y] of [[a, b], [b, c], [c, a]]) E.add(x < y ? x * 65536 + y : y * 65536 + x);
    }
    this.tris = Int32Array.from(tris);
    this.edges = Int32Array.from([...E].flatMap(e => [Math.floor(e / 65536), e % 65536]));
    this.rest = new Float32Array(this.edges.length / 2);
    this.X = new Float32Array(np * 3); this.Xp = new Float32Array(np * 3);
    this.N = new Float32Array(np * 3);
    this.on = false;
  }
  // 目当ての形（もとの網の頂点の位置）から、点の位置を拾う
  gather(positions, out) { const f = this.first; for (let p = 0; p < this.np; p++) { const i = f[p] * 3; out[p * 3] = positions[i]; out[p * 3 + 1] = positions[i + 1]; out[p * 3 + 2] = positions[i + 2]; } return out; }
  begin(positions) {
    this.gather(positions, this.X); this.Xp.set(this.X);
    const X = this.X, e = this.edges;
    for (let k = 0; k < this.rest.length; k++) { const a = e[k * 2] * 3, b = e[k * 2 + 1] * 3;
      this.rest[k] = Math.hypot(X[a] - X[b], X[a + 1] - X[b + 1], X[a + 2] - X[b + 2]); }
    this.on = true;
  }
  /* 一こま進める。
     T0・T1：こまの頭と終わりの目当て（点ごと・Float32Array np*3）。pin：留める強さ（0〜1・点ごと）。
     col：{ torso: [{ inv0, mat0, inv1, mat1, sl }], caps0: [[ax,ay,az,bx,by,bz,r]...], caps1, floor(x,z) }  ※0＝こまの頭・1＝終わり
     opt：{ dt, sub, iter, damp, g, fric } */
  step(T0, T1, pin, col, { dt = 1 / 30, sub = 4, iter = 6, damp = 0.985, g = 9.8, fric = 0.75 } = {}) {
    const X = this.X, Xp = this.Xp, np = this.np, e = this.edges, R = this.rest, h = dt / sub;
    const T = new Float32Array(np * 3), caps = col.caps0.map(c => c.slice());
    for (let s = 1; s <= sub; s++) {
      const a = s / sub;
      for (let i = 0; i < np * 3; i++) T[i] = T0[i] + (T1[i] - T0[i]) * a;
      for (let c = 0; c < caps.length; c++) for (let j = 0; j < 7; j++) caps[c][j] = col.caps0[c][j] + (col.caps1[c][j] - col.caps0[c][j]) * a;
      // 積分（重さ）。留められた点は目当てへ
      for (let p = 0; p < np; p++) {
        const i = p * 3, w = pin[p];
        const vx = (X[i] - Xp[i]) * damp, vy = (X[i + 1] - Xp[i + 1]) * damp, vz = (X[i + 2] - Xp[i + 2]) * damp;
        Xp[i] = X[i]; Xp[i + 1] = X[i + 1]; Xp[i + 2] = X[i + 2];
        X[i] += vx; X[i + 1] += vy - g * h * h; X[i + 2] += vz;
        if (w > 0) { X[i] += (T[i] - X[i]) * w; X[i + 1] += (T[i + 1] - X[i + 1]) * w; X[i + 2] += (T[i + 2] - X[i + 2]) * w; }
      }
      for (let it = 0; it < iter; it++) {
        // 長さ（伸びはほとんど許さず、縮みは少しだけ許す＝布はたわむ）
        for (let k = 0; k < R.length; k++) {
          const A = e[k * 2], B = e[k * 2 + 1], ia = A * 3, ib = B * 3;
          const dx = X[ib] - X[ia], dy = X[ib + 1] - X[ia + 1], dz = X[ib + 2] - X[ia + 2];
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-9, r = R[k];
          let diff = (d - r) / d; if (diff < 0) diff *= 0.35;
          // 留めの強い点ほど重い（動きにくい）。両方が留められていれば、ほとんど動かさない
          const wa = 1 - pin[A], wb = 1 - pin[B]; if (wa + wb < 1e-6) continue;
          const ka = diff * wa * 0.5, kb = diff * wb * 0.5;
          X[ia] += dx * ka; X[ia + 1] += dy * ka; X[ia + 2] += dz * ka;
          X[ib] -= dx * kb; X[ib + 1] -= dy * kb; X[ib + 2] -= dz * kb;
        }
        this.collide(col, caps, a, fric, it === iter - 1, pin);
      }
    }
  }
  collide(col, caps, a, fric, last, pin) {
    // 留められた点（pin＝1）は目当ての形のまま（当たりで動かさない）。留めがゆるむほど、当たりが効く
    const X = this.X, Xp = this.Xp, np = this.np, THREE = this.THREE;
    const v = this._v || (this._v = new THREE.Vector3());
    // 胴（体の向きに付いた、高さごとの楕円）。こまの頭と終わりの行列を、近い方で使う（小刻みのあいだの体の動きは小さい）
    for (const tc of col.torso || []) {
      const inv = a < 0.5 ? tc.inv0 : tc.inv1, mat = a < 0.5 ? tc.mat0 : tc.mat1, S = tc.sl;
      for (let p = 0; p < np; p++) {
        const i = p * 3; v.set(X[i], X[i + 1], X[i + 2]).applyMatrix4(inv);
        const k = Math.floor((v.y - S.y0) / S.dy); if (k < 0 || k >= S.n || !(S.ax[k] > 0)) continue;
        const dx = v.x - S.cx[k], dz = v.z - S.cz[k], ax = S.ax[k] + S.m, az = (dz > 0 ? S.azF[k] : S.azB[k]) + S.m;
        const q = (dx / ax) * (dx / ax) + (dz / az) * (dz / az);
        if (q >= 1 || pin[p] >= 0.999) continue;
        const f = 1 + (1 / Math.sqrt(Math.max(q, 1e-6)) - 1) * Math.min(1, (1 - pin[p]) * 3); v.x = S.cx[k] + dx * f; v.z = S.cz[k] + dz * f;
        v.applyMatrix4(mat);
        X[i] = v.x; X[i + 1] = v.y; X[i + 2] = v.z;
        if (last) { Xp[i] += (X[i] - Xp[i]) * fric * 0.5; Xp[i + 2] += (X[i + 2] - Xp[i + 2]) * fric * 0.5; }
      }
    }
    // 腕・脚・手（カプセル）
    for (const c of caps) {
      const [ax, ay, az, bx, by, bz, r] = c, abx = bx - ax, aby = by - ay, abz = bz - az, L2 = abx * abx + aby * aby + abz * abz || 1e-9;
      for (let p = 0; p < np; p++) {
        const i = p * 3, px = X[i] - ax, py = X[i + 1] - ay, pz = X[i + 2] - az;
        let u = (px * abx + py * aby + pz * abz) / L2; u = u < 0 ? 0 : u > 1 ? 1 : u;
        const dx = px - abx * u, dy = py - aby * u, dz = pz - abz * u, d2 = dx * dx + dy * dy + dz * dz;
        if (d2 >= r * r || pin[p] >= 0.999) continue;
        const d = Math.sqrt(d2) || 1e-6, k = (r - d) / d * Math.min(1, (1 - pin[p]) * 3);
        X[i] += dx * k; X[i + 1] += dy * k; X[i + 2] += dz * k;
      }
    }
    // 床（座布団の上・高座の床）。当たったら横すべりを止める（摩擦）
    if (col.floor) for (let p = 0; p < np; p++) {
      const i = p * 3, fy = col.floor(X[i], X[i + 2]) + 0.004;
      if (X[i + 1] < fy) { X[i + 1] = fy; if (last) { Xp[i] += (X[i] - Xp[i]) * fric; Xp[i + 2] += (X[i + 2] - Xp[i + 2]) * fric; Xp[i + 1] = X[i + 1]; } }
    }
  }
  // 網へ書きもどす（位置と、点で計算した面の向き）
  write(posAttr, nrmAttr) {
    const X = this.X, N = this.N, t = this.tris, map = this.map; N.fill(0);
    for (let f = 0; f < t.length; f += 3) {
      const a = t[f] * 3, b = t[f + 1] * 3, c = t[f + 2] * 3;
      const ux = X[b] - X[a], uy = X[b + 1] - X[a + 1], uz = X[b + 2] - X[a + 2], vx = X[c] - X[a], vy = X[c + 1] - X[a + 1], vz = X[c + 2] - X[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const j of [a, b, c]) { N[j] += nx; N[j + 1] += ny; N[j + 2] += nz; }
    }
    for (let p = 0; p < this.np; p++) { const i = p * 3, l = Math.hypot(N[i], N[i + 1], N[i + 2]) || 1; N[i] /= l; N[i + 1] /= l; N[i + 2] /= l; }
    const P = posAttr.array, NN = nrmAttr ? nrmAttr.array : null;
    for (let v = 0; v < this.nv; v++) { const p = map[v] * 3, o = v * 3;
      P[o] = X[p]; P[o + 1] = X[p + 1]; P[o + 2] = X[p + 2];
      if (NN) { NN[o] = N[p]; NN[o + 1] = N[p + 1]; NN[o + 2] = N[p + 2]; } }
    posAttr.needsUpdate = true; if (nrmAttr) nrmAttr.needsUpdate = true;
  }
  snapshot() { return { X: this.X.slice(), Xp: this.Xp.slice() }; }
  restore(s) { this.X.set(s.X); this.Xp.set(s.Xp); }
}

// 胴の断面（高さごとの楕円）を、着物の網の点から測る。frameInv＝世界→体の向き（Matrix4）
// maxF：前の半径の上限（正座の膝・腿は脚のカプセルに任せる。胴の楕円に入れると、落ちた布が膝の上へ押し出される）
export function torsoSlices(THREE, pts, frameInv, { dy = 0.03, margin = 0.012, maxF = 0.15 } = {}) {
  const v = new THREE.Vector3(), L = [];
  for (let i = 0; i < pts.length; i += 3) { v.set(pts[i], pts[i + 1], pts[i + 2]).applyMatrix4(frameInv); L.push([v.x, v.y, v.z]); }
  let y0 = Infinity, y1 = -Infinity; for (const p of L) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  const n = Math.max(1, Math.ceil((y1 - y0) / dy));
  const S = { y0, dy, n, m: margin, cx: new Float32Array(n), cz: new Float32Array(n), ax: new Float32Array(n), azF: new Float32Array(n), azB: new Float32Array(n) };
  const b = [...Array(n)].map(() => []);
  for (const p of L) b[Math.min(n - 1, Math.floor((p[1] - y0) / dy))].push(p);
  for (let k = 0; k < n; k++) {
    const B = b[k].length ? b[k] : (b[k - 1] || b[k + 1] || []); if (!B.length) continue;
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const p of B) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[2]); z1 = Math.max(z1, p[2]); }
    S.cx[k] = (x0 + x1) / 2; S.ax[k] = Math.max(0.03, (x1 - x0) / 2);
    // 前と後ろは別の半径（正座の膝は前へ出るが、背は出ない）。中心は体の骨の線（z＝0）
    S.cz[k] = 0; S.azF[k] = Math.min(maxF, Math.max(0.03, z1)); S.azB[k] = Math.max(0.03, -z0);
  }
  return S;
}
// 高さ y・向き th（0＝前・x＋へ正）での胴の楕円の半径（中心からの距離）
export function sliceRadius(S, y, th) {
  const k = Math.max(0, Math.min(S.n - 1, Math.floor((y - S.y0) / S.dy)));
  const s = Math.sin(th), c = Math.cos(th), az = c > 0 ? S.azF[k] : S.azB[k], ax = S.ax[k];
  return 1 / Math.sqrt((s / ax) * (s / ax) + (c / az) * (c / az));
}
