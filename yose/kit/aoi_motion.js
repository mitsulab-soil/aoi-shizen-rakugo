/* 碧（依代）の自然な動きと表情 ── aoi_motion.js（v6.1・2026-10-25 待つ姿と手の上げ下ろし）
   v6.1（採点「待つあいだ腕を体の前に浮かせて止まる」氷川・川越 73／Museum「案内の始めの手が硬い」／HP「手をかざしたまま小さく揺れ続ける・肩肘手首の遅れ」）：
   - 待つあいだの腕は体の横へ下ろす：肘を少し曲げ、手首は太ももの横・手のひらは腿へ（二関節の IK で寄せる）。手の的は肩にばねで遅れてついていく
     （重心の移し替え・息で肩が動くと、肘・手首が少し遅れて揺れ、行き過ぎずに静まる）。
   - 手を前で重ねるのは、ときどき・短く（6〜9 秒・あいだは 14〜24 秒の横に下ろす時間）・体に近く低い位置（下腹の前）。はじめは横に下ろして待つ。
   - 話す身ぶり・案内の手は、肩→肘→手首の順に効く（上げるとき）／手首→肘→肩の順に力が抜ける（下ろすとき）。準備を 0.55 秒にのばし、立ち上がりをなめらかに。
   - 止めている手の小さな揺れ（1.3 Hz）をやめ、息に合わせたごくゆっくりした動き（0.3 Hz・2 mm）だけにした。
   - 指す（point）も、止めているあいだは手の的を固定（体の揺れを肩で吸う）。
   - 氷川・川越の写し（10-22）の直しを取りこんだ：記録の手首は少しだけ（.22）・指は少しひらく（.2）。API は変えていない。
   v6.0（HP）：指すあいだも重心を真ん中へ戻しきらず、的の側の足へ少し寄せる。
   ---- 以下は v5.9 の記録 ----
   碧（依代）の自然な動きと表情 ── aoi_motion.js（v5.9・2026-10-19 統合）
   v5.9（統合。Codex の作業はすべて残し、その上に Claude の直しを重ねた）＝v5.6 ＋ Codex v5.8 ＋ Codex 10-17 ＋ Claude v5.7。
   - 新しいオプション uprightWeight（既定 .38＝Codex 10-17 の値）：posture:"upright" のときの片足荷重の強さ（0〜1。v5.5〜v5.6 は .9）。
   - 手を重ねる長さ：upright は v5.7（6〜10 秒）、natural は v5.6（9〜17 秒）。博物館（natural）で v5.7 の短さがそわそわ見えた（11 人の 1 回目）。
   - 肌の陰は Codex 10-17 の値（toony .32・gi .42）。Claude v5.7 の .4／.55 は採らない（同じ向きでより弱い）。
   照合の記録＝「kit の版の照合」（2026-10-19・共通 3D の資料）。
   Codex 10-17（HP・氷川で先に公開）：uprightの片足荷重を控え、歩行時のみ胴と腕の位相を戻す。
   既存の記録・IKを継続し、骨盤の位相を指数補間。新規の外部モーションは追加しない。
   肌・衣服のMToon形状とテクスチャは保ち、環境の陰影をなだらかにする。
   v5.8 (2026-10-15 Codex): 停止時の予測足位置・外部駆動の時間差・交互歩行・静止旋回を修正。
   v5.7（11 人の残り P2）：手を重ねるのは 6〜10 秒まで（同じ形で長く止まらない）・指した腕はゆっくり下ろす（0.8 秒・手首から）・
   首をかしげる幅を小さく（3〜7°）・下を見るときの上まぶたの下がりを控えめに（眠そうに見えない）・目をそらすとき下へ大きく伏せない・
   現れるとき肌（顔）を先に濃く（網目で顔だけ暗く見えない）・顔の陰をもう少しなだらかに（toony 0.4）。裾は aoi_robe.js v2.3。
   v5.6（11 人の第 2 回：自然さ 79〜83。話すあいだ目線が外れる・指すとき腕が目より先・顔がアニメの塗りで写実の場で絵に見える）：
   - 話す：目をそらすのは話しはじめの一度だけ、小さく短く（10〜15°・0.3〜0.5 秒・半分の回）。句の切れ目・話しながらの「ときどきそらす」はやめ、聞き手を見る。
     言い終わりの 0.8 秒は必ず聞き手を見る。話しながらのまばたきは中央値 3 秒・最短 1.4 秒・二度まばたきなし。
   - 指す：目（すぐ）→頭（ばね）→胴（向き）→腕（0.5 秒あと）の順。指す目の動きでまばたきしない。
   - 顔の塗り：肌の陰を、なだらかに（toony 0.5）温かく（陰の色を桃色寄りに・少し浅く）、環境の光の向きを残す（giEqualization 0.55）、やわらかい温かいリム。
     頬にいつもうっすら血色（笑うと少し上がる）。
   - 手を前で重ねる：くじではなく、重ねない回の次は必ず重ねる（はじめは 3〜6 秒で）。重ねているあいだ 4〜7 秒ごとに小さく組みなおす（上の手・高さ・前後）。
   - 歩きの腕の振りを、左右の足の差から（止まるとき両足が体より前にあり、両腕がそろって後ろへ・肘が曲がって前腕が前へ出ていた）。
   - 髪の自分の光を 7 割（博物館の暖かい光で、髪の水色だけが光って見えた）。裾は aoi_robe.js v2.2（脚に寄せる量を少し減らし、ふくらみを抑える）。
   v5.5（2026-10-14 11 人の残り：自然さ 77〜80。立ち姿が正面で左右ほぼ同じ・指す腕が棒・肌が白く平たい・後ろ髪の色の縞・現れるときの網目）：
   - 立ち姿（いちばんの根）：重心の移しを「記録の土台」に入れていたため、記録（モーションキャプチャ）が混ざると 8 割以上打ち消され、さらに記録の横の傾きも
     25% に抑えていたので、立ち姿がほぼ左右対称の「気をつけ」になっていた。いまは片足に重心を置く立ち方（コントラポスト）を記録の上に重ねる：
     重心の側へ腰が 3 cm 寄る・骨盤は遊脚の側が 3〜4° 下がる・胸と肩は逆へ 1〜2°・頭はわずかに傾く・遊脚はひざがゆるみ、かかとが少し上がる。
     重心を移し終えたら、遊脚を半歩置きなおす（前へ 3〜7 cm／前の足がすでに前なら横へ戻す。4 回に 3 回）。移す間隔は 4〜12 秒・量も毎回変える。upright（背はまっすぐ）は 9 割・7〜15 秒ごと。
   - 指す：肩と上腕が先に上がり、肘から先は 0.1 秒・手首と指は 0.2 秒遅れる（重なりの遅れ）。上がるあいだ肘は曲がったまま。肩（鎖骨）も少し上がって前へ。
     下ろすときは手首から力が抜ける。指は人差し指を伸ばし、ほかは握り、親指を中指へ添える。
   - 肌（softenSkin）：陰の色を温かく浅く（灰色へ沈めない）・明暗の境をやわらかく・光の当たらない縁にごく薄い血色。
   - 髪の絵（evenHairSheet）：前髪と横の髪の絵は 4 つの色の帯（青緑・緑・赤茶・青）を並べた一枚で、房ごとに違う帯を拾い、後ろから見ると色の縞になっていた。
     読み込んだあと、その写しの行ごとに色みを 6 割そろえる（明るさと細い毛の筋はそのまま・.vrm はさわらない・透けのある絵はさわらない）。
   - 立って待つあいだ、ときどき両手を体の前で軽く重ねる（8〜16 秒ごとにくじ・4 割半）。止まるときに腕が前へ浮く振り子を半分に。白い服の自分の光（emissive）を 6 割に。
   - 裾は aoi_robe.js v2.1（後ろの裾ほどやわらかく、歩くと遅れてなびく）。ローブの下の脚の肌を、どのアプリでも畳む（前は氷川道中だけ。hideLegs:false で外せる）。
   - 顔へのやわらかい補助光（任意 faceLight＝顔の位置での明るさ。研究室・博物館で使う）。API は同じ（足したものは任意）。
   v5.4（2026-10-14 11 人の残り：立ち姿の腕が固い・裾が硬い円すい・裾の黒いくさび・後ろ髪が板の束）：
   - 腕（_armLife）：肩からぶら下がる振り子（体重の移し・歩き出し・止まるで遅れて揺れて戻る）・胴が傾いても重さで半分ほど鉛直へ・息で少し外へ・
     左右で違う肘の曲がり・6〜14 秒ごとに腕の置き方が少し変わる・指ごとの癖。身ぶり・指す・礼のときは外す。
   - 歩き出し：速さの上がり方に上限（毎秒 1.1 m/秒）・歩くあいだは左右を交互に・立っている足が離れすぎたら振っている足を早めに着く・向きかえの途中で歩き出したら一歩を歩きの一歩に
     （前は一こまで秒速 0.85 m になり、脚を前後に大きく開いて腰が 40 cm 沈むこまがあった）。
   - 髪（softenHair）：法線を頭の丸みへ 7.5 割寄せ、輪郭線を細く・陰の色に近く・明暗の境を少しやわらかく。となりの房どうしの揺れを 3 割そろえる（springGuard）。
   - 裾は aoi_robe.js v2（脚の前後に合わせて布の行き先を寄せる・歩くとなびく・となりの鎖とならす）。API は同じ（hairSoft:false で髪の直しを外せる）。
   v5.3（2026-10-14 本人「氷川道中、博物館などについて、碧の歩き方や髪型がおかしいです。しっかり実装とチェックをお願いします。」）：
   - 髪型が変わっていた：現れるあいだ（startCalm 既定 2.2 秒・アプリの calm）に毎こま setInitState() を呼び、揺れた形を「休みの形」に焼きこんでいた
     （房ごとに 6〜52° ずれた）。いまは焼きこまず、空気の抵抗を最大にして揺れずに落ち着かせる。焼きこまれた形も、読み込んだときの形へ戻す。
   - とんだとき（place・1.6 m 以上の飛び）は、髪・裾のばねも新しい位置の休みの形へ。新しい API：m.teleport(x, z, yaw)・m.resetSprings()・m.springGuard(dt)。
   - vrm.update を一こま一回に（同じこまの二度めは揺れものを進めない）・dt は 0.05 秒まで・揺れものは 1/60 秒より細かく刻む（アプリが vrm.update を呼んでも同じ）。
   - 髪・裾の守り（springGuard）：休みの形からの開き（髪は付け根 35°・その先 25°・裾 35°）と一こまの回り（髪 8°・裾 6°／60 分の 1 秒）に上限。ばねの中の状態もそろえる。
   - 歩き：速いときは歩数を増やし、両足が着いている間を短く（1 秒 2.5 歩まで）・振っている足も今の調子へ・腰を急に沈めない（毎秒 1.2 m まで）。API は同じ（足したものは任意）。
   v5.2（2026-10-14・T ポーズを見せない）：relaxPose(vrm) を足した（腕を下ろした休めの形。読み込んだ直後・動きの部品が届く前に呼ぶ）。
   AoiMotion は作った時点でこの形にする（最初の update の前に描かれても T ポーズにならない）。API は同じ（足したものは任意）。
   v5（2026-10-13 本人「碧は全体のキモ」）：
   - 話の中身に合う身ぶり（会話の身ぶりの研究：McNeill 1992 の四つの型＝拍子・指し示し・形をなぞる・たとえ／Kendon 1980・2004 の
     準備→打つ→止める→戻す。打つ瞬間は、その語の頭か少し前）。アプリは一行ごとに印を渡せる：
       speak({ kana, dur, gesture:[{ t:1.2, type:"deictic", target:v3 }, { t:2.0, type:"iconic", shape:"small-round" }] })
       type＝beat（拍子）| deictic（指し示し。target＝世界の位置か Object3D。無ければ「ここ」＝手のひらを下へ）| iconic（shape＝small・small-round・round・large・long・tall・flat）
             | metaphoric（shape＝contrast（二つを左右の手に置いてくらべる）・present（手のひらを上に、考えを差し出す））
       t の代わりに word:"これ" でもよい（字幕・かなの中のその語の時刻）。hand:"left"|"right"|"both"・hold（秒）は任意。
     印が無い行は、字幕（text）か読み（kana）から簡単な身ぶりを推して付ける（autoGesture:false で止める）：
       これ・あれ・ここ → 指す先が分かっていれば（speak の ref か、lookAt の先）そこを指す。「ここ」で先が無ければ手のひらを下へ
       小さい・大きい・高い・長い・丸い → 形をなぞる／でも・けれど・ではなく・くらべる → 両手でくらべる／とても・本当・大事・！ → 拍子
     身ぶりは人の幅の中で小さく（肘は脇の近く・手は胸から腰の前）。upright（HP）は 6 割の大きさ。指すときは目が先に的へ行き、止めるあいだ的を見る。
   - その場で向きを変える：目と頭が先に、次に胴、そのあと内側の足から踏み出す。20° ほどまでは踏みかえず、80° ほどまでは二歩、それより大きいと四歩。
     踏み出す前に、反対の足へ体重を移す。歩幅も小さい角度ほど小さい。
   - 現れ方：アプリが材質を薄くするあいだは、半透明で重ねず網目（ディザ）で描く（目だけ先に浮く・透けた顔に白目と口の中が浮く、を防ぐ）。
   - 画質の段（quality："auto"（既定）|"high"|"mid"|"low"）：弱い端末では、裾の布を一こまおきに・指を一こまおきに（mid）、
     さらに髪の揺れも一こまおきに（low）。auto は端末の手がかりで始め、こまの速さを見て下げる（よくなれば戻す）。m.quality で今の段。
   v4（2026-10-13 本人「碧の動きは全体のキモなので、８５点まで上げて。動きと表情を自然な感じに仕上げて。」「碧の表情について、不気味の谷を乗り越えてください。」）：
   - 立ち姿の記録 4 本×左右＝8 通りをくじで選び、2.4 秒かけて入れかえる。力を抜いた手が体から離れすぎない。
   - 歩き：歩数を速さに合わせる（秒速 0.85 m で 1 秒 1.75 歩）・かかとから着き、かかとを軸につま先を下ろす・かかとを上げるときはつま先の付け根を軸に・届かないときは腰を下げる・腕の振りは速さに合わせる。
   - 顔：笑み・眉を左右に分けた形（左右対称すぎない）・頬の血色（addCheekTint）・目の光が黒目の半分だけ動く（softenEyeHighlight）・まばたきの速さを毎回変える・
     見る人の両目と口元を行き来する視線・止まった顔にしない小さな気分の動き・口の開きを控え、音の頭で閉じ、次の母音へ寄せる。
   - 裾（aoi_robe.js）：脚の表面より内へ布を入れない（鎖のあいだも）。API は v3 と同じ（足したものはすべて任意）。調べ＝../../資料/碧の自然な動き_調べ.md §9。
   v3.1（2026-10-13 本人「HPの碧はまっすぐ立っていてください。姿勢は良くしていながら、自然な仕草にしてください。」「碧左右に揺れすぎです。もう少し揺れを抑えて」）：
   - 既定の立ち姿・歩きの左右の揺れを v3 の半分以下に（重心の移し 45%・骨盤の横の傾き・体の横揺れ・記録の胴の横の傾き 35%・記録の腰の横の動き 4 割・息の肩の傾き 半分・歩くときの骨盤の傾き 半分）。
   - 新しいオプション posture:"upright"（"formal" も同じ）＝まっすぐ立つ（HP）。骨盤は水平・背を立て・肩を少し引いて水平・手は脇。仕草は息・まばたき・小さな視線・小さく首をかしげるだけ。
     既定は posture:"natural"（ほかのアプリはこのまま）。
   本人（2026-10-12）：「碧の動きを極限まで人間の自然な動作に近づけて」「表情も大事です」
   調べたこと・数値の出どころ＝../../資料/碧の自然な動き_調べ.md。
   v3（2026-10-13）：
   - 人が動いた記録（モーションキャプチャ・CMU Graphics Lab Motion Capture Database。aoi_mocap.json／aoi_mocap.js）を土台にした。
     立つ（女性 2 人の記録を交互に）・歩く（女性の歩きの一周期を、この部品の足の運びの位相に合わせて）・話す（胴と首だけ）。
     脚は記録を使わず、これまでどおり足を地面に着けたまま IK で決める（すべらない）。目・まばたき・口・身ぶり・指す・礼は上に重ねる。
   - ローブの裾を布のように揺らす（aoi_robe.js）。脚の骨に直に付いていた裾を、腰から下がる鎖に付けかえる。
   - 表情：下まぶただけ上がる形（目を細める）と、頬が上がる形を、読み込んだときに顔の形から作って足した（.vrm はさわらない）。
   同じフォルダに aoi_mocap.js・aoi_mocap.json・aoi_robe.js を置く（json が無いときは、記録なしの動きで続ける）。

   使い方（どのアプリでも同じ）：
     import { AoiMotion } from "./kit/aoi_motion.js";
     const m = new AoiMotion(vrm, { root });        // root＝碧を置く入れ物（vrm.scene の親。無ければ vrm.scene）
     毎こま：m.update(dt, camera);                   // 中で vrm.update(dt) まで呼ぶ（{ vrmUpdate:false } で外せる）
     m.place(x, z, yaw)    いきなり置く（足もそろえる）
     m.walkTo(v3)          ばねで歩いて行く（足は地面に着いたまま、すべらない）
     m.drive(x, z)         アプリが自分で位置を決めるとき（壁の当たり判定など）。毎こま呼ぶ
     m.faceTo(yaw|null)    その向きへ足を踏みかえて向く（null＝見る人の方へ）
     m.lookAt(v3|Object3D|null)  見る先（null＝見る人）
     m.speak({ timeline, kana, text, dur, clock, level, gesture, ref, autoGesture })  話す（口・身ぶり・視線・まばたき）。clock＝声の再生位置（秒）を返す関数
                           gesture＝身ぶりの印（上の v5）・ref＝「これ・あれ」が指す物（v3|Object3D）・autoGesture＝印が無いとき推すか（既定 true）
     m.stopSpeaking()      話し終わり
     m.listen(on)          聞く（うなずき・首をかしげる・目を合わせる）
     m.point(v3, sec)      指さす（目→手→見る人の順）
     m.bow("eshaku"|"keirei")  お辞儀（会釈 15°・敬礼 30°。腰から曲げ、背は伸ばす）
     m.express(name, w, sec)   表情（calm・warm・smile・curious・thinking・concern・surprise）。ふだんは calm
   m.eyesClosed = 0..1   目を閉じたままにする（0 で戻す）
   新しいオプション（なくても動く）：{ posture: "natural"（既定）| "upright"（まっすぐ立つ）, groundAt: (x, z) => 地面の高さ（坂・段。氷川道中のため）, mocap: "auto"（既定・隣の aoi_mocap.json を読む）| URL | 読んだ JSON | false, robe: true | false,
                quality: "auto"（既定）| "high" | "mid" | "low"（v5） }
   何もしなくても：息（3.4〜4.8 秒で一回・吸う 4 割／吐く 6 割）・重心の移しかえ（片足に体重をのせ、骨盤が傾き、肩が逆に傾く）・
   小さな揺れ・まばたき（間隔は対数正規・話すと増える・視線を大きく動かすとき・二度まばたき）・目が先に動き頭が追う・
   ときどき目をそらす・腕は振り子として遅れてついてくる・表情の小さなゆらぎ。
   動きを減らす設定（reducedMotion）：揺れ・身ぶりを止め、まばたき・口・視線だけ残す。 */
import * as THREE from "three";
import { loadMocap, decodeMocap, sampleClip } from "./aoi_mocap.js";
import { AoiRobe, hideCoveredLegs } from "./aoi_robe.js";

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const sstep = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
const _v = [...Array(10)].map(() => new THREE.Vector3()), _q = [...Array(6)].map(() => new THREE.Quaternion()), _e = new THREE.Euler(), _m = new THREE.Matrix4();
const UP = new THREE.Vector3(0, 1, 0);

// 臨界減衰のばね（行き過ぎない・急に止まらない）
class Spr {
  constructor(v = 0, w = 6) { this.v = v; this.d = 0; this.t = v; this.w = w; }
  step(dt, w = this.w) { const x = this.v - this.t, c = this.d + w * x, e = Math.exp(-w * dt); this.v = this.t + (x + c * dt) * e; this.d = (this.d - c * w * dt) * e; return this.v; }
  set(v) { this.v = this.t = v; this.d = 0; }
}
function rng(seed) { let a = seed >>> 0 || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// なめらかな揺らぎ（周期のそろわない三つの正弦の和。-1..1）
const wob = (t, s) => .55 * Math.sin(t * .31 + s) + .3 * Math.sin(t * .73 + s * 2.3) + .15 * Math.sin(t * 1.61 + s * 4.1);

// ---------------------------------------------------------------- 口の時刻表
// timeline＝{ m:[[開始秒, 長さ, 母音, 唇を閉じる子音か], …], b:[拍（強く読む音の時刻）…], p:[句の始まり…], d:全体の秒 }
// 母音＝a i u e o、N（ん）、cl（っ）、pau（間）。大文字の A I U E O は無声化（口はほとんど動かない）
const KV = {}; { const rows = { a: "アカガサザタダナハバパマヤラワャァヮ", i: "イキギシジチヂニヒビピミリィ", u: "ウクグスズツヅヌフブプムユルュゥヴ", e: "エケゲセゼテデネヘベペメレェ", o: "オコゴソゾトドノホボポモヨロヲョォ" }; for (const [v, s] of Object.entries(rows)) for (const c of s) KV[c] = v; }
const LIP = new Set("マミムメモバビブベボパピプペポ");
// かな（VOICEVOX の kana＝「ヨオコソ、/シンラ/…」）と長さから、時刻表をつくる（正確な時刻表が無いアプリ用）
export function timelineFromKana(kana, dur, { pre = .05, post = .12 } = {}) {
  const ms = []; let phrase = true, ph = [];
  for (const c of kana || "") {
    if (c === "/") { phrase = true; continue; }
    if (c === "、" || c === "，" || c === "。") { ms.push({ v: "pau", w: 1.8 }); phrase = true; continue; }
    if ("ャュョァィゥェォヮ".includes(c) && ms.length && ms[ms.length - 1].v !== "pau") { ms[ms.length - 1].v = KV[c]; continue; }
    const m = c === "ー" ? { v: ms.length ? ms[ms.length - 1].v : "a", w: 1 } : c === "ッ" ? { v: "cl", w: .8 } : c === "ン" ? { v: "N", w: .9 } : KV[c] ? { v: KV[c], w: 1, c: LIP.has(c) ? 1 : 0 } : null;
    if (!m) continue; if (phrase) { m.ph = 1; phrase = false; } ms.push(m);
  }
  const W = ms.reduce((s, m) => s + m.w, 0) || 1, k = Math.max(.1, dur - pre - post) / W; let t = pre; const out = { m: [], b: [], p: [], d: dur };
  for (const m of ms) { if (m.ph) { out.p.push(t); out.b.push(t + k * .5); } out.m.push([+t.toFixed(3), +(m.w * k).toFixed(3), m.v, m.c || 0]); t += m.w * k; }
  return out;
}
// 漢字まじりの字幕しかないとき（声のない文）：字の数から、おおよその口の動きをつくる（母音は字ごとに決まった並び）
export function timelineFromText(text, dur) {
  const K = "アイウエオカキクケコサシスセソタチツテトナニヌネノマミムメモ"; let s = "";
  for (const c of text || "") { if ("、。，．！？!?…".includes(c)) s += "、"; else if (/\s/.test(c)) s += "/"; else if (KV[c] || "ンッー".includes(c)) s += c; else s += K[c.charCodeAt(0) % K.length]; }
  return timelineFromKana(s, dur);
}

// ---------------------------------------------------------------- 話の中身に合う身ぶり（v5）
// 型（McNeill 1992）：beat＝拍子（強める語に小さく打つ）・deictic＝指し示し・iconic＝形をなぞる・metaphoric＝たとえ（くらべる・差し出す）
// 推し方は、字幕やかなの中の語を見る簡単な決まり（文から身ぶりを付ける決まりの先例＝Cassell ら 2001 の BEAT）。迷う語は付けない。
const G_RULES = [
  // [型, 形, 字幕の語, かなの語]。かなは VOICEVOX の読み（アクセントの印 ' と _ は外して見る）
  ["deictic", "this", /これ(?!から|まで)|この|ここ(?!ろ)|こちら|こっち/, /コレ(?!カラ|マデ)|コノ|ココ(?!ロ)|コチラ|コッチ/],
  ["deictic", "that", /あれ|あそこ|あちら|あっち|あの(?![、，…])/, /アレ(?!ル)|アソコ|アチラ|アッチ|アノ(?![、，])/],
  // かなは句の頭（/ か 、 のあと）だけを見る（「アタタカク」の中のタカク・「ニワニ」の中のワニを拾わない）
  ["iconic", "small", /小さ|ちいさ|ちっちゃ|細か|こまか|細い|ほそい|微小|短い|みじかい/, /(?:^|[/、])(?:チイサ|チッチャ|コマカ|ホソ[イクナ]|ミジカ)/],
  ["iconic", "large", /大き|おおき|広い|広く|広が|(?<![ぁ-ん])ひろい|(?<![ぁ-ん])ひろが|巨大/, /(?:^|[/、])(?:オオキ|オッキ|ヒロ[イクガ]|キョダイ)/],
  ["iconic", "tall", /高い|高く|(?<![ぁ-ん])たか[いく]|そびえ/, /(?:^|[/、])(?:タカ[イク]|ソビエ)/],
  ["iconic", "long", /長い|長く|(?<![ぁ-ん])なが[いく]/, /(?:^|[/、])ナガ[イク]/],
  ["iconic", "round", /丸い|丸く|(?<![ぁ-ん])まる[いく]/, /(?:^|[/、])マル[イク]/],
  ["metaphoric", "contrast", /(?:^|[、。！？\s])(?:でも|けれど|けど|しかし)|一方|ではなく|じゃなく|逆に|違う|違い|ちがう|ちがい|比べ|くらべ|かわりに|よりも/, /(?:^|[、/])(?:デモ|ケレド|シカシ)|イッポ[オウ]|デワナ[クイ]|ジャナク|ギャクニ|チガ[ウイッ]|クラベ|カワリニ|ヨリモ/],
  ["beat", "", /とても|すごい|すごく|本当|ほんとう|必ず|かならず|一番|いちばん|絶対|ぜったい|大事|だいじ|大切|たいせつ|まさに|全部|ぜんぶ|もっと|まったく|全く|[！!]/, /トテモ|スゴ[イク]|ホント[オウ]|カナラズ|イチバン|ゼッタイ|ダイジ|タイセツ|マサニ|ゼンブ|モット|(?:^|[/、])マッタク/],
];
const G_PRI = { deictic: 4, iconic: 3, metaphoric: 2, beat: 1 };
// 語の位置 → 時刻。かなは口の時刻表と同じ数え方（一拍＝一つ）、字幕は字の重み（漢字は約 1.7 拍・小さい字は 0・句読点は間）
function _kanaClock(kana, tl, dur) {
  const raw = (kana || "").replace(/['_]/g, ""), at = []; let n = 0;
  for (const c of raw) { at.push(n); if (c === "/") continue; if ("、，。".includes(c)) { n++; continue; } if ("ャュョァィゥェォヮ".includes(c)) continue; if (c === "ー" || c === "ッ" || c === "ン" || KV[c]) n++; }
  const M = tl?.m || [], d = tl?.d || dur;
  return { s: raw, time: i => { const k = at[Math.min(i, at.length - 1)] ?? 0; if (M.length >= n && M[k]) return M[k][0]; return .05 + (d - .17) * k / Math.max(1, n); } };
}
function _textClock(text, tl, dur) {
  const s = text || "", at = []; let n = 0;
  for (const c of s) { at.push(n); n += /[、。，．！？!?…]/.test(c) ? 1.8 : /[ゃゅょぁぃぅぇぉゎ]/.test(c) ? 0 : /[一-鿿々]/.test(c) ? 1.7 : /\s/.test(c) ? .2 : /[A-Za-z0-9]/.test(c) ? .6 : 1; }
  const d = tl?.d || dur; return { s, time: i => .05 + (d - .17) * (at[Math.min(i, at.length - 1)] ?? 0) / Math.max(1, n) };
}
// 字幕・かなから身ぶりを推す。返すのは speak の gesture と同じ形（{ t, type, shape, target }）。ref＝「これ・あれ」が指す物（分からなければ null）
export function inferGestures({ text = "", kana = "", timeline = null, dur = 3, ref = null } = {}) {
  const useKana = !!(kana && kana.replace(/[^ァ-ヴー]/g, "").length > 2), C = useKana ? _kanaClock(kana, timeline, dur) : _textClock(text, timeline, dur), cand = [];
  for (const [type, shape, reT, reK] of G_RULES) { const re = new RegExp((useKana ? reK : reT).source, "g"); let m;
    while ((m = re.exec(C.s))) { const lead = m[0].search(/[^、。！？\s/]/), i = m.index + Math.max(0, lead); cand.push({ t: C.time(i), type, shape, i }); if (m[0].length === 0) re.lastIndex++; } }
  const out = []; let dei = false, con = false;
  for (const g of cand.sort((a, b) => G_PRI[b.type] - G_PRI[a.type] || a.t - b.t)) {
    if (g.shape === "contrast") { if (con) continue; con = true; }   // くらべる身ぶりは一行に一つ
    if (g.type === "deictic") { if (dei) continue; if (ref) { g.target = ref; } else if (g.shape === "this" && /ここ|ココ|こちら|コチラ/.test(C.s.slice(g.i, g.i + 3))) { g.target = null; } else continue; dei = true; }   // 指す先が分からない「これ・あれ」には付けない
    if (out.some(o => Math.abs(o.t - g.t) < (g.type === "beat" || o.type === "beat" ? .7 : 1.3))) continue;   // 近すぎる身ぶりは、強いほうだけ
    if (out.length >= 4) break;
    const o = { t: +g.t.toFixed(2), type: g.type }; if (g.type === "iconic" || g.type === "metaphoric") o.shape = g.shape; if (g.type === "deictic") o.target = g.target; out.push(o);
  }
  return out.sort((a, b) => a.t - b.t);
}
// アプリが渡した印をそろえる（word → 時刻・型の別名・欠けた形）
function _normGestures(list, { text, kana, timeline, dur }) {
  const out = []; let C = null;
  for (const g0 of list || []) { if (!g0) continue; const g = { ...g0 }; g.type = { point: "deictic", pointing: "deictic", icon: "iconic", metaphor: "metaphoric" }[g.type] || g.type; if (!G_PRI[g.type]) continue;
    if (g.t == null && g.word) { C ||= kana && /[ァ-ヴ]/.test(kana) && !/[ぁ-ん一-鿿]/.test(g.word) ? _kanaClock(kana, timeline, dur) : _textClock(text, timeline, dur); const i = C.s.indexOf(g.word); if (i < 0) continue; g.t = C.time(i); }
    if (!(g.t >= 0)) continue; if (g.type === "iconic") g.shape ||= "small-round"; if (g.type === "metaphoric") g.shape ||= "present"; out.push(g); }
  return out.sort((a, b) => a.t - b.t);
}
// v4：口の開きを v3 より小さく（アニメの口を大きく開けると「ゴムの口」に見える）。日本語の「う」は唇を突き出さないので ou は控えめ
const VIS = { a: { aa: .6, oh: .08 }, i: { ih: .5, ee: .14 }, u: { ou: .42, ih: .06 }, e: { ee: .55, aa: .1 }, o: { oh: .58, ou: .1 }, N: { ou: .08 }, A: { aa: .1 }, I: { ih: .08 }, U: { ou: .08 }, E: { ee: .1 }, O: { oh: .1 } };
const MOUTH = ["aa", "ih", "ou", "ee", "oh"];

// ---------------------------------------------------------------- 表情（VRoid の顔の形から、アニメの誇張を避けた小さな動きを組む）
// 目を閉じて笑う「happy」や、口を大きく開ける形は使わない。頬が上がり目尻が締まる（デュシェンヌ）を、下まぶたの小さな上がりで表す
// v3：lidLow（下まぶただけ上がる）・cheek（頬が上がる）は、読み込んだときに addFaceMorphs() が顔の形から作る
// v4：笑み・眉は左右に分けた形（[形, 重み, 左右＝1 左・-1 右]）。分けた形が無い顔では、もとの形（FB）を使う
const CH = { smile: [["AoiSmileL", 1, 1], ["AoiSmileR", 1, -1]], squint: [["Fcl_EYE_Fun", 1]], lidLow: [["AoiLidLow", 1]], cheek: [["AoiCheek", 1]], browUp: [["AoiBrowUpL", 1, 1], ["AoiBrowUpR", 1, -1]], browSad: [["Fcl_BRW_Sorrow", 1]], browJoy: [["AoiBrowJoyL", 1, 1], ["AoiBrowJoyR", 1, -1]], wide: [["Fcl_EYE_Spread", 1]], eyeSad: [["Fcl_EYE_Sorrow", 1]] };
const CH_FB = { smile: [["Fcl_MTH_Fun", 1]], browUp: [["Fcl_BRW_Surprised", 1]], browJoy: [["Fcl_BRW_Fun", 1]] };
const CHMAX = { squint: .2, lidLow: .62, cheek: 1 };
// v5：身ぶりの手の形（指の曲がり。0＝伸ばす）。open＝ひらく・flat＝そろえて伸ばす・cup＝丸く包む・point＝人差し指で指す・pinch＝小さなものをつまむ
const FING = { open: { Index: .1, Middle: .12, Ring: .16, Little: .2 }, flat: { Index: .04, Middle: .04, Ring: .06, Little: .08 }, cup: { Index: .45, Middle: .5, Ring: .55, Little: .6 }, point: { Index: .02, Middle: 1.15, Ring: 1.2, Little: 1.25 }, pinch: { Index: .8, Middle: .95, Ring: 1.05, Little: 1.1 } };   // 目を細めるのは 0.2 まで（閉じきるとまばたきに見える）。下まぶただけなら 0.62 まで
export const EMOTIONS = {
  calm:     { smile: .14, squint: .02, lidLow: .1, cheek: .12, browJoy: .10 },
  warm:     { smile: .3, squint: .05, lidLow: .3, cheek: .5, browJoy: .2 },
  smile:    { smile: .48, squint: .08, lidLow: .48, cheek: .85, browJoy: .3 },
  curious:  { smile: .08, browUp: .34, wide: .1 },
  thinking: { lidLow: .16, browSad: .2, eyeSad: .05 },
  concern:  { browSad: .42, eyeSad: .12, browUp: .06 },
  surprise: { browUp: .62, wide: .32 },   // 2026-10-14：眉・見ひらきを強めても前髪に隠れて伝わらず（11 人 自然さ 86→82）、重みは据え置いた
};

// ---------------------------------------------------------------- 顔の形を足す（v3）
// VRoid の顔には「下まぶただけ上がる」「頬が上がる」形がない。笑うと頬が上がり下まぶたが押し上げられる（目の周りの筋・デュシェンヌの笑み）。
// 1) AoiLidLow：目を細める形（Fcl_EYE_Fun）のうち、目の中心より下の動きだけを取り出す（上まぶたは下ろさない＝目を閉じたように見えない）。
// 2) AoiCheek：目の下・外寄りの頬を、ごく小さく（最大 1.6 mm）上と前へふくらませる。法線は変えない（陰の付き方を変えない＝不気味にしない）。
// v5.2（2026-10-14）：腕を下ろした休めの形（AoiMotion の手続きの休めの形と同じ値）。読み込んだ直後の VRM はひな形の姿勢＝両腕を真横に広げた T ポーズで、
// 遅い回線・遅い端末では動きの部品が届くまで数秒そのまま見える（テストプレー 10-14 夜「壊れた人形」「不気味」）。シーンに置く前に、これを一度呼ぶ。
export function relaxPose(vrm) {
  const N = n => vrm.humanoid.getNormalizedBoneNode(n);
  for (const sd of ["left", "right"]) { const sg = sd === "left" ? 1 : -1;
    N(sd + "UpperArm")?.rotation.set(-.06, sg * .06, sg * -1.3); N(sd + "LowerArm")?.rotation.set(0, sg * -.3, 0); N(sd + "Hand")?.rotation.set(.04, sg * .05, sg * .1); }
  vrm.humanoid.update(); vrm.scene.updateMatrixWorld(true);
}
export function addFaceMorphs(vrm) {
  const ms = []; vrm.scene.traverse(o => { if (o.isMesh && o.morphTargetDictionary?.Fcl_EYE_Fun != null && o.morphTargetDictionary.AoiLidLow == null) ms.push(o); });
  if (!ms.length) return false;
  const iris = ms.find(m => [].concat(m.material).some(mt => /iris/i.test(mt.name)));
  const ctr = { L: new THREE.Vector3(), R: new THREE.Vector3() }, n = { L: 0, R: 0 }; let yLo = 1e9, yHi = -1e9;
  if (iris) { const P = iris.geometry.attributes.position; for (let i = 0; i < P.count; i++) { const k = P.getX(i) >= 0 ? "L" : "R"; ctr[k].x += P.getX(i); ctr[k].y += P.getY(i); ctr[k].z += P.getZ(i); n[k]++; yLo = Math.min(yLo, P.getY(i)); yHi = Math.max(yHi, P.getY(i)); } }
  if (!n.L || !n.R) return false;
  ctr.L.divideScalar(n.L); ctr.R.divideScalar(n.R); const eh = Math.max(.008, yHi - yLo);   // 目の高さ（黒目の高さ）
  const sst = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  for (const m of ms) {
    const G = m.geometry, P = G.attributes.position, MA = G.morphAttributes.position, fi = m.morphTargetDictionary.Fcl_EYE_Fun, D = MA[fi];
    const nameKeep = { ...m.morphTargetDictionary };   // 足す前の名前の表
    const lid = new Float32Array(P.count * 3), ck = new Float32Array(P.count * 3), skin = [].concat(m.material).some(mt => /face.*skin|skin.*face/i.test(mt.name));
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i), c = x >= 0 ? ctr.L : ctr.R;
      const w = sst(c.y + .12 * eh, c.y - .18 * eh, y);   // 中心より下＝1、上＝0（あいだはなめらかに）
      if (w > 0) for (let a = 0; a < 3; a++) lid[i * 3 + a] = D.getComponent(i, a) * w;
      if (skin) {   // 頬の山：目の中心の少し外・黒目の高さ 1.6 個ぶん下
        const dx = (Math.abs(x) - Math.abs(c.x) * 1.08) / (eh * 1.05), dy = (y - (c.y - eh * 1.6)) / (eh * .95), g = Math.exp(-(dx * dx + dy * dy)) * sst(c.z - eh * 2.5, c.z - eh * .8, z);
        if (g > .01) { ck[i * 3 + 1] = .09 * eh * g; ck[i * 3 + 2] = .05 * eh * g; }
      }
    }
    const a1 = new THREE.Float32BufferAttribute(lid, 3), a2 = new THREE.Float32BufferAttribute(ck, 3); a1.name = "AoiLidLow"; a2.name = "AoiCheek";
    MA.push(a1, a2);
    if (G.morphAttributes.normal) { const N = G.morphAttributes.normal, nf = G.morphAttributes.normal[fi]; const ln = new Float32Array(P.count * 3); for (let i = 0; i < P.count; i++) { const c = P.getX(i) >= 0 ? ctr.L : ctr.R, w = sst(c.y + .12 * eh, c.y - .18 * eh, P.getY(i)); if (w > 0) for (let a = 0; a < 3; a++) ln[i * 3 + a] = nf.getComponent(i, a) * w; } N.push(new THREE.Float32BufferAttribute(ln, 3), new THREE.Float32BufferAttribute(new Float32Array(P.count * 3), 3)); }
    // v4：笑み（口）・眉を左右に分けた形（AoiSmileL/R・AoiBrowUpL/R・AoiBrowJoyL/R）。人の顔は左右で少し違う（左右対称すぎると不気味に見える）。
    // 真ん中の 6 mm でなめらかにつなぐ。L＋R＝もとの形（両方 1 なら左右対称のまま）
    for (const [src, dst] of [["Fcl_MTH_Fun", "AoiSmile"], ["Fcl_BRW_Surprised", "AoiBrowUp"], ["Fcl_BRW_Fun", "AoiBrowJoy"]]) {
      const si = m.morphTargetDictionary[src]; if (si == null) continue; const S0 = MA[si], SN = G.morphAttributes.normal?.[si];
      for (const side of [1, -1]) { const pa = new Float32Array(P.count * 3), na = SN ? new Float32Array(P.count * 3) : null;
        for (let i = 0; i < P.count; i++) { const w = sst(-.003, .003, side * P.getX(i)); if (w <= 0) continue; for (let a = 0; a < 3; a++) { pa[i * 3 + a] = S0.getComponent(i, a) * w; if (na) na[i * 3 + a] = SN.getComponent(i, a) * w; } }
        const at = new THREE.Float32BufferAttribute(pa, 3); at.name = dst + (side > 0 ? "L" : "R"); MA.push(at); if (G.morphAttributes.normal) G.morphAttributes.normal.push(new THREE.Float32BufferAttribute(na || new Float32Array(P.count * 3), 3)); } }
    if (skin) G.userData.aoiCheekG = (() => { const g = new Float32Array(P.count); for (let i = 0; i < P.count; i++) g[i] = Math.hypot(ck[i * 3 + 1], ck[i * 3 + 2]) / (.103 * eh); return g; })();   // 頬の色（下の addCheekTint）に使う重み 0..1
    // 2026-10-14：名前の表を作りなおす前に、もとの形（Fcl_*）にも名前を付ける。three の updateMorphTargets() は形の名前（attribute.name）から表を作りなおすので、
    // 名前のない形は番号（"0"〜"56"）になり、Fcl_* を名前で引く表情（目を細める・眉・目を見ひらく・分けた形が無いときの笑み）が効かなくなっていた。
    // 番号は変えない（VRM の表情＝aa・blink・happy などは番号で引くのでそのまま。足した形は後ろに付くだけ）
    nameMorphs(G, nameKeep);
    const keep = m.morphTargetInfluences ? [...m.morphTargetInfluences] : []; m.updateMorphTargets(); keep.forEach((v, i) => m.morphTargetInfluences[i] = v);
  }
  return true;
}
// 形（morphAttributes）に、表の名前を付ける（名前のない形だけ）。同じ網を使うほかの面の表も、名前で引けるよう戻す
function nameMorphs(G, dict) {
  for (const k of ["position", "normal", "color"]) { const A = G.morphAttributes[k]; if (!A) continue; for (const [name, i] of Object.entries(dict)) if (A[i] && (!A[i].name || /^\d+$/.test(A[i].name))) A[i].name = name; }
}

// ---------------------------------------------------------------- 目の光（v4）
// 人の目の光（角膜に映る光）は、目が動いても黒目ほどは動かない（角膜のふくらみに映るため）。VRoid では光が黒目に貼りついて一緒に動き、
// 目を動かすたびに光も同じだけ動く＝絵に見える・目が乾いて見える。光の頂点の重みを「目の骨 55%・頭 45%」に分け、黒目の半分ほどしか動かないようにする。
export function softenEyeHighlight(vrm) {
  const H = vrm.humanoid, head = H?.getRawBoneNode("head"), eyes = new Set(["leftEye", "rightEye"].map(n => H?.getRawBoneNode(n)).filter(Boolean)); if (!head || !eyes.size) return 0; let n = 0;
  vrm.scene.traverse(o => { if (!o.isSkinnedMesh || o.userData.aoiHL || ![].concat(o.material).some(m => /highlight/i.test(m.name))) return;
    const sk = o.skeleton, hi = sk.bones.indexOf(head), ei = new Set(sk.bones.map((b, i) => eyes.has(b) ? i : -1).filter(i => i >= 0)); if (hi < 0 || !ei.size) return;
    const SI = o.geometry.attributes.skinIndex, SW = o.geometry.attributes.skinWeight;
    for (let i = 0; i < SI.count; i++) { let e = -1; for (let k = 0; k < 4; k++) if (SW.getComponent(i, k) > .99 && ei.has(SI.getComponent(i, k))) e = SI.getComponent(i, k); if (e < 0) continue;
      SI.setXYZW(i, e, hi, 0, 0); SW.setXYZW(i, .55, .45, 0, 0); n++; }
    SI.needsUpdate = SW.needsUpdate = true; o.userData.aoiHL = true; });
  return n;
}

// ---------------------------------------------------------------- 髪の陰（v5.4）
// 11 人「後ろ髪の縞が板の束に見える」：VRoid の髪は細長い板（房）を重ねた形で、板ごとに面の向き（法線）がばらばら。アニメ調の陰（MToon）は
// 明暗の境がくっきりしているので、板ごとに明るい・暗いが入れかわり、さらに板の縁に濃い輪郭線が付いて、縦の縞の「板の束」に見えていた。
// ①髪の法線を、頭の丸み（頭の中心から外向き）へ 7.5 割寄せる（髪のかたまり全体が一つの丸い量として陰る＝アニメの髪の陰の付け方でよく使う手）
// ②髪の輪郭線を細く・髪の陰の色に近く ③明暗の境を少しやわらかく。.vrm はさわらない（読み込んだあとで直す）
export function softenHair(vrm, { k = .75 } = {}) {
  const H = vrm?.humanoid, head = H?.getRawBoneNode("head"); if (!head) return 0; let n = 0;
  vrm.scene.traverse(o => {
    if (!o.isSkinnedMesh || o.userData.aoiHair) return; const ms = [].concat(o.material); if (!ms.some(m => /hair/i.test(m.name) && !m.isOutline)) return;
    o.userData.aoiHair = true;
    for (const m of ms) { if (!/hair/i.test(m.name)) continue;
      if (m.outlineWidthFactor != null) m.outlineWidthFactor *= .55;
      if (m.outlineColorFactor && m.shadeColorFactor) m.outlineColorFactor.lerp(m.shadeColorFactor.clone().multiplyScalar(.55), .55);
      if (!m.isOutline && m.shadingToonyFactor != null) m.shadingToonyFactor = Math.min(m.shadingToonyFactor, .62);
      m.needsUpdate = true; }
    const sk = o.skeleton, hi = sk.bones.indexOf(head), G = o.geometry, P = G.attributes.position, Nm = G.attributes.normal; if (hi < 0 || !Nm || G.userData.aoiHairN) return;
    G.userData.aoiHairN = true;
    // 頭の中心（形の座標）：頭の骨の静止の位置から上へ 7 cm・後ろへ 1.5 cm（頭の骨は首の付け根の上にある）
    const c = new THREE.Vector3().applyMatrix4(new THREE.Matrix4().copy(sk.boneInverses[hi]).invert()); c.y += .07; c.z -= .015; c.applyMatrix4(o.bindMatrixInverse);
    const v = new THREE.Vector3(), nr = new THREE.Vector3(), r = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); nr.fromBufferAttribute(Nm, i);
      r.set(v.x - c.x, (v.y - c.y) * .55, v.z - c.z); if (r.lengthSq() < 1e-10) continue; r.normalize(); if (nr.dot(r) < 0) r.negate();   // 内向きの板（裏が見える板）は向きを保つ
      nr.multiplyScalar(1 - k).addScaledVector(r, k).normalize(); Nm.setXYZ(i, nr.x, nr.y, nr.z); n++; }
    Nm.needsUpdate = true;
  });
  return n;
}

// v5.5（11 人「後ろ髪の色の縞」）：髪の絵は色の帯（青緑・緑・赤茶・青）を横に並べた一枚で、房ごとに違う帯を拾うため、後ろから見ると色の縞になっていた。
// 読み込んだあと、絵の写しの行ごとに色みを k だけその行の平均へそろえる（明るさと細い毛の筋はそのまま）。透けのある絵（後ろ髪の形の抜き）はさわらない。.vrm はさわらない
export function evenHairSheet(vrm, { k = .6 } = {}) {
  let n = 0; const done = new Set();
  vrm.scene.traverse(o => { if (!o.isMesh) return; for (const m of [].concat(o.material)) { const t = m?.map; if (!t || done.has(t) || t.userData.aoiEven || !/hair/i.test(m.name || "")) continue; done.add(t);
    const im = t.image; if (!im || !(im.width > 8) || typeof document === "undefined") continue;
    try { const cv = document.createElement("canvas"); cv.width = im.width; cv.height = im.height; const cx = cv.getContext("2d", { willReadFrequently: true }); cx.drawImage(im, 0, 0);
      const D = cx.getImageData(0, 0, cv.width, cv.height), d = D.data, W = cv.width, H = cv.height;
      let trans = 0; for (let i = 3; i < d.length; i += 4 * 97) if (d[i] < 250) { trans++; if (trans > 20) break; } if (trans > 20) continue;   // 抜きのある絵はさわらない
      for (let y = 0; y < H; y++) { let r = 0, g = 0, b = 0; const o0 = y * W * 4; for (let x = 0; x < W; x++) { const i = o0 + x * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; } r /= W; g /= W; b /= W;
        const lm = .2126 * r + .7152 * g + .0722 * b || 1;
        for (let x = 0; x < W; x++) { const i = o0 + x * 4, l = .2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2], s = l / lm;
          d[i] += (Math.min(255, r * s) - d[i]) * k; d[i + 1] += (Math.min(255, g * s) - d[i + 1]) * k; d[i + 2] += (Math.min(255, b * s) - d[i + 2]) * k; } }
      cx.putImageData(D, 0, 0); t.image = cv; t.userData.aoiEven = true; t.needsUpdate = true; n++; } catch (e) { console.warn("evenHairSheet", e); } } });
  return n;
}

// v5.4（胡蝶の夢・研究室・博物館の 11 人「肌が白く平たい」「髪のふちが網点に見える」）：
// ②髪・まつげの抜き（アルファの切り抜き）のふちが、ぎざぎざの網点に見える → 描く面の端を、画素の中の覆い（alphaToCoverage）でなめらかに（アンチエイリアスのある描き方のときだけ効く）
export function softenSkin(vrm) {
  let n = 0;
  vrm.scene.traverse(o => { if (!o.isMesh) return; for (const m of [].concat(o.material)) { if (!m || m.userData.aoiSkin) continue; m.userData.aoiSkin = true;
    // 肌の陰を深める案は、11 人の第 2 回で「顔が灰色に沈む・目のまわりが暗い」（研究室・博物館の暖かい光）となり、採らなかった
    // v5.5：深めるのではなく、陰の色を温かく浅く（.vrm はほぼ白 #faf4f2 で、陰が出ず白く平たい）・明暗の境をやわらかく・光の当たらない縁にごく薄い血色（肌の透け）
    // v5.5（11 人「白い服が自分で光っているようで場になじまない」）：服（CLOTH）の自分の光を 6 割に
    if (/CLOTH/i.test(m.name) && m.emissive && !m.userData.aoiEm) { m.userData.aoiEm = true; m.emissive.multiplyScalar(.6); n++; }
    if (/CLOTH/i.test(m.name) && !m.isOutline) { if (m.shadingToonyFactor != null) m.shadingToonyFactor = Math.min(m.shadingToonyFactor, .38); if (m.giEqualizationFactor != null) m.giEqualizationFactor = Math.min(m.giEqualizationFactor, .45); m.needsUpdate = true; }
    if (/HAIR/i.test(m.name) && m.emissive && !m.userData.aoiEm) { m.userData.aoiEm = true; m.emissive.multiplyScalar(.7); n++; }   // v5.6：髪の自分の光を 7 割（博物館で髪の水色だけ光って見えた）
    if (/SKIN/i.test(m.name) && !m.isOutline && m.shadeColorFactor) { m.shadeColorFactor.setRGB(.96, .8, .76, THREE.SRGBColorSpace); if (m.shadingToonyFactor != null) m.shadingToonyFactor = Math.min(m.shadingToonyFactor, .32); if (m.giEqualizationFactor != null) m.giEqualizationFactor = Math.min(m.giEqualizationFactor, .42);   /* v5.6：なだらかに温かく・環境の光の向きを残す */
      if (m.parametricRimColorFactor) { m.parametricRimColorFactor.setRGB(.13, .07, .05, THREE.SRGBColorSpace); m.parametricRimFresnelPowerFactor = 3.6; if (m.parametricRimLiftFactor != null) m.parametricRimLiftFactor = 0; } m.needsUpdate = true; n++; }
    // v5.5：髪の alphaToCoverage はやめた（three の版によっては MToon のシェーダーで 'diffuseColor' : undeclared identifier になり、髪の材質が組み立てられなかった＝HP の公開版で見つかった）
    } });
  return n;
}

// ---------------------------------------------------------------- 頬の色（v4）
// アニメ調の陰（MToon）では、頬の形を少しふくらませても陰が変わらず、笑みが頬に出ない（第 7 回の指摘）。
// そこで、頬のところだけ、肌の色にごく薄い暖色を「掛け合わせる」薄い面を重ねる（同じ骨・同じ顔の形で動く。光の強さに左右されない＝夜に光らない）。
// 頬紅のように描くのではなく、笑ったときに頬の血色が少し上がる程度（最大で肌の明るさが 5% ほど下がり、少し赤みが寄る）。.vrm はさわらない。
export function addCheekTint(vrm) {
  let face = null; vrm.scene.traverse(o => { if (!face && o.isSkinnedMesh && o.geometry.userData.aoiCheekG) face = o; });
  if (!face) return null;
  const G = face.geometry, g = G.userData.aoiCheekG, idx = G.index, mats = [].concat(face.material);
  const grp = G.groups.length ? G.groups.filter(gr => !/outline/i.test(mats[gr.materialIndex]?.name || "")) : [{ start: 0, count: idx ? idx.count : G.attributes.position.count }];
  const tri = []; for (const gr of grp) for (let i = gr.start; i < gr.start + gr.count; i += 3) { const a = idx ? idx.getX(i) : i, b = idx ? idx.getX(i + 1) : i + 1, c = idx ? idx.getX(i + 2) : i + 2; if (g[a] > .03 || g[b] > .03 || g[c] > .03) tri.push(a, b, c); }
  if (!tri.length) return null;
  const G2 = new THREE.BufferGeometry(); for (const k of ["position", "normal", "uv", "skinIndex", "skinWeight"]) if (G.attributes[k]) G2.setAttribute(k, G.attributes[k]);
  G2.setAttribute("aG", new THREE.Float32BufferAttribute(g, 1)); G2.setIndex(tri); G2.morphAttributes = G.morphAttributes; G2.morphTargetsRelative = G.morphTargetsRelative;
  G2.boundingSphere = G.boundingSphere?.clone() || null;
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, .78, .74), transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, fog: false, toneMapped: false });
  mat.name = "AoiCheekTint"; const uAmt = { value: 0 };   // 濃さは自前の値で持つ（アプリの「現れ方」が材質の opacity を書きかえても影響されない）
  mat.onBeforeCompile = sh => { sh.uniforms.uAmt = uAmt; sh.vertexShader = "attribute float aG;\nvarying float vG;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n vG = aG;");
    sh.fragmentShader = "varying float vG;\nuniform float uAmt;\n" + sh.fragmentShader.replace("#include <dithering_fragment>", "#include <dithering_fragment>\n gl_FragColor = vec4(mix(vec3(1.0), diffuse, clamp(vG, 0.0, 1.0) * uAmt), 1.0);"); };
  const m = new THREE.SkinnedMesh(G2, mat); m.name = "AoiCheekTint"; m.userData.aoiOverlay = true; m.frustumCulled = false; m.renderOrder = (face.renderOrder || 0) + 1; m.castShadow = m.receiveShadow = false;
  m.morphTargetInfluences = face.morphTargetInfluences; m.morphTargetDictionary = face.morphTargetDictionary;   // 顔と同じ配列（顔が動けば頬の面も動く）
  face.parent.add(m); m.position.copy(face.position); m.quaternion.copy(face.quaternion); m.scale.copy(face.scale); m.bind(face.skeleton, face.bindMatrix);
  return { mesh: m, mat, face, set(v) { uAmt.value = clamp(v, 0, 1); mat.opacity = 1; m.visible = v > .004; if (m.material !== mat) m.material = mat; m.morphTargetInfluences = face.morphTargetInfluences; } };   // アプリが材質を差しかえても戻す
}

// ---------------------------------------------------------------- 本体
// 記録（モーションキャプチャ）を、どの骨にどれだけ使うか。首と頭は視線が主なので少し、手首は話す身ぶりと合わせて半分ほど
const MOCAP_W = { hips: .85, spine: .85, chest: .85, upperChest: .85, neck: .22, head: .15, leftShoulder: .7, rightShoulder: .7, leftUpperArm: .9, rightUpperArm: .9, leftLowerArm: .85, rightLowerArm: .85, leftHand: .22, rightHand: .22 };   // v6.1（氷川の写し 10-22 から）：記録の手首は少しだけ（手首が内に折れたまま止まって見えた）
// v4：立ち姿の記録ごとの効き（腕・胴）。140 の二本は手を体の前に出しがちなので、腕は休めの形へ半分ほど寄せ、胴の前かがみも少し控える
const IDLE_K = { "140_06": { arm: .4, torso: .38 }, "140_07": { arm: .45, torso: .4 } };   // v6.1：この二本は胴が前へ約 12°傾く（肩が腰より 10 cm 前＝前かがみで待つ・手が体の前に来る）→ 胴の記録を控える
const TALK_BONES = ["spine", "chest", "upperChest", "neck", "leftShoulder", "rightShoulder"];
let _mocapShared = null;   // 同じページで何人分読んでも、記録は一度だけ読む
export class AoiMotion {
  constructor(vrm, { root = null, seed = 0, reducedMotion = false, wind = .6, faceViewer = true, startCalm = 2.2, mocap = "auto", robe = true, groundAt = null, posture = "natural", uprightWeight = .38, quality = "auto", hairSoft = true, faceLight = 0, hideLegs = true } = {}) {
    this.groundAt = groundAt;
    // 画質の段（v5）。auto＝端末の手がかり（芯の数・メモリ）で始め、こまの速さで上げ下げする
    { const nav = typeof navigator !== "undefined" ? navigator : {}, weak = (nav.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory || 8) <= 2;
      this.q = { auto: !["high", "mid", "low"].includes(quality), tier: ["high", "mid", "low"].includes(quality) ? quality : weak ? "mid" : "high", ema: 1 / 60, slow: 0, fast: 0, n: 0, accR: 0, accS: 0 }; }
    // 姿勢の型（v3.1・2026-10-13 本人「HPの碧はまっすぐ立っていてください。姿勢は良くしていながら、自然な仕草にしてください。」「碧左右に揺れすぎです。もう少し揺れを抑えて」）
    //  natural（既定）＝これまでの立ち姿・歩き。ただし左右の揺れ（重心の移し・骨盤の傾き・体の横揺れ・記録の胴の横の傾き・息の肩の傾き）は v3 の半分以下に抑えた。
    //  upright（"formal" も同じ）＝まっすぐ立つ。骨盤は水平・背は立てる・肩は少し引いて水平・手は脇に力を抜いて。重心の移し・揺れ・記録の胴の動きをさらに小さくし、
    //  息・まばたき・小さな視線の動き・小さく首をかしげる、だけを残す（HP の顔の碧）。
    this.posture = posture === "upright" || posture === "formal" ? "upright" : "natural";
    this.uprightW = clamp(+uprightWeight, 0, 1);   // v5.9：upright の片足荷重（既定 .38＝Codex 10-17）
    this.pz = this.posture === "upright"
      ? { ws: .3, sway: .4, lat: .2, mT: .15, mN: .1, mA: .35, mH: .15, tilt: .45, gest: .6, away: .45, chestUp: .02, shBack: .035 }
      : { ws: 1, sway: 1, lat: .25, mT: 1, mN: 1, mA: 1, mH: 1, tilt: 1, gest: 1, away: 1, chestUp: 0, shBack: 0 };   // (x, z) => 地面の高さ（世界）。坂・段のある場所で、足をその高さに着ける（なければ root の高さ＝平ら）
    this.vrm = vrm; this.root = root || vrm.scene; this.rand = seed ? rng(seed) : Math.random;
    this.live = !reducedMotion; this.wind = wind; this.faceViewer = faceViewer; this.t = 0; this.calm = startCalm;
    const H = vrm.humanoid; this.N = n => H.getNormalizedBoneNode(n);
    this.bones = {}; for (const n of ["hips", "spine", "chest", "upperChest", "neck", "head", "leftShoulder", "rightShoulder", "leftUpperArm", "rightUpperArm", "leftLowerArm", "rightLowerArm", "leftHand", "rightHand", "leftUpperLeg", "rightUpperLeg", "leftLowerLeg", "rightLowerLeg", "leftFoot", "rightFoot", "leftToes", "rightToes"]) this.bones[n] = this.N(n);
    this.fingers = []; for (const s of ["left", "right"]) for (const f of ["Index", "Middle", "Ring", "Little", "Thumb"]) for (const j of ["Metacarpal", "Proximal", "Intermediate", "Distal"]) { const b = this.N(s + f + j); if (b) this.fingers.push([b, s, f, j]); }
    // 静止の形を測る（足首の高さ・腰の高さ・脚の長さ・足の長さ）
    H.resetNormalizedPose(); this.root.updateMatrixWorld(true);
    const B = this.bones, wp = (o, v) => o.getWorldPosition(v), rootInv = _m.copy(this.root.matrixWorld).invert();
    const loc = o => wp(o, new THREE.Vector3()).applyMatrix4(rootInv);
    this.rest = { hips: loc(B.hips), L: { up: loc(B.leftUpperLeg), foot: loc(B.leftFoot), toe: B.leftToes ? loc(B.leftToes) : null }, R: { up: loc(B.rightUpperLeg), foot: loc(B.rightFoot), toe: B.rightToes ? loc(B.rightToes) : null } };
    this.rest.hip0 = B.hips.position.clone();
    this.ankleH = (this.rest.L.foot.y + this.rest.R.foot.y) / 2; this.halfW = Math.abs(this.rest.L.foot.x - this.rest.R.foot.x) / 2;
    this.legLen = this.rest.hips.y - this.ankleH; this.footLen = this.rest.L.toe ? Math.max(.06, this.rest.L.toe.z - this.rest.L.foot.z) : .12;
    this.toeDy = this.rest.L.toe ? Math.max(0, this.rest.L.foot.y - this.rest.L.toe.y) : .05;
    // v5：腕の静止の形（身ぶりの IK のため）。肩の位置・手の指の向きと手のひらの向き（碧の入れ物から見た向き）・肘の曲がる向き
    { const rq = this.root.getWorldQuaternion(new THREE.Quaternion()), rqi = rq.clone().invert(); this.armRest = {};
      for (const s of ["left", "right"]) { const ua = B[s + "UpperArm"], la = B[s + "LowerArm"], hd = B[s + "Hand"]; if (!ua || !la || !hd) continue;
        const w = loc(hd), mid = this.N(s + "MiddleProximal"), th = this.N(s + "ThumbProximal") || this.N(s + "ThumbMetacarpal");
        const f = (mid ? loc(mid).sub(w) : w.clone().sub(loc(la))).normalize();
        const t = th ? loc(th).sub(w) : new THREE.Vector3(0, 0, 1); t.addScaledVector(f, -t.dot(f)).normalize();
        const n = new THREE.Vector3().crossVectors(f, t); if (n.y > 0) n.negate();   // T の字では手のひらは下
        const RL = rqi.clone().multiply(hd.getWorldQuaternion(new THREE.Quaternion()));
        const fold = new THREE.Vector3(0, 0, 1).applyQuaternion(rq).applyQuaternion(ua.getWorldQuaternion(new THREE.Quaternion()).invert());   // 体の前＝肘を曲げて前腕が向かう向き（上腕の中の向き）
        this.armRest[s] = { sh: loc(ua), f, n, b: new THREE.Vector3().crossVectors(f, n), RL, fold }; } }   // v4：足首とつま先の付け根の高さの差（かかとを上げるとき、つま先の付け根を軸にするため）
    this.scale = new THREE.Vector3(); this.root.getWorldScale(this.scale); this.sc = this.scale.x || 1; this.vs = vrm.scene.getWorldScale(new THREE.Vector3()).x || 1; this.hk = this.sc / this.vs;
    // 状態
    const r0 = this.root;
    this.pos = new THREE.Vector3(r0.position.x, r0.position.y, r0.position.z); this.vel = new THREE.Vector3(); this.goal = null; this.driven = false; this._last = this.pos.clone();
    this.yaw = r0.rotation.y; this.faceYaw = null; this.speed = 0; this.k = 0;
    this.feet = { L: this._foot(1), R: this._foot(-1) }; this.lastStep = "R"; this._placeFeet();
    this.s = { br: 0, brP: 4.2, brU: 0, ws: new Spr(0, 1.6), wsHold: 3 + 4 * this.rand(), wsLvl: 0, lean: new Spr(0, 3), talk: new Spr(0, 3.2), listen: new Spr(0, 2.5), gest: new Spr(0, 5), point: new Spr(0, 4.5), bow: new Spr(0, 3), tilt: new Spr(0, 2), nod: new Spr(0, 9), armL: new Spr(0, 3.2), armR: new Spr(0, 3.2), armLz: new Spr(0, 3.2), armRz: new Spr(0, 3.2), beat: 0, beatSide: 1, hipY: new Spr(0, 7), turnLead: new Spr(0, 5) };
    this.seedPh = this.rand() * 100;
    // 目・頭
    this.gazeObj = new THREE.Object3D(); if (vrm.lookAt) vrm.lookAt.target = this.gazeObj;   // 親を持たない（位置＝世界の座標。場面の固定化の影響を受けない）
    this.look = { target: null, cur: new THREE.Vector3(0, 1.5, 3), sac: new THREE.Vector3(), sacT: .5, away: 0, awayDir: new THREE.Vector3(), awayT: 4 + 4 * this.rand(), hy: new Spr(0, 7), hp: new Spr(0, 7), last: new THREE.Vector3() };
    this.blink = { next: 1.5 + this.rand() * 2, t: -1, amp: 1, dbl: 0, v: 0 };
    // 表情
    this.face = { emo: "calm", emoW: new Spr(1, 3), hold: 0, ch: {}, mouth: Object.fromEntries(MOUTH.map(k => [k, new Spr(0, 26)])), spk: null, flash: 0 };
    try { addFaceMorphs(vrm); } catch (e) { console.warn("addFaceMorphs", e); }
    try { softenEyeHighlight(vrm); } catch (e) { console.warn("softenEyeHighlight", e); }
    if (hairSoft) try { softenHair(vrm); softenSkin(vrm); evenHairSheet(vrm); } catch (e) { console.warn("softenHair", e); }   // v5.4：後ろ髪の縞（板の束）・肌の陰・髪のふち
    this._initFace();
    // 揺れもの
    this.springs = (vrm.springBoneManager?.joints ? [...vrm.springBoneManager.joints] : []).map(j => ({ j, g: j.settings.gravityDir.clone(), p: j.settings.gravityPower }));
    // v3：体がいつも少し動く（人の記録）ので、髪が揺れ続けて顔にかからないよう、髪の戻る力と空気の抵抗を少し強める（.vrm はさわらない）
    // v5.3：同じ碧にもう一度 AoiMotion を作っても、強めるのは一度だけ（重ねて 1.5 倍・2.25 倍…にならない）
    for (const s of this.springs) if (/hair/i.test(s.j.bone?.name || "") && !s.j.__aoiStiff) { s.j.__aoiStiff = 1; s.j.settings.stiffness *= 1.5; s.j.settings.dragForce = Math.max(s.j.settings.dragForce, .6); }
    // v5.3（2026-10-14 本人「碧の歩き方や髪型がおかしい」）：髪・裾の「休みの形」（.vrm に作られた形）を覚えておく。
    // 前は、現れるあいだ（calm）に毎こま setInitState() を呼んでいたので、そのこまの揺れた形（重さ・体の動きで遅れた形）が「休みの形」として焼きこまれ、
    // 2.2 秒のあいだに房ごとに 6〜31° ずれて、髪型そのものが変わっていた（台で測った）。いまは休みの形へ戻す（reset）だけにし、焼きこまれた形も、ここで覚えた形へ戻す。
    this._sprInit = this.springs.map(({ j }) => j.__aoiInit ||= { m: j._initialLocalMatrix?.clone(), q: j._initialLocalRotation?.clone(), c: j._initialLocalChildPosition?.clone(), a: j._boneAxis?.clone() });
    this._sprReset = false; this._fid = 0; this._vuFid = -1; this.stat = { vuSkip: 0, sprReset: 0, jump: 0 };
    // v5.3：vrm.update を一こま一回に（同じこまで二度呼ばれたら二度めは揺れものを進めない）・dt の上限・揺れものは 1/60 秒より細かく刻む（こまの遅い端末で房が跳ねない）
    try { this._wrapVrmUpdate(); } catch (e) { console.warn("wrapVrmUpdate", e); }
    this.pointing = null; this.bowing = null; this.listening = false; this.speaking = null;
    // ローブの裾（v3）
    this.robe = null; if (robe) { try { const r = new AoiRobe(vrm, { wind: wind * .7 }); if (r.ok) this.robe = r; } catch (e) { console.warn("AoiRobe", e); } }
    this._robeReset = true;
    // v5.5：足首まであるローブの下の脚の肌を畳む（前は氷川道中だけ。博物館など歩くアプリで、後ろから見ると速い一歩で肌色の脚が裾を突き抜けて見えた＝動きの台で 16 こまに 2 こま）。足首と靴は残す
    if (this.robe && hideLegs) try { hideCoveredLegs(vrm, { keep: .12 }); } catch (e) { console.warn("hideCoveredLegs", e); }
    // v5.5（11 人「研究室・博物館で顔が暗く沈む」）：顔へのやわらかい補助光（任意。faceLight＝顔の位置での明るさ。平行光の強さと同じ目安。0 で無し）。
    // 顔の前 55 cm・少し上・少し横に小さな点の光を置き、碧と一緒に動く（遠くへは届かない＝部屋の明るさは変えない）。碧が見えないときは消える（root の子）
    this.faceLight = null; if (faceLight > 0) { const hd = this.N("head"); this.root.updateMatrixWorld(true); const hp = hd ? this.root.worldToLocal(hd.getWorldPosition(new THREE.Vector3())) : new THREE.Vector3(0, 1.45, 0);
      const L = this.faceLight = new THREE.PointLight(0xfff0e4, faceLight * .3, 2.4, 2); L.name = "AoiFaceLight"; L.castShadow = false; L.position.set(hp.x + .12, hp.y + .1, hp.z + .55); this.root.add(L); }
    try { this._fadeGuard(); } catch (e) { console.warn("fadeGuard", e); }   // v5：現れ方の網目（アプリが材質を薄くする前に、もとの半透明かどうかを覚える）
    // 人が動いた記録（v3）
    this.mc = null; this.mcW = new Spr(0, 1.2); this._mq = {}; this._mp = new THREE.Vector3(); this._mt = {}; this._phi = 0;
    this.mi = { cur: "idle_a", t: 0, prev: null, pt: 0, x: 1 };
    const use = lib => { if (lib?.clips) { this.mc = lib; const ids = Object.keys(lib.clips).filter(k => lib.clips[k].type === "idle"); this.mi.cur = ids[Math.floor(this.rand() * ids.length)] || ids[0]; this.mi.t = this.rand() * (lib.clips[this.mi.cur]?.sec || 1); } };
    this.mcReady = Promise.resolve(null);   // 記録を読み終えたら解ける（確かめの台で待つため）
    if (mocap && typeof mocap === "object") use(mocap.clips && mocap.bones && mocap.idx ? mocap : decodeMocap(mocap));
    else if (mocap) { const url = mocap === "auto" ? new URL("./aoi_mocap.json", import.meta.url).href : mocap;
      (_mocapShared ||= {})[url] ||= loadMocap(url).catch(e => { console.warn("aoi_mocap", e.message || e); return null; });
      this.mcReady = _mocapShared[url].then(lib => { use(lib); return lib; }); }
    // v5.2（2026-10-14）：作ったその時点で、腕を下ろした休めの形にしておく。最初の update の前に一こま描かれても、両腕を真横に広げた形（T ポーズ）を見せない。
    // 記録（aoi_mocap.json）は届いてから mcW で 1 秒あまりかけて混ざる（届くまでは手続きの休めの形で、腕は脇に下りている）
    try { relaxPose(vrm); } catch (e) { console.warn("relaxPose", e); }
  }
  _foot(side) { return { side, p: new THREE.Vector3(), yaw: 0, swing: null, heel: 0 }; }
  _home(f, out, lead = 0) {   // その足の置き場所（体の向き・左右の幅・少し外へ開いたつま先）
    let sx = f.side * this.halfW * this.sc * 1.05, fz = 0; const c = Math.cos(this.yaw), s = Math.sin(this.yaw);
    // v5.5：立っているとき、重心を置いていない足（遊脚）は少し前（または横へ戻す）・少し外へ（コントラポスト）。量は置きなおすたびに変える
    { const fr = Math.max(0, -(this._cpc || 0) * f.side) * (1 - this.k); if (fr > .01 && !lead) { fz = (this._cpFz ?? .05) * fr * this.sc; sx += f.side * .014 * fr * this.sc; } }
    const predict = this.driven && this._driveStopped ? 0 : lead;
    const x = this.pos.x + sx * c + fz * s + this.vel.x * predict, z = this.pos.z - sx * s + fz * c + this.vel.z * predict;
    out.set(x, (this.groundAt ? this.groundAt(x, z) : this.pos.y) + this.ankleH * this.sc, z);
    return out;
  }
  _placeFeet() { for (const f of Object.values(this.feet)) { this._home(f, f.p); f.yaw = this.yaw + f.side * .1; f.swing = null; } }
  _initFace() {
    const em = this.vrm.expressionManager; this.morph = []; if (!em) return;
    const meshes = []; this.vrm.scene.traverse(o => { if (o.isMesh && o.morphTargetDictionary && (o.morphTargetDictionary.Fcl_MTH_A != null || o.morphTargetDictionary.Fcl_EYE_Fun != null)) meshes.push(o); });
    for (const [ch, list] of Object.entries(CH)) {
      const find = l => { const b = []; for (const [name, w, sd] of l) for (const m of meshes) { const i = m.morphTargetDictionary?.[name]; if (i != null) b.push([m, i, w, sd || 0]); } return b; };
      let binds = find(list); if (!binds.length && CH_FB[ch]) binds = find(CH_FB[ch]);
      this.face.ch[ch] = { v: new Spr(0, 6), binds };
    }
    // v4：左右の差（笑みは片側が少し強い人が多い。いつもの側＋そのたびの揺らぎ）・頬の色
    this.face.side = (this.rand() < .5 ? 1 : -1) * (.06 + .06 * this.rand()); this.face.asym = new Spr(this.face.side, 1.5); this.face.asymT = 2 + 4 * this.rand();
    try { this.tint = addCheekTint(this.vrm); } catch (e) { console.warn("addCheekTint", e); this.tint = null; }
  }

  // ---------------------------------------------------------------- 外から呼ぶ
  place(x, z, yaw = this.yaw) { this.pos.set(x, this.root.position.y, z); this.vel.set(0, 0, 0); this.goal = null; this.yaw = yaw; this.faceYaw = null; this._last.copy(this.pos); this._apply(); this._placeFeet(); this._robeReset = true; this._sprReset = true; this._turn = null; this.calm = Math.max(this.calm, .3); return this; }   // v5.3：置き直したら髪・裾のばねも休みの形へ（古い位置から引っぱられて房が跳ねない）
  // v5.3：とぶ（場面の切りかえ・ワープ）。place と同じだが、向きも即座に合わせ、揺れものを新しい位置の休みの形にする。calm 秒（既定 0.4）は揺れものを止めたまま
  teleport(x, z, yaw = this.yaw, { calm = .4 } = {}) { this.place(x, z, yaw); this.calm = Math.max(this.calm, calm); this.k = 0; this.speed = 0; return this; }
  // v5.3：髪・裾のばねを、いまの体の上で休みの形に戻す（アプリが碧を動かしたあと・見えなくしていたあとに呼べる）。焼きこまれた休みの形も、読み込んだときの形へ戻す
  resetSprings() { this._sprReset = true; return this; }
  _doSpringReset() {
    const sb = this.vrm.springBoneManager; if (!sb) return;
    this.root.updateMatrixWorld(true);
    this.springs.forEach(({ j }, i) => { const z = this._sprInit[i]; if (z?.q) { j._initialLocalMatrix.copy(z.m); j._initialLocalRotation.copy(z.q); j._initialLocalChildPosition.copy(z.c); j._boneAxis.copy(z.a); } });
    try { sb.reset(); } catch (e) { for (const { j } of this.springs) try { j.reset(); } catch {} }
    this.vrm.scene.updateMatrixWorld(true);
    if (this._sg) for (const s of this._sg) s.q.copy(s.j.bone.quaternion);   // 守りの「前のこま」も休みの形に（戻したことを跳ねと見ない）
  }
  // 揺れものを dt だけ進める（1/60 秒より細かく刻む・一度に進めるのは 0.05 秒まで）
  // still＝現れるあいだ（calm）：空気の抵抗を最大にして、揺れずに（勢いを持たずに）落ち着く形へ寄せる。休みの形を焼きこまず、終わったときに房が跳ねない
  _springStep(dt, still = false) {
    const sb = this.vrm.springBoneManager; if (!sb || !(dt > 0)) return;
    dt = Math.min(dt, .05); const n = Math.min(4, Math.max(1, Math.ceil(dt * 60 - 1e-6))), h = dt / n;
    if (still) for (const s of this.springs) { s.dr = s.j.settings.dragForce; s.j.settings.dragForce = 1; }
    for (let i = 0; i < n; i++) sb.update(h);
    if (still) for (const s of this.springs) s.j.settings.dragForce = s.dr;
    this.springGuard(dt);
  }
  // v5.3：髪・裾の守り。ばねを進めたあとに、房の骨ごとに ①休みの形からの開き（髪は付け根 35°・その先は一つごとに 25°・裾 35°）②一こまの回りの速さ（髪 毎秒 480°・裾 毎秒 360°）に上限を置き、
  // ばねの中の状態（房の先の位置）も同じ形にそろえる（見た目だけ直すと、次のこまで元へ跳ね返る）。歩きの着地で体が急に沈んだこま・押し出されたこまで、
  // 房が逆立つ・扇のように開くのを防ぐ（氷川道中の 11 人「髪が一瞬逆立つ」：毎こま 100° を超える跳ねを測った）。
  // アプリが自分で springBoneManager.update を呼ぶとき（氷川道中）は、そのあとで m.springGuard(dt) を呼ぶ。
  springGuard(dt = 1 / 60) {
    const g = this._sg ||= (() => { const bs = new Set(this.springs.map(({ j }) => j.bone)); return this.springs.map(({ j }) => ({ j, hair: /hair/i.test(j.bone?.name || ""), skirt: /skirt/i.test(j.bone?.name || ""), deep: bs.has(j.bone?.parent), q: j.bone.quaternion.clone() })); })();
    const f = Math.max(1, dt * 60), q0 = _q[4], tl = _v[7];
    // v5.4（11 人「後ろ髪が板の束に見える」）：となりあう房どうしの揺れをそろえる（ばねの段差）。房は頭の周りに並ぶので、根もとの向き（頭の周りの角度）で輪に並べ、
    // 同じ段の骨の「休みの形からのずれ」を、両どなりの平均へ 3 割寄せる（一本だけ遅れて・跳ねて、房のあいだに段や隙間ができない）
    const HC = this._hc ||= (() => { const hs = g.filter(s => s.hair && s.j._initialLocalRotation), byBone = new Map(hs.map(s => [s.j.bone, s])), head = this.vrm.humanoid.getRawBoneNode("head"); if (!head) return [];
      const roots = hs.filter(s => !byBone.has(s.j.bone.parent)), hp = head.getWorldPosition(new THREE.Vector3()), hq = head.getWorldQuaternion(new THREE.Quaternion()).invert();
      const ch = roots.map(s => { const list = [s]; let c = s; for (let k = 0; k < 8; k++) { const nx = hs.find(x => x.j.bone.parent === c.j.bone); if (!nx) break; list.push(nx); c = nx; }
        const p = s.j.bone.getWorldPosition(new THREE.Vector3()).sub(hp).applyQuaternion(hq); return { list, az: Math.atan2(p.x, p.z) }; }).sort((a, b) => a.az - b.az);
      ch.forEach((c, i) => { const l = ch[(i + ch.length - 1) % ch.length], r = ch[(i + 1) % ch.length], gap = x => Math.abs(wrapA(x.az - c.az)) < 1.1;
        c.nb = [l, r].filter(x => x !== c && gap(x)); });
      return ch; })();
    if (HC.length > 2) { const dv = this._hcd ||= new Map(), qa = _q[5], qb = _q[3], touched = this._hct ||= new Set(); touched.clear();
      for (const c of HC) for (const s of c.list) (dv.get(s) || dv.set(s, new THREE.Quaternion()).get(s)).copy(s.j._initialLocalRotation).invert().multiply(s.j.bone.quaternion);
      for (const c of HC) { if (!c.nb.length) continue; c.list.forEach((s, k) => { const ns = c.nb.map(x => x.list[k]).filter(Boolean); if (!ns.length) return;
        qa.copy(dv.get(ns[0])); if (ns[1]) qa.slerp(dv.get(ns[1]), .5); qb.copy(dv.get(s)).slerp(qa, .3);
        s.j.bone.quaternion.copy(s.j._initialLocalRotation).multiply(qb); touched.add(s); }); } }
    for (const s of g) {
      if (!s.hair && !s.skirt) continue;
      const j = s.j, b = j.bone, qi = j._initialLocalRotation; if (!b || !qi) continue;
      const LIM = (s.hair ? (s.deep ? 25 : 35) : 35) * Math.PI / 180, DL = (s.hair ? 8 : 6) * Math.PI / 180 * f;
      let changed = !!this._hct?.has(s);
      const ad = 2 * Math.acos(Math.min(1, Math.abs(s.q.dot(b.quaternion))));
      if (ad > DL) { q0.copy(s.q).slerp(b.quaternion, DL / ad); b.quaternion.copy(q0); changed = true; }
      const a = 2 * Math.acos(Math.min(1, Math.abs(qi.dot(b.quaternion))));
      if (a > LIM) { q0.copy(qi).slerp(b.quaternion, LIM / a); b.quaternion.copy(q0); changed = true; }
      if (changed) {
        b.updateMatrix(); if (b.parent) b.matrixWorld.multiplyMatrices(b.parent.matrixWorld, b.matrix); else b.matrixWorld.copy(b.matrix);
        for (const c of b.children) c.updateMatrixWorld(true);
        b.localToWorld(tl.copy(j._initialLocalChildPosition)); const w2c = j._getMatrixWorldToCenter?.(); if (w2c) tl.applyMatrix4(w2c);
        j._currentTail?.copy(tl); j._prevTail?.lerp(tl, .7);   // 速さもほぼ消す（跳ね返らない）
        this.stat.guard = (this.stat.guard || 0) + 1;
      }
      s.q.copy(b.quaternion);
    }
  }
  // vrm.update を差しかえる（アプリが自分で vrm.update を呼んでも、同じ決まりで進む）。three-vrm の VRM.update と同じ順
  _wrapVrmUpdate() {
    const v = this.vrm; if (v.__aoiWrapped) { v.__aoiOwner = this; return; }
    const orig = v.update.bind(v); v.__aoiWrapped = true; v.__aoiOwner = this; v.__aoiOrigUpdate = orig;
    v.update = d => {
      const m = v.__aoiOwner; if (!m || !(d > 0)) return orig(d);
      if (m._vuFid === m._fid) { m.stat.vuSkip = (m.stat.vuSkip || 0) + 1; return; }   // 同じこまで二度め（揺れものが倍の速さで進み、房が跳ねる）→ 進めない
      m._vuFid = m._fid; d = Math.min(d, .05);
      v.humanoid.update(); v.lookAt?.update(d); v.expressionManager?.update(); v.nodeConstraintManager?.update();
      if (m._sprReset) { m.stat.sprReset++; m._sprReset = false; m._doSpringReset(); m.q.accS = 0; }
      if (m.calm > 0) { m._springStep(d, true); m.q.accS = 0; }   // 現れるあいだ・置き直した直後：揺れずに落ち着く形へ
      else if (m.q.tier === "low") { m.q.accS += d; if (!(m.q.n & 1)) { m._springStep(m.q.accS); m.q.accS = 0; } }   // low：髪・揺れものは一こまおき（たまった時間で進める）
      else m._springStep(d);
      v.materials?.forEach(x => x.update?.(d));
    };
  }
  walkTo(v) { this.goal = v ? new THREE.Vector3(v.x, this.pos.y, v.z) : null; this.driven = false; return this; }
  drive(x, z) { this.driven = true; this.goal = null; this.pos.x = x; this.pos.z = z; return this; }
  faceTo(yaw) { this.faceYaw = yaw; return this; }
  lookAt(t) { this.look.target = t || null; return this; }
  express(name, w = 1, sec = 2.5) { if (!EMOTIONS[name]) return this; this.face.emo = name; this.face.emoW.t = clamp(w, 0, 1.2); this.face.hold = sec; return this; }
  listen(on = true) { this.listening = !!on; if (on) this.express("warm", .8, 1e9); else this.express("calm", 1, 0); return this; }
  speak({ timeline = null, kana = "", text = "", dur = 3, clock = null, level = null, gesture = null, ref = null, autoGesture = true } = {}) {
    const tl = timeline || (kana ? timelineFromKana(kana, dur) : timelineFromText(text, dur)); const t0 = this.t;
    // v5：身ぶりの印（無ければ字幕・かなから推す）
    let gq = []; try { gq = gesture ? _normGestures(gesture, { text, kana, timeline: tl, dur }) : autoGesture ? inferGestures({ text, kana, timeline: tl, dur, ref: ref || this.look.target }) : []; } catch (e) { console.warn("gesture", e); }
    this.speaking = { tl, clock: clock || (() => this.t - t0), level, i: 0, bi: 0, nb: 0, pi: 0, dur: tl.d || dur, startAway: this.rand() < .5, gq, xb: gq.filter(g => g.type === "beat").map(g => g.t + .05) };
    this.lastGestures = gq;
    this.listening = false; this.blink.next = Math.min(this.blink.next, .25 + this.rand() * .4);
    if (this.rand() < .6) this.face.flash = .45;   // 話しはじめに眉が小さく上がる
    if (this.face.emo === "calm" || this.face.hold <= 0) this.express("warm", .9, (tl.d || dur) + 1);
    return this;
  }
  stopSpeaking() { this.speaking = null; return this; }
  point(v, sec = 2.6) { this.pointing = { p: v.clone ? v.clone() : new THREE.Vector3(v.x, v.y, v.z), t: 0, sec, side: 0 }; return this; }
  bow(kind = "eshaku") { const deg = kind === "keirei" ? 30 : kind === "saikeirei" ? 45 : 15; this.bowing = { a: deg * Math.PI / 180, t: 0, down: deg > 20 ? 1.15 : .8, hold: deg > 20 ? .8 : .45, up: deg > 20 ? 1.6 : 1.1 }; return this; }
  get busy() { return !!(this.speaking || this.pointing || this.bowing); }
  debug() { const f = this.feet; return `速さ ${this.speed.toFixed(2)}  足 L${f.L.swing ? "↑" : "_"} R${f.R.swing ? "↑" : "_"}  重心 ${this.s.ws.v.toFixed(2)}  ${this.speaking ? "話す" : this.listening ? "聞く" : ""}${this.bowing ? " 礼" : ""}${this.pointing ? " 指す" : ""}`; }

  // ---------------------------------------------------------------- 毎こま
  get quality() { return this.q.tier; }
  set quality(v) { if (["high", "mid", "low"].includes(v)) { this.q.tier = v; this.q.auto = false; } else if (v === "auto") this.q.auto = true; }
  // v5：こまの速さを見て、段を上げ下げする（下げるのは 36 こま/秒を 4 秒割ったら・上げるのは 56 こま/秒を 20 秒越えたら）
  _qTick(raw) {
    const q = this.q; q.n++; if (!q.auto || !(raw > 0) || raw > .25) return;
    q.ema += (raw - q.ema) * .05; const order = ["high", "mid", "low"], i = order.indexOf(q.tier);
    if (q.ema > 1 / 36) { q.slow += raw; q.fast = 0; if (q.slow > 4 && i < 2) { q.tier = order[i + 1]; q.slow = 0; } }
    else { q.slow = Math.max(0, q.slow - raw); if (q.ema < 1 / 56) { q.fast += raw; if (q.fast > 20 && i > 0) { q.tier = order[i - 1]; q.fast = 0; } } else q.fast = 0; }
  }
  // v5（11 人の P1「現れるとき、透けた顔に白目の穴と口の中だけが浮いて、お面のように見える」）：
  // アプリが碧を薄くから濃くするあいだ（材質の opacity が 1 未満）は、半透明に重ねて描かず、細かい網目で「描く点・描かない点」を分けて描く（ディザ）。
  // どの点も不透明に描くので奥行きの前後が崩れない＝顔の奥の白目・口の中が透けない・目だけ先に浮かない・髪とまつげが入れちがわない。目・肌・髪が同じ速さで現れる。
  _fadeGuard() {
    if (this._fade) return; this._fade = true;
    const BAYER = "uniform float aoiFadeA;\nuniform float aoiCutA;\nfloat aoiBayer(vec2 p){ int x = int(mod(p.x, 4.0)), y = int(mod(p.y, 4.0)), i = x + y * 4;\n float m[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.); return (m[i] + .5) / 16.; }\n";   // v5.5 で細かい粒（IGN）を試したが、11 人で「顔にゴマのような点が長く残る」（P1 1・P2 9）となり、4×4 に戻した
    const mats = new Set(); this.vrm.scene.traverse(m => { if (m.isMesh && !m.userData.aoiOverlay) for (const mt of [].concat(m.material)) mats.add(mt); });
    for (const mt of mats) { if (mt.userData.aoiFadeU) continue; const u = mt.userData.aoiFadeU = { value: 1 }; mt.userData.aoiCutU = { value: 0 }; mt.userData.aoiBl = mt.blending; mt.userData.aoiTr = mt.transparent; mt.userData.aoiDW = mt.depthWrite; mt.userData.aoiPrevOBC = mt.onBeforeCompile; mt.userData.aoiBayer = BAYER;
      // もとから半透明の材質（目の光・線など）は、重ね塗りのまま網目だけ掛ける
      // 注：three はこの関数を文字列にして形の見分けに使うことがあるので、外の変数を使わず this（材質）から読む
      mt.onBeforeCompile = function (sh, r) { const ud = this.userData; ud.aoiPrevOBC?.call(this, sh, r); sh.uniforms.aoiFadeA = ud.aoiFadeU; sh.uniforms.aoiCutA = ud.aoiCutU; if (!/void\s+main\s*\(\s*\)\s*\{/.test(sh.fragmentShader)) return;
        sh.fragmentShader = (ud.aoiBayer + sh.fragmentShader.replace(/void\s+main\s*\(\s*\)\s*\{/, "void main() {\n  if (aoiFadeA < .999 && aoiBayer(gl_FragCoord.xy) >= aoiFadeA) discard;")).replace(/\}\s*$/, "  if (aoiCutA > .5 && gl_FragColor.a < .08) discard;\n}\n"); };
      mt.userData.aoiPrevKey = mt.customProgramCacheKey; mt.customProgramCacheKey = function () { const k = this.userData.aoiPrevKey; return (k ? k.call(this) : "") + "|aoiFade"; }; mt.needsUpdate = true; }
    // 描く直前に、そのこまの濃さを網目の割合へ移し、重ね塗りをやめて奥行きを書く（アプリの現れ方のコードはそのまま）
    this.vrm.scene.traverse(m => { if (!m.isMesh || m.userData.aoiOverlay) return; m.userData.aoiM = this; const prev = m.onBeforeRender;
      m.onBeforeRender = function (r, s, c, g, mt, grp) { prev?.call(this, r, s, c, g, mt, grp); const u = mt?.userData?.aoiFadeU; if (!u) return;
        const o = mt.transparent ? mt.opacity : 1;
        // 濃さは網目だけで表し、材質の不透明度は 1 に（VRoid の肌・髪・服は「抜き 0.5」なので、薄くすると半分より下で全部抜けて、目だけが先に見えていた）
        if (o < .999) { const am = this.userData.aoiM; if (am) am._fadingT = am.t; if (mt.userData.aoiTr) { u.value = 1; if (mt.uniforms?.opacity) mt.uniforms.opacity.value = o; mt.userData.aoiCutU.value = 1; mt.depthWrite = true; }   /* 見えている所だけ奥行きを書く（透明な所は捨てる）。こうしないと、①四角い面の透明な所まで奥行きが入って後ろの白目と肌が抜け、黒い帯になる（11 人の P1）②描く順が入れかわり、白目が黒目の上に塗られて白く光る目になる */   // もとから半透明の細い部品（眉・まつげ・目の線・黒目・目の光）は網目にせず薄くする（網目だと線が欠けて太い帯に見える）。網目の肌と同じくらいの見え方に（目のない顔にならない）
          else { u.value = /SKIN/i.test(mt.name || "") ? 1 - Math.pow(1 - o, 3.2) : 1 - (1 - o) * (1 - o);   /* v5.7：肌を先に濃く（網目で顔だけ暗く見えた） */ if (mt.uniforms?.opacity) mt.uniforms.opacity.value = 1; if (!/outline/i.test(mt.name || "")) mt.blending = THREE.NoBlending; mt.depthWrite = mt.userData.aoiDW; }   /* 奥行きを書くかどうかは、もとの材質のまま（白目はもとから書かない＝黒目が隠れない） */ mt.userData.aoiDith = true; }   // 輪郭線の材質は重ね塗りのまま（重ね塗りをやめると、髪の輪郭線が黒い帯になる）
        else if (mt.userData.aoiDith) { u.value = 1; mt.userData.aoiCutU.value = 0; mt.blending = mt.userData.aoiBl; mt.depthWrite = mt.userData.aoiDW; mt.userData.aoiDith = false; } else u.value = 1; }; });
  }
  update(dt, camera, { vrmUpdate = true } = {}) {
    this._elapsed = Math.min(Math.max(dt, 0), .25); this._qTick(dt); dt = Math.min(dt, .05); if (dt <= 0) return; this.t += dt; this._fid++; const S = this.s;
    if (this._fadingT != null && this.t - this._fadingT < .35 && this.blink.t < 0) this.blink.next = Math.max(this.blink.next, .35);   // v5：現れているあいだと直後はまばたきしない（目が線だけの一こまにしない）
    this._locomotion(dt, camera);
    this._apply();
    const cam = camera ? camera.getWorldPosition(this._cam || (this._cam = new THREE.Vector3())) : null;
    this._body(dt);
    this.root.updateMatrixWorld(true);
    this._legs(dt);
    this._arms(dt);
    this._headEyes(dt, cam);
    this._faceTick(dt);
    if (this.springs.length && this.live && this.calm <= 0 && this.wind) { const t = this.t, a = this.wind; for (const s of this.springs) { s.j.settings.gravityDir.set(s.g.x + .18 * a * Math.sin(t * .63 + s.g.y), s.g.y, s.g.z + .1 * a * Math.sin(t * .41)).normalize(); s.j.settings.gravityPower = Math.max(s.p, .05); } }
    // v5.3：vrm.update は差しかえ済み（_wrapVrmUpdate）＝一こま一回・dt の上限・揺れものの刻み・low の一こまおき・現れるあいだは休みの形、をそこで守る
    if (vrmUpdate) { this.vrm.update(dt); this.afterVrmUpdate(dt); }
    // 現れるあいだ（calm）は揺れものを休みの形に保つ。v5.3：休みの形を焼きこまない（前は setInitState で、揺れた形が新しい休みの形になり、髪型が変わっていた）
    if (this.calm > 0) { this.calm -= dt; this._robeReset = true; }
    if (this._sprReset) { this._sprReset = false; this._doSpringReset(); this.stat.sprReset++; }
  }
  // { vrmUpdate:false } で vrm.update をアプリが呼ぶときは、そのあとでこれを呼ぶ（裾の布）
  afterVrmUpdate(dt) {
    if (!this.robe) return;
    if (this._robeReset) { this.robe.reset(); this._robeReset = false; }   // 揺れを止めて静止の形へ（そのあと脚との当たりだけは直す）
    if (this.q.tier !== "high") { this.q.accR += dt; if (this.q.n & 1) return; dt = Math.min(this.q.accR, .05); this.q.accR = 0; }   // v5：mid・low では裾の布を一こまおき（たまった時間で進める）
    this.robe.update(dt, { groundY: this.groundAt ? this.groundAt(this.pos.x, this.pos.z) : this.root.getWorldPosition(_v[9]).y, live: this.live });
  }
  _apply() { if (this.groundAt) { const F = this.feet, g = this.groundAt(this.pos.x, this.pos.z), gl = F ? Math.min(F.L.p.y, F.R.p.y) - this.ankleH * this.sc : g; this.pos.y = Math.min(g, gl + .02 * this.sc); }   // 坂では低いほうの足に合わせて腰を下げる（脚が伸びきらない）
    this.root.position.set(this.pos.x, this.pos.y, this.pos.z); this.root.rotation.y = this.yaw; }

  _locomotion(dt, camera) {
    const P = this.pos;
    if (this.goal && !this.driven) {   // ばねで目標へ（歩き出しはゆっくり、着く前にゆるめる）
      const w = 2.6, n = Math.max(1, Math.ceil(dt / .02)), h = dt / n;
      // v5.4（2026-10-14）：歩き出しの速さの上がり方に上限（毎秒 1.1 m/秒ずつ）。前は一こまで秒速 0.85 m になり、立っていた足が置き去りにされて
      // 腰が 40 cm 沈む（脚を前後に大きく開いて座りこむ）こまがあった（動きの台で測った）
      for (let i = 0; i < n; i++) { const m0 = Math.hypot(this.vel.x, this.vel.z); this.vel.x += (w * w * (this.goal.x - P.x) - 2 * w * this.vel.x) * h; this.vel.z += (w * w * (this.goal.z - P.z) - 2 * w * this.vel.z) * h; const m = Math.hypot(this.vel.x, this.vel.z), cap = Math.min(.85, m0 + 1.1 * h); if (m > cap) this.vel.multiplyScalar(cap / m); P.x += this.vel.x * h; P.z += this.vel.z * h; }
      if (P.distanceTo(this.goal) < .03 && this.vel.length() < .05) { this.goal = null; this.vel.set(0, 0, 0); }
    } else if (this.driven) {
      const elapsed = this._elapsed || dt, vx = (P.x - this._last.x) / elapsed, vz = (P.z - this._last.z) / elapsed, a = 1 - Math.exp(-18 * dt);
      this._driveStopped = Math.hypot(vx, vz) < .025;
      this.vel.x += (vx - this.vel.x) * a; this.vel.z += (vz - this.vel.z) * a;
    } else this.vel.multiplyScalar(Math.exp(-8 * dt));
    if (Math.hypot(P.x - this._last.x, P.z - this._last.z) > 1.6) { this._last.copy(P); this._apply(); this._placeFeet(); this._robeReset = true; this._sprReset = true; this._turn = null; this.calm = Math.max(this.calm, .3); this.stat.jump++; }   // とんだときは足をそろえ直す（v5.3：髪・裾のばねも新しい位置の休みの形へ）
    this._last.copy(P);
    this.speed = Math.hypot(this.vel.x, this.vel.z);
    const kT = clamp((this.speed - .12) / .6, 0, 1); this.k += (kT - this.k) * (1 - Math.exp(-4 * dt));
    // 向き：歩くときは進む方へ、止まっているときは決めた向きか見る人の方へ（大きく違うときだけ。足を踏みかえて向く）
    let want = this.yaw;
    if (this.speed > .25) want = Math.atan2(this.vel.x, this.vel.z);
    else if (this.faceYaw != null) want = this.faceYaw;
    else if (this.pointing) want = Math.atan2(this.pointing.p.x - P.x, this.pointing.p.z - P.z) * .5 + this._toCam(camera) * .5;
    else if (this.faceViewer && camera) { const tc = this._toCam(camera); if (Math.abs(wrapA(tc - this.yaw)) > .5 || this.speaking || this.listening) want = tc; }
    const d = wrapA(want - this.yaw), rate = this.speed > .25 ? 2.6 : 1.5;
    // v5：止まっているときの向きかえは、目と頭→胴→足の順（Anastasopoulos ら 2009・Khobkhun ら 2022）。角度が大きいほど歩数と歩幅が増える
    const standing = this.speed < .2 && !this.goal && this.k < .35;
    let tr = this._turn;
    if (tr && (!standing || !this.live)) { tr = this._turn = null; for (const f of Object.values(this.feet)) if (f.swing?.fix) { f.swing.fix = false; } }   // v5.4：向きかえの途中で歩き出したら、振っている一歩も歩きの一歩として着く先を決め直す
    if (standing && this.live) {
      if (tr && Math.abs(wrapA(want - tr.y1)) > .3) tr = this._turn = null;   // 向く先が大きく変わったら、いまの向きから組み直す
      if (!tr && Math.abs(d) > .09) {
        const A = Math.abs(d), n = A < .4 ? 0 : A < 1.4 ? 2 : 4, lead = .14 + .1 * Math.min(1, A), stepT = .42;
        tr = this._turn = { y0: this.yaw, y1: want, t: 0, lead, T: n ? n * stepT * .92 : .35 + .55 * A, n, i: 0, dir: Math.sign(d), stepT };
      }
      if (tr) { tr.y1 = want; tr.t += dt; const u = sstep((tr.t - tr.lead) / tr.T); this.yaw = tr.y0 + wrapA(tr.y1 - tr.y0) * u;
        if (tr.t > tr.lead + tr.T + .05 && !this.feet.L.swing && !this.feet.R.swing) { this.yaw = tr.y1; this._turn = null; } }
      else this.yaw += d * (1 - Math.exp(-2 * dt));   // ごく小さな差は、そのまま寄せる
    } else this.yaw += clamp(d * (1 - Math.exp(-3.2 * dt)), -rate * dt, rate * dt);
    const rem = tr ? wrapA(tr.y1 - this.yaw) : d;
    this._tw = (this._tw || 0) + ((this._turn && this._turn.n ? 1 : 0) - (this._tw || 0)) * (1 - Math.exp(-5 * dt));
    this.s.turnLead.t = clamp(rem, -.9, .9); this.s.turnLead.step(dt, tr ? 7 : 5);   // 胴は足より先に回る
  }
  // v5：向きかえの一歩（i 番め）。内側の足から、交互に。着く場所と向きは、その一歩が終わるころの体の向きで決める
  _turnStep(tr) {
    const side = (tr.i % 2 === 0 ? 1 : -1) * tr.dir, key = side > 0 ? "L" : "R", f = this.feet[key];
    const uEnd = sstep((tr.lead + (tr.i + 1) * tr.T / tr.n - tr.lead) / tr.T), yE = tr.y0 + wrapA(tr.y1 - tr.y0) * uEnd, last = tr.i >= tr.n - 1;
    const sx = f.side * this.halfW * this.sc * 1.05, c = Math.cos(yE), s = Math.sin(yE), x = this.pos.x + sx * c, z = this.pos.z - sx * s;
    const to = new THREE.Vector3(x, (this.groundAt ? this.groundAt(x, z) : this.pos.y) + this.ankleH * this.sc, z);
    f.swing = { from: f.p.clone(), fy: f.yaw, u: 0, T: tr.stepT * .74, to, fix: true, ty: yE + f.side * .1 + (side === tr.dir && !last ? tr.dir * .12 : 0) };   // 内側の足は、つま先を少し開いて踏み出す
    this.lastStep = key; tr.i++; tr.side = f.side;
  }
  _toCam(camera) { const c = camera.getWorldPosition(_v[8]); return Math.atan2(c.x - this.pos.x, c.z - this.pos.z); }

  // 姿勢の層（息・重心・揺れ・お辞儀・話す・聞く）を、骨の回転に重ねる
  _body(dt) {
    const S = this.s, B = this.bones, t = this.t, L = this.live, k = this.k, sp = this.seedPh;
    // 息：一回ごとに長さを少し変える。吸う 4 割・吐く 6 割
    if (L) { S.brU += dt / S.brP; if (S.brU >= 1) { S.brU -= 1; S.brP = (this.speaking ? 3.2 : 4.2) * (.85 + .3 * this.rand()); } }
    const u = S.brU, br = L ? (u < .4 ? sstep(u / .4) : 1 - sstep((u - .4) / .6)) : 0;
    // 重心：数秒〜十数秒ごとに、片足へ（体重の移し）。歩くときと、指す・礼のときは真ん中へ
    // v3.1：重心を移す量は v3 の 45%（左右の揺れを抑える）。upright ではさらに 3 割
    if (L) { S.wsHold -= dt; if (S.wsHold <= 0) { const r = this.rand(); S.wsLvl = (S.wsLvl > 0 ? -1 : 1) * (.6 + .4 * this.rand()) * .45;   /* v5.6：真ん中（両足に等しく）で長く止まらない（11 人「重心 0 で左右対称に戻る」） */ S.wsHold = this.posture === "upright" ? 7 + 8 * this.rand() : 4 + 8 * this.rand(); } }   // v5.5：4〜12 秒ごと（upright は 7〜15 秒＝揺れて見えない）
    // v6.0（HP の採点「手をかざすとき重心が真ん中へ戻って固まる」）：指すあいだも重心を真ん中へ戻しきらず、的の側の足へ少し寄せる（手を伸ばす側へ体重がのる）
    S.ws.t = this.bowing ? 0 : this.pointing ? (S.wsLvl * .45 + (this.pointing.side || 0) * .12) * (1 - k) * this.pz.ws : S.wsLvl * (1 - k) * this.pz.ws;
    { const tr = this._turn; if (tr && tr.n && tr.i < tr.n + 1) { const sw = this.feet.L.swing ? 1 : this.feet.R.swing ? -1 : tr.i < tr.n ? (tr.i % 2 === 0 ? 1 : -1) * tr.dir : 0; S.ws.t = -sw * .4; } }   // v5：向きかえで踏み出す前に、反対の足へ体重を移す
    S.ws.step(dt, this._turn ? 4 : undefined); const ws = S.ws.v;
    const swX = L ? .45 * this.pz.sway * wob(t * .9, sp) : 0, swZ = L ? this.pz.sway * wob(t * .7, sp + 5) : 0;   // 静かに立つときの小さな揺れ（前後に数 mm・左右はその半分以下）
    // お辞儀
    let bw = 0; const bo = this.bowing; if (bo) { bo.t += dt; const a = bo.t, d1 = bo.down, d2 = d1 + bo.hold, d3 = d2 + bo.up; bw = a < d1 ? sstep(a / d1) : a < d2 ? 1 : a < d3 ? 1 - sstep((a - d2) / bo.up) : 0; if (a >= d3) this.bowing = null; }
    const bA = bo ? bo.a * bw : 0; this._bowA = bA;
    // v5.5（11 人「立ち姿が正面で左右ほぼ同じ」）：片足に重心を置く立ち方（コントラポスト）を、記録の上に重ねる（前は記録に打ち消されていた）。頭の注の v5.5 を参照
    // upright（HP・研究室・胡蝶の夢・森羅書庫）も、背はまっすぐのまま片足に重心を置く（9 割。前の 11 人「正面で左右ほぼ同じ」はこの三つで多かった）
    const cpR = clamp(ws / Math.max(.05, .45 * this.pz.ws), -1, 1) * (1 - k) * (1 - bw) * (L ? 1 : 0), cp = cpR * (this.posture === "upright" ? this.uprightW : 1); this._cpc = cp; this._cpr = cpR;
    S.talk.t = this.speaking ? 1 : 0; S.talk.step(dt); S.listen.t = this.listening ? 1 : 0; S.listen.step(dt);
    const tk = S.talk.v * (L ? 1 : 0), ls = S.listen.v * (L ? 1 : 0);
    // 歩く：骨盤の回り・傾き、胸は逆にひねる（足の位置から）
    const g = this._gait || { u: 0, side: 0, ph: 0 }, gs = .5 * g.side * Math.sin(Math.PI * g.u) * k;   // 歩くときの骨盤の横の傾き（v3.1 で半分）
    // 人が動いた記録（立つ・歩く・話す）を、骨ごとの土台にする（mw＝記録の効き。読めていないときは 0＝これまでの動きだけ）
    const mw = this._mocapPose(dt, k, tk);
    // 各骨：base＝立ち姿・歩きの土台（記録があれば記録に置きかわる）、act＝その上に重ねる動き（息・礼・話す・聞く・首をかしげる）
    this._pose = {}; this._poseB = {};
    const P = (n, b, a) => { this._poseB[n] = b; this._pose[n] = a; };
    // 歩き始めや両足接地で位相が飛んでも、胴は一こまで跳ね返らない。
    this._bodyPhase = (this._bodyPhase || 0) + (g.ph - (this._bodyPhase || 0)) * (1 - Math.exp(-12 * dt));
    const phase = this._bodyPhase;
    const upright = this.posture === "upright", leanB = (upright ? .018 : .05) * k, leanA = (upright ? .009 : .02) * tk + (upright ? .012 : .025) * ls, bt = this._beat || 0;
    P("hips", [.02 * k, -.12 * phase * k, .055 * ws - .035 * gs], [bA * .7, S.turnLead.v * .2 + .04 * cp, .06 * cp]);
    P("spine", [leanB * .4 + .004 * swZ, .07 * phase * k, -.05 * ws + .02 * gs], [leanA * .4 + bA * .1 + .008 * br + .015 * bt, S.turnLead.v * .15 - .015 * cp, -.03 * cp]);
    P("chest", [leanB * .3, .06 * phase * k, -.025 * ws + .012 * gs], [leanA * .3 + bA * .05 - .018 * br, S.turnLead.v * .12 - .02 * cp, -.028 * cp]);
    const cu = this.pz.chestUp, sb = this.pz.shBack;   // upright：胸を少し起こし（首と頭で戻して目線は水平）、肩を少し後ろへ引く
    P("upperChest", [leanB * .2 - cu, .02 * phase * k, -.01 * ws], [leanA * .2 - .012 * br, 0, -.012 * cp]);
    P("leftShoulder", [0, sb, .01 * ws], [0, 0, .006 * br - .02 * cp]); P("rightShoulder", [0, -sb, .01 * ws], [0, 0, -.006 * br - .02 * cp]);   // 息で肩が上がる（v3.1 で半分＝左右に傾いて見えない）
    // 頭の位置（首から上）は、見る先へ向ける前の基本の形。首・頭は胴の傾きを半分ほど打ち消す（目線を水平に保つ）
    const tilt = this._tilt(dt, ls);
    P("neck", [-leanB * .3 + cu * .5, 0, .025 * ws], [-.06 * bA + .01 * br - leanA * .3, 0, tilt * .4 + .022 * cp]);
    P("head", [.02 * k - leanB * .3 + cu * .5, 0, .02 * ws], [-.04 * bA - leanA * .3 + S.nod.step(dt), 0, tilt * .6 + .012 * cp]); this._tiltA = tilt;
    // 腰の位置：重心の側へ寄る・前後の揺れ・礼では後ろへ引く・歩くとき少し沈み、片足立ちの真ん中で高くなる
    S.hipY.t = -.008 * k + .006 * k * Math.sin(Math.PI * g.u) * (1 - mw) - .006 * Math.abs(ws) * (1 - mw) - .004 * br * (1 - k) - .06 * Math.sin(bA) - .006 * Math.abs(cp);   /* 礼では膝を少しゆるめる */ S.hipY.step(dt);
    const L0 = this.legLen / this.sc, mp = this._mp;   // 記録の腰の揺れ（脚の長さに対する比）→ 碧の長さへ。腰が左右に寄りすぎないよう少し控える
    const mh = this.pz.mH + (this.posture === "upright" ? .2 * k : 0);   // 記録の腰の横の揺れは v3 の 4 割（左右の揺れを抑える）。upright ではさらに小さく
    this._hipOff = [(.03 * ws + .004 * swX - .02 * gs) * (1 - mw) + mp.x * L0 * .11 * mh * mw + .032 * cp, S.hipY.v + clamp(mp.y * L0 * .18 * mw, -.012, .012), (.005 * swZ) * (1 - mw) + mp.z * L0 * .3 * mh * mw - .07 * Math.sin(bA)];
    this._ws = ws; this._br = br; this._tk = tk; this._ls = ls; this._bw = bw;
    // 骨へ：土台（手続きの形と記録を、記録の効きで混ぜる）× 重ねる動き
    const hips = B.hips; if (hips) { const h0 = this.rest.hip0; hips.position.set(h0.x + this._hipOff[0] * this.hk, h0.y + this._hipOff[1] * this.hk, h0.z + this._hipOff[2] * this.hk); }
    for (const [n, a] of Object.entries(this._pose)) { const b = B[n]; if (!b) continue; const base = this._poseB[n];
      b.quaternion.setFromEuler(_e.set(base[0], base[1], base[2]));
      const it = (n === "hips" || n === "spine" || n === "chest" || n === "upperChest") ? 1 + ((this._idleTorso ?? 1) - 1) * (1 - this.k) : 1, w = mw * (MOCAP_W[n] || 0) * this._ms(n) * (1 - .6 * bw) * it * (1 - .55 * (this._tw || 0)); if (w > 1e-3 && this._mq[n]) b.quaternion.slerp(this._latQ(n, this._mq[n]), w);
      b.quaternion.multiply(_q[5].setFromEuler(_e.set(a[0], a[1], a[2]))); }
  }
  // 記録をどれだけ効かせるか（姿勢の型ごと）：胴＝mT・首と頭＝mN・肩と腕＝mA
  _ms(n) { const p = this.pz, gait = this.posture === "upright" ? this.k : 0; return n === "hips" || n === "spine" || n === "chest" || n === "upperChest" ? p.mT + .2 * gait : n === "neck" || n === "head" ? p.mN : p.mA + .3 * gait; }
  // 記録の胴の「横の傾き」（体の前後の軸まわり＝左右に揺れて見える成分）だけを小さくする（v3.1：既定 35%・upright 20%）。前後・ねじれはそのまま
  _latQ(n, q) { if (!(n === "hips" || n === "spine" || n === "chest" || n === "upperChest" || n === "neck" || n === "leftShoulder" || n === "rightShoulder")) return q;
    const e = _e.setFromQuaternion(q, "YXZ"); e.z *= this.pz.lat;
    // 立つ記録の前屈みをuprightへ持ち込まない。ねじれは歩行の位相として残す。
    if (this.posture === "upright" && /^(hips|spine|chest|upperChest)$/.test(n)) e.x = clamp(e.x * .45, -.04, .04);
    return (this._lq ||= {})[n] = ((this._lq[n]) || new THREE.Quaternion()).setFromEuler(e); }
  // 記録のこまを取り出す：立つ（二つの記録を、終わるたびに 1 秒かけて入れかえる）・歩く（足の運びの位相）・話す（胴と首）
  _mocapPose(dt, k, tk) {
    const lib = this.mc; this.mcW.t = lib && this.live ? 1 : 0; const mw = this.mcW.step(dt); if (!lib || mw < 1e-3) return 0;
    const C = lib.clips, mi = this.mi, Q = this._mq, T = this._mt;
    // 立つ
    const durOf = id => C[id]?.sec || 1;
    // v4：立ち姿の記録は 4 本×左右＝8 通り。次の記録は、いまと直前を除いてくじで選び、2.4 秒かけて入れかえる（入れかえの最中に、もとの記録は終わらせない）
    const XF = 2.4;
    mi.t += dt * (mi.rate || 1); if (mi.prev) { mi.pt += dt * (mi.prate || 1); mi.x = Math.min(1, mi.x + dt / XF); if (mi.x >= 1) mi.prev = null; }
    if (!mi.prev && mi.t > durOf(mi.cur) - XF - .1) { const ids = Object.keys(C).filter(k2 => C[k2].type === "idle"); let pool = ids.filter(k2 => k2 !== mi.cur && k2 !== mi.last && k2.replace(/_m$/, "") !== mi.cur.replace(/_m$/, "")); if (!pool.length) pool = ids.filter(k2 => k2 !== mi.cur); if (!pool.length) pool = ids;
      const nx = pool[Math.floor(this.rand() * pool.length)]; mi.last = mi.cur; mi.prev = mi.cur; mi.pt = mi.t; mi.prate = mi.rate || 1; mi.cur = nx; mi.t = this.rand() * Math.max(.1, durOf(nx) - XF - 3); mi.x = 0; mi.rate = .85 + .25 * this.rand(); }   /* 速さと始まりも毎回すこし変える（同じ記録のくり返しに見せない） */
    sampleClip(lib, C[mi.cur], mi.t / durOf(mi.cur), Q, this._mp);
    { const kc = IDLE_K[C[mi.cur]?.src] || {}, kp = mi.prev ? IDLE_K[C[mi.prev]?.src] || {} : kc, x = mi.prev ? sstep(mi.x) : 1;
      this._idleArm = (kc.arm ?? 1) * x + (kp.arm ?? 1) * (1 - x); this._idleTorso = (kc.torso ?? 1) * x + (kp.torso ?? 1) * (1 - x); }
    if (mi.prev) { const x = sstep(mi.x); sampleClip(lib, C[mi.prev], mi.pt / durOf(mi.prev), T, _v[8]); for (const n in Q) Q[n].slerp(T[n], 1 - x); this._mp.lerp(_v[8], 1 - x); }   // 前の記録→いまの記録
    // 話す：胴と首だけ（手は、この部品の話す身ぶり）
    if (tk > .01 && C.talk_a) { mi.tt = (mi.tt ?? this.rand() * 5) + dt; sampleClip(lib, C.talk_a, mi.tt / C.talk_a.sec, T); for (const n of TALK_BONES) if (T[n]) Q[n].slerp(T[n], .6 * tk); }
    // 歩く：足の運びの位相（0＝左が着く・0.5＝右が着く）
    if (k > .01 && C.walk_a) { sampleClip(lib, C.walk_a, this._phi, T, _v[8]); for (const n in Q) if (T[n]) Q[n].slerp(T[n], k); this._mp.lerp(_v[8], k); }
    return mw;
  }

  _tilt(dt, ls) {   // 首をかしげる（聞くとき多く、ふだんは 20〜40 秒に一度）
    const S = this.s; if (!this.live) return 0;
    S._tl = (S._tl ?? 8) - dt * (1 + 2 * ls);
    if (S._tl <= 0) { S._tl = 18 + 20 * this.rand(); S.tilt.t = (this.rand() < .5 ? 1 : -1) * (.05 + .07 * this.rand()) * .6 * this.pz.tilt;   /* v5.7：幅を 6 割（眠そうに見えた） */ S._tlHold = 1.8 + 2.5 * this.rand(); }
    if (S._tlHold != null) { S._tlHold -= dt; if (S._tlHold <= 0) { S.tilt.t = ls > .5 ? .03 : 0; S._tlHold = null; } }
    if (ls > .5 && this.rand() < dt * .25) S.nod.d += 2.2;   // 聞くときの小さなうなずき（数秒に一度）
    return S.tilt.step(dt);
  }

  // ---------------------------------------------------------------- 足：着いた足は動かさず、離れすぎたら一歩ずつ踏みかえる＋二関節の IK
  _legs(dt) {
    const F = this.feet, k = this.k, moving = this.speed > .15;
    // 踏みかえの判断
    const home = _v[0];
    // 歩く：片足を振る 0.38〜0.44 秒＋両足が着いている 0.1 秒（1 秒に 2 歩ほど・歩幅は身長の 4 割ほど）。着く足は、体より半歩先へ
    // v4：歩く調子（1 秒の歩数）を速さに合わせる（人は速いほど歩数も歩幅も増える。秒速 0.85 m で約 1.75 歩・歩幅 0.49 m、1.3 m で約 1.9 歩）。
    // 一歩＝振る 8 割＋両足が着いている 2 割（歩きの一周期の 4 割が振り・1 割ずつ両足）。小さな碧に合わせ、身長の比で少し縮める
    // v5.3：速いとき（毎秒 1.2 m より上）は歩数をさらに増やし、歩幅が脚の届く長さを超えない（前は 1 秒 2.1 歩で頭打ち＝毎秒 2 m を超えると脚が届かず、腰が急に沈んで髪が跳ねた）
    const vr = this.speed / Math.max(.5, this.sc), cad = clamp(1.65 + .42 * vr + .3 * Math.max(0, vr - 1.2), 1.7, 2.6), Tst = 1 / cad;
    const swingT = moving ? .64 * Tst : .5, ds = moving ? .16 * Tst * (1 - .7 * clamp(vr - 1, 0, 1)) : .07, landLead = moving ? .42 * Tst : 0;
    const swinging = F.L.swing || F.R.swing; this._ds = (this._ds || 0) - dt;
    const tr = this._turn;
    if (tr) { if (!swinging && tr.i < tr.n && tr.t >= tr.lead * .7 + tr.i * tr.T / tr.n) this._turnStep(tr); }   // v5：向きかえの最中は、決めた順に踏む（ほかの踏みかえはしない）
    else if (!swinging && this._ds <= 0) {
      let best = null, bestE = 0; const eo = {};
      for (const key of ["L", "R"]) { const f = F[key]; this._home(f, home, moving ? swingT + landLead : 0); const e = Math.hypot(home.x - f.p.x, home.z - f.p.z), ye = Math.abs(wrapA(this.yaw + f.side * .1 - f.yaw)); eo[key] = e; const sc = e + ye * .25 + (key === this.lastStep ? -.04 : 0); if (sc > bestE) { bestE = sc; best = key; } }
      // v5.4：歩いているあいだは左右を必ず交互に（同じ足を二度続けて出すと、もう片方の足が置き去りになり、脚が前後に開いて腰が沈んでいた）
      if (moving && best === this.lastStep) { const o = best === "L" ? "R" : "L"; if (eo[o] > .04 * this.sc) { best = o; bestE = Math.max(bestE, eo[o] + .2); } }
      const th = moving ? .1 : .16;
      if (best && bestE > th) { const f = F[best]; f.swing = { from: f.p.clone(), fy: f.yaw, u: 0, T: swingT }; this.lastStep = best; }
      // v5.5：重心を反対の足へ移し終えたら、遊脚を半歩だけ置きなおす（4 回に 3 回）。重心の足がすでに前なら、遊脚は横へ戻す（両足とも前へずれていかない）
      else if (!moving && this.live && !this._turn) { const cp = this._cpr || 0, sd = cp > .5 ? 1 : cp < -.5 ? -1 : 0;
        if (sd && sd !== this._cpSet) { this._cpSet = sd; const f = sd > 0 ? F.R : F.L, wt = sd > 0 ? F.L : F.R, fw = _v[1].set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
          const wf = ((wt.p.x - this.pos.x) * fw.x + (wt.p.z - this.pos.z) * fw.z) / this.sc; this._cpFz = wf > .025 ? -.005 - .015 * this.rand() : .03 + .04 * this.rand();
          if (this.rand() < .75) { this._home(f, home, 0); if (Math.hypot(home.x - f.p.x, home.z - f.p.z) > .015 * this.sc) { f.swing = { from: f.p.clone(), fy: f.yaw, u: 0, T: .5, to: home.clone(), fix: true, ty: this.yaw + f.side * (.12 + .1 * this.rand()) }; this.lastStep = sd > 0 ? "R" : "L"; } } } }
    }
    let gait = { u: 0, side: 0, ph: 0 };
    for (const key of ["L", "R"]) {
      const f = F[key], sw = f.swing; if (!sw) continue;
      if (moving && !sw.fix && sw.T > swingT) sw.T -= (sw.T - swingT) * Math.min(1, 12 * dt);   // v5.3：歩き出しで速くなっていくとき、振っている足も今の調子へ（遅い振りのまま体が先へ行き、着いた足が引きずられていた）
      // v5.4：立っている足が体の後ろへ離れすぎたら（歩き出しで速さが上がっていくとき）、振っている足を早めに着く（腰を沈めて脚を前後に開かない）
      { const st = F[key === "L" ? "R" : "L"]; let hurry = 0; if (moving && !sw.fix && !st.swing) { const bh = Math.hypot(st.p.x - this.pos.x, st.p.z - this.pos.z) / this.sc; hurry = clamp((bh - .32) / .15, 0, .35); }
        sw.u += dt / sw.T * (1 + hurry); this._hurry = hurry > .2; }
      const u = clamp(sw.u, 0, 1);
      this._home(f, home, moving ? (1 - u) * sw.T + landLead : 0);
      // 着く場所は振り出しの 7 割までに決め、横の動きは 85% で終える（下ろすあいだは横に動かさない＝着いてからすべらない）
      if (!sw.fix && (u < .7 || !sw.to)) sw.to = (sw.to || new THREE.Vector3()).copy(home);
      const e = sstep(u / .85), to = sw.to; f.p.x = sw.from.x + (to.x - sw.from.x) * e; f.p.z = sw.from.z + (to.z - sw.from.z) * e;
      const lift = (moving ? .05 : sw.fix ? .022 : .03) * this.sc * Math.pow(Math.sin(Math.PI * u), .7);   // すぐ地面から離れ、着く直前に下りる（向きかえの一歩は低く）
      f.p.y = home.y + lift; f.yaw = sw.fy + wrapA((sw.fix ? sw.ty : this.yaw + f.side * .1) - sw.fy) * e;
      // v4：かかとから着く。振り出しはつま先が下（けり出しの続き）→ 半ばで水平 → 着く前につま先を 10° ほど上げる。着いたあとは、かかとを軸につま先を下ろす（下の roll）
      f.pitch = moving ? (.22 * Math.sin(Math.PI * clamp(u / .45, 0, 1)) * (1 - u) - .17 * sstep((u - .55) / .4)) : .12 * Math.sin(Math.PI * u);
      gait = { u, side: f.side, ph: f.side * (2 * u - 1) };
      if (sw.u >= 1) { f.swing = null; f.p.x = sw.to.x; f.p.z = sw.to.z; f.p.y = home.y; f.roll = moving ? f.pitch : 0; f.rollT = 0; f.pitch = 0; this._ds = moving ? ds * (this._hurry ? .3 : 1) : .15; }
    }
    this._gait = gait;
    // 歩きの位相（記録の歩きと合わせる）：0＝左が着く・0.5＝右が着く。両足が着いているあいだは、次の振り出しへ向けてゆっくり進める
    { const dS = .08; let want;
      if (gait.side > 0) want = .5 + dS + (.5 - dS) * gait.u; else if (gait.side < 0) want = dS + (.5 - dS) * gait.u; else want = this._phi + dt * .35;
      const d = ((want - this._phi + 1.5) % 1) - .5; this._phi = (this._phi + d * (1 - Math.exp(-25 * dt)) + 1) % 1; }
    // 二関節の IK
    const tg = this._tg ||= { L: new THREE.Vector3(), R: new THREE.Vector3() }, pit = this._pit ||= {};
    for (const key of ["L", "R"]) {
      const f = F[key];
      // 後ろに残った足は、かかとから上がる（つま先を軸に）
      let heel = 0; if (!f.swing && moving) { const fw = _v[1].set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); const behind = -((f.p.x - this.pos.x) * fw.x + (f.p.z - this.pos.z) * fw.z); heel = clamp((behind - .12 * this.sc) * 1.6 / this.sc, 0, .25) * k; /* 長い裾をけり上げないよう、かかとの上がりは小さめ */ }
      else if (!f.swing) { const fr = Math.max(0, -(this._cpc || 0) * f.side); if (fr > .01) { const fw = _v[1].set(Math.sin(this.yaw), 0, Math.cos(this.yaw)), bh = -((f.p.x - this.pos.x) * fw.x + (f.p.z - this.pos.z) * fw.z); heel = fr * (.05 + .12 * clamp(bh / (.05 * this.sc), 0, 1)); } }   // v5.5：遊脚はかかとが少し上がる（後ろに置いた足ほど）
      f.heel += (heel - f.heel) * (1 - Math.exp(-14 * dt));
      // v4：着いたあとの「かかとを軸につま先を下ろす」（0.12 秒）
      if (!f.swing && f.roll) { f.rollT += dt; f.rollV = f.roll * (1 - sstep(f.rollT / .12)); if (f.rollT >= .12) { f.roll = 0; f.rollV = 0; } } else if (!f.swing) f.rollV = 0;
      const tgt = tg[key].copy(f.p), toeUp = f.swing ? Math.min(0, f.pitch) : (f.rollV || 0), pitch = (f.swing ? f.pitch : toeUp) + f.heel;
      const fl = this.footLen * this.sc, cy = Math.cos(f.yaw), sy = Math.sin(f.yaw);
      if (f.heel > 1e-3) { const h = f.heel, dy = this.toeDy * this.sc, fz = fl * (1 - Math.cos(h)) + dy * Math.sin(h); tgt.x += sy * fz; tgt.z += cy * fz; tgt.y += fl * Math.sin(h) + dy * (Math.cos(h) - 1); }   // つま先の付け根を軸に回す（v4：高さの差も入れた＝つま先が後ろへずれない）
      if (toeUp < -1e-3) { const a = -toeUp, hd = .22 * fl, ah = this.ankleH * this.sc;   // つま先を上げるときは、かかとを軸に（足首は少し上がり、少し後ろへ）
        tgt.y += ah * (Math.cos(a) - 1) + hd * Math.sin(a); const dz = hd * (Math.cos(a) - 1) - ah * Math.sin(a); tgt.x += sy * dz; tgt.z += cy * dz; }
      pit[key] = pitch;
    }
    // v4：足が届かないときは腰を下げる（脚が伸びきって、着いた足が引きずられる＝すべるのを防ぐ）。両足とも届く高さまで、その場で
    { const B = this.bones, hips = B.hips; let drop = 0;
      for (const key of ["L", "R"]) { const s = key === "L" ? "left" : "right", up = B[s + "UpperLeg"], lo = B[s + "LowerLeg"], ft = B[s + "Foot"]; if (!up || !lo || !ft) continue;
        const A = up.getWorldPosition(_v[3]), T = tg[key], Lm = (lo.position.length() + ft.position.length()) * this.vs * .985, h2 = (A.x - T.x) ** 2 + (A.z - T.z) ** 2;
        const vy = A.y - T.y, need = h2 < Lm * Lm ? Math.sqrt(Lm * Lm - h2) : 0; if (vy > need) drop = Math.max(drop, vy - need); }
      { const d0 = this._drop || 0, target = Math.min(drop, .025 * this.sc); this._drop = d0 + clamp(target - d0, -.10 * this.sc * dt, .10 * this.sc * dt); }   // 歩き始めに腰が上下しないよう、補正は2.5cm・毎秒10cm以内。踏み替えも短くして脚の到達を保つ。
      if (hips && this._drop > 1e-5) hips.position.y -= this._drop / this.vs; }   // 世界の行列は、下の IK が太ももの親（腰）から順に取り直す（全身の更新はしない＝軽い）
    for (const key of ["L", "R"]) this._ik(key === "L" ? "left" : "right", tg[key], F[key].yaw, pit[key]);
  }
  _ik(s, T, footYaw, footPitch) {
    const up = this.bones[s + "UpperLeg"], lo = this.bones[s + "LowerLeg"], ft = this.bones[s + "Foot"]; if (!up || !lo || !ft) return;
    up.parent.updateWorldMatrix(true, false);
    const A = up.getWorldPosition(_v[3]), sc = this.sc, l1 = lo.position.length() * this.vs, l2 = ft.position.length() * this.vs;
    const AT = _v[4].subVectors(T, A); let d = AT.length(); const dir = AT.divideScalar(d || 1);
    d = clamp(d, Math.abs(l1 - l2) + 1e-4, (l1 + l2) * .9995);
    const ca = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), sa = Math.sqrt(1 - ca * ca);
    // 膝の向き：体の前と、足の向きのあいだ
    const pole = _v[5].set(Math.sin(footYaw) + Math.sin(this.yaw), 0, Math.cos(footYaw) + Math.cos(this.yaw)).normalize();
    pole.addScaledVector(dir, -pole.dot(dir)).normalize();
    const K = _v[6].copy(A).addScaledVector(dir, l1 * ca).addScaledVector(pole, l1 * sa);
    const Tc = _v[7].copy(A).addScaledVector(dir, d);
    // 太もも
    const pq = up.parent.getWorldQuaternion(_q[0]), pqi = _q[1].copy(pq).invert();
    const w1 = _v[8].subVectors(K, A).normalize().applyQuaternion(pqi);
    const q1 = _q[2].setFromUnitVectors(_v[9].copy(lo.position).normalize(), w1);
    // ねじれ：膝のお皿が pole を向くように
    const fwdL = _v[3].set(0, 0, 1).applyQuaternion(q1), pl = _v[4].copy(pole).applyQuaternion(pqi);
    fwdL.addScaledVector(w1, -fwdL.dot(w1)); pl.addScaledVector(w1, -pl.dot(w1));
    if (fwdL.lengthSq() > 1e-6 && pl.lengthSq() > 1e-6) { fwdL.normalize(); pl.normalize(); const ang = Math.atan2(_v[5].crossVectors(fwdL, pl).dot(w1), fwdL.dot(pl)); q1.premultiply(_q[3].setFromAxisAngle(w1, ang)); }
    up.quaternion.copy(q1); up.updateWorldMatrix(false, false);
    // すね
    const uq = up.getWorldQuaternion(_q[0]), uqi = _q[1].copy(uq).invert();
    const w2 = _v[8].subVectors(Tc, K).normalize().applyQuaternion(uqi);
    lo.quaternion.setFromUnitVectors(_v[9].copy(ft.position).normalize(), w2); lo.updateWorldMatrix(false, false);
    // 足首：地面に平ら（足の向き・つま先の上げ下げ）
    const lq = lo.getWorldQuaternion(_q[0]).invert();
    const fq = _q[4].setFromEuler(_e.set(footPitch, footYaw, 0, "YXZ"));
    ft.quaternion.copy(lq.multiply(fq));
    if (this.bones[s + "Toes"]) this.bones[s + "Toes"].quaternion.setFromEuler(_e.set(-Math.min(.5, footPitch > .15 ? footPitch * .8 : 0), 0, 0));
  }

  // ---------------------------------------------------------------- 腕：振り子のように遅れてついてくる・歩くと脚と逆に振れる・話すと手が上がる・指す
  _arms(dt) {
    const S = this.s, B = this.bones, k = this.k, t = this.t, L = this.live, ws = this._ws, br = this._br;
    // 歩くときの腕の振り：反対の足の前後の位置から（右腕は左足と一緒に前へ）
    const fw = _v[0].set(Math.sin(this.yaw), 0, Math.cos(this.yaw)), F = this.feet;
    const fl = ((F.L.p.x - this.pos.x) * fw.x + (F.L.p.z - this.pos.z) * fw.z) / (.17 * this.sc), fr = ((F.R.p.x - this.pos.x) * fw.x + (F.R.p.z - this.pos.z) * fw.z) / (.17 * this.sc);
    // v4：振りの大きさは速さに合わせる（ゆっくりは小さく。秒速 0.85 m で前後に約 ±17°）。足の位置から決めるので、脚と必ず逆に振れる
    const sa = (.26 + .2 * clamp((this.speed / Math.max(.5, this.sc) - .5) / .8, 0, 1)) * k;
    { const df = (fr - fl) * .5; S.armL.t = -clamp(df / 1.4, -1, 1) * sa; S.armR.t = clamp(df / 1.4, -1, 1) * sa; }   // v5.6：左右の足の差から（止まるとき両腕がそろって後ろへ行き、前腕が前へ出ていた）   // 歩幅が v3 の 1.4 倍になったので、足の前後の位置を 1.4 で割る
    // 体の揺れ・向きの変化で、腕が少し遅れる（振り子）
    S.armLz.t = -.6 * S.turnLead.v * (1 - k) * .1 + .04 * ws; S.armRz.t = -.6 * S.turnLead.v * (1 - k) * .1 + .04 * ws;
    for (const n of ["armL", "armR"]) S[n].step(dt, 7);   // 腕は少し遅れてついてくる（振り子）
    for (const n of ["armLz", "armRz"]) S[n].step(dt);
    // 話すときの手：右手が主、ときどき両手。拍で小さく打つ
    // 話す身ぶり：句ごとに「手を下ろしたまま／右手／両手／左手」を選び、長い間では手を下ろす（いつも同じ構えにしない）。
    // 拍（強く読む音）は全部は打たない（6 割ほど・強さもまちまち）。うなずき・眉も拍の一部にだけ
    const sp = this.speaking; let beat = 0;
    if (sp) { const c = sp.clock(), b = sp.tl.b || [], Pp = sp.tl.p || [], Mm = sp.tl.m || [];
      if (!sp.amp) sp.amp = b.map(() => this.rand() < .38 ? 0 : .45 + .55 * this.rand());
      while (sp.pi < Pp.length && Pp[sp.pi] <= c + .3) { const r = this.rand(); sp.plan = sp.pi === 0 && r < .5 ? 1 : r < .3 ? 0 : r < .62 ? 1 : r < .84 ? 2 : 3; sp.var = this.rand(); sp.var2 = this.rand(); /* v5.6：句の切れ目で目をそらすのはやめた（聞き手を見る＝11 人） */ sp.pi++; }   /* 句の切れ目で、ときどき目をそらして考える */
      const mo = Mm[sp.i]; if (mo && mo[2] === "pau" && mo[1] > .26 && c > mo[0] + .05) sp.plan = 0;
      while (sp.bi < b.length && b[sp.bi] < c - .35) sp.bi++;
      for (let i = Math.max(0, sp.bi - 1); i < Math.min(b.length, sp.bi + 2); i++) { const x = c - (b[i] - .06); if (x > -.18 && x < .45) beat = Math.max(beat, sp.amp[i] * (x < 0 ? sstep(1 + x / .18) : 1 - sstep(x / .45))); }
      while (sp.nb < b.length && b[sp.nb] - .06 <= c) { const a = sp.amp[sp.nb]; if (L && a > 0 && this.rand() < .4) S.nod.d += .6 + 1.1 * a * this.rand(); if (L && a > .8 && this.rand() < .3) this.face.flash = .32; sp.nb++; }
      // v5：強める語の拍子（印・推し）は、きちんと打つ（頂点＝その語の頭。Leonard & Cummins 2011）。その前後は手を上げておく
      let xbNear = false; for (const x0 of sp.xb || []) { const x = c - x0; if (x > -.18 && x < .45) beat = Math.max(beat, x < 0 ? sstep(1 + x / .18) : 1 - sstep(x / .45)); if (x > -.6 && x < .7) xbNear = true; }
      sp.xbNear = xbNear;
      if (c > (sp.dur || 0) + .35) this.speaking = null; }
    // v5：中身に合う身ぶりがある行では、中身と関係のない型（右手・両手・左手の構え）を出さない（手が腹の前で重なる・胸に手を当てるように見える）。拍子のときだけ右手を上げる
    const pl = sp && L ? (sp.gq?.length ? (sp.xbNear ? 1 : 0) : sp.xbNear && !(sp.plan >= 1) ? 1 : sp.plan ?? 1) : 0, gon = (1 - .95 * clamp(k * 1.4, 0, 1)) * (1 - this._bw) * this.pz.gest;   // v5.4：歩きながらは身ぶりをほぼ止める（博物館で、歩きながら前腕を前へ出したままに見えた＝11 人）
    S.gest.t = (pl === 1 || pl === 2 ? 1 : pl === 3 ? .3 : 0) * gon; S.gest.step(dt, 4.2);
    S.gestL = S.gestL || new Spr(0, 4.2); S.gestL.t = (pl === 2 || pl === 3 ? 1 : pl === 1 ? .3 : 0) * gon; S.gestL.step(dt);
    S.gVar = (S.gVar ?? .5) + ((sp?.var ?? .5) - (S.gVar ?? .5)) * (1 - Math.exp(-3 * dt)); S.gVar2 = (S.gVar2 ?? .5) + ((sp?.var2 ?? .5) - (S.gVar2 ?? .5)) * (1 - Math.exp(-3 * dt));
    const g = S.gest.v, g2 = S.gestL.v, bt = beat; this._beat = beat;
    // 指す
    let pw = 0, pwL = 0, pwH = 0, aimY = 0, aimP = 0, side = 1; const po = this.pointing;
    // v5.5（11 人「指す腕が棒」）：肩と上腕が先に上がり、肘から先は 0.1 秒・手首と指は 0.2 秒遅れる（重なりの遅れ）。下ろすときは手首から力が抜け、上腕が最後
    if (po) { po.t += dt; const a = po.t, T = po.sec, on = x => sstep((x - .5) / .45),   /* v5.6：目→頭→胴のあと、腕は 0.5 秒から */ off = x => 1 - sstep((x - T + .9) / .85);   /* v5.7：下ろすのはゆっくり（0.85 秒） */
      pw = on(a) * off(a - .12); pwL = on(a - .1) * off(a - .05); pwH = on(a - .2) * off(a); if (a > T + .35) this.pointing = null;
      const toT = Math.atan2(po.p.x - this.pos.x, po.p.z - this.pos.z); aimY = wrapA(toT - this.yaw); side = aimY >= 0 ? 1 : -1;   // 左にあるものは左手
      const dist = Math.hypot(po.p.x - this.pos.x, po.p.z - this.pos.z); aimP = Math.atan2(po.p.y - 1.3 * this.sc, dist); po.side = side; }
    const wk = 1 - .85 * clamp(k * 1.4, 0, 1); S.point.t = pw * wk; S.point.step(dt); S.pointL ||= new Spr(0, 4.5); S.pointH ||= new Spr(0, 5); S.pointL.t = pwL * wk; S.pointL.step(dt); S.pointH.t = pwH * wk; S.pointH.step(dt);
    const pe = S.point.v, peL = S.pointL.v, peH = S.pointH.v;   // v5.4：歩きながらは指す腕を下げぎみに（腕を前へ突き出したまま歩くマネキンに見えた＝11 人）
    // お辞儀：腕は下へ垂れる（胴が前へ傾いた分、肩で戻す）・手は体の前で重ねる
    const bA = this._bowA || 0, bw = this._bw;
    // 休めの形（上腕：脇へ下ろす・前腕：少し曲げる・手首：腿へ向く）
    const rest = (sd, swing, swingZ) => { const sg = sd === "left" ? 1 : -1;
      return { ua: [-.06 + swing - bA * .3, sg * (.06 - .62 * bw), sg * (-1.3 + .02 * br + swingZ * sg) - sg * .02 * bw], la: [0, sg * -(.3 + .12 * k + .1 * Math.max(0, -swing / .45) * k * 2 + .38 * bw), 0], h: [.04 - .35 * bw, sg * (.05 + .25 * bw), sg * .1] }; };
    const sides = { left: rest("left", S.armL.v, S.armLz.v), right: rest("right", S.armR.v, S.armRz.v) };
    const rests = { left: rest("left", S.armL.v, S.armLz.v), right: rest("right", S.armR.v, S.armRz.v) };   // 身ぶりを足す前（記録と混ぜる土台）
    // 話す身ぶり（手のひらを少し上へ、体の前、腰〜胸の高さ）
    const gestPose = (sd, w, b) => { const sg = sd === "left" ? 1 : -1, o = sides[sd];
      // 肘は脇の近く（上腕はほぼ縦・少し内へ回す）、前腕は水平より 25〜45° 下、手は腰の前に寄る。構えの高さは句ごとに少し変える
      const v = S.gVar, bb = b * w;
      o.ua = [o.ua[0] + (-.03 - .05 * v) * w, o.ua[1] - sg * (.32 + .12 * v) * w, o.ua[2] + sg * .06 * w];
      o.la = [o.la[0], o.la[1] + sg * -(.52 + .3 * v - .2 * bb) * w, o.la[2]];
      const v2 = S.gVar2; o.h = [o.h[0] - (.3 + .4 * v2) * w, o.h[1] + sg * (-.3 + .35 * v2) * w, o.h[2] + sg * (-.12 + .18 * b) * w]; };
    gestPose("right", g, bt); gestPose("left", g2, bt * .7);
    // 指す腕
    if (pe > 1e-3) { const sd = side > 0 ? "left" : "right", sg = side > 0 ? 1 : -1, o = sides[sd];
      const yawL = clamp(aimY * sg, -.4, 1.5);   // 体の前を 0、外へ広がる向きを正
      const tgtUA = [-(Math.PI / 2 - .25) * Math.cos(yawL) * .68 - aimP * .7, sg * (Math.PI / 2 - .25) * Math.sin(Math.max(0, yawL)) * .5, sg * (-1.24 + .55 + .28 * Math.max(0, yawL))];   // v6.1（採点「指す腕が肩の高さで一直線＝マネキン」）：腕を少し低く・外へ開きすぎない
      const laT = [0, sg * -(.74 + .9 * Math.max(0, pe - peL)), 0], wL = Math.max(peL, pe * .6), wH = Math.max(peH, pe * .5);   // v5.5：上腕が先に上がるあいだ、肘は曲がったまま（前腕が遅れて伸びる）
      o.ua = o.ua.map((v, i) => v + (tgtUA[i] - v) * pe); o.la = o.la.map((v, i) => v + (laT[i] - v) * wL); o.h = o.h.map((v, i) => v + ([0, 0, sg * .12][i] - v) * wH);
      { const shB = B[sd + "Shoulder"]; if (shB) shB.quaternion.multiply(_q[0].setFromEuler(_e.set(0, -sg * .07 * pe, sg * .09 * pe))); }   // v5.5：肩（鎖骨）も少し上がって前へ
      this._pointWL = wL; this._pointWH = wH;   // v5.4：肘を少し曲げ、手首を少し落とす（肘まで一直線の腕は「からくり人形」に見えた＝11 人）
      this._pointSide = sd; this._pointW = pe; } else this._pointW = this._pointWL = this._pointWH = 0;
    // 骨へ：土台（休めの形と記録を混ぜる）× 身ぶりの差。指すときは、ねらいがずれないよう身ぶりの形そのものへ寄せる
    const mw = this.mcW.v * (this.mc ? 1 : 0) * (1 - bw) * (1 - .5 * (this._tw || 0)), qr = _q[3], qf = _q[4];   // v5：向きかえのあいだは、立ち姿の記録の前かがみ・腕の構えを半分に（背を立て、腕は脇へ）
    for (const sd of ["left", "right"]) { const o = sides[sd], r0 = rests[sd], pw2 = this._pointSide === sd ? this._pointW : 0, pw2L = this._pointSide === sd ? this._pointWL : 0, pw2H = this._pointSide === sd ? this._pointWH : 0;
      for (const [bn, key] of [["UpperArm", "ua"], ["LowerArm", "la"], ["Hand", "h"]]) { const b = B[sd + bn]; if (!b) continue;
        qf.setFromEuler(_e.set(...o[key])); const w = mw * (MOCAP_W[sd + bn] || 0) * this.pz.mA * (1 + ((this._idleArm ?? 1) - 1) * (1 - this.k) * (1 - this._tk)), mq = this._mq[sd + bn];
        if (w < 1e-3 || !mq) { b.quaternion.copy(qf); continue; }
        qr.setFromEuler(_e.set(...r0[key])); const dq = _q[0].copy(qr).invert().multiply(qf);   // 身ぶりの差（休めの形から）
        b.quaternion.copy(qr).slerp(mq, w).multiply(dq); if (pw2 > 1e-3) b.quaternion.slerp(qf, key === "ua" ? pw2 : key === "la" ? pw2L : pw2H); }
      // v5.4：腕の重さ・息・わずかな揺れ（11 人「立ち姿の腕がからだの横で固まる」「人形っぽい」）。身ぶり・指す・礼のときは外す
      { const lw = (1 - pw2) * (1 - (sd === "right" ? g : g2)) * (1 - this._bw); if (lw > .01) this._armLife(sd, dt, lw); }
      // v4：力を抜いた手が体から離れすぎない（記録によっては肘が横へ張り、手が腰から 20 cm 以上も離れる＝人形・構えに見える）。
      // 手の位置（碧の向きで見た横・前）が、横 15 cm・前 12 cm を越えたら、上腕を内へ・後ろへ戻す。指す・話す身ぶり・礼のときは外す
      const ua = B[sd + "UpperArm"], hd = B[sd + "Hand"], sg = sd === "left" ? 1 : -1, free = (1 - pw2) * (1 - (sd === "right" ? g : g2)) * (1 - this._bw) * (1 - this.k * .7);
      if (ua && hd && free > .01) { const h = this.root.worldToLocal(hd.getWorldPosition(_v[1])), ex = sg * h.x - .15, ez = h.z - .12, Lr = .42;   /* 碧の入れ物から見た位置（大きさをそろえた体の寸法） */
        if (ex > 0) ua.quaternion.premultiply(_q[0].setFromAxisAngle(_v[2].set(0, 0, 1), -sg * Math.atan(ex / Lr) * 1.1 * free));
        if (ez > 0) ua.quaternion.premultiply(_q[0].setFromAxisAngle(_v[2].set(1, 0, 0), Math.atan(ez / Lr) * free)); }
      // v5：話す身ぶりで、手が体の真ん中を越えて反対の腕の上に重ならない（腕を組んだように見える・腕どうしがめりこむ）。真ん中から 4 cm 手前で止める
      if (ua && hd && pw2 < .99) { const h = this.root.worldToLocal(hd.getWorldPosition(_v[1])), ix = .03 + .07 * (this._tk || 0) - sg * h.x;   // 話しているあいだは真ん中から 8 cm 手前（ふだん手を前で軽く重ねるのはそのまま）
        if (ix > 0 && h.z > .02) ua.quaternion.premultiply(_q[0].setFromAxisAngle(_v[2].set(0, 0, 1), sg * Math.atan(ix / .42) * 1.4 * (1 - pw2))); } }
    // v5：話の中身に合う身ぶり（手の位置を決めて、腕を IK で寄せる）
    const GS = this._gestures(dt, sp && L ? sp : null, bt, gon * (1 - pe));
    // v5.5（11 人「研究室・書庫・胡蝶の夢で棒立ち」「博物館の、手を前で重ねて待つ構えがいちばん自然」）：立って待つあいだ、ときどき両手を体の前で軽く重ねる。
    // 8〜16 秒ごとにくじ（4 割半）。話す・聞く・指す・礼・歩く・向きかえのあいだはしない。左手が上（いつも同じでなく、そのつど決める）
    { const S2 = this.s; S2.clasp ||= new Spr(0, 1.5); S2.claspHold = (S2.claspHold ?? 12 + 8 * this.rand()) - dt;   /* v6.1：はじめは横に下ろして待つ */
      const free = L && k < .05 && !sp && !this.pointing && !this.bowing && !this.listening && !GS.on && !this._turn && !this.goal;
      S2.claspHold0 = (S2.claspHold0 ?? 12 + 6 * this.rand());
      if (S2.claspHold <= 0 || (S2.claspFirst !== true && (S2.claspHold0 -= dt) <= 0 && free)) { S2.claspOn = free && !S2.claspOn;   /* v6.1：重ねたら次は必ず下ろす */ if (S2.claspFirst !== true && free) { S2.claspOn = true; S2.claspFirst = true; } S2.claspTop = this.rand() < .6 ? "left" : "right"; S2.claspHold = S2.claspOn ? 6 + 3 * this.rand() : 14 + 10 * this.rand();   /* v6.1（採点「待つあいだ腕を体の前に浮かせて止まる」）：重ねるのは短く、ふだんは横に下ろす */   /* v5.7：重ねるのは 6〜10 秒まで（upright）。v5.9：natural（博物館）は v5.6 の長さ（短いと話しながら手を組みかえてそわそわ見えた・11 人） */ S2.cvT = 4 + 3 * this.rand(); S2.cv = [0, 0, 0]; }   // v5.6：くじではなく、重ねない回の次は必ず重ねる（はじめは 3〜6 秒で）
      if (S2.claspOn && (S2.cvT = (S2.cvT ?? 5) - dt) <= 0) { S2.cvT = 3 + 3 * this.rand(); if (this.rand() < .45) S2.claspTop = S2.claspTop === "left" ? "right" : "left"; S2.cvt = [(this.rand() - .5) * .05, (this.rand() - .5) * .06, (this.rand() - .5) * .04]; }   // 小さく組みなおす
      S2.cv ||= [0, 0, 0]; if (S2.cvt) for (let i = 0; i < 3; i++) S2.cv[i] += (S2.cvt[i] - S2.cv[i]) * (1 - Math.exp(-2.5 * dt));
      S2.clasp.t = S2.claspOn && free ? 1 : 0; S2.clasp.step(dt); const cw = S2.clasp.v;
      if (cw > .01 && this.armRest.left && this.armRest.right) { const cv = this._cv ||= { p: new THREE.Vector3(), f: new THREE.Vector3(), n: new THREE.Vector3() };
        for (const sd of ["left", "right"]) { const sg = sd === "left" ? 1 : -1, R = this.armRest[sd], top = sd === S2.claspTop;
          const o2 = S2.cv; cv.p.set(sg * .03 + o2[0], R.sh.y - .56 * this.legLen / .78 + o2[1], R.sh.z + .145 + o2[2] + (top ? .015 : 0));   /* v6.1：下腹の前・体に近く（前へ浮いて見えない） */ cv.f.set(-sg * .6, -.7, .2); cv.n.set(-sg * .25, .1, -1);
          this._armIK(sd, cv.p, cv.f, cv.n, cw * .9); } } }
    // v6.1（採点「待つあいだ腕を体の前に浮かせて止まる＝マネキン」）：手を重ねていない待ちのあいだ、腕を体の横へ下ろす。
    // 肘は少し曲げ（約 30°）、手首は太ももの横（体の中心から約 18 cm＝ローブの脇の外。肩の関節は約 10 cm）、手のひらは腿へ。手の的は肩にばねで遅れてついていく（重心の移し替え・息で肩が動くと、
    // 肘・手首が少し遅れて揺れ、行き過ぎずに静まる＝重さのある腕）。吸う息で手がわずかに外へ。話す身ぶり・指す・礼・歩く・向きかえのあいだは外す
    { const S3 = this.s; S3.hang ||= new Spr(0, 1.6);
      const fr = L && k < .05 && !this.pointing && !this.bowing && !GS.on && !this._turn && g < .05 && g2 < .05;
      S3.hang.t = fr ? .94 * (1 - (S3.clasp?.v || 0)) : 0; S3.hang.step(dt); const hw = S3.hang.v;
      const hv = this._hv ||= { p: new THREE.Vector3(), f: new THREE.Vector3(), n: new THREE.Vector3(), lag: {} };
      for (const sd of ["left", "right"]) { const sg = sd === "left" ? 1 : -1, ua = B[sd + "UpperArm"], la = B[sd + "LowerArm"], hd = B[sd + "Hand"]; if (!ua || !la || !hd || !this.armRest[sd]) continue;
        ua.parent.updateWorldMatrix(true, false); const shp = this.root.worldToLocal(ua.getWorldPosition(_v[1]));
        const lg = hv.lag[sd] ||= [0, 1, 2].map(i => new Spr(shp.getComponent(i), 3.4));   // 肩の位置を、ばねで遅れて追う（腕の重さ）
        for (let i = 0; i < 3; i++) { lg[i].t = shp.getComponent(i); if (this._sprReset || hw < .02) lg[i].set(lg[i].t); lg[i].step(dt); }
        if (hw < .01) continue;
        const Lr = (la.position.length() + hd.position.length()) * this.vs / (this.sc || 1), an = this._al?.[sd];
        const dx = sg * (.066 + .004 * br + .003 * wob(t * .19, this.seedPh + (sd === "left" ? 5 : 8))), dz = .012 + .004 * wob(t * .15, this.seedPh + (sd === "left" ? 2 : 6)) + (an ? .5 * an.x * .1 : 0);
        const dy = Math.sqrt(Math.max(.01, (Lr * .962) ** 2 - dx * dx - dz * dz));
        hv.p.set(lg[0].v + dx, lg[1].v - dy, lg[2].v + dz); hv.f.set(sg * .05, -1, .1); hv.n.set(-sg, 0, -.22);
        this._armIK(sd, hv.p, hv.f, hv.n, hw, hw, hw); } }
    // 指：力を抜いた曲がり（人差し指から小指へ深く）。指すときは人差し指を伸ばす
    // v5：mid・low の段では、指は一こまおき（止まって見えるほどの差はない）
    if (this.q.tier !== "high" && (this.q.n & 1) && !GS.on) return;
    const cu = .2 + .05 * k + (L ? .03 * wob(t * .4, this.seedPh + 2) : 0);   // v6.1（氷川の写しから）：指は力を抜いて少しひらく   // v5：力を抜いた指は少しひらき気味に（身ぶりのあと握ったままに見えない）
    for (const [b, sd, f, j] of this.fingers) { const sg = sd === "left" ? 1 : -1, gw = GS[sd].w, gsh = GS[sd].shape;
      if (f === "Thumb") { const tk = gw * (gsh === "pinch" ? .35 : gsh === "point" ? .2 : 0) + (sd === this._pointSide ? .3 * (this._pointWH || 0) : 0); b.quaternion.setFromEuler(_e.set(0, sg * ((j === "Metacarpal" ? .25 : j === "Proximal" ? .2 : .12) + tk), sg * -((j === "Distal" ? .18 : .06) + tk * .8))); continue; }
      const m = { Index: .78, Middle: 1, Ring: 1.08, Little: 1.2 }[f] * (j === "Proximal" ? 1 : j === "Intermediate" ? 1.15 : .8);
      // v5.4（11 人「指先も揃いすぎ」）：指ごと・左右で少し違う曲がり（いつもの癖）と、ゆっくりした小さな変化
      const fo = (this._fo ||= {})[sd + f] ??= (this.rand() - .5) * .16 + (f === "Index" ? -.04 : 0), fw = L ? .035 * wob(t * .23, this.seedPh + f.length * 1.7 + (sd === "left" ? 0 : 9)) : 0;
      let c = Math.max(.02, cu * m + (fo + fw) * (j === "Distal" ? .6 : 1)); if (sd === (this._pointSide || "") && this._pointWH > 0) { const pH = this._pointWH; c = f === "Index" ? c * (1 - pH) + (j === "Proximal" ? .02 : .08) * pH : c + (f === "Little" ? .65 : .55) * pH; }   // v5.5：人差し指は伸ばしきらない・ほかは握る
      if (sd === "right" && g > 0) c *= 1 - .35 * g; if (sd === "left" && g2 > 0) c *= 1 - .35 * g2;   // 話すとき、手は少しひらく
      if (gw > 1e-3) { const want = (FING[gsh] || FING.open)[f] * (j === "Proximal" ? 1 : j === "Intermediate" ? 1.1 : .8); c += (want - c) * gw; }
      b.quaternion.setFromEuler(_e.set(0, 0, -sg * c)); }
  }

  // v5.4（2026-10-14 11 人「立ち姿の腕がからだから少し離れたまま固まる（A の字）」「息づかいの揺れがあれば人形っぽさが減る」）：
  // 腕は肩からぶら下がる重さのある振り子。①肩が動いた（体重の移し・歩き出し・止まる）ぶん、手は遅れて揺れ、少し行き過ぎて戻る（周期 1.2 秒ほど・減衰）
  // ②胴が傾いても、腕は重さで鉛直へ半分ほど戻る（胴と一緒に固まって傾かない）③吸うと腕が少しだけ外へ、肘が少しゆるむ
  // ④左右で少し違う肘の曲がり（いつもの側）と、数秒〜十数秒でゆっくり変わる肘・手首の向き（同じ形のまま止まらない）。大きさは人の幅の中で小さく（1〜3°）
  _armLife(sd, dt, w) {
    const B = this.bones, ua = B[sd + "UpperArm"], la = B[sd + "LowerArm"], hd = B[sd + "Hand"]; if (!ua || !la || !ua.parent) return;
    const sg = sd === "left" ? 1 : -1, up = this.posture === "upright" ? .6 : 1, L = this.live;
    this._elSide ||= this.rand() < .5 ? "left" : "right";
    const A = (this._al ||= {})[sd] ||= { p: null, v: new THREE.Vector3(), x: 0, vx: 0, z: 0, vz: 0, ph: this.rand() * 60, el: sd === this._elSide ? .1 : .02 };
    const rq = this.root.getWorldQuaternion(_q[2]), wp = ua.getWorldPosition(_v[1]);
    if (L && A.p && dt > 0 && wp.distanceTo(A.p) < .3) {
      const v = _v[2].subVectors(wp, A.p).multiplyScalar(1 / dt), acc = _v[3].subVectors(v, A.v).multiplyScalar(1 / dt); A.v.copy(v);
      acc.y = 0; acc.applyQuaternion(_q[3].copy(rq).invert()); const am = acc.length(); if (am > 6) acc.multiplyScalar(6 / am);
      const w0 = 5.4, z0 = .28, Lr = .4 * this.sc, n = dt > 1 / 50 ? 2 : 1, h = dt / n;
      for (let i = 0; i < n; i++) { A.vx += (-w0 * w0 * A.x - 2 * z0 * w0 * A.vx - .5 * acc.z / Lr) * h;   /* v5.5：半分（止まる前に両手が前へ浮いた＝11 人） */ A.x = clamp(A.x + A.vx * h, -.18, .18);
        A.vz += (-w0 * w0 * A.z - 2 * z0 * w0 * A.vz - acc.x / Lr) * h; A.z = clamp(A.z + A.vz * h, -.15, .15); }
    } else { A.v.set(0, 0, 0); if (!L) { A.x = A.z = A.vx = A.vz = 0; } }
    (A.p ||= new THREE.Vector3()).copy(wp);
    const t = this.t, ph = A.ph, br = this._br || 0, still = (1 - this.k) * up * (L ? 1 : 0);
    // 腕の置き方を、6〜14 秒ごとに左右べつべつに少し変える（肘をゆるめて手が腿の前へ寄る／まっすぐ下ろす／少し後ろ）。ばねでゆっくり移る
    A.ps ||= { el: new Spr(A.el, 1.4), fw: new Spr(0, 1.4), hold: 1 + 5 * this.rand() };
    if (L) { A.ps.hold -= dt; if (A.ps.hold <= 0) { const r = this.rand(); A.ps.hold = 6 + 8 * this.rand();
      [A.ps.el.t, A.ps.fw.t] = r < .45 ? [A.el + .25 + .15 * this.rand(), .07 + .05 * this.rand()] : r < .8 ? [A.el + .05 * this.rand(), .01] : [A.el + .12, -.05]; } }
    A.ps.el.step(dt); A.ps.fw.step(dt);
    const pk = 1 - .8 * this.k;   // 歩くあいだは腕の振り（_arms）が主。振り子は小さく（博物館で、止まる・速さが変わるたびに両腕が前へ出たままに見えた）
    const fwd = A.x * pk + (A.ps.fw.v + .02 * wob(t * .33, ph) + .006 * br) * still, lat = A.z * pk + sg * (.014 * br + .012 * wob(t * .27, ph + 3) + .006 - .25 * Math.max(0, A.ps.fw.v)) * still;
    // 胴の傾きを、腕の重さで半分ほど戻す（肩の親＝胸の上向きを、碧の入れ物の上向きへ）
    const pq = ua.parent.getWorldQuaternion(_q[4]), cu = _v[4].set(0, 1, 0).applyQuaternion(pq), upW = _v[5].set(0, 1, 0).applyQuaternion(rq);
    const qg = _q[5].setFromUnitVectors(cu, upW); _q[1].identity().slerp(qg, .5 * w * (L ? 1 : 0));
    const qp = _q[0].setFromEuler(_e.set(-fwd * w, 0, lat * w)); qp.premultiply(rq).multiply(_q[3].copy(rq).invert());   // 入れ物の向きでの揺れ → 世界
    qp.multiply(_q[1]);   // 世界での変化（揺れ × 重さ）
    ua.quaternion.premultiply(_q[3].copy(pq).invert().multiply(qp).multiply(pq));
    // 肘・手首
    const el = (A.ps.el.v + .045 + .045 * wob(t * .21, ph + 7) + .02 * br) * still * w + Math.max(0, -A.x) * .25 * w * pk;   // 腕が後ろへ揺れるとき、肘が少しゆるむ
    if (el > 1e-4) la.quaternion.multiply(_q[0].setFromEuler(_e.set(0, sg * -el, 0)));
    if (hd && still > 0) hd.quaternion.multiply(_q[0].setFromEuler(_e.set(.07 * wob(t * .25, ph + 11) * still * w, sg * .05 * wob(t * .17, ph + 17) * still * w, sg * .06 * wob(t * .19, ph + 13) * still * w)));
  }

  // ---------------------------------------------------------------- 話の中身に合う身ぶり（v5）
  // 一つの身ぶり＝準備（0.45 秒）→ 打つ（その語の頭の少し前に頂点）→ 止める → 戻す（Kendon 1980 の身ぶりの句）。
  // 次の身ぶりがすぐ来るときは、手を下ろさずにそのまま次の形へ移る（身ぶりの単位がつながる）。指すときは、目が先に的へ行き、止めるあいだ的を見る（Neggers & Bekkering 2000）
  _gParts(g) {
    if (g._parts) return g._parts; const a = Math.max(.3, g.t - .05), H = g.hold;   // 行の頭の語でも、準備の時間をとる
    const P = (side, apex, hold, prep = .55) =>   /* v6.1：準備を 0.55 秒に（立ち上がりが硬い＝Museum） */ ({ g, side, apex, hold: H ?? hold, prep });
    const dom = g.hand === "left" ? "left" : "right", both = g.hand === "both";
    let parts;
    if (g.type === "deictic") parts = [P(g.hand && g.hand !== "both" ? g.hand : null, a, .55, .6)];
    else if (g.type === "metaphoric" && g.shape === "contrast") parts = [P("left", a, 1.25), P("right", a + .75, .5)];   // くらべる語で一つめを左の手に置き、少し遅れて右の手に二つめを置く（両手で見くらべる）
    else if (g.type === "iconic" && (g.shape === "small" || g.shape === "tall") && !both) parts = [P(dom, a, .45)];
    else if (g.type === "metaphoric") parts = both ? [P("left", a, .5), P("right", a, .5)] : [P(dom, a, .5)];
    else parts = [P("left", a, g.shape === "large" ? .3 : .45), P("right", a, g.shape === "large" ? .3 : .45)];   // 大きく広げる形は、止めを短く
    return (g._parts = parts);
  }
  _gPose(part, sd, out) {   // その手の、碧の入れ物から見た位置・指の向き・手のひらの向き・指の形
    const g = part.g, sg = sd === "left" ? 1 : -1, sh = this.armRest[sd].sh, y = sh.y, z = sh.z;
    const set = (x, dy, dz, f, n, shape) => { out.p.set(x, y + dy, z + dz); out.f.set(...f); out.n.set(...n); out.shape = shape; return out; };
    if (g.type === "deictic") {
      if (!g.target) return set(sg * .1, -.4, .29, [0, -.5, 1], [0, -1, 0], "flat");   // 「ここ」：手のひらを下へ、体の前の低いところ
      const tp = g.target.isObject3D ? g.target.getWorldPosition(_v[9]) : _v[9].copy(g.target), tl = this.root.worldToLocal(tp), d = _v[8].subVectors(tl, sh);
      d.y = clamp(d.y / Math.max(.2, Math.hypot(d.x, d.z)), -1.4, .3) * Math.hypot(d.x, d.z); d.normalize(); if (d.z < .2) { d.z = .2; d.normalize(); }   // 体の後ろは指さない（体を回すのは向きの仕事）。足もとの物は下へ向けて指す
      out.p.copy(sh).addScaledVector(d, .36); out.p.y -= .05; out.f.copy(d); out.n.set(-sg * .3, -1, 0); out.shape = "point"; return out; }
    if (g.type === "metaphoric") {
      // くらべる：二つを左右の手に載せて量るように、手のひらを内向き・上に、左右で高さを変える（前へ差し出さない＝「どうぞ」に見えない。11 人の指摘）
      if (g.shape === "contrast") return set(sg * .2, sd === "left" ? -.27 : -.36, .22, [sg * .1, .15, 1], [-sg * .6, .8, 0], "open");
      return set(sg * .12, -.3, .28, [sg * .2, .05, 1], [-sg * .2, 1, 0], "open");   // 差し出す：手のひらを上に（Müller 2004・Kendon 2004）
    }
    switch (g.shape) {
      case "small": return set(sg * .07, -.27, .27, [-sg * .2, .2, 1], [-sg, .7, 0], "pinch");
      case "round": return set(sg * .13, -.24, .27, [-sg * .3, .2, 1], [-sg, .2, 0], "cup");
      case "large": return set(sg * .3, -.22, .24, [sg * .45, .05, 1], [-sg * .7, .45, 0], "open");   // 大きい：胸の下の高さで左右へ（肩の高さまで上げると「お手上げ」「ようこそ」に見える。11 人の指摘）   // 大きい：肩の高さ近くまで、左右に大きく（腕は伸ばしきらない）
      case "long": return set(sg * .27, -.3, .3, [sg * .1, -.05, 1], [-sg, 0, 0], "flat");      // 長い：腰の上の高さで、そろえた手を横の線に
      case "tall": return set(sg * .15, -.05, .2, [0, .3, 1], [0, -1, 0], "flat");
      case "flat": return set(sg * .18, -.33, .27, [0, -.1, 1], [0, -1, 0], "flat");
      default: return set(sg * .065, -.28, .27, [0, .35, 1], [-sg, .5, 0], "cup");   // small-round：両手で小さな丸
    }
  }
  _gestures(dt, sp, beat, amp) {
    const G = this._g ||= Object.fromEntries(["left", "right"].map(s => [s, { w: new Spr(0, 7), wL: new Spr(0, 7.5), wH: new Spr(0, 7.5), p: [0, 1, 2].map(() => new Spr(0, 8)), f: new THREE.Vector3(0, 0, 1), n: new THREE.Vector3(0, 1, 0), shape: "open", tw: 0 }]));
    const res = this._gRes ||= { on: false, left: { w: 0, shape: "open" }, right: { w: 0, shape: "open" } };
    if (!this.armRest.left || !this.armRest.right) { res.on = false; return res; }
    const want = { left: null, right: null };
    if (sp?.gq?.length) { const c = sp.clock();
      for (const g of sp.gq) { if (g.type === "beat") continue;
        for (const part of this._gParts(g)) { const side = part.side || (g.target ? (this.root.worldToLocal((g.target.isObject3D ? g.target.getWorldPosition(_v[9]) : _v[9].copy(g.target))).x >= 0 ? "left" : "right") : "right");
          if (c >= part.apex - part.prep && c <= part.apex + part.hold) { want[side] = part; part.sideNow = side;
            if (g.type === "deictic" && g.target && !part.gz && c >= part.apex - .35) { part.gz = 1; this._gz = { p: g.target, until: this.t + (part.apex + part.hold * .85 - c) }; } } } } }
    const tmp = this._gTmp ||= { p: new THREE.Vector3(), f: new THREE.Vector3(), n: new THREE.Vector3(), shape: "open" };
    res.on = false;
    for (const sd of ["left", "right"]) { const S = G[sd], part = want[sd];
      S.w.t = part ? amp : 0; S.w.step(dt);
      // v6.1：上げるときは肩→肘→手首の順、下ろすときは手首→肘→肩の順（重なりの遅れ。一度に動く腕は「からくり」に見える）
      const up = S.w.t >= S.w.v - 1e-4; if (up) { S.wL.t = S.w.v; S.wH.t = S.wL.v; } else { S.wH.t = S.w.t; S.wL.t = S.wH.v; }
      S.wL.step(dt); S.wH.step(dt);
      const wu = up ? S.w.v : Math.max(S.w.v, S.wL.v), wl = Math.min(wu, S.wL.v), wh = Math.min(wl, S.wH.v);
      if (part) { this._gPose(part, sd, tmp); const snap = S.w.v < .04; for (let i = 0; i < 3; i++) { S.p[i].t = tmp.p.getComponent(i); if (snap) S.p[i].set(S.p[i].t); S.p[i].step(dt); }
        S.f.lerp(tmp.f.normalize(), snap ? 1 : 1 - Math.exp(-10 * dt)); S.n.lerp(tmp.n.normalize(), snap ? 1 : 1 - Math.exp(-10 * dt)); S.shape = tmp.shape; }
      const w = wu; res[sd].w = w; res[sd].shape = S.shape; if (w < 2e-3) continue; res.on = true;
      // 拍子：止めているあいだも、強める語では手が小さく下へ打つ（2〜3 cm）。「ここ」は頂点で小さく下へ
      const p = _v[7].set(S.p[0].v, S.p[1].v, S.p[2].v); p.y -= .026 * beat * (sd === "right" ? 1 : .7);
      const hp = this.live ? .0018 * wob(this.t * .33, this.seedPh + (sd === "left" ? 7 : 9)) : 0; p.x += hp; p.y += hp * .7 + .0015 * (this._br || 0);   // v6.1：止めている手は揺らし続けない（HP の採点）。息に合わせたごくゆっくりした動きだけ
      this._armIK(sd, p, S.f, S.n, wu, wl, wh); }
    return res;
  }
  // 腕の二関節の IK（手首を p〈碧の入れ物から見た位置〉へ。肘は下・後ろ・少し外へ）。手の向きは指 f・手のひら n。w＝効き
  _armIK(sd, pLocal, fL, nL, w, wL = w, wH = w) {   // v6.1：wL・wH＝肘から先・手首の効き（肩→肘→手首の順に効かせるため。省くと w と同じ）
    const B = this.bones, ua = B[sd + "UpperArm"], la = B[sd + "LowerArm"], hd = B[sd + "Hand"], R = this.armRest[sd]; if (!ua || !la || !hd || !R) return;
    const sg = sd === "left" ? 1 : -1, rq = this.root.getWorldQuaternion(_q[5]);
    ua.parent.updateWorldMatrix(true, false);
    const A = ua.getWorldPosition(_v[3]), l1 = la.position.length() * this.vs, l2 = hd.position.length() * this.vs;
    const T = this.root.localToWorld(_v[0].copy(pLocal)), AT = _v[4].subVectors(T, A); let d = AT.length(); const dir = AT.divideScalar(d || 1);
    d = clamp(d, Math.abs(l1 - l2) + .02 * this.sc, (l1 + l2) * .97);
    const ca = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), sa = Math.sqrt(1 - ca * ca);
    const pole = _v[5].set(sg * .5, -1, -.35).applyQuaternion(rq); pole.addScaledVector(dir, -pole.dot(dir)).normalize();
    const K = _v[6].copy(A).addScaledVector(dir, l1 * ca).addScaledVector(pole, l1 * sa), Tc = _v[1].copy(A).addScaledVector(dir, d);
    // 上腕：肘の向き＋ねじれ（肘を曲げると前腕が体の前へ来る向きを、手の側へ合わせる）
    const pqi = ua.parent.getWorldQuaternion(_q[0]).invert();
    const w1 = _v[8].subVectors(K, A).normalize().applyQuaternion(pqi), q1 = _q[1].setFromUnitVectors(_v[9].copy(la.position).normalize(), w1);
    const fw = _v[2].copy(R.fold).applyQuaternion(q1), fd = _v[7].subVectors(Tc, K).applyQuaternion(pqi);
    fw.addScaledVector(w1, -fw.dot(w1)); fd.addScaledVector(w1, -fd.dot(w1));
    if (fw.lengthSq() > 1e-8 && fd.lengthSq() > 1e-8) { fw.normalize(); fd.normalize(); const ang = Math.atan2(_v[4].crossVectors(fw, fd).dot(w1), fw.dot(fd)); q1.premultiply(_q[2].setFromAxisAngle(w1, ang)); }
    ua.quaternion.slerp(q1, w); ua.updateWorldMatrix(false, false);
    // 前腕：いまの肘から手首の的へ
    const E = la.getWorldPosition(_v[6]), uqi = ua.getWorldQuaternion(_q[0]).invert(), w2 = _v[8].subVectors(Tc, E).normalize().applyQuaternion(uqi);
    la.quaternion.slerp(_q[1].setFromUnitVectors(_v[9].copy(hd.position).normalize(), w2), wL); la.updateWorldMatrix(false, false);
    // 手：静止の形の（指・手のひら）を、ねらいの（指・手のひら）へ回す
    const f = _v[2].copy(fL).normalize(), n = _v[4].copy(nL); n.addScaledVector(f, -n.dot(f)).normalize(); const b = _v[7].crossVectors(f, n);
    const Md = _m.makeBasis(f, n, b), Mr = (this._mr ||= new THREE.Matrix4()).makeBasis(R.f, R.n, R.b).transpose();
    const qd = _q[2].setFromRotationMatrix(Md.multiply(Mr)), qw = _q[3].copy(rq).multiply(qd).multiply(R.RL);
    const lqi = la.getWorldQuaternion(_q[0]).invert(); hd.quaternion.slerp(lqi.multiply(qw), wH * .9);
  }

  // ---------------------------------------------------------------- 目と頭：目が先に（サッカード）、頭は 0.1〜0.2 秒遅れてついていく。ときどき目をそらす
  _headEyes(dt, cam) {
    const Lk = this.look, B = this.bones, L = this.live;
    const head = B.head; if (!head) return;
    // 見る先
    const tgt = _v[0];
    const po = this.pointing;
    if (po && po.t < po.sec - .6 && po.t > .05) tgt.copy(po.p);
    else if (Lk.target) { if (Lk.target.isObject3D) Lk.target.getWorldPosition(tgt); else tgt.copy(Lk.target); }
    else if (cam) tgt.copy(cam); else tgt.set(this.pos.x + Math.sin(this.yaw) * 3, 1.5 * this.sc, this.pos.z + Math.cos(this.yaw) * 3);
    // 歩くとき：ふだんは 5〜8 m 先の道を見て、ときどき（3〜6 秒ごとに 1 秒ほど）見る人を見る
    if (!Lk.target && !(po && po.t < po.sec - .6) && this.k > .45) { Lk.wg = (Lk.wg ?? 2) - dt; if (Lk.wg < -1.1) Lk.wg = 3 + 3 * this.rand();
      if (Lk.wg > 0) { const d = 6.5 * this.sc; tgt.set(this.pos.x + Math.sin(this.yaw) * d, 1.15 * this.sc + this.pos.y, this.pos.z + Math.cos(this.yaw) * d); } }
    { const tr = this._turn; if (tr && !Lk.target && !po && this.faceYaw != null) { const hp = head.getWorldPosition(_v[1]), ya = this.yaw + clamp(wrapA(tr.y1 - this.yaw), -.75, .75);   // 頭は体より 45° ほどまで先に（真横まで振り向かない）
      tgt.set(hp.x + Math.sin(ya) * 3 * this.sc, hp.y, hp.z + Math.cos(ya) * 3 * this.sc); } }   // v5：向きかえは、目と頭が先に新しい向きへ
    if (this._gz && this.t < this._gz.until && !po) { const g = this._gz.p; if (g.isObject3D) g.getWorldPosition(tgt); else tgt.copy(g); } else if (this._gz) this._gz = null;   // v5：話しながら指すとき、目は先に的へ行き、止めるあいだ的を見る
    if (this._bowA > .05) { const hp = head.getWorldPosition(_v[1]); tgt.set(hp.x + Math.sin(this.yaw) * 2, this.pos.y, hp.z + Math.cos(this.yaw) * 2); }   // 礼のときは足もとの少し先（目を伏せる）
    // 目をそらす：話しはじめ・考えるとき・ふだんもときどき（下や横へ。上はまれ）
    if (L) { Lk.awayT -= dt;
      const sp = this.speaking, startAway = sp && sp.startAway && sp.clock() < .9;
      if (startAway && Lk.away <= 0) { Lk.away = .3 + .2 * this.rand(); this._pickAway(true); sp.startAway = false; }   // v5.6：小さく短く
      if (Lk.awayT <= 0 && !po && this._bowA < .05 && this.k < .3) { Lk.awayT = (this.listening ? 9 : sp ? 3.5 : 5) + 6 * this.rand(); if (!this.listening && !sp) {   /* v5.6：話しているあいだは、ときどきそらさない（聞き手を見る） */ Lk.away = .5 + 1.1 * this.rand(); this._pickAway(); } } }
    { const sp2 = this.speaking; if (sp2 && Lk.away > 0 && sp2.clock() > (sp2.dur || 3) - .8) Lk.away = 0; }   // v5.6：言い終わりは必ず目が合う
    if (Lk.away > 0) { Lk.away -= dt; const hp = head.getWorldPosition(_v[1]); tgt.copy(hp).add(Lk.awayDir); }
    // 大きく動いたら：目は一気に（サッカード）、頭はばねで。視線が大きく動くときにまばたき
    const hpos = head.getWorldPosition(_v[2]);
    const dNew = _v[3].subVectors(tgt, hpos).normalize(), dOld = _v[4].subVectors(Lk.cur, hpos).normalize();
    const jump = dNew.angleTo(dOld);
    if (jump > .04) { if (jump > .25 && !(po && po.t < 1.2) && this.rand() < clamp(.35 + jump, 0, .9)) this.blink.next = Math.min(this.blink.next, .02); Lk.cur.copy(tgt); }   // v5.6：指す目の動きではまばたきしない   // v4：大きく見る先を変えるほど、まばたきしやすい（目の動きとまばたきの結びつき）
    else Lk.cur.lerp(tgt, 1 - Math.exp(-12 * dt));   // ゆっくり動くものは目で追う
    // 頭の向き：胸から見た角度の 7 割（目が残りを受け持つ）。首 4 割・頭 6 割
    const ch = (B.upperChest || B.chest || B.spine); const cq = ch.getWorldQuaternion(_q[0]).invert();
    const dl = _v[5].subVectors(Lk.cur, hpos).applyQuaternion(cq);
    const yawT = Math.atan2(dl.x, dl.z), pitT = Math.atan2(-dl.y, Math.hypot(dl.x, dl.z));
    Lk.hy.t = clamp(yawT * .72, -.85, .85) * (L ? 1 : .6);   /* v6.1：首だけで真横を向かない（採点「胴は正面のまま首だけ 90°」） */ Lk.hp.t = clamp(pitT * .6, -.35, .45);
    Lk.hy.step(dt); Lk.hp.step(dt);
    const nk = B.neck; const qy = _q[1], qn = _q[2];
    // 大きく振り向くときは、胸も少し回す（首だけで回さない）。目→頭→胸の順に遅れて
    const hyv = Lk.hy.v, big = Math.sign(hyv) * Math.max(0, Math.abs(hyv) - .25) * .6; Lk.cy = (Lk.cy ?? 0) + (big - (Lk.cy ?? 0)) * (1 - Math.exp(-4 * dt));
    const cb = B.upperChest || B.chest; if (cb && Math.abs(Lk.cy) > 1e-4) cb.quaternion.premultiply(_q[3].setFromEuler(_e.set(0, Lk.cy, 0)));
    const hy2 = hyv - Lk.cy;
    if (nk) { qn.setFromEuler(_e.set(Lk.hp.v * .4, hy2 * .4, 0)); nk.quaternion.premultiply(qn); }
    qy.setFromEuler(_e.set(Lk.hp.v * .6, hy2 * .6, 0)); head.quaternion.premultiply(qy);
    // 頭を水平に保つ（立ち直り反射）：胴の揺れ（人の記録）で頭が左右に傾いた分の 7 割を、首から上で戻す。首をかしげる動きは残す
    if (this.mc && this.mcW.v > .01) { head.updateWorldMatrix(true, false); const hq = head.getWorldQuaternion(_q[3]), u = _v[6].copy(UP).applyQuaternion(hq.invert());
      const roll = Math.atan2(-u.x, u.y), want = (this._tiltA || 0); head.quaternion.multiply(_q[4].setFromAxisAngle(_v[7].set(0, 0, 1), (roll + want) * .7 * this.mcW.v));   // roll＝いまの傾き（かしげる分は −tilt）
      // 上下も：記録の背の丸みで頭が下を向いた分を、見る先の高さに合わせて半分戻す（前髪の下から上目づかいに見ない）。礼・うなずきの最中はしない
      if (this._bowA < .03) { head.updateWorldMatrix(true, false); const f = _v[6].set(0, 0, 1).applyQuaternion(head.getWorldQuaternion(_q[3])), e = Math.asin(clamp(f.y, -1, 1));
        const et = Math.atan2(Lk.cur.y - hpos.y, Math.hypot(Lk.cur.x - hpos.x, Lk.cur.z - hpos.z)) * .6; head.quaternion.multiply(_q[4].setFromAxisAngle(_v[7].set(1, 0, 0), -clamp(et - e, -.2, .2) * .5 * this.mcW.v)); } }
    // 目の小さな動き（固視中のマイクロサッカード：1 秒に 1〜2 回、1° 未満）
    if (L) { Lk.sacT -= dt; if (Lk.sacT <= 0) { Lk.sacT = .35 + .7 * this.rand(); const d = Lk.cur.distanceTo(hpos) * .012; Lk.sac.set((this.rand() - .5) * d, (this.rand() - .5) * d * .7, (this.rand() - .5) * d); } }
    // v4：見る人の顔を見るときは、相手の左の目・右の目・ときどき口元へと、0.5〜1.6 秒ごとに小さく跳ぶ（ずっと一点を見つめると、目が据わって見える）
    let scan = Lk.scan || (Lk.scan = new THREE.Vector3());
    if (L && cam && !Lk.target && !po && Lk.away <= 0 && this.k < .3 && this._bowA < .05 && cam.distanceTo(Lk.cur) < .05) { Lk.scanT = (Lk.scanT ?? .8) - dt;
      if (Lk.scanT <= 0) { Lk.scanT = .5 + 1.1 * this.rand(); const r = this.rand(), side = (Lk.scanSide = -(Lk.scanSide || 1)), sp2 = this.speaking ? .25 : .12, cr = _v[6].set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
        if (r < sp2) scan.set(0, -.065 * this.sc, 0); else scan.copy(cr).multiplyScalar(side * .032 * this.sc); } }
    else scan.multiplyScalar(Math.exp(-10 * dt));
    this.gazeObj.position.copy(Lk.cur).add(Lk.sac).add(scan);
    // 下を見るとき、上まぶたも少し下がる
    { const el = Math.atan2(Lk.cur.y - hpos.y, Math.hypot(Lk.cur.x - hpos.x, Lk.cur.z - hpos.z)); this._lidDown = clamp(-el - .16, 0, .5) * .3;   /* v5.7：控えめに */ this._lidUp = clamp(el - .1, 0, .4) * .3; }   // v4：上を見るときは上まぶたが少し上がる
  }
  _pickAway(small = false) { const a = this.pz.away * (small ? .55 : 1), r = this.rand(), s = this.rand() < .5 ? -1 : 1, y = this.yaw + s * (small ? .32 + .12 * this.rand() : .22 + .3 * this.rand()) * a;   /* v4：目をそらす幅を 13〜30° に（大きく振り向くと唐突） */ const dn = (r < .4 ? -(.12 + .18 * this.rand()) : r < .9 ? -.03 : .12) * a;   /* v5.7：下へ大きく伏せない */   /* upright：目をそらす幅を小さく（うつむかない） */
    this.look.awayDir.set(Math.sin(y) * 2, dn * 2, Math.cos(y) * 2); }

  // ---------------------------------------------------------------- まばたき・表情・口
  _faceTick(dt) {
    const em = this.vrm.expressionManager; if (!em) return; const Bk = this.blink, Fc = this.face, L = this.live, sp = this.speaking;
    // まばたき：間隔は対数正規（ふだん中央値 3.4 秒・話すと 2.4 秒・聞くと 4 秒・考えるとき少し多い）。一割ほど二度まばたき。
    // v4：一回ごとに速さを変える（閉じる 55〜90ms・止まる 20〜60ms・ひらく 120〜220ms）。ときどき半分だけ・ゆっくりのまばたき（考えるとき）
    Bk.next -= dt;
    if (Bk.t < 0 && Bk.next <= 0) { Bk.t = 0; const r = this.rand(); Bk.amp = 1;   /* v5.4：半分だけのまばたきはやめた（止めたこまで左右の違う半目＝にらんで見えた＝11 人） */ const slow = Fc.emo === "thinking" || this.rand() < .08 ? 1.5 : 1;
      Bk.c = (.055 + .035 * this.rand()) * slow; Bk.h = .02 + .04 * this.rand(); Bk.o = (.12 + .1 * this.rand()) * slow; }
    if (Bk.t >= 0) { Bk.t += dt; const u = Bk.t, c = Bk.c || .07, h = Bk.h || .04, o = Bk.o || .16; Bk.v = Bk.amp * (u < c ? sstep(u / c) : u < c + h ? 1 : 1 - sstep((u - c - h) / o));
      if (u >= c + h + o) { Bk.t = -1; Bk.v = 0; const med = sp ? 3 : this.listening ? 4 : Fc.emo === "thinking" ? 2.8 : 3.4; Bk.next = !sp && this.rand() < .09 ? .12 + .1 * this.rand() : Math.max(sp ? 1.4 : .7, med * Math.exp(.5 * this._gauss()));   /* v5.6：話しながらは間を広く・二度まばたきなし */ } }
    // まぶたは視線についていく：下を見ると上まぶたが下がり、上を見ると少し上がる（v4：上を見るときも）
    em.setValue("blink", Math.min(1, Math.max(Bk.v + (this._lidDown || 0) + .02, this.eyesClosed || 0)));   // eyesClosed（0..1）＝アプリが目を閉じさせたいとき（胡蝶の夢の「感じている」窓）
    // 表情：いまの感情へゆっくり寄せ、小さな揺らぎを足す。話すと口の笑みは半分（口の形とぶつかるので）
    if (Fc.hold > 0 && Fc.hold < 1e8) { Fc.hold -= dt; if (Fc.hold <= 0) { Fc.emo = this.listening ? "warm" : "calm"; Fc.emoW.t = 1; } }
    Fc.emoW.step(dt); const E = EMOTIONS[Fc.emo] || EMOTIONS.calm, t = this.t, sd = this.seedPh;
    if (Fc.flash > 0) Fc.flash -= dt;
    const fl = Fc.flash > 0 ? Math.sin(Math.PI * clamp(1 - Fc.flash / .45, 0, 1)) : 0;   // 眉を上げる（あいさつ・話しはじめ。約 0.2〜0.4 秒）
    // v4：立っているだけのときも顔を止めない。6〜14 秒ごとに、ごく小さな気分の動き（ふっと口元がゆるむ・少し考える・眉が動く）を 1.5〜3 秒
    if (L && !sp && !this.listening && Fc.emo === "calm") { Fc.idleT = (Fc.idleT ?? 4 + 4 * this.rand()) - dt;
      if (Fc.idleT <= 0) { Fc.idleT = 6 + 8 * this.rand(); const r = this.rand(); Fc.mic = r < .45 ? { smile: .08, cheek: .2, lidLow: .1 } : r < .7 ? { browSad: .1, lidLow: .06 } : r < .9 ? { browUp: .1 } : { smile: -.05 }; Fc.micT = 1.5 + 1.5 * this.rand(); Fc.micA = 0; } }
    if (Fc.micT > 0) { Fc.micT -= dt; Fc.micA = Math.min(1, (Fc.micA || 0) + dt / .6); } else Fc.micA = Math.max(0, (Fc.micA || 0) - dt / .9);
    // v4：左右の差を、ときどき（2〜6 秒ごと）少し変える。いつもの側は保つ
    Fc.asymT -= dt; if (Fc.asymT <= 0) { Fc.asymT = 2 + 4 * this.rand(); Fc.asym.t = Fc.side + (this.rand() - .5) * .14; } Fc.asym.step(dt);
    const talkMouth = sp ? .45 : 1, asym = L ? Fc.asym.v : 0;
    for (const [ch, o] of Object.entries(Fc.ch)) {
      let v = (E[ch] || 0) * Fc.emoW.v + (Fc.mic?.[ch] || 0) * (Fc.micA || 0);
      if (ch === "smile") v *= talkMouth;
      if (ch === "browUp") v += .2 * fl + .1 * (this._beat || 0);   // v5.4：眉を上げる量を控えめに（前髪の上に眉が浮いて二重に見えた＝11 人）   // 強く読む音で眉が少し上がる
      if (ch === "wide") v += (this._lidUp || 0);   // 上を見ると上まぶたが少し上がる
      if (sp && (ch === "smile" || ch === "lidLow" || ch === "cheek")) { const c = sp.clock(), e = sstep((c - (sp.dur - .9)) / .5); v += (ch === "smile" ? .16 : ch === "cheek" ? .3 : .12) * e; }   // 言い終わりに、頬が少し上がる
      if (ch === "lidLow" || ch === "cheek") v *= 1 - .7 * (this.blink.v || 0);   // まばたきの最中は下まぶたを戻す（目を閉じきったように見せない）
      if (L) v += (ch === "smile" ? .035 : ch.startsWith("brow") ? (sp ? .07 : .03) : .015) * wob(t * (sp ? .9 : .5), sd + ch.length);
      if (ch === "browUp" && this.listening) v += .08;
      o.v.t = clamp(v, 0, CHMAX[ch] ?? 1); o.v.step(dt);
      const ak = ch === "smile" ? 1 : ch.startsWith("brow") ? (ch === "browUp" && this._beat ? 1.6 : .7) : 0;   // 眉は拍のとき片方が少し強い
      for (const [m, i, w, s] of o.binds) m.morphTargetInfluences[i] = clamp(o.v.v * w * (1 + s * asym * ak * 2), 0, 1);
    }
    if (this.tint) this.tint.set(.12 + (Fc.ch.cheek?.v.v || 0) * .24);   // v5.6：頬にいつもうっすら血色   // 頬が上がるほど、頬の血色を少し上げる
    // 口：時刻表の母音へ（音より 40ms 先に形をつくる）。声の大きさで開きを変える。唇を閉じる子音は閉じる
    // v4：①音の頭（子音）で口を少し閉じる（同じ母音が続いても口が動く＝ゴムの口にしない）②音の終わり 3 割で次の母音へ寄せる（調音結合）③句の切れ目では閉じきらず少しあける
    const want = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };
    if (sp) { const c = sp.clock() + .04, M = sp.tl.m || []; while (sp.i < M.length - 1 && M[sp.i][0] + M[sp.i][1] <= c) sp.i++;
      const mo = M[sp.i]; if (mo && c >= mo[0] && c < mo[0] + mo[1] + .02) { const [st, len, v, cl] = mo; const vis = VIS[v]; const ph = (c - st) / Math.max(.01, len);
        const open = sp.level ? clamp(.55 + .6 * sp.level(), .5, 1.1) : 1; const close = cl && ph < .35 ? sstep(ph / .35) : 1, onset = v === "pau" || v === "cl" ? 1 : .72 + .28 * sstep(ph / .22);
        if (vis) for (const [kk, w] of Object.entries(vis)) want[kk] = w * open * close * onset;
        const nx = M[sp.i + 1], nv = nx && VIS[nx[2]]; if (nv && ph > .7 && nx[0] - (st + len) < .05) { const b = sstep((ph - .7) / .3) * .45 * (nx[3] ? .4 : 1); for (const kk of MOUTH) want[kk] = want[kk] * (1 - b) + (nv[kk] || 0) * open * b; } } }
    for (const kk of MOUTH) { const s = Fc.mouth[kk]; s.t = want[kk]; s.step(dt, want[kk] > s.v ? 30 : 22); em.setValue(kk, clamp(s.v, 0, 1)); }   // 開くのは速く・閉じるのは少しゆっくり
  }
  _gauss() { let u = 0, v = 0; while (!u) u = this.rand(); while (!v) v = this.rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
}
