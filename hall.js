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
  const out = { particles: null, audience: [], lanternMats: [], flickerLights: [], boards: [], boardHits: [], seats: {}, houseMats: [], seatTags: [] };
  const texL = new THREE.TextureLoader();
  // 板の質感は待たずに建物を出し、届いたら貼る（起動を速く）。clone した写しにも届いた絵を配る
  const loadTex = (p, srgb) => { const kids = []; const t = texL.load(BASE + p, () => { for (const k of kids) { k.image = t.image; k.needsUpdate = true; } });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = maxAniso; if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    const c0 = t.clone.bind(t); t.clone = () => { const k = c0(); kids.push(k); return k; }; return t; };
  const pbr = name => ({
    map: loadTex(`sozai/${name}/${name}_diff_1k.jpg`, true),
    normalMap: loadTex(`sozai/${name}/${name}_nor_1k.jpg`, false),
    roughnessMap: loadTex(`sozai/${name}/${name}_rough_1k.jpg`, false),
  });
  const HINOKI = pbr('hinoki_planks'), SUGI = pbr('japanese_cedar_planks');
  // 2026-11-21 本人「木は歴史のひだを重ねた趣深いものに」：床と壁は年月を経た古材（Poly Haven CC0 の old_wood_floor・dark_wooden_planks）
  const OLD = pbr('old_wood_floor'), DARK = pbr('dark_wooden_planks');
  function texMat(T, rx, ry, color, rough = 0.6, gloss = 0) {
    // 古材の艶（手と足に磨かれた上澄み）は薄い clearcoat で。スマホは軽い材質のまま
    const m = gloss && !LITE ? new THREE.MeshPhysicalMaterial({ color, roughness: rough, envMapIntensity: 0.5, normalScale: new THREE.Vector2(1.0, 1.0), clearcoat: gloss, clearcoatRoughness: 0.42 })
      : new THREE.MeshStandardMaterial({ color, roughness: rough, envMapIntensity: 0.5, normalScale: new THREE.Vector2(0.9, 0.9) });
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
  // 2026-11-21 本人「演目の紙もかっこよく」：めくり・まねき・行灯の字＝Yuji Boku（OFL・太い筆の字。既存の寄席文字の意匠は写さず、
  // 太らせて詰めた縦組みと墨のにじみで寄席の札らしく）。紙は楮の繊維とむらを描いた和紙
  const YF = 'YujiBoku';
  try { const ff = new FontFace(YF, `url(${BASE}fonts/yuji-boku.woff2)`); document.fonts.add(await ff.load()); } catch (e) { /* 読めなければ PottaOne */ }
  const washi = (g, w, h, s0, base = '#f0e7d2') => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 36; i++) { const x = rnd(s0 + i) * w, y = rnd(s0 + i + 50) * h, r = (0.12 + rnd(s0 + i + 99) * 0.3) * w, a = 0.03 + 0.05 * rnd(s0 + i + 7);
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rnd(s0 + i + 3) > 0.5 ? `rgba(150,118,76,${a})` : `rgba(255,252,242,${a * 1.5})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    g.lineCap = 'round';
    const N = Math.round(w * h / 240);
    for (let i = 0; i < N; i++) { const x = rnd(s0 + i * 3 + 1) * w, y = rnd(s0 + i * 3 + 2) * h, L = 6 + rnd(s0 + i * 3 + 3) ** 2 * 46, a = rnd(s0 + i * 7) * 6.28, c = (rnd(s0 + i * 5) - 0.5) * 0.9;
      g.strokeStyle = rnd(s0 + i * 11) > 0.3 ? 'rgba(255,253,246,0.38)' : 'rgba(118,94,60,0.11)'; g.lineWidth = 0.5 + rnd(s0 + i * 13) * 0.9;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + c) * L * 0.5, y + Math.sin(a + c) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
    const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.72); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(112,80,40,0.24)'); g.fillStyle = v; g.fillRect(0, 0, w, h);
  };
  // 縦組みの太い筆の字（太らせ＝同じ色の縁取り・墨のにじみ＝わずかな影・少し横に張って詰める）
  const yoseText = (g, text, cx, y0, y1, maxFs, color = '#0e0b09', maxW = 1e9, wt = 0.06, sx = 1.14) => {
    const cs = [...text], n = cs.length, fs = Math.min(maxFs, (y1 - y0) / (n * 0.9 + 0.12), maxW / sx), step = fs * 0.9, yc = (y0 + y1) / 2 - (n - 1) * step / 2;
    g.save(); g.font = `400 ${fs}px ${YF}, PottaOne, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = color; g.strokeStyle = color; g.lineJoin = 'round'; g.lineWidth = fs * wt;
    cs.forEach((ch, i) => { g.save(); g.translate(cx, yc + i * step); g.scale(sx, 1);
      if (ch === '欅') g.font = `400 ${fs * 0.94}px PottaOne, serif`;   /* 筆の字形では「樗」に見えるため、この字だけ読みやすい書体に */
      g.shadowColor = 'rgba(24,16,10,0.6)'; g.shadowBlur = fs * 0.035; g.strokeText(ch, 0, 0); g.shadowBlur = 0; g.fillText(ch, 0, 0); g.restore(); });
    g.restore(); return fs;
  };
  const yoseLine = (g, text, cx, cy, fs, color) => { g.save(); g.font = `400 ${fs}px ${YF}, PottaOne, serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = color; g.strokeStyle = color; g.lineWidth = fs * 0.05; g.lineJoin = 'round'; g.strokeText(text, cx, cy); g.fillText(text, cx, cy); g.restore(); };

  // ---- 環境光（部屋の反射だけ。暗い寄席なので弱く）
  {
    const { RoomEnvironment } = ctx.RoomEnvironment;
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.12;
  }
  scene.background = new THREE.Color(0x05060a);
  // 2026-11-21：画の四隅を夜の暗さに沈める（灯の届く高座が浮かぶように。押す操作はさえぎらない）
  { const st = document.getElementById('stage'); if (st && !st.querySelector('.yose-vig')) { const v = document.createElement('div'); v.className = 'yose-vig';
      v.style.cssText = 'position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 75% 70% at 50% 52%,rgba(0,0,0,0) 42%,rgba(3,2,1,.72) 100%)'; st.appendChild(v); } }
  scene.fog = new THREE.Fog(0x060403, 7, 21);

  // ==== 舞台と高座 ===========================================================================
  {
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(2 * WALL_X, STAGE_Z1 + 3.2), texMat(OLD, 3.2, 1.6, 0x8a6a4c, 0.62, 0.35));
    fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0, (STAGE_Z1 - 3.2) / 2); fl.receiveShadow = true; scene.add(fl);
    box(2 * WALL_X, -HALL_Y, 0.08, texMat(DARK, 5, 0.4, 0x5a4636, 0.7), 0, HALL_Y / 2, STAGE_Z1 + 0.04);
    // 高座（檜の台）
    const top = texMat(OLD, 0.9, 0.7, 0x7a5a3e, 0.5, 0.4), side = texMat(DARK, 1.2, 0.3, 0x6a5240, 0.6, 0.3);
    const k = new THREE.Mesh(new THREE.BoxGeometry(2.0, KOZA_Y, 1.6), [side, side, top, side, side, side]);
    k.position.set(0, KOZA_Y / 2, -0.05); k.receiveShadow = true; k.castShadow = true; scene.add(k);
    box(2.04, 0.05, 0.06, new THREE.MeshStandardMaterial({ color: 0x24170e, roughness: 0.35 }), 0, KOZA_Y - 0.025, 0.76);
    // 2026-11-21：高座に緋毛氈（毛羽の粒と光沢の弱いフェルト。前の縁へ少し垂らす）
    const mosen = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#7c1a15'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 30000; i++) { g.fillStyle = rnd(i + 1200) > 0.5 ? `rgba(236,96,70,${0.05 + 0.09 * rnd(i + 1300)})` : `rgba(36,2,2,${0.07 + 0.12 * rnd(i + 1400)})`; g.fillRect(rnd(i + 1500) * w, rnd(i + 1600) * h, 1.4, 1.4); }
    });
    mosen.wrapS = mosen.wrapT = THREE.RepeatWrapping; mosen.repeat.set(2.5, 2);
    const mm = new THREE.MeshPhysicalMaterial({ map: mosen, roughness: 0.95, sheen: 0.45, sheenColor: new THREE.Color(0xd8604a), sheenRoughness: 0.7 });
    const mt = new THREE.Mesh(new THREE.PlaneGeometry(2.03, 1.62), mm); mt.rotation.x = -Math.PI / 2; mt.position.set(0, KOZA_Y + 0.003, -0.05); mt.receiveShadow = true; scene.add(mt);
    const md = new THREE.Mesh(new THREE.PlaneGeometry(2.03, 0.075), mm); md.position.set(0, KOZA_Y - 0.035, 0.792); md.receiveShadow = true; scene.add(md);
    const mr = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 2.03, 8, 1, false, 0, Math.PI / 2), mm); mr.rotation.z = Math.PI / 2; mr.position.set(0, KOZA_Y - 0.005, 0.784); scene.add(mr);
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
    // 2026-11-21 本人「もっと雰囲気のある場所で」：高座の後ろを古びた金屏風に（箔一枚ずつの色むら・箔足の線・くもり）
    const fusuma = canvasTex(512, 1024, (g, w, h) => {
      // 箔は少しずつずらして重ねて貼る（段ごとに横へずれ、継ぎ目は細く不揃い）。一枚ごとに淡い斜めの照りと色の差
      g.fillStyle = '#a98236'; g.fillRect(0, 0, w, h);
      const S = 58;
      for (let r = 0, y = 0; y < h; r++, y += S - 2) { const off = (rnd(r + 701) * S) | 0;
        for (let x = -off; x < w; x += S - 1.5) { const k = rnd(x * 7.1 + y * 13.3 + 5), k2 = rnd(x * 3.3 + y * 5.7 + 9), dx = (rnd(x + y * 3 + 17) - 0.5) * 2.2, dy = (rnd(x * 5 + y + 19) - 0.5) * 2.2;
          const gr = g.createLinearGradient(x, y, x + S, y + S); const c0 = [176 + k * 10 - k2 * 5, 136 + k * 8 - k2 * 6, 56 + k * 6], c1 = [164 + k * 8, 124 + k * 7 - k2 * 4, 50 + k * 5];
          gr.addColorStop(0, `rgb(${c0.map(v => v | 0)})`); gr.addColorStop(1, `rgb(${c1.map(v => v | 0)})`); g.fillStyle = gr; g.fillRect(x + dx, y + dy, S, S);
          g.strokeStyle = `rgba(92,62,20,${0.10 + 0.14 * k2})`; g.lineWidth = 0.6 + k * 0.8; g.strokeRect(x + dx + 0.5, y + dy + 0.5, S, S); } }
      // 細かい粒（箔の皺・擦れ）
      for (let i = 0; i < 22000; i++) { g.fillStyle = rnd(i + 21) > 0.55 ? `rgba(255,232,165,${0.07 * rnd(i + 23)})` : `rgba(60,38,10,${0.09 * rnd(i + 25)})`; const x = rnd(i + 27) * w, y = rnd(i + 29) * h; g.fillRect(x, y, 1 + rnd(i + 31) * 2.5, 1); }
      // くすみ（大小の雲のような曇り・下ほど煤ける）
      for (let i = 0; i < 60; i++) { const x = rnd(i + 41) * w, y = rnd(i + 43) * h, r = 30 + rnd(i + 45) * 220; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rnd(i + 49) > 0.3 ? `rgba(52,32,10,${0.06 + 0.12 * rnd(i + 47)})` : `rgba(255,226,150,${0.05 + 0.06 * rnd(i + 47)})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
      const b = g.createLinearGradient(0, h * 0.55, 0, h); b.addColorStop(0, 'rgba(36,22,8,0)'); b.addColorStop(1, 'rgba(36,22,8,0.42)'); g.fillStyle = b; g.fillRect(0, 0, w, h);
    });
    const fm = new THREE.MeshStandardMaterial({ map: fusuma, roughness: 0.5, metalness: 0.35, envMapIntensity: 1.2 });
    // 袖の障子（向こうの灯が透ける）
    const shoji = canvasTex(256, 512, (g, w, h) => {
      const gr = g.createRadialGradient(w * 0.5, h * 0.62, 10, w * 0.5, h * 0.62, h * 0.75); gr.addColorStop(0, '#ffdca4'); gr.addColorStop(0.6, '#c98f4c'); gr.addColorStop(1, '#5a3418'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.globalAlpha = 0.25; for (let i = 0; i < 600; i++) { g.strokeStyle = '#fff6e0'; g.lineWidth = 0.6; const x = rnd(i + 61) * w, y = rnd(i + 63) * h, a = rnd(i + 65) * 6.28, L = 4 + rnd(i + 67) * 20; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); } g.globalAlpha = 1;
      g.fillStyle = '#20140c'; for (let i = 1; i < 3; i++) g.fillRect(i * w / 3 - 3, 0, 6, h); for (let i = 1; i < 7; i++) g.fillRect(0, i * h / 7 - 3, w, 6);
      g.fillRect(0, 0, w, 12); g.fillRect(0, h - 16, w, 16); g.fillRect(0, 0, 12, h); g.fillRect(w - 12, 0, 12, h);
    });
    const shm = new THREE.MeshStandardMaterial({ map: shoji, emissive: 0xffffff, emissiveMap: shoji, emissiveIntensity: 0.5, roughness: 0.9 }); shm.userData.k = 0.5; out.lanternMats.push(shm);
    const PW = 0.76, PH = 1.95, Z = -1.15, N = 5;   /* 2026-11-23 四枚だと真ん中の継ぎ目が碧の頭を縦に割って見えた → 五枚（幅は同じ） */
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
    // 2026-11-23 本人「歴史的な寄席、特に新宿の木造の寄席の内装をイメージして」：欄間の上に扁額（古い木の額に墨の四字・どこかの額の写しではない）
    { const gaku = canvasTex(1024, 300, (g, w, h) => {
        g.fillStyle = '#3b2616'; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(${rnd(i + 301) > 0.5 ? '90,60,34' : '24,14,8'},${0.18 + 0.2 * rnd(i + 303)})`; g.lineWidth = 0.6 + rnd(i + 305) * 1.6; const y = rnd(i + 307) * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + (rnd(i + 309) - 0.5) * 14, w * 0.7, y + (rnd(i + 311) - 0.5) * 14, w, y + (rnd(i + 313) - 0.5) * 8); g.stroke(); }
        g.fillStyle = '#c4a774'; g.globalAlpha = 0.82; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = `700 170px "Yuji Boku","Hiragino Mincho ProN","Yu Mincho",serif`; const t = '笑門来福'; for (let i = 0; i < 4; i++) g.fillText(t[i], w * (0.86 - i * 0.24), h * 0.53);
        g.globalAlpha = 1; for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(20,12,6,${0.25 * rnd(i + 331)})`; g.fillRect(rnd(i + 333) * w, rnd(i + 335) * h, 1 + rnd(i + 337) * 3, 1); }
      });
      const gm = new THREE.MeshStandardMaterial({ map: gaku, roughness: 0.55, metalness: 0.05 });
      const gp = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.5), gm); gp.position.set(0, PH + 0.78, Z + 0.06); gp.rotation.x = 0.12; scene.add(gp);
      for (const [w, h, x, y] of [[1.84, 0.06, 0, 0.28], [1.84, 0.06, 0, -0.28], [0.06, 0.62, -0.89, 0], [0.06, 0.62, 0.89, 0]]) { const f = box(w, h, 0.05, lacq, x, PH + 0.78 + y * Math.cos(0.12), Z + 0.07 - y * Math.sin(0.12)); f.rotation.x = 0.12; }
    }
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(2 * WALL_X, 4.6), texMat(DARK, 3, 1.6, 0x6a5444, 0.78)); wall.position.set(0, 2.3, -3.2); scene.add(wall);
    box(2 * WALL_X, 0.34, 0.36, darkWood, 0, 3.3, 1.2);   // 舞台の上の梁
    for (const sx of [-1, 1]) {
      box(0.24, 3.3 - HALL_Y, 0.24, darkWood, sx * 3.15, (3.3 + HALL_Y) / 2, 1.35);   // 舞台の柱
      const cur = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 3.4), new THREE.MeshStandardMaterial({ color: 0x1a0d0b, roughness: 0.95 }));
      cur.position.set(sx * 4.3, 1.7, 1.1); scene.add(cur);
      const w2 = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.0), shm); w2.position.set(sx * 2.85, 1.0, Z - 0.3); scene.add(w2);
      const sl = new THREE.PointLight(0xffb870, 0.35, 2.6, 2); sl.position.set(sx * 2.6, 1.1, Z - 0.1); scene.add(sl); out.flickerLights.push([sl, 0.04]);
    }
  }
  // ---- めくり（上手＝客席から見て右。紙の札をめくって演目名を出す）
  {
    const W_ = 448, H_ = 822;
    const cv = document.createElement('canvas'); cv.width = W_; cv.height = H_;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = maxAniso;
    const draw = (main, small) => {
      const g = cv.getContext('2d');
      washi(g, W_, H_, 400 + main.length * 17, '#f6f1e4');
      // 2026-11-23 本人「実際の寄席のめくりに近づける」：実物のめくりは、無地の白い和紙に墨一色の太い字を紙いっぱいに書いたもの（罫・朱の帯は付けない）。紙の縁はわずかに焼ける
      { const e = g.createLinearGradient(0, 0, W_, 0); e.addColorStop(0, 'rgba(90,60,25,.16)'); e.addColorStop(0.05, 'rgba(0,0,0,0)'); e.addColorStop(0.95, 'rgba(0,0,0,0)'); e.addColorStop(1, 'rgba(90,60,25,.16)'); g.fillStyle = e; g.fillRect(0, 0, W_, H_); }
      if (main) yoseText(g, main, W_ / 2, 70, small ? H_ - 150 : H_ - 40, 300, '#0b0907', W_ * 0.86, 0.1, 1.22);
      if (small) yoseLine(g, small, W_ / 2, H_ - 82, 58, '#1a1410');
      tex.needsUpdate = true;
    };
    const grp = new THREE.Group();
    const pm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, emissive: 0xfff4e0, emissiveMap: tex, emissiveIntensity: 0.32 });   // 2026-11-23 紙が灰色に沈む → 白く
    const back = new THREE.MeshStandardMaterial({ color: 0xe8e2d2, roughness: 0.95 });
    const PWm = 0.36, PHm = 0.66;
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(PWm, PHm), pm); paper.position.set(0, 0.6, 0.012); grp.add(paper);
    // めくる一枚（上の端を軸に回る）
    const flipG = new THREE.Group(); flipG.position.set(0, 0.6 + PHm / 2, 0.016); grp.add(flipG);
    const fp = new THREE.Mesh(new THREE.PlaneGeometry(PWm, PHm), [pm][0]); fp.position.y = -PHm / 2;
    const fpb = new THREE.Mesh(new THREE.PlaneGeometry(PWm, PHm), back); fpb.position.y = -PHm / 2; fpb.rotation.y = Math.PI; fpb.position.z = -0.001;
    const oldTex = new THREE.CanvasTexture(document.createElement('canvas')); const oldMat = new THREE.MeshStandardMaterial({ roughness: 0.9 }); fp.material = oldMat;
    flipG.add(fp, fpb); flipG.visible = false;
    box(PWm, PHm, 0.026, back, 0, 0.6, -0.003, grp);   // 重ねた紙の束の厚み
    for (const sx of [-1, 1]) { box(0.032, 1.0, 0.032, lacq, sx * 0.2, 0.5, 0, grp); box(0.06, 0.02, 0.3, lacq, sx * 0.2, 0.01, -0.06, grp); }
    box(0.46, 0.036, 0.042, lacq, 0, 0.96, 0, grp);
    // 2026-11-23：めくり台の上で紙の束をはさむ押さえの木（両端をつまみで締める）と、台の足もとの板
    box(0.44, 0.05, 0.016, darkWood, 0, 0.935, 0.03, grp);
    for (const sx of [-1, 1]) { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.03, 10), lacq); k.rotation.x = Math.PI / 2; k.position.set(sx * 0.2, 0.935, 0.05); grp.add(k); }
    box(0.5, 0.02, 0.2, lacq, 0, 0.01, -0.06, grp);
    // 2026-11-21：めくりを高座の上手の角の前へ寄せた（PC の席から観た画に入るように。前は画面の外だった）
    grp.position.set(0.74, KOZA_Y, 0.38); grp.rotation.y = -0.3; grp.scale.setScalar(0.78); if (innerWidth < innerHeight) { grp.position.set(0.5, KOZA_Y, -0.12); grp.scale.setScalar(0.56); }   /* スマホの縦の画角では内へ寄せて小さく */   /* 2026-11-23：実際の寄席にならい、高座の上手の脇に台ごと据える（床の高さ＝高座の上） */   // 2026-11-22：座った画で右の縁に切れないよう少し内へ
    scene.add(grp);   // 2026-11-23：前の行の注に scene.add が入りこみ、めくりが出ていなかった
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
  // ---- 燭台（2026-11-21 本人「照明はゆらめく火の照明に」）：高座の左右の前に二基。炎は芯から立つ涙形の光、灯は火のゆらぎで揺れる
  {
    out.flames = [];
    const fg = new THREE.SphereGeometry(1, 14, 10); fg.translate(0, 1, 0);
    const fcol = new THREE.Color(0xffa040);
    const flameMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const brass = new THREE.MeshStandardMaterial({ color: 0x3a2412, metalness: 0.6, roughness: 0.45 });
    const wax = new THREE.MeshStandardMaterial({ color: 0xe6dcc6, roughness: 0.6, emissive: 0x6a3a10, emissiveIntensity: 0.35 });
    for (const sx of [-1, 1]) {
      const g = new THREE.Group();
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, 0.62, 10), brass); st.position.y = 0.31; g.add(st);
      const ft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.03, 18), brass); ft.position.y = 0.015; g.add(ft);
      const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.03, 0.025, 18), brass); dish.position.y = 0.63; g.add(dish);
      const cd = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.12, 12), wax); cd.position.y = 0.70; g.add(cd);
      const f1 = new THREE.Mesh(fg, flameMat(0xffd890, 0.95)); f1.scale.set(0.009, 0.026, 0.009); f1.position.y = 0.765;
      const f2 = new THREE.Mesh(fg, flameMat(fcol, 0.35)); f2.scale.set(0.02, 0.05, 0.02); f2.position.y = 0.755;
      g.add(f1, f2);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(64, 64, (c, w, h) => { const r = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(255,190,110,.55)'); r.addColorStop(1, 'rgba(255,140,60,0)'); c.fillStyle = r; c.fillRect(0, 0, w, h); }), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
      halo.scale.setScalar(0.32); halo.position.y = 0.79; g.add(halo);
      const pl = new THREE.PointLight(0xff9a48, 0.9, 3.6, 2); pl.position.y = 0.82; g.add(pl);
      g.position.set(sx < 0 ? -1.26 : 1.5, 0, 0.55); scene.add(g);   // 2026-11-22：上手の燭台はめくりの陰に隠れていた→めくりの外側（上手寄り）へ
      out.flames.push({ f1, f2, halo, pl, base: 0.9, s: sx * 3.1 + 7 });
    }
  }
  // ---- 舞台の灯（上手前の主光・下手前の補い・後ろ上の縁・襖を洗う灯）
  {
    const key = new THREE.SpotLight(0xffc584, 1.22, 0, THREE.MathUtils.degToRad(19), 0.7, 0);
    key.position.set(1.2, 4.3, 3.8); key.target.position.set(0, 1.0, 0); scene.add(key, key.target);
    key.castShadow = true; key.shadow.mapSize.set(LITE ? 1024 : 2048, LITE ? 1024 : 2048); key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
    const fill = new THREE.SpotLight(0xffd8b0, 0.17, 0, THREE.MathUtils.degToRad(24), 0.8, 0); fill.position.set(-2.4, 2.6, 3.2); fill.target.position.set(0, 1.0, 0); scene.add(fill, fill.target);
    const back = new THREE.SpotLight(0xffe2bd, 0.75, 0, THREE.MathUtils.degToRad(20), 0.6, 0); back.position.set(0.3, 3.6, -1.0); back.target.position.set(0, 1.2, 0.1); scene.add(back, back.target);
    const wash = new THREE.SpotLight(0xffc888, 0.1, 0, THREE.MathUtils.degToRad(36), 0.9, 0); wash.position.set(0, 3.0, 1.6); wash.target.position.set(0, 0.9, -1.15); scene.add(wash, wash.target);
    const mk = new THREE.SpotLight(0xffe6c0, 0.5, 0, THREE.MathUtils.degToRad(12), 0.6, 0); mk.position.set(2.0, 3.2, 3.0); mk.target.position.set(1.12, 0.6, 0.98); scene.add(mk, mk.target);
    out.stageLights = [key, fill, back, wash, mk]; for (const l of out.stageLights) l.userData.k0 = l.intensity;
    out.keyLight = key;
  }

  // ==== 客席 =================================================================================
  {
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(2 * WALL_X, BACK_Z - STAGE_Z1), texMat(OLD, 3, 2.4, 0x5a4634, 0.7, 0.25));
    fl.rotation.x = -Math.PI / 2; fl.position.set(0, HALL_Y, (BACK_Z + STAGE_Z1) / 2); fl.receiveShadow = true; scene.add(fl);
    if (fl.material.isMeshPhysicalMaterial) { fl.material.clearcoat = 0.6; fl.material.clearcoatRoughness = 0.16; }   /* 2026-11-24 本人の参考画像：磨かれた木の床に灯が映る（スマホは軽い材質のまま） */
    // 左右の壁（杉の板）・腰板・天井（格天井）
    for (const sx of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(BACK_Z - 1.0, CEIL_Y - HALL_Y), texMat(DARK, 3, 1.6, 0x6a5444, 0.8));
      w.rotation.y = -sx * Math.PI / 2; w.position.set(sx * WALL_X, (CEIL_Y + HALL_Y) / 2, (BACK_Z + 1.0) / 2); scene.add(w);
      box(0.06, 0.12, BACK_Z - 1.0, darkWood, sx * (WALL_X - 0.03), 1.55, (BACK_Z + 1.0) / 2);   // 長押
      for (let z = 1.6; z < BACK_Z; z += 1.4) box(0.14, CEIL_Y - HALL_Y, 0.14, darkWood, sx * (WALL_X - 0.07), (CEIL_Y + HALL_Y) / 2, z);   // 柱
    }
    // 格天井：格縁の間に杉の鏡板（Poly Haven CC0 japanese_cedar_planks）。煤けた古い色
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(2 * WALL_X, BACK_Z - 1.0), texMat(SUGI, 6, 4, 0x6e5238, 0.75));
    // 2026-11-23 格天井が暗くて見えない → 客席の上に、天井を照らす灯（吊り行灯の上へ漏れる光）を一つ
    { const up = new THREE.PointLight(0xffb878, 0.9, 7.5, 1.6); up.position.set(0, CEIL_Y - 0.55, (BACK_Z + STAGE_Z1) / 2); scene.add(up); out.flickerLights.push([up, 0.05]); }
    ceil.rotation.x = Math.PI / 2; ceil.position.set(0, CEIL_Y, (BACK_Z + 1.0) / 2); scene.add(ceil); out.ceiling = ceil;
    for (let x = -WALL_X + 0.9; x < WALL_X; x += 0.9) box(0.08, 0.1, BACK_Z - 1.0, darkWood, x, CEIL_Y - 0.05, (BACK_Z + 1.0) / 2);
    for (let z = 1.5; z <= BACK_Z; z += 0.9) box(2 * WALL_X, 0.1, 0.08, darkWood, 0, CEIL_Y - 0.05, z);
    // 後ろの壁（真ん中が木戸からの入口）
    const bw = texMat(DARK, 2, 2, 0x5a4636, 0.8);
    for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(WALL_X - 0.75, CEIL_Y - HALL_Y), bw); p.rotation.y = Math.PI; p.position.set(sx * (WALL_X + 0.75) / 2, (CEIL_Y + HALL_Y) / 2, BACK_Z); scene.add(p); }
    { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.5, CEIL_Y - 1.4), bw); p.rotation.y = Math.PI; p.position.set(0, (CEIL_Y + 1.4) / 2, BACK_Z); scene.add(p); }
  }
  // 2026-11-23 本人の参考画像：奥の灯は大きくぼけた光の玉に（被写界深度の模式。光る板を重ねるだけ・スマホは数を減らす）
  { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,214,150,.95)'); gr.addColorStop(.55, 'rgba(255,196,120,.55)'); gr.addColorStop(.8, 'rgba(255,186,110,.18)'); gr.addColorStop(1, 'rgba(255,180,100,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const bm = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.32, fog: false });
    const P = [[-4.9, 2.5, 7.6, 1.1], [4.9, 2.4, 7.2, 1.0], [-5.0, 2.1, 5.2, 0.8], [5.0, 2.2, 4.6, 0.85], [-1.6, 3.0, 8.2, 1.3], [1.9, 2.8, 8.3, 1.2], [-3.2, 0.9, -2.6, 0.9], [3.4, 1.1, -2.7, 1.0], [0.0, 3.2, -2.9, 1.4]];
    for (const [x, y, z, s0] of (LITE ? P.slice(0, 5) : P)) { const sp = new THREE.Sprite(bm); sp.position.set(x, y, z); sp.scale.setScalar(s0); scene.add(sp); } }
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
    for (const [x, z] of [[-3.6, 4.5], [3.6, 4.5]]) { const p = new THREE.PointLight(0xffa860, 0.9, 6, 2); p.position.set(x, 2.4, z); scene.add(p); out.flickerLights.push([p, 0.12]); }
    const hemi = new THREE.HemisphereLight(0xa88a68, 0x120c06, 0.13); scene.add(hemi); out.hemi = hemi; hemi.userData.k0 = hemi.intensity;
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
      if (!keep.has(`${x},${z}`) && !(x < -2 && z < 3.4) && rnd(n + 400) < 0.62)   /* 2026-11-23 桟敷から観ると左端の前の客の頭がめくりを隠した */ person(x, HALL_Y + 0.46, z, n, false);
      n++;
    }
    // 桟敷
    for (const sx of [-1, 1]) {
      const deck = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 5.6), texMat(HINOKI, 0.8, 3, 0x4a3524, 0.6)); deck.position.set(sx * 4.75, HALL_Y + 0.175, 5.0); scene.add(deck);
      const tm = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 5.56), new THREE.MeshStandardMaterial({ map: tatami, roughness: 0.9 })); tm.rotation.x = -Math.PI / 2; tm.position.set(sx * 4.75, HALL_Y + 0.352, 5.0); scene.add(tm);
      box(1.4, 0.06, 0.06, darkWood, sx * 4.75, HALL_Y + 0.38, 2.2);
      for (let z = 2.6; z < 7.8; z += 0.75) {
        const zb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.52), new THREE.MeshStandardMaterial({ color: 0x4a2030, roughness: 0.9 })); zb.position.set(sx * 4.55, HALL_Y + 0.38, z); scene.add(zb);
        if (!(sx < 0 && z < 3.4) && rnd(n + 500) < 0.55)   /* 2026-11-23 桟敷の席の一つ前の客の頭がめくりを隠した → 空ける */ person(sx * 4.55, HALL_Y + 0.37 - 0.12, z, n, true);
        n++;
      }
    }
    const eye = (x, y, z) => new THREE.Vector3(x, y, z);
    out.seats = {   // 2026-11-22 PC で前の客の頭が手前に大きく入り碧の顔が隠れた → 目の高さを少し上げる
      mae: { pos: eye(0.75, HALL_Y + 1.3, 2.78), name: '前の席' },
      naka: { pos: eye(-0.75, HALL_Y + 1.32, 4.38), name: 'まん中の席' },
      sajiki: { pos: eye(-4.55, HALL_Y + 0.38 + 0.78, 3.35), name: '桟敷' },
    };
    out.aisle = eye(0, HALL_Y + 1.58, 6.2);
    // 2026-11-19：席を 3D の木札で選ぶ（通路に立つと、座れる席の上に札が下がる。押すとそこへ座る）
    const tagTex = (t, s2) => canvasTex(256, 384, (g, w, h) => {
      g.fillStyle = '#d8c4a0'; g.fillRect(0, 0, w, h);
      g.globalAlpha = 0.22; for (let y = 0; y < h; y += 2) { g.fillStyle = rnd(y + 9) > 0.5 ? '#8a6a40' : '#efe2c8'; g.fillRect(0, y, w, 1 + rnd(y + 1) * 2); } g.globalAlpha = 1;
      g.strokeStyle = '#3a2416'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
      g.fillStyle = '#121010'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const cs = [...t], fs = Math.min(92, 250 / cs.length); g.font = `400 ${fs}px PottaOne, serif`; cs.forEach((c, i) => g.fillText(c, w / 2, 70 + fs / 2 + i * fs * 0.98));
      g.fillStyle = '#7a1e1e'; g.font = '400 30px PottaOne, serif'; g.fillText(s2, w / 2, h - 34);
    });
    const string = new THREE.MeshBasicMaterial({ color: 0x2a1a10 });
    for (const [k, t, s2, tx] of [['sajiki', '桟敷', '畳の横', -0.4], ['naka', '中', '全体が見える', 0], ['mae', '前', '高座の近く', 0.4]]) {   // 通路に立った目の前に、左から桟敷・中・前（席のある向きの順）
      const S = out.seats[k], m = new THREE.MeshStandardMaterial({ map: tagTex(t, s2), roughness: 0.8, emissive: 0xffe2b0, emissiveIntensity: 0.18 }); m.emissiveMap = m.map;
      const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.4), m); tag.position.set(tx, out.aisle.y - 0.47, 4.45);   /* 2026-11-22 札が高座の碧の顔を隠していた → 少し下げる */ tag.lookAt(out.aisle.x, out.aisle.y, out.aisle.z);
      const cord = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.12, 0.008), string); cord.position.set(0, 0.26, 0);   /* 2026-11-24 長い紐が襖の両端の謎の細い棒に見えた → 札の上に短く */ cord.visible = Math.abs(tx - out.aisle.x) > 0.05; tag.add(cord);   /* 2026-11-23 真ん中の札の紐が高座の碧を縦に貫いて見えた → 真ん中だけ紐を見せない */
      const hit = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.6, 0.2), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(0, -0.03, 0); tag.add(hit);
      if (innerWidth / innerHeight < .8) tag.scale.setScalar(.72); else { tag.scale.setScalar(.62); tag.position.y += 0.085; }   /* 2026-11-24 PC で下の案内が「中」の札に重なった → 札を小さく上げる */   /* 2026-11-23 PC で札の下が画面で切れた */   /* 2026-11-22 スマホで席の札が高座を大きく隠した → 小さく（押せる範囲 hit はそのまま） */ tag.userData.seat = k; hit.userData.seat = k; tag.userData.mat = m; hit.userData.mat = m; tag.visible = false; scene.add(tag); out.seatTags.push(tag, hit);
    }
  }
  // 2026-11-19：館への置き行灯（旧 Qualia/yose の「あわせて訪ねる館の部屋」を、高座の下手の行灯にした。押すと Qualia Museum のその部屋へ）
  {
    const g = new THREE.Group(); const H = 0.62, W = 0.3;
    let cv = null; const tex = canvasTex(256, 512, (c) => { cv = c.canvas; });
    const paper = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, emissive: 0xffd8a0, emissiveIntensity: 0.55, side: THREE.DoubleSide }); paper.emissiveMap = tex;
    const sidePaper = new THREE.MeshStandardMaterial({ color: 0xf3e8d2, roughness: 0.9, emissive: 0xffd8a0, emissiveIntensity: 0.55, side: THREE.DoubleSide });   // 2026-11-23 字は正面だけ（横から二重に読めた）
    for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(W, H), i ? sidePaper : paper); const a = i * Math.PI / 2; p.position.set(Math.sin(a) * W / 2, H / 2 + 0.08, Math.cos(a) * W / 2); p.rotation.y = a; g.add(p); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.025, H + 0.12, 0.025, darkWood, sx * W / 2, (H + 0.12) / 2, sz * W / 2, g);
    box(W + 0.05, 0.03, W + 0.05, darkWood, 0, H + 0.12, 0, g); box(W + 0.05, 0.03, W + 0.05, darkWood, 0, 0.08, 0, g);
    const lamp = new THREE.PointLight(0xffc98a, 0.5, 2.4, 2); lamp.position.set(0, H / 2 + 0.08, 0); g.add(lamp);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.85, 0.42), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.4; hit.userData.andon = true; hit.userData.mat = paper; g.add(hit);
    g.position.set(-1.05, 0.45, 0.05); g.scale.setScalar(0.8); g.rotation.y = 0.3;   /* 2026-11-23 桟敷から観ると行灯が碧の体を隠した → 下手の奥へ */ if (innerWidth < innerHeight) { g.position.set(-0.33, 0.45, -0.4); g.scale.setScalar(0.7); g.rotation.y = 0.2; }   /* 2026-11-23 スマホは碧の左うしろへ（画の左端で切れていた） */ g.visible = false; scene.add(g);   // 高座の上・座布団の上手の手前（前幕に隠れず、座って観ている間も入る）。座ってから灯す
    out.andon = {
      group: g, hit,
      set(room, why) {
        const c = cv.getContext('2d'), w = cv.width, h = cv.height; washi(c, w, h, 700, '#efe4cc');
        yoseLine(c, '館へ', w / 2, 54, 46, '#8a2216');
        yoseText(c, room, w / 2, 96, h - 96, 72, '#16110c', w * 0.5);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = '#4a3220'; c.font = '400 22px "Klee One", serif'; const ws = [...why]; const ln = []; for (let i = 0; i < ws.length; i += 10) ln.push(ws.slice(i, i + 10).join('')); ln.slice(0, 2).forEach((l, i) => c.fillText(l, w / 2, h - 58 + i * 28));
        tex.needsUpdate = true;
      },
    };
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
      g.fillStyle = '#efe9da'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'italic 500 58px "Cormorant Garamond", serif'; g.fillText('Qualia/rakugo', w / 2, h * 0.42);  // 2026-11-19：yose を rakugo に統合（名は一つ）
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
    const boardTex = (title, mins) => canvasTex(160, 640, (g, w, h) => {
      g.fillStyle = '#d8c4a0'; g.fillRect(0, 0, w, h);
      g.globalAlpha = 0.25; for (let y = 0; y < h; y += 2) { g.fillStyle = rnd(y + 3) > 0.5 ? '#8a6a40' : '#efe2c8'; g.fillRect(0, y, w, 1 + rnd(y) * 2); } g.globalAlpha = 1;
      g.fillStyle = '#121010'; g.textAlign = 'center'; g.textBaseline = 'middle';
      yoseText(g, title, w / 2, 16, h - 86, 140, '#110d0b', w * 0.94, 0.018, 1.0);   // 2026-11-21：筆の字に（小さい画面で読めるよう、太らせを弱め字を大きく）
      if (mins) { g.save(); g.fillStyle = '#8a2216'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '400 38px PottaOne, serif'; g.fillText(`約${mins}分`, w / 2, h - 42); g.restore(); }   /* 2026-11-19：一席の長さ */
      g.strokeStyle = '#3a2416'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
    });
    const bw = 0.42, gap = 0.12, total = ENM.length * bw + (ENM.length - 1) * gap;
    ENM.forEach((e, i) => {
      const m = new THREE.MeshStandardMaterial({ map: boardTex(e.t, Math.round(e.d / 60)), roughness: 0.75, emissive: 0xffffff, emissiveIntensity: 0.0 });
      m.emissiveMap = m.map;
      const b = new THREE.Mesh(new THREE.BoxGeometry(bw, 1.6, 0.05), [darkWood, darkWood, darkWood, darkWood, m, darkWood]);
      b.position.set(-total / 2 + bw / 2 + i * (bw + gap), HALL_Y + 3.65, FZ + 0.2); b.rotation.x = -0.08; b.userData.slug = e.slug; b.userData.mat = m; scene.add(b); out.boards.push(b);
      // 2026-11-19：押しやすさのため、札のすき間まで覆う見えない当たり（375px でも一枚 44px 前後）
      const hit = new THREE.Mesh(new THREE.BoxGeometry(bw + gap, 1.9, 0.3), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.copy(b.position); hit.userData.slug = e.slug; hit.userData.mat = m; scene.add(hit); out.boardHits.push(hit);
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
  // 2026-11-24 本人の参考画像「奥の行灯や提灯は大きくぼけた光」：高座の左右の奥に、ぼけた灯の玉（縁が少し明るい丸）。加算で描くだけで光源は足さない（重さはほぼ変えない）
  {
    const orbTex = canvasTex(128, 128, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(255,196,120,.30)'); r.addColorStop(0.6, 'rgba(255,184,110,.30)'); r.addColorStop(0.8, 'rgba(255,196,128,.16)'); r.addColorStop(1, 'rgba(255,170,90,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
    const om = new THREE.SpriteMaterial({ map: orbTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false, opacity: 0.32 });
    const P = [[-2.55, 2.35, -1.3, 0.5], [-3.05, 1.75, -1.1, 0.38], [2.6, 2.3, -1.3, 0.48], [3.1, 1.65, -1.1, 0.4], [-4.6, 2.7, -0.8, 0.6], [4.6, 2.65, -0.8, 0.6]];
    out.orbs = [];
    for (const [x, y, z, sc] of (LITE ? P.slice(0, 4) : P)) { const o = new THREE.Sprite(om); o.position.set(x, y, z); o.scale.setScalar(sc); o.renderOrder = 5; scene.add(o); out.orbs.push(o); }
  }
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
