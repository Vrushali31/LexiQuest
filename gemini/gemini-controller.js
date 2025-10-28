// gemini-controller.js
import { GeminiNano } from './gemini-nano.js';

export async function handleAction(action, text, options = {}) {
  const { targetLanguage = 'en', mode = 'as-is' } = options;

  switch(action) {
    case 'translate': {
      // Step 1: Detect language if needed
      const detected = await GeminiNano.detectLanguage(text);
      console.log(detected)
      const sourceLanguage = detected?.detectedLanguage || 'en';
      console.log(sourceLanguage)
      console.log("Target lang")
      console.log(targetLanguage)

      // Step 2: Translate text
      const translatedText = await GeminiNano.translate(text, sourceLanguage, targetLanguage);

      // Step 3: If mode is simplify/enhance, use Rewriter API on translated text
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

    case 'generateQuiz':
        return await generateQuiz(text, options);

    default:
      throw new Error('Unsupported action: ' + action);
  }

  
}

// async function generateQuiz(text, { targetLanguage }) {
//     console.log("Inside generateQuiz controller")
//   const prompt = `
//   Create a short interactive quiz to help a user learn ${targetLanguage}.
//   The quiz should be based on this text: "${text}".

//   Include:
//   - 2 multiple-choice questions (each with 4 options and one correct answer)
//   - 1 fill-in-the-blank question.
//   Return JSON only, in this format:
//   [
//     {"type": "mcq", "question": "...", "options": ["A", "B", "C", "D"], "answer": "A"},
//     {"type": "mcq", "question": "...", "options": ["..."], "answer": "..."},
//     {"type": "fill", "question": "....", "answer": "..."}
//   ]
//   `;

//   const response = await gemini.generateContent(prompt);
//   console.log("Got response")
//   const quiz = JSON.parse(response.response.text());
//   return quiz;
// }

async function generateQuiz(text, { targetLanguage }) {
  console.log("🧠 Inside generateQuiz (Gemini Nano Prompt API)");

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
    // ✅ Use Gemini Nano (Prompt API)
    if ("ai" in self && "languageModel" in ai) {
      console.log("🪶 Using Gemini Nano (local model)...");
      const session = await ai.languageModel.create({ model: "gemini-nano" });

      const result = await session.prompt(prompt);
      console.log("✅ Gemini Nano raw result:", result);

      // Try to parse clean JSON
      const jsonStart = result.indexOf('[');
      const jsonEnd = result.lastIndexOf(']');
      const cleanJson = result.slice(jsonStart, jsonEnd + 1);

      const quiz = JSON.parse(cleanJson);
      console.log("✅ Parsed quiz JSON:", quiz);
      return quiz;
    }

    // 🚨 Fallback (if Nano not available)
    console.warn("⚠️ Gemini Nano not available, using fallback cloud model...");
    const response = await GeminiNano.write(prompt, { tone: 'neutral', outputLanguage: targetLanguage });
    const jsonStart = response.indexOf('[');
    const jsonEnd = response.lastIndexOf(']');
    const cleanJson = response.slice(jsonStart, jsonEnd + 1);

    const quiz = JSON.parse(cleanJson);
    return quiz;

  } catch (err) {
    console.error("❌ Error generating quiz:", err);
    throw new Error("Quiz generation failed. " + err.message);
  }
}

