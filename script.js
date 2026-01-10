// === CONFIGURATION DES LIENS ===
const LINKS = {
  pancakeswap: "https://pancakeswap.finance/swap?outputCurrency=0xf97522ABEf762d28729E073019343b72C6e8D2C1",
  bscscan: "https://bscscan.com/address/0xf97522ABEf762d28729E073019343b72C6e8D2C1",
  linktree: "https://linktr.ee/BRBR"
};

// Injection automatique des liens
document.getElementById("btnPancake").href = LINKS.pancakeswap;
document.getElementById("btnBscscan").href = LINKS.bscscan;
document.getElementById("btnLinktree").href = LINKS.linktree;

// Année automatique dans le footer
document.getElementById("year").textContent = new Date().getFullYear();

// ANIMATION D'APPARITION (Reveal)
// Ce code rend les éléments visibles quand on défile la page
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
