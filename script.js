/* =========================
   BRBRT Ultra Web3 Scripts
   Clean + Stable + Mobile-safe
   - Stable LCP (poster first, video after)
   - Hero autoplay fallback (tap-to-play)
   - Lazy video loading (ONLY when needed)
   - FX canvas lightweight + pauses when hidden
   - Sound engine autoplay-safe (arms on user gesture)
   - Scroll reveal
   - Copy buttons + toast
   - Mobile menu accessible (no layout shifts)
========================= */

(() => {
  "use strict";

  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => Array.from(root.querySelectorAll(q));

  /* ===== CONFIG ===== */
  const CONTRACT = "0xf97522ABEf762d28729E073019343b72C6e8D2C1";
  const EMAIL = "contact@brbrt.com";

  const SOUND_FILES = {
    ambience: "assets/atmosphere-sound-effect.mp3",
    click: "assets/Click.mp3",
    music: "assets/Hero.m4a"
  };

  /* ===== Feature flags / perf signals ===== */
  const reduceMotion = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const saveData = !!navigator.connection?.saveData;
  const effectiveType = navigator.connection?.effectiveType || ""; // '4g','3g'...
  const isSlowNet = /2g|3g/.test(effectiveType);

  const canAutoplayVideo = !reduceMotion && !saveData; // we still handle fallback

  /* ===== Toast ===== */
  let toastTimer = null;
  function flashToast(msg) {
    let el = $("#toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.style.position = "fixed";
      el.style.left = "50%";
      el.style.bottom = "18px";
      el.style.transform = "translateX(-50%) translateY(0)";
      el.style.padding = "12px 14px";
      el.style.borderRadius = "14px";
      el.style.background = "rgba(8,12,14,.82)";
      el.style.border = "1px solid rgba(255,255,255,.12)";
      el.style.color = "rgba(234,247,241,.95)";
      el.style.boxShadow = "0 18px 70px rgba(0,0,0,.45)";
      el.style.backdropFilter = "blur(10px)";
      el.style.zIndex = "50";
      el.style.opacity = "0";
      el.style.transition = "opacity .2s ease, transform .2s ease";
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

  /* ===== Copy helper ===== */
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

  /* ===== Email Slot (anti scrape basic) ===== */
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

  /* ===== Copy Buttons ===== */
  function wireCopyButtons() {
    $("#copyCA")?.addEventListener("click", async () => {
      await copyText(CONTRACT);
      sfxClick();
      flashToast("Contract copied");
    });

    $$("[data-copy]").forEach(el => {
      el.addEventListener("click", async () => {
        const t = el.getAttribute("data-copy") || "";
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

  /* ===== Mobile Menu (accessible & stable) ===== */
  function wireMenu() {
    const menuBtn = $("#menuBtn");
    const mobile = $("#mobileMenu");
    if (!menuBtn || !mobile) return;

    // We use [hidden] to remove from tab order when closed
    function closeMenu() {
      menuBtn.setAttribute("aria-expanded", "false");
      mobile.setAttribute("aria-hidden", "true");
      mobile.hidden = true;
    }
    function openMenu() {
      menuBtn.setAttribute("aria-expanded", "true");
      mobile.setAttribute("aria-hidden", "false");
      mobile.hidden = false;
    }

    // Init state
    closeMenu();

    menuBtn.addEventListener("click", () => {
      sfxClick();
      const expanded = menuBtn.getAttribute("aria-expanded") === "true";
      expanded ? closeMenu() : openMenu();
    });

    // close when clicking a link
    $$("#mobileMenu a").forEach(a => a.addEventListener("click", () => closeMenu()));

    // close on ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });

    // close on resize to desktop
    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) closeMenu();
    }, { passive: true });
  }

  /* ===== Scroll Reveal ===== */
  function initReveal() {
    const els = $$(".reveal");
    if (!els.length) return;

    if (!("IntersectionObserver" in window)) {
      els.forEach(el => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    els.forEach(el => io.observe(el));
  }

  /* =========================================================
     HERO VIDEO (Stable LCP + mobile autoplay fallback)
     Requirements in HTML:
       <video id="heroVideo" class="hero__video" muted playsinline loop preload="none" poster="assets/hero-poster.webp">
         <source id="heroSource" data-src="assets/hero-web.mp4" type="video/mp4">
       </video>
       <button id="heroPlayBtn" class="heroPlay" type="button">Tap to play</button>
  ========================================================= */
  function initHeroVideo() {
    const v = $("#heroVideo");
    const src = $("#heroSource");
    const btn = $("#heroPlayBtn");
    if (!v || !src) return;

    // Ensure autoplay rules
    v.muted = true;
    v.playsInline = true;
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");

    // If reduced motion or save-data => do not load video at all
    if (!canAutoplayVideo) {
      if (btn) btn.classList.remove("is-visible");
      return;
    }

    // show play button only if autoplay fails
    const showPlay = () => {
      if (!btn) return;
      btn.classList.add("is-visible");
    };
    const hidePlay = () => {
      if (!btn) return;
      btn.classList.remove("is-visible");
    };

    // Load source only once
    const ensureSourceLoaded = () => {
      if (!src.dataset.src) return;
      if (src.src) return; // already loaded
      src.src = src.dataset.src;
      try { v.load(); } catch {}
    };

    // Try play (may fail on iOS until gesture)
    const tryPlay = async () => {
      ensureSourceLoaded();
      try {
        const p = v.play();
        if (p && typeof p.then === "function") await p;
        hidePlay();
      } catch {
        showPlay();
      }
    };

    // Tap-to-play fallback
    if (btn) {
      btn.addEventListener("click", async () => {
        hidePlay();
        await tryPlay();
      });
    }

    // PERF: load/play only when hero is visible
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          // Use idle callback to avoid fighting LCP
          if ("requestIdleCallback" in window && !isSlowNet) {
            requestIdleCallback(() => tryPlay(), { timeout: 1800 });
          } else {
            setTimeout(() => tryPlay(), 900);
          }
        } else {
          try { v.pause(); } catch {}
        }
      }, { threshold: 0.35 });

      io.observe(v);
    } else {
      // No IO => just load later
      setTimeout(() => tryPlay(), 1200);
    }

    // Also try on first user gesture (Safari)
    const armGesture = async () => {
      await tryPlay();
      window.removeEventListener("touchstart", armGesture);
      window.removeEventListener("click", armGesture);
    };
    window.addEventListener("touchstart", armGesture, { passive: true });
    window.addEventListener("click", armGesture, { passive: true });

    // Pause when tab hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        try { v.pause(); } catch {}
      } else {
        // Don't force; only try if visible in viewport
        // (keep simple: user will re-enter hero, IO will handle)
      }
    });
  }

  /* ===== Lazy-load OTHER videos (not the hero) =====
     For non-hero videos, add:
       <video preload="none">
         <source data-src="assets/xxx.mp4" type="video/mp4">
       </video>
  */
  function initLazyVideos() {
    const videos = $$("video").filter(v => v.id !== "heroVideo");
    if (!videos.length) return;

    const loadVideo = (v) => {
      const s = v.querySelector("source[data-src]");
      if (s && !s.src) {
        s.src = s.dataset.src;
        try { v.load(); } catch {}
      }
    };

    if (!("IntersectionObserver" in window)) {
      videos.forEach(loadVideo);
      return;
    }

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        loadVideo(entry.target);
        obs.unobserve(entry.target);
      });
    }, { rootMargin: "300px 0px" });

    videos.forEach(v => io.observe(v));
  }

  /* ===== Sound Engine (autoplay-safe) ===== */
  const audio = {
    ctx: null,
    master: null,
    ambience: null,
    music: null,
    click: null,
    armed: false,
    enabled: false
  };

  let ambienceNode = null;
  let musicNode = null;

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

  function stopLoop(nodeObj) {
    if (!nodeObj) return;
    try { nodeObj.src.stop(0); } catch {}
  }

  async function toggleSound() {
    const btn = $("#soundBtn");
    if (!btn) return;

    const ok = await armAudio();
    if (!ok) {
      flashToast("Audio not supported");
      return;
    }

    if (audio.ctx.state === "suspended") {
      await audio.ctx.resume().catch(() => {});
    }

    audio.enabled = !audio.enabled;

    btn.setAttribute("aria-pressed", String(audio.enabled));
    const icon = btn.querySelector(".btn__icon");
    const text = btn.querySelector(".btn__text");
    if (icon) icon.textContent = audio.enabled ? "🔈" : "🔊";
    if (text) text.textContent = audio.enabled ? "Sound ON" : "Sound";

    if (audio.enabled) {
      if (audio.ambience) ambienceNode = playBuffer(audio.ambience, { volume: 0.35, loop: true });
      if (audio.music) musicNode = playBuffer(audio.music, { volume: 0.20, loop: true });
      flashToast("Sound enabled");
    } else {
      stopLoop(ambienceNode);
      stopLoop(musicNode);
      ambienceNode = null;
      musicNode = null;
      flashToast("Sound muted");
    }
  }

  function sfxClick() {
    if (!audio.armed || !audio.enabled || !audio.click) return;
    playBuffer(audio.click, { volume: 0.55, loop: false });
  }

  function wireSoundButton() {
    const btn = $("#soundBtn");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      await toggleSound();
      if (audio.enabled) sfxClick();
    });
  }

  /* ===== Lightweight Particles (Canvas FX) ===== */
  function initFX() {
    const canvas = $("#fx");
    if (!canvas) return;

    // If reduced motion OR saveData => keep FX minimal
    const light = reduceMotion || saveData || isSlowNet;
    const maxPts = light ? 18 : 64;

    const ctx = canvas.getContext("2d", { alpha: true });
    let w = 0, h = 0, dpr = Math.min(2, window.devicePixelRatio || 1);

    function resize() {
      w = canvas.clientWidth = window.innerWidth;
      h = canvas.clientHeight = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const pts = Array.from({ length: maxPts }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 0.7 + Math.random() * 2.0,
      vx: (-0.12 + Math.random() * 0.24),
      vy: (-0.10 + Math.random() * 0.20),
      a: 0.12 + Math.random() * 0.32
    }));

    let raf = 0;
    let running = true;

    function draw() {
      if (!running) return;

      ctx.clearRect(0, 0, w, h);

      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;

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
              ctx.strokeStyle = `rgba(40,255,180,${0.08 * (1 - dist / 120)})`;
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
    window.addEventListener("resize", resize, { passive: true });
  }

  /* ===== Year ===== */
  function setYear() {
    const y = $("#year");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  /* ===== Global click SFX attachment (safe) ===== */
  function wireClickSfx() {
    // Don't attach to every element (can be heavy).
    // Attach only to key interactive UI.
    const targets = $$(".btn, .chip, .nav__links a, .mobile__panel a");
    targets.forEach(el => el.addEventListener("click", () => sfxClick(), { passive: true }));
  }

  /* ===== Init ===== */
  function init() {
    setYear();
    setEmailSlot();
    wireCopyButtons();
    wireMenu();
    initReveal();
    wireSoundButton();

    // HERO video: stable + mobile friendly + fallback
    initHeroVideo();

    // other videos lazy
    initLazyVideos();

    // FX last (don’t compete with hero paint)
    initFX();

    // optional sfx wiring
    wireClickSfx();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
