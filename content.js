// content.js
// Detect text selection and notify background service worker.

function notifySelection() {
  const selection = window.getSelection();
  const text = selection ? selection.toString().trim() : "";
  if (text && text.length > 0) {
    chrome.runtime.sendMessage({ action: "textSelected", text });
  }
}

// Listen to mouseup and keyboard events
document.addEventListener("mouseup", () => setTimeout(notifySelection, 10));
document.addEventListener("keyup", (e) => {
  if (e.key === "Enter" || e.key === "Escape") setTimeout(notifySelection, 10);
});
