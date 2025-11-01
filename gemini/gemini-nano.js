// gemini-nano.js
// Unified interface for Chrome built-in AI APIs (Gemini Nano, Translator, etc.)

export const GeminiNano = {
  /** Check availability of all APIs **/
  async checkAvailability() {
    const apis = {
      Summarizer: 'Summarizer' in self ? await Summarizer.availability() : 'unavailable',
      Writer: 'Writer' in self ? await Writer.availability() : 'unavailable',
      Rewriter: 'Rewriter' in self ? await Rewriter.availability() : 'unavailable',
      Translator: 'Translator' in self ? 'available' : 'unavailable',
      LanguageDetector: 'LanguageDetector' in self ? 'available' : 'unavailable',
      Prompt:'Prompt' in self ? await Prompt.availability() : 'unavailable',
    };
    console.table(apis);
    return apis;
  },

  /** Detect language of given text **/
  async detectLanguage(text) {
    if (!('LanguageDetector' in self)) throw new Error('Language Detector API not supported.');
    const detector = await LanguageDetector.create({
      monitor(m) {
        m.addEventListener('downloadprogress', e => console.log(`Language model: ${e.loaded * 100}%`));
      },
    });
    const results = await detector.detect(text);
    return results[0]; // { detectedLanguage, confidence }
  },

  /** Translate text between languages **/
  async translate(text, sourceLang, targetLang) {
    if (!('Translator' in self)) throw new Error('Translator API not supported.');
    if (!sourceLang) {
      const detected = await this.detectLanguage(text);
      sourceLang = detected.detectedLanguage;
    }

    const translator = await Translator.create({
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      monitor(m) {
        m.addEventListener('downloadprogress', e => console.log(`Translator: ${e.loaded * 100}%`));
      },
    });

    const translated = await translator.translate(text);
    return translated;
  },

  /** Summarize long text **/
  async summarize(text, options = {}) {
    if (!('Summarizer' in self)) throw new Error('Summarizer API not supported.');

    const availability = await Summarizer.availability();
    if (availability === 'unavailable') throw new Error('Summarizer unavailable.');

    const summarizer = await Summarizer.create({
      type: options.type || 'key-points',
      format: options.format || 'markdown',
      length: options.length || 'medium',
      monitor(m) {
        m.addEventListener('downloadprogress', e => console.log(`Summarizer: ${e.loaded * 100}%`));
      },
    });

    const summary = await summarizer.summarize(text, { context: options.context || '' });
    return summary;
  },

  /** Write new content **/
  async write(prompt, options = {}) {
    if (!('Writer' in self)) throw new Error('Writer API not supported.');

    const available = await Writer.availability();
    if (available === 'unavailable') throw new Error('Writer unavailable.');

    const writer = await Writer.create({
      tone: options.tone || 'neutral',
      format: options.format || 'plain-text',
      length: options.length || 'medium',
      sharedContext: options.sharedContext || '',
      monitor(m) {
        m.addEventListener('downloadprogress', e => console.log(`Writer: ${e.loaded * 100}%`));
      },
    });

    const output = await writer.write(prompt, { context: options.context || '' });
    return output;
  },

  /** Rewrite existing text **/
  async rewrite(text, options = {}) {
  if (!('Rewriter' in self)) throw new Error('Rewriter API not supported.');

  const available = await Rewriter.availability();
  if (available === 'unavailable') throw new Error('Rewriter unavailable.');

  const rewriter = await Rewriter.create({
    tone: options.tone || 'as-is',                     // simplify / enhance / as-is
    format: options.format || 'plain-text',
    length: options.length || 'as-is',
    sharedContext: options.sharedContext || '',
    expectedInputLanguages: options.expectedInputLanguages || ['en'],
    expectedContextLanguages: options.expectedContextLanguages || ['en'],
    outputLanguage: options.outputLanguage || 'en',    // <--- ADD THIS
    monitor(m) {
      m.addEventListener('downloadprogress', e => console.log(`Rewriter: ${e.loaded * 100}%`));
    },
  });

  const rewritten = await rewriter.rewrite(text, { context: options.context || '' });
  return rewritten;
},

/** General-purpose prompt using the Chrome Prompt API (Gemini Nano) **/
async prompt(promptText, options = {}) {
  try {
    if (!('LanguageModel' in self))
      throw new Error('Prompt API not supported in this environment.');

    // Check model availability
    const availability = await LanguageModel.availability({
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }]
    });

    if (availability === 'unavailable')
      throw new Error('Gemini Nano Prompt API unavailable.');

    if (availability === 'downloadable' || availability === 'downloading') {
      console.log('Gemini Nano model needs to be downloaded. Waiting for user interaction...');
    }

    // Create a session
    const session = await LanguageModel.create({
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }],
      monitor(m) {
        m.addEventListener('downloadprogress', e => {
          console.log(`Downloaded ${(e.loaded * 100).toFixed(1)}%`);
        });
      },
      initialPrompts: [
        { role: 'system', content: options.systemPrompt || 'You are a helpful assistant that returns JSON if requested.' }
      ],
    });

    // Prompt the model (array format is required)
    const result = await session.prompt([
      { role: 'user', content: promptText }
    ]);

    session.destroy?.();

    // Try to parse JSON if possible
    const jsonStart = result.indexOf("{");
    const jsonEnd = result.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      try {
        return JSON.parse(result.slice(jsonStart, jsonEnd + 1));
      } catch {
        console.warn("⚠️ Could not parse strict JSON. Returning raw text.");
      }
    }

    return result;
  } catch (err) {
    console.error("❌ GeminiNano.prompt() failed:", err);
    throw err;
  }
}

};
