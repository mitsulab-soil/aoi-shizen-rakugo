
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildHall, buildQualia } from './hall.js';
import { ENM, QL } from './enmoku.js';

// ============================================================================================
// （ここから下は動画の高座 stage.html から写した碧の時間の関数。会場の部分は hall.js へ移した）
// 台本・声・字幕・時間割・碧の動きは第 4 版と同じ（時間の関数はそのまま写した）。
// 素材はすべて Poly Haven の CC0（_dev/素材_CC0.md）。取り直しは _dev/fetch_cc0.py。
// ============================================================================================
// ============================================================================================
// Qualia/rakugo ── 3D の寄席（2026-10-26 本人「落語の動画ではなく、落語の寄席のような感じで、3D ソフトにしてください。」）
// 動画の書き出しに使っている高座（_dev/高座/stage.html）の碧の所作・表情・声・字幕の時間の関数をそのまま写し、
// 実時間（声の再生位置）で描く。会場は hall.js（木戸・客席・高座）。カメラは客席の自分の目（寄って観る／席から観る）。
// 公開の作り＝_dev/寄席3D/README.md
// ============================================================================================
const q = new URLSearchParams(location.search);
let MODE = innerHeight > innerWidth ? 'v' : 'h';
document.body.classList.add(MODE);
window.__ready = false; window.__errs = window.__errs || [];
addEventListener('error', e => __errs.push(String(e.message) + ' @ ' + String(e.error && e.error.stack || '').split('\n').slice(0, 3).join(' | ')));
addEventListener('unhandledrejection', e => __errs.push(String(e.reason)));
const UI = window.__UI;   // index.html の画面（木戸・席・字幕まわり）
const BASE = 'yose/';
const MOBILE = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 600;
const LITE = q.get('lite') ? q.get('lite') === '1' : MOBILE;
// 碧の VRM は先に読みはじめる（木戸を見ているあいだに届く）
const vrmBuf = fetch(BASE + 'aoi/aoi_kouza.vrm').then(r => { if (!r.ok) throw new Error('vrm ' + r.status); return r.arrayBuffer(); });
let W = innerWidth, H = innerHeight;
const DPR = Math.min(devicePixelRatio || 1, LITE ? 1.75 : 1.5);   // スマホの髪先のざらつきを抑える
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(DPR); renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = Number(q.get('exp') ?? 1.2);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 90);
const maxAniso = renderer.capabilities.getMaxAnisotropy();
window.__THREE = THREE; window.__camera = camera;
// ---- 決まった擬似乱数（何度描いても同じ絵）
function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

const VENUE = 'yose';
const KOZA_Y = 0.45;            // 高座の高さ（座布団の下の台）
const ZB_H = 0.11;              // 座布団の厚み
const reflectors = [];
let tenugui = null;
await document.fonts.load('400 40px PottaOne').catch(() => {});
const HL = await buildHall({ THREE, scene, renderer, KOZA_Y, rnd, ENM, BASE, lite: LITE, RoomEnvironment: { RoomEnvironment } });
const { particles, audience, lanternMats, flickerLights } = HL;
HL.mekuri.set('碧');
// 見台・膝隠しは上方の道具。既定は江戸の高座（置かない）。?kendai=1／この寄席の欄の切りかえで上方の高座
HL.setKamigata = on => HL.kendai.forEach(o => o.visible = on);
HL.setKamigata(q.get('kendai') === '1');
window.__HL = HL;
// ---- 木戸から席まで（碧と噺が届くまでは、建物だけを描いて動かす）
let AUD_SEAT = null;
const CAM = window.__CAM = createCamera();
let fullRender = null;
(function early(now) {
  if (fullRender) return;
  CAM.update(now / 1000, null);
  HL.particles.material.uniforms.uT.value = now / 1000;
  renderer.render(scene, camera);
  requestAnimationFrame(early);
})(performance.now());
window.__hallReady = true; UI.hallReady(HL);
// 碧と仕上げの部品は、木戸が動きだしてから読む（起動を軽く）
const [{ GLTFLoader }, { EffectComposer }, { RenderPass }, { BokehPass }, { UnrealBloomPass }, { ShaderPass }, { OutputPass }, { MeshoptDecoder }, { VRMLoaderPlugin, VRMUtils }, RK, HC] = await Promise.all([import('three/addons/loaders/GLTFLoader.js'), import('three/addons/postprocessing/EffectComposer.js'), import('three/addons/postprocessing/RenderPass.js'), import('three/addons/postprocessing/BokehPass.js'), import('three/addons/postprocessing/UnrealBloomPass.js'), import('three/addons/postprocessing/ShaderPass.js'), import('three/addons/postprocessing/OutputPass.js'), import('three/addons/libs/meshopt_decoder.module.js'), import('@pixiv/three-vrm'), import('./yose/kit/rakugo.js'), import('./yose/kit/haori_cloth.js')]);
// 演目が決まるまで待つ（木戸のまねき・番組のめくり・?e=）
const SLUG = await UI.chosen;
const ENMO = ENM.find(e => e.slug === SLUG) || ENM[0];
const EBASE = `${BASE}enmoku/${ENMO.slug}/`;
const TL = await (await fetch(EBASE + 'timeline.json')).json();
const EN = false;
const TL_URL = EBASE + 'timeline.json';
// 座布団（深い藍紫・角を丸く）
{
  const shape = new THREE.Shape(); const w = 0.33, d = 0.36, r = 0.09;
  shape.moveTo(-w + r, -d); shape.lineTo(w - r, -d); shape.quadraticCurveTo(w, -d, w, -d + r);
  shape.lineTo(w, d - r); shape.quadraticCurveTo(w, d, w - r, d); shape.lineTo(-w + r, d);
  shape.quadraticCurveTo(-w, d, -w, d - r); shape.lineTo(-w, -d + r); shape.quadraticCurveTo(-w, -d, -w + r, -d);
  const g = new THREE.ExtrudeGeometry(shape, { depth: ZB_H * 0.55, bevelEnabled: true, bevelThickness: ZB_H * 0.22, bevelSize: 0.05, bevelSegments: 6, curveSegments: 12 });
  g.rotateX(-Math.PI / 2);
  const m = new THREE.MeshPhysicalMaterial({ color: 0x2e2440, roughness: 0.9, sheen: 1.0, sheenColor: new THREE.Color(0x6a5a8a), sheenRoughness: 0.6 });
  if (VENUE === 'yose') { m.color.set(0x5a2230); m.sheenColor.set(0x9a5060); }
  const zb = new THREE.Mesh(g, m); zb.position.set(0, KOZA_Y + ZB_H * 0.22, 0.0); zb.castShadow = true; zb.receiveShadow = true; scene.add(zb);
}
// 手ぬぐい（たたんで高座の上・座布団の前の左に置く）
{
  const c = document.createElement('canvas'); c.width = 256; c.height = 96; const g = c.getContext('2d');
  g.fillStyle = '#e9e4d6'; g.fillRect(0, 0, 256, 96);
  g.fillStyle = '#2b4a6b'; for (const y of [14, 70]) g.fillRect(0, y, 256, 10);
  g.fillStyle = 'rgba(43,74,107,.55)'; for (let x = 10; x < 256; x += 22) { g.beginPath(); g.arc(x, 48, 5, 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const tn = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.014, 0.08), new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.18 }));
  tn.position.set(-0.40, KOZA_Y + 0.007, 0.46); tn.rotation.y = 0.12; tn.castShadow = true; tn.receiveShadow = true; scene.add(tn); tenugui = tn;
}

// ============================================================================================
// 碧（第 4 版と同じ。MToon のまま）
// ============================================================================================
const NOSPRING = q.get('spring') !== '1';   // 髪のばねは既定で切る（正座に下げると毛先が跳ねるため。2026-10-02 確かめ）
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder); loader.register(p => new VRMLoaderPlugin(p));
const gltf = await loader.parseAsync(await vrmBuf, BASE + 'aoi/');
const vrm = gltf.userData.vrm;
VRMUtils.removeUnnecessaryVertices(gltf.scene); VRMUtils.combineSkeletons(gltf.scene); VRMUtils.rotateVRM0(vrm);
// 夜の会場なので、衣・髪の自発光（昼の場面に合わせた明るさ）を弱める。トゥーンの塗り分けはそのまま
// 2026-10-04 夜 本人「碧が少し透明感がありすぎる…もう少し自然な感じに」：自発光をさらに弱め（寄席では 0.12 倍）、縁の光（rim）も 0.35 倍に
const EMI = Number(q.get('emi') ?? (VENUE === 'mori' ? 0.3 : 0.12)), RIMK = Number(q.get('rimk') ?? (VENUE === 'mori' ? 1 : 0.35));
const haoriMats = [], haoriMeshes = [];
vrm.scene.traverse(o => { o.frustumCulled = false; if (o.isMesh) { o.castShadow = true; o.receiveShadow = true;
  for (const mt of [].concat(o.material)) { if (!mt) continue;
    if (mt.emissive) mt.emissive.multiplyScalar(EMI);
    if (mt.parametricRimColorFactor) mt.parametricRimColorFactor.multiplyScalar(RIMK);
    if (/Haori/i.test(mt.name || '')) { haoriMats.push(mt); mt.userData.op0 = mt.opacity ?? 1; if (!haoriMeshes.includes(o)) haoriMeshes.push(o); }
  } } });
// 髪先の切り抜き（alphaTest）の縁を、MSAA の覆いでなめらかに（スマホの寄りで点状のざらつきが出たため）
vrm.scene.traverse(o => { if (o.isMesh) for (const mt of [].concat(o.material)) if (mt && mt.alphaTest > 0 && !mt.transparent) { mt.alphaToCoverage = true; mt.needsUpdate = true; } });
scene.add(vrm.scene);
// 2026-10-07 試し版《蜂の目》（検証役まさひろ「羽織が肩から抜ける 1 秒ほど、半分透けてベージュの羽根のように見える」）：
// 羽織の生地は紗（透ける布）の絵で、肩から抜けて裏が見えると羽根のように透けた。着ているあいだの紗の見え方はそのままにし、
// 衿を持って体から離した羽織（haoriSnap の写し）だけを、透けない布の材質（両面・不透明・色を一段落とす）で描く。?haorisolid=0 で前の見え方
// 2026-10-07 夜（確認待ち①を比べられる形に）：?haori=a（既定＝離した羽織だけ不透明。衿を持った瞬間から HAORI_FADE 秒かけて、
// 透けた色・明るさから不透明の色へ移す＝色の切り替わりを「ぱっ」でなくす）／?haori=b（着ているあいだから不透明）／?haori=c（前のまま＝透ける）
// ?haorifade=0 で 10-07 昼の見え方（瞬間に切り替わる）
// 2026-10-08 本人の答え「羽織＝B（着ているときから透けない）」→ 既定を b に。?haori=a／c で比べの見え方
const HAORI_MODE = q.get('haori') || (q.get('haorisolid') === '0' ? 'c' : 'b');
const HAORI_SOLID = HAORI_MODE !== 'c', HAORI_K = Number(q.get('haorik') ?? 0.5), HAORI_FADE = Number(q.get('haorifade') ?? 0.6);
const _solid = new Map();
function solidHaori(mt) {
  if (!HAORI_SOLID) return mt;
  if (_solid.has(mt)) return _solid.get(mt);
  if (mt.userData.isSolid) return mt;
  const c = mt.clone(); c.userData = { isSolid: true }; c.transparent = false; c.opacity = 1; c.alphaTest = 0; c.depthWrite = true; c.side = THREE.DoubleSide;
  if ('transparentWithZWrite' in c) c.transparentWithZWrite = false;
  // clone すると MToon は ShaderMaterial になるので、色は uniforms（litFactor・shadeColorFactor）で落とす
  c.userData.op0 = mt.userData.op0 ?? mt.opacity ?? 1; c.userData.col0 = {};
  for (const k of ['litFactor', 'shadeColorFactor']) { const u = c.uniforms?.[k]?.value; if (u?.multiplyScalar) { c.userData.col0[k] = u.clone(); u.multiplyScalar(HAORI_K); } }
  c.userData.fade = 1;
  c.needsUpdate = true;
  _solid.set(mt, c); return c;
}
// 離した羽織の色を、透けた見え方（f=0）から不透明（f=1）へ移す
function haoriFade(f) {
  for (const c of _solid.values()) {
    if (Math.abs(c.userData.fade - f) < 1e-4) continue;
    const was = c.transparent, tr = f < 0.999;
    c.transparent = tr; c.depthWrite = !tr || f > 0.5;
    const op = lerp(c.userData.op0, 1, f); c.opacity = op; if (c.uniforms?.opacity) c.uniforms.opacity.value = op;
    for (const k in c.userData.col0) c.uniforms[k].value.copy(c.userData.col0[k]).multiplyScalar(lerp(1, HAORI_K, f));
    if (was !== tr) c.needsUpdate = true;
    c.userData.fade = f;
  }
}
if (HAORI_MODE === 'b') for (const m of haoriMeshes) m.material = Array.isArray(m.material) ? m.material.map(x => /Haori/i.test(x.name || '') ? solidHaori(x) : x) : (/Haori/i.test(m.material.name || '') ? solidHaori(m.material) : m.material);
// 2026-10-06 本人「碧の肌が少し光すぎています。…碧自身は発光しません。周りの明かりで照らしてください」：
// 自発光（emissive）・光と無関係に足される艶（matcap）・縁の光（rim）を 0 にし、肌の影の色を暖かく落として、
// 高座の灯（主光・行灯・提灯）と環境の光だけで照らす。?selflit=1 で前の見え方に戻せる
const SELF_LIT = q.get('selflit') === '1';
if (!SELF_LIT) vrm.scene.traverse(o => { if (!o.isMesh) return;
  for (const mt of [].concat(o.material)) { if (!mt) continue;
    if (mt.emissive) mt.emissive.setRGB(0, 0, 0);
    if (mt.matcapFactor) mt.matcapFactor.setRGB(0, 0, 0);
    if (mt.parametricRimColorFactor) mt.parametricRimColorFactor.setRGB(0, 0, 0);
    if ('rimLightingMixFactor' in mt) mt.rimLightingMixFactor = 1;
    if ('outlineLightingMixFactor' in mt) mt.outlineLightingMixFactor = 1;
    if ('giEqualizationFactor' in mt) mt.giEqualizationFactor = Number(q.get('gieq') ?? 0.5);
    if (/SKIN/.test(mt.name || '') && mt.shadeColorFactor) {
      mt.shadeColorFactor.setRGB(...(q.get('skinshade') ?? '0.72,0.52,0.48').split(',').map(Number));
      mt.shadingToonyFactor = Number(q.get('skintoony') ?? 0.5); mt.shadingShiftFactor = Number(q.get('skinshift') ?? -0.15);
    } else if (typeof mt.shadingToonyFactor === 'number') mt.shadingToonyFactor = Math.min(mt.shadingToonyFactor, 0.72);
  } });
// ---- 演目ごとの着物（2026-10-04 夜 本人「着物だけは、演目によって、着物の種類を色々と変えて」）
// 碧波（高座の衣装）の着物・帯・羽織の画像を、演目の kimono（timeline に入る）の色へ描き直す。顔・髪・肌は触らない。
// 色の決め方：彩りのある画素（碧の地・青海波・汀線のぼかし）の色相を target へ回し、彩度と明るさを掛ける。白・金茶の筋は残す
async function recolorKimono(K) {
  if (!K || !K.hue) return;
  const done = new Map();
  const conv = (tex) => {
    if (!tex || !tex.image) return tex;
    if (done.has(tex)) return done.get(tex);
    const img = tex.image, w = img.width, h = img.height;
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, w, h), px = d.data;
    const H = K.hue / 360, SK = K.sat ?? 1, LK = K.light ?? 1, GOLD = K.keepGold !== false;
    for (let i = 0; i < px.length; i += 4) {
      let r = px[i] / 255, gg = px[i + 1] / 255, b = px[i + 2] / 255;
      const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), l = (mx + mn) / 2, dd = mx - mn;
      if (dd < 0.06) continue;                                   // 白・灰・黒はそのまま
      const sat = dd / (1 - Math.abs(2 * l - 1) + 1e-6);
      let hh = mx === r ? ((gg - b) / dd) % 6 : mx === gg ? (b - r) / dd + 2 : (r - gg) / dd + 4; hh /= 6; if (hh < 0) hh += 1;
      if (GOLD && hh > 0.06 && hh < 0.16) continue;             // 金茶の筋・重ね衿の金は残す
      const s2 = Math.min(1, sat * SK), l2 = Math.min(0.97, l * LK);
      const C = (1 - Math.abs(2 * l2 - 1)) * s2, X = C * (1 - Math.abs((H * 6) % 2 - 1)), m = l2 - C / 2;
      const k = Math.floor(H * 6) % 6;
      const [rr, g2, bb] = [[C, X, 0], [X, C, 0], [0, C, X], [0, X, C], [X, 0, C], [C, 0, X]][k];
      px[i] = (rr + m) * 255; px[i + 1] = (g2 + m) * 255; px[i + 2] = (bb + m) * 255;
    }
    g.putImageData(d, 0, 0);
    const t = new THREE.CanvasTexture(c); t.flipY = tex.flipY; t.colorSpace = tex.colorSpace; t.wrapS = tex.wrapS; t.wrapT = tex.wrapT;
    t.repeat.copy(tex.repeat); t.offset.copy(tex.offset); t.anisotropy = maxAniso; t.needsUpdate = true;
    done.set(tex, t); return t;
  };
  vrm.scene.traverse(o => { if (!o.isMesh) return; for (const mt of [].concat(o.material)) {
    if (!mt || !/Tops_01_CLOTH|Haori|Obi/i.test(mt.name || '')) continue;
    for (const k of ['map', 'shadeMultiplyTexture', 'emissiveMap']) if (mt[k]) mt[k] = conv(mt[k]);
    if (mt.uniforms) for (const k of ['map', 'shadeMultiplyTexture', 'emissiveMap']) if (mt.uniforms[k]) mt.uniforms[k].value = mt[k];
    if (mt.shadeColorFactor && K.shade) mt.shadeColorFactor.set(K.shade);
    mt.needsUpdate = true;
  } });
}
await recolorKimono(TL.kimono || (q.get('kimono') ? JSON.parse(q.get('kimono')) : null));
const B = n => vrm.humanoid.getNormalizedBoneNode(n);
const gaze = new THREE.Object3D(); scene.add(gaze); if (vrm.lookAt) vrm.lookAt.target = gaze;
if (NOSPRING) vrm.springBoneManager = undefined;

// 正座：腿を前へ水平に・脛を腿の下へ折る。腰を座布団の上まで下げる
const P = {
  thigh: Number(q.get('thigh') ?? -1.35), shin: Number(q.get('shin') ?? 2.75), foot: Number(q.get('foot') ?? 0.9),
  spread: Number(q.get('spread') ?? 0.10), hipUp: Number(q.get('hipup') ?? 0.18),
  uaZ: Number(q.get('uaz') ?? 1.30), uaX: Number(q.get('uax') ?? -0.30), laY: Number(q.get('lay') ?? -0.50), uaY: Number(q.get('uay') ?? -0.80), laZ: Number(q.get('laz') ?? 0), handX: Number(q.get('handx') ?? 0.0),
};
function basePose() {
  for (const [s, side] of [[1, 'left'], [-1, 'right']]) {
    const ul = B(side + 'UpperLeg'), ll = B(side + 'LowerLeg'), ft = B(side + 'Foot');
    ul.rotation.set(P.thigh, 0, s * -P.spread * 0.0); ul.rotation.z = s * P.spread * 0.4;
    ll.rotation.set(P.shin, 0, 0);
    if (ft) ft.rotation.set(P.foot, 0, 0);
  }
}
basePose(); vrm.update(0); vrm.scene.updateMatrixWorld(true);
const hipsY0 = B('hips').getWorldPosition(new THREE.Vector3()).y;
vrm.scene.position.y = (KOZA_Y + ZB_H) + P.hipUp - hipsY0;
vrm.scene.position.z = -0.04;
vrm.scene.updateMatrixWorld(true);
const headP = () => B('head').getWorldPosition(new THREE.Vector3());
const head0 = headP();
// 視線の先＝客席の真ん中（カメラが替わっても、碧はお客を見て話す）
const AUD = new THREE.Vector3(0, head0.y + 0.05, 3.4);

// ---- 時間の関数（すべて t だけで決まる）
const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const L = TL.lines;
function lineAt(t) { for (const l of L) if (t >= l.start - 0.05 && t <= l.end + 0.05) return l; return null; }
function lastLine(t) { let r = null; for (const l of L) if (l.start <= t) r = l; return r; }
// 向き（上下）：目上＝大家は画面の左（下手）、目下＝八っつぁんは画面の右（上手）、地は正面。
// 次の台詞の頭の 0.18 秒前から回しはじめる（ながれ）
// 2026-10-06 検証役（落語好き）「正面の画で上下が読めない」→ 振り幅を 0.44→0.58（およそ 33°）・振り終えてから口を開く
const YAW = { makura: 0, hachi: 0.58, ooya: -0.58 };
// 2026-10-07 夜（自然さ）：まくらは客席を見渡す。行ごとに客席の左・中・右の一点へ、ゆっくり（0.9 秒）顔を向ける（±0.13 rad ほど）。?scan=0 で前の見え方
// 2026-10-13 本人「冒頭は正面を向いていてください」→ まくらは正面のまま（客席を見渡す首振りをやめた）。上下で首を振るのは人物が話すときだけ。?scan=1 で前の見え方
const SCAN = q.get('scan') === '1';
const yawOf = l => l.role === 'makura' && SCAN && l.sec === 'makura' ? [0, -0.12, 0.13, 0.05, -0.06][Math.floor(rnd(l.i + 17) * 5)] : YAW[l.role];
function yawAt(t) {
  let y = 0;
  for (let i = 0; i < L.length; i++) {
    const l = L[i], mk = l.role === 'makura' && (!i || L[i - 1].role === 'makura'), from = l.start - (mk ? 0.6 : 0.42);
    if (t >= from) { const prev = i ? yawOf(L[i - 1]) : 0; y = prev + (yawOf(l) - prev) * ease((t - from) / (mk ? 0.9 : 0.32)); }
  }
  if (t > END.turn0) y *= 1 - ease((t - END.turn0) / (END.turn1 - END.turn0));
  return y;
}
// お辞儀：頭（題の札の終わりに上げる）と、サゲのあと
// 終わりの運び（2026-10-06 夜 本人「オチの後は、正面を向き直してから…お辞儀を」「お辞儀まではそんなに時間を取らなくて大丈夫です。
// 正面を向いて、お辞儀くらいのタイミングでいい」「余韻を楽しむ余裕を持って」）：
// サゲを言い終える → 0.5 秒そのまま → 0.8 秒でゆっくり正面へ → 向き終わるころに下げはじめ（1.1 秒）→ 底で 1.4 秒 → 1.2 秒で上げる → 正面で余韻 → 札。
// 日本語の時間割（build_voice.py の AFTER_SAGE）はこの長さに合わせてある。英語版（前の版の時間割）は、札の前に収まるよう縮める
const END = (() => { const se = L[L.length - 1].end, room = TL.bow_end - se;
  const k = Math.min(1, room / 6.4);
  const turn0 = se + 0.5 * k, turn1 = turn0 + 0.8 * Math.max(0.6, k), bow0 = turn1 - 0.15, bowDn = bow0 + 1.1 * Math.max(0.6, k);
  const bowUp0 = bowDn + 1.4 * k, bowUp1 = bowUp0 + 1.2 * k;
  return { se, turn0, turn1, bow0, bowDn, bowUp0, bowUp1 }; })();
window.__END = END;
function bowAt(t) {
  const a = TL.title_sec;
  let b = 0;
  if (t < a) b = 1 - ease((t - (a - 1.6)) / 1.4);              // 札のあいだは下げていて、札が消えるころ上げる
  if (t > END.bow0) b = Math.max(b, ease((t - END.bow0) / (END.bowDn - END.bow0)) * (1 - ease((t - END.bowUp0) / Math.max(0.3, END.bowUp1 - END.bowUp0))));
  return b;
}
// 手振り：台詞ごとに、決まった規則で（地は長い行、会話は「！」「？」のある行・大家の講釈）
function gestureAt(t) {
  let g = 0, side = 1;
  for (const l of L) {
    const dur = l.end - l.start; if (dur < 1.2) continue;
    const want = l.role === 'makura' ? (l.text.length > (EN ? 90 : 34) && rnd(l.i) > 0.35) : (/[！？!?]/.test(l.text) || (l.role === 'ooya' && dur > 4.5) || rnd(l.i) > 0.7);
    if (!want || l.sage) continue;
    const a = l.start + 0.15, len = Math.min(2.6, dur * 0.7);
    if (t >= a && t <= a + len + 0.6) {
      const u = (t - a);
      const v = ease(u / 0.5) * (1 - ease((u - len) / 0.6));
      if (v > g) { g = v; side = l.role === 'ooya' ? -1 : l.role === 'hachi' ? 1 : (rnd(l.i + 3) > 0.5 ? 1 : -1); }
    }
  }
  return { g, side };
}
// まばたき（決まった刻み・3〜6 秒ごと）
const blinks = []; { let t = 0.8, i = 0; while (t < TL.duration + 5) { blinks.push(t); t += 3 + 3 * rnd(i++ + 50); } }
// 2026-10-14（自然さ）：話す人のまばたきは息つぎ・句の切れ目に寄る。台詞と台詞のあいだ（0.3 秒より長い間）が 0.8 秒以内にあれば、
// まばたきをその間の頭へ寄せる（言葉の途中で目を閉じない）。?blinkgap=0 で前の見え方
if (q.get('blinkgap') !== '0') { const gaps = []; for (let i = 1; i < L.length; i++) if (L[i].start - L[i - 1].end > 0.3) gaps.push(L[i - 1].end + 0.06);
  for (let j = 0; j < blinks.length; j++) { let best = null, bd = 0.8; for (const g of gaps) { const d = Math.abs(g - blinks[j]); if (d < bd) { bd = d; best = g; } } if (best != null) blinks[j] = best; }
  blinks.sort((a, b) => a - b);
  for (let j = blinks.length - 1; j >= 1; j--) if (blinks[j] - blinks[j - 1] < 1.2) blinks.splice(j, 1); }
// 2026-10-07 夜（自然さ）：上下の切り替え（顔を大きく振る）では、振りはじめにまばたきを一つ（人は大きく視線を移すとき瞬きしやすい）。?blinkturn=0 で前の見え方
if (q.get('blinkturn') !== '0') { for (let i = 1; i < L.length; i++) if (L[i].role !== L[i - 1].role && L[i].role !== 'makura') { const b = L[i].start - 0.40;
  for (let j = blinks.length - 1; j >= 0; j--) if (Math.abs(blinks[j] - b) < 0.7) blinks.splice(j, 1);
  blinks.push(b); } blinks.sort((a, b) => a - b); }
function blinkAt(t) {
  let v = 0;
  for (const b of blinks) { const u = t - b; if (u >= 0 && u < 0.26) v = u < 0.09 ? u / 0.09 : u < 0.12 ? 1 : 1 - (u - 0.12) / 0.14; }
  return v * v * (3 - 2 * v);
}

// 2026-10-06 検証役（アニメーター）「i・u が a と同じだけ開く」「1 コマで急に跳ぶ」：母音ごとの上限と、一コマの変化を 0.25 までに・前後 2 コマでならす
const VCAP = { aa: 1.0, oh: 0.8, ee: 0.6, ou: 0.42, ih: 0.36 };
// 口の形を拍の母音から（timeline に nn がある＝2026-10-07 夜より後の声）。?moralip=0 で前の見え方
const MORA_LIP = q.get('moralip') !== '0' && (TL.vowel || []).includes('nn');
const MOUTH = (() => { const a = TL.mouth || [], b = a.slice();
  for (let j = 1; j < b.length; j++) b[j] = Math.max(b[j - 1] - 0.25, Math.min(b[j - 1] + 0.25, b[j]));
  return b.map((_, j) => { let s = 0, n = 0; for (let k = -2; k <= 2; k++) if (b[j + k] != null) { s += b[j + k] * (3 - Math.abs(k)); n += 3 - Math.abs(k); } return s / n; }); })();
const sub = document.querySelector('#sub span.box'), subWrap = document.getElementById('sub');
const titleEl = document.getElementById('title'), creditEl = document.getElementById('credit');
// 字幕は一行が長いと分ける（。！？ と読点で、およそ MAXC 字まで）。時間は字数に比例して配る
const MAXC = MODE === 'v' ? 28 : 40;   // 2026-10-06 一行 14 字（縦）・20 字（横）ほどに（70 代の聞き手「一行が長い」）
const MAXC_EN = MODE === 'v' ? 44 : 70, ROW_EN = MODE === 'v' ? 22 : 38;
function chunksEn(text) {
  const raw = text.split(/(?<=[.!?…]["”’]?)\s+/);
  const out = [];
  for (let s of raw) {
    // 長い文は、なるべく同じ長さに割る（句読点のあと＞語の切れ目。小さな切れ端を残さない）
    while (s.length > MAXC_EN) {
      const n = Math.ceil(s.length / MAXC_EN), tgt = s.length / n;
      let best = -1, bs = 1e9;
      for (let k = 8; k < Math.min(s.length - 8, MAXC_EN); k++) {
        if (s[k] !== ' ') continue;
        const sc = Math.abs(k - tgt) - (/[,;:—]/.test(s[k - 1]) ? 12 : 0);
        if (sc < bs) { bs = sc; best = k; }
      }
      if (best < 0) best = s.lastIndexOf(' ', MAXC_EN);
      out.push(s.slice(0, best).trim()); s = s.slice(best + 1).trim();
    }
    if (s) out.push(s);
  }
  const m = []; for (const c of out) { if (m.length && (c.length < 14 || m[m.length - 1].length < 14) && (m[m.length - 1] + ' ' + c).length <= MAXC_EN) m[m.length - 1] += ' ' + c; else m.push(c); }
  return m;
}
function wrapEn(c) {
  if (c.length <= ROW_EN) return esc(c);
  let best = -1, bs = 1e9;
  for (let k = 1; k < c.length; k++) if (c[k] === ' ') { const sc = Math.abs(k - c.length / 2) - (/[,;:]/.test(c[k - 1]) ? 4 : 0); if (sc < bs) { bs = sc; best = k; } }
  return best < 0 ? esc(c) : esc(c.slice(0, best)) + '<br>' + esc(c.slice(best + 1));
}
function chunks(text) {
  if (EN) return chunksEn(text);
  const raw = text.split(/(?<=[。！？])/);
  const out = [];
  for (let s of raw) {
    while (s.length > MAXC) { let k = s.lastIndexOf('、', MAXC); if (k < 8) k = MAXC; out.push(s.slice(0, k + 1)); s = s.slice(k + 1); }
    if (s) out.push(s);
  }
  // 短すぎる切れは前へ寄せる
  const m = []; for (const c of out) { if (m.length && (c.length < 7 || m[m.length - 1].length < 7) && (m[m.length - 1] + c).length <= MAXC) m[m.length - 1] += c; else m.push(c); }
  // 2026-10-07 夜：二行に句読点で折れない切れ（「言い合いは、大先生が亡くなる／まで、…」）は、読点で二つの切れに分ける
  const P = '、。！？　 ';
  const fits = c => { if (c.length <= ROW) return true; for (let k = 2; k < c.length - 1; k++) if (P.includes(c[k - 1]) && k <= ROW + 2 && c.length - k <= ROW + 2) return true; return false; };
  const res = [];
  const put = c => { if (fits(c)) { res.push(c); return; }
    let best = -1; for (let k = 3; k < c.length - 3; k++) if (P.includes(c[k - 1]) && (best < 0 || Math.abs(k - c.length / 2) < Math.abs(best - c.length / 2))) best = k;
    if (best < 0) { res.push(c); return; } put(c.slice(0, best)); put(c.slice(best)); };
  m.forEach(put);
  return res;
}
// 二行になるときは、真ん中にいちばん近い読点・句点のあとで折る（語の途中で折らない）
const ROW = MODE === 'v' ? 14 : 22;
const esc = x => x.replace(/&/g, '&amp;').replace(/</g, '&lt;');
function wrap(c) {
  if (EN) return wrapEn(c);
  if (c.length <= ROW) return esc(c);
  // 折る場所の良さ：句読点のあと＞助詞のあと（次が漢字・カタカナ）＞それ以外。行の長さは ROW+2 まで
  const kanjiKata = ch => /[一-鿿゠-ヿ「]/.test(ch);
  let best = -1, bs = -1e9;
  // 2026-10-07 夜 縦で「えー、お／運び…」と語の途中で折れた：句読点のあとなら頭の 2 字からでも折ってよい（短い頭は句読点に限る）。
  // 美化・尊敬の頭の「お」「ご」（お運び・ご隠居）のあと、小さい字・長音の前では折らない
  for (let k = 2; k <= c.length - 2; k++) {
    if (k > ROW + 2 || c.length - k > ROW + 2) continue;
    const a = c[k - 1], b = c[k];
    const punct = '、。！？　 '.includes(a);
    if (!punct && (k < 4 || c.length - k < 4)) continue;
    let sc = punct ? 100 : ('をにはがでともへやか'.includes(a) && kanjiKata(b)) ? 60 : (a === 'の' && kanjiKata(b)) ? 15 : ('いな'.includes(a) && kanjiKata(b)) ? -10 : (/[ぁ-ん]/.test(a) && kanjiKata(b)) ? 30 : -50;
    if (/[ァ-ヿ]/.test(a) && /[ぁ-ん]/.test(b)) sc = Math.max(sc, 20);   // 片仮名の名のあと（フリッシュ／という）
    if (/[ァ-ヿ]/.test(a) && /[ァ-ヿ]/.test(b)) sc -= 150;               // 片仮名の名の途中では折らない
    if (a === '・' || b === '・') sc -= 300;   // カール・フォン・フリッシュを「・」で割らない
    if ('おご'.includes(a) && kanjiKata(b) && (k < 2 || !/[ぁ-ん]/.test(c[k - 2]) || '、。'.includes(c[k - 2]))) sc -= 120;
    if (/[ぁぃぅぇぉっゃゅょゎァィゥェォッャュョー]/.test(b)) sc -= 200;
    if (['から', 'ので', 'けど', 'って'].includes(c.slice(k - 2, k)) && sc < 50) sc = 50;
    if ('、。！？」'.includes(b)) sc -= 200;
    sc -= Math.abs(k - c.length / 2) * 3;
    if (sc > bs) { bs = sc; best = k; }
  }
  if (best < 0) best = Math.ceil(c.length / 2);
  return esc(c.slice(0, best)) + '<br>' + esc(c.slice(best));
}
const SUB_SNAP = q.get('subsnap') !== '0';
const subPlan = L.map(l => {
  // 字幕では鉤括弧を外す（切れ目で片方だけ残るのを避ける）
  const cs = chunks(l.text.replace(/[「」“”"]/g, '')); const tot = cs.reduce((a, c) => a + c.length, 0); let acc = l.start; const d = l.end - l.start;
  const P_ = cs.map(c => { const s = acc; acc += d * c.length / tot; return { s, e: acc, c }; });
  // 2026-10-07 夜（字幕と声のずれ）：切れ目を、声の息つぎ（timeline の gaps）のいちばん近い所へ寄せる（1.5 秒以内・順を崩さない）。?subsnap=0 で前の配り方
  if (SUB_SNAP && l.gaps && l.gaps.length && P_.length > 1) {
    let gi = 0;
    for (let j = 0; j < P_.length - 1; j++) {
      const b = P_[j].e; let best = -1, bd = 1.5;
      for (let k = gi; k < l.gaps.length; k++) { const mid = (l.gaps[k][0] + l.gaps[k][1]) / 2, dd = Math.abs(mid - b); if (dd < bd) { bd = dd; best = k; } }
      if (best < 0) continue;
      const [g0, g1] = l.gaps[best]; if (g0 <= P_[j].s + 0.3 || g1 >= P_[j + 1].e - 0.3) continue;
      P_[j].e = g0 + 0.05; P_[j + 1].s = g1; gi = best + 1;
    }
  }
  return P_;
}).flat();
function subAt(t) {
  for (let i = 0; i < subPlan.length; i++) {
    const p = subPlan[i], next = subPlan[i + 1];
    const hold = next ? Math.min(next.s, p.e + 0.6) : p.e + 0.8;    // 間のあいだは少し残す
    const a0 = p.s - 0.12;
    if (t >= a0 && t < hold) {
      // ふわっと出す（0.32 秒）・次の切れが間をおかずに来るときは消さずに替える・間があるときは 0.28 秒で消す
      const fin = Math.min(1, (t - a0) / 0.32), gap = next ? next.s - p.e : 1;
      const fout = gap > 0.25 ? Math.min(1, (hold - t) / 0.28) : 1;
      const al = Math.max(0, Math.min(fin, fout));
      return { c: p.c, a: Math.min(1, al * al * (3 - 2 * al) * 1.6), dy: (1 - Math.min(1, fin)) * 10, p: t - a0, i };
    }
  }
  return { c: '', a: 0, dy: 0, p: 0, i: 0 };
}
const subband = document.getElementById('subband');
const tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler();
function rot(name, x, y, z) { const b = B(name); if (!b) return; b.rotation.set(x, y, z); }

// ============================================================================================
// 所作（2026-10-04 夜 本人「羽織を脱ぐ仕草」「扇子を手でしっかり保つ」「扇子・手拭いの見立て」「目線や仕草」）
// 研究＝../../資料/研究_落語の所作.md。所作は台本の［所作：…］の印から（build_voice.py が timeline の act に入れる）。
// 手の行き先（胸の骨から見た位置・向き）を決め、肩→肘→手を二つの骨の IK で解く（第 4 版の FK の向きの取り違え＝
// 腕が後ろへ回る不具合を避けるため、行き先から角度を出す）。休めの姿勢（膝の上）は第 4 版の FK のまま。
// 手の向きは「親指の向き（＝扇子の向き）」と「手のひらの向き」で決める。右手は扇子を握る（指を曲げる）。
// ============================================================================================
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _m1 = new THREE.Matrix4(), _m0 = new THREE.Matrix4();
const CHEST = () => B('upperChest') || B('chest');
function roleAt(t) {
  let r = 'makura';
  for (const l of L) { if (l.start - 0.22 <= t) r = l.role; }
  if (t > END.turn0) r = 'makura';
  return r;
}
// ---- 所作の型（u＝所作の中の進み 0→1。p＝胸から見た手の位置（m）、th＝親指の向き、n＝手のひらの向き。x＋が碧の左）
const lerp = (a, b, k) => a + (b - a) * k;
function keyAt(keys, u) {
  let i = 0; while (i < keys.length - 2 && u > keys[i + 1].u) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const k = b.u > a.u ? ease((u - a.u) / (b.u - a.u)) : 0;
  const mix = (x, y) => x && y ? x.map((v, j) => lerp(v, y[j], k)) : (x || y);
  return { R: a.R && b.R ? { p: mix(a.R.p, b.R.p), th: mix(a.R.th, b.R.th), n: mix(a.R.n, b.R.n) } : (a.R || b.R),
           L: a.L && b.L ? { p: mix(a.L.p, b.L.p), th: mix(a.L.th, b.L.th), n: mix(a.L.n, b.L.n) } : (a.L || b.L) };
}
const KNOCK_V1 = q.get('knock') === '1';
const ACTDEF = {
  // 羽織を脱ぐ：両手で衿を持ち、肩から後ろへすべらせ、後ろへ落とす（まくらから本題へ移る間に）
  // 2026-10-06 夜 本人「羽織を下ろすときに、手の動きと羽織の動きが一致していない…しっかり、羽織を脱いで、後ろに置いている仕草を
  // 羽織と手の動きをしっかり合わせて」「扇子は消さずに…高座の床に扇子をおいて…そこからまた、持ち直して」：
  // 手の道筋は haoriHands()（扇子を膝の前の床へ置く→両手で衿→肩から抜く→背へ下ろす→右手で後ろの座布団へ置く→扇子を取る）。
  // 羽織の形は haoriPost() が手の実際の位置から決める（手と同じコマで動く）
  haori: { headX: 0.0, leftCurl: 0.75, hands: true, keys: [] },
  // 蕎麦（うどん）をすする：左手に丼、右手の扇子を箸に。丼から口へ持ち上げてすする
  soba: { headX: 0.10, leftCurl: 0.55, gazeDown: true, loop: 1.1, poleR: [-0.4, -0.9, 0.1], keys: [
    { u: 0.00, R: { p: [-0.03, 0.04, 0.30], th: [0.55, -0.55, 0.6], n: [0.2, -0.6, -0.5] }, L: { p: [0.09, -0.02, 0.27], th: [0, 0, 1], n: [0, 1, 0] } },
    { u: 0.40, R: { p: [-0.03, 0.04, 0.30], th: [0.55, -0.55, 0.6], n: [0.2, -0.6, -0.5] }, L: { p: [0.09, -0.02, 0.27], th: [0, 0, 1], n: [0, 1, 0] } },
    { u: 0.70, R: { p: [-0.02, 0.22, 0.17], th: [0.5, -0.75, 0.45], n: [0.2, -0.4, -0.8] }, L: { p: [0.07, 0.06, 0.24], th: [0, 0, 1], n: [0, 1, 0] } },
    { u: 1.00, R: { p: [-0.03, 0.04, 0.30], th: [0.55, -0.55, 0.6], n: [0.2, -0.6, -0.5] }, L: { p: [0.09, -0.02, 0.27], th: [0, 0, 1], n: [0, 1, 0] } }] },
  // 扇子で床（高座）をたたく：戸をたたく音・足音（扇子の根で打つ）
  // 扇子で高座の床を打つ（2026-10-05 本人「扇子で音を立てる時に、高座の床を叩くように」）：扇子の先を下へ、
  // 音の瞬間に扇子の先が床に届く（applyAct で扇子の先の高さから手の高さを解く）。打ったあとは小さく跳ね返る
  // 2026-10-06 夜 本人「扇子で音を立てるときに、絵の方を垂直に立てて、高座の床を叩いて、音を出してください」：
  // 閉じた扇子を縦に（要が上・先が下）持ち、右膝の前の床を先で打つ。手の位置は扇子の先の高さから決める（knockHand）。音は先が床に着くコマ
  // 2026-10-07 試し版（検証役まさひろ「体を 45 度ほどまで倒して、顔が髪に隠れる…背はほぼ立てたまま、顔は戸のほうに向けて、手首で二つ三つ打つ」）：
  // 倒しを半分ほどに（spine 0.70→0.30・chest 0.34→0.10）、頭は起こして（−0.14→−0.30）目は前の戸へ。打つ所を手前へ（knockT）。?knock=1 で前の形
  knock: KNOCK_V1 ? { headX: -0.14, spineX: 0.70, chestX: 0.34, gazeDown: true, knockFan: true, keys: [
    { u: 0.00, R: { p: [-0.44, -0.44, 0.30], th: [-0.45, -1, 0.2], n: [1, 0, 0] } },
    { u: 1.00, R: { p: [-0.44, -0.44, 0.30], th: [-0.45, -1, 0.2], n: [1, 0, 0] } }] }
  : { headX: -0.30, spineX: 0.30, chestX: 0.10, gazeFront: true, knockFan: true, keys: [
    { u: 0.00, R: { p: [-0.44, -0.44, 0.30], th: [-0.45, -1, 0.2], n: [1, 0, 0] } },
    { u: 1.00, R: { p: [-0.44, -0.44, 0.30], th: [-0.45, -1, 0.2], n: [1, 0, 0] } }] },
  // 煙管：扇子を口へ
  // 2026-10-06 検証役（落語好き・アニメーター）「扇子を縦に立てて口を覆ったまま話す」「袖の内側が白い板になる」：
  // 台詞の前の間（pre）だけで、吸う→吐く。扇子は先を前下へ寝かせ、吸い口だけを口へ。肘は胸の高さまでに抑える
  kiseru: { headX: 0.04, pre: true, poleR: [-0.35, -0.92, 0.15], keys: [
    { u: 0.00, R: { p: [-0.14, 0.02, 0.30], th: [0.25, -0.55, 0.8], n: [0.3, 0.9, 0] } },
    // 2026-10-13（腕を上げると袖がおかしい）：手を顎の下・少し前に（前腕を立てきらない＝袂が肘で板にならない）。扇子の吸い口は口へ
    { u: 0.30, R: { p: [-0.06, 0.07, 0.29], th: [0.2, -0.75, 0.62], n: [0.3, 0.9, 0] } },
    { u: 0.62, R: { p: [-0.06, 0.07, 0.29], th: [0.2, -0.75, 0.62], n: [0.3, 0.9, 0] } },
    { u: 0.86, R: { p: [-0.13, 0.01, 0.31], th: [0.25, -0.6, 0.75], n: [0.3, 0.9, 0] } },
    { u: 1.00, R: { p: [-0.14, 0.00, 0.31], th: [0.25, -0.6, 0.75], n: [0.3, 0.9, 0] } }] },
  // 見上げる・指す：扇子の先で上を指し、目で追う
  // 2026-10-06 検証役（アニメーター・落語好き）「頭の後ろを掻く／伸びに見える」→ 肘は肩の高さまで、腕は斜め前上へ、扇子の先で指す
  // 2026-10-06 検証役 p2（落語好き）「まくらの見上げるが 25 秒止まったまま」→ 一度さして目で追い、3 秒ほどで手を下ろす（maxLen）
  miage: { headX: -0.30, neckX: -0.10, gazeUp: true, maxLen: 3.0, poleR: [-0.5, -0.85, 0.1], keys: [
    { u: 0.00, R: { p: [-0.24, 0.10, 0.44], th: [-0.2, 0.75, 0.62], n: [1, 0, 0] } },
    { u: 1.00, R: { p: [-0.25, 0.13, 0.45], th: [-0.18, 0.8, 0.58], n: [1, 0, 0] } }] },
  // 手拭いを本（帳面）に：両手で開いて読む
  hon: { headX: 0.20, leftCurl: 0.25, tenugui: 'book', keys: [
    { u: 0.00, R: { p: [-0.09, -0.01, 0.29], th: [0, 0.3, 1], n: [0.2, 1, 0] }, L: { p: [0.09, -0.01, 0.29], th: [0, 0.3, 1], n: [-0.2, 1, 0] } },
    { u: 1.00, R: { p: [-0.09, -0.01, 0.29], th: [0, 0.3, 1], n: [0.2, 1, 0] }, L: { p: [0.09, -0.01, 0.29], th: [0, 0.3, 1], n: [-0.2, 1, 0] } }] },
  // 筆と帳面：左手の手拭いが帳面、右手の扇子が筆
  fude: { headX: 0.20, leftCurl: 0.2, tenugui: 'palm', loop: 0.9, keys: [
    { u: 0.00, R: { p: [-0.03, 0.05, 0.29], th: [0.2, -0.85, 0.45], n: [0.6, 0.2, -0.6] }, L: { p: [0.07, -0.05, 0.29], th: [0, 0, 1], n: [0, 1, 0] } },
    { u: 0.50, R: { p: [0.01, 0.04, 0.27], th: [0.2, -0.85, 0.45], n: [0.6, 0.2, -0.6] }, L: { p: [0.07, -0.05, 0.29], th: [0, 0, 1], n: [0, 1, 0] } },
    { u: 1.00, R: { p: [-0.03, 0.05, 0.29], th: [0.2, -0.85, 0.45], n: [0.6, 0.2, -0.6] }, L: { p: [0.07, -0.05, 0.29], th: [0, 0, 1], n: [0, 1, 0] } }] },
  // 手拭いを財布に：左手の財布から右手で銭を出す
  saifu: { headX: 0.16, leftCurl: 0.45, tenugui: 'fold', loop: 1.3, keys: [
    { u: 0.00, R: { p: [-0.03, 0.03, 0.27], th: [0, 0, 1], n: [0, -1, 0] }, L: { p: [0.06, -0.02, 0.28], th: [0, 0, 1], n: [0, 1, 0] } },
    { u: 0.50, R: { p: [0.02, 0.00, 0.28], th: [0, 0, 1], n: [0, -1, 0] }, L: { p: [0.06, -0.02, 0.28], th: [0, 0, 1], n: [0, 1, 0] } },
    { u: 1.00, R: { p: [-0.03, 0.03, 0.27], th: [0, 0, 1], n: [0, -1, 0] }, L: { p: [0.06, -0.02, 0.28], th: [0, 0, 1], n: [0, 1, 0] } }] },
  // 箒で掃く：扇子を箒の柄に見立て、左右に掃く
  houki: { headX: 0.14, loop: 1.6, keys: [
    { u: 0.00, R: { p: [-0.12, -0.34, 0.36], th: [0.2, -0.85, 0.5], n: [1, 0, 0] }, L: { p: [-0.03, -0.08, 0.32], th: [0, 0, 1], n: [-1, 0, 0] } },
    { u: 0.50, R: { p: [0.02, -0.34, 0.36], th: [-0.2, -0.85, 0.5], n: [1, 0, 0] }, L: { p: [0.09, -0.08, 0.32], th: [0, 0, 1], n: [-1, 0, 0] } },
    { u: 1.00, R: { p: [-0.12, -0.34, 0.36], th: [0.2, -0.85, 0.5], n: [1, 0, 0] }, L: { p: [-0.03, -0.08, 0.32], th: [0, 0, 1], n: [-1, 0, 0] } }] },
  // 量る・持ち上げる：両の手のひらを上へ、重さを確かめる
  hakaru: { headX: 0.10, leftCurl: 0.3, loop: 1.4, keys: [
    { u: 0.00, L: { p: [0.10, -0.12, 0.32], th: [0, 0, 1], n: [0, 1, 0] } },
    { u: 0.50, L: { p: [0.10, -0.07, 0.32], th: [0, 0, 1], n: [0, 1, 0] } },
    { u: 1.00, L: { p: [0.10, -0.12, 0.32], th: [0, 0, 1], n: [0, 1, 0] } }] },
};
// timeline の所作の並び（t0〜t1）。羽織は timeline.haori（まくら→本題の間）
const ACTS = [];
for (const l of L) if (l.act && ACTDEF[l.act.type]) { const D = ACTDEF[l.act.type], t0 = l.start - (l.act.pre || 0); let t1 = D.pre ? l.start - 0.05 : l.end + 0.15; if (D.maxLen) t1 = Math.min(t1, l.start + D.maxLen); ACTS.push({ type: l.act.type, t0, t1, taps: l.act.taps || [], line: l }); }
if (TL.haori && haoriMats.length) ACTS.push({ type: 'haori', t0: TL.haori[0], t1: TL.haori[1], taps: [] });
// ---- 所作の層（2026-10-13 試作・kit/rakugo.js）
// 口の時刻表と印は、URL で指定が無ければ演目の所から（<演目>/_dev/out/rk_lip.json・<演目>/_dev/marks_rakugo.json）。無ければ使わない
const RK_TL = TL_URL;
const rkGet = async u => { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch (e) { return null; } };
const RK_LIP = await rkGet(q.get('rklip') || RK_TL.replace(/timeline\.json$/, 'rk_lip.json'));
const RK_MARKS = await rkGet(EBASE + 'marks_rakugo.json');
// 英語版は、層の文の決まり（日本語の句読点）と口の時刻表がまだ合わないので、?rk=1 のときだけ
const RKL = (q.get('rk') === '0' || (EN && q.get('rk') !== '1')) ? null : RK.createStageLayer({ THREE, B, vrm, gaze, AUD, head0, TL, L, P, MOUTH, actAt, yawAt, bowAt, roleAt, END, titleEl, CHEST, ik2, handQuatW, KOZA_Y, ZB_H, scene, getFan: () => fan, shotKind: t => { let k = null; for (const c of cutTimes) if (c.t0 <= t) k = c.k; return k; }, cutAge: t => { let a = null; for (const c of cutTimes) if (c.t0 <= t) a = t - c.t0; return a; } }, RK.buildScore(TL, { lip: RK_LIP, marks: RK_MARKS }));
if (RKL) RKL.extendActs(ACTDEF, ACTS);
window.__RKL = RKL;
// 2026-10-07 試し版（検証役まさひろ「礼のあいだ、両手が扇子を持ったまま膝の上…寄席では、扇子を膝の前に横に置き、両手を前について頭を下げる」）：
// サゲのあと正面へ向き直るあいだに、右手で扇子を膝の前の床へ横に置き（結界）、下げはじめと同時に両手を扇子の手前の床につく。
// 上げきったら手は膝へ戻り、扇子は床に置いたまま（札まで）。?rei=0 で前の礼
const REI_ON = q.get('rei') !== '0';   // FAN はこのあとで決まるので、使うときに見る
function reiAt(t) {
  if (!REI_ON || !FAN || t < END.turn0 - 0.1) return null;
  const w = ease((t - (END.turn0 - 0.1)) / 0.35) * (1 - ease((t - (END.bowUp0 + 0.25)) / Math.max(0.5, END.bowUp1 - END.bowUp0 + 0.2)));
  if (w <= 0.001) return null;
  return { type: 'rei', w, u: 0, tap: 0, D: { rei: true, headX: 0 }, headX: 0, gaze: null };
}
function actAt(t) {
  const R_ = reiAt(t); if (R_) return R_;
  for (const a of ACTS) {
    if (t < a.t0 - 0.5 || t > a.t1 + 1.5) continue;
    const D = ACTDEF[a.type], len = a.t1 - a.t0;
    const fadeIn = a.type === 'haori' ? 0.35 : 0.45, fadeOut = ACTDEF[a.type].tenugui ? 1.5 : 0.5;
    // 入りはわずかに行き過ぎて戻る（3%）・抜けはなめらかに
    const xin = Math.min(1, Math.max(0, (t - a.t0 + fadeIn) / fadeIn)), bo = xin <= 0 ? 0 : 1 + 1.6 * Math.pow(xin - 1, 3) + 0.6 * Math.pow(xin - 1, 2);
    const w = Math.min(Math.min(1.03, bo), ease((a.t1 + fadeOut - t) / fadeOut));
    if (w <= 0) continue;
    const u = D.loop ? (((t - a.t0) / D.loop) % 1 + 1) % 1 : Math.min(1, Math.max(0, (t - a.t0) / len));
    let tap = 0;   // 床を打つ瞬間に手を下ろす
    // 打つ形：振り下ろし 0.14 秒 → 音の瞬間に床（tap=1）→ 0.12 秒で跳ね返り、少し上がって（−0.25）戻る
    // 2026-10-06 検証役（アニメーター）「溜めも跳ね返りもない」：溜め（一打目 0.3 秒・続きは 0.12 秒）→ 3〜4 コマで振り下ろし → 床で 2 コマ止める → 跳ね返り
    for (const [kk, tt] of a.taps.entries()) { const d = t - tt, wu = kk === 0 ? 0.30 : 0.12; let v = 0;
      if (d > -0.12 - wu && d <= -0.12) v = -0.35 * ease((d + 0.12 + wu) / wu);
      else if (d > -0.12 && d <= 0) v = -0.35 + 1.35 * ease((d + 0.12) / 0.12);
      else if (d > 0 && d <= 0.066) v = 1;
      else if (d > 0.066 && d < 0.18) v = 1 - ease((d - 0.066) / 0.114);
      else if (d >= 0.18 && d < 0.34) v = -0.22 * Math.sin(Math.PI * (d - 0.18) / 0.16);
      if (Math.abs(v) > Math.abs(tap)) tap = v; }
    const g = D.gazeUp ? v3(-0.6, head0.y + 2.6, 1.2) : D.gazeDown ? v3(0, head0.y - 0.6, 0.9) : D.gazeFront ? v3(-0.9, head0.y - 0.1, 2.4) : null;
    // 手拭いの所作：取る（膝の脇へ手を下ろす 0.55 秒 → 握る → 持ち上げる 0.6 秒）と、置く（その逆）
    const ti = t - (a.t0 - fadeIn), te = (a.t1 + fadeOut) - t;
    const reachIn = ease(ti / 0.7), pick = ease((ti - 0.95) / 0.75), reachOut = ease(te / 0.7), put = ease((te - 0.95) / 0.75);
    const held = ti > 0.8 && te > 0.8;
    const gz = D.tenugui && (pick < 1 || put < 1) ? v3(-0.3, KOZA_Y, 1.0) : g;
    return { type: a.type, w: D.tenugui ? Math.max(w, Math.min(1, Math.max(reachIn, 0))) : w, u, tap, D, headX: D.headX, neckX: D.neckX, chestX: D.chestX, spineX: D.spineX, gaze: gz, a, reachIn, pick, reachOut, put, held };
  }
  return { w: 0 };
}
// ---- 二つの骨の IK（肩→肘→手）。pole＝肘の出る向き（世界）
const _S = new THREE.Vector3(), _E = new THREE.Vector3(), _D = new THREE.Vector3(), _P = new THREE.Vector3();
function setDir(bone, childLocal, dirW) {
  bone.parent.getWorldQuaternion(_q1);
  const dl = dirW.clone().normalize().applyQuaternion(_q1.invert());
  bone.quaternion.setFromUnitVectors(childLocal.clone().normalize(), dl);
  bone.updateMatrixWorld(true);
}
function ik2(side, T, poleW) {
  const ua = B(side + 'UpperArm'), la = B(side + 'LowerArm'), hd = B(side + 'Hand');
  ua.getWorldPosition(_S);
  const l1 = la.position.length(), l2 = hd.position.length();
  _D.copy(T).sub(_S); let d = _D.length(); d = Math.min(Math.max(d, Math.abs(l1 - l2) + 1e-3), (l1 + l2) * 0.93); _D.normalize();   // 肘は伸ばしきらない（2026-10-05 本人「腕の動きを綺麗に」）
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  _P.copy(poleW).sub(_D.clone().multiplyScalar(poleW.dot(_D))).normalize();
  _E.copy(_S).addScaledVector(_D, a).addScaledVector(_P, h);
  setDir(ua, la.position, _E.clone().sub(_S));
  setDir(la, hd.position, _S.clone().addScaledVector(_D, d).sub(_E));
}
// 手の向き：親指（th）と手のひら（n）から、手の骨の世界の向きを出す。T ポーズでは 指＝外・手のひら＝下・親指＝前
function handQuatW(side, thW, nW) {
  const th = thW.clone().normalize();
  const n = nW.clone().sub(th.clone().multiplyScalar(nW.dot(th))).normalize();
  const f = side === 'right' ? n.clone().cross(th) : th.clone().cross(n);
  const f0 = v3(side === 'right' ? -1 : 1, 0, 0), n0 = v3(0, -1, 0), t0 = v3(0, 0, 1);
  _m1.makeBasis(f, n, th); _m0.makeBasis(f0, n0, t0);
  return new THREE.Quaternion().setFromRotationMatrix(_m1.multiply(_m0.transpose()));
}
const _chq = new THREE.Quaternion();
let bookPut = false;
function applyAct(A, t) {
  bookPut = A.w > 0.45 && A.D && A.D.tenugui === 'book';   // 手拭いを本にするあいだは、扇子を前に置く
  if (!(A.w > 0.01)) { placeTenugui(null, 0); return; }
  vrm.scene.updateMatrixWorld(true);
  const ch = CHEST(); ch.getWorldQuaternion(_chq);
  const toW = (arr) => arr.isVector3 ? arr.clone() : ch.localToWorld(v3(arr[0], arr[1], arr[2]));
  const dirW = (arr) => arr.isVector3 ? arr.clone().normalize() : v3(arr[0], arr[1], arr[2]).normalize().applyQuaternion(_chq);
  const K = A.D.rei ? reiHands(t, ch) : A.D.hands ? (HAORI2 ? haoriHands2(A.u, ch) : haoriHands(A.u, ch)) : (A.D.knockFan && FAN) ? knockHand(A.tap, ch) : keyAt(A.D.keys, A.u);
  for (const side of ['right', 'left']) {
    const k = side === 'right' ? K.R : K.L; if (!k) continue;
    const hd = B(side + 'Hand');
    const fk = hd.getWorldPosition(new THREE.Vector3()), fkq = hd.getWorldQuaternion(new THREE.Quaternion());
    const tp = toW(k.p);

    const wk = A.w * (k.w0 ?? 1);
    let T = fk.clone().lerp(tp, wk);
    // 手拭い（2026-10-05 本人「取るときとおくときに投げ捨てないで…脇からだしたり、しまったり」）：
    // 左手がまず膝の脇の手拭いへ下りて取り、持ち上げてから見立ての形へ。終わりは同じ道を逆にたどって置く
    if (side === 'left' && A.D.tenugui && tenuguiRest) {
      const restP = tenuguiRest.p.clone().add(v3(0.02, 0.035, -0.02));
      const lift = Math.min(A.pick, A.put);
      T = fk.clone().lerp(restP, Math.min(1, Math.max(A.reachIn, A.reachOut) * 1.0)).lerp(tp, lift);
    }
    // 2026-10-13（腕を上げると袖がおかしい）：手を口や胸の高さへ上げる型は、肘を横へ張らず下へ落とす（D.poleR＝右の肘の出る向き。胸から見た向き）
    const pole = k.pole ? k.pole.clone() : (side === 'right' && A.D.poleR) ? dirW(A.D.poleR) : dirW(side === 'right' ? [-0.75, -0.55, -0.25] : [0.75, -0.55, -0.25]);
    ik2(side, T, pole);
    const want = k.q ? k.q.clone() : handQuatW(side, dirW(k.th), dirW(k.n));
    const qw = fkq.clone().slerp(want, (side === 'left' && A.D.tenugui) ? Math.min(A.w, Math.min(A.pick, A.put)) : wk);
    // 手首（2026-10-05 本人「センスを前に指したりするときに、手のみきがおかしい」・袖口の崩れ）：
    // 手の指の向きと前腕の向きの角を 32° まで、手首のひねりを 50° までにとどめる（手首を折らない・袖口を引っぱらない）
    const la = B(side + 'LowerArm');
    const fa = hd.getWorldPosition(new THREE.Vector3()).sub(la.getWorldPosition(new THREE.Vector3())).normalize();
    const sgn = side === 'right' ? -1 : 1;
    let fdir = v3(sgn, 0, 0).applyQuaternion(qw);
    const MAXB = Number(q.get('maxbend') ?? 0.7), ab = fdir.angleTo(fa);
    if (ab > MAXB && !k.q) { const ax = new THREE.Vector3().crossVectors(fdir, fa).normalize(); qw.premultiply(new THREE.Quaternion().setFromAxisAngle(ax, ab - MAXB)); }
    hd.parent.getWorldQuaternion(_q2); const loc = _q2.invert().multiply(qw);
    const ang = 2 * Math.acos(Math.min(1, Math.abs(loc.w))), MAXW = Number(q.get('maxwrist') ?? 1.3);
    if (ang > MAXW && !k.q) loc.copy(new THREE.Quaternion().slerp(loc, MAXW / ang));
    hd.quaternion.copy(loc); hd.updateMatrixWorld(true);
    // 扇子の先を床へ：先の高さ＝高座の上 7 cm（構え）→ 音の瞬間 0（床）。手の行き先を上下にずらして IK を解き直す
    if (false && side === 'right' && A.type === 'knock' && FAN) {
      for (let it = 0; it < 3; it++) {
        vrm.scene.updateMatrixWorld(true);
        const tip = fan.localToWorld(new THREE.Vector3(0, 0.23, 0));
        const want = KOZA_Y + 0.004 + 0.12 * (1 - Math.max(-0.4, Math.min(1, A.tap)));
        T.y += (want - tip.y) * A.w; ik2(side, T, pole);
        hd.parent.getWorldQuaternion(_q2); hd.quaternion.copy(_q2.clone().invert().multiply(qw)); hd.updateMatrixWorld(true);
      }
    }
  }
  placeTenugui(A.D.tenugui, A.D.tenugui ? (A.held ? 1 : 0) : A.w);
}
// ---- 指：右手は扇子を握る（いつも）。左手は所作に合わせて少し曲げる
const FINGERS = ['Index', 'Middle', 'Ring', 'Little'];
let rightGrip = 1;
// 右手の握り：扇子を床に置いた手はゆるめ（0.3）、衿を持つときは軽く握る（0.75）、扇子を持つあいだは握る（1）
function haoriGrip(u) {
  if (HAORI2) {   // 扇子を置いたあと：紐をつまむ（0.55）→ 袖口をつまむ（0.8）→ 腕を抜いたら手をゆるめる（0.3）→ 扇子を取って握る
    if (!(u > HU.lay1 && u < HU.pickC)) return 1;
    const e = Math.min(ease((u - HU.lay1) / 0.03), 1 - ease((u - (HU.pickC - 0.02)) / 0.02));
    const pinch = 0.55 * bump(u, HU.himo0 - 0.02, HU.himo0 + 0.01, HU.himo1, HU.himo1 + 0.03), cuff = 0.8 * bump(u, HU.cuffR - 0.03, HU.cuffR, HU.outR0 + 0.02, HU.outR0 + 0.05);
    return lerp(1, Math.max(0.3, pinch, cuff), e);
  }
  const free = u > HU.lay1 && u < HU.pickC;
  if (!free) return 1;
  const hold = u > HU.grab - 0.03 && u < HU.rel ? 0.75 : 0.3;
  const e = Math.min(ease((u - HU.lay1) / 0.03), 1 - ease((u - (HU.pickC - 0.02)) / 0.02));
  return lerp(1, hold, e);
}
const CURL = Number(q.get('curl') ?? 1.0);
function fingers(A) {
  for (const side of ['right', 'left']) {
    const s = side === 'right' ? 1 : -1;
    const c = side === 'right' ? CURL * rightGrip : (HAORI2 && A.type === 'haori') ? lerp(0.2, haoriGripL(A.u), A.w) : (A.w > 0.01 && A.D.leftCurl != null ? lerp(0.2, A.D.leftCurl, A.w) : A.type === 'rei' ? lerp(0.2, 0.08, A.w) : 0.2);
    FINGERS.forEach((F, i) => {
      const k = [1.15, 1.25, 1.3, 1.35][i] * c;
      const a = B(side + F + 'Proximal'), b = B(side + F + 'Intermediate'), d = B(side + F + 'Distal');
      if (a) a.rotation.set(0, 0, s * k * 0.95); if (b) b.rotation.set(0, 0, s * k * 1.05); if (d) d.rotation.set(0, 0, s * k * 0.7);
    });
    const tm = B(side + 'ThumbMetacarpal') || B(side + 'ThumbProximal'), tpx = B(side + 'ThumbProximal'), td = B(side + 'ThumbDistal');
    if (tm) tm.rotation.set(0, -s * 0.35 * c, s * 0.25 * c);
    if (tpx && tpx !== tm) tpx.rotation.set(0, -s * 0.45 * c, 0);
    if (td) td.rotation.set(0, -s * 0.4 * c, 0);
  }
}
// ---- 羽織と扇子（2026-10-06 夜に組み直し）
// 本人「羽織を下ろすときに、手の動きと羽織の動きが一致していないです。羽織が先に落ちて、手が後からゆっくり動いています。
// しっかり、羽織を脱いで、後ろに置いている仕草を羽織と手の動きをしっかり合わせてください」
// 「羽織を脱ぐときにせんすが消えて、また出てきます。消すのでなく、高座の床に扇子をおいて、扇子は消さずにそこからまた、持ち直してください」
// 運び（u＝羽織の所作の中の進み 0→1。まくらの終わりの台詞を話しながら）：
//   0.00–0.17 右手の扇子を縦にして先を右膝の前の床へ着け、横へ寝かせて置く（体を少し前へ倒す）
//   0.22–0.30 両手で衿を持つ（ここで羽織を体から離して、別の布の形に写す）
//   0.30–0.42 衿を開いて肩から抜く（羽織は手の高さに付いて、肩の外へ開く）
//   0.42–0.60 両手を背へ下ろす（羽織は手といっしょに背へ回り、手の下がった分だけ下がる。座布団に届いた裾は後ろへ寝る）
//   0.60–0.75 右手で後ろの座布団の上へ集めて置く（畳んだ形へ）。左手は膝へ戻る
//   0.85–0.92 体を少し倒して、床の扇子を同じ所から取り上げる
// 2026-10-13 本人「羽織を脱ぐ姿が機械的です。もっと人間らしく。あと話しながら脱いでください。脱ぐときに羽織が浮くのがおかしいです。
// 羽織を脱ぐ動画を研究して実装してください。」→ 調べ＝../../資料/羽織を脱ぐ所作_調べ.md。新しい運び（?haori2=0 で前の運び）：
//   0.00–0.12 右手の扇子を右膝の脇へ置く（体は少し前へ・目はちらりと扇子へ、すぐ客席へ戻す）
//   0.14–0.22 両手を胸の前へ。羽織紐の端をつまんで、右手で引いてほどく
//   0.24–0.31 両手をそれぞれの袖口へ下ろし、指で袖口をつまむ（左は少し遅れる）
//   0.31–0.50 肩を後ろへ回しながら、つまんだ袖口ごと両手を腰の脇・少し後ろへ引く → 羽織が肩から背へすべり落ちる（右が先）
//   0.50–0.62 右腕を前へ抜いて右の腿へ（重さは少し左へ）／0.58–0.70 左腕を抜いて左の腿へ（重さは少し右へ）
//   0.72–0.82 右手で背の後ろの羽織を軽く後ろへ押しやる
//   0.84–0.94 扇子を取り上げる
// そのあいだ声は止めず、顔は客席のまま（手もとを目で追わない）。羽織は布として動かす（kit/haori_cloth.js：体に触れてすべり、重さで背の後ろへ落ちる）
const HAORI2 = q.get('haori2') !== '0';
const HU = HAORI2
  ? { put: 0.06, lay0: 0.06, lay1: 0.10, rel0: 0.12, himo0: 0.16, himo1: 0.21, cuffR: 0.27, cuffL: 0.29, sim: 0.30, shrug0: 0.31, shrug1: 0.44, outR0: 0.45, outR1: 0.54, outL0: 0.51, outL1: 0.60, tuck0: 0.64, tuck1: 0.74, pick0: 0.80, pickC: 0.83, pick1: 0.85, pickUp: 0.89, snap: 9, grab: 9, rel: 9 }   // 第 3 回「6.5 秒はやや長い」→ 肩から落として腕を抜くまでを 2 秒に
  : { put: 0.08, lay0: 0.08, lay1: 0.13, rel0: 0.16, lift: 0.22, grab: 0.29, snap: 0.30, over: 0.42, down: 0.60, gather: 0.68, rel: 0.75, back: 0.81, pick0: 0.84, pickC: 0.87, pick1: 0.89, pickUp: 0.93 };
const FAN_LEN = 0.23;                                                        // 要から先まで（扇子の形の上の端）
const FAN_T = new THREE.Vector3(-0.255, KOZA_Y + ZB_H * 0.22 + 0.085 + 0.0066, 0.17);   // 扇子の要を置く所（右膝の脇・高座の座布団の上）
const HAORI_SPOT = new THREE.Vector3(-0.04, KOZA_Y + ZB_H + 0.012, -0.29);   // 羽織を置く所（後ろの座布団の上）
function k1(keys, u, pole0, side) {
  for (const kk of keys) if (!kk.q) kk.q = handQuatW(side, kk.th, kk.n);
  let i = 0; while (i < keys.length - 2 && u > keys[i + 1].u) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const k = b.u > a.u ? ease((u - a.u) / (b.u - a.u)) : 0;
  const pa = a.pole || pole0, pb = b.pole || pole0;
  const r = { p: a.p.clone().lerp(b.p, k), q: a.q.clone().slerp(b.q, k), pole: pa.clone().lerp(pb, k) };
  if (a.w != null || b.w != null) r.w0 = lerp(a.w ?? 1, b.w ?? 1, k);   // w＝0 の型＝ふだんの膝の上の手（FK）のまま
  return r;
}
// 扇子で床を打つ手：扇子を縦（先が下）に持ち、先が KNOCK_T（右膝の前の床）に着く。tap＝1 で床、0 で 12 cm 上、負は振りかぶり
const KNOCK_T = KNOCK_V1 ? new THREE.Vector3(-0.12, KOZA_Y + 0.004, 0.445) : new THREE.Vector3(-0.17, KOZA_Y + 0.004, 0.40);
const KNOCK_Q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(v3(-1, 0, 0), v3(0, -1, 0), v3(0, 0, 1)));
function knockHand(tap, ch) {
  const qc = ch.getWorldQuaternion(new THREE.Quaternion());
  const hgt = 0.12 * (1 - Math.max(-0.4, Math.min(1, tap)));
  const hf = handForFan(KNOCK_T.clone().add(v3(0, FAN_LEN + hgt, 0)), KNOCK_Q);
  return { R: { p: hf.p, q: hf.q, pole: v3(-0.8, -0.3, -0.3).normalize().applyQuaternion(qc) } };
}
// 礼で扇子を置く所：膝の前、座布団の前の端の上に横向き（中の画で見える所。床の上だと画の外になった）（要を碧の右＝画面の左に、先を左へ）。厚みは上下
const FAN_REI = { p: new THREE.Vector3(0, KOZA_Y + ZB_H * 0.22 + ZB_H * 0.55 + Number(q.get('reify') ?? 0.012), Number(q.get('reifz') ?? 0.385)), q: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(v3(0, 0, 1), v3(1, 0, 0), v3(0, 1, 0))) };
function reiPhase(t) {
  const put = ease((t - END.turn0) / Math.max(0.45, END.turn1 - END.turn0 + 0.05));      // 右手で扇子を床へ（向き直るあいだ）
  const down = ease((t - (END.bow0 - 0.05)) / Math.max(0.5, END.bowDn - END.bow0));        // 両手を床へ（下げはじめと同時）
  return { put, down };
}
function reiHands(t, ch) {
  const qc = ch.getWorldQuaternion(new THREE.Quaternion());
  const Cd = (x, y, z) => v3(x, y, z).normalize().applyQuaternion(qc);
  const { put, down } = reiPhase(t);
  const hov = handForFan(FAN_REI.p.clone().add(v3(0, 0.06, -0.02)), FAN_REI.q), con = handForFan(FAN_REI.p.clone().add(v3(0, 0.004, 0)), FAN_REI.q);
  // 手のひらを下へ、指先を前へ、親指を内へ。扇子の手前（膝との間）の床につく
  const floorY = KOZA_Y + Number(q.get('reiy') ?? 0.115), z = Number(q.get('reiz') ?? 0.335);   // 扇子の手前（膝との間）の座布団の上
  const R_fl = { p: v3(-0.075, floorY + 0.012, z), q: handQuatW('right', v3(1, 0, 0.25), v3(0, -1, 0)), pole: Cd(-0.6, -0.2, -0.8) };
  const L_fl = { p: v3(0.075, floorY + 0.012, z), q: handQuatW('left', v3(-1, 0, 0.25), v3(0, -1, 0)), pole: Cd(0.6, -0.2, -0.8) };
  // 右手：扇子の上へ（hov）→ 置く（con）→ 床の手の形へ
  let R;
  if (put < 1) { const a = ease(put / 0.6), b = ease((put - 0.6) / 0.4);
    R = { p: hov.p.clone().lerp(con.p, b), q: hov.q.clone().slerp(con.q, b), pole: Cd(-0.75, -0.55, -0.25) };
    if (a < 1) R.w0 = a; }
  else R = { p: con.p.clone().lerp(R_fl.p, down), q: con.q.clone().slerp(R_fl.q, down), pole: Cd(-0.75, -0.55, -0.25).lerp(R_fl.pole, down) };
  const L = down > 0.001 ? { p: L_fl.p.clone(), q: L_fl.q.clone(), pole: L_fl.pole, w0: down } : null;
  return { R, L };
}
let reiPut = false;
function haoriHands(u, ch) {
  const qc = ch.getWorldQuaternion(new THREE.Quaternion());
  const C = (x, y, z) => ch.localToWorld(v3(x, y, z));
  const Cd = (x, y, z) => v3(x, y, z).normalize().applyQuaternion(qc);
  const W = (x, y, z) => v3(x, y, z).normalize();
  const restR = { p: C(-0.10, -0.15, 0.30), th: Cd(0, 0, 1), n: Cd(0, -1, 0) };
  const restL = { p: C(0.10, -0.15, 0.30), th: Cd(0, 0, 1), n: Cd(0, -1, 0) };
  // 扇子を床に置く手：手の中の扇子が、そのまま床に寝た形（FAN_LIE）になる手の位置と向き。上は 5 cm 浮かせた形
  const hov = handForFan(FAN_LIE.p.clone().add(v3(0, 0.05, -0.01)), FAN_LIE.q), con = handForFan(FAN_LIE.p, FAN_LIE.q); window.__con = con;
  const R = [
    { u: 0, ...restR },
    { u: HU.put, ...hov }, { u: HU.lay1, ...con }, { u: HU.rel0, ...con, p: con.p.clone().add(v3(0, 0.012, 0)) },
    { u: HU.lift, p: C(-0.10, -0.08, 0.26), th: Cd(0, 0.5, 1), n: Cd(0.3, -1, 0) },
    { u: HU.grab, p: C(-0.075, 0.06, 0.15), th: Cd(0, 1, 0), n: Cd(0.3, 0, -1) },
    { u: HU.over, p: C(-0.20, 0.10, 0.02), th: Cd(0, 1, -0.2), n: Cd(0.4, -0.2, -1) },
    { u: HU.down, p: C(-0.20, -0.33, -0.04), th: Cd(0, 0.3, -1), n: Cd(0.8, 0, 0.2), pole: Cd(-0.3, 0.1, -1) },
    { u: HU.gather, p: C(-0.22, -0.32, -0.15), th: Cd(0, 0, -1), n: Cd(0.2, -1, 0), pole: Cd(-0.5, 0.2, -0.8) },
    { u: HU.rel, p: C(-0.18, -0.34, -0.18), th: Cd(0, 0, -1), n: Cd(0.2, -1, 0), pole: Cd(-0.5, 0.2, -0.8) },
    { u: HU.back, ...restR },
    { u: HU.pick0, ...hov }, { u: HU.pickC, ...con }, { u: HU.pick1, ...con }, { u: HU.pickUp, ...hov, p: hov.p.clone().add(v3(0, 0.04, -0.03)) },
    { u: 1, ...restR },
  ];
  const Lk = [
    { u: 0, ...restL }, { u: HU.lift, ...restL },
    { u: HU.grab, p: C(0.075, 0.06, 0.15), th: Cd(0, 1, 0), n: Cd(-0.3, 0, -1) },
    { u: HU.over, p: C(0.20, 0.10, 0.02), th: Cd(0, 1, -0.2), n: Cd(-0.4, -0.2, -1) },
    { u: HU.down, p: C(0.20, -0.33, -0.04), th: Cd(0, 0.3, -1), n: Cd(-0.8, 0, 0.2), pole: Cd(0.3, 0.1, -1) },
    { u: HU.rel, ...restL }, { u: 1, ...restL },
  ];
  return { R: k1(R, u, Cd(-0.75, -0.55, -0.25), 'right'), L: k1(Lk, u, Cd(0.75, -0.55, -0.25), 'left') };
}
// ---- 新しい運び（HAORI2）：手の道すじ。胸から見た位置（x＋が碧の左）。腕は横へ広げない（肘は脇のそば・腰の高さより上へ上げない）
function haoriGripL(u) {
  const pinch = 0.6 * bump(u, HU.himo0 - 0.02, HU.himo0 + 0.01, HU.himo1, HU.himo1 + 0.03), cuff = 0.8 * bump(u, HU.cuffL - 0.03, HU.cuffL, HU.outL0 + 0.02, HU.outL0 + 0.05);
  return Math.max(0.25, pinch, cuff);
}
function haoriHands2(u, ch) {
  const qc = ch.getWorldQuaternion(new THREE.Quaternion());
  const C = (x, y, z) => ch.localToWorld(v3(x, y, z));
  const Cd = (x, y, z) => v3(x, y, z).normalize().applyQuaternion(qc);
  const restR = { p: C(-0.10, -0.15, 0.30), th: Cd(0, 0, 1), n: Cd(0, -1, 0), w: 0 };   // w：0＝ふだんの膝の上の手のまま
  const restL = { p: C(0.10, -0.15, 0.30), th: Cd(0, 0, 1), n: Cd(0, -1, 0), w: 0 };
  const hov = handForFan(FAN_LIE.p.clone().add(v3(0, 0.05, -0.01)), FAN_LIE.q), con = handForFan(FAN_LIE.p, FAN_LIE.q);
  // 羽織紐（胸の前）：両手の指先で結び目の両端をつまみ、右手で斜め下へ引いてほどく
  // 両手は組まない（指先だけが紐の両端に触れる。右手は少し前・左手は少し下）
  const himoR = { p: C(-0.05, -0.03, 0.17), th: Cd(0.35, 0.9, 0.2), n: Cd(0.6, 0, -0.8) }, himoL = { p: C(0.055, -0.05, 0.15), th: Cd(-0.35, 0.9, 0.2), n: Cd(-0.6, 0, -0.8) };
  const tugR = { p: C(-0.13, -0.09, 0.20), th: Cd(0.2, 0.7, 0.6), n: Cd(0.6, -0.2, -0.8) };
  // 袖口をつまむ（腿の脇・手のひらは内へ）→ 腰の脇の少し後ろへ引く（肘は後ろへ）
  const cuffR = { p: C(-0.17, -0.28, 0.13), th: Cd(0, -0.1, 1), n: Cd(1, -0.3, 0) }, cuffL = { p: C(0.17, -0.28, 0.13), th: Cd(0, -0.1, 1), n: Cd(-1, -0.3, 0) };
  const midR = { p: C(-0.19, -0.33, 0.03), th: Cd(0, -0.3, 1), n: Cd(1, -0.2, 0), pole: Cd(-0.5, -0.2, -0.85) }, midL = { p: C(0.19, -0.33, 0.03), th: Cd(0, -0.3, 1), n: Cd(-1, -0.2, 0), pole: Cd(0.5, -0.2, -0.85) };
  const backR = { p: C(-0.19, -0.37, -0.06), th: Cd(0, -0.5, 0.8), n: Cd(1, 0, 0), pole: Cd(-0.4, 0, -1) }, backL = { p: C(0.19, -0.37, -0.06), th: Cd(0, -0.5, 0.8), n: Cd(-1, 0, 0), pole: Cd(0.4, 0, -1) };
  // 背の後ろの羽織を、右手の甲で軽く後ろへ
  const tuckR = { p: C(-0.21, -0.38, -0.19), th: Cd(0, -0.2, -1), n: Cd(0.3, -1, 0), pole: Cd(-0.6, 0.1, -0.7) };
  const R = [
    { u: 0, ...restR },
    { u: HU.put, ...hov }, { u: HU.lay1, ...con }, { u: HU.rel0, ...con, p: con.p.clone().add(v3(0, 0.012, 0)) },
    { u: HU.himo0, ...himoR }, { u: HU.himo0 + 0.025, ...himoR }, { u: HU.himo1, ...tugR },
    { u: HU.cuffR, ...cuffR }, { u: HU.shrug0, ...cuffR }, { u: (HU.shrug0 + HU.shrug1) / 2, ...midR }, { u: HU.shrug1, ...backR }, { u: HU.outR0, ...backR },
    { u: HU.outR0 + 0.05, p: C(-0.17, -0.30, 0.12), th: Cd(0, -0.2, 1), n: Cd(0.6, -0.8, 0) }, { u: HU.outR1, ...restR },
    { u: HU.tuck0, ...restR }, { u: (HU.tuck0 + HU.tuck1) / 2, ...tuckR }, { u: HU.tuck1, ...restR },
    { u: HU.pick0, ...hov }, { u: HU.pickC, ...con }, { u: HU.pick1, ...con }, { u: HU.pickUp, ...hov, p: hov.p.clone().add(v3(0, 0.04, -0.03)) },
    { u: 1, ...restR },
  ];
  const Lk = [
    { u: 0, ...restL }, { u: 0.13, ...restL },
    { u: HU.himo0 + 0.01, ...himoL }, { u: HU.himo1, ...himoL, p: C(0.05, -0.01, 0.17) },
    { u: HU.cuffL, ...cuffL }, { u: HU.shrug0 + 0.02, ...cuffL }, { u: (HU.shrug0 + HU.shrug1) / 2 + 0.025, ...midL }, { u: HU.shrug1 + 0.03, ...backL }, { u: HU.outL0, ...backL },
    { u: HU.outL0 + 0.05, p: C(0.17, -0.30, 0.12), th: Cd(0, -0.2, 1), n: Cd(-0.6, -0.8, 0) }, { u: HU.outL1, ...restL },
    { u: 1, ...restL },
  ];
  return { R: k1(R, u, Cd(-0.75, -0.55, -0.25), 'right'), L: k1(Lk, u, Cd(0.75, -0.55, -0.25), 'left') };
}
// 体：扇子を置く・取るときだけ少し前へ／袖口を引くあいだ肩を後ろへ回して胸を開く／腕を抜く側と逆へ重さを移し、抜く側の肩を前へ
function haoriBody(u, w) {
  const sR = bump(u, HU.shrug0 - 0.02, HU.shrug0 + 0.07, HU.outR0, HU.outR0 + 0.08) * w, sL = bump(u, HU.shrug0 + 0.01, HU.shrug0 + 0.10, HU.outL0, HU.outL0 + 0.08) * w;
  const r = (n, x, y, z) => { const b = B(n); if (b) { b.rotation.x += x; b.rotation.y += y; b.rotation.z += z; } };
  r('rightShoulder', 0, -0.20 * sR, -0.07 * sR); r('leftShoulder', 0, 0.20 * sL, 0.07 * sL);   // 肩を後ろへ回して少し上げる
  const op = Math.max(sR, sL); r('upperChest', -0.05 * op, 0, 0); r('chest', -0.03 * op, 0, 0);    // 胸を開く
  const pR = bump(u, HU.outR0 - 0.02, HU.outR0 + 0.04, HU.outR1 - 0.03, HU.outR1 + 0.03) * w, pL = bump(u, HU.outL0 - 0.02, HU.outL0 + 0.04, HU.outL1 - 0.03, HU.outL1 + 0.03) * w;
  const tk = bump(u, HU.tuck0, HU.tuck0 + 0.04, HU.tuck1 - 0.04, HU.tuck1) * w;
  const roll = -0.035 * pR + 0.035 * pL, twist = 0.06 * pR - 0.06 * pL - 0.08 * tk;
  r('spine', 0, twist * 0.5, roll); r('chest', 0, twist * 0.5, roll * 0.5);
  r('neck', 0, -twist * 0.5, -roll * 0.6); r('head', 0, -twist * 0.45, -roll * 0.5);   // 顔は客席のまま
}
// 体を前へ倒す量（扇子を置く・取るとき）
function bump(u, a, b, c, d) { return ease((u - a) / (b - a)) * (1 - ease((u - c) / (d - c))); }
function haoriLean(u) { return HAORI2 ? 0.6 * (bump(u, 0.0, 0.05, 0.10, 0.15) + bump(u, HU.pick0 - 0.01, HU.pick0 + 0.025, HU.pick1 + 0.005, HU.pickUp + 0.02)) : bump(u, 0.0, 0.07, 0.17, 0.24) + bump(u, 0.78, 0.84, 0.91, 0.98); }
// 扇子が床にある度合い（0＝手の中、1＝床に寝ている）
function fanFloor(u) {
  if (u < HU.lay0 || u > HU.pick1) return 0;
  if (u < HU.lay1) return ease((u - HU.lay0) / (HU.lay1 - HU.lay0));
  if (u < HU.pickC) return 1;
  return 1 - ease((u - HU.pickC) / (HU.pick1 - HU.pickC));
}
function haoriU(t) { if (!TL.haori || !haoriMeshes.length) return -1; const [t0, t1] = TL.haori; return (t - t0) / (t1 - t0); }
let haoriObj = null;
// pose() の中（骨を動かす前）：体に付いた羽織を見せるかどうかだけ
function haoriAt(t) {
  if (!TL.haori || !haoriMeshes.length) return;
  const on = haoriU(t) < HU.snap;
  for (const m of haoriMeshes) m.visible = on;
}
// 衿を持った瞬間（u＝snap）の羽織の形を写し取る。何度描いても同じ形になるよう、その時刻の姿勢をいったん作って写す
function haoriSnap(t) {
  const [t0, t1] = TL.haori, ts = t0 + (HU.snap - 1e-4) * (t1 - t0);
  pose(ts); vrm.update(0); vrm.scene.updateMatrixWorld(true); clothLastT = null; clothUpdate(ts);
  const O = CHEST().getWorldPosition(new THREE.Vector3());
  const hr = B('rightHand').getWorldPosition(new THREE.Vector3()), hl = B('leftHand').getWorldPosition(new THREE.Vector3());
  const grp = new THREE.Group(); const v = new THREE.Vector3(); const all = [];
  for (const m of haoriMeshes) {
    const g = m.geometry, n = g.attributes.position.count;
    const cl = clothes.find(c => c.m === m);
    let pos;
    if (cl) pos = cl.proxy.geometry.attributes.position.array.slice();
    else { pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { m.getVertexPosition(i, v); v.applyMatrix4(m.matrixWorld); pos.set([v.x, v.y, v.z], i * 3); } }
    const ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.BufferAttribute(pos.slice(), 3));
    if (g.attributes.uv) ng.setAttribute('uv', g.attributes.uv); if (g.index) ng.setIndex(g.index);
    for (const gr of g.groups) ng.addGroup(gr.start, gr.count, gr.materialIndex);
    ng.computeVertexNormals();
    const mesh = new THREE.Mesh(ng, Array.isArray(m.material) ? m.material.map(solidHaori) : solidHaori(m.material)); mesh.frustumCulled = false; mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.userData.base = pos; grp.add(mesh); all.push(mesh);
  }
  const bb = new THREE.Box3(); for (const m of all) { m.geometry.computeBoundingBox(); bb.union(m.geometry.boundingBox); }
  const c = bb.getCenter(new THREE.Vector3()), H = bb.max.y - bb.min.y;
  for (const m of all) {
    const b = m.userData.base, n = b.length / 3, fold = new Float32Array(n * 3), th = new Float32Array(n), r = new Float32Array(n), h = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = b[i * 3], y = b[i * 3 + 1], z = b[i * 3 + 2];
      h[i] = (y - bb.min.y) / H; th[i] = Math.atan2(x - O.x, z - O.z); r[i] = Math.hypot(x - O.x, z - O.z);
      // 畳んだ形：身幅を 4 割に、丈を前後に寝かせる（後ろの座布団の上）
      const fx = HAORI_SPOT.x + (x - c.x) * 0.70, fz = HAORI_SPOT.z + (0.5 - h[i]) * 0.28 + (z - c.z) * 0.12;
      const fy = HAORI_SPOT.y + 0.014 * (0.5 + 0.5 * Math.sin(x * 37 + z * 23)) + 0.02 * Math.abs(x - c.x);
      fold.set([fx, fy, fz], i * 3);
    }
    Object.assign(m.userData, { fold, th, r, h });
  }
  grp.userData = { O, hy0: (hr.y + hl.y) / 2 };
  scene.add(grp);
  pose(t); vrm.update(0); vrm.scene.updateMatrixWorld(true); clothLastT = null; clothUpdate(t);
  return grp;
}
// 骨を動かしたあと（renderAt）：手の実際の高さから羽織の形を決める
function haoriPost(t) {
  const u = haoriU(t);
  if (u < 0 && !TL.haori) return;
  if (u < HU.snap) { if (haoriObj) haoriObj.visible = false; return; }
  if (!haoriObj) haoriObj = haoriSnap(t);
  haoriObj.visible = true;
  if (HAORI_MODE === 'a') haoriFade(HAORI_FADE > 0 ? ease(Math.min(1, (u - HU.snap) * (TL.haori[1] - TL.haori[0]) / HAORI_FADE)) : 1);
  const S = haoriObj.userData, O = S.O;
  const hr = B('rightHand').getWorldPosition(new THREE.Vector3()), hl = B('leftHand').getWorldPosition(new THREE.Vector3());
  const s1 = ease((u - HU.snap) / (HU.over - HU.snap)), s2 = ease((u - HU.over) / (HU.down - HU.over));
  const s3 = ease((u - HU.down) / (HU.rel - HU.down));
  // 衿の高さは、持っている手の高さに付いてくる（両手で持つあいだは両手の真ん中、右手で集めるときは右手）
  const hy = u < HU.down ? (hr.y + hl.y) / 2 : lerp((hr.y + hl.y) / 2, hr.y, ease((u - HU.down) / 0.05));
  const dy = S.hy0 - hy;
  const floorY = KOZA_Y + ZB_H + 0.008;
  for (const m of haoriObj.children) {
    const b = m.userData.base, f = m.userData.fold, P = m.geometry.attributes.position, TH = m.userData.th, R0 = m.userData.r, Hh = m.userData.h;
    for (let i = 0; i < P.count; i++) {
      const th = TH[i], hh = Hh[i];
      // 肩から抜く：衿を外へ開き（s1）、背へ回す（s2：前身頃が脇を通って後ろへ）
      const r1 = Math.max(R0[i], 0.14) * (1 + 0.22 * s1) + 0.05 * s2;
      const th1 = th + Math.sign(th) * (Math.PI - Math.abs(th)) * 0.78 * s2;
      let y1 = b[i * 3 + 1] + 0.02 * s1 * (1 - s2) - dy * (0.55 + 0.45 * hh);
      let x1 = O.x + r1 * Math.sin(th1), z1 = O.z + r1 * Math.cos(th1);
      if (y1 < floorY) { const ex = floorY - y1; y1 = floorY + 0.004 * hh; z1 -= ex * 0.9; }   // 座布団に届いた裾は、後ろへ寝る
      // 右手で集めて、後ろの座布団の上へ置く
      const k = s3;
      P.setXYZ(i, x1 + (f[i * 3] - x1) * k, y1 + (f[i * 3 + 1] - y1) * k, z1 + (f[i * 3 + 2] - z1) * k);
    }
    P.needsUpdate = true; if ((Math.round(u * 600) % 2) === 0 || u > HU.rel) m.geometry.computeVertexNormals();
  }
}
// 扇子：床に置くあいだは、手の中の扇子と同じ形の「置いた扇子」を見せる（消えない）。手の中の形から床に寝た形へ、なめらかに移す
let fanFree = null;
const _fp = new THREE.Vector3(), _fq = new THREE.Quaternion(), _fs = new THREE.Vector3(), _q3 = new THREE.Quaternion();
let fanRei = null;
window.__rei = () => ({ hr: B('rightHand').getWorldPosition(new THREE.Vector3()).toArray().map(x=>+x.toFixed(3)), hl: B('leftHand').getWorldPosition(new THREE.Vector3()).toArray().map(x=>+x.toFixed(3)), sh: B('rightUpperArm').getWorldPosition(new THREE.Vector3()).toArray().map(x=>+x.toFixed(3)), solid: [..._solid.values()].map(m => [m.type, m.color && m.color.getHexString(), m.uniforms && Object.keys(m.uniforms).filter(k=>/lit|color/i.test(k)).join(',')]), reiPut, vis: fanRei && fanRei.visible, p: fanRei && fanRei.getWorldPosition(new THREE.Vector3()).toArray(), fanVis: fan.visible, END });
function fanPost(t) {
  if (!FAN) return;
  if (REI_ON) { if (!fanRei) { fanRei = fan.clone(); fanRei.matrixAutoUpdate = false; scene.add(fanRei);
      fanRei.matrix.compose(FAN_REI.p, FAN_REI.q, v3(1, 1, 1)); fanRei.matrixWorldNeedsUpdate = true; fanRei.updateMatrixWorld(true); }
    fanRei.visible = reiPut; if (reiPut) { fan.visible = false; if (fanFree) fanFree.visible = false; if (fanPlaced) fanPlaced.visible = false; return; } }
  putFan(bookPut);
  if (bookPut) return;
  const u = haoriU(t), b = u >= 0 ? fanFloor(u) : 0;
  if (!fanFree) { fanFree = fan.clone(); fanFree.matrixAutoUpdate = false; scene.add(fanFree); }
  if (b <= 0) { fanFree.visible = false; fan.visible = true; return; }
  fan.visible = false; fanFree.visible = true;
  // 床に寝た形（FAN_LIE）。手が床に下りるあいだに、手の中の形から寝た形へ移る（手が届いていれば、ほとんど動かない）
  fan.matrixWorld.decompose(_fp, _fq, _fs);
  fanFree.matrix.compose(_fp.clone().lerp(FAN_LIE.p, b), _fq.clone().slerp(FAN_LIE.q, b), v3(1, 1, 1));
  fanFree.matrixWorldNeedsUpdate = true; fanFree.updateMatrixWorld(true);
}
function putFan(put) {
  if (!fanPlaced) { fanPlaced = fan.clone(); fanPlaced.scale.set(1, 1, 1); scene.add(fanPlaced);
    fanPlaced.position.set(0.02, KOZA_Y + 0.008, 0.47); fanPlaced.rotation.set(0, 0, 0); fanPlaced.rotateX(-Math.PI / 2); fanPlaced.rotateZ(-Math.PI / 2 + 0.15); }
  fan.visible = !put; fanPlaced.visible = put;
}
let fanPlaced = null;

// ---- 手拭い：ふだんは高座の上。所作で左手へ（本＝広げて両手のあいだ／帳面・財布＝左の手のひら）
let tenuguiRest = null;
function placeTenugui(kind, w) {
  if (!tenugui) return;
  if (!tenuguiRest) tenuguiRest = { p: tenugui.position.clone(), q: tenugui.quaternion.clone(), s: tenugui.scale.clone() };
  if (!kind || w <= 0.01) { tenugui.position.copy(tenuguiRest.p); tenugui.quaternion.copy(tenuguiRest.q); tenugui.scale.copy(tenuguiRest.s); return; }
  const lh = B('leftHand'), rh = B('rightHand');
  const lp = lh.getWorldPosition(new THREE.Vector3()), lq = lh.getWorldQuaternion(new THREE.Quaternion());
  let p, qq, sc;
  if (kind === 'book') {
    const rp = rh.getWorldPosition(new THREE.Vector3());
    p = lp.clone().lerp(rp, 0.5).add(v3(0, 0.03, 0.02));
    qq = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.7, 0, 0)); sc = v3(1.05, 0.6, 2.1);
  } else {
    p = lp.clone().add(v3(0, 0.025, 0.0).applyQuaternion(lq).add(v3(0, 0.02, 0)));
    qq = lq.clone(); sc = kind === 'fold' ? v3(0.55, 2.2, 1.2) : v3(0.9, 1, 1.6);
  }
  const k = ease(w);
  tenugui.position.copy(tenuguiRest.p.clone().lerp(p, k));
  tenugui.quaternion.copy(tenuguiRest.q.clone().slerp(qq, k));
  tenugui.scale.copy(tenuguiRest.s.clone().lerp(sc, k));
}

function pose(t) {
  basePose();
  const fi = Math.min(TL.mouth.length - 1, Math.max(0, Math.round(t * TL.fps)));
  const yaw = yawAt(t), bow = bowAt(t);
  const br = Math.sin(t * 2 * Math.PI / 4.4);
  const sway = 0.012 * Math.sin(t * 0.7) + 0.008 * Math.sin(t * 1.9 + 1.3);
  const nod = 0.02 * Math.sin(t * 1.3 + 0.4) + 0.05 * (TL.mouth[fi] || 0) * Math.sin(t * 9.0);  // 話しながら小さくうなずく
  rot('hips', 0, 0, 0);
  const rb = (REI_ON && FAN && t > END.turn0) ? bow : 0;   // 2026-10-07 礼で両手を座布団につくぶん、深く下げる
  rot('spine', 0.04 + 0.46 * bow + 0.30 * rb, yaw * 0.18, sway * 0.5);   // 2026-10-06 お辞儀を深く（落語好き「浅い会釈」）
  rot('chest', -0.012 * br + 0.12 * bow + 0.10 * rb, yaw * 0.20, sway * 0.5);
  rot('upperChest', -0.010 * br, yaw * 0.10, 0);
  rot('neck', 0.03 + 0.12 * bow + nod * 0.4, yaw * 0.25, sway);
  rot('head', 0.04 + 0.14 * bow + nod, yaw * 0.34 + 0.03 * Math.sin(t * 0.53 + 2.0), sway * 0.8 - yaw * 0.12);
  // 腕：膝の上へ（FK）。手振りのときは前腕を起こす。所作（見立て・羽織）のときは手の行き先を決めて IK で腕を解く
  const A = actAt(t);
  const G = A.w > 0.01 ? { g: 0, side: 0 } : gestureAt(t);
  for (const [s, side] of [[1, 'left'], [-1, 'right']]) {
    const active = (G.side === s) ? G.g : 0;
    rot(side + 'Shoulder', 0, 0, s * 0.006 * br);
    rot(side + 'UpperArm', P.uaX - 0.20 * active - 0.30 * bow, s * (P.uaY + 0.10 * active), -s * (P.uaZ - 0.10 * active));
    rot(side + 'LowerArm', 0, s * (P.laY - 0.75 * active + 0.30 * bow), s * P.laZ);
    rot(side + 'Hand', 0, s * 0.06 * active, -s * (P.handX + 0.05 * active));   // 手振りでも手首は折らない
  }
  // 上下の目線の高さ：目上（大家）はやや見下ろし、目下（八っつぁん）はやや見上げる
  const lr = roleAt(t);
  const tilt = (lr === 'ooya' ? 0.05 : lr === 'hachi' ? -0.06 : 0) * (1 - (A.w || 0));
  B('head').rotation.x += tilt + (A.headX || 0) * (A.w || 0); B('neck').rotation.x += (A.neckX || 0) * (A.w || 0);
  B('chest').rotation.x += (A.chestX || 0) * (A.w || 0); B('spine').rotation.x += (A.spineX || 0) * (A.w || 0);   // 床を打つときは前へかがむ
  // 羽織の所作：扇子を床へ置く・取るときに、体を前へ倒し（およそ 37°）、目は扇子へ
  const hl_ = A.type === 'haori' ? haoriLean(A.u) * A.w : 0;
  if (hl_ > 0) { const LK = Number(q.get('leank') ?? 1.1); B('hips').rotation.x += 0.0 * hl_; B('spine').rotation.x += 0.62 * LK * hl_; B('chest').rotation.x += 0.30 * LK * hl_; B('upperChest').rotation.x += 0.14 * LK * hl_; B('head').rotation.x -= (HAORI2 ? 0.62 : 0.38) * hl_; B('neck').rotation.x -= (HAORI2 ? 0.28 : 0.12) * hl_; }   // 新しい運び：体は倒しても顔は起こしたまま（目だけちらりと扇子へ）
  if (HAORI2 && A.type === 'haori') haoriBody(A.u, Math.min(1, A.w));
  rightGrip = A.type === 'haori' ? haoriGrip(A.u) : 1;
  if (A.type === 'rei') { const ph = reiPhase(t); reiPut = ph.put >= 0.999; rightGrip = reiPut ? lerp(0.3, 0.12, ph.down) : 1; }
  else if (REI_ON && FAN && t > END.turn1) { reiPut = true; rightGrip = 0.3; }
  else reiPut = false;
  applyAct(A, t);
  fingers(A);
  haoriAt(t);
  // 視線：客席の真ん中か、話し相手の向き（第 4 版はカメラの位置＝客席の真ん中だった）
  const gp = AUD.clone(); gp.x += Math.sin(yaw) * 3.2; gp.y -= 0.2 * bow; gp.y += (lr === 'ooya' ? -0.35 : lr === 'hachi' ? 0.3 : 0);
  if (A.w > 0.01 && A.gaze) gp.lerp(A.gaze, A.w);
  if (hl_ > 0) gp.lerp(FAN_T, HAORI2 ? Math.min(0.55, hl_ * 1.1) : Math.min(1, hl_ * 1.3));   // 新しい運び：扇子へはちらりと（目はすぐ客席へ）
  gaze.position.copy(gp);
  // 口
  const em = vrm.expressionManager;
  const m = MOUTH[fi] || 0, vw = TL.vowel[fi] || 'aa';
  for (const k of ['aa', 'ih', 'ou', 'ee', 'oh']) em.setValue(k, 0);
  if (MORA_LIP) {
    // 2026-10-07 夜：拍の母音（timeline.vowel）を前後 1 コマと混ぜて、形がぱっと替わらないように（ん・っ＝nn は閉じぎみ）
    const W = {}; for (const [d, w] of [[-1, 0.25], [0, 0.5], [1, 0.25]]) { const x = TL.vowel[fi + d] || vw; W[x] = (W[x] || 0) + w; }
    const base = Math.min(1, m * 0.85);
    for (const [k, w] of Object.entries(W)) { if (k === 'nn') continue; em.setValue(k, em.getValue(k) + base * (VCAP[k] ?? 1) * w); }
    em.setValue('aa', Math.min(1, em.getValue('aa') + base * 0.12 * (1 - (W.aa || 0)) * (1 - (W.nn || 0))));
  } else {
    const amt = Math.min(1, m * 0.85) * (VCAP[vw] ?? 1);
    em.setValue(vw, amt);
    if (vw !== 'aa') em.setValue('aa', amt * 0.25);
  }
  // 閉じた目が吊り目に見える件（本人 2026-10-04）は VRM の閉じる形が直った（2026-10-05 00:10・3cc84bd9）ので、まばたきは閉じきる。お辞儀は伏し目 0.35
  const BLK = Number(q.get('blk') ?? 1.0);
  em.setValue('blink', bow > 0.6 ? 0.35 : blinkAt(t) * BLK);
  em.setValue('relaxed', t > END.bowUp0 ? 0.18 + 0.22 * ease((t - END.bowUp0) / 1.0) : 0.18);   // 上げたあとの余韻は、少しやわらかい顔で
  // 字・札
  const S_ = subAt(t);
  if (sub.dataset.s !== S_.c) {
    sub.dataset.s = S_.c;
    // 一字ずつの箱にする（<br> は残す）。左右の置き場は、切れの番号で中→左→右と静かに替える
    // 2026-10-06 検証役 6 人中 5 人「英語字幕の単語の間の空白が消えている」：空白一字の inline-block は幅 0 に潰れるので、
    // 空白は箱にせず文字のまま置く（行の中の空白は折り返さない＝箱は nowrap）。置き場は中央に固定（「毎行ジャンプする」）
    let k = 0; sub.innerHTML = wrap(S_.c).split('<br>').map(row => [...row.replace(/&amp;/g, '&').replace(/&lt;/g, '<')].map(ch => ch === ' ' ? ' ' : `<span class="c" data-k="${k++}">${esc(ch)}</span>`).join('')).join('<br>');
    sub._cs = [...sub.querySelectorAll('.c')]; subWrap.className = 'm';
  }
  {
    // 2026-10-06「言い終わるまで後ろ半分が読めない」→ 一行ぜんぶが 0.4 秒ほどで出そろう
    const p = S_.p || 0, n = (sub._cs || []).length, per = Math.min(0.012, 0.2 / Math.max(1, n));
    for (const [j, el] of (sub._cs || []).entries()) {
      const a = Math.max(0, Math.min(1, (p - j * per) / 0.1)), e = a * a * (3 - 2 * a);
      el.style.opacity = e.toFixed(3); el.style.filter = e < 0.99 ? `blur(${((1 - e) * 5).toFixed(1)}px)` : 'none';
    }
    // 2026-10-05 本人「表示してから文字サイズを変えたり移動したりはしないでください」：字の間・大きさ・位置は出たあと動かさない
    sub.style.letterSpacing = (EN ? 0.02 : 0.08) + 'em';
  }
  sub.style.opacity = S_.a; sub.style.transform = 'none';
  subband.style.opacity = Math.max(0, S_.a * (1 - Number(titleEl.style.opacity || 0)) - Number(creditEl.style.opacity || 0));
  titleEl.style.opacity = t < TL.title_sec - 0.6 ? 1 : 1 - ease((t - (TL.title_sec - 0.6)) / 0.6);
  creditEl.style.opacity = ease((t - (TL.bow_end + 0.2)) / 0.8);
  if (window.__RKL) window.__RKL.pose(t);
}

// ---- 扇子（閉じた扇子を右手に持たせる）。休めの姿勢で、手から膝の前へ斜めに出る向きを世界で決め、手の骨に付ける
const fan = new THREE.Group();
{
  const c = document.createElement('canvas'); c.width = 64; c.height = 512; const g = c.getContext('2d');
  // 2026-10-05 本人「扇子の持つ向きが違います…持ち手の部分でなく、扇子の部分を握っていました」：
  // 手で握る要（かなめ）の側＝骨だけ（下 3 割）、先の側＝地紙の小口（上 7 割）。画像の上が扇子の先
  g.fillStyle = '#3a2416'; g.fillRect(0, 0, 64, 512);                         // 親骨（竹を煤けさせた色）
  g.fillStyle = '#d9cfb3'; g.fillRect(6, 0, 52, 360);                          // 地紙の小口（先の側）
  g.fillStyle = 'rgba(60,40,20,.5)'; for (let x = 10; x < 58; x += 5) g.fillRect(x, 0, 1, 360);
  g.fillStyle = '#2a1a10'; for (let x = 8; x < 58; x += 6) g.fillRect(x, 360, 2, 152);   // 要の側の中骨
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.27, 0.013), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }));
  body.position.y = 0.135 - 0.04;   // 要（かなめ）を手の中に
  body.castShadow = true; fan.add(body);
  const kaname = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.016, 12), new THREE.MeshStandardMaterial({ color: 0xb08a4a, metalness: 0.6, roughness: 0.4 }));
  kaname.rotation.z = Math.PI / 2; kaname.position.y = -0.03; fan.add(kaname);
}
const FAN = Number(q.get('fan') ?? 1);
function attachFan() {
  // 2026-10-04 夜 本人「扇子を手でしっかり保つように。今は、手を開いたまま、手の甲にくっついています」：
  // T ポーズ（正規化の骨をすべて 0）で、手のひらの真ん中（手首と中指の付け根のあいだ・手のひら側）に要を置き、
  // 扇子を親指の向き（握った拳から親指の側へ出る向き）へ向けて、生の手の骨に付ける。指は fingers() で握る
  const hand = vrm.humanoid.getRawBoneNode('rightHand');
  const mid = vrm.humanoid.getRawBoneNode('rightMiddleProximal');
  if (!hand) return;
  vrm.humanoid.resetNormalizedPose(); vrm.update(0); vrm.scene.updateMatrixWorld(true);
  const hp = hand.getWorldPosition(new THREE.Vector3());
  const mp = mid ? mid.getWorldPosition(new THREE.Vector3()) : hp.clone().add(new THREE.Vector3(-0.08, 0, 0));
  const grip = hp.clone().lerp(mp, Number(q.get('fl') ?? 1.05)); grip.y -= Number(q.get('fy') ?? 0.028); grip.z += Number(q.get('fz') ?? -0.005);
  const qd = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1));   // 扇子の軸＝親指の向き（T ポーズで前）
  const qh = hand.getWorldQuaternion(new THREE.Quaternion());
  hand.add(fan);
  fan.position.copy(hand.worldToLocal(grip.clone()));
  fan.quaternion.copy(qh.clone().invert().multiply(qd));
  const ws = hand.getWorldScale(new THREE.Vector3()); fan.scale.set(1 / ws.x, 1 / ws.y, 1 / ws.z);
  basePose(); pose(TL.title_sec + 0.5); vrm.update(1 / 30);
}
if (FAN) attachFan();
// 扇子を床に置く形（手の中の扇子の向きのまま床へ寝かせる）と、その形になる手の位置・向き（2026-10-06 夜）
let FAN_D = new THREE.Quaternion(), FAN_LIE = { p: FAN_T.clone(), q: new THREE.Quaternion() };
function fanSetup() {
  vrm.humanoid.resetNormalizedPose(); vrm.update(0); vrm.scene.updateMatrixWorld(true);
  const rq = vrm.humanoid.getRawBoneNode('rightHand').getWorldQuaternion(new THREE.Quaternion());
  const nq = B('rightHand').getWorldQuaternion(new THREE.Quaternion());
  FAN_D = nq.clone().invert().multiply(rq);   // 生の手＝正規化の手 × FAN_D
  basePose(); pose(TL.title_sec + 0.5); vrm.update(1 / 30); vrm.scene.updateMatrixWorld(true);
  const qr = fan.getWorldQuaternion(new THREE.Quaternion());
  const ty = v3(-0.12, 0, 1).normalize();   // 先を前へ（膝に掛からない向き）
  const up = v3(0, 0, 1).applyQuaternion(qr).y >= 0 ? v3(0, 1, 0) : v3(0, -1, 0);   // 厚みの向きを上下に（手の甲の側を残す）
  const xw = new THREE.Vector3().crossVectors(ty, up);
  FAN_LIE = { p: FAN_T.clone(), q: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xw, ty, up)) };
}
function handForFan(p, qf) {
  fan.updateMatrix();
  const Mh = new THREE.Matrix4().compose(p, qf, v3(1, 1, 1)).multiply(fan.matrix.clone().invert());
  const hp = new THREE.Vector3(), hq = new THREE.Quaternion(), hs = new THREE.Vector3(); Mh.decompose(hp, hq, hs);
  return { p: hp, q: hq.multiply(FAN_D.clone().invert()) };
}
if (FAN) fanSetup();

// ============================================================================================
// 袖（袂）を布として動かす（2026-10-06 夜 本人「腕を上げるとやはり袖の形が変形してしまいます」
// 「腕の下が完全に埋まっていますが、これらも３dモデルで作って、腕を上げたら、服が捲れるような作りに…リアルさを追求したい」）
// VRoid の着物・羽織の袖は腕の骨にだけ固く付いていて、腕を上げると袂（たもと）が腕といっしょに持ち上がり、板のように開いていた。
// ここでは着物と羽織を毎コマ自前で変形した写し（ふつうの Mesh）に置き換え、袖の部分に布の重さを足す：
//   ①袂（腕より下に垂れている所）は、腕の線を軸に、いつも真下へ垂れる向きへ回し戻す（腕を上げても袂は下に垂れ、脇の下があく）
//   ②前腕が上を向くと、袖口は肘の側へすべり落ちて手首と前腕が出る（捲れる）。袖口は少し広がる
//   ③重さの遅れ：袂の回り戻しは、腕の動きに 0.12 秒ほど遅れてついてくる（布の揺れ）
// 腕から離れた身頃の部分（胸・背・脇）は元のスキンのまま。?cloth=0 で前の見え方に戻せる
// ============================================================================================
const CLOTH = q.get('cloth') !== '0';
const clothes = [];
const _down = new THREE.Vector3(0, -1, 0), _up = new THREE.Vector3(0, 1, 0);
const clothArm = {};
function armState(side) {
  const ua = vrm.humanoid.getRawBoneNode(side + 'UpperArm'), la = vrm.humanoid.getRawBoneNode(side + 'LowerArm'), hd = vrm.humanoid.getRawBoneNode(side + 'Hand');
  return { S: ua.getWorldPosition(new THREE.Vector3()), E: la.getWorldPosition(new THREE.Vector3()), W: hd.getWorldPosition(new THREE.Vector3()),
    qU: ua.getWorldQuaternion(new THREE.Quaternion()), qL: la.getWorldQuaternion(new THREE.Quaternion()) };
}
function buildCloth() {
  vrm.scene.updateMatrixWorld(true);
  const rb = {};
  for (const side of ['left', 'right']) {
    rb[side] = [vrm.humanoid.getRawBoneNode(side + 'UpperArm'), vrm.humanoid.getRawBoneNode(side + 'LowerArm'), vrm.humanoid.getRawBoneNode(side + 'Hand')];
    const st = armState(side); clothArm[side] = { rest: st, qFix: [new THREE.Quaternion(), new THREE.Quaternion()], slide: 0 };
  }
  const targets = [];
  vrm.scene.traverse(o => { if (o.isSkinnedMesh && /Tops_01_CLOTH_01|Haori/i.test([].concat(o.material)[0]?.name || '')) targets.push(o); });
  const v = new THREE.Vector3(), c = new THREE.Vector3(), tmp = new THREE.Vector3();
  for (const m of targets) {
    const g = m.geometry, n = g.attributes.position.count;
    const ng = new THREE.BufferGeometry();
    const pa = new THREE.BufferAttribute(new Float32Array(n * 3), 3); pa.setUsage(THREE.DynamicDrawUsage);
    const na = new THREE.BufferAttribute(new Float32Array(n * 3), 3); na.setUsage(THREE.DynamicDrawUsage);
    ng.setAttribute('position', pa); ng.setAttribute('normal', na);
    if (g.attributes.uv) ng.setAttribute('uv', g.attributes.uv); if (g.index) ng.setIndex(g.index);
    for (const gr of g.groups) ng.addGroup(gr.start, gr.count, gr.materialIndex);
    const proxy = new THREE.Mesh(ng, m.material); proxy.frustumCulled = false; proxy.castShadow = true; proxy.receiveShadow = true;
    scene.add(proxy); m.layers.set(31);
    // 2026-10-08（袂の陰・再挑戦）：MToon は面の向きにあまり応えず、頂点の色も使えなかったので、袂の上に「陰の膜」を重ねる。
    // 同じ形（同じ頂点）を、色の濃い半透明の材質で描き、陰の濃さは頂点ごとの透明度（ひだの谷・裾ほど濃く）で決める。?tamshade=0 で外す
    let shade = null;
    const baseA = new Float32Array(n);   // 2026-10-08：粗い頂点ごとの陰の濃さ（ひだの筋を除く）。細かい陰の膜がこれを補間する   // 元のスキンは描かない（見える／見えないの合図＝m.visible はそのまま使う）
    const side = new Int8Array(n), seg = new Int8Array(n), tt = new Float32Array(n), wt = new Float32Array(n), hang = new Float32Array(n); const dep0 = new Float32Array(n), al0 = new Float32Array(n);   // 2026-10-13（al0＝休めの形での、腕の線に沿ったずれ）：休めの形で、腕の線より下へ垂れていた長さ（袂を重さで垂らすときの丈）
    const si = g.attributes.skinIndex, sw = g.attributes.skinWeight, bones = m.skeleton.bones;
    for (let i = 0; i < n; i++) {
      let wl = 0, wr = 0;
      for (let k = 0; k < 4; k++) { const b = bones[si.getComponent(i, k)], w = sw.getComponent(i, k);
        if (rb.left.includes(b)) wl += w; else if (rb.right.includes(b)) wr += w; }
      const ws = Math.max(wl, wr); if (ws < 0.2) continue;
      const sd = wl >= wr ? 'left' : 'right', R = clothArm[sd].rest;
      m.getVertexPosition(i, v); v.applyMatrix4(m.matrixWorld);
      // 腕の線（肩→肘→手首）でいちばん近い点
      let best = 1e9;
      for (const [k, A, Bp] of [[0, R.S, R.E], [1, R.E, R.W]]) {
        const ab = tmp.copy(Bp).sub(A), u = Math.min(1, Math.max(0, v.clone().sub(A).dot(ab) / ab.lengthSq()));
        const p = A.clone().addScaledVector(ab, u), d = p.distanceTo(v);
        if (d < best) { best = d; seg[i] = k; tt[i] = u; c.copy(p); }
      }
      // 2026-10-13：肘の下に垂れた袂の角は、休めの形では二の腕の端（肘）にいちばん近いが、布としては前腕の袖に付いている。
      // 二の腕に付けたままだと、前腕を起こしたとき肘から横へ張り出す板になる → 前腕の袖として扱う（?tam2=0 で前の分け方）
      if (TAM2 && seg[i] === 0 && tt[i] > 0.75 && c.y - v.y > 0.04) {
        const ab = tmp.copy(R.W).sub(R.E), u = Math.min(1, Math.max(0, v.clone().sub(R.E).dot(ab) / ab.lengthSq()));
        seg[i] = 1; tt[i] = u; c.copy(R.E).addScaledVector(ab, u);
      }
      side[i] = sd === 'left' ? 1 : 2;
      wt[i] = ease((ws - 0.2) / 0.5);
      // 袂の度合い：腕の線からの離れ（筒より外）と、下へ向いている度合い
      const o = v.clone().sub(c), r = o.length();
      hang[i] = ease((r - 0.03) / 0.06) * ease((-o.y / Math.max(r, 1e-4) + 0.5) / 0.8);
      { const R2 = clothArm[sd].rest, ab = (seg[i] ? R2.W.clone().sub(R2.E) : R2.E.clone().sub(R2.S)).normalize(); const op = o.clone().addScaledVector(ab, -o.dot(ab)); dep0[i] = Math.max(0, -op.y); al0[i] = o.dot(ab); }
    }
    if (LINING) liningToOuter(m, proxy, side, seg, tt, wt);
    // 2026-10-08（袂の陰・再挑戦の二）：袂は大きな三角形が数枚の「板」なので、頂点ごとの陰では筋が描けない。
    // 前腕の袖の三角形だけを細かく割った「陰の膜」を別に作り（形は粗い頂点の重ね合わせ）、細かい頂点ごとにひだの筋と陰を描く
    if (TAMOTO && TAM_SHADE > 0 && g.index) {
      const I = g.index.array, N = TAM_SUB, ids = [], bw = [], tris = [];
      for (let f = 0; f < I.length; f += 3) {
        const a = I[f], b = I[f + 1], c = I[f + 2];
        if (!(side[a] && side[b] && side[c] && seg[a] === 1 && seg[b] === 1 && seg[c] === 1)) continue;
        const base = ids.length / 3, idx = (i, j) => base + (i * (2 * N + 3 - i)) / 2 + j;
        for (let i = 0; i <= N; i++) for (let j = 0; j <= N - i; j++) { ids.push(a, b, c); bw.push((N - i - j) / N, i / N, j / N); }
        for (let i = 0; i < N; i++) for (let j = 0; j < N - i; j++) {
          tris.push(idx(i, j), idx(i + 1, j), idx(i, j + 1));
          if (j < N - i - 1) tris.push(idx(i + 1, j), idx(i + 1, j + 1), idx(i, j + 1));
        }
      }
      if (ids.length) {
        const fn = ids.length / 3, fg = new THREE.BufferGeometry();
        const fp = new THREE.BufferAttribute(new Float32Array(fn * 3), 3); fp.setUsage(THREE.DynamicDrawUsage);
        const fc = new THREE.BufferAttribute(new Float32Array(fn * 4).fill(1), 4); fc.setUsage(THREE.DynamicDrawUsage);
        fg.setAttribute('position', fp); fg.setAttribute('color', fc); fg.setIndex(tris);
        const sm = new THREE.MeshBasicMaterial({ color: q.get('tamdbg') ? 0xff0000 : 0x2a1a0c, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
          polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
        shade = new THREE.Mesh(fg, sm); shade.frustumCulled = false; shade.renderOrder = 2; scene.add(shade);
        shade.userData = { ids: new Uint32Array(ids), bw: new Float32Array(bw), fn };
      }
    }
    clothes.push({ m, proxy, side, seg, tt, wt, hang, n, shade, baseA, dep0, al0 });
  }
}
// 袖の内側（2026-10-07 本人「腕を上げると変な色に変わるのは何故ですか」）：
// VRoid の着物と羽織は、袖の内側の面にクリーム色の裏地の模様が貼ってあり、腕を上げて袖口がこちらを向くと、
// そこだけ白っぽく平らに光って「変な色」に見えていた（布の動きを外した ?cloth=0 でも同じ＝布の動きのせいではない）。
// 袖の面のうち「腕の軸の側を向いた面（内側）」で「明るく色の薄い所（裏地）」を、表地の色を少し落とした色で描く（表地の影の色）。
// ?lining=0 で前の見え方に戻せる
const LINING = q.get('lining') !== '0', LIN_MIX = Number(q.get('linmix') ?? 0.85), LIN_DARK = Number(q.get('lindark') ?? 0.45);
const LIN_ISLAND = Number(q.get('linisland') ?? 0.35);   // ?linisland=1 で面ごとの判定（2026-10-07 朝の版）に戻す
const _texPx = new Map();
function texPixels(tex) {
  if (!tex?.image) return null;
  if (_texPx.has(tex)) return _texPx.get(tex);
  const img = tex.image, w = img.width, h = img.height, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0); const r = { w, h, px: g.getImageData(0, 0, w, h).data, flipY: tex.flipY };
  _texPx.set(tex, r); return r;
}
function sampleUV(T, u, v) {
  const x = Math.min(T.w - 1, Math.max(0, Math.floor((u - Math.floor(u)) * T.w)));
  const vv = v - Math.floor(v), y = Math.min(T.h - 1, Math.max(0, Math.floor((T.flipY ? 1 - vv : vv) * T.h))), k = (y * T.w + x) * 4;
  return [T.px[k] / 255, T.px[k + 1] / 255, T.px[k + 2] / 255];
}
function liningToOuter(m, proxy, side, seg, tt, wt) {
  const g = m.geometry, idx = g.index, uv = g.attributes.uv; if (!idx || !uv) return;
  const mats = [].concat(m.material), groups = g.groups.length ? g.groups : [{ start: 0, count: idx.count, materialIndex: 0 }];
  // いまの姿勢での位置と法線（スキンを当てたもの）
  const n = g.attributes.position.count, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
  const P = g.attributes.position, N = g.attributes.normal, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
  const bm = m.skeleton.bones.map((b, j) => new THREE.Matrix4().multiplyMatrices(b.matrixWorld, m.skeleton.boneInverses[j]));
  const a = new THREE.Vector3(), b = new THREE.Vector3(), an = new THREE.Vector3(), bn = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    if (!side[i]) continue;
    a.fromBufferAttribute(P, i).applyMatrix4(m.bindMatrix); an.fromBufferAttribute(N, i).transformDirection(m.bindMatrix);
    const ap = new THREE.Vector3(), anc = new THREE.Vector3();
    for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (!w) continue; const M = bm[si.getComponent(i, k)];
      ap.addScaledVector(b.copy(a).applyMatrix4(M), w); anc.addScaledVector(bn.copy(an).transformDirection(M), w); }
    ap.applyMatrix4(m.bindMatrixInverse).applyMatrix4(m.matrixWorld); anc.transformDirection(m.bindMatrixInverse).transformDirection(m.matrixWorld);
    pos.set([ap.x, ap.y, ap.z], i * 3); nor.set([anc.x, anc.y, anc.z], i * 3);
  }
  const newIdx = [], newGroups = [], extra = new Map(); let nLin = 0;
  const outerSum = new Map();
  const tri = [];
  for (const gr of groups) {
    const T = texPixels(mats[gr.materialIndex]?.map);
    for (let f = gr.start; f < gr.start + gr.count; f += 3) {
      const i0 = idx.getX(f), i1 = idx.getX(f + 1), i2 = idx.getX(f + 2);
      let lin = false, info = null;
      const iv = side[i0] ? i0 : side[i1] ? i1 : i2;
      if (T && side[iv]) {
        const s = side[iv] === 1 ? 'left' : 'right', R = clothArm[s].rest;
        // 面の中心・法線、いちばん近い腕の線の点
        const c = new THREE.Vector3(), nn = new THREE.Vector3();
        for (const i of [i0, i1, i2]) { c.x += pos[i * 3] / 3; c.y += pos[i * 3 + 1] / 3; c.z += pos[i * 3 + 2] / 3; nn.x += nor[i * 3]; nn.y += nor[i * 3 + 1]; nn.z += nor[i * 3 + 2]; }
        const [A, Bp] = seg[iv] === 0 ? [R.S, R.E] : [R.E, R.W], ab = Bp.clone().sub(A);
        const u = Math.min(1, Math.max(0, c.clone().sub(A).dot(ab) / ab.lengthSq())), o = c.clone().sub(A.clone().addScaledVector(ab, u));
        const inward = nn.dot(o) < 0; nn.normalize();
        const uc = (uv.getX(i0) + uv.getX(i1) + uv.getX(i2)) / 3, vc = (uv.getY(i0) + uv.getY(i1) + uv.getY(i2)) / 3;
        const [r, gg, bb] = sampleUV(T, uc, vc), mx = Math.max(r, gg, bb), mn = Math.min(r, gg, bb);
        const pale = mx > 0.62 && (mx - mn) < 0.22;
        info = { c, nn, pale, rgb: [r, gg, bb] };
      }
      tri.push([gr.materialIndex, lin, i0, i1, i2, info]);
    }
  }
  // 調べた結果（2026-10-07）：袖の中の色の薄い面は、表地の裏ではなく、着物の下に重なる長襦袢の袖（クリームに緑の模様）。
  // 実物でも腕を上げると襦袢の袖は見えるが、MToon で影がつかず、袖の奥にあるのに表と同じ明るさで白く光るので「変な色」に見えた。
  // そこで袖の範囲の色の薄い面を、表地の色へ半分ほど寄せ、袖の奥の暗さまで落とした色で描く（羽織は紗で全体が淡いので対象にしない）
  if (/Haori/i.test(mats[0]?.name || '')) return;
  // 2026-10-07 試し版《蜂の目》：面ごとに色を見て決めると、襦袢の袖の緑の模様の面だけが元の明るさで残り、
  // 袖の縁にぎざぎざ（明るい歯と暗い歯）が出た。→ 頂点を共有する面のかたまり（UV の島）ごとに決める：
  // かたまりの面の LIN_ISLAND 以上が色の薄い面なら、そのかたまり全体を襦袢の袖として同じ色で描く
  if (LIN_ISLAND < 1) {
    const par = tri.map((_, i) => i), find = i => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
    const owner = new Map();
    tri.forEach((x, k) => { if (!x[5]) return; for (const vi of [x[2], x[3], x[4]]) { const key = x[0] * 1e7 + vi;
      if (owner.has(key)) { const a = find(owner.get(key)), b = find(k); if (a !== b) par[a] = b; } else owner.set(key, k); } });
    const cnt = new Map();
    tri.forEach((x, k) => { if (!x[5]) return; const r = find(k), c = cnt.get(r) ?? [0, 0]; c[0]++; if (x[5].pale) c[1]++; cnt.set(r, c); });
    let nIsl = 0;
    tri.forEach((x, k) => { if (!x[5]) return; const c = cnt.get(find(k)); x[5].island = c[1] / c[0] >= LIN_ISLAND && c[0] >= 4; if (x[5].island && !x[5].pale) nIsl++; });
    tri.forEach(x => { if (x[5]?.island) { x[5].paleOrig = x[5].pale; x[5].pale = true; } });
    console.log(`袖の裏地：かたまりで足した面 ${nIsl}`);
  }
  const dark = tri.filter(x => x[5] && !x[5].pale);
  for (const x of tri) { const f = x[5]; if (!f || !f.pale) continue;
    x[1] = true; nLin++;
    const ls = extra.get(x[0]) ?? { sum: [0, 0, 0, 0] }; ls.sum[0] += f.rgb[0]; ls.sum[1] += f.rgb[1]; ls.sum[2] += f.rgb[2]; ls.sum[3]++; extra.set(x[0], ls); }
  for (const y of dark) { const os = outerSum.get(y[0]) ?? [0, 0, 0, 0]; os[0] += y[5].rgb[0]; os[1] += y[5].rgb[1]; os[2] += y[5].rgb[2]; os[3]++; outerSum.set(y[0], os); }
  if (!nLin) return;
  // 裏地の面を、表地の色に寄せた写しの材質で描く（表地の平均の色 ÷ 裏地の平均の色 を色の掛け目に。影の側に少し落とす）
  const pmats = [...mats];
  for (const [mi, ls] of extra) {
    const os = outerSum.get(mi); if (!os || !os[3]) continue;
    const src = mats[mi], cl = src.clone();
    const k = [0, 1, 2].map(j => Math.min(1, lerp(1, (os[j] / os[3]) / Math.max(0.05, ls.sum[j] / ls.sum[3]), LIN_MIX) * LIN_DARK));
    if (cl.color) cl.color.setRGB(k[0] * src.color.r, k[1] * src.color.g, k[2] * src.color.b);
    if (cl.shadeColorFactor && src.shadeColorFactor) cl.shadeColorFactor.setRGB(k[0] * src.shadeColorFactor.r, k[1] * src.shadeColorFactor.g, k[2] * src.shadeColorFactor.b);
    cl.name = (src.name || '') + '_lining'; ls.mi = pmats.length; pmats.push(cl);
  }
  const ng = proxy.geometry; ng.clearGroups();
  for (const want of [false, true]) for (let mi = 0; mi < mats.length; mi++) {
    const target = want ? extra.get(mi)?.mi : mi; if (target == null) continue;
    const st = newIdx.length;
    for (const [m2, lin, i0, i1, i2] of tri) if (m2 === mi && lin === want && (want || true)) newIdx.push(i0, i1, i2);
    if (!want) { /* 裏地にした面で、写しの材質が作れなかったものは元の材質のまま */
      for (const [m2, lin, i0, i1, i2] of tri) if (m2 === mi && lin && extra.get(mi)?.mi == null) newIdx.push(i0, i1, i2); }
    if (newIdx.length > st) ng.addGroup(st, newIdx.length - st, target);
  }
  ng.setIndex(newIdx); proxy.material = pmats;
  console.log(`袖の裏地：${m.name} ${nLin} 面を表地の色に`);
}
const _mA = new THREE.Matrix4(), _mB = new THREE.Matrix4(), _bp = new THREE.Vector3(), _nv = new THREE.Vector3(), _acc = new THREE.Vector3(), _nacc = new THREE.Vector3(), _n3 = new THREE.Matrix3();
let clothLastT = null;
const TAM2 = q.get('tam2') !== '0';
const TAMOTO = q.get('tamoto') !== '0', TAM_B = Number(q.get('tamb') ?? 0.06), TAM_F = Number(q.get('tamf') ?? 0.45), TAM_D = Number(q.get('tamd') ?? 0.5), TAM_S = Number(q.get('tams') ?? 0.42), TAM_DBG = q.get('tamdbg') === '1', TAM_C = Number(q.get('tamc') ?? 0.10), TAM_W = Number(q.get('tamw') ?? 0.02), TAM_I = Number(q.get('tami') ?? 0.07), TAM_SHADE = Number(q.get('tamshade') ?? 1.0), TAM_R = Number(q.get('tamr') ?? 0.32), TAM_FS = Number(q.get('tamfs') ?? 0.3), TAM_SUB = Number(q.get('tamsub') ?? 6), _tmA = new THREE.Vector3(), _tmB = new THREE.Vector3(), CHEST_W = new THREE.Vector3();
function clothUpdate(t) {
  if (!clothes.length) return;
  CHEST().getWorldPosition(CHEST_W);
  const dt = clothLastT == null ? 1 : Math.abs(t - clothLastT); clothLastT = t;
  const k = dt > 0.2 ? 1 : 1 - Math.exp(-dt / 0.12);   // 布の遅れ（とびとびに撮るときは遅れなし）
  const cur = {};
  for (const side of ['left', 'right']) {
    const st = armState(side), C = clothArm[side], R = C.rest;
    const segs = [[st.S, st.E, st.qU, R.qU], [st.E, st.W, st.qL, R.qL]].map(([A, Bp, q1, q0], j) => {
      const a = Bp.clone().sub(A), len = a.length(); a.normalize();
      const qRel = q1.clone().multiply(q0.clone().invert());
      const dR = _down.clone().applyQuaternion(qRel);
      const want = new THREE.Quaternion().setFromUnitVectors(dR, _down);
      C.qFix[j].slerp(want, k);
      return { A, a, len, qFix: C.qFix[j] };
    });
    // 前腕が上を向くほど、袖口は肘の側へすべり落ちる
    const up = segs[1].a.dot(_up), sl = ease((up + 0.25) / 0.45);
    C.slide += (sl - C.slide) * k;
    // 2026-10-08 未明（袂の揺れ）：前腕の向きを少し遅れて追う写し。いまの向きとの差だけ、垂れた袂を後ろへ残す（振りの余韻）
    if (!C.lagA || k >= 1) C.lagA = segs[1].a.clone(); else C.lagA.lerp(segs[1].a, 1 - Math.exp(-dt / 0.16)).normalize();
    cur[side] = { segs, slide: C.slide, swing: segs[1].a.clone().sub(C.lagA) };
  }
  for (const cl of clothes) {
    const { m, proxy, side, seg, tt, wt, hang, n, shade: shM, baseA, dep0, al0 } = cl;
    proxy.visible = m.visible; if (shM) shM.visible = m.visible;
    if (cl.simOwned) { if (shM) shM.visible = false; continue; }   // 羽織を脱いだあと：形は布（haoriSim）が持つ
    if (!m.visible) continue;
    const g = m.geometry, P = g.attributes.position, N = g.attributes.normal, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
    const bones = m.skeleton.bones, inv = m.skeleton.boneInverses;
    const pa = proxy.geometry.attributes.position, na = proxy.geometry.attributes.normal;
    const mats = bones.map((b, j) => new THREE.Matrix4().multiplyMatrices(b.matrixWorld, inv[j]));
    for (let i = 0; i < n; i++) {
      _bp.fromBufferAttribute(P, i).applyMatrix4(m.bindMatrix);
      _nv.fromBufferAttribute(N, i).transformDirection(m.bindMatrix);
      _acc.set(0, 0, 0); _nacc.set(0, 0, 0);
      for (let kk = 0; kk < 4; kk++) { const w = sw.getComponent(i, kk); if (!w) continue; const M = mats[si.getComponent(i, kk)];
        _acc.addScaledVector(_P.copy(_bp).applyMatrix4(M), w); _nacc.addScaledVector(_D.copy(_nv).transformDirection(M), w); }
      _acc.applyMatrix4(m.bindMatrixInverse).applyMatrix4(m.matrixWorld);
      let shade = 1;
      _nacc.transformDirection(m.bindMatrixInverse).transformDirection(m.matrixWorld);
      if (CLOTH && side[i]) {
        const S = cur[side[i] === 1 ? 'left' : 'right'], sg = S.segs[seg[i]], w = wt[i];
        const cpt = sg.A.clone().addScaledVector(sg.a, tt[i] * sg.len);
        const o = _acc.clone().sub(cpt);
        // ①袂は真下へ垂れる（腕の線を軸に回し戻す）
        const hq = new THREE.Quaternion().slerp(sg.qFix, hang[i] * w);
        o.applyQuaternion(hq); _nacc.applyQuaternion(hq);
        // 腕に食いこまない（腕の線から 4.5 cm より内へ入れない）
        const ax = sg.a.clone().multiplyScalar(o.dot(sg.a)), pr = o.clone().sub(ax), pl = pr.length();
        if (pl < 0.045 && pl > 1e-5) pr.multiplyScalar(lerp(1, 0.045 / pl, w * hang[i]));
        // 2026-10-13 本人「腕を上げると袖がおかしい」：前腕を起こす・胸の前へ渡すと、袂が腕から横へ張り出した板（裏の暗い面が見える）になっていた。
        // 回し戻し（①）は最小の回転なので、前腕が大きく回ると袂の向きが横や上に残る。→ 袂の垂れた丈（dep0）は、いつも世界の真下へ垂らす。
        // 腕の線に直角な横の張り出しは、袖の筒の太さ（5 cm）までに抑える。前腕が上を向くほど、袂は腕に沿って縮む（布がたまる）。?tam2=0 で前の見え方
        if (TAM2 && seg[i] === 1 && hang[i] > 0.01 && dep0[i] > 0.005) {
          const h = hang[i] * w, hd = _tmA.copy(_down).addScaledVector(sg.a, -_down.dot(sg.a)), hl = hd.length();
          const lat = pr.clone(); if (hl > 1e-4) { hd.multiplyScalar(1 / hl); lat.addScaledVector(hd, -lat.dot(hd)); }
          const upA = Math.max(0, sg.a.dot(_up)), lm = 0.05 - 0.02 * upA;
          const ll = lat.length(); if (ll > lm) lat.multiplyScalar(lm / ll);
          const dd = dep0[i] * (1 - 0.85 * upA);
          const want = lat.addScaledVector(_down, dd);
          pr.lerp(want, h);
          // 腕の線に沿ったずれも休めの形の量へ戻す（回し戻しで袂の面が腕の向きへ倒れると、肘の外へ張り出していた）
          ax.lerp(sg.a.clone().multiplyScalar(Math.max(-0.04, Math.min(0.04, al0[i]))), h);
        }
        // ②前腕が上を向くと袖口が肘の側へすべり、口が少し広がる
        if (seg[i] === 1 && S.slide > 0.001) { const s = S.slide * w;
          pr.multiplyScalar(1 + (TAM2 ? 0.10 : 0.32) * s * tt[i]); ax.addScaledVector(sg.a, -(TAM2 ? 0.62 : 0.55) * s * Math.pow(tt[i], 0.7) * sg.len); }   // 2026-10-13：袖口の開きを小さく（裏の明るい三角が板に見えた）
        // 2026-10-08 未明（縦 0:22 の寄りで袂が板に見えた）：垂れた袂に ①ふくらみ（腕の線の中ほどで外へ 3.5 cm まで・下ほど大きく）
        // ②袂の下の角の丸み（肘・手首の側の下の端を少し上へ）③振りの余韻（前腕の向きの遅れの分、下ほど後ろに残す）を足し、
        // 面の向き（法線）もふくらみに合わせて傾けて、陰の濃淡が出るようにする。?tamoto=0 で前の見え方
        if (TAMOTO && seg[i] === 1 && hang[i] > 0.01) {
          const h = hang[i] * w, dep = Math.max(0, pr.dot(_down));   // 腕の線より下へ出ている長さ（m）
          const df = ease(dep / 0.22), sn = Math.sin(Math.PI * tt[i]);
          const out = _tmA.copy(sg.a).cross(_down); if (out.lengthSq() > 1e-6) { out.normalize(); if (out.dot(_tmB.copy(cpt).sub(CHEST_W)) < 0) out.negate(); }
          const bel = TAM_B * h * df * sn;
          pr.addScaledVector(out, bel);
          const corner = ease((Math.abs(tt[i] - 0.5) - 0.18) / 0.32) * df * df;             // 両端の下の角（袂の丸み）
          pr.addScaledVector(_down, -TAM_C * h * corner);
          pr.addScaledVector(out, TAM_W * h * df * Math.sin(Math.PI * 4 * tt[i] + 0.6));       // 縦のひだ（布の波）
          pr.addScaledVector(_down, 0.012 * h * df * Math.sin(Math.PI * 4 * tt[i] + 0.6));     // 裾の線も少し波打つ
          // 2026-10-08（板っぽさ）：裾は体のほうへ巻きこむ（中ほどは外へふくらみ、裾は内へ＝断面が S の字になる）。面の向きも裾ほど上を向かせる
          pr.addScaledVector(out, -TAM_I * h * df * df * df);
          _nacc.addScaledVector(_up, TAM_I * 4 * h * df * df);
          if (S.swing) pr.addScaledVector(S.swing, -0.5 * h * dep);
          if (TAM_DBG) pr.addScaledVector(out, 0.2 * h);
          // 面の向き：ふくらみの傾き＋縦のひだ二本ぶんの波（陰の筋）＋下ほど下を向く（裾に陰がたまる）
          _nacc.addScaledVector(sg.a, -bel * Math.PI * Math.cos(Math.PI * tt[i]) / Math.max(0.1, sg.len) * 3 + TAM_F * h * df * Math.sin(Math.PI * 4 * tt[i] + 0.6))
               .addScaledVector(_down, TAM_D * h * df).normalize();
          // 陰：縦のひだ（二本）の谷と、裾ほど暗く（最大 TAM_S）。腕のすぐ下（付け根）は明るいまま
          const fold = 0.5 + 0.5 * Math.sin(Math.PI * 4 * tt[i] + 0.6);
          shade = 1 - TAM_S * h * df * (0.45 + 0.35 * fold + 0.2 * ease(dep / 0.3));
        }
        // 陰の膜（前腕の袖）：腕の線から離れるほど（袖の外の縁・袂の先ほど）少し暗く、縦のひだの谷も暗く。前から見ても袖に丸みが出るように
        if (TAMOTO && seg[i] === 1) {
          // 腕の線より下にある布ほど暗く（腕の下は光が届きにくい）＋縦のひだの谷
          const dn = pr.dot(_down), fo = 0.5 + 0.5 * Math.sin(Math.PI * 4 * tt[i] + 0.6);
          // 前から見て板に見える面にも、縦のひだの筋（谷を暗く）と、袖口へ向かう奥の陰を入れる
          shade = Math.min(shade, 1 - w * (TAM_R * ease((dn + 0.01) / 0.12) + 0.10 * ease((tt[i] - 0.55) / 0.45)));
        }
        _acc.copy(cpt).add(ax).add(pr);
      }
      pa.setXYZ(i, _acc.x, _acc.y, _acc.z); na.setXYZ(i, _nacc.x, _nacc.y, _nacc.z);
      baseA[i] = 1 - shade;
    }
    pa.needsUpdate = true; na.needsUpdate = true;
    if (shM && shM.visible) {   // 細かい陰の膜：粗い頂点の重ね合わせで形を作り、ひだの筋（前腕の向きに沿って四本）を細かい頂点ごとに
      const { ids, bw, fn } = shM.userData, fp = shM.geometry.attributes.position, fc = shM.geometry.attributes.color, A = pa.array;
      for (let k = 0; k < fn; k++) {
        let x = 0, y = 0, z = 0, t = 0, al = 0, ww = 0;
        for (let e = 0; e < 3; e++) { const v = ids[k * 3 + e], b = bw[k * 3 + e]; x += A[v * 3] * b; y += A[v * 3 + 1] * b; z += A[v * 3 + 2] * b; t += tt[v] * b; al += baseA[v] * b; ww += wt[v] * b; }
        fp.setXYZ(k, x, y, z);
        const fo = 0.5 + 0.5 * Math.sin(Math.PI * 8 * t + 0.6);
        fc.setXYZW(k, 1, 1, 1, TAM_DBG ? 0.6 * fo : Math.min(0.85, (al + ww * TAM_FS * fo * fo) * TAM_SHADE));
      }
      fp.needsUpdate = true; fc.needsUpdate = true;
    }
  }
}
buildCloth();
window.__clothes = clothes; window.__clothArm = clothArm;

// ============================================================================================
// 羽織を脱ぐ布（2026-10-13・HAORI2）。袖口を引いて肩から背へすべり落とすところから、羽織を一枚の布として動かす（kit/haori_cloth.js）
//   ・目当て＝着ている羽織の形（スキンと袖の層が毎こま作る形）。身頃は肩から背へ下がる道すじ（下へ 0.2 m・後ろへ・前身頃は脇から後ろへ）へ、
//     留めを弱めながら導く。袖は腕を抜くまで腕に付き、抜きはじめたらその場に残して離す（腕と手が当たりで袖から抜ける）
//   ・当たり＝胴（着物の網から測った高さごとの楕円）・腕・手・腿・すね・座布団と床。留めのない所は重さで下がり、当たって止まる
//   ・こまの順に進める。前のこまより前を描くとき・こまを飛ばしたときは、すべりはじめから描きなおす（同じ順なら同じ絵）
// ============================================================================================
const HS_DBG = q.get('hsdbg') || '';
const HS_SETTLE = 2.4;
const HS_SMOOTH = q.get('hsmooth') !== '0', HS_SMOOTH_N = Number(q.get('hsmooth') || 3);
const HS_LIFT = Number(q.get('hslift') ?? 0.025);   // 袖の付け根を腕から浮かせる量（m）   // 脱ぎ終えてから布が落ち着くまで動かす時間（そのあとは止めた形のまま）
let HS = null;
function hsInit() {
  const cl = clothes.find(c => /Haori/i.test([].concat(c.m.material)[0]?.name || '')); if (!cl || !cl.proxy.geometry.index) return null;
  const g = cl.proxy.geometry, C = new HC.GarmentCloth(THREE, g.attributes.position.array, g.index.array), np = C.np;
  const arm = new Int8Array(np), seg = new Int8Array(np);
  for (let p = 0; p < np; p++) { const v = C.first[p]; arm[p] = cl.wt[v] > 0.5 ? cl.side[v] : 0; seg[p] = cl.seg[v]; }
  // 隣の点の表（ふちのぎざぎざをならすため。2026-10-14）
  const deg = new Int32Array(np + 1); for (let k = 0; k < C.edges.length; k++) deg[C.edges[k] + 1]++;
  for (let p = 0; p < np; p++) deg[p + 1] += deg[p];
  const nb = new Int32Array(C.edges.length), fill = deg.slice(0, np);
  for (let k = 0; k < C.edges.length; k += 2) { const a = C.edges[k], b = C.edges[k + 1]; nb[fill[a]++] = b; nb[fill[b]++] = a; }
  return { cl, C, arm, seg, np, nbS: deg, nb, base: new Float32Array(np * 3), Dt: new Float32Array(np * 3), Pt: new Float32Array(np), f: null, done: false, T0: new Float32Array(np * 3), T1: new Float32Array(np * 3), pin: new Float32Array(np), F: new Float32Array(np * 3), frz: [false, false, false] };
}
const _hm = new THREE.Matrix4(), _hq4 = new THREE.Quaternion(), _hv1 = new THREE.Vector3(), _hv2 = new THREE.Vector3();
function hsCols() {
  vrm.scene.updateMatrixWorld(true);
  const mat = B('spine').matrixWorld.clone(), inv = mat.clone().invert();
  const raw = n => vrm.humanoid.getRawBoneNode(n), P_ = n => raw(n).getWorldPosition(new THREE.Vector3());
  const caps = [];
  const cap = (a, b, r) => caps.push([a.x, a.y, a.z, b.x, b.y, b.z, r]);
  for (const s of ['left', 'right']) {
    const S = P_(s + 'UpperArm'), E = P_(s + 'LowerArm'), W = P_(s + 'Hand'), M = raw(s + 'MiddleProximal') ? P_(s + 'MiddleProximal') : W;
    cap(S, E, 0.05); cap(E, W, 0.045); cap(W, M.clone().lerp(W, -0.4), 0.035);
    cap(P_(s + 'UpperLeg'), P_(s + 'LowerLeg'), 0.085); cap(P_(s + 'LowerLeg'), P_(s + 'Foot'), 0.06);
  }
  return { mat, inv, caps };
}
const ZB_TOP = KOZA_Y + ZB_H * 0.99;
const hsFloor = (x, z) => (Math.abs(x) < 0.37 && Math.abs(z) < 0.40) ? ZB_TOP : KOZA_Y;
// 一こまの目当てと留め（u＝羽織の所作の中の進み）
function hsTargets(S, u, out) {
  const { C, cl, arm, seg, np, pin, F, frz } = S;
  C.gather(cl.proxy.geometry.attributes.position.array, out); S.base.set(out);
  const chM = CHEST().matrixWorld, AB = { 1: armState('left'), 2: armState('right') };
  const e1 = ease((u - HU.shrug0) / (HU.shrug1 - HU.shrug0)), eOut = ease((u - HU.outR0) / (HU.outL1 + 0.04 - HU.outR0));
  const d = new THREE.Vector3();
  for (const sd of [1, 2]) {   // 腕を抜きはじめた側の袖は、その時の場所に残す
    const o0 = sd === 2 ? HU.outR0 : HU.outL0;
    if (u >= o0 && !frz[sd]) { frz[sd] = true; for (let p = 0; p < np; p++) if (arm[p] === sd) for (let j = 0; j < 3; j++) F[p * 3 + j] = out[p * 3 + j]; }
    if (u < o0) frz[sd] = false;
  }
  for (let p = 0; p < np; p++) {
    const i = p * 3, L = S.loc;
    if (HS_DBG === 'pin1' && (!arm[p] || seg[p] === 0)) { pin[p] = 1; continue; }   // 確かめ用：布を動かさない（書きもどしだけ）
    if (arm[p] && seg[p] === 0) {
      // 袖の付け根（二の腕の上）：胴のまわりを回さず、二の腕に沿って肘の方へ 10 cm すべり落ちる（腕から 2.5 cm 浮かせて）。
      // 第 2 回：回して後ろへ送ると、着物の袖の上が羽織の袖にまだらの穴のように覗いた（11 人全員）
      const A = AB[arm[p]], ax = _hv1.copy(A.E).sub(A.S), Lx = ax.length(); ax.multiplyScalar(1 / Lx);
      const q0 = _hv2.set(out[i], out[i + 1], out[i + 2]).sub(A.S), uu = Math.max(0, Math.min(Lx, q0.dot(ax)));
      const rad = q0.addScaledVector(ax, -uu), rl = rad.length() || 1, lo = Math.min(1, e1 * 8);
      out[i] += ax.x * 0.10 * e1 + rad.x / rl * HS_LIFT * lo; out[i + 1] += ax.y * 0.10 * e1 + rad.y / rl * HS_LIFT * lo; out[i + 2] += ax.z * 0.10 * e1 + rad.z / rl * HS_LIFT * lo;
      pin[p] = (1 - 0.6 * e1) * (1 - 0.6 * eOut) * (1 - ease((u - HU.outL1) / 0.08)) * 0.9;
    } else if (!arm[p]) {
      // 身頃：肩から背へ下がる。前身頃は胴の外を回って（脇を通って）後ろへ。胴の中へは入れない
      // 袖口を引くあいだは脇まで（前身頃は腕の外に見えている）、腕を抜くころに背の後ろへ
      // 骨の線のすぐそば（首の後ろの衿・裾の真ん中）は向き（th）が定まらないので、回さず・ふくらませない（回すと胸の前に衿の白い線が横切った）
      const r = Math.hypot(L[i], L[i + 2]), th = Math.atan2(L[i], L[i + 2]), ax0 = ease((r - 0.04) / 0.05), sw = (0.72 * e1 + 0.20 * eOut) * ax0;   // 第 10 回（前の衿の黒い帯が、脇で縦の黒い線に見える）→ 前身頃を早めに背の側へ回す
      // 下がる量：身頃 16 cm・袖の付け根 7 cm（付け根を大きく下げると、着物の袖の上へ入りこむ）。肩の高さの布はもう 2 cm 浮かせる
      const th2 = th + Math.sign(th || 1) * (Math.PI - Math.abs(th)) * sw, y2 = L[i + 1] - (arm[p] ? 0.07 : 0.16) * e1;
      const sh = 0.02 * ease((L[i + 1] + 0.10) / 0.08);
      // 着物との間は数 mm しかないので、下げる前に布をふくらませて浮かせる（肩を回すと羽織がゆるむ）。胴の外（断面＋3 cm）より内へは入れない
      const lo = Math.min(1, e1 * 8) * ax0, r2 = Math.max(r + (0.03 + sh) * lo, (HC.sliceRadius(S.slC, y2, th2) + 0.03 + sh) * lo + r * (1 - lo));
      // 着ている形（スキン）からのずれとして足す（はじめは着ている形そのまま。胸だけで決めると、腰の着物が羽織を突き抜ける）
      d.set(r2 * Math.sin(th2) - L[i], y2 - L[i + 1], r2 * Math.cos(th2) - L[i + 2]).transformDirection(chM).multiplyScalar(Math.hypot(r2 * Math.sin(th2) - L[i], y2 - L[i + 1], r2 * Math.cos(th2) - L[i + 2]));
      out[i] += d.x; out[i + 1] += d.y; out[i + 2] += d.z;
      // 腕を抜いたあとも、しばらくは弱く背の後ろへ導く（膝の脇へ広がらず、後ろの座布団にたまる）。脱ぎ終えて 2 秒ほどで、すっかり重さだけに
      pin[p] = (1 - 0.75 * e1) * (1 - 0.6 * eOut) * (1 - ease((u - HU.outL1) / 0.08)) * (arm[p] ? 0.8 : 1);
    } else {
      const o0 = arm[p] === 2 ? HU.outR0 : HU.outL0, o1 = arm[p] === 2 ? HU.outR1 : HU.outL1;
      if (u < o0) pin[p] = 1;
      else if (HS_DBG === 'pin1') pin[p] = 1;
      else {   // 抜いた袖は、身頃に引かれて背の後ろへ（その場に残してから、後ろ下へ）
        const k = ease((u - o0) / (o1 + 0.06 - o0));
        d.set(0, -0.06 * k, -0.30 * k).transformDirection(chM).multiplyScalar(Math.hypot(0.06 * k, 0.30 * k));
        for (let j = 0; j < 3; j++) out[i + j] = F[i + j] + [d.x, d.y, d.z][j];
        pin[p] = 0.30 * (1 - ease((u - o1) / 0.12));
      }
    }
  }
  // 2026-10-14（11 人 第 12 回・2 人「脱ぐ途中、肩口の布のふちがぎざぎざ」）：身頃と袖の付け根は、頂点ごとの腕の重み（0.5 で二つに分けた）で
  // 別の道すじ・別の留めになるので、分かれ目（肩口）で隣りあう点の目当てが段々にずれ、ふちが鋸の歯に見えた。
  // → 腕から抜いていない点（身頃と袖の付け根）のあいだで、目当てのずらしと留めの強さを隣の点となじませる（3 回）。?hsmooth=0 で前の見え方
  if (HS_SMOOTH && e1 > 0) {
    const { nbS, nb, base, Dt, Pt } = S, ok = p => !arm[p] || seg[p] === 0;
    for (let p = 0; p < np; p++) for (let j = 0; j < 3; j++) Dt[p * 3 + j] = out[p * 3 + j] - base[p * 3 + j];
    for (let it = 0; it < HS_SMOOTH_N; it++) {
      const D2 = Dt.slice(), P2 = pin.slice();
      for (let p = 0; p < np; p++) { if (!ok(p)) continue; let n = 0, sx = 0, sy = 0, sz = 0, sp = 0;
        for (let k = nbS[p]; k < nbS[p + 1]; k++) { const q2 = nb[k]; if (!ok(q2)) continue; n++; sx += D2[q2 * 3]; sy += D2[q2 * 3 + 1]; sz += D2[q2 * 3 + 2]; sp += P2[q2]; }
        if (!n) continue; Dt[p * 3] = 0.5 * D2[p * 3] + 0.5 * sx / n; Dt[p * 3 + 1] = 0.5 * D2[p * 3 + 1] + 0.5 * sy / n; Dt[p * 3 + 2] = 0.5 * D2[p * 3 + 2] + 0.5 * sz / n; pin[p] = 0.5 * P2[p] + 0.5 * sp / n; }
    }
    for (let p = 0; p < np; p++) if (ok(p)) for (let j = 0; j < 3; j++) out[p * 3 + j] = base[p * 3 + j] + Dt[p * 3 + j];
  }
  // 腕を抜いたあと：羽織を背の後ろ（座布団の後ろ寄りの真ん中）へ寄せてまとめる（膝の脇に紙くずのように広がらない＝第 1 回 8 人）。
  // 寄せるのは水平だけで、上下は重さのまま（布を宙に支えない）。脱ぎ終えて 2 秒ほどで、すっかり重さだけに
  const eB = ease((u - HU.outL0) / 0.35), wB = 0.12 * eB * (1 - ease((u - 1.25) / 0.4));
  if (wB > 0) {
    // 第 3・4 回：膝の後ろに覗くかたまり → 体の真後ろ（腰とかかとの陰）へ小さくまとめる。斜めの画でも腰に隠れるよう、幅を狭く・体に近く
    const X = S.C.X, cx = 0, cz = -0.35, k = 1 - 0.85 * eB;   // かかとの後ろ（かかとの上に掛かると、斜めの画で膝の後ろに白く覗いた）
    for (let p = 0; p < np; p++) {
      if (pin[p] >= wB) continue;
      const i = p * 3;
      out[i] = cx + (X[i] - cx) * k; out[i + 1] = X[i + 1]; out[i + 2] = Math.min(X[i + 2], cz + (X[i + 2] - cz) * k);
      pin[p] = wB;
    }
  }
  return out;
}
function hsWrite(S) { const g = S.cl.proxy.geometry; S.C.write(g.attributes.position, g.attributes.normal); }
function hsFrame(S, k) {   // こま k（k/30 秒）の骨と袖の層ができている前提で、一こま進める
  const [t0, t1] = TL.haori, u = (k / 30 - t0) / (t1 - t0);
  const cols = hsCols();
  if (S.f == null) {
    S.C.begin(S.cl.proxy.geometry.attributes.position.array);
    // 身頃の点の、胸から見た位置（前身頃・左右を見分ける）
    const ch = CHEST(); ch.updateMatrixWorld(true); const ci = ch.matrixWorld.clone().invert(), v = new THREE.Vector3();
    S.loc = new Float32Array(S.np * 3); for (let p = 0; p < S.np; p++) { v.fromArray(S.C.X, p * 3).applyMatrix4(ci); v.toArray(S.loc, p * 3); }
    // 胴の断面：着物の網（腕の重みのない頂点）を、背骨の向きで測る
    const kim = clothes.find(c => c !== S.cl), kp = kim.proxy.geometry.attributes.position.array, pts = [];
    for (let i = 0; i < kim.n; i++) if (!kim.side[i]) pts.push(kp[i * 3], kp[i * 3 + 1], kp[i * 3 + 2]);
    S.sl = HC.torsoSlices(THREE, pts, cols.inv, { dy: 0.03, margin: 0.010 });
    S.slC = HC.torsoSlices(THREE, pts, ci, { dy: 0.03, margin: 0, maxF: 0.24 });   // 胸の向きで測った同じ断面（目当ての道すじを胴の外に保つため）
    S.frz = [false, false, false];
    hsTargets(S, u, S.T0); S.cols0 = cols; S.f = k; hsWrite(S); return;
  }
  hsTargets(S, u, S.T1);
  S.C.step(S.T0, S.T1, S.pin, { torso: [{ inv0: S.cols0.inv, mat0: S.cols0.mat, inv1: cols.inv, mat1: cols.mat, sl: S.sl }], caps0: S.cols0.caps, caps1: cols.caps, floor: hsFloor },
    { dt: 1 / 30, sub: 4, iter: 6, damp: 0.985, fric: 0.8 });
  const tmp = S.T0; S.T0 = S.T1; S.T1 = tmp; S.cols0 = cols; S.f = k; hsWrite(S);
}
// 布が動いているあいだは、羽織を着物より少し手前に描く（数 mm の重なりで着物がまだらに透けて見えた＝第 1 回 11 人全員）
function hsOffset(on) {
  if (!HS) return;
  for (const mt of [].concat(HS.cl.proxy.material)) { if (!mt || mt.polygonOffset === on) continue; mt.polygonOffset = on; mt.polygonOffsetFactor = on ? -2 : 0; mt.polygonOffsetUnits = on ? -6 : 0; mt.needsUpdate = true; }
}
function haoriSim(t) {
  if (!HAORI2 || !TL.haori || !haoriMeshes.length) return;
  if (!HS) { HS = hsInit(); if (!HS) return; window.__HS = HS; }
  const [t0, t1] = TL.haori, fS = Math.round((t0 + HU.sim * (t1 - t0)) * 30), fE = Math.round((t1 + HS_SETTLE) * 30), fr = Math.round(t * 30);
  const S = HS;
  if (fr < fS) { S.f = null; S.done = false; S.cl.simOwned = false; if (S.cl.shade) S.cl.shade.visible = S.cl.m.visible; hsOffset(false); return; }
  if (S.cl.shade) S.cl.shade.visible = false;   // 袂の陰の膜は、布が動きだしたら外す（スキンの形に残ってしまう）
  hsOffset(true);
  if (HS_DBG === 'nokim') for (const c of clothes) if (c !== S.cl) { c.proxy.visible = false; if (c.shade) c.shade.visible = false; }
  if (S.done && S.f === fE) { S.cl.proxy.visible = HS_DBG !== 'nohaori'; hsWrite(S); return; }
  const want = Math.min(fr, fE);
  if (S.f != null && want === S.f) { hsWrite(S); return; }
  let replay = false;
  if (S.f == null || want < S.f) { S.f = null; S.done = false; S.cl.simOwned = false; }
  let k0 = S.f == null ? fS : S.f + 1;
  if (want - k0 > 150) k0 = want - 150;   // 生で見ているときに大きく飛んだ（一時停止のあとの戻り・もう一度）ときは、最後の 5 秒だけ布を進める（固まらないように）
  for (let k = k0; k <= want; k++) {
    if (k !== fr) { replay = true; pose(k / 30); vrm.update(0); vrm.scene.updateMatrixWorld(true); clothUpdate(k / 30); }
    else if (replay) { pose(t); vrm.update(0); vrm.scene.updateMatrixWorld(true); clothUpdate(t); }
    hsFrame(S, k);
  }
  if (replay && want !== fr) { pose(t); vrm.update(0); if (window.__RKL) window.__RKL.post(t); vrm.scene.updateMatrixWorld(true); clothUpdate(t); hsWrite(S); }
  else if (replay && window.__RKL) window.__RKL.post(t);
  if (want === fE) { S.done = true; S.cl.simOwned = true; }
}

// ============================================================================================
// カメラ（いくつかの決まった位置。台詞の切れ目＝間で切り替える。各カットのあいだはゆっくり動く）
// ============================================================================================
const HY = head0.y;
let handsMid = new THREE.Vector3(0, KOZA_Y + 0.35, 0.25);
{ pose(TL.title_sec + 0.5); vrm.update(1 / 30); vrm.scene.updateMatrixWorld(true);
  const a = vrm.humanoid.getRawBoneNode('rightHand').getWorldPosition(new THREE.Vector3());
  const b = vrm.humanoid.getRawBoneNode('leftHand').getWorldPosition(new THREE.Vector3());
  handsMid = a.clone().lerp(b, 0.35); handsMid.z += 0.06; }
const V = MODE === 'v';
// それぞれ：u＝カットの中の進み（0→1）。pos・見る点・画角（縦の画角）・ピントの先（'face' か 'hands'）・絞り
const SHOT = {
  // 引き：客席の頭ごしに高座を見る
  WIDE: u => ({ pos: [0.35 - 0.45 * u, V ? 1.35 : 1.22, (V ? 7.4 : 6.6) - 0.45 * u], look: [0, V ? HY - 0.05 : HY - 0.32, 0], fov: V ? 46 : 27, f: 'face', ap: 0.0022 }),
  // 見上げ：大欅と森の高さ（ケヤキを見上げる話のとき）
  // 見上げ：森では大欅の高さを、寄席では客席の低いところから碧を見上げる
  UP: u => VENUE !== 'yose' ? ({ pos: [-0.62 + 0.10 * u, 0.60, V ? 2.3 : 2.0], look: [-0.55, HY + 0.75 + 0.20 * u, -1.6], fov: V ? 58 : 44, f: 'face', ap: 0.0022 })
    : ({ pos: [(V ? -0.55 : -1.0) + 0.12 * u, 0.62, V ? 2.6 : 2.35], look: [V ? 0.02 : -0.05, HY - (V ? 0.2 : 0.05) + 0.04 * u, 0], fov: V ? 40 : 27, f: 'face', ap: 0.0035 }),
  // 中：膝から上（正面・少し上から）
  // 2026-10-13 第 4 回（4 人「引きの画で人物が小さく暗い・所作が読めない・スマホで見えにくい」）→ 中の画をひと回り寄せた（横 22→19°・縦 30→27°）
  MED: u => ({ pos: [0.18 - 0.12 * u, HY + 0.06, (V ? 3.25 : 3.15) - 0.18 * u], look: [0, HY - (V ? 0.35 : 0.22), 0], fov: V ? 27 : 19, f: 'face', ap: 0.0042 }),
  // 中・斜め（八っつぁんの台詞は上手＝右から、大家の台詞は下手＝左から。顔の向きの側から撮る）
  MED_R: u => { const a = 0.34 + 0.05 * u, r = V ? 3.1 : 2.9; return { pos: [Math.sin(a) * r, HY + 0.02, Math.cos(a) * r], look: [0.02, HY - (V ? 0.31 : 0.21), 0], fov: V ? 27 : 19, f: 'face', ap: 0.0045 }; },
  MED_L: u => { const a = -0.34 - 0.05 * u, r = V ? 3.1 : 2.9; return { pos: [Math.sin(a) * r, HY + 0.02, Math.cos(a) * r], look: [-0.02, HY - (V ? 0.31 : 0.21), 0], fov: V ? 27 : 19, f: 'face', ap: 0.0045 }; },
  // 寄り：顔（ゆっくり寄る）
  // 2026-10-14（テストプレー「PC の動画で頭のてっぺんが画面の上で切れる」）：寄り・中・中斜め・中寄りの見る点を上げ、頭の上に余白を残す（寄りは画角も少し広く）
  CU: u => ({ pos: [0.06, HY + 0.05, (V ? 1.55 : 1.42) - 0.12 * u], look: [0, HY + (V ? -0.04 : 0.03), 0], fov: V ? 30 : 20.5, f: 'face', ap: 0.0085 }),
  // 手と扇子
  // 手と扇子：斜め前から胸から下（手の所作が見える高さ）
  HANDS: u => ({ pos: [0.78 - 0.08 * u, HY - 0.18, V ? 2.05 : 1.9], look: [0, KOZA_Y + 0.5, 0.12], fov: V ? 36 : 28, f: 'hands', ap: 0.006 }),
  // 横から：手前に行灯のぼけ
  SIDE: u => ({ pos: [-2.15 + 0.15 * u, HY - 0.12, 1.85], look: [0, HY - (V ? 0.30 : 0.25), 0], fov: V ? 34 : 23, f: 'face', ap: 0.0050 }),
  SIDE_R: u => ({ pos: [2.15 - 0.15 * u, HY - 0.12, 1.85], look: [0, HY - (V ? 0.30 : 0.25), 0], fov: V ? 34 : 23, f: 'face', ap: 0.0050 }),
};
SHOT.REI = u => ({ pos: [0.04, HY - 0.12, (V ? 3.3 : 2.9) - 0.08 * u], look: [0, HY - (V ? 0.42 : 0.33), 0.05], fov: V ? 30 : 23.5, f: 'face', ap: 0.0040 });   // 2026-10-14：横は頭の上に余白（冒頭の出の画）
SHOT.HANDSF = u => SHOT.HANDS(0.5);   // 手もとの画を動かさない（戸をたたくあいだ画が横へ流れない。v6）
SHOT.MEDC = u => ({ pos: [0.08 - 0.05 * u, HY + 0.03, (V ? 2.5 : 2.35) - 0.1 * u], look: [0, HY - 0.13, 0], fov: V ? 30 : 22, f: 'face', ap: 0.0055 });
// カット表：[台詞の番号（この台詞の頭の前の間で切る）, カメラ]。-1 は始まり。最後の 'bow' はサゲのあとのお辞儀
// カット表：[台詞の番号（この台詞の頭の前の間で切る）, カメラ]。-1 は始まり、'bow' はサゲのあとのお辞儀。
// 演目ごとに <演目>/_dev/cuts.json（?cuts=）で決められる。無ければ、台詞の長さと役から決まった規則で組む（autoCuts）。
const CUTV2 = q.get('cutv') !== '1';   // ?cutv=1 で前のカットの規則
function autoCuts() {
  const c = [[-1, 'WIDE']];
  // 2026-10-06 検証役 p2（落語好き）「まくらに横からの画が残っている」→ まくらは客に向かって話す地なので、正面の画だけ
  const mk = ['MED', 'CU', 'MED_L', 'CU', 'MED_R', 'HANDS', 'MED', 'WIDE', 'MED_R', 'CU', 'MED_L', 'WIDE'];
  const alt = ['CU', 'WIDE', 'SIDE', 'HANDS', 'MED', 'SIDE_R', 'CU', 'UP'];
  let last = 0, nm = 0, nd = 0, na = 0;
  for (let i = 0; i < L.length; i++) {
    const l = L[i], d = l.end - l.start;
    if (l.sage) { c.push([i, 'CU']); continue; }
    if (l.role === 'makura') { if (i > 0 && (l.start - last) > 4 && d > 2.5) { c.push([i, mk[nm++ % mk.length]]); last = l.start; } continue; }
    if (l.act && l.act.type === 'knock') { c.push([i, 'HANDS']); if (i + 1 < L.length) c.push([i + 1, 'MEDC']); last = L[Math.min(i + 1, L.length - 1)].start; i++; continue; }   // 扇子で床を打つところは手もとを見せる
    if (i > 0 && L[i - 1].role === 'makura') { c.push([i, 'WIDE']); last = l.start; continue; }
    // 2026-10-06 検証役（落語好き・アニメーター）「台詞ごとに横へ回るので上下が消える」「役の交替でカメラを切りすぎ」：
    // 本題は正面の中（MED）を軸にし、首を回す芝居で上下を見せる。切るのは 12 秒より空いたときだけ（30 秒を超えて同じ画にしない）
    // 2026-10-07 試し版（検証役パネル「引きの画で碧が小さく表情が見えない」）：本題は寄り（CU）と中（MED）を交互に、引き（WIDE）は外す。間は 9 秒から
    if (l.start - last < (CUTV2 ? 9 : 12) || d < 1.2) continue;
    const k = (CUTV2 ? ['CU', 'MED', 'CU', 'MED_R', 'CU', 'MED_L'] : ['MED', 'CU', 'MED', 'WIDE'])[nd++ % (CUTV2 ? 6 : 4)];
    c.push([i, k]); last = l.start;
  }
  c.push(['bow', 'MED']);
  return c;
}
const CUTS = autoCuts();   // 演目ごとのカット表（cuts.json）はいまどの演目にもない
// 羽織を脱ぐ間は、全身が入る「中」で見せる（カット表に足す）
if (TL.haori) { const hi = L.findIndex(l => l.sec === 'hondai'); if (hi > 0 && !CUTS.some(c => c[0] === 'haori')) CUTS.splice(CUTS.findIndex(c => typeof c[0] === 'number' && c[0] >= hi) >= 0 ? CUTS.findIndex(c => typeof c[0] === 'number' && c[0] >= hi) : CUTS.length - 1, 0, ['haori', 'MED']); }
const cutTimes = CUTS.map(([i, k]) => {
  let t0;
  if (i === -1) t0 = 0;
  else if (i === 'bow') t0 = L[L.length - 1].end + 0.35;
  else if (i === 'haori') t0 = TL.haori[0] - 0.35;
  else if (L[i].act) t0 = L[i].start - (L[i].act.pre || 0) - 0.3;        // 所作のある台詞は、所作の頭から見せる
  else if (i > 0 && L[i].sec === 'hondai' && L[i - 1].sec === 'makura' && TL.haori) t0 = TL.haori[1] + 0.2;
  else t0 = i > 0 ? (L[i - 1].end + L[i].start) / 2 : L[i].start - 0.2;
  return { t0, k, i };
});
// 2026-10-06 本人「枕で話しながら羽織をゆっくり脱いで…話に入る前に先に脱いでおいて」：羽織はまくらの終わりの台詞を話しながら脱ぐ。
// 脱いでいるあいだは「中」のまま切らない（まくらのカットのうち、羽織の頭より後のものは外す）。時刻の順に並べ直す
if (TL.haori) { const h0 = TL.haori[0] - 0.35;
  for (let j = cutTimes.length - 1; j >= 0; j--) { const c = cutTimes[j]; if (typeof c.i === 'number' && c.i >= 0 && L[c.i].sec === 'makura' && c.t0 > h0 - 1.5) cutTimes.splice(j, 1); }
  cutTimes.sort((x, y) => x.t0 - y.t0); }
// 2026-10-06 検証役 p2（落語好き）「煙管が顔の寄りの中で出る」→ 煙管の間は「中」で見せ、吸い終えて最初の一言から寄りに戻す
for (const l of L) { if (!l.act || l.act.type !== 'kiseru') continue;
  const a0 = l.start - (l.act.pre || 0) - 0.3; let cur = cutTimes[0]; for (const c of cutTimes) if (c.t0 <= a0) cur = c;
  if (cur.k === 'CU' || cur.k === 'UP') { const back = { t0: l.start + 0.3, k: cur.k };
    cutTimes.push({ t0: a0, k: 'MED' }); if (!cutTimes.some(c => c.t0 > a0 && c.t0 <= back.t0 + 0.5)) cutTimes.push(back); cutTimes.sort((x, y) => x.t0 - y.t0); } }
for (const a of ACTS) { if (!RK.SHOSA[a.type]) continue;
  const a0 = a.t0 - 0.45; let cur = cutTimes[0]; for (const c of cutTimes) if (c.t0 <= a0) cur = c;
  if (cur.k === 'CU' || cur.k === 'UP') { cutTimes.push({ t0: a0, k: 'MED' }); if (!cutTimes.some(c => c.t0 > a0 && c.t0 <= a.t1 + 0.8)) cutTimes.push({ t0: a.t1 + 0.6, k: cur.k }); cutTimes.sort((x, y) => x.t0 - y.t0); } }
// ⑧ 冒頭の礼は題の札が消えるころから REI で（引きのままだと手をつく所が見えない）。戸をたたく画は扇子の受け渡しの前から（途中で切らない）
cutTimes.push({ t0: TL.title_sec - 2.4, k: 'REI' });
for (const c of cutTimes) { if (typeof c.i === 'number' && c.i >= 0 && L[c.i].act && L[c.i].act.type === 'knock' && (L[c.i].act.taps || []).length) c.t0 = Math.min(c.t0, L[c.i].act.taps[0] - 0.95); }
cutTimes.sort((x, y) => x.t0 - y.t0);
// ⑨ 戸をたたくあいだ（扇子を渡してから右手へ戻すまで）は画を切らない：その間に始まる切りかえは、戻したあと（最後の打音＋0.6 秒）へずらす。塗るは少し斜め（MED_L）から（v5）
for (const l of L) { const tp = l.act && l.act.type === 'knock' ? (l.act.taps || []) : []; if (!tp.length) continue; const a0 = tp[0] - 0.9, a1 = tp[tp.length - 1] + 0.6;
  for (const c of cutTimes) { if (c.t0 > a0 + 0.05 && c.t0 < a1) c.t0 = a1; if (c.k === 'HANDS' && Math.abs(c.t0 - (tp[0] - 0.95)) < 0.05) c.k = 'HANDSF'; } }
for (const a of ACTS) { if (a.type !== 'nuru') continue; for (const c of cutTimes) if (c.t0 >= a.t0 - 0.5 && c.t0 <= a.t0 - 0.4 && c.k === 'MED') c.k = 'MED_L'; }
cutTimes.sort((x, y) => x.t0 - y.t0);
for (let j = cutTimes.length - 2; j >= 1; j--) if (cutTimes[j + 1].t0 - cutTimes[j].t0 < 0.8) cutTimes.splice(j, 1);   // 0.8 秒より短い画は残さない（一瞬だけ寄る画をなくす）
cutTimes.forEach((c, j) => c.t1 = j + 1 < cutTimes.length ? cutTimes[j + 1].t0 : TL.duration + 0.1); window.__cuts = cutTimes;
const FORCE = q.get('dbg') ? 'DBG' : q.get('shot');
// 確かめ用の自由なカメラ（?dbg=px,py,pz,lx,ly,lz,fov）
if (q.get('dbg')) { const d = q.get('dbg').split(',').map(Number); SHOT.DBG = () => ({ pos: d.slice(0, 3), look: d.slice(3, 6), fov: d[6] || 30, f: 'hands', ap: 0.0001 }); }
function shotAt(t) {
  let c = cutTimes[0];
  for (const x of cutTimes) if (t >= x.t0) c = x;
  const k = FORCE || c.k;
  const u = FORCE ? 0.5 : Math.min(1, Math.max(0, (t - c.t0) / Math.max(1, c.t1 - c.t0)));
  // 2026-10-18 第 14 回（4 人「サゲのあとの礼で、ついた手の指先と座布団の下が画の下の端で切れる」）：中の画の見る点を上げた（10-14）ぶん、
  // 礼の画（カット表の 'bow'）だけは横だけ見る点を下げ（HY-0.27）、画角を少し広げる（縦は前のまま）。?bowmed=0 で前の見え方
  if (!FORCE && c.i === 'bow' && k === 'MED' && q.get('bowmed') !== '0') { const s0 = SHOT.MED(u); return { k, ...s0, look: [0, HY - (V ? 0.35 : 0.27), 0], fov: V ? 27 : 20 }; }
  return { k, ...SHOT[k](u) };
}
window.__cuts = cutTimes;

// ============================================================================================
// 仕上げ：被写界深度（ぼけ）→ にじみ（ブルーム）→ 色の変換 → 色の仕上げ（暖かい緑・周辺を落とす・粒子）
// ============================================================================================
// 仕上げの描き先にも MSAA（4 標本）を入れる（後処理を通すと画面の antialias が効かず、髪先が点状にざらついたため）
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W * DPR, H * DPR, { type: THREE.HalfFloatType, samples: 4 }));
composer.setPixelRatio(DPR); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bokeh = new BokehPass(scene, camera, { focus: 3, aperture: 0.004, maxblur: 0.012 });
{ // ぼけの奥行きを測るときは、映り込み・光の粒・遠くの提灯の光を描かない（奥行きの絵が乱れるため）
  const orig = bokeh.render.bind(bokeh);
  bokeh.render = (...a) => { particles.visible = false; for (const r of reflectors) r.visible = false; window.__inRefl = true;
    try { orig(...a); } finally { particles.visible = true; for (const r of reflectors) r.visible = true; window.__inRefl = false; } };
}
const POST = q.get('post') ? q.get('post') !== '0' : !LITE;
if (POST) composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(Math.round(W / 2), Math.round(H / 2)), Number(q.get('bloom') ?? 0.38), 0.55, Number(q.get('bth') ?? 1.6));
if (POST) composer.addPass(bloom);
composer.addPass(new OutputPass());
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uFrame: { value: 0 }, uRes: { value: new THREE.Vector2(W * DPR, H * DPR) }, uGrain: { value: Number(q.get('grain') ?? 0.035) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uFrame; uniform vec2 uRes; uniform float uGrain; varying vec2 vUv;
    float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      // 暗部は深い緑へ、明部は琥珀へ（夜の森と行灯）
      c = mix(c, c * vec3(0.98, 0.97, 1.02) + vec3(0.010, 0.008, 0.012), 1.0 - smoothstep(0.0, 0.45, l));
      c *= mix(vec3(1.0), vec3(1.07, 1.0, 0.86), smoothstep(0.35, 0.95, l));
      // 彩度を少し落とし、ゆるい S 字
      c = mix(vec3(l), c, 0.90);
      c = c * c * (3.0 - 2.0 * c) * 0.30 + c * 0.70;
      // 周辺を落とす
      vec2 d = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
      float v = smoothstep(1.05, 0.35, length(d) * (uRes.x > uRes.y ? 0.95 : 1.25));
      c *= mix(0.55, 1.0, v);
      // フィルムの粒子（コマごとに決まった乱数）
      float g = hash(floor(gl_FragCoord.xy) + vec2(mod(uFrame * 61.0, 1009.0), mod(uFrame * 113.0, 997.0))) - 0.5;
      c += g * uGrain * (1.0 - 0.6 * l);
      gl_FragColor = vec4(c, 1.0);
    }`,
});
composer.addPass(grade);

const tmpV = new THREE.Vector3();
let KEYL = HL.keyLight, BLOOM0 = bloom.strength;
function flick(t, s) {
  const P2 = Math.PI * 2;
  return 0.5 * Math.sin(P2 * 0.31 * t + s) + 0.3 * Math.sin(P2 * 0.83 * t + 2.1 * s + 1.0) + 0.15 * Math.sin(P2 * 1.9 * t + 3.7 * s + 2.0) + 0.05 * Math.sin(P2 * 4.3 * t + 5.3 * s);
}
function world(t, now) {
  particles.material.uniforms.uT.value = t;
  particles.material.uniforms.uScale.value = H * DPR / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  // 提灯の火のゆらぎ（ゆっくり・小さく・明滅しない）
  for (const [i, m] of lanternMats.entries()) m.emissiveIntensity = m.userData.k * (1 + 0.07 * flick(now, i * 1.7));
  for (const [i, [Lt, A]] of flickerLights.entries()) { if (Lt.userData.base === undefined) Lt.userData.base = Lt.intensity; Lt.intensity = Lt.userData.base * (1 + A * flick(now, i * 2.3 + 0.5)); }
  // 客の小さな揺れ（呼吸）。笑いどころでは少し肩が揺れる
  for (const p of audience) { p.userData.h.position.y = (p.userData.h0 ?? 0.80) + 0.004 * Math.sin(now * 1.4 + p.userData.ph); p.rotation.z = 0.01 * Math.sin(now * 0.5 + p.userData.ph); }
  for (const [i, n] of HL.noren.entries()) n.rotation.x = 0.03 * Math.sin(now * 0.9 + i * 1.3) + 0.015 * Math.sin(now * 2.3 + i);
}

// ============================================================================================
// 噺に重ねる Qualia の層（まくらでは出さない。本題で薄く、その層に触れる台詞のあいだ少し濃く。サゲのあとは消す）
// ============================================================================================
const QX = buildQualia({ THREE, scene, rnd }, HL, ENMO.slug);
const QDEF = QL[ENMO.slug];
const HONDAI0 = TL.haori ? TL.haori[1] : (L.find(l => l.sec === 'hondai') || L[0]).start;
const QLINES = L.filter(l => l.sec !== 'makura' && QDEF.re.test(l.text));
function qLevel(t) {
  if (q.get('qualia') === '0' || !UI.qualiaOn()) return 0;
  let base = 0.30 * ease((t - HONDAI0 - 1.5) / 6);
  let pk = 0; for (const l of QLINES) pk = Math.max(pk, ease((t - l.start + 0.8) / 1.2) * (1 - ease((t - l.end - 0.8) / 2.2)));
  return Math.min(1, (base + 0.62 * pk) * (1 - ease((t - END.se - 0.3) / 2.5)));
}

// ============================================================================================
// 描く（声の再生位置 t で、碧・字幕・灯・層を決める）
// ============================================================================================
let started = false, startAt = 0;
function lights(t, now) {
  // 開演前：客席は明るめ・高座は薄暗い。出囃子が始まると客席を落とし、高座を上げる。終わりの札のころ客席を戻す
  const up = started ? ease((now - startAt) / 2.2) : 0;
  const back = started ? ease((t - TL.bow_end - 0.6) / 2.0) : 0;
  HL.stage(0.38 + 0.62 * up);
  HL.house(1 - 0.75 * up + 0.6 * back);
  const kido = CAM.phaseName() === 'kido' || CAM.phaseName() === 'walk' ? 1 : 0;
  for (const l of HL.kidoLights) { if (l.userData.k0 === undefined) l.userData.k0 = l.intensity; l.intensity = l.userData.k0 * (0.25 + 0.75 * kido); }
}
const FR = {   // 客席の目が「寄る」先（カット表の画の種類 → 見る点と、縦に入れたい半分の高さ）
  WIDE: () => [tmpV.set(0, HY - 0.25, 0), 1.05], UP: () => [tmpV.set(0, HY - 0.2, 0), 0.62],
  MED: () => [tmpV.set(0, HY - 0.16, 0), 0.58], MED_R: () => [tmpV.set(0.03, HY - 0.14, 0), 0.56], MED_L: () => [tmpV.set(-0.03, HY - 0.14, 0), 0.56],
  MEDC: () => [tmpV.set(0, HY - 0.08, 0), 0.46], CU: () => [tmpV.set(0, HY + 0.03, 0), 0.36], REI: () => [tmpV.set(0, HY - 0.38, 0.05), 0.6],
  HANDS: () => [tmpV.copy(handsMid), 0.38], HANDSF: () => [tmpV.copy(handsMid), 0.38], SIDE: () => [tmpV.set(0, HY - 0.24, 0), 0.52], SIDE_R: () => [tmpV.set(0, HY - 0.24, 0), 0.52],
};
function attention(t) {
  if (!started) return { p: tmpV.set(0.45, HY - 0.3, 0.2).clone(), h: 1.25 };
  if (t > TL.bow_end + 0.5) return { p: tmpV.set(0.7, HY - 0.35, 0.4).clone(), h: 1.5 };
  const s = shotAt(t); const f = (FR[s.k] || FR.MED)(); return { p: f[0].clone(), h: f[1] };
}
const AUD0 = AUD.clone(); let audApplied = null;
function renderLive(t, now, dt) {
  if (AUD_SEAT && audApplied !== AUD_SEAT) { AUD.copy(AUD_SEAT).lerp(AUD0, 0.05); audApplied = AUD_SEAT; }
  pose(t); vrm.update(dt); if (window.__RKL) window.__RKL.post(t);
  vrm.scene.updateMatrixWorld(true); clothUpdate(t);
  if (HAORI2) haoriSim(t); else haoriPost(t);
  fanPost(t);
  const c = CAM.update(now, attention(t));
  // 寄っているときは主光とにじみを一段落とす（顔が白く飛ばないように）
  const close = Math.max(0, Math.min(1, (0.75 - c.h) / 0.4));
  if (KEYL) KEYL.intensity *= 1 - 0.2 * close; bloom.strength = BLOOM0 * (1 - 0.2 * close);
  if (POST) { bokeh.uniforms.focus.value = c.dist; bokeh.uniforms.aperture.value = 0.0016 * (1 + 2.2 * close); bokeh.uniforms.maxblur.value = 0.009; }
  world(t, now);
  QX.set(now, qLevel(t)); UI.qualia(QDEF.label, qLevel(t));
  grade.uniforms.uFrame.value = Math.floor(now * 30) % 997;
  composer.render();
}
// 時計：声の再生位置。currentTime の刻みが粗い端末でも動きが滑らかになるよう、前の値から実時間で進めて、ずれたら合わせる
const audio = UI.audio;
let clockT = 0, clockPerf = 0;
function clock(now) {
  if (!started) return 0;
  const a = audio.currentTime;
  if (audio.paused || audio.ended) { clockT = a; clockPerf = now; return audio.ended ? TL.duration : a; }
  let p = clockT + (now - clockPerf) * (audio.playbackRate || 1);
  if (Math.abs(p - a) > 0.15) p = a;
  clockT = p; clockPerf = now; return p;
}
UI.onStart(() => { started = true; startAt = performance.now() / 1000; HL.mekuri.flipTo('碧'); clockT = 0; clockPerf = startAt; });
let lastNow = performance.now() / 1000, frames = 0;
fullRender = (ms) => {
  const now = ms / 1000, dt = Math.max(1 / 240, Math.min(0.1, now - lastNow)); lastNow = now;
  const t = clock(now);
  window.__t = t;
  lights(t, now);
  if (started) HL.mekuri.flip((now - startAt) / 1.1);
  renderLive(t, now, dt);
  UI.tick(t, TL);
  frames++;
  requestAnimationFrame(fullRender);
};
addEventListener('resize', () => {
  W = innerWidth; H = innerHeight; renderer.setSize(W, H); composer.setSize(W, H);
  grade.uniforms.uRes.value.set(W * DPR, H * DPR); camera.aspect = W / H; camera.updateProjectionMatrix();
  const m = H > W ? 'v' : 'h'; if (m !== MODE) { document.body.classList.remove(MODE); MODE = m; document.body.classList.add(MODE); }
});
vrm.springBoneManager?.reset();
for (let i = 0; i < 60; i++) { pose(0); vrm.update(1 / 30); }
window.__P = P; window.__TL = TL; window.__vrm = vrm; window.__scene = scene; window.__frames = () => frames;
window.__renderT = t => { renderLive(t, performance.now() / 1000, 1 / 30); };
requestAnimationFrame(fullRender);
window.__ready = true; UI.aoiReady(TL);

// ============================================================================================
// 客席の目（木戸 → 通路 → 席。席では、噺の画の種類に合わせて、ゆっくり寄ったり引いたりする。指で見回し・つまんで寄れる）
// ============================================================================================
function createCamera() {
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z); const _cv = new THREE.Vector3(); const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
  const Y = HL.HALL_Y, FZ = HL.FZ;
  const st = { phase: 'kido', t0: 0, yaw: 0, pitch: 0, zoom: 1, input: -1e9, mode: 'yoru', seat: null, from: null,
    pos: HL.kidoCam.pos.clone(), look: HL.kidoCam.look.clone(), h: 1.3, fov: 50, lastNow: 0, seatName: null };
  const walk = new THREE.CatmullRomCurve3([HL.kidoCam.pos.clone(), V3(0, Y + 1.58, FZ + 2.4), V3(0, Y + 1.58, FZ + 0.5), V3(0, Y + 1.58, FZ - 1.0), HL.aisle.clone()]);
  const STAGE = V3(0, 1.0, 0);
  const curLook = st.look.clone(); let curH = 1.3;
  const el = renderer.domElement; el.style.touchAction = 'none';
  const ptrs = new Map(); let pinch0 = 0, zoom0 = 1;
  el.addEventListener('pointerdown', e => { ptrs.set(e.pointerId, [e.clientX, e.clientY]); el.setPointerCapture(e.pointerId); st.input = performance.now() / 1000;
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); zoom0 = st.zoom; } });
  el.addEventListener('pointermove', e => { if (!ptrs.has(e.pointerId)) return; const p = ptrs.get(e.pointerId); st.input = performance.now() / 1000;
    if (ptrs.size === 1) { st.yaw = Math.max(-0.9, Math.min(0.9, st.yaw - (e.clientX - p[0]) * 0.0035)); st.pitch = Math.max(-0.45, Math.min(0.45, st.pitch + (e.clientY - p[1]) * 0.0030)); }
    ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch0 > 0) st.zoom = Math.max(0.45, Math.min(2.6, zoom0 * pinch0 / d)); } });
  const up = e => { ptrs.delete(e.pointerId); pinch0 = 0; };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', e => { e.preventDefault(); st.zoom = Math.max(0.45, Math.min(2.6, st.zoom * Math.exp(e.deltaY * 0.0012))); st.input = performance.now() / 1000; }, { passive: false });
  el.addEventListener('dblclick', () => { st.yaw = st.pitch = 0; st.zoom = 1; });
  const api = {
    phaseName: () => st.phase,
    seatName: () => st.seatName,
    setMode(m) { st.mode = m; },
    walkIn(now) { if (st.phase !== 'kido') return; st.phase = 'walk'; st.t0 = now; st.yaw = st.pitch = 0; },
    toAisle() { st.phase = 'aisle'; st.pos.copy(HL.aisle); },
    sit(name, now) { const s = HL.seats[name]; if (!s) return; st.from = st.pos.clone(); st.seat = s.pos.clone(); st.seatName = name; st.phase = 'sit'; st.t0 = now; st.yaw = st.pitch = 0; st.zoom = 1;
      AUD_SEAT = s.pos.clone(); },
    update(now, att) {
      const dt = Math.max(0, Math.min(0.1, now - (st.lastNow || now))); st.lastNow = now;
      let look, h = 1.3, tau = 0.9;
      if (st.phase === 'kido') { st.pos.copy(HL.kidoCam.pos).add(_cv.set(Math.sin(now * 0.21) * 0.05, Math.sin(now * 0.33) * 0.02, 0)); look = HL.kidoCam.look; h = 1.6; }
      else if (st.phase === 'walk') {
        const u = Math.min(1, (now - st.t0) / 5.2), e = u * u * (3 - 2 * u);
        st.pos.copy(walk.getPointAt(e)); st.pos.y += 0.012 * Math.sin(u * 5.2 * 2 * Math.PI * 0.9) * Math.sin(Math.PI * u);
        const ahead = walk.getPointAt(Math.min(1, e + 0.12)).clone(); ahead.y = st.pos.y - 0.1;
        look = ahead.lerp(STAGE, ease((u - 0.35) / 0.5)); h = 1.5; tau = 0.35;
        if (u >= 1) { st.phase = 'aisle'; UI.atAisle(); }
      } else if (st.phase === 'aisle') { st.pos.copy(HL.aisle); look = STAGE; h = 1.7; }
      else if (st.phase === 'sit' || st.phase === 'seat') {
        if (st.phase === 'sit') {
          const u = Math.min(1, (now - st.t0) / 2.6), e = u * u * (3 - 2 * u);
          const mid = V3(st.seat.x * 0.75 + st.from.x * 0.25, st.from.y, st.seat.z + 0.5);
          const a = st.from.clone().lerp(mid, Math.min(1, e * 1.6)), b = mid.clone().lerp(st.seat, ease((e - 0.45) / 0.55));
          st.pos.copy(e < 0.45 ? a : b);
          if (u >= 1) { st.phase = 'seat'; UI.seated(st.seatName); }
        } else st.pos.copy(st.seat).add(_cv.set(0, 0.004 * Math.sin(now * 1.1), 0));
        look = att ? att.p : STAGE; h = att ? att.h : 1.2;
        if (st.mode === 'seki') { look = _cv.set(0.3, 1.0, 0.2).clone(); h = 1.15; }
        tau = 1.1;
      }
      // しばらく触らなければ、見回しと寄りを元へ戻す
      if (now - st.input > 7) { const k = 1 - Math.exp(-dt / 1.6); st.yaw *= 1 - k; st.pitch *= 1 - k; st.zoom += (1 - st.zoom) * k; }
      const k = 1 - Math.exp(-dt / tau);
      curLook.lerp(look, st.phase === 'walk' ? 1 : k); curH += (h - curH) * k;
      const dir = curLook.clone().sub(st.pos); const dist = dir.length(); dir.normalize();
      dir.applyAxisAngle(V3(0, 1, 0), st.yaw);
      const side = V3(0, 1, 0).cross(dir).normalize(); dir.applyAxisAngle(side, -st.pitch);
      camera.position.copy(st.pos); camera.lookAt(st.pos.clone().add(dir));
      // 画角：見たい高さ（h）と、その 0.8 倍の幅が、縦長の画面でも入るように
      const hh = Math.max(camera.aspect < 0.8 ? 0.5 : 0, curH) * st.zoom, tv = Math.max(hh / dist, (hh * 0.8) / dist / camera.aspect);
      camera.fov = Math.max(6, Math.min(72, THREE.MathUtils.radToDeg(2 * Math.atan(tv))));
      camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
      return { dist, h: hh };
    },
  };
  return api;
}
