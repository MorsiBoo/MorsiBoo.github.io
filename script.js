/* =========================
   BRBRT Ultra Web3 Scripts
   - Autoplay-safe sound toggle
   - Particles (lightweight canvas)
   - Scroll reveal
   - Copy buttons
   - Mobile menu
   - Email obfuscation (anti-scrape)
========================= */

(() => {
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => Array.from(root.querySelectorAll(q));

  // ====== Config (KEEP LINKS / ASSETS) ======
  const CONTRACT = "0xf97522ABEf762d28729E073019343b72C6e8D2C1";
  const EMAIL = "contact@brbrt.com"; // requested update
  const SOUND_FILES = {
    ambience: "assets/atmosphere-sound-effect.mp3",
    click: "assets/Click.mp3",
    music: "assets/Hero.m4a"
  };

  // ====== Email (anti-spam basic obfuscation) ======
  function setEmailSlot() {
    const slot = $("#emailSlot");
    if (!slot) return;
    // Render as text + mailto created on click (reduces scraping)
    slot.innerHTML = `<button class="chip" id="emailBtn" type="button">${EMAIL} ⧉</button>`;
    $("#emailBtn").addEventListener("click", async () => {
      await copyText(EMAIL);
      flashToast("Email copied");
    });
  }

  // ====== Copy helper ======
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
      const t = document.createElement("textarea");
      t.value = text;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      document.body.removeChild(t);
    }
  }

  // ====== Toast ======
  let toastTimer = null;
  function flashToast(msg) {
    let el = $("#toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.style.position = "fixed";
      el.style.left = "50%";
      el.style.bottom = "18px";
      el.style.transform = "translateX(-50%)";
      el.style.padding = "12px 14px";
      el.style.borderRadius = "14px";
      el.style.background = "rgba(8,12,14,.82)";
      el.style.border = "1px solid rgba(255,255,255,.12)";
      el.style.color = "rgba(234,247,241,.95)";
      el.style.boxShadow = "0 18px 70px rgba(0,0,0,.45)";
      el.style.backdropFilter = "blur(10px)";
      el.style.zIndex = 50;
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

  // ====== Copy Contract Buttons ======
  function wireCopyButtons() {
    const btn = $("#copyCA");
    if (btn) {
      btn.addEventListener("click", async () => {
        await copyText(CONTRACT);
        sfxClick();
        flashToast("Contract copied");
      });
    }
    $$("[data-copy]").forEach(el => {
      el.addEventListener("click", async () => {
        await copyText(el.getAttribute("data-copy"));
        sfxClick();
        flashToast("Copied");
      });
    });

    const emailBtn = $("#copyEmail");
    if (emailBtn) {
      emailBtn.addEventListener("click", async () => {
        await copyText(EMAIL);
        sfxClick();
        flashToast("Email copied");
      });
    }
    const emailBtn2 = $("#copyEmailFooter");
    if (emailBtn2) {
      emailBtn2.addEventListener("click", async () => {
        await copyText(EMAIL);
        sfxClick();
        flashToast("Email copied");
      });
    }
  }

  // ====== Mobile Menu ======
  function wireMenu() {
    const menuBtn = $("#menuBtn");
    const mobile = $("#mobileMenu");
    if (!menuBtn || !mobile) return;

    function closeMenu() {
      menuBtn.setAttribute("aria-expanded", "false");
      mobile.setAttribute("aria-hidden", "true");
      mobile.style.maxHeight = "0px";
      mobile.style.opacity = "0";
    }
    function openMenu() {
      menuBtn.setAttribute("aria-expanded", "true");
      mobile.setAttribute("aria-hidden", "false");
      mobile.style.maxHeight = "360px";
      mobile.style.opacity = "1";
    }

    mobile.style.overflow = "hidden";
    mobile.style.maxHeight = "0px";
    mobile.style.opacity = "0";
    mobile.style.transition = "max-height .25s ease, opacity .2s ease";

    menuBtn.addEventListener("click", () => {
      sfxClick();
      const expanded = menuBtn.getAttribute("aria-expanded") === "true";
      expanded ? closeMenu() : openMenu();
    });

    // Close on link click
    $$("#mobileMenu a").forEach(a => {
      a.addEventListener("click", () => closeMenu());
    });

    // Close when resizing up
    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) closeMenu();
    }, { passive: true });
  }

  // ====== Scroll Reveal ======
  function initReveal() {
    const els = $$(".reveal");
    if (!els.length) return;

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

  // ====== Sound Engine (autoplay-safe) ======
  let audio = {
    ctx: null,
    master: null,
    ambience: null,
    music: null,
    click: null,
    armed: false,
    enabled: false
  };

  async function loadAudioBuffer(url) {
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    return await audio.ctx.decodeAudioData(arr);
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
    if (audio.armed) return;
    audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = 0.9;
    audio.master.connect(audio.ctx.destination);

    // Load buffers
    const [amb, clk, mus] = await Promise.all([
      loadAudioBuffer(SOUND_FILES.ambience).catch(() => null),
      loadAudioBuffer(SOUND_FILES.click).catch(() => null),
      loadAudioBuffer(SOUND_FILES.music).catch(() => null),
    ]);

    audio.ambience = amb;
    audio.click = clk;
    audio.music = mus;
    audio.armed = true;
  }

  function stopLoop(nodeObj) {
    if (!nodeObj) return;
    try { nodeObj.src.stop(0); } catch {}
  }

  let ambienceNode = null;
  let musicNode = null;

  async function toggleSound() {
    const btn = $("#soundBtn");
    if (!btn) return;

    // Must be user gesture -> arm
    if (!audio.armed) {
      await armAudio();
    }
    if (audio.ctx.state === "suspended") {
      await audio.ctx.resume();
    }

    audio.enabled = !audio.enabled;
    btn.setAttribute("aria-pressed", String(audio.enabled));
    btn.querySelector(".btn__icon").textContent = audio.enabled ? "🔈" : "🔊";
    btn.querySelector(".btn__text").textContent = audio.enabled ? "Sound ON" : "Sound";

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
      // tiny click if already enabled
      if (audio.enabled) sfxClick();
    });
  }

  // ====== Lightweight Particles (Canvas) ======
  function initFX() {
    const canvas = $("#fx");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    let w = 0, h = 0, dpr = Math.min(2, window.devicePixelRatio || 1);

    function resize() {
      w = canvas.clientWidth = window.innerWidth;
      h = canvas.clientHeight = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }

    const pts = Array.from({ length: 70 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 0.7 + Math.random() * 2.0,
      vx: (-0.15 + Math.random() * 0.3),
      vy: (-0.10 + Math.random() * 0.2),
      a: 0.15 + Math.random() * 0.35
    }));

    let t = 0;
    function draw() {
      t += 1;
      ctx.clearRect(0,0,w,h);

      // dots
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;

        // wrap
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(40,255,180,${p.a})`;
        ctx.fill();
      }

      // subtle links
      for (let i=0;i<pts.length;i++){
        for (let j=i+1;j<i+6 && j<pts.length;j++){
          const a = pts[i], b = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.hypot(dx,dy);
          if (dist < 120){
            ctx.beginPath();
            ctx.moveTo(a.x,a.y);
            ctx.lineTo(b.x,b.y);
            ctx.strokeStyle = `rgba(40,255,180,${0.08 * (1 - dist/120)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    }

    resize();
    requestAnimationFrame(draw);
    window.addEventListener("resize", resize, { passive: true });
  }

  // ====== Init ======
  function init() {
    // year
    const y = $("#year");
    if (y) y.textContent = String(new Date().getFullYear());

    setEmailSlot();
    wireCopyButtons();
    wireMenu();
    initReveal();
    wireSoundButton();
    initFX();

    // Add small click SFX to key buttons (only if enabled & armed)
    $$(".btn, .chip").forEach(el => el.addEventListener("click", () => sfxClick()));
  }

  document.addEventListener("DOMContentLoaded", init);
})();
