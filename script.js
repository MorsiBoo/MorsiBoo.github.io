(() => {
  "use strict";

  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => Array.from(root.querySelectorAll(q));

  const CONTRACT = "0xf97522ABEf762d28729E073019343b72C6e8D2C1";
  const EMAIL = "contact@brbrt.com";

  const SOUND_FILES = {
    ambience: "assets/atmosphere-sound-effect.mp3",
    click: "assets/Click.mp3",
    music: "assets/Hero.m4a"
  };

  const reduceMotion = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const saveData = !!navigator.connection?.saveData;

  /* ---------------- Remove VTT tracks (no 404, no extra requests) ---------------- */
  function stripTracks() {
    $$("video track").forEach(t => t.remove());
  }

  /* ---------------- Toast ---------------- */
  let toastTimer = null;
  function flashToast(msg) {
    let el = $("#toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      Object.assign(el.style, {
        position: "fixed",
        left: "50%",
        bottom: "18px",
        transform: "translateX(-50%) translateY(0)",
        padding: "12px 14px",
        borderRadius: "14px",
        background: "rgba(8,12,14,.82)",
        border: "1px solid rgba(255,255,255,.12)",
        color: "rgba(234,247,241,.95)",
        boxShadow: "0 18px 70px rgba(0,0,0,.45)",
        backdropFilter: "blur(10px)",
        zIndex: "50",
        opacity: "0",
        transition: "opacity .2s ease, transform .2s ease"
      });
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    el.style.transform = "translateX(-50%) translateY(-2px)";
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateX(-50%) translateY(0)";
    }, 1400);
  }

  /* ---------------- Copy ---------------- */
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const t = document.createElement("textarea");
      t.value = text;
      t.setAttribute("readonly", "");
      t.style.position = "fixed";
      t.style.left = "-9999px";
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      document.body.removeChild(t);
    }
  }

  function setEmailSlot() {
    const slot = $("#emailSlot");
    if (!slot) return;
    slot.innerHTML = `<button class="chip" id="emailBtn" type="button" aria-label="Copy email">${EMAIL} ⧉</button>`;
    $("#emailBtn")?.addEventListener("click", async () => {
      await copyText(EMAIL);
      sfxClick();
      flashToast("Email copied");
    });
  }

  function wireCopyButtons() {
    $("#copyCA")?.addEventListener("click", async () => {
      await copyText(CONTRACT);
      sfxClick();
      flashToast("Contract copied");
    });

    $$("[data-copy]").forEach(el => {
      el.addEventListener("click", async () => {
        const t = el.getAttribute("data-copy");
        if (!t) return;
        await copyText(t);
        sfxClick();
        flashToast("Copied");
      });
    });

    $("#copyEmail")?.addEventListener("click", async () => {
      await copyText(EMAIL);
      sfxClick();
      flashToast("Email copied");
    });

    $("#copyEmailFooter")?.addEventListener("click", async () => {
      await copyText(EMAIL);
      sfxClick();
      flashToast("Email copied");
    });
  }

  /* ---------------- Mobile Menu ---------------- */
  function wireMenu() {
    const menuBtn = $("#menuBtn");
    const mobile = $("#mobileMenu");
    if (!menuBtn || !mobile) return;

    const close = () => {
      menuBtn.setAttribute("aria-expanded", "false");
      mobile.setAttribute("aria-hidden", "true");
      mobile.hidden = true;
    };
    const open = () => {
      menuBtn.setAttribute("aria-expanded", "true");
      mobile.setAttribute("aria-hidden", "false");
      mobile.hidden = false;
    };

    close();

    menuBtn.addEventListener("click", () => {
      sfxClick();
      const expanded = menuBtn.getAttribute("aria-expanded") === "true";
      expanded ? close() : open();
    });

    $$("#mobileMenu a").forEach(a => a.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) close();
    }, { passive: true });
  }

  /* ---------------- Reveal ---------------- */
  function initReveal() {
    const els = $$(".reveal");
    if (!els.length) return;

    if (!("IntersectionObserver" in window)) {
      els.forEach(el => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }, { threshold: 0.12 });

    els.forEach(el => io.observe(el));
  }

  /* ==============================
     Video engine (lazy + autoplay + anti-freeze)
     - Uses <source data-src="...">
     - Adds .is-ready when playing
  ============================== */
  function loadVideoSources(video) {
    const sources = $$("source[data-src]", video);
    let changed = false;
    sources.forEach(s => {
      if (!s.src && s.dataset.src) {
        s.src = s.dataset.src;
        changed = true;
      }
    });
    if (changed) { try { video.load(); } catch {} }
    return changed;
  }

  async function safePlay(video) {
    try {
      video.muted = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.playsInline = true;

      const p = video.play();
      if (p && typeof p.then === "function") await p;
      return true;
    } catch {
      return false;
    }
  }

  function attachFreezeGuard(video, { maxStallMs = 2200 } = {}) {
    let lastTime = -1;
    let lastTick = performance.now();
    let timer = 0;

    const tick = async () => {
      if (document.hidden) return;

      const now = performance.now();
      const ct = Number(video.currentTime || 0);
      const timeNotMoving = Math.abs(ct - lastTime) < 0.001;

      if (!video.paused && timeNotMoving) {
        if (now - lastTick > maxStallMs) {
          try { video.pause(); } catch {}
          try { video.currentTime = Math.max(0, ct - 0.05); } catch {}
          try { video.load(); } catch {}
          await safePlay(video);
          lastTick = now;
          lastTime = Number(video.currentTime || 0);
        }
      } else {
        lastTick = now;
        lastTime = ct;
      }

      timer = window.setTimeout(tick, 700);
    };

    const start = () => { if (!timer) timer = window.setTimeout(tick, 700); };
    const stop = () => { if (timer) { clearTimeout(timer); timer = 0; } };

    video.addEventListener("playing", start);
    video.addEventListener("pause", stop);
    video.addEventListener("ended", stop);

    video.addEventListener("stalled", async () => { try { video.load(); } catch {} await safePlay(video); });
    video.addEventListener("waiting", async () => { await safePlay(video); });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else if (!video.paused) start();
    });

    return { start, stop };
  }

  function initManagedVideo(video, { tapBtn = null, readyClassTarget = null, threshold = 0.25, rootMargin = "600px 0px" } = {}) {
    if (!video || reduceMotion || saveData) return;

    const showTap = () => tapBtn?.classList.add("is-visible");
    const hideTap = () => tapBtn?.classList.remove("is-visible");

    const start = async () => {
      loadVideoSources(video);
      const ok = await safePlay(video);

      if (ok) {
        readyClassTarget?.classList.add("is-ready");
        hideTap();
      } else {
        showTap();
      }
    };

    tapBtn?.addEventListener("click", async () => {
      hideTap();
      await start();
    });

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        const e = entries[0];
        if (!e) return;

        if (e.isIntersecting) {
          if ("requestIdleCallback" in window) {
            requestIdleCallback(() => start(), { timeout: 1800 });
          } else {
            setTimeout(start, 900);
          }
        } else {
          try { video.pause(); } catch {}
        }
      }, { threshold, rootMargin });

      io.observe(video);
    } else {
      setTimeout(start, 900);
    }

    const arm = () => { start(); cleanup(); };
    const cleanup = () => {
      window.removeEventListener("touchstart", arm);
      window.removeEventListener("click", arm);
    };
    window.addEventListener("touchstart", arm, { passive: true });
    window.addEventListener("click", arm, { passive: true });

    attachFreezeGuard(video, { maxStallMs: 2200 });
  }

  function initVideos() {
    const hero = $("#heroVideo");
    const heroTap = $("#heroPlay");
    if (hero) initManagedVideo(hero, { tapBtn: heroTap, readyClassTarget: hero, threshold: 0.35, rootMargin: "0px 0px" });

    const logo = $("#logoVideo") || $(".logoVideo");
    if (logo) initManagedVideo(logo, { tapBtn: null, readyClassTarget: null, threshold: 0.15, rootMargin: "800px 0px" });
  }

  /* ---------------- Sound (safe) ---------------- */
  const audio = { ctx:null, master:null, ambience:null, music:null, click:null, armed:false, enabled:false };
  let ambienceNode = null, musicNode = null;

  async function loadAudioBuffer(url) {
    const res = await fetch(url, { cache:"force-cache" }).catch(() => null);
    if (!res) return null;
    const arr = await res.arrayBuffer().catch(() => null);
    if (!arr) return null;
    return await audio.ctx.decodeAudioData(arr).catch(() => null);
  }

  function playBuffer(buffer, { volume = 0.8, loop = false } = {}) {
    const src = audio.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = loop;
    const gain = audio.ctx.createGain();
    gain.gain.value = volume;
    src.connect(gain).connect(audio.master);
    src.start(0);
    return { src, gain };
  }

  async function armAudio() {
    if (audio.armed) return true;
    if (!(window.AudioContext || window.webkitAudioContext)) return false;

    audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = 0.9;
    audio.master.connect(audio.ctx.destination);

    const [amb, clk, mus] = await Promise.all([
      loadAudioBuffer(SOUND_FILES.ambience),
      loadAudioBuffer(SOUND_FILES.click),
      loadAudioBuffer(SOUND_FILES.music)
    ]);

    audio.ambience = amb;
    audio.click = clk;
    audio.music = mus;
    audio.armed = true;
    return true;
  }

  function stopLoop(node) { try { node?.src?.stop?.(0); } catch {} }

  function sfxClick() {
    if (!audio.armed || !audio.enabled || !audio.click) return;
    playBuffer(audio.click, { volume: 0.55, loop:false });
  }

  async function toggleSound() {
    const btn = $("#soundBtn");
    if (!btn) return;

    const ok = await armAudio();
    if (!ok) return flashToast("Audio not supported");

    if (audio.ctx.state === "suspended") await audio.ctx.resume().catch(() => {});
    audio.enabled = !audio.enabled;

    btn.setAttribute("aria-pressed", String(audio.enabled));
    btn.querySelector(".btn__icon") && (btn.querySelector(".btn__icon").textContent = audio.enabled ? "🔈" : "🔊");
    btn.querySelector(".btn__text") && (btn.querySelector(".btn__text").textContent = audio.enabled ? "Sound ON" : "Sound");

    if (audio.enabled) {
      if (audio.ambience) ambienceNode = playBuffer(audio.ambience, { volume: 0.35, loop:true });
      if (audio.music) musicNode = playBuffer(audio.music, { volume: 0.20, loop:true });
      flashToast("Sound enabled");
    } else {
      stopLoop(ambienceNode); stopLoop(musicNode);
      ambienceNode = null; musicNode = null;
      flashToast("Sound muted");
    }
  }

  function wireSoundButton() {
    $("#soundBtn")?.addEventListener("click", async () => {
      await toggleSound();
      if (audio.enabled) sfxClick();
    });
  }

  /* ---------------- FX Canvas (lightweight, safe) ---------------- */
  function initFX() {
    const canvas = $("#fx");
    if (!canvas || reduceMotion || saveData) return;

    const ctx = canvas.getContext("2d", { alpha:true });
    let w=0, h=0;
    let dpr = Math.min(2, window.devicePixelRatio || 1);

    const pts = Array.from({ length: 34 }, () => ({
      x: 0, y: 0,
      r: 0.7 + Math.random()*1.6,
      vx: (-0.10 + Math.random()*0.20),
      vy: (-0.08 + Math.random()*0.16),
      a: 0.10 + Math.random()*0.22
    }));

    function resize(){
      w = Math.max(1, window.innerWidth);
      h = Math.max(1, window.innerHeight);
      dpr = Math.min(2, window.devicePixelRatio || 1);

      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr,0,0,dpr,0,0);

      for (const p of pts) {
        p.x = Math.random()*w;
        p.y = Math.random()*h;
      }
    }

    let raf=0;
    let running=true;

    function draw(){
      if (!running) return;
      ctx.clearRect(0,0,w,h);

      for (const p of pts){
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = w+10;
        if (p.x > w+10) p.x = -10;
        if (p.y < -10) p.y = h+10;
        if (p.y > h+10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle = `rgba(40,255,180,${p.a})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden){
        running=false;
        if (raf) cancelAnimationFrame(raf);
      } else {
        running=true;
        raf = requestAnimationFrame(draw);
      }
    });

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", () => requestAnimationFrame(resize), { passive:true });
  }

  /* ---------------- Year ---------------- */
  function setYear(){
    const y = $("#year");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  /* ---------------- Init ---------------- */
  function init(){
    stripTracks();         // ✅ no VTT issues
    setYear();
    setEmailSlot();
    wireCopyButtons();
    wireMenu();
    initReveal();
    wireSoundButton();
    initVideos();
    initFX();

    $$(".btn, .chip").forEach(el => el.addEventListener("click", () => sfxClick(), { passive:true }));
  }

  document.addEventListener("DOMContentLoaded", init);
})();
/* ===== Roadmap background video: lazy-load + pause offscreen ===== */
(function initRoadmapBgVideo(){
  const section = document.querySelector("[data-bgvideo]");
  if (!section) return;

  const v = section.querySelector("video");
  if (!v) return;

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const saveData = navigator.connection?.saveData;

  // On low-power modes: keep poster only
  if (reduceMotion || saveData) {
    try { v.pause(); } catch {}
    v.removeAttribute("autoplay");
    return;
  }

  const loadSources = () => {
    const sources = Array.from(v.querySelectorAll("source[data-src]"));
    for (const s of sources) {
      if (!s.src) s.src = s.dataset.src;
    }
    try { v.load(); } catch {}
  };

  const tryPlay = () => {
    v.muted = true;
    v.playsInline = true;
    const p = v.play?.();
    if (p && typeof p.catch === "function") p.catch(() => {});
  };

  // iOS/Safari: arm playback on first user gesture
  const arm = () => {
    loadSources();
    tryPlay();
    window.removeEventListener("touchstart", arm);
    window.removeEventListener("click", arm);
    window.removeEventListener("scroll", arm);
  };
  window.addEventListener("touchstart", arm, { passive: true });
  window.addEventListener("click", arm, { passive: true });
  window.addEventListener("scroll", arm, { passive: true });

  // Load + play only when near viewport, pause when away
  if (!("IntersectionObserver" in window)) {
    loadSources();
    tryPlay();
    return;
  }

  const io = new IntersectionObserver((entries) => {
    const e = entries[0];
    if (!e) return;

    if (e.isIntersecting) {
      loadSources();
      tryPlay();
    } else {
      try { v.pause(); } catch {}
    }
  }, { rootMargin: "300px 0px", threshold: 0.08 });

  io.observe(section);

  // Pause when tab hidden (perf)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      try { v.pause(); } catch {}
    } else {
      // Only resume if section is visible-ish
      // (safe: just attempt, browser will ignore if not allowed)
      tryPlay();
    }
  });
})();
// Partners marquee: smart pause when tab hidden + optional speed tuning
(function () {
  const track = document.querySelector(".partners-track");
  if (!track) return;

  // Pause when browser tab is hidden
  document.addEventListener("visibilitychange", () => {
    track.style.animationPlayState = document.hidden ? "paused" : "running";
  });

  // Optional: tune duration based on track width (keeps speed consistent)
  const tuneSpeed = () => {
    const w = track.scrollWidth;
    const pxPerSecond = 90; // change this value to make it faster/slower
    const duration = Math.max(12, Math.round(w / pxPerSecond));
    track.style.animationDuration = duration + "s";
  };

  window.addEventListener("load", tuneSpeed);
  window.addEventListener("resize", tuneSpeed);
})();

