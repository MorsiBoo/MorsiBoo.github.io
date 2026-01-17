/* =======================================================
   BRBRT ULTRA++ "NEURAL INTERFACE" SCRIPT
   - Reactive Particle Physics (Mouse Interaction)
   - Cyberpunk Text Decryption (Scramble Effect)
   - Immersive Sound Engine (UI Hover + Clicks)
   - Smooth Scroll & Mobile Logic
   ======================================================= */

(() => {
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => Array.from(root.querySelectorAll(q));

  // --- UTILS: THE SCRAMBLER (Effet de décryptage textuel) ---
  const CHARS = "ABCDEF0123456789xyz#%&@$";
  
  function scrambleText(element, finalState, duration = 800) {
    let frame = 0;
    const totalFrames = duration / 30; // 30ms per frame
    const original = finalState || element.textContent;
    
    const interval = setInterval(() => {
      element.textContent = original
        .split("")
        .map((letter, index) => {
          if (index < (frame / totalFrames) * original.length) {
            return original[index];
          }
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join("");

      if (frame >= totalFrames) {
        clearInterval(interval);
        element.textContent = original; // Ensure cleanliness
      }
      frame++;
    }, 30);
  }

  // --- UI: TOAST NOTIFICATIONS ---
  const toastEl = $("#toast");
  function toast(msg, type = "normal") {
    if (!toastEl) return;
    
    // Reset animation
    toastEl.style.animation = 'none';
    toastEl.offsetHeight; /* trigger reflow */
    toastEl.style.animation = null;

    toastEl.innerHTML = `<span style="color:${type==='error'?'#ff4444':'#64ff7a'}">●</span> ${msg}`;
    toastEl.classList.add("show");
    
    if (window.innerWidth > 768) {
      // Petit effet scramble sur le toast aussi
      scrambleText(toastEl, toastEl.textContent, 400);
    }

    window.clearTimeout(toastEl._t);
    toastEl._t = window.setTimeout(() => toastEl.classList.remove("show"), 2500);
  }

  // --- UI: GENERAL ---
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Smooth Scroll & Offset
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const target = $(href);
      if (target) {
        e.preventDefault();
        const offset = 80; // Compensate for fixed header
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = target.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
        closeMobileNav();
        Sound.sfx("click");
      }
    });
  });

  // Mobile Nav
  const nav = $("#nav");
  const burger = $("#burger");

  function openMobileNav() {
    if (!nav || !burger) return;
    nav.classList.add("nav--open");
    burger.setAttribute("aria-expanded", "true");
    Sound.sfx("whoosh");
  }

  function closeMobileNav() {
    if (!nav || !burger) return;
    nav.classList.remove("nav--open");
    burger.setAttribute("aria-expanded", "false");
  }

  if (burger) {
    burger.addEventListener("click", () => {
      if (nav.classList.contains("nav--open")) closeMobileNav();
      else openMobileNav();
    });
  }
  
  // Close nav when clicking outside
  document.addEventListener("click", (e) => {
    if (!nav || !burger) return;
    const inside = nav.contains(e.target) || burger.contains(e.target);
    if (!inside && nav.classList.contains("nav--open")) closeMobileNav();
  });

  // --- SCROLL REVEAL (Observer) ---
  const revealEls = $$(".reveal");
  const io = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      if (ent.isIntersecting) {
        ent.target.classList.add("in");
        io.unobserve(ent.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));

  // --- ACTIONS: COPY & EMAIL ---
  
  // 1. Contract Copy
  const contractText = $("#contractText");
  const copyContractBtn = $("#copyContractBtn");
  
  if (copyContractBtn && contractText) {
    copyContractBtn.addEventListener("click", async () => {
      const txt = contractText.textContent.trim();
      const originalBtnText = copyContractBtn.innerHTML;
      
      try {
        await navigator.clipboard.writeText(txt);
        Sound.sfx("success"); // New specific sound
        toast("Smart Contract Copied");
        
        // Visual feedback on button
        copyContractBtn.style.borderColor = "#64ff7a";
        copyContractBtn.innerHTML = `<span style="color:#64ff7a">COPIED</span>`;
        setTimeout(() => {
          copyContractBtn.innerHTML = originalBtnText;
          copyContractBtn.style.borderColor = "";
        }, 2000);
        
      } catch {
        toast("Manual copy required", "error");
      }
    });
  }

  // 2. Email Logic
  const emailTextEl = $("#emailText");
  const emailLink = $("#emailLink");
  const copyEmailBtn = $("#copyEmailBtn");
  const emailUser = "contact";
  const emailDomain = "brbrt.com";
  const email = `${emailUser}@${emailDomain}`;

  if (emailTextEl) {
    emailTextEl.textContent = email;
    // Petit effet au chargement
    scrambleText(emailTextEl, email);
  }
  
  if (emailLink) {
    emailLink.textContent = `Connect: ${email}`;
    emailLink.setAttribute("href", `mailto:${email}?subject=Invest%20In%20Future`);
  }

  if (copyEmailBtn) {
    copyEmailBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(email);
        Sound.sfx("success");
        toast("Email Address Securely Copied");
      } catch {
        toast("Error copying email", "error");
      }
    });
  }

  // 3. Form Logic
  const form = $("#contactForm");
  const hp = $("#hpField");
  
  if (form) {
    const startTs = Date.now();
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      
      // Honeypot & Time check
      if (hp && hp.value.trim().length > 0) return;
      if (Date.now() - startTs < 2000) {
        toast("System processing... please wait", "error");
        return;
      }

      Sound.sfx("click");
      const fd = new FormData(form);
      const name = (fd.get("name") || "Investor").toString().trim();
      const msg  = (fd.get("message") || "").toString().trim();
      
      const subject = encodeURIComponent("BRBRT Inquiry");
      const body = encodeURIComponent(`Origin: Website Form\nName: ${name}\n\n${msg}`);
      
      // Simulate network request visual
      const btn = form.querySelector("button");
      const oldTxt = btn ? btn.textContent : "Send";
      if(btn) {
        btn.textContent = "ENCRYPTING...";
        scrambleText(btn, "SENDING...");
      }

      setTimeout(() => {
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
        if(btn) btn.textContent = oldTxt;
      }, 1500);
    });
  }

  /* =========================================
     AUDIO ENGINE 2.0 (Immersive & Spatial)
     ========================================= */
  const soundBtn = $("#soundBtn");
  const soundIcon = $("#soundIcon");
  const soundLabel = $("#soundLabel");
  const trailerBtn = $("#trailerBtn");
  const heroVideo = $("#heroVideo");

  const Sound = {
    enabled: false,
    trailerMode: true,
    _ctx: null, // AudioContext for advanced features later if needed
    _audio: {},
    _once: new Set(),

    init() {
      // Load prefs
      const s = localStorage.getItem("BRBRT_sound");
      const t = localStorage.getItem("BRBRT_trailer");
      if (s === "1") this.enabled = false; // Always start mute for UX safety
      if (t === "0") this.trailerMode = false;

      // --- SOUND PACK ---
      // Backgrounds
      this._audio.hero = this._make("assets/Hero.m4a", true, 0.4);
      this._audio.atmo = this._make("assets/atmosphere-sound-effect.mp3", true, 0.2);
      
      // UI SFX
      this._audio.click = this._make("assets/Click.mp3", false, 0.6);
      this._audio.hover = this._make("assets/audio/hover.wav", false, 0.15, true); // NEW: Subtle tick
      this._audio.success = this._make("assets/audio/success.wav", false, 0.5, true); // NEW: Tech confirm
      
      // Cinematic
      this._audio.hit = this._make("assets/audio/hit.wav", false, 0.7, true);
      this._audio.stinger = this._make("assets/audio/stinger.wav", false, 0.7, true);
      this._audio.whoosh = this._make("assets/audio/whoosh.wav", false, 0.5, true);

      this._syncUI();
      this._attachHoverSounds();
    },

    _make(src, loop, vol, optional = false) {
      const a = new Audio();
      a.src = src;
      a.loop = !!loop;
