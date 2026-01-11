(() => {
  "use strict";

  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const $ = (sel, root = document) => root.querySelector(sel);

  const LINKS = {
    pancakeswap: "https://pancakeswap.finance/swap?outputCurrency=0xf97522ABEf762d28729E073019343b72C6e8D2C1&chain=bsc",
    bscscan: "https://bscscan.com/token/0xf97522ABEF762d28729E073019343b72C6e8D2C1",
    linktree: "https://linktr.ee/barbourbrbr"
  };

  const CONTACT_EMAIL = "contact@barbourbrbr.xyz";

  // ---------- Audio Manager (Trailer Mode) ----------
  const Audio = {
    unlocked: false,
    enabled: false,
    ambience: null,
    click: null,
    whoosh: null,
    hit: null,
    stinger: null,
    gain: null,
    ctx: null,

    init() {
      this.ambience = $("#aud-ambience");
      this.click = $("#aud-click");
      this.whoosh = $("#aud-whoosh");
      this.hit = $("#aud-hit");
      this.stinger = $("#aud-stinger");

      // If these <audio> tags don't exist on a subpage, we gracefully degrade.
      if (!this.ambience && !this.click) return;

      // Start muted (browser policy). Toggle will unlock.
      this.setEnabled(false);
    },

    async unlock() {
      if (this.unlocked) return true;

      // Use WebAudio only if available; otherwise fallback to HTMLAudio play()
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) { this.unlocked = true; return true; }
        this.ctx = new Ctx();
        this.gain = this.ctx.createGain();
        this.gain.gain.value = 0.85;
        this.gain.connect(this.ctx.destination);

        // Create media sources (only once)
        this._connectIfNeeded(this.ambience);
        this._connectIfNeeded(this.click);
        this._connectIfNeeded(this.whoosh);
        this._connectIfNeeded(this.hit);
        this._connectIfNeeded(this.stinger);

        await this.ctx.resume();
        this.unlocked = true;
        return true;
      } catch (e) {
        this.unlocked = true;
        return true;
      }
    },

    _connectIfNeeded(el) {
      if (!el || !this.ctx || el._wired) return;
      try {
        const src = this.ctx.createMediaElementSource(el);
        src.connect(this.gain);
        el._wired = true;
      } catch (_) {
        // Some browsers can throw if same element is connected twice, ignore.
      }
    },

    setEnabled(on) {
      this.enabled = !!on;
      const audios = [this.ambience, this.click, this.whoosh, this.hit, this.stinger].filter(Boolean);
      audios.forEach(a => (a.muted = !this.enabled));
      if (!this.enabled && this.ambience) {
        try { this.ambience.pause(); } catch (_) {}
      }
    },

    async startTrailer() {
      await this.unlock();
      this.setEnabled(true);

      // Ambience loop
      if (this.ambience) {
        this.ambience.volume = 0.55;
        try { await this.ambience.play(); } catch (_) {}
      }

      // Stinger once
      if (this.stinger) {
        this.stinger.currentTime = 0;
        this.stinger.volume = 0.90;
        try { await this.stinger.play(); } catch (_) {}
      }
    },

    async play(el, vol = 0.9) {
      if (!this.enabled || !el) return;
      try {
        el.pause();
        el.currentTime = 0;
        el.volume = vol;
        await el.play();
      } catch (_) {}
    },

    clickSfx() { this.play(this.click, 0.85); },
    whooshSfx(){ this.play(this.whoosh, 0.90); },
    hitSfx()   { this.play(this.hit, 0.95); }
  };

  // ---------- Particles (Blockchain-like network) ----------
  function initParticles() {
    const canvas = $("#particles");
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let w = 0, h = 0, dpr = 1;
    let nodes = [];
    let raf = 0;

    const NODE_COUNT = Math.min(88, Math.max(42, Math.floor((window.innerWidth * window.innerHeight) / 24000)));

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth = window.innerWidth;
      h = canvas.clientHeight = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      nodes = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.6 + 0.7
      }));
    }

    function step() {
      ctx.clearRect(0, 0, w, h);

      // Draw links
      const maxDist = 130;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];

        a.x += a.vx; a.y += a.vy;
        if (a.x < -20) a.x = w + 20;
        if (a.x > w + 20) a.x = -20;
        if (a.y < -20) a.y = h + 20;
        if (a.y > h + 20) a.y = -20;

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.22;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = "rgba(101,255,122,1)";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      ctx.globalAlpha = 0.75;
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.72)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 1.7, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(101,255,122,0.18)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(step);
    }

    resize();
    step();

    window.addEventListener("resize", () => {
      cancelAnimationFrame(raf);
      resize();
      step();
    }, { passive: true });
  }

  // ---------- Reveal on scroll ----------
  function initReveal() {
    const items = $$(".reveal");
    if (!items.length) return;

    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      items.forEach(el => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    }, { threshold: 0.12 });

    items.forEach(el => io.observe(el));
  }

  // ---------- Smooth anchors ----------
  function initAnchors() {
    $$(".nav__link[href^='#'], a[href^='#']").forEach(a => {
      a.addEventListener("click", (ev) => {
        const id = a.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        ev.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, { passive: false });
    });
  }

  // ---------- Copy helpers ----------
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (_) {}
      document.body.removeChild(ta);
      return true;
    }
  }

  // ---------- Token reveal cinematic trigger ----------
  function initTokenReveal() {
    const logoVideo = $("#logoVideo");
    if (!logoVideo) return;

    // Keep it paused until in view; then play + SFX
    let fired = false;
    const io = new IntersectionObserver(async (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting || fired) continue;
        fired = true;

        // Play whoosh + hit, then start video
        Audio.whooshSfx();
        setTimeout(() => Audio.hitSfx(), 220);

        try {
          logoVideo.currentTime = 0;
          await logoVideo.play();
        } catch (_) {}
        io.disconnect();
      }
    }, { threshold: 0.35 });

    io.observe(logoVideo);
  }

  // ---------- Sound Toggle ----------
  function initSoundToggle() {
    const btn = $("#soundToggle");
    if (!btn) return;

    function render() {
      const icon = btn.querySelector(".iconbtn__icon");
      if (!icon) return;
      btn.setAttribute("aria-pressed", Audio.enabled ? "true" : "false");
      icon.textContent = Audio.enabled ? "🔊" : "🔇";
    }

    // Unlock audio on first user gesture (click/keydown/touch)
    const unlockOnce = async () => {
      window.removeEventListener("pointerdown", unlockOnce);
      window.removeEventListener("keydown", unlockOnce);
      Audio.init();
      render();
    };
    window.addEventListener("pointerdown", unlockOnce, { once: true, passive: true });
    window.addEventListener("keydown", unlockOnce, { once: true });

    btn.addEventListener("click", async () => {
      // If enabling: start trailer mode
      if (!Audio.enabled) {
        await Audio.startTrailer();
      } else {
        Audio.setEnabled(false);
      }
      render();
    });

    render();
  }

  // ---------- SFX on UI elements ----------
  function initSfxUI() {
    $$(".sfx").forEach(el => {
      el.addEventListener("click", () => Audio.clickSfx(), { passive: true });
    });
  }

  // ---------- Email (visible, but harder to scrape) ----------
  function initContactEmail() {
    const spots = $$("#contactEmail");
    if (!spots.length) return;

    // Render as visible text (exact requested) + mailto
    spots.forEach(sp => {
      const a = document.createElement("a");
      a.className = "textlink sfx";
      a.href = `mailto:${CONTACT_EMAIL}?subject=BRBR%20Contact`;
      a.textContent = CONTACT_EMAIL; // EXACT format: no "at"
      sp.textContent = "";
      sp.appendChild(a);
    });

    const copyBtn = $("#copyEmail");
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        await copyText(CONTACT_EMAIL);
        copyBtn.textContent = "Copied ✓";
        setTimeout(() => (copyBtn.textContent = "Copy"), 1000);
      });
    }
  }

  function initCopyCA() {
    const btn = $("#copyCA");
    const ca = $("#contractAddress");
    if (!btn || !ca) return;

    btn.addEventListener("click", async () => {
      await copyText(ca.textContent.trim());
      btn.textContent = "Copied ✓";
      setTimeout(() => (btn.textContent = "Copy"), 1000);
    });
  }

  // ---------- Footer year ----------
  function initYear() {
    const y = $("#year");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  // ---------- Boot ----------
  document.addEventListener("DOMContentLoaded", () => {
    initReveal();
    initAnchors();
    initParticles();

    Audio.init();
    initSoundToggle();
    initSfxUI();

    initTokenReveal();
    initContactEmail();
    initCopyCA();
    initYear();
  });
})();
