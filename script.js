// Year in footer
document.getElementById("year").textContent = new Date().getFullYear();

// Copy token address
const copyBtn = document.getElementById("copyBtn");
const tokenAddressEl = document.getElementById("tokenAddress");

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(tokenAddressEl.textContent.trim());
    copyBtn.textContent = "Copied ✓";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
  } catch (e) {
    // Fallback
    const range = document.createRange();
    range.selectNode(tokenAddressEl);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
    copyBtn.textContent = "Copied ✓";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
  }
});
