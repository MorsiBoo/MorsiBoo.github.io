// === CONFIGURATION OFFICIELLE BRBR ===
const LINKS = {
  pancakeswap: "https://pancakeswap.finance/swap?outputCurrency=0xf97522ABEf762d28729E073019343b72C6e8D2C1",
  bscscan: "https://bscscan.com/address/0xf97522ABEf762d28729E073019343b72C6e8D2C1",
  linktree: "https://linktr.ee/barbourbrbr" // Lien mis à jour
};

// Injection des liens
document.getElementById("btnPancake").href = LINKS.pancakeswap;
document.getElementById("btnBscscan").href = LINKS.bscscan;
document.getElementById("btnLinktree").href = LINKS.linktree;

// Animation pour éviter la page blanche
document.addEventListener("DOMContentLoaded", () => {
    document.body.style.opacity = "1";
    // Force l'affichage même si le scroll ne bouge pas
    setTimeout(() => {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    }, 500);
});
