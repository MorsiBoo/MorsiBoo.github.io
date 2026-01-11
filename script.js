// =======================
//  BRBR LINKS (REAL)
// =======================
const BRBR_LINKS = {
  linktree: "https://linktr.ee/barbourbrbr",
  pancakeswap: "https://pancakeswap.finance/swap?outputCurrency=0xf97522ABEf762d28729E073019343b72C6e8D2C1&chain=bsc",
  bscscan: "https://bscscan.com/token/0xf97522ABEF762d28729E073019343b72C6e8D2C1"
};

// ===== DOM =====
const heroVideo = document.getElementById("heroVideo");
const logoVideo = document.getElementById("logoVideo");

const ambience = document.getElementById("ambience");
const clickSfx = document.getElementById("clickSfx");
const heroAudio = document.getElementById("heroAudio");

const soundToggle = document.getElementById("soundToggle");
const soundIcon = document.getElementById("soundIcon");
const trailerBtn = document.getElementById("trailerBtn");

let audioEnabled = false;
let muted = true;

// --------------------
//  SAFE AUDIO PLAY
// --------------------
function safePlay(mediaEl){
  if (!mediaEl) return;
  const p = mediaEl.play();
  if (p && typeof p.catch === "function") p.catch(()=>{});
}
function setMuted(state){
  muted = state;
  document.body.classList.toggle("no-audio", muted);

  // audio
  [ambience, heroAudio].forEach(a => { if (a) a.muted = muted; });

  // videos: keep them muted always for autoplay stability
  if (heroVideo) heroVideo.muted = true;
  if (logoVideo) logoVideo.muted = true;

  soundIcon.textContent = muted ? "🔇" : "🔊";
}
setMuted(true);

// click sfx on UI interactions
document.addEventListener("click", (e) => {
  const target = e.target.closest("[data-click]");
  if (!target) return;
  if (clickSfx){
    clickSfx.currentTime = 0;
    safePlay(clickSfx);
  }
});

// --------------------
//  External Links (100%)
// --------------------
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[data-link]");
  if (!a) return;

  e.preventDefault();
  const key = a.getAttribute("data-link");
  const url = BRBR_LINKS[key];
  if (!url) return;

  window.open(url, "_blank", "noopener,noreferrer");
});

// --------------------
//  TRAILER MODE (enable sound)
// --------------------
async function enableAudio(){
  if (audioEnabled) return;
  audioEnabled = true;

  // prepare volumes
  if (ambience){ ambience.volume = 0.35; }
  if (heroAudio){ heroAudio.volume = 0.9; }

  // start ambience + keep running
  safePlay(ambience);

  // hero audio (one-shot vibe)
  if (heroAudio){
    heroAudio.currentTime = 0;
    safePlay(heroAudio);
  }

  // ensure hero video plays too
  safePlay(heroVideo);

  // unmute our AUDIO elements
  setMuted(false);
}

if (trailerBtn){
  trailerBtn.addEventListener("click", () => {
    enableAudio();
  });
}

if (soundToggle){
  soundToggle.addEventListener("click", async () => {
    // if user unmutes before enabling audio, enable first
    if (!audioEnabled) await enableAudio();
    setMuted(!muted);
  });
}

// If user scrolls/clicks anywhere, we can softly start ambience (still muted until toggle)
const firstUserGesture = () => {
  safePlay(heroVideo);
  // we don't enableAudio here to respect autoplay rules; we just prep.
  window.removeEventListener("pointerdown", firstUserGesture);
  window.removeEventListener("keydown", firstUserGesture);
};
window.addEventListener("pointerdown", firstUserGesture, { once:true });
window.addEventListener("keydown", firstUserGesture, { once:true });

// --------------------
//  REVEAL ON SCROLL
// --------------------
const revealEls = Array.from(document.querySelectorAll(".reveal"));
const io = new IntersectionObserver((entries) => {
  entries.forEach((ent) => {
    if (ent.isIntersecting) ent.target.classList.add("is-visible");
  });
}, { threshold: 0.12 });

revealEls.forEach(el => io.observe(el));

// --------------------
//  MICRO PARTICLES (light + stable)
// --------------------
const canvas = document.getElementById("particles");
const ctx = canvas?.getContext("2d");
let W = 0, H = 0, dpr = 1;
let particles = [];
let raf = null;

function resize(){
  if (!canvas || !ctx) return;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  W = canvas.clientWidth = window.innerWidth;
  H = canvas.clientHeight = window.innerHeight;
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
function rand(min,max){ return min + Math.random()*(max-min); }

function initParticles(){
  if (!canvas || !ctx) return;
  particles = [];
  const count = Math.max(28, Math.min(70, Math.floor((W*H)/26000)));
  for (let i=0;i<count;i++){
    particles.push({
      x: rand(0,W),
      y: rand(0,H),
      r: rand(0.6, 2.0),
      vx: rand(-0.18, 0.18),
      vy: rand(-0.12, 0.12),
      a: rand(0.12, 0.35)
    });
  }
}
function tick(){
  if (!ctx) return;

  ctx.clearRect(0,0,W,H);

  // draw
  for (const p of particles){
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < -10) p.x = W + 10;
    if (p.x > W + 10) p.x = -10;
    if (p.y < -10) p.y = H + 10;
    if (p.y > H + 10) p.y = -10;

    ctx.globalAlpha = p.a;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fillStyle = "rgba(109,255,122,1)";
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  raf = requestAnimationFrame(tick);
}

function startParticles(){
  if (!canvas || !ctx) return;
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  resize();
  initParticles();
  cancelAnimationFrame(raf);
  tick();
}

window.addEventListener("resize", () => {
  resize();
  initParticles();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden){
    cancelAnimationFrame(raf);
  } else {
    startParticles();
  }
});

startParticles();
