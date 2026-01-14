/* ============================
   BRBRT Ultra++ Cinematic Script
   - Sound engine (autoplay-safe)
   - Trailer Mode SFX
   - Scroll reveals
   - Particles canvas (lightweight)
   - Copy buttons
   - Mobile nav
   ============================ */

(() => {
  const $ = (q, root=document) => root.querySelector(q);
  const $$ = (q, root=document) => Array.from(root.querySelectorAll(q));

  const toastEl = $("#toast");
  function toast(msg){
    if(!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    window.clearTimeout(toastEl._t);
    toastEl._t = window.setTimeout(()=>toastEl.classList.remove("show"), 1400);
  }

  // Year
  const yearEl = $("#year");
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // Smooth anchor scroll
  $$('a[href^="#"]').forEach(a=>{
    a.addEventListener("click", (e)=>{
      const href = a.getAttribute("href");
      if(!href || href === "#") return;
      const target = $(href);
      if(target){
        e.preventDefault();
        target.scrollIntoView({ behavior:"smooth", block:"start" });
        closeMobileNav();
      }
    });
  });

  // Mobile nav
  const nav = $("#nav");
  const burger = $("#burger");

  function openMobileNav(){
    if(!nav || !burger) return;
    nav.classList.add("nav--open");
    burger.setAttribute("aria-expanded", "true");
  }
  function closeMobileNav(){
    if(!nav || !burger) return;
    nav.classList.remove("nav--open");
    burger.setAttribute("aria-expanded", "false");
  }
  if(burger){
    burger.addEventListener("click", ()=>{
      if(nav.classList.contains("nav--open")) closeMobileNav();
      else openMobileNav();
    });
  }
  document.addEventListener("click", (e)=>{
    if(!nav || !burger) return;
    const inside = nav.contains(e.target) || burger.contains(e.target);
    if(!inside) closeMobileNav();
  });

  // Reveal on scroll
  const revealEls = $$(".reveal");
  const io = new IntersectionObserver((entries)=>{
    for(const ent of entries){
      if(ent.isIntersecting){
        ent.target.classList.add("in");
        io.unobserve(ent.target);
      }
    }
  }, { threshold: 0.14 });
  revealEls.forEach(el=>io.observe(el));

  // Clipboard copy (contract + email)
  const contractText = $("#contractText");
  const copyContractBtn = $("#copyContractBtn");
  if(copyContractBtn && contractText){
    copyContractBtn.addEventListener("click", async ()=>{
      const txt = contractText.textContent.trim();
      try{
        await navigator.clipboard.writeText(txt);
        toast("Contract copied.");
        Sound.sfx("click");
      }catch{
        toast("Copy failed.");
      }
    });
  }

  // Email (obfuscated mailto)
  const emailTextEl = $("#emailText");
  const emailLink = $("#emailLink");
  const copyEmailBtn = $("#copyEmailBtn");

  const emailUser = "contact";
  const emailDomain = "brbrt.com";
  const email = `${emailUser}@${emailDomain}`;

  if(emailTextEl) emailTextEl.textContent = email;
  if(emailLink){
    emailLink.textContent = `Email: ${email}`;
    emailLink.setAttribute("href", `mailto:${email}?subject=BRBRT%20Website%20Contact`);
    emailLink.addEventListener("click", ()=>Sound.sfx("click"));
  }
  if(copyEmailBtn){
    copyEmailBtn.addEventListener("click", async ()=>{
      try{
        await navigator.clipboard.writeText(email);
        toast("Email copied.");
        Sound.sfx("click");
      }catch{
        toast("Copy failed.");
      }
    });
  }

  // Contact form (no backend) + honeypot
  const form = $("#contactForm");
  const hp = $("#hpField");
  if(form){
    const startTs = Date.now();
    form.addEventListener("submit", (e)=>{
      e.preventDefault();
      Sound.sfx("click");

      // simple anti-bot:
      // - honeypot must be empty
      // - user must spend > 2 seconds on page
      if(hp && hp.value.trim().length > 0){
        toast("Blocked.");
        return;
      }
      if(Date.now() - startTs < 2000){
        toast("Please try again.");
        return;
      }

      const fd = new FormData(form);
      const name = (fd.get("name") || "").toString().trim();
      const msg  = (fd.get("message") || "").toString().trim();

      const subject = encodeURIComponent("BRBRT Contact");
      const body = encodeURIComponent(`Name: ${name}\n\nMessage:\n${msg}\n\n— Sent from barbourBRBRT.xyz`);
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    });
  }

  /* ===========================
     SOUND ENGINE (autoplay safe)
     =========================== */

  const soundBtn = $("#soundBtn");
  const soundIcon = $("#soundIcon");
  const soundLabel = $("#soundLabel");
  const heroVideo = $("#heroVideo");

  const trailerBtn = $("#trailerBtn");

  const Sound = {
    enabled: false,
    trailerMode: true,
    unlocked: false,
    _audio: {},
    _once: new Set(),

    init(){
      // Load persisted settings
      const saved = localStorage.getItem("BRBRT_sound");
      if(saved === "1") this.enabled = false; // keep off until user clicks (browser rules)
      const tm = localStorage.getItem("BRBRT_trailer");
      if(tm === "0") this.trailerMode = false;

      this._audio.hero = this._makeAudio("assets/Hero.m4a", true, 0.55);
      this._audio.atmo = this._makeAudio("assets/atmosphere-sound-effect.mp3", true, 0.30);
      this._audio.click = this._makeAudio("assets/Click.mp3", false, 0.85);

      // Trailer pack (optional, if exists)
      this._audio.hit     = this._makeAudio("assets/audio/hit.wav", false, 0.80, true);
      this._audio.whoosh  = this._makeAudio("assets/audio/whoosh.wav", false, 0.75, true);
      this._audio.stinger = this._makeAudio("assets/audio/stinger.wav", false, 0.80, true);

      this._syncButtons();
    },

    _makeAudio(src, loop, vol, optional=false){
      const a = new Audio();
      a.src = src;
      a.preload = "auto";
      a.loop = !!loop;
      a.volume = vol ?? 0.6;
      a.muted = true; // always start muted until user enables
      a.playsInline = true;

      // If optional file is missing, ignore errors silently
      if(optional){
        a.addEventListener("error", ()=>{ /* ignore */ }, { once:true });
      }
      return a;
    },

    _syncButtons(){
      if(trailerBtn){
        trailerBtn.setAttribute("aria-pressed", this.trailerMode ? "true" : "false");
        trailerBtn.classList.toggle("isOn", this.trailerMode);
      }
      if(soundBtn){
        soundBtn.setAttribute("aria-pressed", this.enabled ? "true" : "false");
      }
      if(soundIcon) soundIcon.textContent = this.enabled ? "🔊" : "🔇";
      if(soundLabel) soundLabel.textContent = this.enabled ? "Sound On" : "Sound";
    },

    async toggle(){
      if(!this.enabled){
        await this.enable();
      }else{
        this.disable();
      }
    },

    async enable(){
      // Must be triggered by a user gesture.
      this.enabled = true;
      localStorage.setItem("BRBRT_sound","1");

      // Unmute + play loops
      await this._unlockAndStart();
      this._syncButtons();
      toast("Sound enabled.");
      this.sfx("whoosh");
    },

    disable(){
      this.enabled = false;
      localStorage.setItem("BRBRT_sound","0");

      for(const k of Object.keys(this._audio)){
        const a = this._audio[k];
        if(!a) continue;
        a.muted = true;
        try{ a.pause(); }catch{}
      }
      // keep hero video muted
      if(heroVideo){
        heroVideo.muted = true;
        heroVideo.volume = 0;
      }

      this._syncButtons();
      toast("Sound muted.");
    },

    async _unlockAndStart(){
      if(!this.enabled) return;

      // Unmute loops
      const hero = this._audio.hero;
      const atmo = this._audio.atmo;

      // attempt to start audio; some browsers need a "play" inside click
      for(const a of [hero, atmo]){
        if(!a) continue;
        a.muted = false;
        try{
          await a.play();
        }catch(e){
          // If blocked, keep muted and retry on next click
          a.muted = true;
        }
      }

      // If hero video contains audio track and you want it: enable here
      // (If your hero video is silent, Hero.m4a provides the soundtrack.)
      if(heroVideo){
        try{
          heroVideo.muted = false;
          heroVideo.volume = 0.45;
          await heroVideo.play();
        }catch(e){
          heroVideo.muted = true;
          heroVideo.volume = 0;
        }
      }

      this.unlocked = true;
    },

    sfx(name){
      if(!this.enabled) return;
      const a = this._audio[name] || this._audio.click;
      if(!a) return;

      // if optional SFX missing, do nothing
      if(a.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) return;

      // restart quickly
      try{
        a.muted = false;
        a.currentTime = 0;
        a.play().catch(()=>{});
      }catch{}
    },

    hitOnce(key, sfxName){
      if(this._once.has(key)) return;
      this._once.add(key);
      if(this.trailerMode) this.sfx(sfxName);
    }
  };

  Sound.init();

  if(soundBtn){
    soundBtn.addEventListener("click", async ()=>{
      await Sound.toggle();
    });
_toggleFix(soundBtn);
  }

  function _toggleFix(btn){
    // Prevent "stuck" state from accidental double clicks / focus issues
    btn.addEventListener("pointerdown", ()=>btn.classList.add("pressed"));
    btn.addEventListener("pointerup", ()=>btn.classList.remove("pressed"));
    btn.addEventListener("pointercancel", ()=>btn.classList.remove("pressed"));
  }

  if(trailerBtn){
    trailerBtn.addEventListener("click", ()=>{
      Sound.trailerMode = !Sound.trailerMode;
      localStorage.setItem("BRBRT_trailer", Sound.trailerMode ? "1" : "0");
      Sound._syncButtons();
      toast(Sound.trailerMode ? "Trailer Mode ON" : "Trailer Mode OFF");
      Sound.sfx("click");
    });
  }

  // Add SFX to key CTA clicks
  const watchBtn = $("#watchStoryBtn");
  if(watchBtn){
    watchBtn.addEventListener("click", ()=> Sound.sfx("whoosh"));
  }

  // Cinematic hits on section reveal
  const tokenSection = $("#token");
  const logoVideo = $("#logoVideo");

  const hitIO = new IntersectionObserver((entries)=>{
    for(const ent of entries){
      if(ent.isIntersecting){
        if(ent.target === tokenSection){
          Sound.hitOnce("hit_token", "hit");
        }
        if(ent.target === logoVideo){
          Sound.hitOnce("hit_logo", "stinger");
        }
      }
    }
  }, { threshold: 0.30 });

  if(tokenSection) hitIO.observe(tokenSection);
  if(logoVideo) hitIO.observe(logoVideo);

  // Always keep logo video muted (it’s a loop, soundtrack is separate)
  if(logoVideo){
    logoVideo.muted = true;
    logoVideo.volume = 0;
    logoVideo.play().catch(()=>{});
  }

  /* ===================
     LIGHT PARTICLES FX
     =================== */
  const canvas = $("#fxCanvas");
  if(canvas){
    const ctx = canvas.getContext("2d", { alpha:true });
    let w=0,h=0, dpr=1;
    let running = true;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const nodes = [];
    const MAX = reduceMotion ? 40 : 85;

    function resize(){
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      w = canvas.width = Math.floor(window.innerWidth * dpr);
      h = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    }
    window.addEventListener("resize", resize);
    resize();

    function rand(min,max){ return min + Math.random()*(max-min); }

    function init(){
      nodes.length=0;
      for(let i=0;i<MAX;i++){
        nodes.push({
          x: rand(0,w),
          y: rand(0,h),
          vx: rand(-0.12,0.12)*dpr,
          vy: rand(-0.10,0.10)*dpr,
          r: rand(0.8,1.8)*dpr,
          a: rand(0.15,0.40)
        });
      }
    }
    init();

    document.addEventListener("visibilitychange", ()=>{
      running = !document.hidden;
      if(running) requestAnimationFrame(tick);
    });

    function tick(){
      if(!running) return;
      ctx.clearRect(0,0,w,h);

      // soft gradient wash
      const g = ctx.createRadialGradient(w*0.5,h*0.15, 0, w*0.5,h*0.2, Math.max(w,h)*0.8);
      g.addColorStop(0, "rgba(100,255,122,0.08)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0,0,w,h);

      // nodes
      for(const p of nodes){
        p.x += p.vx;
        p.y += p.vy;

        if(p.x<0) p.x=w;
        if(p.x>w) p.x=0;
        if(p.y<0) p.y=h;
        if(p.y>h) p.y=0;

        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle = `rgba(140,255,170,${p.a})`;
        ctx.fill();
      }

      // connections (light)
      if(!reduceMotion){
        for(let i=0;i<nodes.length;i++){
          for(let j=i+1;j<nodes.length;j++){
            const a = nodes[i], b = nodes[j];
            const dx = a.x-b.x, dy = a.y-b.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if(dist < 140*dpr){
              const alpha = (1 - dist/(140*dpr)) * 0.10;
              ctx.strokeStyle = `rgba(120,255,170,${alpha})`;
              ctx.lineWidth = 1*dpr;
              ctx.beginPath();
              ctx.moveTo(a.x,a.y);
              ctx.lineTo(b.x,b.y);
              ctx.stroke();
            }
          }
        }
      }

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Expose Sound for debugging (optional)
  window.BRBRT_SOUND = Sound;
})();
