/* 碧のローブの裾を、布のように揺らす ── aoi_robe.js（2026-10-13・v2 2026-10-14・v2.1 同日）
   v2.3（11 人「後ろ姿のローブが一つの塊で振れる」）：鎖ごとに戻る力を少しずつ変える（となりと滑らかにつながる 0.75〜1.25 倍）＝裾が一枚の板でなく波打つ。
   v2.2（11 人「裾が風船のようにふくらむ」）：脚に寄せる量 0.85→0.7・脚の側へ移す幅を少し狭く。
   v2.1（11 人「後ろから見た裾が硬い」）：裾の下の段ほど戻る力を弱め（下 3 段 2〜3 割）、速さが変わるときの慣性を 7 割→7 割 8 分に。
   歩くときのなびきを、進む向きの後ろ側の布ほど大きく（後ろの裾が遅れて揺れる。前の裾は脚に押されるので小さめのまま）。
   v2（11 人「裾が硬い円すいのまま動かず、すべって見える」「裾の割れ目の下端に黒いくさび」）：布の行き先を、脚の芯の前後・左右のずれに合わせて寄せる
   （前へ出た脚は布の前を、後ろへ残った脚は布の後ろを。裾ほど多く）。歩くと裾が少し後ろへなびく。となりの鎖とのずれをならす（とがった張り出しにしない）。
   裾ほど少しやわらかく。前は当たってから押し出すだけで、脚が布の面を突き抜け、黒い靴・足首が裾から刺さったように見えていた。API は同じ。
   困っていたこと：VRoid の書き出しでは、ローブの腰から下が脚の骨（太もも・すね）に直に付いていて、歩くと脚の形のまま
   三角に張り出していた（11 人の第 1〜5 回で 9 人が指摘）。モデルの .vrm はさわらずに、読み込んだあとで、ここで直す。

   しくみ：
   1. ローブ（腰より下で、脚の骨に重みのある布の頂点）を見つけ、腰の周りに縦の鎖を 24 本（各 8 点）立てる。
      鎖の点は、その高さ・その向きのローブの面の上に置く（静止の形を測る）。
   2. ローブの頂点の重みを、脚の骨から鎖の骨へ付けかえる（近い 2 本 × 上下 2 つ＝4 つの骨に分ける）。骨は腰の子として足す。
   3. 毎こま、鎖の点を軽い布として動かす（ベルレ積分）：腰に付いた一番上は動かさず、下ほど自由に。静止の形へ戻る力・
      上下の点の長さ・となりの鎖との間（裾の周りの長さ）を保ち、太もも・すねのカプセルに当たったら外へ押し出す。
      床より下には行かない。あとは鎖の向きから骨の回転を決めるだけ。
   重さ：点 192 個・カプセル 4 本。スマホでも 0.1 ms ほど。 */
import * as THREE from "three";

const _v = [...Array(8)].map(() => new THREE.Vector3()), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _m = new THREE.Matrix4();
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const _hp = new THREE.Vector3(), _hs = new THREE.Vector3(), _hf = new THREE.Vector3(), _hr = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _hq = new THREE.Quaternion(), _hy = new THREE.Quaternion(), _hj = new THREE.Quaternion();

export class AoiRobe {
  constructor(vrm, { chains = 24, levels = 8, wind = .4, match = /tops|onepiece|skirt|coat|bottoms|dress|robe/i } = {}) {
    this._floor = [.074, .064, .074, .064];   // v4：脚の表面＋布の厚み（m・腰の大きさ 1 のとき）。太もも・すね・太もも・すね
    this.vrm = vrm; this.N = chains; this.M = levels; this.wind = wind; this.ok = false; this.t = 0;
    const H = vrm.humanoid, raw = n => H.getRawBoneNode(n);
    this.hips = raw("hips"); if (!this.hips) return;
    const legNames = new Set(["leftUpperLeg", "rightUpperLeg", "leftLowerLeg", "rightLowerLeg"].map(n => raw(n)?.name).filter(Boolean));
    this.legs = [["leftUpperLeg", "leftLowerLeg"], ["leftLowerLeg", "leftFoot"], ["rightUpperLeg", "rightLowerLeg"], ["rightLowerLeg", "rightFoot"]].map(([a, b]) => [raw(a), raw(b)]);
    // 布の頂点を探す（どの面も、腰の子の骨と脚の骨だけで動いている頂点）
    let mesh = null; vrm.scene.traverse(o => { if (!mesh && o.isSkinnedMesh && [].concat(o.material).some(m => match.test(m.name)) && o.skeleton.bones.some(b => legNames.has(b.name))) mesh = o; });
    if (!mesh) {   // 材質の名前が付けかえられているとき：脚の骨に重みのある頂点が、ひざより上に最も多い形（肌・靴・髪・顔は除く）
      let best = 0; vrm.scene.traverse(o => { if (!o.isSkinnedMesh || /skin|shoe|face|hair/i.test([].concat(o.material).map(m => m.name).join())) return;
        const bi = new Set(o.skeleton.bones.map((b, i) => legNames.has(b.name) ? i : -1).filter(i => i >= 0)); if (!bi.size) return;
        const SI = o.geometry.attributes.skinIndex, SW = o.geometry.attributes.skinWeight; if (!SI) return; let c = 0;
        for (let i = 0; i < SI.count; i++) for (let k = 0; k < 4; k++) if (SW.getComponent(i, k) > .3 && bi.has(SI.getComponent(i, k))) { c++; break; }
        if (c > best) { best = c; mesh = o; } });
    }
    if (!mesh) return;
    this.mesh = mesh;
    const sk = mesh.skeleton, bones = sk.bones, hi = bones.indexOf(this.hips); if (hi < 0) return;
    const okBone = new Set(); bones.forEach((b, i) => { if (b === this.hips || legNames.has(b.name) || /skirt/i.test(b.name)) okBone.add(i); });
    const legIdx = new Set(); bones.forEach((b, i) => { if (legNames.has(b.name) || /skirt/i.test(b.name)) legIdx.add(i); });
    const G = mesh.geometry, P = G.attributes.position, SI = G.attributes.skinIndex, SW = G.attributes.skinWeight;
    const toHips = new THREE.Matrix4().multiplyMatrices(sk.boneInverses[hi], mesh.bindMatrix);   // 頂点 → 腰から見た位置
    const vl = new THREE.Vector3(), sel = [];
    let yTop = -1e9, yHem = 1e9, cx = 0, cz = 0;
    for (let i = 0; i < P.count; i++) {
      let okw = 0, legw = 0; for (let k = 0; k < 4; k++) { const w = SW.getComponent(i, k), b = SI.getComponent(i, k); if (okBone.has(b)) okw += w; if (legIdx.has(b)) legw += w; }
      if (okw < .98 || legw < .02) continue;
      vl.fromBufferAttribute(P, i).applyMatrix4(toHips); sel.push([i, vl.x, vl.y, vl.z]); yTop = Math.max(yTop, vl.y); yHem = Math.min(yHem, vl.y);
    }
    if (sel.length < 50) return;
    // 腰の高さまでは布がまっすぐ脚にそって下りているので、少し上（脚の重みが付きはじめる所）から鎖を始める
    // 中心：腰の真下（左右の太ももの付け根の中点）
    {   // 静止の形（重みを付けたときの形）での、左右の太ももの付け根（腰から見た）。いまの姿勢には左右されない
      const at = b => { const k = bones.indexOf(b); return k < 0 ? null : new THREE.Vector3().applyMatrix4(_m.copy(sk.boneInverses[k]).invert()).applyMatrix4(sk.boneInverses[hi]); };
      const hl = at(this.legs[0][0]), hr = at(this.legs[2][0]); if (hl && hr) { cx = (hl.x + hr.x) / 2; cz = (hl.z + hr.z) / 2; }
    }
    const N = this.N, M = this.M, y0 = yTop, y1 = yHem, dy = (y0 - y1) / (M - 1);
    this.yTop = y0; this.yHem = y1;
    // 鎖の点の静止の位置：その向き・その高さのローブの面（外側）の半径
    const rad = [...Array(N)].map(() => Array(M).fill(0)), cnt = [...Array(N)].map(() => Array(M).fill(0)), ang = a => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    for (const [, x, y, z] of sel) {
      const th = ang(Math.atan2(x - cx, z - cz)), a = Math.round(th / (2 * Math.PI) * N) % N, j = Math.round((y0 - y) / dy); if (j < 0 || j >= M) continue;
      const r = Math.hypot(x - cx, z - cz); rad[a][j] = Math.max(rad[a][j], r); cnt[a][j]++;
    }
    for (let a = 0; a < N; a++) for (let j = 0; j < M; j++) if (!cnt[a][j]) { // 抜けは隣から
      let s = 0, c = 0; for (const [da, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const aa = (a + da + N) % N, jj = j + dj; if (jj >= 0 && jj < M && cnt[aa][jj]) { s += rad[aa][jj]; c++; } } rad[a][j] = c ? s / c : .12;
    }
    this.rest = []; for (let a = 0; a < N; a++) { const th = a / N * 2 * Math.PI, row = []; for (let j = 0; j < M; j++) { const r = rad[a][j] * (j === 0 ? .9 : 1); row.push(new THREE.Vector3(cx + Math.sin(th) * r, y0 - dy * j, cz + Math.cos(th) * r)); } this.rest.push(row); }
    // 骨を足す（腰の子・鎖ごとに M-1 本）
    const newBones = [], newInv = [], hipInv = sk.boneInverses[hi];
    this.bones = [];
    for (let a = 0; a < N; a++) { const row = []; let parent = this.hips, prevPos = new THREE.Vector3();
      for (let j = 0; j < M - 1; j++) {
        const b = new THREE.Bone(); b.name = `AoiRobe_${a}_${j}`; const p = this.rest[a][j]; b.position.copy(p).sub(prevPos); parent.add(b); prevPos = p.clone(); parent = b;
        newBones.push(b); newInv.push(new THREE.Matrix4().makeTranslation(-p.x, -p.y, -p.z).multiply(hipInv)); row.push(b); }
      this.bones.push(row); }
    const base = bones.length;
    // 重みの付けかえ
    let SIa = SI; if (base + newBones.length > 255 && !(SI.array instanceof Uint16Array || SI.array instanceof Uint32Array)) { SIa = new THREE.Uint16BufferAttribute(new Uint16Array(SI.array), 4); G.setAttribute("skinIndex", SIa); }
    for (const [i, x, y, z] of sel) {
      const th = ang(Math.atan2(x - cx, z - cz)), af = th / (2 * Math.PI) * N, a0 = Math.floor(af) % N, a1 = (a0 + 1) % N, fa = af - Math.floor(af);
      const s = clamp((y0 - y) / dy, 0, M - 1), c = s - .5; let j0 = clamp(Math.floor(c), 0, M - 2), fs = clamp(c - j0, 0, 1); const j1 = Math.min(j0 + 1, M - 2); if (c < 0) fs = 0;
      const ids = [[a0, j0, (1 - fa) * (1 - fs)], [a0, j1, (1 - fa) * fs], [a1, j0, fa * (1 - fs)], [a1, j1, fa * fs]];
      for (let k = 0; k < 4; k++) { SIa.setComponent(i, k, base + ids[k][0] * (M - 1) + ids[k][1]); SW.setComponent(i, k, ids[k][2]); }
    }
    SIa.needsUpdate = true; SW.needsUpdate = true;
    const skel = new THREE.Skeleton([...bones, ...newBones], [...sk.boneInverses, ...newInv]);
    // 同じ形（geometry）を使う写し（HP のホログラムの重ねなど）も、新しい骨組みに付けかえる（重みの番号が増えたため）
    vrm.scene.traverse(o => { if (o.isSkinnedMesh && o.geometry === G) o.bind(skel, o.bindMatrix); });
    // 点（世界の座標）
    this.p = this.rest.map(r => r.map(() => new THREE.Vector3())); this.pp = this.rest.map(r => r.map(() => new THREE.Vector3())); this.tg = this.rest.map(r => r.map(() => new THREE.Vector3()));
    const V = () => this.rest.map(r => r.map(() => new THREE.Vector3())); this.t0 = V(); this.dT = V(); this._tb = V();   // pp＝前のこまの「静止の位置からのずれ」
    this.len = this.rest.map(r => r.slice(1).map((p, j) => p.distanceTo(r[j])));
    this.ring = this.rest.map((r, a) => r.map((p, j) => p.distanceTo(this.rest[(a + 1) % N][j])));
    // v2（2026-10-14 11 人「裾が硬い円すいのまま動かず、すべって見える」「裾の割れ目の下端に黒いくさび」）：脚の芯の線の静止の位置（腰から見た・鎖の点と同じ座標）。
    // 鎖の段ごとに、その高さの脚の芯の点（太もも→ひざ→足首の折れ線の上の位置）を覚えておく。毎こま、いまの脚の同じ点との差（脚が前後・左右へ出たぶん）だけ、
    // 布の行き先を脚のほうへ寄せる（前へ出た脚は布の前を押し、後ろへ残った脚は布の後ろを引く）。当たってから押し出すだけだと、布は円すいのまま動かず、
    // 脚が布の面を突き抜けて黒い靴・足首が裾から刺さったように見えていた（氷川道中は当たりの半径を 6 割にしている）。
    { const restOf = b => { const k = bones.indexOf(b); return k < 0 ? null : new THREE.Vector3().applyMatrix4(_m.copy(sk.boneInverses[k]).invert()).applyMatrix4(sk.boneInverses[hi]); };
      this.legAx = [[raw("leftUpperLeg"), raw("leftLowerLeg"), raw("leftFoot")], [raw("rightUpperLeg"), raw("rightLowerLeg"), raw("rightFoot")]].map(js => {
        const rp = js.map(restOf); if (rp.some(p => !p) || js.some(b => !b)) return null;
        const at = []; for (let j = 0; j < M; j++) { const y = y0 - dy * j; let seg = 0, t = 0;
          if (y >= rp[0].y) { seg = 0; t = 0; } else if (y >= rp[1].y) { seg = 0; t = (rp[0].y - y) / ((rp[0].y - rp[1].y) || 1); } else { seg = 1; t = clamp((rp[1].y - y) / ((rp[1].y - rp[2].y) || 1), 0, 1); }
          at.push([seg, t, new THREE.Vector3().lerpVectors(rp[seg], rp[seg + 1], t)]); }
        return { js, rp, at, side: rp[0].x >= cx ? 1 : -1 }; }).filter(Boolean);
      this._legNow = this.legAx.map(() => [...Array(M)].map(() => new THREE.Vector3()));
      this.legFollow = .7;   // v2.2：0.85→0.7（ふくらみを抑える）   // 脚のずれを、布の行き先にどれだけ移すか（裾で最大）
    }
    this._hv = new THREE.Vector3(); this._hpPrev = null;   // 腰の水平の速さ（歩くとき、裾が少し後ろへなびく）
    this.ok = true; this.count = sel.length; this.reset();
    // 静止の形で、布の点と脚の芯との距離を測っておく（静止で脚に近い所は、その距離までしか押し出さない＝立っているだけでふくらまない）
    this._capsNow(); this.rr = this.p.map(row => row.map(p => this._caps.map(([A, B]) => { const ab = _v[2].subVectors(B, A), t = clamp(_v[3].subVectors(p, A).dot(ab) / (ab.lengthSq() || 1e-9), 0, 1); return _v[4].copy(A).addScaledVector(ab, t).distanceTo(p) / (this.hips.getWorldScale(_v[5]).x || 1); })));   // 腰の大きさで割って持つ
  }
  // 骨の静止の位置（腰から見た）→ 世界
  // 布は重さで下がるので、腰が前後・左右に傾いても裾までは傾かない。上の輪は腰の向きそのまま、下ほど「腰の水平の向き（鉛直）」に寄せる
  _targets() {
    const Hw = this.hips.matrixWorld, hp = _hp.setFromMatrixPosition(Hw), hq = this.hips.getWorldQuaternion(_hq), sc = _hs.setFromMatrixScale(Hw).x;
    const f = _hf.set(0, 0, 1).applyQuaternion(hq); _hy.setFromAxisAngle(_up, Math.atan2(f.x, f.z));
    this._out ||= [...Array(this.N)].map(() => new THREE.Vector3());   // 鎖ごとの外向き（水平・世界）
    for (let a = 0; a < this.N; a++) { const th = a / this.N * 2 * Math.PI; this._out[a].set(Math.sin(th), 0, Math.cos(th)).applyQuaternion(_hy); }
    for (let j = 0; j < this.M; j++) { const w = 1 - .8 * j / (this.M - 1); _hj.copy(_hy).slerp(hq, w);
      for (let a = 0; a < this.N; a++) this.tg[a][j].copy(this.rest[a][j]).sub(this.rest[a][0]).multiplyScalar(sc).applyQuaternion(_hj).add(_hr.copy(this.rest[a][0]).applyMatrix4(Hw)); }
    // v2：脚に合わせて布の行き先を寄せる（上の legAx の説明）。その高さの脚の芯が、静止の位置からどれだけ水平に出たか（D）を、
    // 脚の側の布ほど・脚が向かう側の布ほど多く移す。裾ほど多く、腰の近くは動かさない。歩くときは裾が少し後ろへなびく（空気）
    if (this.legAx?.length && this.legFollow > 0) {
      const N = this.N, M = this.M, lim = .32 * sc, hv = this._hv, D = _v[6], dn = _v[7];
      this.legAx.forEach((L, li) => { const c = L.js.map((b, i) => b.getWorldPosition((this._lw ||= [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector3()))[li * 3 + i]));
        for (let j = 1; j < M; j++) { const [seg, t, rp] = L.at[j], o = this._legNow[li][j];
          o.lerpVectors(c[seg], c[seg + 1], t).sub(_hr.copy(rp).applyMatrix4(Hw)); o.y = 0; const l = o.length(); if (l > lim) o.multiplyScalar(lim / l); } });
      const hvl = hv ? Math.hypot(hv.x, hv.z) : 0;
      for (let j = 1; j < M; j++) { const f = j / (M - 1), gj = this.legFollow * f * f * (3 - 2 * f), tr = .075 * Math.pow(f, 1.5);
        for (let a = 0; a < N; a++) { const s = Math.sin(a / N * 2 * Math.PI), out = this._out[a], T = this.tg[a][j];
          this.legAx.forEach((L, li) => { D.copy(this._legNow[li][j]); const l = D.length(); if (l < 1e-5) return;
            const sideW = clamp(.5 + .95 * L.side * s, 0, 1), dd = out.dot(dn.copy(D).multiplyScalar(1 / l)), push = clamp((dd + .25) / .85, 0, 1);
            T.addScaledVector(D, gj * sideW * (.22 + .78 * push * push * (3 - 2 * push))); });
          if (hv) T.addScaledVector(hv, -tr * (1 + (hvl > .05 ? .6 * clamp(-out.dot(hv) / hvl, 0, 1) : 0))); } }   // v2.1：進む向きの後ろ側の布ほど、遅れてなびく
    }
  }
  reset() { if (!this.ok) return; this.hips.updateWorldMatrix(true, false); this._hv?.set(0, 0, 0); this._hpPrev = null; this._targets(); for (let a = 0; a < this.N; a++) for (let j = 0; j < this.M; j++) { this.p[a][j].copy(this.tg[a][j]); this.pp[a][j].set(0, 0, 0); this.dT[a][j].set(0, 0, 0); this.t0[a][j].copy(this.tg[a][j]); } this._pose(); }
  // vrm.update(dt) のあとに呼ぶ（生の骨の位置が決まってから）。groundY＝床の高さ（世界）
  update(dt, { groundY = null, live = true } = {}) {
    if (!this.ok) return; dt = Math.min(dt, .05); if (dt <= 0) return; this.t += dt;
    const N = this.N, M = this.M;
    this._kv ||= [...Array(N)].map((_, a) => 1 + .25 * Math.sin(a * 2.1 + 1.3) * Math.cos(a * .9));   // v2.3：鎖ごとの戻る力（滑らかに変わる）
    // 前のこまの静止の位置（この区間で、腰がどれだけ動いたか）
    for (let a = 0; a < N; a++) for (let j = 0; j < M; j++) this.t0[a][j].copy(this.tg[a][j]);
    this.hips.updateWorldMatrix(true, false);
    { const hp = _v[0].setFromMatrixPosition(this.hips.matrixWorld);   // v2：腰の水平の速さ（なめらかに）。とんだとき（1 こまで 0.5 m 超）は数えない
      if (this._hpPrev) { const vx = (hp.x - this._hpPrev.x) / dt, vz = (hp.z - this._hpPrev.z) / dt, ok = Math.hypot(vx, vz) * dt < .5, a = 1 - Math.exp(-6 * dt);
        if (ok) { this._hv.x += (vx - this._hv.x) * a; this._hv.z += (vz - this._hv.z) * a; } else this._hv.set(0, 0, 0); }
      (this._hpPrev ||= new THREE.Vector3()).copy(hp); this._hv.y = 0; const m = this._hv.length(), mx = 2.2 * (this.hips.getWorldScale(_v[1]).x || 1); if (m > mx) this._hv.multiplyScalar(mx / m); }
    this._targets();
    const sc = this.hips.getWorldScale(_v[0]).x || 1;
    if (!live) { this.reset(); return; }
    // 脚のカプセル（太もも・すねの太さに布の厚み）
    this._caps ||= this.legs.map(() => [new THREE.Vector3(), new THREE.Vector3(), 0]);
    const caps = this._capsNow();
    const n = dt > 1 / 50 ? 2 : 1, h = dt / n;
    // 布は「腰といっしょに動く」のが基本。速さが変わるとき（歩き出し・止まる・向きを変える）だけ、遅れて揺れる（慣性の 6 割）
    // v2：裾ほど少しやわらかく（脚に寄せた行き先へ遅れてついていき、歩みごとに揺れる）。慣性 6 割 → 7 割
    const K = [1, .17, .1, .066, .047, .036, .03, .026], damp = Math.exp(-2.6 * h), inert = .78, g = -.8 * sc * h * h;   // v2.1：裾ほどさらにやわらかく・慣性 7 割 8 分
    const wx = this.wind * .25 * sc * h * h * Math.sin(this.t * .7), wz = this.wind * .2 * sc * h * h * Math.sin(this.t * .43 + 1);
    const T = _v[0], o = _v[1];
    for (let s = 0; s < n; s++) {
      const f1 = (s + 1) / n, f0 = s / n;
      for (let a = 0; a < N; a++) for (let j = 0; j < M; j++) {
        const Tn = T.lerpVectors(this.t0[a][j], this.tg[a][j], f1), Tb = _v[2].lerpVectors(this.t0[a][j], this.tg[a][j], f0), p = this.p[a][j];
        if (j === 0) { p.copy(Tn); continue; }
        const dTv = _v[3].subVectors(Tn, Tb), acc = _v[4].subVectors(dTv, this.dT[a][j]); this.dT[a][j].copy(dTv);
        o.subVectors(p, Tb); const op = this.pp[a][j], f = j / (M - 1);   // 静止の位置からのずれ（前のずれ＝op）
        const vx = (o.x - op.x) * damp, vy = (o.y - op.y) * damp, vz = (o.z - op.z) * damp; op.copy(o);
        o.x += vx - acc.x * inert + wx * f; o.y += vy - acc.y * inert + g; o.z += vz - acc.z * inert + wz * f;
        o.multiplyScalar(1 - Math.min(.9, K[Math.min(j, K.length - 1)] * (j > 2 ? this._kv[a] : 1)));
        p.addVectors(Tn, o); this._tb[a][j].copy(Tn);
      }
      for (let it = 0; it < 3; it++) {
        // 上下の長さ
        for (let a = 0; a < N; a++) { const P = this.p[a]; for (let j = 1; j < M; j++) { const d = _v[1].subVectors(P[j], P[j - 1]), L = d.length() || 1e-6, r = this.len[a][j - 1] * sc; if (j === 1) P[j].copy(P[j - 1]).addScaledVector(d, r / L); else { const k = (L - r) / L * .5; P[j].addScaledVector(d, -k); P[j - 1].addScaledVector(d, k); } } }
        // となりの鎖との間（伸びすぎ・縮みすぎだけ直す）
        for (let j = 1; j < M; j++) for (let a = 0; a < N; a++) { const p = this.p[a][j], q = this.p[(a + 1) % N][j], d = _v[1].subVectors(q, p), L = d.length() || 1e-6, r = this.ring[a][j] * sc, lo = r * .75, hi = r * 1.12;
          if (L > hi || L < lo) { const k = (L - (L > hi ? hi : lo)) / L * .5; p.addScaledVector(d, k); q.addScaledVector(d, -k); } }
        // 脚に当たる：鎖の一区間とカプセルの、いちばん近い点どうし
        // まず点ごとに：脚の「内側」へ入りこんだ点は、その鎖の外向きの側へ出す（速く振った脚を、布がすり抜けないように）
        // v4：押し出す半径は「静止のときの距離」までに抑えるが、脚の表面（太もも 6.5 cm・すね 5 cm）＋布の厚みより内へは入れない（裾から脚が透けて出ない）
        const rr = this.rr, sc2 = sc * .97, fl = this._floor;
        for (let a = 0; a < N; a++) { const P = this.p[a], out = this._out[a]; for (let j = 1; j < M; j++) caps.forEach(([A, B, r], c) => this._side(P[j], out, A, B, Math.min(r, Math.max(rr[a][j][c] * sc2, fl[c] * sc)))); }
        for (let a = 0; a < N; a++) { const P = this.p[a]; for (let j = 1; j < M; j++) caps.forEach(([A, B, r], c) => this._push(P[j - 1], P[j], j - 1 === 0, A, B, Math.min(r, Math.max(Math.max(rr[a][j - 1][c], rr[a][j][c]) * sc2, fl[c] * sc)))); }
        // v4：となりの鎖とのあいだ（布は鎖のあいだを直線でつなぐ）も、脚の表面より内へ入れない。あいだの点が脚に入ったら、両どなりの点を外へ押す
        for (let j = 1; j < M; j++) for (let a = 0; a < N; a++) { const p = this.p[a][j], q = this.p[(a + 1) % N][j], m = _v[0].addVectors(p, q).multiplyScalar(.5);
          for (let c = 0; c < caps.length; c++) { const [A, B] = caps[c], r = fl[c] * sc, ab = _v[2].subVectors(B, A), t = clamp(_v[3].subVectors(m, A).dot(ab) / (ab.lengthSq() || 1e-9), 0, 1), d = _v[4].subVectors(m, _v[5].copy(A).addScaledVector(ab, t)), dist = d.length();
            if (dist >= r) continue; if (dist < 1e-6) d.copy(this._out[a]); else d.multiplyScalar(1 / dist); const k = r - dist; p.addScaledVector(d, k); q.addScaledVector(d, k); m.addScaledVector(d, k); } }
        // 床
        if (groundY != null) for (let a = 0; a < N; a++) { const p = this.p[a][M - 1]; if (p.y < groundY + .01 * sc) p.y = groundY + .01 * sc; }
      }
      // v2：となりの鎖とのずれをならす（一本の鎖だけが脚に押されて、とがった三角の張り出し＝テントにならない。布は面でつながっている）
      { const sm = this._sm ||= [...Array(N)].map(() => new THREE.Vector3());
        for (let j = 2; j < M; j++) { for (let a = 0; a < N; a++) sm[a].subVectors(this.p[a][j], this._tb[a][j]);
          for (let a = 0; a < N; a++) { const l = sm[(a + N - 1) % N], r = sm[(a + 1) % N], c = sm[a];
            this.p[a][j].x += ((l.x + r.x) * .5 - c.x) * .22; this.p[a][j].z += ((l.z + r.z) * .5 - c.z) * .22; } } }
      // 直したぶんは、ずれの速さに入れすぎない（当たって跳ね返らないよう半分だけ）
      for (let a = 0; a < N; a++) for (let j = 1; j < M; j++) { const cur = _v[5].subVectors(this.p[a][j], this._tb[a][j]); this.pp[a][j].lerp(cur, .5); }
    }
    this._pose();
  }
  _side(p, out, A, B, r) {
    const ab = _v[2].subVectors(B, A), t = clamp(_v[3].subVectors(p, A).dot(ab) / (ab.lengthSq() || 1e-9), 0, 1), c = _v[4].copy(A).addScaledVector(ab, t), d = _v[5].subVectors(p, c);
    const dist = d.length(); if (dist >= r) return;
    // 外向き（軸に直交させる）
    const o = _v[6].copy(out); const al = ab.lengthSq() > 1e-9 ? o.dot(ab) / ab.lengthSq() : 0; o.addScaledVector(ab, -al); if (o.lengthSq() < 1e-9) return; o.normalize();
    const side = d.dot(o);
    if (side < 0) { // 内側にいる：外向きの側の、表面の上へ（横のずれは残す）
      d.addScaledVector(o, -side); const lat = Math.min(d.length(), r * .9); if (d.lengthSq() > 1e-12) d.setLength(lat);
      p.copy(c).add(d).addScaledVector(o, Math.sqrt(Math.max(0, r * r - lat * lat)));
    }
  }
  _capsNow() {   // 脚のカプセル（太もも 9.5 cm・すね 7 cm＝脚の太さに布の厚み。太ももは付け根の 1 割下から）
    const sc = this.hips.getWorldScale(_v[0]).x || 1;
    this._caps ||= this.legs.map(() => [new THREE.Vector3(), new THREE.Vector3(), 0]);
    this.legs.forEach(([a, b], i) => { const c = this._caps[i]; a.getWorldPosition(c[0]); b.getWorldPosition(c[1]); c[2] = (i % 2 === 0 ? .095 : .07) * sc; if (i % 2 === 0) c[0].lerp(c[1], .1); });
    return this._caps;
  }
  _push(p0, p1, pin0, A, B, r) {
    // 二つの線分（p0–p1 と A–B）のいちばん近い点
    const d1 = _v[2].subVectors(p1, p0), d2 = _v[3].subVectors(B, A), rr = _v[4].subVectors(p0, A);
    const a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(rr), c = d1.dot(rr), b = d1.dot(d2), den = a * e - b * b;
    let s = den > 1e-9 ? clamp((b * f - c * e) / den, 0, 1) : 0, t = (b * s + f) / (e || 1e-9);
    if (t < 0) { t = 0; s = clamp(-c / (a || 1e-9), 0, 1); } else if (t > 1) { t = 1; s = clamp((b - c) / (a || 1e-9), 0, 1); }
    const c1 = _v[5].copy(p0).addScaledVector(d1, s), c2 = _v[6].copy(A).addScaledVector(d2, t), nrm = _v[7].subVectors(c1, c2), dist = nrm.length();
    if (dist >= r || dist < 1e-6) return;
    nrm.multiplyScalar((r - dist) / dist);
    if (pin0) p1.addScaledVector(nrm, 1 / Math.max(s, .25));
    else { const w0 = 1 - s, w1 = s, k = 1 / (w0 * w0 + w1 * w1); p0.addScaledVector(nrm, w0 * k); p1.addScaledVector(nrm, w1 * k); }
  }
  // 鎖の点の並びから、骨の向きを決める
  _pose() {
    const hq = this.hips.getWorldQuaternion(_q2); this._wq ||= [...Array(this.M)].map(() => new THREE.Quaternion());
    for (let a = 0; a < this.N; a++) { let pq = hq; const P = this.p[a], T = this.tg[a];
      for (let j = 0; j < this.M - 1; j++) {
        const b = this.bones[a][j], d0 = _v[0].subVectors(this.rest[a][j + 1], this.rest[a][j]).applyQuaternion(hq).normalize(), d1 = _v[1].subVectors(P[j + 1], P[j]).normalize();   // 骨の静止の向き（腰の回転のまま）→ いまの向き
        const wq = this._wq[j].setFromUnitVectors(d0, d1).multiply(hq);   // 世界での向き
        b.quaternion.copy(pq).invert().multiply(wq); pq = wq; }
    }
    this.hips.updateMatrixWorld(true);
  }
}

/* 2026-10-13 足しもの（氷川道中の 11 人「歩くと裾の割れ目から脚の肌が見える・脚が布を突き抜ける」）：
   足首まであるローブの下の、ふだん見えない脚の肌（太もも〜すねの上 65％）を、読み込んだあとで畳む（.vrm は書きかえない）。
   VRoid の「服の下の体を透明に」と同じ考え。足首と靴は残す。呼んだページだけ変わる（呼ばなければ何も変わらない）。
   使い方：import { hideCoveredLegs } from "./aoi_robe.js"; hideCoveredLegs(vrm)  → 畳んだ頂点の数 */
export function hideCoveredLegs(vrm, { keep = .35, match = /skin|body/i, skip = /face|hair|eye|cloth|tops|onepiece|skirt|shoe/i } = {}) {
  const H = vrm?.humanoid; if (!H) return 0; const raw = n => H.getRawBoneNode(n);
  const hips = raw("hips"), feet = [raw("leftFoot"), raw("rightFoot")], legs = new Set(["leftUpperLeg", "rightUpperLeg", "leftLowerLeg", "rightLowerLeg"].map(n => raw(n)).filter(Boolean));
  if (!hips || !feet[0] || !legs.size) return 0;
  if (vrm.__aoiLegHid != null) return vrm.__aoiLegHid;   // v2.1：二度めは何もしない（AoiMotion が先に畳み、アプリがもう一度呼んでも同じ）
  let n = 0; const v = new THREE.Vector3(), m = new THREE.Matrix4();
  vrm.scene.traverse(o => {
    if (!o.isSkinnedMesh) return; const names = [].concat(o.material).map(x => x?.name ?? "").join(" ");
    if (!match.test(names) || skip.test(names)) return;
    const sk = o.skeleton, bi = new Set(sk.bones.map((b, i) => legs.has(b) ? i : -1).filter(i => i >= 0)), hi = sk.bones.indexOf(hips); if (!bi.size || hi < 0) return;
    const at = b => { const k = sk.bones.indexOf(b); return k < 0 ? null : new THREE.Vector3().applyMatrix4(m.copy(sk.boneInverses[k]).invert()); };   // 骨の静止の位置（形の座標）
    const hp = at(hips), fy = Math.max(...feet.map(at).filter(Boolean).map(p => p.y)); if (!hp || !isFinite(fy)) return;
    const yCut = fy + (hp.y - fy) * keep, G = o.geometry, P = G.attributes.position, SI = G.attributes.skinIndex, SW = G.attributes.skinWeight; if (!SI) return;
    const toModel = o.bindMatrix, toGeo = m.clone().copy(toModel).invert(); let c = 0;
    // v2（2026-10-14 本人「碧の歩き方がおかしい」・11 人の P1「裾の割れ目から肌色の細い棒が縦に見える」）：
    // 前は畳む頂点を腰の芯の一点へ集めていたので、残した足首の輪と腰の芯をつなぐ三角形が、腰から足首まで細長い棒になって裾の割れ目から見えていた。
    // いまは、その高さの脚の芯の線（股関節→膝→足首）へ横だけ寄せる（太さ 0 の線にする）。三角形は面積 0 になって見えず、残す輪との境目も一段ぶんの小さなくさびで済む。
    const side = {}; for (const sd of ["left", "right"]) { const u = at(raw(sd + "UpperLeg")), l = at(raw(sd + "LowerLeg")), f = at(raw(sd + "Foot")); if (u && l && f) side[sd] = { u, l, f, b: new Set([raw(sd + "UpperLeg"), raw(sd + "LowerLeg")].map(b => sk.bones.indexOf(b))) }; }
    const axis = (S, y, out) => { const [a, b] = y >= S.l.y ? [S.u, S.l] : [S.l, S.f], t = Math.max(0, Math.min(1, (y - b.y) / ((a.y - b.y) || 1))); return out.set(b.x + (a.x - b.x) * t, y, b.z + (a.z - b.z) * t); };
    const ax = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) {
      let lw = 0, wl = 0, wr = 0; for (let k = 0; k < 4; k++) { const j = SI.getComponent(i, k), w = SW.getComponent(i, k); if (bi.has(j)) lw += w; if (side.left?.b.has(j)) wl += w; if (side.right?.b.has(j)) wr += w; }
      if (lw < .5) continue; v.fromBufferAttribute(P, i).applyMatrix4(toModel); if (v.y < yCut) continue;
      const S2 = side[wl >= wr ? "left" : "right"];
      if (S2) { axis(S2, v.y, ax).applyMatrix4(toGeo); P.setXYZ(i, ax.x, ax.y, ax.z); }   // 脚の芯の線へ（重みはそのまま＝脚と一緒に動く）
      else { const q = hp.clone().applyMatrix4(toGeo); P.setXYZ(i, q.x, q.y, q.z); SI.setXYZW(i, hi, hi, hi, hi); SW.setXYZW(i, 1, 0, 0, 0); }
      c++;
    }
    if (c) { P.needsUpdate = true; SI.needsUpdate = true; SW.needsUpdate = true; G.computeBoundingSphere(); n += c; }
  });
  vrm.__aoiLegHid = n; return n;
}
