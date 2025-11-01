// gemini-controller.js
import { GeminiNano } from './gemini-nano.js';

export async function handleAction(action, text, options = {}) {
  const { targetLanguage = 'en', mode = 'as-is' } = options;

  switch(action) {
    case 'translate': {
      // Detect language if needed
      const detected = await GeminiNano.detectLanguage(text);
      console.log(detected)
      const sourceLanguage = detected?.detectedLanguage || 'en';
      console.log(sourceLanguage)
      console.log("Target lang")
      console.log(targetLanguage)

      // Translate text
      const translatedText = await GeminiNano.translate(text, sourceLanguage, targetLanguage);

      // If mode is simplify/enhance, use Rewriter API on translated text
      if (mode !== 'as-is') {
        const rewriterOptions = {
          tone: mode === 'simplify' ? 'more-casual' : 'more-formal',
          outputLanguage: targetLanguage,        // <-- important
        };
        return await GeminiNano.rewrite(translatedText, rewriterOptions);
      }

      return translatedText;
    }

    case 'detect':
      return await GeminiNano.detectLanguage(text);

    case 'summarize':
      return await GeminiNano.summarize(text, { type: 'key-points', length: 'medium', outputLanguage: targetLanguage });

    case 'rewrite':
      return await GeminiNano.rewrite(text, { tone: 'more-formal', outputLanguage: targetLanguage });

    case 'write':
      return await GeminiNano.write(text, { tone: 'formal', outputLanguage: targetLanguage });

    case 'prompt':
      return await GeminiNano.prompt(text);

    case 'generateQuiz':
        return await generateQuiz(text, options);

    default:
      throw new Error('Unsupported action: ' + action);
  }

  
}

async function generateQuiz(text, { targetLanguage }) {
  console.log("Inside generateQuiz (Gemini Nano Prompt API)");

  const prompt = `
  Create a short quiz to help a user learn ${targetLanguage}.
  Use the following text as context: "${text}".

  Include:
  - 2 multiple-choice questions regarding the meaning of phrases in ${targetLanguage} (each with 4 options and one correct answer)
  - 1 fill-in-the-blank question.
  Return valid JSON only, in this format:
  [
    {"type": "mcq", "question": "...", "options": ["A", "B", "C", "D"], "answer": "A"},
    {"type": "mcq", "question": "...", "options": ["..."], "answer": "..."},
    {"type": "fill", "question": "....", "answer": "..."}
  ]
  `;


  try {
  console.log("Using Gemini Nano via Prompt API...");

  // Check availability
  const availability = await LanguageModel.availability({ model: "gemini-nano" });
  console.log("Gemini Nano availability:", availability);
  if (availability === "downloading") {
    console.log("Gemini Nano is downloading...");
    availability.monitor?.addEventListener("downloadprogress", (e) => {
      console.log(`Downloaded ${(e.loaded * 100).toFixed(2)}%`);
    });
  } else if (availability !== "available") {
    throw new Error("Gemini Nano not available for this session.");
  }

  // Create a session
  const session = await LanguageModel.create({
    model: "gemini-nano",
    monitor(m) {
      m.addEventListener("downloadprogress", (e) => {
        console.log(`Downloaded ${(e.loaded * 100).toFixed(2)}%`);
      });
    },
  });

  // Prompt the model
  const result = await session.prompt(prompt);
  console.log("✅ Gemini Nano raw result:", result);

  // Parse JSON from result
  const jsonStart = result.indexOf("[");
  const jsonEnd = result.lastIndexOf("]");
  const cleanJson = result.slice(jsonStart, jsonEnd + 1);

  const quiz = JSON.parse(cleanJson);
  console.log("✅ Parsed quiz JSON:", quiz);
  return quiz;

} catch (err) {
  console.error("❌ Error generating quiz:", err);
  throw new Error("Quiz generation failed. " + err.message);
}

}

