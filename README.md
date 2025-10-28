# PolyglotPro (MVP) — Chrome Extension

PolyglotPro is a hackathon-ready MVP that turns highlighted web text into an interactive learning moment:
- Translate (to English by default)
- Simplify (rewrite to plain English)
- Explain grammar / key points

All features are built to use **on-device Gemini Nano APIs** (Prompt, Translator, Rewriter, Summarizer, Proofreader).

## How to load locally (development)
1. Clone or copy this folder to your machine.
2. Open Chrome (preferably a version with built-in AI / Canary if required).
3. Navigate to `chrome://extensions`.
4. Enable **Developer mode** (top-right).
5. Click **Load unpacked** → select the `polyglotpro/` folder.
6. Open any web page, highlight some text, click the PolyglotPro extension icon.
7. The selected text should appear in the popup (or paste text), then click Translate / Simplify / Explain.

## Where to plug in real Gemini Nano calls
Replace the placeholder implementations in `gemini/gemini-nano.js` with the exact built-in API calls your hackathon environment provides. The extension expects each wrapper function to return a plain text string.

## Next steps (hackathon stretch goals)
- Add Summarizer, Proofreader, Writer actions in the popup.
- Implement "Save to Notebook" and a review/quiz flow (Writer + Proofreader).
- Add difficulty levels (A1..C2) and per-user progress (local storage).
- Add pronunciation audio (on-device TTS) and speech practice.

## Demo script (90s)
1. Open a French news article.
2. Highlight a paragraph → open extension.
3. Click "Translate" — show translation.
4. Click "Simplify" — show simplified rewrite.
5. Click "Explain Grammar" — show prompt-based explanation.
6. Save example to Notebook (stretch goal).

