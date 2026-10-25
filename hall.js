// Qualia/rakugo ── 3D の寄席の建物（2026-10-26 本人「落語の動画ではなく、落語の寄席のような感じで、3D ソフトにしてください。」）
// 木戸（入口）・まねき・のれん・提灯／客席（椅子の列と左右の桟敷）／高座（座布団・めくり・見台・膝隠し・襖・欄間）・灯り。
// 座標は高座の碧が原点（客席は +z）。舞台の板は y=0、客席の床は y=-0.75。
// 寄席の道具の言い方は 京都観光Navi「落語」（https://ja.kyoto.travel/traditionalculture/rakugo.php）で確かめた：
//   めくり＝出演者名の紙の札（江戸・上方とも）／見台・小拍子・膝隠し＝上方落語の道具。
// 実在の寄席の名前・意匠は写していない（提灯は紋だけ、まねきは演目名）。板の質感は Poly Haven の CC0、ほかは自作。
export async function buildHall(ctx) {
  const { THREE, scene, renderer, KOZA_Y, rnd, ENM, BASE } = ctx;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const LITE = !!ctx.lite;
  const out = { particles: null, audience: [], lanternMats: [], flickerLights: [], boards: [], seats: {}, houseMats: [] };
  const texL = new THREE.TextureLoader();
  const loadTex = (p, srgb) => new Promise((ok, ng) => texL.load(BASE + p, t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = maxAniso; if (srgb) t.colorSpace = THREE.SRGBColorSpace; ok(t);
  }, undefined, ng));
  const pbr = async name => ({
    map: await loadTex(`sozai/${name}/${name}_diff_1k.jpg`, true),
    normalMap: await loadTex(`sozai/${name}/${name}_nor_1k.jpg`, false),
    roughnessMap: await loadTex(`sozai/${name}/${name}_rough_1k.jpg`, false),
  });
  const [HINOKI, SUGI] = await Promise.all([pbr('hinoki_planks'), pbr('japanese_cedar_planks')]);
  function texMat(T, rx, ry, color, rough = 0.6) {
    const m = new THREE.MeshStandardMaterial({ color, roughness: rough, envMapIntensity: 0.5, normalScale: new THREE.Vector2(0.7, 0.7) });
    for (const k of ['map', 'normalMap', 'roughnessMap']) { m[k] = T[k].clone(); m[k].repeat.set(rx, ry); m[k].needsUpdate = true; }
    return m;
  }
  const canvasTex = (w, h, draw, srgb = true) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
    const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; return t;
  };
  const box = (w, h, d, m, x, y, z, parent = scene) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent.add(o); return o; };
  const HALL_Y = -0.5, STAGE_Z1 = 1.55, BACK_Z = 8.5, WALL_X = 5.5, CEIL_Y = 3.7;
  out.HALL_Y = HALL_Y; out.BACK_Z = BACK_Z;
  const lacq = new THREE.MeshStandardMaterial({ color: 0x140c08, roughness: 0.32 });
  const darkWood = new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.55 });

  // ---- 環境光（部屋の反射だけ。暗い寄席なので弱く）
  {
    const { RoomEnvironment } = ctx.RoomEnvironment;
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.2;
  }
  scene.background = new THREE.Color(0x05060a);
  scene.fog = new THREE.Fog(0x07080c, 10, 26);

  // ==== 舞台と高座 ===========================================================================
  {
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(2 * WALL_X, STAGE_Z1 + 3.2), texMat(HINOKI, 5, 2.4, 0x9a7a58, 0.55));
    fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0, (STAGE_Z1 - 3.2) / 2); fl.receiveShadow = true; scene.add(fl);
    box(2 * WALL_X, -HALL_Y, 0.08, texMat(HINOKI, 5, 0.4, 0x4a3726, 0.6), 0, HALL_Y / 2, STAGE_Z1 + 0.04);
    // 高座（檜の台）
    const top = texMat(HINOKI, 1.1, 0.9, 0x8e6c4c, 0.5), side = texMat(HINOKI, 1.2, 0.3, 0x5a412c, 0.55);
    const k = new THREE.Mesh(new THREE.BoxGeometry(2.0, KOZA_Y, 1.6), [side, side, top, side, side, side]);
    k.position.set(0, KOZA_Y / 2, -0.05); k.receiveShadow = true; k.castShadow = true; scene.add(k);
    box(2.04, 0.05, 0.06, new THREE.MeshStandardMaterial({ color: 0x24170e, roughness: 0.35 }), 0, KOZA_Y - 0.025, 0.76);
    // 高座の前に掛けた紫の布（台の前の面を隠す・寄席の高座の前幕に見立てたもの）
    const cloth = canvasTex(512, 128, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3b2238'); gr.addColorStop(1, '#22121f'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.globalAlpha = 0.18; for (let x = 0; x < w; x += 3) { g.fillStyle = x % 6 ? '#000' : '#6a4a66'; g.fillRect(x, 0, 1, h); } g.globalAlpha = 1;
      g.fillStyle = '#b8a070'; g.fillRect(0, 6, w, 3);
    });
    const mae = new THREE.Mesh(new THREE.PlaneGeometry(2.02, KOZA_Y - 0.03), new THREE.MeshStandardMaterial({ map: cloth, roughness: 0.92 }));
    mae.position.set(0, (KOZA_Y - 0.03) / 2, 0.755); scene.add(mae);
  }
  // ---- 見台と膝隠し（上方の道具。?kendai=0 で外せる＝江戸の高座）
  {
    const g = new THREE.Group();
    const lq = new THREE.MeshPhysicalMaterial({ color: 0x1a0a06, roughness: 0.22, clearcoat: 0.8, clearcoatRoughness: 0.25 });
    // 見台：天板（手前へ少し傾けた書見台）と二本の脚
    const tp = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.022, 0.2), lq); tp.position.set(0, 0.24, 0); tp.rotation.x = 0.16; tp.castShadow = true; g.add(tp);
    for (const sx of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.23, 0.13), lq); leg.position.set(sx * 0.18, 0.115, 0); leg.castShadow = true; g.add(leg);
      const ft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.2), lq); ft.position.set(sx * 0.18, 0.01, 0); g.add(ft);
    }
    // 小拍子（見台の上に二本）
    const kb = new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.5 });
    for (const dx of [-0.04, 0.04]) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.016, 0.022), kb); s.position.set(0.12 + dx * 0.3, 0.262, 0.01 + dx); s.rotation.set(0.16, 0.2, 0); g.add(s); }
    g.position.set(0, KOZA_Y, 0.6);
    // 膝隠し：見台の前に立てる低い衝立（二枚の板を蝶番でつないだ形）
    const kk = new THREE.Group();
    const pan = canvasTex(256, 128, (c, w, h) => { c.fillStyle = '#1a0c08'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8a6a3a'; c.lineWidth = 3; c.strokeRect(10, 10, w - 20, h - 20);
      c.globalAlpha = .25; c.fillStyle = '#c9a24e'; for (let i = 0; i < 70; i++) c.fillRect(20 + rnd(i + 900) * (w - 40), 20 + rnd(i + 950) * (h - 40), 2, 2); });
    const pm = new THREE.MeshPhysicalMaterial({ map: pan, roughness: 0.3, clearcoat: 0.6 });
    for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.17, 0.018), pm); p.position.set(sx * 0.175, 0.085, sx * -0.015); p.rotation.y = sx * -0.12; p.castShadow = true; kk.add(p); }
    kk.position.set(0, KOZA_Y, 0.73);
    scene.add(g, kk); out.kendai = [g, kk];
  }
  // ---- 高座の後ろ：襖（鳥の子に金の砂子）と欄間、奥の杉の板壁・袖の幕
  {
    const fusuma = canvasTex(512, 1024, (g, w, h) => {
      g.fillStyle = '#b9ae95'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) { const y = rnd(i + 3) ** 1.7 * h * 0.5, x = rnd(i + 7) * w; g.fillStyle = `rgba(186,146,62,${0.10 + 0.25 * rnd(i + 11)})`; g.fillRect(x, y, 1.6, 1.6); }
      for (let i = 0; i < 3000; i++) { const y = h - rnd(i + 13) ** 2 * h * 0.3, x = rnd(i + 17) * w; g.fillStyle = `rgba(186,146,62,${0.1 + 0.2 * rnd(i + 19)})`; g.fillRect(x, y, 1.4, 1.4); }
      g.globalAlpha = 0.05; for (let y = 0; y < h; y += 2) { g.fillStyle = rnd(y) > 0.5 ? '#000' : '#fff'; g.fillRect(0, y, w, 1); } g.globalAlpha = 1;
    });
    const fm = new THREE.MeshStandardMaterial({ map: fusuma, roughness: 0.85 });
    const PW = 0.95, PH = 1.95, Z = -1.15, N = 4;
    for (let i = 0; i < N; i++) {
      const x = (i - (N - 1) / 2) * PW;
      const p = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.02, PH), fm); p.position.set(x, PH / 2, Z); p.receiveShadow = true; scene.add(p);
      box(0.03, PH, 0.035, lacq, x - PW / 2, PH / 2, Z + 0.01);
      const hk = new THREE.Mesh(new THREE.CircleGeometry(0.03, 20), new THREE.MeshStandardMaterial({ color: 0x8a6a30, metalness: 0.7, roughness: 0.4 }));
      hk.position.set(x + (i % 2 ? -1 : 1) * (PW / 2 - 0.09), PH * 0.48, Z + 0.006); scene.add(hk);
    }
    box(0.03, PH, 0.035, lacq, N * PW / 2, PH / 2, Z + 0.01);
    for (const y of [0.015, PH]) box(N * PW + 0.06, 0.04, 0.04, lacq, 0, y, Z + 0.01);
    // 欄間（格子）
    const rm = darkWood;
    box(N * PW + 0.4, 0.07, 0.08, rm, 0, PH + 0.5, Z);
    for (let i = 0; i <= 24; i++) box(0.018, 0.46, 0.03, rm, -N * PW / 2 + i * (N * PW / 24), PH + 0.25, Z);
    box(N * PW, 0.018, 0.03, rm, 0, PH + 0.25, Z);
    out.fusumaZ = Z; out.fusumaW = N * PW; out.fusumaH = PH;
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(2 * WALL_X, 4.6), texMat(SUGI, 5, 2.2, 0x5a4434, 0.7)); wall.position.set(0, 2.3, -3.2); scene.add(wall);
    box(2 * WALL_X, 0.34, 0.36, darkWood, 0, 3.3, 1.2);   // 舞台の上の梁
    for (const sx of [-1, 1]) {
      box(0.24, 3.3 - HALL_Y, 0.24, darkWood, sx * 3.15, (3.3 + HALL_Y) / 2, 1.35);   // 舞台の柱
      const cur = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 3.4), new THREE.MeshStandardMaterial({ color: 0x1a0d0b, roughness: 0.95 }));
      cur.position.set(sx * 4.3, 1.7, 1.1); scene.add(cur);
      const w2 = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.0), fm); w2.position.set(sx * 2.85, 1.0, Z - 0.3); scene.add(w2);
    }
  }
  // ---- めくり（上手＝客席から見て右。紙の札をめくって演目名を出す）
  {
    const W_ = 384, H_ = 704;
    const cv = document.createElement('canvas'); cv.width = W_; cv.height = H_;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = maxAniso;
    const draw = (main, small) => {
      const g = cv.getContext('2d');
      g.fillStyle = '#f2ede0'; g.fillRect(0, 0, W_, H_);
      g.globalAlpha = 0.06; for (let i = 0; i < 2600; i++) { g.fillStyle = rnd(i + 31) > 0.5 ? '#6a5a40' : '#fff'; g.fillRect(rnd(i + 33) * W_, rnd(i + 35) * H_, 2, 1); } g.globalAlpha = 1;
      g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const chars = [...main]; const n = chars.length;
      const fs = Math.min(230, (H_ - (small ? 150 : 60)) / n * 0.98);
      g.font = `400 ${fs}px PottaOne, serif`;
      const y0 = (small ? (H_ - 120) : H_) / 2 - (n - 1) * fs * 0.96 / 2;
      chars.forEach((ch, i) => g.fillText(ch, W_ / 2, y0 + i * fs * 0.96));
      if (small) { g.font = `400 64px PottaOne, serif`; g.fillStyle = '#7a1e1e'; g.fillText(small, W_ / 2, H_ - 70); }
      tex.needsUpdate = true;
    };
    const grp = new THREE.Group();
    const pm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
    const back = new THREE.MeshStandardMaterial({ color: 0xe8e2d2, roughness: 0.95 });
    const PWm = 0.36, PHm = 0.66;
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(PWm, PHm), pm); paper.position.set(0, 0.6, 0.012); grp.add(paper);
    // めくる一枚（上の端を軸に回る）
    const flipG = new THREE.Group(); flipG.position.set(0, 0.6 + PHm / 2, 0.016); grp.add(flipG);
    const fp = new THREE.Mesh(new THREE.PlaneGeometry(PWm, PHm), [pm][0]); fp.position.y = -PHm / 2;
    const fpb = new THREE.Mesh(new THREE.PlaneGeometry(PWm, PHm), back); fpb.position.y = -PHm / 2; fpb.rotation.y = Math.PI; fpb.position.z = -0.001;
    const oldTex = new THREE.CanvasTexture(document.createElement('canvas')); const oldMat = new THREE.MeshStandardMaterial({ roughness: 0.9 }); fp.material = oldMat;
    flipG.add(fp, fpb); flipG.visible = false;
    for (const sx of [-1, 1]) box(0.03, 1.0, 0.03, darkWood, sx * 0.2, 0.5, 0, grp);
    box(0.46, 0.035, 0.04, darkWood, 0, 0.96, 0, grp);
    grp.position.set(1.72, 0, 0.98); grp.rotation.y = -0.38; scene.add(grp);
    let cur = null;
    out.mekuri = {
      set(main, small) { cur = [main, small]; draw(main, small); flipG.visible = false; },
      // 前の札を写しにして、上へめくり上げる（u: 0→1）
      flipTo(main, small) {
        const snap = document.createElement('canvas'); snap.width = W_; snap.height = H_; snap.getContext('2d').drawImage(cv, 0, 0);
        oldMat.map && oldMat.map.dispose(); oldMat.map = new THREE.CanvasTexture(snap); oldMat.map.colorSpace = THREE.SRGBColorSpace; oldMat.needsUpdate = true;
        draw(main, small); flipG.visible = true; flipG.rotation.x = 0;
      },
      flip(u) { if (!flipG.visible) return; const e = u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u); flipG.rotation.x = -e * Math.PI * 0.92; if (u >= 1) flipG.visible = false; },
      group: grp,
    };
  }
  // ---- 舞台の灯（上手前の主光・下手前の補い・後ろ上の縁・襖を洗う灯）
  {
    const key = new THREE.SpotLight(0xffd9ad, 1.05, 0, THREE.MathUtils.degToRad(19), 0.7, 0);
    key.position.set(1.2, 4.3, 3.8); key.target.position.set(0, 1.0, 0); scene.add(key, key.target);
    key.castShadow = true; key.shadow.mapSize.set(LITE ? 1024 : 2048, LITE ? 1024 : 2048); key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
    const fill = new THREE.SpotLight(0xfff0dc, 0.32, 0, THREE.MathUtils.degToRad(24), 0.8, 0); fill.position.set(-2.4, 2.6, 3.2); fill.target.position.set(0, 1.0, 0); scene.add(fill, fill.target);
    const back = new THREE.SpotLight(0xffe2bd, 0.75, 0, THREE.MathUtils.degToRad(20), 0.6, 0); back.position.set(0.3, 3.6, -1.0); back.target.position.set(0, 1.2, 0.1); scene.add(back, back.target);
    const wash = new THREE.SpotLight(0xffd6a0, 0.24, 0, THREE.MathUtils.degToRad(36), 0.9, 0); wash.position.set(0, 3.0, 1.6); wash.target.position.set(0, 0.9, -1.15); scene.add(wash, wash.target);
    const mk = new THREE.SpotLight(0xffe6c0, 0.5, 0, THREE.MathUtils.degToRad(12), 0.6, 0); mk.position.set(2.4, 3.2, 3.0); mk.target.position.set(1.72, 0.6, 0.98); scene.add(mk, mk.target);
    out.stageLights = [key, fill, back, wash, mk]; for (const l of out.stageLights) l.userData.k0 = l.intensity;
    out.keyLight = key;
  }

  // ==== 客席 =================================================================================
  {
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(2 * WALL_X, BACK_Z - STAGE_Z1), texMat(HINOKI, 4, 3, 0x3a2a1e, 0.7));
    fl.rotation.x = -Math.PI / 2; fl.position.set(0, HALL_Y, (BACK_Z + STAGE_Z1) / 2); fl.receiveShadow = true; scene.add(fl);
    // 左右の壁（杉の板）・腰板・天井（格天井）
    for (const sx of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(BACK_Z - 1.0, CEIL_Y - HALL_Y), texMat(SUGI, 4, 2, 0x5c4636, 0.75));
      w.rotation.y = -sx * Math.PI / 2; w.position.set(sx * WALL_X, (CEIL_Y + HALL_Y) / 2, (BACK_Z + 1.0) / 2); scene.add(w);
      box(0.06, 0.12, BACK_Z - 1.0, darkWood, sx * (WALL_X - 0.03), 1.55, (BACK_Z + 1.0) / 2);   // 長押
      for (let z = 1.6; z < BACK_Z; z += 1.4) box(0.14, CEIL_Y - HALL_Y, 0.14, darkWood, sx * (WALL_X - 0.07), (CEIL_Y + HALL_Y) / 2, z);   // 柱
    }
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(2 * WALL_X, BACK_Z - 1.0), new THREE.MeshStandardMaterial({ color: 0x2a1d14, roughness: 0.8 }));
    ceil.rotation.x = Math.PI / 2; ceil.position.set(0, CEIL_Y, (BACK_Z + 1.0) / 2); scene.add(ceil); out.ceiling = ceil;
    for (let x = -WALL_X + 0.9; x < WALL_X; x += 0.9) box(0.06, 0.07, BACK_Z - 1.0, darkWood, x, CEIL_Y - 0.035, (BACK_Z + 1.0) / 2);
    for (let z = 1.5; z <= BACK_Z; z += 0.9) box(2 * WALL_X, 0.07, 0.06, darkWood, 0, CEIL_Y - 0.035, z);
    // 後ろの壁（真ん中が木戸からの入口）
    const bw = texMat(SUGI, 2, 2, 0x4e3a2c, 0.75);
    for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(WALL_X - 0.75, CEIL_Y - HALL_Y), bw); p.rotation.y = Math.PI; p.position.set(sx * (WALL_X + 0.75) / 2, (CEIL_Y + HALL_Y) / 2, BACK_Z); scene.add(p); }
    { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.5, CEIL_Y - 1.4), bw); p.rotation.y = Math.PI; p.position.set(0, (CEIL_Y + 1.4) / 2, BACK_Z); scene.add(p); }
  }
  // ---- 提灯（左右の壁に一列。紋だけ・字は書かない）
  const paperLantern = (seed, accent) => canvasTex(256, 256, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.7); gr.addColorStop(0, '#fff6dc'); gr.addColorStop(1, '#e9c88e'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,80,40,.25)'; for (let y = 8; y < h; y += 14) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = accent; g.fillRect(0, 0, w, 22); g.fillRect(0, h - 22, w, 22);
    // 紋（丸に横一文字・三つ巴ふうの点・丸に菱のいずれか。どこかの家紋の写しではない単純な形）
    g.save(); g.translate(w / 2, h / 2); g.strokeStyle = accent; g.fillStyle = accent; g.lineWidth = 9;
    g.beginPath(); g.arc(0, 0, 50, 0, Math.PI * 2); g.stroke();
    const k = Math.floor(seed * 3);
    if (k === 0) g.fillRect(-36, -8, 72, 16);
    else if (k === 1) { for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(Math.cos(i * 2.094 - 1.57) * 20, Math.sin(i * 2.094 - 1.57) * 20, 11, 0, Math.PI * 2); g.fill(); } }
    else { g.beginPath(); g.moveTo(0, -30); g.lineTo(26, 0); g.lineTo(0, 30); g.lineTo(-26, 0); g.closePath(); g.fill(); }
    g.restore();
  });
  const lanternGeo = (() => { const pts = []; for (let i = 0; i <= 16; i++) { const a = i / 16; pts.push(new THREE.Vector2(Math.sin(a * Math.PI) * 0.17 + 0.03, (a - 0.5) * 0.46)); } return new THREE.LatheGeometry(pts, 24); })();
  function chochin(x, y, z, k, accent, seed, scale = 1) {
    const t = paperLantern(seed, accent);
    const m = new THREE.MeshStandardMaterial({ color: 0x2a1a0c, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: k, roughness: 0.9, map: t });
    m.userData.k = k; out.lanternMats.push(m);
    const g = new THREE.Group(); const b = new THREE.Mesh(lanternGeo, m); g.add(b);
    for (const yy of [0.25, -0.25]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.035, 20), lacq); r.position.y = yy; g.add(r); }
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.3, 6), lacq); cord.position.y = 0.41; g.add(cord);
    g.position.set(x, y, z); g.scale.setScalar(scale); scene.add(g); return g;
  }
  {
    let i = 0;
    for (const sx of [-1, 1]) for (let z = 2.2; z < BACK_Z - 0.4; z += 1.05) chochin(sx * (WALL_X - 0.38), 2.65, z, 0.9, i % 2 ? '#7a1e1e' : '#1e1e1e', rnd(i++ + 70), 0.9);
    for (const sx of [-1, 1]) chochin(sx * 2.7, 2.5, 1.55, 1.1, '#7a1e1e', rnd(sx + 90), 1.15);   // 舞台の左右の大きい提灯
    for (const [x, z] of [[-3.6, 4.5], [3.6, 4.5]]) { const p = new THREE.PointLight(0xffc98a, 1.2, 7, 2); p.position.set(x, 2.4, z); scene.add(p); out.flickerLights.push([p, 0.06]); }
    const hemi = new THREE.HemisphereLight(0xb8a088, 0x1a120a, 0.26); scene.add(hemi); out.hemi = hemi; hemi.userData.k0 = hemi.intensity;
  }
  // ---- 椅子の列（真ん中に通路）と、左右の桟敷（畳に座布団）。客は黒い影（舞台を向いて座る）
  const tatami = canvasTex(256, 512, (g, w, h) => {
    g.fillStyle = '#8f8a5a'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) { g.fillStyle = `rgba(${y % 6 ? '60,58,30' : '170,165,110'},.35)`; g.fillRect(0, y, w, 1); }
    g.fillStyle = '#1e2430'; g.fillRect(0, 0, 14, h); g.fillRect(w - 14, 0, 14, h);
  });
  {
    const seatM = new THREE.MeshStandardMaterial({ color: 0x3a1512, roughness: 0.85 });
    const shadowM = new THREE.MeshStandardMaterial({ color: 0x1c1714, roughness: 0.7, envMapIntensity: 0.35, transparent: true, opacity: 1 });
    out.audMat = shadowM;
    const prof = [[0, 0], [0.21, 0], [0.23, 0.16], [0.22, 0.38], [0.19, 0.5], [0.11, 0.57], [0.05, 0.6], [0.045, 0.64], [0, 0.64]].map(([x, y]) => new THREE.Vector2(x, y));
    const torso = new THREE.LatheGeometry(prof, 20); torso.scale(1, 1, 0.62);
    const head = new THREE.SphereGeometry(0.1, 18, 12);
    const person = (x, y, z, n, sit) => {
      const p = new THREE.Group(); const s = 0.92 + 0.14 * rnd(n + 200);
      p.add(new THREE.Mesh(torso, shadowM)); const h = new THREE.Mesh(head, shadowM); h.position.set(0, 0.73, 0); h.scale.set(1, 1.12, 1.05); p.add(h);
      p.position.set(x + (rnd(n + 220) - 0.5) * 0.06, y, z + 0.02); p.scale.setScalar(s); p.rotation.y = Math.PI + x * 0.03 * (sit ? 0 : 1) + (sit ? -Math.sign(x) * 0.5 : 0);
      p.userData.ph = rnd(n + 280) * 6.28; p.userData.h = h; p.userData.h0 = 0.73; scene.add(p); out.audience.push(p); return p;
    };
    const chairGeoBack = new THREE.BoxGeometry(0.5, 0.5, 0.07), chairGeoCush = new THREE.BoxGeometry(0.48, 0.1, 0.45);
    const rows = [2.7, 3.5, 4.3, 5.1, 5.9, 6.7], cols = [0.75, 1.35, 1.95, 2.55, 3.15];
    const keep = new Set(['0.75,2.7', '-0.75,4.3', '-0.75,3.5', '-1.35,3.5', '-0.75,2.7']);   // 選べる席（前・まん中）は空けておく
    let n = 0;
    for (const z of rows) for (const sx of [-1, 1]) for (const cx of cols) {
      const x = sx * cx;
      const back = new THREE.Mesh(chairGeoBack, seatM); back.position.set(x, HALL_Y + 0.68, z + 0.28); scene.add(back);
      const cu = new THREE.Mesh(chairGeoCush, seatM); cu.position.set(x, HALL_Y + 0.42, z + 0.05); scene.add(cu);
      if (!keep.has(`${x},${z}`) && rnd(n + 400) < 0.62) person(x, HALL_Y + 0.46, z, n, false);
      n++;
    }
    // 桟敷
    for (const sx of [-1, 1]) {
      const deck = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 5.6), texMat(HINOKI, 0.8, 3, 0x4a3524, 0.6)); deck.position.set(sx * 4.75, HALL_Y + 0.175, 5.0); scene.add(deck);
      const tm = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 5.56), new THREE.MeshStandardMaterial({ map: tatami, roughness: 0.9 })); tm.rotation.x = -Math.PI / 2; tm.position.set(sx * 4.75, HALL_Y + 0.352, 5.0); scene.add(tm);
      box(1.4, 0.06, 0.06, darkWood, sx * 4.75, HALL_Y + 0.38, 2.2);
      for (let z = 2.6; z < 7.8; z += 0.75) {
        const zb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.52), new THREE.MeshStandardMaterial({ color: 0x4a2030, roughness: 0.9 })); zb.position.set(sx * 4.55, HALL_Y + 0.38, z); scene.add(zb);
        if (!(sx < 0 && Math.abs(z - 3.35) < 0.1) && rnd(n + 500) < 0.55) person(sx * 4.55, HALL_Y + 0.37 - 0.12, z, n, true);
        n++;
      }
    }
    const eye = (x, y, z) => new THREE.Vector3(x, y, z);
    out.seats = {
      mae: { pos: eye(0.75, HALL_Y + 1.16, 2.78), name: '前の席' },
      naka: { pos: eye(-0.75, HALL_Y + 1.16, 4.38), name: 'まん中の席' },
      sajiki: { pos: eye(-4.55, HALL_Y + 0.38 + 0.78, 3.35), name: '桟敷' },
    };
    out.aisle = eye(0, HALL_Y + 1.58, 6.2);
  }

  // ==== 木戸（外） ===========================================================================
  {
    const FZ = BACK_Z + 0.04;
    const ext = texMat(SUGI, 3, 2, 0x3e2e22, 0.8);
    for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(WALL_X - 0.75 + 1.5, 5.2), ext); p.position.set(sx * (WALL_X + 0.75 + 1.5) / 2, HALL_Y + 2.6, FZ); scene.add(p); }
    { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 5.2 - 2.15), ext); p.position.set(0, HALL_Y + 2.15 + (5.2 - 2.15) / 2, FZ); scene.add(p); }
    // 入口の枠
    box(0.14, 2.2, 0.16, darkWood, -0.78, HALL_Y + 1.1, FZ + 0.04); box(0.14, 2.2, 0.16, darkWood, 0.78, HALL_Y + 1.1, FZ + 0.04); box(1.7, 0.16, 0.16, darkWood, 0, HALL_Y + 2.2, FZ + 0.04);
    // 庇（ひさし）
    const roofM = new THREE.MeshStandardMaterial({ color: 0x1c1d22, roughness: 0.6, metalness: 0.2 });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2 * WALL_X + 3, 0.06, 1.3), roofM); roof.position.set(0, HALL_Y + 2.55, FZ + 0.6); roof.rotation.x = 0.28; scene.add(roof);
    for (let x = -WALL_X - 1.4; x <= WALL_X + 1.4; x += 0.22) box(0.03, 0.03, 1.32, roofM, x, HALL_Y + 2.59, FZ + 0.6).rotation.x = 0.28;
    // のれん（藍・三枚。字は白で Qualia/rakugo）
    const noren = canvasTex(512, 384, (g, w, h) => {
      g.fillStyle = '#1b2a44'; g.fillRect(0, 0, w, h);
      g.globalAlpha = 0.12; for (let i = 0; i < 4000; i++) { g.fillStyle = rnd(i + 51) > 0.5 ? '#000' : '#4a6a9a'; g.fillRect(rnd(i + 53) * w, rnd(i + 55) * h, 2, 2); } g.globalAlpha = 1;
      g.fillStyle = '#efe9da'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'italic 500 58px "Cormorant Garamond", serif'; g.fillText('Qualia/rakugo', w / 2, h * 0.42);
      g.font = '400 30px PottaOne, serif'; g.fillText('寄 席', w / 2, h * 0.68);
    });
    out.norenTex = noren;
    const nm = new THREE.MeshStandardMaterial({ map: noren, roughness: 0.95, side: THREE.DoubleSide });
    out.noren = [];
    for (let i = 0; i < 3; i++) {
      const g = new THREE.PlaneGeometry(0.5, 1.0, 1, 8); const uv = g.attributes.uv; for (let j = 0; j < uv.count; j++) uv.setX(j, (uv.getX(j) + i) / 3);
      const p = new THREE.Mesh(g, nm); p.position.set((i - 1) * 0.505, HALL_Y + 2.12 - 0.5, FZ + 0.12); scene.add(p); out.noren.push(p);
    }
    // まねき（演目名の木の札を、入口の上に横一列）
    const boardTex = (title, yomi) => canvasTex(160, 640, (g, w, h) => {
      g.fillStyle = '#d8c4a0'; g.fillRect(0, 0, w, h);
      g.globalAlpha = 0.25; for (let y = 0; y < h; y += 2) { g.fillStyle = rnd(y + 3) > 0.5 ? '#8a6a40' : '#efe2c8'; g.fillRect(0, y, w, 1 + rnd(y) * 2); } g.globalAlpha = 1;
      g.fillStyle = '#121010'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const cs = [...title], fs = Math.min(118, (h - 60) / cs.length * 0.95); g.font = `400 ${fs}px PottaOne, serif`;
      const y0 = h / 2 - (cs.length - 1) * fs * 0.95 / 2; cs.forEach((c, i) => g.fillText(c, w / 2, y0 + i * fs * 0.95));
      g.strokeStyle = '#3a2416'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
    });
    const bw = 0.42, gap = 0.12, total = ENM.length * bw + (ENM.length - 1) * gap;
    ENM.forEach((e, i) => {
      const m = new THREE.MeshStandardMaterial({ map: boardTex(e.t), roughness: 0.75, emissive: 0xffffff, emissiveIntensity: 0.0 });
      m.emissiveMap = m.map;
      const b = new THREE.Mesh(new THREE.BoxGeometry(bw, 1.6, 0.05), [darkWood, darkWood, darkWood, darkWood, m, darkWood]);
      b.position.set(-total / 2 + bw / 2 + i * (bw + gap), HALL_Y + 3.65, FZ + 0.2); b.rotation.x = -0.08; b.userData.slug = e.slug; scene.add(b); out.boards.push(b);
    });
    box(total + 0.5, 0.08, 0.1, darkWood, 0, HALL_Y + 4.5, FZ + 0.2); box(total + 0.5, 0.08, 0.1, darkWood, 0, HALL_Y + 2.8, FZ + 0.2);
    // 提灯（庇の下に一列）と、まねきを照らす灯
    for (let i = 0; i < 8; i++) { const x = (i - 3.5) * 1.15; if (Math.abs(x) < 0.9) continue; chochin(x, HALL_Y + 2.1, FZ + 0.85, 1.25, i % 2 ? '#7a1e1e' : '#1e1e1e', rnd(i + 300), 0.95); }
    const lp = new THREE.PointLight(0xffc98a, 2.2, 9, 2); lp.position.set(0, HALL_Y + 1.9, FZ + 1.6); scene.add(lp); out.flickerLights.push([lp, 0.05]);
    const sp = new THREE.SpotLight(0xffe0b0, 3.0, 0, THREE.MathUtils.degToRad(30), 0.7, 0); sp.position.set(0, HALL_Y + 1.2, FZ + 4.2); sp.target.position.set(0, HALL_Y + 3.6, FZ); scene.add(sp, sp.target);
    out.kidoLights = [lp, sp];
    // 通り（石畳ふうの暗い地面）と夜空
    const road = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#1d1c1e'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 128) { const o = (y / 64) % 2 ? 64 : 0; g.fillStyle = `rgb(${38 + rnd(x + y) * 18},${36 + rnd(x + y) * 16},${38 + rnd(x + y) * 16})`; g.fillRect(x + o + 3, y + 3, 122, 58); }
    });
    road.wrapS = road.wrapT = THREE.RepeatWrapping; road.repeat.set(6, 4);
    const rd = new THREE.Mesh(new THREE.PlaneGeometry(24, 14), new THREE.MeshStandardMaterial({ map: road, roughness: 0.55, metalness: 0.05 }));
    rd.rotation.x = -Math.PI / 2; rd.position.set(0, HALL_Y - 0.001, FZ + 7); rd.receiveShadow = true; scene.add(rd);
    // 向かいの町並み（暗い板塀と屋根の線だけ）
    for (let i = 0; i < 6; i++) { const x = (i - 2.5) * 4; box(3.8, 3 + rnd(i + 600) * 1.2, 0.3, new THREE.MeshStandardMaterial({ color: 0x0d0c0e, roughness: 0.9 }), x, HALL_Y + 1.6, FZ + 13); }
    const sky = canvasTex(16, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#05070f'); gr.addColorStop(0.7, '#0b1022'); gr.addColorStop(1, '#141a2c'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const sk = new THREE.Mesh(new THREE.SphereGeometry(40, 24, 12), new THREE.MeshBasicMaterial({ map: sky, side: THREE.BackSide, fog: false, depthWrite: false }));
    sk.position.set(0, 0, FZ + 6); scene.add(sk); out.sky = sk;
    out.kidoCam = { pos: new THREE.Vector3(0, HALL_Y + 1.6, FZ + 10.5), look: new THREE.Vector3(0, HALL_Y + 2.05, FZ) };
    out.FZ = FZ;
  }

  // ==== 灯の中の塵（ごくわずか） ==============================================================
  {
    const PN2 = 18, g = new THREE.BufferGeometry(), pos = new Float32Array(PN2 * 3), seed = new Float32Array(PN2 * 4);
    for (let i = 0; i < PN2; i++) { pos[i * 3] = (rnd(i + 31) - 0.5) * 2.4; pos[i * 3 + 1] = 0.9 + rnd(i + 5031) * 2.2; pos[i * 3 + 2] = -0.6 + rnd(i + 9031) * 2.4;
      seed[i * 4] = rnd(i + 13031) * 6.28; seed[i * 4 + 1] = 0.3 + rnd(i + 17031); seed[i * 4 + 3] = rnd(i + 21031); }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.BufferAttribute(seed, 4));
    const mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uScale: { value: 400 } },
      vertexShader: `attribute vec4 seed; uniform float uT; uniform float uScale; varying float vA;
        void main(){ vec3 p = position; float ph = seed.x, sp = seed.y;
          p.x += sin(uT * 0.06 * sp + ph) * 0.25; p.y += sin(uT * 0.05 * sp + ph * 1.3) * 0.18; p.z += cos(uT * 0.05 * sp + ph) * 0.2;
          vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = (0.006 + 0.004 * seed.w) * uScale / -mv.z;
          vA = 0.10 + 0.06 * sin(uT * 0.7 + ph); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying float vA; void main(){ float r = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(1.1, 1.0, 0.85) * smoothstep(0.5, 0.0, r) * vA, 1.0); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    out.particles = new THREE.Points(g, mat); out.particles.frustumCulled = false; scene.add(out.particles);
  }
  // 客席の明かり（0＝暗転して高座だけ、1＝開演前の明るさ）・舞台の灯（0〜1）
  out.house = k => { out.hemi.intensity = out.hemi.userData.k0 * (0.55 + 0.9 * k); for (const [p] of out.flickerLights) { if (p.userData.base === undefined) p.userData.base = p.intensity; } };
  out.stage = k => { for (const l of out.stageLights) l.intensity = l.userData.k0 * k; };
  return out;
}

// ==== 噺に重ねる Qualia の層（演目ごと。噺のじゃまをしない・模式であることを札に書く） ========
// level：0〜1（まくらは 0、本題で薄く、その層に触れる台詞で少し上がる）
export function buildQualia(ctx, H, slug) {
  const { THREE, scene, rnd } = ctx;
  const Z = H.fusumaZ + 0.02, FW = H.fusumaW, FH = H.fusumaH;
  const grp = new THREE.Group(); scene.add(grp);
  const add = (THREE_obj) => { grp.add(THREE_obj); return THREE_obj; };
  const uni = { uT: { value: 0 }, uL: { value: 0 } };
  const addBlend = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
  let update = () => {};
  const fusumaPlane = frag => { const m = new THREE.ShaderMaterial({ uniforms: uni, ...addBlend,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`, fragmentShader: frag });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(FW, FH), m); p.position.set(0, FH / 2, Z); return add(p); };
  if (slug === 'hachi') {
    // 蜂の目：花びらの「紫外の模様」を、人に見える紫に置きかえて襖に浮かべる（花の中心へ向かう濃い帯＝蜜標の模式）。六角の粒は複眼の模式
    fusumaPlane(`uniform float uT, uL; varying vec2 vUv;
      vec2 hexc(vec2 p){ vec2 r = vec2(1.0, 1.732); vec2 h = r * 0.5; vec2 a = mod(p, r) - h; vec2 b = mod(p - h, r) - h; return dot(a,a) < dot(b,b) ? a : b; }
      void main(){ vec2 p = (vUv - vec2(0.5, 0.56)) * vec2(1.95, 1.0) * 2.2; float r = length(p), a = atan(p.y, p.x);
        float petal = smoothstep(0.02, -0.02, r - (0.62 + 0.22 * cos(a * 5.0)));
        float guide = smoothstep(0.55, 0.12, r) * (0.55 + 0.45 * smoothstep(0.2, 0.9, cos(a * 5.0))) ;
        float rays = pow(abs(cos(a * 5.0 * 2.0)), 18.0) * smoothstep(0.62, 0.15, r);
        vec2 hc = hexc(vUv * vec2(60.0, 30.0)); float edge = smoothstep(0.40, 0.48, length(hc) * 1.0);
        vec3 c = vec3(0.55, 0.38, 0.95) * (guide * 0.9 + rays * 0.6) * petal + vec3(0.85, 0.80, 0.55) * petal * 0.12;
        c *= 1.0 - 0.35 * edge;
        c *= 1.0 - 0.75 * smoothstep(0.30, 0.05, abs(vUv.x - 0.5)) * smoothstep(0.25, 0.55, vUv.y);   // 碧の後ろは薄く（輪郭と重ねない）
        float br = 0.85 + 0.15 * sin(uT * 0.6);
        gl_FragColor = vec4(c * uL * 0.55 * br, 1.0); }`);
  } else if (slug === 'kumo') {
    // 蜘蛛の網：襖に丸い網（縦糸と横糸）。揺れが中心へ伝わる様子を、糸の明るさの波で見せる
    const pts = [], ph = [];
    const cx = 0, cy = FH * 0.58, R = Math.min(FW, FH) * 0.46, NR = 22;
    for (let i = 0; i < NR; i++) { const a = i / NR * Math.PI * 2; pts.push(cx, cy, Z, cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.92, Z); ph.push(0, 1); }
    let pv = null;
    for (let k = 0; k <= 360 * 9; k += 6) { const a = k / 180 * Math.PI, r = R * (0.12 + 0.88 * k / (360 * 9)); const p = [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.92, Z, r / R];
      if (pv) { pts.push(pv[0], pv[1], pv[2], p[0], p[1], p[2]); ph.push(pv[3], p[3]); } pv = p; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); g.setAttribute('rr', new THREE.Float32BufferAttribute(ph, 1));
    const m = new THREE.ShaderMaterial({ uniforms: uni, ...addBlend,
      vertexShader: `attribute float rr; varying float vR; void main(){ vR = rr; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform float uT, uL; varying float vR; void main(){ float w = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(18.0 * vR + uT * 3.2), 6.0); gl_FragColor = vec4(vec3(0.85, 0.88, 0.95) * w * uL * 0.75, 1.0); }` });
    add(new THREE.LineSegments(g, m));
  } else if (slug === 'keyaki') {
    // 欅：空気の粒（二酸化炭素の模式）が、襖に描いた枝へ吸い寄せられ、幹が少しずつ満ちる
    const c = document.createElement('canvas'); c.width = 512; c.height = 1024; const g = c.getContext('2d');
    g.strokeStyle = '#fff'; g.lineCap = 'round';
    const br = (x, y, a, l, w, d) => { if (d > 8 || l < 6) return; const x2 = x + Math.cos(a) * l, y2 = y - Math.sin(a) * l; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
      br(x2, y2, a + 0.32 + rnd(d * 7 + x) * 0.25, l * 0.76, w * 0.68, d + 1); br(x2, y2, a - 0.30 - rnd(d * 5 + y) * 0.25, l * 0.74, w * 0.68, d + 1); };
    br(256, 1010, Math.PI / 2, 300, 34, 0);
    const t = new THREE.CanvasTexture(c);
    const m = new THREE.ShaderMaterial({ uniforms: { ...uni, uMap: { value: t } }, ...addBlend,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform float uT, uL; uniform sampler2D uMap; varying vec2 vUv; void main(){ float a = texture2D(uMap, vUv).r; float fill = smoothstep(0.0, 1.0, (1.0 - vUv.y) * 1.4 - 0.15 + 0.25 * sin(uT * 0.2)); gl_FragColor = vec4(vec3(0.55, 0.85, 0.62) * a * (0.35 + 0.65 * fill) * uL * 0.6, 1.0); }` });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(FH * 0.5, FH), m); p.position.set(0, FH / 2, Z); add(p);
    const N = 160, pos = new Float32Array(N * 3), sd = new Float32Array(N);
    for (let i = 0; i < N; i++) { pos[i * 3] = (rnd(i + 701) - 0.5) * 5; pos[i * 3 + 1] = 0.4 + rnd(i + 703) * 2.6; pos[i * 3 + 2] = Z + 0.2 + rnd(i + 705) * 2.0; sd[i] = rnd(i + 707); }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('sd', new THREE.BufferAttribute(sd, 1));
    const pm = new THREE.ShaderMaterial({ uniforms: { ...uni, uZ: { value: Z }, uH: { value: FH } }, ...addBlend,
      vertexShader: `attribute float sd; uniform float uT, uL, uZ, uH; varying float vA; void main(){ float k = fract(uT * 0.04 + sd); vec3 tgt = vec3((sd - 0.5) * 0.9, uH * (0.45 + 0.5 * sd), uZ); vec3 p = mix(position, tgt, k * k);
        vA = uL * sin(k * 3.1416) * 0.6; vec4 mv = modelViewMatrix * vec4(p,1.0); gl_PointSize = 5.0 * 3.0 / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying float vA; void main(){ float r = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(0.75, 0.95, 0.85) * smoothstep(0.5, 0.0, r) * vA, 1.0); }` });
    const pts = new THREE.Points(pg, pm); pts.frustumCulled = false; add(pts);
  } else if (slug === 'mimizu' || slug === 'inu') {
    // みみず：床を伝わる震えの輪（高座から客席へ）／犬：床に残る匂いの足跡（新しいほど濃い・二手に分かれる）
    const mimi = slug === 'mimizu';
    const m = new THREE.ShaderMaterial({ uniforms: uni, ...addBlend,
      vertexShader: `varying vec3 vP; void main(){ vP = (modelMatrix * vec4(position,1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vP,1.0); }`,
      fragmentShader: mimi ? `uniform float uT, uL; varying vec3 vP; void main(){ float r = length(vP.xz - vec2(0.0, 0.0)); float w = 0.0;
          for (int i = 0; i < 3; i++) { float rr = mod(uT * 1.1 + float(i) * 2.6, 8.0); w += exp(-pow((r - rr) * 5.0, 2.0)) * (1.0 - rr / 8.0); }
          gl_FragColor = vec4(vec3(0.95, 0.75, 0.55) * w * uL * 0.45, 1.0); }`
        : `uniform float uT, uL; varying vec3 vP; float fp(vec2 p, vec2 c, float a){ vec2 d = p - c; float ca = cos(a), sa = sin(a); d = vec2(ca*d.x - sa*d.y, sa*d.x + ca*d.y); return smoothstep(1.0, 0.6, length(d / vec2(0.06, 0.10))); }
          void main(){ float w = 0.0; vec2 p = vP.xz;
            for (int i = 0; i < 14; i++) { float z = 8.0 - float(i) * 0.42; float side = mod(float(i), 2.0) < 1.0 ? -0.12 : 0.12;
              float br = float(i) > 7.0 ? (float(i) - 7.0) * 0.32 : 0.0; float age = float(i) / 14.0;
              w += fp(p, vec2(side + br, z), 0.0) * (0.25 + 0.75 * age); w += fp(p, vec2(side - br, z - 0.2), 0.0) * (0.15 + 0.4 * age) * step(7.5, float(i)); }
            gl_FragColor = vec4(vec3(1.0, 0.72, 0.38) * w * uL * (0.6 + 0.15 * sin(uT * 1.3)), 1.0); }` });
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(10.8, mimi ? 12 : 7), m); fl.rotation.x = -Math.PI / 2;
    fl.position.set(0, (mimi ? 0.004 : H.HALL_Y + 0.004), mimi ? 3 : 5.2); add(fl);
    if (mimi) { const f2 = fl.clone(); f2.position.set(0, H.HALL_Y + 0.004, 5); add(f2); }
  } else if (slug === 'ga') {
    // 蛾：人の鼻には何もない空気に、匂いの筋（流れに乗って細く切れ切れに伸びる）を淡く見せる
    const N = 420, pos = new Float32Array(N * 3), sd = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) { sd[i * 2] = rnd(i + 801); sd[i * 2 + 1] = rnd(i + 803); }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('sd', new THREE.BufferAttribute(sd, 2));
    const pm = new THREE.ShaderMaterial({ uniforms: uni, ...addBlend,
      vertexShader: `attribute vec2 sd; uniform float uT, uL; varying float vA; void main(){ float k = fract(uT * 0.05 + sd.x); float x = mix(-5.2, 0.6, k);
        float wob = sin(k * 9.0 + uT * 0.3 + sd.y * 6.0) * 0.35 * k + sin(k * 23.0 - uT * 0.7) * 0.08;
        vec3 p = vec3(x, 1.4 + wob * 0.6 + (sd.y - 0.5) * 0.25 * k, 1.4 + wob + (sd.y - 0.5) * 0.5 * k);
        float puff = step(0.35, fract(k * 7.0 + sd.y));
        vA = uL * (1.0 - k) * 0.55 * puff; vec4 mv = modelViewMatrix * vec4(p,1.0); gl_PointSize = 7.0 * 3.0 / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying float vA; void main(){ float r = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(0.95, 0.85, 1.0) * smoothstep(0.5, 0.0, r) * vA, 1.0); }` });
    const pts = new THREE.Points(pg, pm); pts.frustumCulled = false; add(pts);
  } else if (slug === 'hoshi') {
    // 星：天井に星が出る。明るさがそろわず、ひとつずつ遅れて灯る（光の届くのにかかる年月のちがいの模式）
    const N = 260, pos = new Float32Array(N * 3), sd = new Float32Array(N);
    for (let i = 0; i < N; i++) { pos[i * 3] = (rnd(i + 901) - 0.5) * 10.6; pos[i * 3 + 1] = 3.62; pos[i * 3 + 2] = 1.6 + rnd(i + 903) * 6.7; sd[i] = rnd(i + 905); }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('sd', new THREE.BufferAttribute(sd, 1));
    const pm = new THREE.ShaderMaterial({ uniforms: uni, ...addBlend,
      vertexShader: `attribute float sd; uniform float uT, uL; varying float vA; void main(){ float on = smoothstep(sd * 0.9, sd * 0.9 + 0.08, uL);
        vA = on * (0.45 + 0.55 * sd) * (0.8 + 0.2 * sin(uT * (1.0 + sd * 3.0) + sd * 40.0)); vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = (2.0 + 4.0 * sd * sd) * 4.0 / -mv.z * 3.0; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying float vA; void main(){ float r = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(0.85, 0.9, 1.0) * smoothstep(0.5, 0.0, r) * vA, 1.0); }` });
    const pts = new THREE.Points(pg, pm); pts.frustumCulled = false; add(pts);
  } else if (slug === 'shashin') {
    // 写真機のゆっくりした目：動く客の影が薄くなり（長い露光では写らない）、止まっている建物だけが残る。襖には古い写真の銀の調子
    fusumaPlane(`uniform float uT, uL; varying vec2 vUv; void main(){ vec2 d = vUv - 0.5; float v = smoothstep(0.75, 0.2, length(d * vec2(1.2, 1.0))); gl_FragColor = vec4(vec3(0.62, 0.55, 0.42) * v * uL * 0.35, 1.0); }`);
    update = (t, L) => { if (H.audMat) { const o = 1 - 0.8 * L; if (Math.abs(H.audMat.opacity - o) > 0.003) { H.audMat.opacity = o; H.audMat.depthWrite = o > 0.9; } } };
  }
  return {
    group: grp,
    set(t, L) { uni.uT.value = t; uni.uL.value = L; grp.visible = L > 0.003; update(t, L); },
  };
}
