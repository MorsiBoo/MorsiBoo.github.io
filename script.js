// ============================
//  BRBR Cinema Trailer Enhancements
//  - Sound toggle (videos mute/unmute)
//  - Micro particles (canvas)
//  - Fade-in on scroll (IntersectionObserver)
// ============================

document.addEventListener("DOMContentLoaded", () => {
  // ---------- 1) SOUND TOGGLE ----------
  const btn = document.getElementById("soundToggle");
  const videos = Array.from(document.querySelectorAll("video"));

  // On force toutes les vidéos muted au départ (autoplay policy)
  videos.forEach(v => {
    v.muted = true;
    v.playsInline = true;
  });

  let soundOn = false;

  function setSound(on){
    soundOn = on;
    videos.forEach(v => v.muted = !on);

    if (btn){
      btn.textContent = on ? "🔊 Sound: ON" : "🔇 Sound: OFF";
    }
  }

  if (btn){
    btn.addEventListener("click", async () => {
      // Important: le son ne peut s'activer qu'après interaction user (OK ici)
      setSound(!soundOn);

      // Certains navigateurs exigent un "play()" après unmute
      // On relance proprement (sans erreurs bloquantes)
      videos.forEach(async (v) => {
        try { await v.play(); } catch(e) {}
      });
    });
  }

  // ---------- 2) FADE-IN ON SCROLL ----------
  // Ajoute automatiquement .reveal à certaines zones si pas déjà fait
  const autoReveal = [
    ".headline", ".sub", ".cta-row", ".quick-links",
    ".story", ".cinematic-break", "#token", "#help", "#contact"
  ];

  autoReveal.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      if (!el.classList.contains("reveal")) el.classList.add("reveal");
    });
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("in");
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  // ---------- 3) MICRO PARTICLES (CANVAS) ----------
  const canvas = document.getElementById("particles");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let w, h, dpr;
  let particles = [];

  function resize(){
    dpr = Math.max(1, window.devicePixelRatio || 1);
    w = canvas.clientWidth;
    h = canvas.clientHeight;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // densité stable selon surface
    const count = Math.min(90, Math.max(40, Math.floor((w * h) / 22000)));
    particles = new Array(count).fill(0).map(() => makeParticle());
  }

  function makeParticle(){
    const speed = Math.random() * 0.35 + 0.12;
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.6 + 0.6,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      a: Math.random() * 0.35 + 0.15
    };
  }

  function step(){
    ctx.clearRect(0, 0, w, h);

    // points
    for (const p of particles){
      p.x += p.vx;
      p.y += p.vy;

      // wrap
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(140, 255, 180, ${p.a})`; // vert doux
      ctx.fill();
    }

    // lignes proches (effet blockchain)
    for (let i = 0; i < particles.length; i++){
      for (let j = i + 1; j < particles.length; j++){
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 120){
          const alpha = (1 - dist / 120) * 0.16;
          ctx.strokeStyle = `rgba(120, 255, 170, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(step);
  }

  window.addEventListener("resize", resize);
  resize();
  step();
});
