// background.js
// Keeps the latest selected text in chrome.storage and listens to messages.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === "textSelected") {
    const text = message.text;
    chrome.storage.local.set({ selectedText: text }, () => {
      // optional: notify popup if it's open
      sendResponse({ status: "saved" });
    });
    // indicate we'll call sendResponse asynchronously
    return true;
  }
});
