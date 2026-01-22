(() => {
  "use strict";

  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => Array.from(root.querySelectorAll(q));

  // Keep your real contract + email
  const CONTRACT = "0xf97522ABEf762d28729E073019343b72C6e8D2C1";
  const EMAIL = "contact@brbrt.com";

  const SOUND_FILES = {
    ambience: "assets/atmosphere-sound-effect.mp3",
    click: "assets/Click.mp3",
    music: "assets/Hero.m4a"
  };

  const reduceMotion = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const saveData = !!navigator.connection?.saveData;
  const effectiveType = navigator.connection?.effectiveType || "";
  const isSlowNet = /2g|3g/.test(effectiveType);

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
    }, 1600);
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

    const closeMenu = () => {
      menuBtn.setAttribute("aria-expanded", "false");
      mobile.setAttribute("aria-hidden", "true");
      mobile.hidden = true;
    };

    const openMenu = () => {
      menuBtn.setAttribute("aria-expanded", "true");
      mobile.setAttribute("aria-hidden", "false");
      mobile.hidden = false;
    };

    closeMenu();

    menuBtn.addEventListener("click", () => {
      sfxClick();
      const expanded = menuBtn.getAttribute("aria-expanded") === "true";
      expanded ? closeMenu() : openMenu();
    });

    $$("#mobileMenu a").forEach(a => a.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) closeMenu();
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

  /* ---------------- HERO video (poster LCP first) ---------------- */
  function initHeroVideo() {
    const v = $("#heroVideo");
    const s = $("#heroSource");
    const btn = $("#heroPlayBtn");
    if (!v || !s) return;

    // Don’t load video at all if reduced motion / save-data
    if (reduceMotion || saveData) return;

    const showBtn = () => btn && btn.classList.add("is-visible");
    const hideBtn = () => btn && btn.classList.remove("is-visible");

    const ensureSrc = () => {
      if (s.src) return;
      if (!s.dataset.src) return;
      s.src = s.dataset.src;
      try { v.load(); } catch {}
    };

    const tryPlay = async () => {
      ensureSrc();
      try {
        v.muted = true;
        v.playsInline = true;
        v.setAttribute("muted", "");
        v.setAttribute("playsinline", "");
        const p = v.play();
        if (p && typeof p.then === "function") await p;
        v.classList.add("is-ready");
        hideBtn();
      } catch {
        showBtn();
      }
    };

    btn?.addEventListener("click", async () => {
      hideBtn();
      await tryPlay();
    });

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          const delay = isSlowNet ? 1400 : 900;
          if ("requestIdleCallback" in window && !isSlowNet) {
            requestIdleCallback(() => tryPlay(), { timeout: 1800 });
          } else {
            setTimeout(() => tryPlay(), delay);
          }
        } else {
          try { v.pause(); } catch {}
        }
      }, { threshold: 0.35 });

      io.observe(v);
    } else {
      setTimeout(() => tryPlay(), 1200);
    }

    // iOS Safari: attempt on first gesture
    const arm = () => { tryPlay(); cleanup(); };
    const cleanup = () => {
      window.removeEventListener("touchstart", arm);
      window.removeEventListener("click", arm);
    };
    window.addEventListener("touchstart", arm, { passive: true });
    window.addEventListener("click", arm, { passive: true });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { try { v.pause(); } catch {} }
    });
  }

  /* ---------------- Lazy-load other videos (logo etc.) ---------------- */
  function initLazyVideos() {
    const vids = $$("video").filter(v => v.id !== "heroVideo");
    if (!vids.length) return;

    const load = (v) => {
      const src = v.querySelector("source[data-src]");
      if (!src || src.src) return;
      src.src = src.dataset.src;
      try { v.load(); } catch {}
    };

    if (!("IntersectionObserver" in window)) {
      vids.forEach(load);
      return;
    }

    const io = new IntersectionObserver((entries, obs) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        load(e.target);
        obs.unobserve(e.target);
      }
    }, { rootMargin: "300px 0px" });

    vids.forEach(v => io.observe(v));
  }

  /* ---------------- Sound (gesture only) ---------------- */
  const audio = { ctx:null, master:null, ambience:null, music:null, click:null, armed:false, enabled:false };
  let ambienceNode = null, musicNode = null;

  async function loadAudioBuffer(url) {
    const res = await fetch(url, { cache: "force-cache" }).catch(() => null);
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
    playBuffer(audio.click, { volume: 0.55, loop: false });
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
      if (audio.ambience) ambienceNode = playBuffer(audio.ambience, { volume: 0.35, loop: true });
      if (audio.music) musicNode = playBuffer(audio.music, { volume: 0.20, loop: true });
      flashToast("Sound enabled");
    } else {
      stopLoop(ambienceNode); stopLoop(musicNode);
      ambienceNode = null; musicNode = null;
      flashToast("Sound muted");
    }
  }

  function wireSoundButton() {
    const btn = $("#soundBtn");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      await toggleSound();
      if (audio.enabled) sfxClick();
    });
  }

  /* ---------------- FX Canvas (FIXED, no clientWidth assignment) ---------------- */
  function initFX() {
    const canvas = $("#fx");
    if (!canvas) return;

    const light = reduceMotion || saveData || isSlowNet;
    const maxPts = light ? 14 : 52;

    const ctx = canvas.getContext("2d", { alpha: true });
    let w = 0, h = 0;
    let dpr = Math.min(2, window.devicePixelRatio || 1);

    function resize() {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const pts = Array.from({ length: maxPts }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 0.7 + Math.random() * 1.6,
      vx: (-0.10 + Math.random() * 0.20),
      vy: (-0.08 + Math.random() * 0.16),
      a: 0.10 + Math.random() * 0.26
    }));

    let raf = 0;
    let running = true;

    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);

      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;

        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(40,255,180,${p.a})`;
        ctx.fill();
      }

      if (!light) {
        for (let i = 0; i < pts.length; i++) {
          for (let j = i + 1; j < i + 6 && j < pts.length; j++) {
            const a = pts[i], b = pts[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 120) {
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = `rgba(40,255,180,${0.07 * (1 - dist / 120)})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
      }

      raf = requestAnimationFrame(draw);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        running = false;
        if (raf) cancelAnimationFrame(raf);
      } else {
        running = true;
        raf = requestAnimationFrame(draw);
      }
    });

    resize();
    raf = requestAnimationFrame(draw);

    window.addEventListener("resize", () => {
      requestAnimationFrame(resize);
    }, { passive: true });
  }

  /* ---------------- Year ---------------- */
  function setYear() {
    const y = $("#year");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  function init() {
    setYear();
    setEmailSlot();
    wireCopyButtons();
    wireMenu();
    initReveal();
    wireSoundButton();

    initHeroVideo();
    initLazyVideos();
    initFX();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
