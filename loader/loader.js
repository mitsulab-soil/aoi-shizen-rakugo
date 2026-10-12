/* mitsulab の読み込み画面（全アプリ共通）── 2026-10-09
   本人（2026-10-09）：「全てのアプリに共通ですが、アプリを開いた時の読み込み中のデザインを、mitsulab っぽく、HP を参考にかっこいいグラフィックで設計してください。」
   手本＝HP（mitsulab.jp）の色と線：紺の地（#03060f）・碧の水色（#5cc8e0）・細い線画・ゆっくり動く粒。
   絵：地の底から、地層の線が一本ずつ左から右へ引かれて積み上がり、細かな粒がゆっくり立ちのぼる。まん中にそのアプリの印（favicon/icon.svg）、まわりを進み具合の細い輪が囲む。
   軽さ：外の書体・画像は読まない（印の SVG だけ）。描くのは小さな Canvas 一枚。読み込みが終わると、描くのをやめて消える。
   動きを減らす設定（prefers-reduced-motion）では、静止した一枚（線と粒は描き終えた形）。読み上げには「読み込み中」と進み具合を伝える（role=status）。

   使い方（ページの <body> のはじめ近くに）：
     <script src="loader/loader.js" data-title="森羅博物館" data-en="Shinra Museum" data-icon="favicon/icon.svg"></script>
     … 読み込みの途中で  MLLoader.progress(0.42)  （0〜1。呼ばなければ、ゆっくり進む「おまかせ」の表示）
     … 終わったら        MLLoader.done()
   自分で呼ばないページは data-auto="load"（ページの load で消える）。data-max="8000" で、どんなときも 8 秒で消える。
   既にある読み込み画面を置きかえるときは、その要素を消すか隠す（id を data-replace="boot" で渡すと、その要素は隠す）。 */
(function () {
  if (window.MLLoader) return;
  const me = document.currentScript, D = me ? me.dataset : {};
  const title = D.title || document.title || "", en = D.en || "", icon = D.icon || "favicon/icon.svg";
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const css = `
#ml-loader{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;color:#eef5fb;
  background:radial-gradient(1100px 760px at 50% 38%,rgba(36,88,143,.32),transparent 62%),radial-gradient(900px 700px at 8% 90%,rgba(26,92,129,.22),transparent 60%),#03060f;
  font-family:"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic UI","Noto Sans JP",system-ui,sans-serif;transition:opacity .8s ease,visibility .8s}
#ml-loader.ml-out{opacity:0;visibility:hidden}
#ml-loader canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#ml-loader .ml-in{position:relative;text-align:center;padding:0 24px;width:min(560px,100%)}
#ml-loader .ml-mark{position:relative;width:132px;height:132px;margin:0 auto 26px}
#ml-loader .ml-mark svg.ml-ring{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}
#ml-loader .ml-mark img{position:absolute;left:50%;top:50%;width:62px;height:62px;transform:translate(-50%,-50%);border-radius:14px;filter:drop-shadow(0 0 18px rgba(92,200,224,.35))}
#ml-loader .ml-t{font-family:"Shippori Mincho","Hiragino Mincho ProN","Yu Mincho","Noto Serif JP",serif;font-weight:600;font-size:clamp(24px,6.4vw,36px);letter-spacing:.28em;margin-right:-.28em;line-height:1.35;text-shadow:0 1px 18px rgba(3,6,15,.9)}
#ml-loader .ml-en{font-family:"Cormorant Garamond","Times New Roman",serif;font-style:italic;font-size:15px;letter-spacing:.18em;color:#9bdcf0;margin-top:6px;min-height:1em}
#ml-loader .ml-st{margin-top:22px;font-size:13px;letter-spacing:.2em;color:#8f9bb4;font-variant-numeric:tabular-nums}
#ml-loader .ml-by{position:absolute;left:0;right:0;bottom:max(18px,env(safe-area-inset-bottom));text-align:center;font-family:"Cormorant Garamond","Times New Roman",serif;font-size:15px;letter-spacing:.42em;margin-right:-.42em;color:#c3cce0;opacity:.85}
#ml-loader .ml-by i{display:inline-block;width:26px;height:1px;background:rgba(92,200,224,.6);vertical-align:middle;margin:0 12px}
@media (prefers-reduced-motion:reduce){#ml-loader{transition:none}}`;
  const st = document.createElement("style"); st.textContent = css; (document.head || document.documentElement).appendChild(st);
  const el = document.createElement("div"); el.id = "ml-loader"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite");
  const R = 60, C = 2 * Math.PI * R;
  el.innerHTML = `<canvas aria-hidden="true"></canvas>
<div class="ml-in">
  <div class="ml-mark" aria-hidden="true">
    <svg class="ml-ring" viewBox="0 0 132 132"><circle cx="66" cy="66" r="${R}" fill="none" stroke="rgba(150,170,240,.16)" stroke-width="1"/>
      <circle class="ml-p" cx="66" cy="66" r="${R}" fill="none" stroke="#5cc8e0" stroke-width="2" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" style="transition:stroke-dashoffset .5s ease;filter:drop-shadow(0 0 6px rgba(92,200,224,.7))"/></svg>
    <img alt="" src="${icon}" onerror="this.remove()">
  </div>
  <div class="ml-t"></div><div class="ml-en"></div>
  <div class="ml-st"><span class="ml-sr">読み込み中</span><span class="ml-pc" aria-hidden="true"></span></div>
</div>
<div class="ml-by" aria-hidden="true"><i></i>mitsulab<i></i></div>`;
  el.querySelector(".ml-t").textContent = title; el.querySelector(".ml-en").textContent = en;
  const mount = () => { document.body.appendChild(el); if (D.replace) { const o = document.getElementById(D.replace); if (o) o.style.visibility = "hidden"; } document.body.setAttribute("aria-busy", "true"); };
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);

  // ---------------------------------------------------------------- 絵（地層の線と、立ちのぼる粒）
  const cv = el.querySelector("canvas"), g = cv.getContext("2d");
  let W = 0, H = 0, dpr = 1, t0 = performance.now(), raf = 0, prog = null, shown = 0, auto = 0, alive = true;
  const N_LINE = 9, N_DOT = 70, dots = [];
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const lines = Array.from({ length: N_LINE }, (_, i) => ({ y: .63 + i * .043 + (rnd() - .5) * .01, a: 6 + rnd() * 14, f: 1.2 + rnd() * 2.2, ph: rnd() * 6, d: i * .32, w: i % 3 === 0 ? 1.4 : .8 }));
  for (let i = 0; i < N_DOT; i++) dots.push({ x: rnd(), y: .55 + rnd() * .45, v: .006 + rnd() * .018, r: .5 + rnd() * 1.6, ph: rnd() * 6 });
  function size() { dpr = Math.min(2, window.devicePixelRatio || 1); W = cv.clientWidth || innerWidth; H = cv.clientHeight || innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0); }
  size(); addEventListener("resize", size);
  function draw(now) {
    const t = RM ? 99 : (now - t0) / 1000;
    g.clearRect(0, 0, W, H);
    // 地層：下から一本ずつ、左から右へ引かれていく
    for (const L of lines) {
      const k = Math.max(0, Math.min(1, (t - L.d) / 2.4)); if (k <= 0) continue;
      const ease = 1 - Math.pow(1 - k, 3), x1 = W * ease;
      g.beginPath();
      for (let x = 0; x <= x1; x += 10) { const yy = H * L.y + Math.sin(x / W * Math.PI * L.f + L.ph + t * .15) * L.a; x ? g.lineTo(x, yy) : g.moveTo(x, yy); }
      const grd = g.createLinearGradient(0, 0, W, 0); grd.addColorStop(0, "rgba(92,200,224,0)"); grd.addColorStop(.25, "rgba(92,200,224,.38)"); grd.addColorStop(.75, "rgba(155,220,240,.3)"); grd.addColorStop(1, "rgba(92,200,224,0)");
      g.strokeStyle = grd; g.lineWidth = L.w; g.stroke();
      if (k < 1) { const yy = H * L.y + Math.sin(x1 / W * Math.PI * L.f + L.ph + t * .15) * L.a; g.fillStyle = "rgba(200,240,250,.9)"; g.beginPath(); g.arc(x1, yy, 1.8, 0, 7); g.fill(); }   // 線を引く先の光
    }
    // 粒：地の中から、ゆっくり立ちのぼる
    for (const d of dots) {
      const y = ((d.y - (RM ? 0 : t * d.v)) % 1 + 1) % 1, x = d.x + Math.sin(t * .4 + d.ph) * .006;
      const a = Math.min(1, (1 - y) * 3) * Math.min(1, y * 4) * (.35 + .35 * Math.sin(t * 1.3 + d.ph));
      g.fillStyle = `rgba(155,220,240,${Math.max(0, a).toFixed(3)})`; g.beginPath(); g.arc(x * W, y * H, d.r, 0, 7); g.fill();
    }
    // 進み具合（知らせがなければ、ゆっくり 90% まで）
    if (prog == null) { auto += (0.9 - auto) * .004; }
    const want = prog == null ? auto : prog; shown += (want - shown) * (RM ? 1 : .12);
    el.querySelector(".ml-p").style.strokeDashoffset = String(C * (1 - shown));
    const pc = Math.round(shown * 100), lab = el.querySelector(".ml-pc"); if (lab.dataset.v !== String(pc)) { lab.dataset.v = pc; lab.textContent = `　${pc}%`; }
    if (alive && !RM) raf = requestAnimationFrame(draw);
  }
  if (RM) { draw(performance.now()); setInterval(() => alive && draw(performance.now()), 600); } else raf = requestAnimationFrame(draw);

  window.MLLoader = {
    progress(p, label) { prog = Math.max(0, Math.min(1, +p || 0)); if (label) el.querySelector(".ml-sr").textContent = label; if (RM) draw(performance.now()); },
    done() {
      if (!alive) return; prog = 1; el.querySelector(".ml-sr").textContent = "読み込みました";
      setTimeout(() => { el.classList.add("ml-out"); document.body.removeAttribute("aria-busy"); setTimeout(() => { alive = false; cancelAnimationFrame(raf); removeEventListener("resize", size); el.remove(); }, RM ? 0 : 850); }, RM ? 0 : 350);
    },
    el,
  };
  // 自分で done() を呼ばないページ：data-auto="load" で、ページの load の合図で消す。data-max（ミリ秒）で、どんなときもそこで消す
  if (D.auto === "load") { if (document.readyState === "complete") setTimeout(() => window.MLLoader.done(), 300); else addEventListener("load", () => window.MLLoader.done()); }
  if (D.max) setTimeout(() => window.MLLoader.done(), +D.max);
})();
