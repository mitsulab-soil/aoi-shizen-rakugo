/* 碧の「人が動いた記録」（モーションキャプチャ）を読んで、こまを取り出す ── aoi_mocap.js（2026-10-13）
   データ＝aoi_mocap.json（_dev/mocap_convert.py が CMU Graphics Lab Motion Capture Database から作る）。
   出どころと条件：mocap.cs.cmu.edu。商用の製品に含めてよい／データそのものを（変換した形でも）売ってはならない。
   The data used in this project was obtained from mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217.

   中身：骨ごとの「世界の回転の差」（T の字の静止の形からの回転・体の向きを取り除いたもの）。
   ここで、碧の骨の親子に合わせて「親から見た回転」に直す（L＝親の世界の回転⁻¹ × 自分の世界の回転）。 */
import * as THREE from "three";

// 碧の骨の親（記録に入っている骨のあいだで）
const PARENT = { hips: null, spine: "hips", chest: "spine", upperChest: "chest", neck: "upperChest", head: "neck",
  leftShoulder: "upperChest", leftUpperArm: "leftShoulder", leftLowerArm: "leftUpperArm", leftHand: "leftLowerArm",
  rightShoulder: "upperChest", rightUpperArm: "rightShoulder", rightLowerArm: "rightUpperArm", rightHand: "rightLowerArm" };

const b64 = s => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Int16Array(u.buffer); };

export async function loadMocap(url) {
  const j = typeof url === "string" ? await (await fetch(url)).json() : url;
  return decodeMocap(j);
}

export function decodeMocap(j) {
  const bones = j.bones, B = bones.length, idx = Object.fromEntries(bones.map((b, i) => [b, i]));
  const par = bones.map(b => { let p = PARENT[b]; while (p && idx[p] == null) p = PARENT[p]; return p ? idx[p] : -1; });
  const clips = {};
  for (const [k, c] of Object.entries(j.clips)) {
    const qi = b64(c.q), pi = b64(c.p), n = c.n;
    // 世界の回転 → 親から見た回転（ここで一度だけ）
    const W = new Float32Array(n * B * 4), Lq = new Float32Array(n * B * 4), P = new Float32Array(n * 3);
    const q = new THREE.Quaternion(), pq = new THREE.Quaternion();
    for (let f = 0; f < n; f++) {
      for (let b = 0; b < B; b++) { const o = (f * B + b) * 3, x = qi[o] / 32767, y = qi[o + 1] / 32767, z = qi[o + 2] / 32767; const w = Math.sqrt(Math.max(0, 1 - x * x - y * y - z * z)); W.set([x, y, z, w], (f * B + b) * 4); }
      for (let b = 0; b < B; b++) {
        q.fromArray(W, (f * B + b) * 4);
        if (par[b] >= 0) { pq.fromArray(W, (f * B + par[b]) * 4).invert(); q.premultiply(pq); }
        q.normalize().toArray(Lq, (f * B + b) * 4);
      }
      for (let a = 0; a < 3; a++) P[f * 3 + a] = pi[f * 3 + a] / 10000;
    }
    // 隣のこまと符号をそろえる（補間で遠回りしない）
    for (let f = 1; f < n; f++) for (let b = 0; b < B; b++) { const o = (f * B + b) * 4, p = ((f - 1) * B + b) * 4; if (Lq[o] * Lq[p] + Lq[o + 1] * Lq[p + 1] + Lq[o + 2] * Lq[p + 2] + Lq[o + 3] * Lq[p + 3] < 0) for (let a = 0; a < 4; a++) Lq[o + a] = -Lq[o + a]; }
    clips[k] = { ...c, q: Lq, p: P, n, B };
    // 立ち姿は左右に映したものも作る（同じ記録のくり返しに見えないように）。左右の骨を入れかえ、x を反転
    if (c.type === "idle") {
      const Mq = new Float32Array(Lq.length), Mp = new Float32Array(P.length), sw = bones.map(b => idx[b.replace(/^left/, "R#").replace(/^right/, "left").replace(/^R#/, "right")] ?? idx[b]);
      for (let f = 0; f < n; f++) { for (let b = 0; b < B; b++) { const o = (f * B + sw[b]) * 4, d = (f * B + b) * 4; Mq[d] = Lq[o]; Mq[d + 1] = -Lq[o + 1]; Mq[d + 2] = -Lq[o + 2]; Mq[d + 3] = Lq[o + 3]; }
        Mp[f * 3] = -P[f * 3]; Mp[f * 3 + 1] = P[f * 3 + 1]; Mp[f * 3 + 2] = P[f * 3 + 2]; }
      clips[k + "_m"] = { ...c, q: Mq, p: Mp, n, B, mirror: true };
    }
  }
  return { bones, idx, clips };
}

const _a = new THREE.Quaternion(), _b = new THREE.Quaternion();
// u＝0..1（くり返す）。out＝{ 骨の名前: Quaternion }・pos＝Vector3（脚の長さに対する比）
export function sampleClip(lib, clip, u, out, pos) {
  const n = clip.n, B = clip.B, x = ((u % 1) + 1) % 1 * n, f0 = Math.floor(x) % n, f1 = (f0 + 1) % n, w = x - Math.floor(x);
  for (let b = 0; b < B; b++) {
    const name = lib.bones[b], q = out[name] || (out[name] = new THREE.Quaternion());
    _a.fromArray(clip.q, (f0 * B + b) * 4); _b.fromArray(clip.q, (f1 * B + b) * 4); q.slerpQuaternions(_a, _b, w);
  }
  if (pos) { const p = clip.p; pos.set(p[f0 * 3] * (1 - w) + p[f1 * 3] * w, p[f0 * 3 + 1] * (1 - w) + p[f1 * 3 + 1] * w, p[f0 * 3 + 2] * (1 - w) + p[f1 * 3 + 2] * w); }
  return out;
}
