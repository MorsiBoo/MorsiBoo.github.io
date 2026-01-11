(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // ---------------------------
  // YEAR
  // ---------------------------
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------------------------
  // UI CLICK SOUND
  // ---------------------------
  const uiClick = $("#uiClick");
  const playUIClick = () => {
    if (!uiClick) return;
    try {
      uiClick.currentTime = 0;
      uiClick.volume = 0.55;
      uiClick.play().catch(() => {});
    } catch {}
  };
  $$("[data-click]").forEach((el) => el.addEventListener("click", playUIClick));

  // ---------------------------
  // REVEAL ON SCROLL
  // ---------------------------
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("is-visible");
      });
    },
    { threshold: 0.12 }
  );
  $$(".reveal").forEach((el) => io.observe(el));

  // ---------------------------
  // PARTICLES (light + stable)
  // ---------------------------
  const canvas = $("#particles");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr;

    const resize = () => {
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      w = canvas.width = Math.floor(window.innerWidth * dpr);
      h = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    };

    const rand = (a, b) => a + Math.random() * (b - a);
    const particles = [];
    const COUNT = Math.min(60, Math.floor((window.innerWidth * window.innerHeight) / 24000));

    const init = () => {
      particles.length = 0;
      for (let i = 0; i < COUNT; i++) {
        particles.push({
          x: rand(0, w),
          y: rand(0, h),
          r: rand(0.7, 2.2) * dpr,
          vx: rand(-0.12, 0.12) * dpr,
          vy: rand(-0.08, 0.18) * dpr,
          a: rand(0.12, 0.55),
          g: rand(0, 1) // green tint factor
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // soft glow lines
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -50) p.x = w + 50;
        if (p.x > w + 50) p.x = -50;
        if (p.y < -50) p.y = h + 50;
        if (p.y > h + 50) p.y = -50;

        // particle
        const green = Math.floor(160 + p.g * 95);
        ctx.fillStyle = `rgba(92, ${green}, 111, ${p.a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // connect near particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 150 * dpr) {
            const alpha = (1 - dist / (150 * dpr)) * 0.12;
            ctx.strokeStyle = `rgba(92,255,111,${alpha})`;
            ctx.lineWidth = 1 * dpr;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    };

    resize();
    init();
    draw();
    window.addEventListener("resize", () => { resize(); init(); }, { passive: true });
  }

  // ---------------------------
  // AUDIO POLICY FIX: start after gesture
  // ---------------------------
  const bgVideo = $("#bgVideo");
  const trailerAudio = $("#trailerAudio");
  const ambienceAudio = $("#ambienceAudio");
  const soundToggle = $("#soundToggle");
  const soundGate = $("#soundGate");
  const soundGateBtn = $("#soundGateBtn");
  const soundGateSkip = $("#soundGateSkip");

  const state = {
    enabled: false,
    unlocked: false
  };

  // Persist user preference
  const stored = localStorage.getItem("brbr_sound");
  if (stored === "on") state.enabled = true;

  const setSoundUI = () => {
    if (!soundToggle) return;
    const txt = soundToggle.querySelector(".sound-txt");
    if (state.enabled) {
      txt.textContent = "SOUND ON";
      soundToggle.style.borderColor = "rgba(92,255,111,.35)";
    } else {
      txt.textContent = "SOUND OFF";
      soundToggle.style.borderColor = "rgba(255,255,255,.10)";
    }
  };

  const fade = (audio, to, ms = 550) => {
    if (!audio) return;
    const from = audio.volume ?? 0;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / ms);
      audio.volume = from + (to - from) * p;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const tryPlay = async (audio, vol) => {
    if (!audio) return false;
    audio.volume = 0;
    try {
      await audio.play();
      fade(audio, vol);
      return true;
    } catch {
      return false;
    }
  };

  const stopAudio = (audio) => {
    if (!audio) return;
    try { fade(audio, 0, 250); } catch {}
    setTimeout(() => {
      try { audio.pause(); } catch {}
    }, 260);
  };

  // unlock audio on gesture
  const unlockAudio = async () => {
    if (state.unlocked) return true;

    // Ensure video is playing (muted autoplay should already work)
    if (bgVideo) {
      try { await bgVideo.play(); } catch {}
    }

    // Start both layers quietly (you can keep only one if you want)
    const ok1 = await tryPlay(trailerAudio, 0.70);
    const ok2 = await tryPlay(ambienceAudio, 0.32);

    state.unlocked = ok1 || ok2;
    return state.unlocked;
  };

  const enableSound = async () => {
    state.enabled = true;
    localStorage.setItem("brbr_sound", "on");
    setSoundUI();

    // Try to unlock + start
    await unlockAudio();

    // If unlocked, ensure it's playing
    if (state.unlocked) {
      tryPlay(trailerAudio, 0.70);
      tryPlay(ambienceAudio, 0.32);
    }
  };

  const disableSound = () => {
    state.enabled = false;
    localStorage.setItem("brbr_sound", "off");
    setSoundUI();
    stopAudio(trailerAudio);
    stopAudio(ambienceAudio);
  };

  const toggleSound = async () => {
    playUIClick();
    if (state.enabled) disableSound();
    else await enableSound();
  };

  // Sound gate open on first load if preference ON (or to invite)
  const openGate = () => {
    if (!soundGate) return;
    // If user already chose "off", don't spam.
    const seen = localStorage.getItem("brbr_gate_seen");
    if (seen === "1" && !state.enabled) return;

    soundGate.classList.add("is-open");
    localStorage.setItem("brbr_gate_seen", "1");
  };
  const closeGate = () => soundGate && soundGate.classList.remove("is-open");

  // Start silent, show gate quickly
  setSoundUI();
  setTimeout(openGate, 700);

  // Gate buttons
  if (soundGateBtn) soundGateBtn.addEventListener("click", async () => {
    await enableSound();
    closeGate();
  });
  if (soundGateSkip) soundGateSkip.addEventListener("click", () => {
    disableSound();
    closeGate();
  });

  // Toggle button
  if (soundToggle) soundToggle.addEventListener("click", toggleSound);

  // Also unlock audio on ANY first click anywhere (if enabled)
  const gestureUnlock = async () => {
    if (!state.enabled) return;
    await unlockAudio();
    document.removeEventListener("pointerdown", gestureUnlock);
    document.removeEventListener("keydown", gestureUnlock);
  };
  document.addEventListener("pointerdown", gestureUnlock, { passive: true });
  document.addEventListener("keydown", gestureUnlock);

  // If preference is ON, attempt to enable sound (will fully start after first gesture)
  if (state.enabled) {
    // start UI and prepare (won’t break if blocked)
    unlockAudio().catch(() => {});
  }

  // ---------------------------
  // LOGO VIDEO REPLAY
  // ---------------------------
  const logoVideo = $("#logoVideo");
  const replayLogo = $("#replayLogo");
  if (replayLogo && logoVideo) {
    replayLogo.addEventListener("click", async () => {
      playUIClick();
      try {
        logoVideo.currentTime = 0;
        await logoVideo.play();
      } catch {}
    });
  }
})();
