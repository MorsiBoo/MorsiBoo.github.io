const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");

menuBtn?.addEventListener("click", () => {
  sidebar.classList.toggle("isOpen");
});

document.querySelectorAll(".nav__link").forEach(a => {
  a.addEventListener("click", () => {
    sidebar.classList.remove("isOpen");
  });
});

// Year
document.getElementById("year").textContent = new Date().getFullYear();

// Copy helpers
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

const copyContractBtn = document.getElementById("copyContract");
copyContractBtn?.addEventListener("click", async () => {
  const contract = document.getElementById("contract")?.textContent?.trim() || "";
  const ok = await copyText(contract);
  copyContractBtn.textContent = ok ? "Copied" : "Copy failed";
  setTimeout(() => (copyContractBtn.textContent = "Copy"), 1200);
});

const copyEmailBtn = document.getElementById("copyEmail");
copyEmailBtn?.addEventListener("click", async () => {
  const email = "contact@barbourbrbr.xyz";
  const ok = await copyText(email);
  copyEmailBtn.textContent = ok ? "Copied" : "Copy failed";
  setTimeout(() => (copyEmailBtn.textContent = "Copy email"), 1200);
});

// Modal (comic zoom)
const modal = document.getElementById("modal");
const openComic = document.getElementById("openComic");
const modalClose = document.getElementById("modalClose");
const modalX = document.getElementById("modalX");

function openModal() {
  modal.classList.add("isOpen");
  modal.setAttribute("aria-hidden", "false");
}
function closeModal() {
  modal.classList.remove("isOpen");
  modal.setAttribute("aria-hidden", "true");
}

openComic?.addEventListener("click", openModal);
modalClose?.addEventListener("click", closeModal);
modalX?.addEventListener("click", closeModal);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});
