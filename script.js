(() => {
  "use strict";

  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => Array.from(root.querySelectorAll(q));

  const CONTRACT = "0xf97522ABEf762d28729E073019343b72C6e8D2C1";
  const EMAIL    = "contact@brbrt.com";

  const SOUND_FILES = {
    ambience: "assets/atmosphere-sound-effect.mp3",
    click:    "assets/Click.mp3",
    music:    "assets/Hero.m4a"
  };

  const reduceMotion = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const saveData     = !!navigator.connection?.saveData;

  /* ─── CUSTOM CURSOR ─────────────────────────────────────────── */
  function initCursor() {
    if (reduceMotion) return;
    const cursor = $("#cursor");
    const trail  = $("#cursorTrail");
    if (!cursor || !trail) return;

    let mx = -100, my = -100;
    let tx = -100, ty = -100;

    document.addEventListener("mousemove", e => {
      mx = e.clientX; my = e.clientY;
      cursor.style.left = mx + "px";
      cursor.style.top  = my + "px";
    });

    const lerp = (a, b, t) => a + (b - a) * t;
    const animTrail = () => {
      tx = lerp(tx, mx, 0.12);
      ty = lerp(ty, my, 0.12);
      trail.style.left = tx + "px";
      trail.style.top  = ty + "px";
      requestAnimationFrame(animTrail);
    };
    requestAnimationFrame(animTrail);

    const hoverEls = "a, button, .chip, .chatbot__suggest, .partner";
    document.addEventListener("mouseover", e => { if (e.target.closest(hoverEls)) cursor.classList.add("hover"); });
    document.addEventListener("mouseout",  e => { if (e.target.closest(hoverEls)) cursor.classList.remove("hover"); });
    document.addEventListener("mouseleave", () => { cursor.style.opacity = "0"; trail.style.opacity = "0"; });
    document.addEventListener("mouseenter", () => { cursor.style.opacity = "1"; trail.style.opacity = "1"; });
  }

  /* ─── TOAST ─────────────────────────────────────────────────── */
  let toastTimer = null;
  function flashToast(msg) {
    let el = $("#toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; document.body.appendChild(el); }
    el.textContent = msg;
    el.style.opacity = "1";
    el.style.transform = "translateX(-50%) translateY(-4px)";
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateX(-50%) translateY(0)";
    }, 1600);
  }

  /* ─── COPY ───────────────────────────────────────────────────── */
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const t = document.createElement("textarea");
      t.value = text;
      Object.assign(t.style, { position: "fixed", left: "-9999px" });
      document.body.appendChild(t); t.select(); document.execCommand("copy"); document.body.removeChild(t);
    }
  }

  function setEmailSlot() {
    const slot = $("#emailSlot"); if (!slot) return;
    slot.innerHTML = `<button class="chip" id="emailBtn" type="button" aria-label="Copy email">${EMAIL} ⧉</button>`;
    $("#emailBtn")?.addEventListener("click", async () => { await copyText(EMAIL); sfxClick(); flashToast("Email copied ✓"); });
  }

  function wireCopyButtons() {
    $("#copyCA")?.addEventListener("click", async () => { await copyText(CONTRACT); sfxClick(); flashToast("Contract address copied ✓"); });
    $$("[data-copy]").forEach(el => {
      el.addEventListener("click", async () => {
        const t = el.getAttribute("data-copy"); if (!t) return;
        await copyText(t); sfxClick(); flashToast("Copied ✓");
      });
    });
    $("#copyEmail")?.addEventListener("click",       async () => { await copyText(EMAIL); sfxClick(); flashToast("Email copied ✓"); });
    $("#copyEmailFooter")?.addEventListener("click", async () => { await copyText(EMAIL); sfxClick(); flashToast("Email copied ✓"); });
  }

  /* ─── NAV SCROLL ─────────────────────────────────────────────── */
  function initNavScroll() {
    const nav = $("#nav"); if (!nav) return;
    const update = () => nav.classList.toggle("scrolled", window.scrollY > 40);
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ─── MOBILE MENU ────────────────────────────────────────────── */
  function wireMenu() {
    const menuBtn = $("#menuBtn"), mobile = $("#mobileMenu");
    if (!menuBtn || !mobile) return;
    const close = () => { menuBtn.setAttribute("aria-expanded","false"); mobile.setAttribute("aria-hidden","true"); mobile.hidden = true; };
    const open  = () => { menuBtn.setAttribute("aria-expanded","true");  mobile.setAttribute("aria-hidden","false"); mobile.hidden = false; };
    close();
    menuBtn.addEventListener("click", () => { sfxClick(); menuBtn.getAttribute("aria-expanded")==="true" ? close() : open(); });
    $$("#mobileMenu a").forEach(a => a.addEventListener("click", close));
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
    window.addEventListener("resize", () => { if (window.innerWidth > 900) close(); }, { passive: true });
  }

  /* ─── REVEAL ─────────────────────────────────────────────────── */
  function initReveal() {
    const els = $$(".reveal"); if (!els.length) return;
    if (!("IntersectionObserver" in window)) { els.forEach(el => el.classList.add("in")); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const delay = e.target.closest(".story__grid,.proofGrid,.roadmapGrid,.tokenGrid,.buySteps")
          ? Array.from(e.target.parentElement.children).indexOf(e.target) * 80 : 0;
        setTimeout(() => e.target.classList.add("in"), delay);
        io.unobserve(e.target);
      });
    }, { threshold: 0.1 });
    els.forEach(el => io.observe(el));
  }

  /* ─── VIDEO ENGINE ───────────────────────────────────────────── */
  function loadVideoSources(video) {
    $$("source[data-src]", video).forEach(s => { if (!s.src && s.dataset.src) s.src = s.dataset.src; });
    try { video.load(); } catch {}
  }

  async function safePlay(video) {
    try {
      video.muted = true; video.setAttribute("muted",""); video.setAttribute("playsinline",""); video.playsInline = true;
      const p = video.play(); if (p?.then) await p; return true;
    } catch { return false; }
  }

  function attachFreezeGuard(video) {
    let lastTime = -1, lastTick = performance.now(), timer = 0;
    const tick = async () => {
      if (document.hidden) return;
      const now = performance.now(), ct = Number(video.currentTime || 0);
      if (!video.paused && Math.abs(ct - lastTime) < 0.001 && now - lastTick > 2200) {
        try { video.pause(); } catch {} try { video.currentTime = Math.max(0, ct - 0.05); } catch {}
        try { video.load(); } catch {} await safePlay(video); lastTick = now; lastTime = Number(video.currentTime || 0);
      } else { lastTick = now; lastTime = ct; }
      timer = window.setTimeout(tick, 700);
    };
    video.addEventListener("playing", () => { if (!timer) timer = window.setTimeout(tick, 700); });
    video.addEventListener("pause",   () => { if (timer) { clearTimeout(timer); timer = 0; } });
    video.addEventListener("stalled", async () => { try { video.load(); } catch {} await safePlay(video); });
    video.addEventListener("waiting", async () => { await safePlay(video); });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && timer) { clearTimeout(timer); timer = 0; }
      else if (!video.paused) timer = window.setTimeout(tick, 700);
    });
  }

  function initManagedVideo(video, { tapBtn = null, readyClassTarget = null, threshold = 0.25, rootMargin = "600px 0px" } = {}) {
    if (!video || reduceMotion || saveData) return;
    const start = async () => {
      loadVideoSources(video);
      const ok = await safePlay(video);
      if (ok) { readyClassTarget?.classList.add("is-ready"); tapBtn?.classList.remove("is-visible"); }
      else tapBtn?.classList.add("is-visible");
    };
    tapBtn?.addEventListener("click", async () => { tapBtn.classList.remove("is-visible"); await start(); });
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(entries => {
        const e = entries[0]; if (!e) return;
        if (e.isIntersecting) { "requestIdleCallback" in window ? requestIdleCallback(() => start(), { timeout: 1800 }) : setTimeout(start, 900); }
        else try { video.pause(); } catch {}
      }, { threshold, rootMargin });
      io.observe(video);
    } else { setTimeout(start, 900); }
    const arm = () => { start(); cleanup(); };
    const cleanup = () => { window.removeEventListener("touchstart", arm); window.removeEventListener("click", arm); };
    window.addEventListener("touchstart", arm, { passive: true });
    window.addEventListener("click",      arm, { passive: true });
    attachFreezeGuard(video);
  }

  function initVideos() {
    const hero = $("#heroVideo"), heroTap = $("#heroPlay");
    if (hero) initManagedVideo(hero, { tapBtn: heroTap, readyClassTarget: hero, threshold: 0.35, rootMargin: "0px 0px" });
    const logo = $(".logoVideo");
    if (logo) initManagedVideo(logo, { threshold: 0.15, rootMargin: "800px 0px" });
  }

  function initRoadmapBgVideo() {
    const section = $("[data-bgvideo]"); if (!section) return;
    const v = section.querySelector("video"); if (!v) return;
    if (reduceMotion || saveData) { try { v.pause(); } catch {} v.removeAttribute("autoplay"); return; }
    const loadSources = () => { $$("source[data-src]", v).forEach(s => { if (!s.src) s.src = s.dataset.src; }); try { v.load(); } catch {}; };
    const tryPlay = () => { v.muted = true; v.playsInline = true; const p = v.play?.(); if (p?.catch) p.catch(() => {}); };
    const arm = () => { loadSources(); tryPlay(); ["touchstart","click","scroll"].forEach(e => window.removeEventListener(e, arm)); };
    ["touchstart","click","scroll"].forEach(e => window.addEventListener(e, arm, { passive: true }));
    if (!("IntersectionObserver" in window)) { loadSources(); tryPlay(); return; }
    const io = new IntersectionObserver(entries => {
      const e = entries[0]; if (!e) return;
      if (e.isIntersecting) { loadSources(); tryPlay(); } else try { v.pause(); } catch {}
    }, { rootMargin: "300px 0px", threshold: 0.08 });
    io.observe(section);
    document.addEventListener("visibilitychange", () => { if (document.hidden) try { v.pause(); } catch {} else tryPlay(); });
  }

  /* ─── SOUND ──────────────────────────────────────────────────── */
  const audio = { ctx: null, master: null, ambience: null, music: null, click: null, armed: false, enabled: false };
  let ambienceNode = null, musicNode = null;

  async function loadAudioBuffer(url) {
    const res = await fetch(url, { cache: "force-cache" }).catch(() => null); if (!res) return null;
    const arr = await res.arrayBuffer().catch(() => null); if (!arr) return null;
    return await audio.ctx.decodeAudioData(arr).catch(() => null);
  }

  function playBuffer(buffer, { volume = 0.8, loop = false } = {}) {
    const src = audio.ctx.createBufferSource(); src.buffer = buffer; src.loop = loop;
    const gain = audio.ctx.createGain(); gain.gain.value = volume;
    src.connect(gain).connect(audio.master); src.start(0);
    return { src, gain };
  }

  async function armAudio() {
    if (audio.armed) return true;
    if (!(window.AudioContext || window.webkitAudioContext)) return false;
    audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
    audio.master = audio.ctx.createGain(); audio.master.gain.value = 0.85; audio.master.connect(audio.ctx.destination);
    const [amb, clk, mus] = await Promise.all([loadAudioBuffer(SOUND_FILES.ambience), loadAudioBuffer(SOUND_FILES.click), loadAudioBuffer(SOUND_FILES.music)]);
    audio.ambience = amb; audio.click = clk; audio.music = mus; audio.armed = true; return true;
  }

  function sfxClick() {
    if (!audio.armed || !audio.enabled || !audio.click) return;
    playBuffer(audio.click, { volume: 0.5, loop: false });
  }

  async function toggleSound() {
    const btn = $("#soundBtn"); if (!btn) return;
    const ok = await armAudio(); if (!ok) return flashToast("Audio not supported");
    if (audio.ctx.state === "suspended") await audio.ctx.resume().catch(() => {});
    audio.enabled = !audio.enabled;
    btn.setAttribute("aria-pressed", String(audio.enabled));
    const icon = btn.querySelector(".btn__icon"); if (icon) icon.textContent = audio.enabled ? "🔈" : "🔊";
    if (audio.enabled) {
      if (audio.ambience) ambienceNode = playBuffer(audio.ambience, { volume: 0.32, loop: true });
      if (audio.music)    musicNode    = playBuffer(audio.music,    { volume: 0.18, loop: true });
      flashToast("Sound enabled 🔈");
    } else {
      try { ambienceNode?.src?.stop?.(0); } catch {} try { musicNode?.src?.stop?.(0); } catch {}
      ambienceNode = null; musicNode = null; flashToast("Sound off 🔇");
    }
  }

  /* ─── PARTICLES CANVAS ───────────────────────────────────────── */
  function initFX() {
    const canvas = $("#fx"); if (!canvas || reduceMotion || saveData) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    let w = 0, h = 0, dpr = 1;

    const dots = Array.from({ length: 45 }, () => ({
      x: 0, y: 0,
      r: 0.5 + Math.random() * 1.4,
      vx: (-0.12 + Math.random() * 0.24),
      vy: (-0.10 + Math.random() * 0.20),
      a: 0.08 + Math.random() * 0.18
    }));

    const resize = () => {
      w = Math.max(1, window.innerWidth); h = Math.max(1, window.innerHeight);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots.forEach(p => { p.x = Math.random() * w; p.y = Math.random() * h; });
    };

    let raf = 0, running = true;
    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(40,255,180,${0.06 * (1 - dist / 120)})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      dots.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(40,255,180,${p.a})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { running = false; if (raf) cancelAnimationFrame(raf); }
      else { running = true; raf = requestAnimationFrame(draw); }
    });
    resize(); raf = requestAnimationFrame(draw);
    window.addEventListener("resize", () => requestAnimationFrame(resize), { passive: true });
  }

  /* ─── PARTNERS MARQUEE ───────────────────────────────────────── */
  function initPartners() {
    const track = $(".partners__track"); if (!track) return;
    document.addEventListener("visibilitychange", () => {
      track.style.animationPlayState = document.hidden ? "paused" : "running";
    });
    const tune = () => { const dur = Math.max(12, Math.round(track.scrollWidth / 80)); track.style.animationDuration = dur + "s"; };
    window.addEventListener("load", tune);
    window.addEventListener("resize", tune, { passive: true });
  }

  /* ─── AI CHATBOT ─────────────────────────────────────────────── */
  const BRBRT_CONTEXT = `You are the BRBRT AI Assistant — a helpful, friendly guide for the BRBRT meme token project on BNB Chain.

BRBRT Project Facts:
- Token: BRBRT (ticker: BRBR) on BNB Chain (BEP-20)
- Contract: 0xf97522ABEf762d28729E073019343b72C6e8D2C1
- Buy on: PancakeSwap (https://pancakeswap.finance/swap?outputCurrency=0xf97522ABEf762d28729E073019343b72C6e8D2C1&chain=bsc)
- Verify on: BscScan (https://bscscan.com/token/0xf97522ABEF762d28729E073019343b72C6e8D2C1)
- Official links: https://linktr.ee/BRBRT
- Contact email: contact@brbrt.com
- Social: X (@BRBRToken), Instagram (@brbrtcoin)

Mission: Community-driven meme token inspired by a real story of bullying, resilience, and personal growth. The mission is awareness, dignity, and youth mental health support.

Transparency:
- Ownership renounced on-chain (verifiable on BscScan)
- Reserve Lock: 279,897.5221 BRBR via PinkLock V2 until 2030-01-01
- Lock record: https://www.pinksale.finance/pinklock/bsc/record/1437018

Roadmap: Foundations (complete) → Community Growth (in progress) → Impact → Sustainability

IMPORTANT: BRBRT makes NO promises of profit. Always add "NFA / DYOR" to financial questions. Never give financial advice.
Respond in English. Be concise, warm, helpful. Keep answers under 3 paragraphs.`;

  let chatHistory = [];
  let chatOpen    = false;

  function initChatbot() {
    const toggle   = $("#chatbotToggle");
    const panel    = $("#chatbotPanel");
    const closeBtn = $("#chatbotClose");
    const input    = $("#chatbotInput");
    const sendBtn  = $("#chatbotSend");
    const msgs     = $("#chatbotMessages");
    if (!toggle || !panel) return;

    const openChat  = () => { chatOpen = true;  panel.hidden = false; panel.setAttribute("aria-hidden","false"); toggle.setAttribute("aria-expanded","true");  input?.focus(); };
    const closeChat = () => { chatOpen = false; panel.hidden = true;  panel.setAttribute("aria-hidden","true");  toggle.setAttribute("aria-expanded","false"); };

    toggle.addEventListener("click",   () => { sfxClick(); chatOpen ? closeChat() : openChat(); });
    closeBtn?.addEventListener("click", () => { sfxClick(); closeChat(); });

    $$("#chatbotMessages .chatbot__suggest").forEach(btn => {
      btn.addEventListener("click", () => { sfxClick(); sendMessage(btn.textContent.trim()); });
    });

    input?.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input.value.trim()); } });
    sendBtn?.addEventListener("click", () => { sfxClick(); sendMessage(input?.value.trim() || ""); });

    async function sendMessage(text) {
      if (!text) return;
      if (input) input.value = "";
      $$("#chatbotMessages .chatbot__suggestions").forEach(s => s.remove());
      appendMsg(text, "user");
      sfxClick();
      const typingId = appendTyping();
      chatHistory.push({ role: "user", content: text });

      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "anthropic-dangerous-direct-browser-access": "true" },
          body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 512, system: BRBRT_CONTEXT, messages: chatHistory })
        });
        removeTyping(typingId);
        if (!response.ok) throw new Error("API error " + response.status);
        const data = await response.json();
        const reply = data.content?.[0]?.text || "Sorry, I couldn't get a response. Please try again!";
        chatHistory.push({ role: "assistant", content: reply });
        appendMsg(reply, "bot");
      } catch {
        removeTyping(typingId);
        const fallback = getFallbackReply(text);
        chatHistory.push({ role: "assistant", content: fallback });
        appendMsg(fallback, "bot");
      }
    }

    function appendMsg(text, role) {
      const wrap = document.createElement("div"); wrap.className = `chatbot__msg chatbot__msg--${role}`;
      const bubble = document.createElement("div"); bubble.className = "chatbot__bubble"; bubble.textContent = text;
      wrap.appendChild(bubble); msgs?.appendChild(wrap); scrollToBottom();
    }

    function appendTyping() {
      const id = "typing-" + Date.now();
      const wrap = document.createElement("div");
      wrap.className = "chatbot__msg chatbot__msg--bot chatbot__typing"; wrap.id = id;
      wrap.innerHTML = `<div class="chatbot__bubble"><span class="chatbot__dot"></span><span class="chatbot__dot"></span><span class="chatbot__dot"></span></div>`;
      msgs?.appendChild(wrap); scrollToBottom(); return id;
    }

    function removeTyping(id) { $("#" + id)?.remove(); }
    function scrollToBottom() { if (msgs) msgs.scrollTop = msgs.scrollHeight; }

    function getFallbackReply(text) {
      const t = text.toLowerCase();
      if (t.includes("buy") || t.includes("pancake"))
        return "To buy BRBRT: get BNB on BNB Chain, then use PancakeSwap with contract 0xf97522ABEf762d28729E073019343b72C6e8D2C1. Always verify on BscScan first! NFA / DYOR 🔍";
      if (t.includes("contract") || t.includes("address"))
        return "Official contract: 0xf97522ABEf762d28729E073019343b72C6e8D2C1 (BNB Chain). Always verify on BscScan before any transaction!";
      if (t.includes("safe") || t.includes("rug") || t.includes("trust"))
        return "BRBRT prioritizes transparency: ownership is renounced on-chain, and 279,897 BRBR are locked via PinkLock V2 until 2030. Verify everything on BscScan. NFA / DYOR 🔐";
      if (t.includes("mission") || t.includes("what is") || t.includes("story"))
        return "BRBRT is inspired by a real story of bullying and resilience. The mission is awareness around youth mental health, dignity, and anti-bullying — community-first, transparency-first. 💚";
      if (t.includes("roadmap") || t.includes("plan"))
        return "Roadmap: Phase 1 Foundations ✓ → Phase 2 Community Growth (in progress) → Phase 3 Impact Hub → Phase 4 Sustainability. Follow @BRBRToken on X for updates!";
      if (t.includes("contact") || t.includes("team") || t.includes("email"))
        return "Reach the team at contact@brbrt.com or linktr.ee/BRBRT. Follow @BRBRToken on X and @brbrtcoin on Instagram!";
      return "I'm here to help with everything BRBRT! Ask me about how to buy, the mission, transparency proofs, or the roadmap. What would you like to know? 💚";
    }
  }

  /* ─── YEAR ───────────────────────────────────────────────────── */
  function setYear() { const el = $("#year"); if (el) el.textContent = String(new Date().getFullYear()); }

  /* ─── STRIP VTT ──────────────────────────────────────────────── */
  function stripTracks() { $$("video track").forEach(t => t.remove()); }

  /* ─── INIT ───────────────────────────────────────────────────── */
  function init() {
    stripTracks();
    setYear();
    setEmailSlot();
    wireCopyButtons();
    initNavScroll();
    wireMenu();
    initReveal();
    initCursor();
    initFX();
    initVideos();
    initRoadmapBgVideo();
    initPartners();
    initChatbot();
    $("#soundBtn")?.addEventListener("click", async () => { await toggleSound(); if (audio.enabled) sfxClick(); });
    $$(".btn, .chip").forEach(el => el.addEventListener("click", () => sfxClick(), { passive: true }));
  }

  document.addEventListener("DOMContentLoaded", init);
})();
