import { handleAction } from '../gemini/gemini-controller.js';

console.log("popup.js loaded!");

document.addEventListener('DOMContentLoaded', () => {
  const inputEl = document.getElementById('input');
  const outputEl = document.getElementById('output');
  const langSelect = document.getElementById('targetLang');
  const modeButtons = document.querySelectorAll('.mode-selector button');
  const loader = document.getElementById('loader');
  const translateBtn = document.getElementById('translate');
  const generateQuizBtn = document.getElementById('generateQuiz');
  const saveQuizBtn = document.getElementById('saveQuiz');
  const quizContainer = document.getElementById('quizContainer');

  let currentMode = 'as-is';
  let lastTranslatedText = '';

  /* ===========================
     MODE SELECTION
  ============================ */
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
    });
  });

  /* ===========================
     TAB SWITCHING
  ============================ */
  const tabTranslate = document.getElementById('tab-translate');
  const tabQuiz = document.getElementById('tab-quiz');
  const translateSection = document.getElementById('translate-section');
  const quizSection = document.getElementById('quiz-section');

  function switchTab(tab) {
    if (tab === 'translate') {
      tabTranslate.classList.add('active');
      tabQuiz.classList.remove('active');
      translateSection.classList.add('active');
      quizSection.classList.remove('active');
    } else {
      tabQuiz.classList.add('active');
      tabTranslate.classList.remove('active');
      quizSection.classList.add('active');
      translateSection.classList.remove('active');
    }
  }

  tabTranslate?.addEventListener('click', () => switchTab('translate'));
  tabQuiz?.addEventListener('click', () => switchTab('quiz'));

  /* ===========================
     AUTOFILL SELECTED TEXT
  ============================ */
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab) return;

    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: () => window.getSelection().toString(),
      },
      (result) => {
        if (result && result[0] && result[0].result) {
          inputEl.value = result[0].result.trim();
        }
      }
    );
  });

  /* ===========================
     TRANSLATE HANDLER
  ============================ */
  translateBtn.addEventListener('click', async () => {
    const text = inputEl.value.trim();
    if (!text) return alert('Please enter or select some text.');

    translateBtn.disabled = true;
    loader.style.display = 'inline-block';
    outputEl.textContent = '';

    try {
      const translated = await handleAction('translate', text, {
        targetLanguage: langSelect.value,
        mode: currentMode
      });

      outputEl.textContent = translated;
      lastTranslatedText = translated;
    } catch (err) {
      outputEl.textContent = '⚠️ Error: ' + err.message;
      console.error(err);
    } finally {
      translateBtn.disabled = false;
      loader.style.display = 'none';
    }
  });

  /* ===========================
     QUIZ GENERATION
  ============================ */
  generateQuizBtn?.addEventListener('click', async () => {
    const text = lastTranslatedText || outputEl.textContent.trim();
    const lang = langSelect.value;
    console.log("Inside generate quiz")
    if (!text) return alert('Please translate some text first.');
    console.log(text)

    generateQuizBtn.disabled = true;
    loader.style.display = 'inline-block';
    quizContainer.innerHTML = '';

    try {
      console.log("inside try")
      const quizData = await handleAction('generateQuiz', text, { targetLanguage: lang });
      console.log("before render quiz");
      renderQuiz(quizData);
      console.log("after render quiz");
      quizContainer.style.display = 'block';
      saveQuizBtn.style.display = 'inline-block';
    } catch (err) {
      quizContainer.textContent = '⚠️ Failed to generate quiz: ' + err.message;
    } finally {
      loader.style.display = 'none';
      generateQuizBtn.disabled = false;
    }
  });


function renderQuiz(quizData) {
  quizContainer.innerHTML = `
    <h3>Quiz Time!</h3>
    ${quizData.map((q, i) => `
      <div class="quiz-question" data-index="${i}" style="margin-bottom:10px;">
        <p><b>Q${i + 1}:</b> ${q.question}</p>
        ${
          q.type === 'mcq'
            ? q.options.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx); // A, B, C, D
                return `
                  <label style="display:block;">
                    <input type="radio" name="q${i}" value="${letter}"> 
                    <b>${letter}.</b> ${opt}
                  </label>
                `;
              }).join('')
            : `<input type="text" class="fill-answer" placeholder="Type your answer and press Enter..." style="width:90%; padding:5px;">`
        }
        <div class="feedback" style="margin-top:4px; font-size:0.85rem;"></div>
      </div>
    `).join('')}
  `;

  // Attach event listeners for MCQs
  quizData.forEach((q, i) => {
    const qEl = quizContainer.querySelector(`.quiz-question[data-index="${i}"]`);
    const feedbackEl = qEl.querySelector('.feedback');

    if (q.type === 'mcq') {
      const radios = qEl.querySelectorAll('input[type="radio"]');
      const correctLetter = q.answer.trim().replace(/\W/g, '').toUpperCase(); // normalize e.g. "b." → "B"
      const correctIndex = correctLetter.charCodeAt(0) - 65; // map A→0, B→1, ...
      const correctOption = q.options[correctIndex] || '';

      radios.forEach(radio => {
        radio.addEventListener('change', () => {
          const selected = qEl.querySelector('input[type="radio"]:checked');
          const userAnswer = selected ? selected.value.trim().toUpperCase() : '';

          if (userAnswer === correctLetter) {
            feedbackEl.textContent = `✅ Correct! (${correctLetter}. ${correctOption})`;
            feedbackEl.style.color = 'green';
          } else {
            feedbackEl.textContent = `❌ Incorrect. Correct answer: ${correctLetter}. ${correctOption}`;
            feedbackEl.style.color = 'red';
          }

          // Disable all options after selection
          radios.forEach(r => r.disabled = true);
        });
      });
    } else {
      // Fill-in-the-blank handling
      const input = qEl.querySelector('.fill-answer');
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const userAnswer = input.value.trim();
          if (!userAnswer) return;

          if (userAnswer.toLowerCase() === q.answer.toLowerCase()) {
            feedbackEl.textContent = '✅ Correct!';
            feedbackEl.style.color = 'green';
          } else {
            feedbackEl.textContent = `❌ Incorrect. Correct answer: ${q.answer}`;
            feedbackEl.style.color = 'red';
          }

          input.disabled = true;
        }
      });
    }
  });
}



  /* ===========================
     SAVE QUIZ TO LOCAL STORAGE
  ============================ */
  // saveQuizBtn?.addEventListener('click', async () => {
  //   const lang = langSelect.value;
  //   const quizHtml = quizContainer.innerHTML;

  //   const data = await chrome.storage.local.get(['quizzes']);
  //   const quizzes = data.quizzes || {};
  //   if (!quizzes[lang]) quizzes[lang] = [];

  //   quizzes[lang].push({ html: quizHtml, date: new Date().toISOString() });

  //   await chrome.storage.local.set({ quizzes });
  //   alert(`✅ Quiz saved to your ${lang} notebook!`);
  // });

  /* ===========================
   SAVE QUIZ + TRANSLATION TO NOTEBOOK
============================ */
saveQuizBtn?.addEventListener('click', async () => {
  const lang = langSelect.value;
  const quizHtml = quizContainer.innerHTML;
  const translatedText = lastTranslatedText || outputEl.textContent.trim();

  if (!translatedText || !quizHtml) {
    alert('⚠️ Please translate text and generate a quiz before saving.');
    return;
  }

  // Fetch existing notebooks
  const data = await chrome.storage.local.get(['notebooks']);
  const notebooks = data.notebooks || {};

  // Check if this language notebook exists
  let notebook = notebooks[lang];


  const lang_name_map = {
    'es': 'Español',
    'ja': 'Japanese',
    'en': 'English',
  };

  if (!notebook) {
    // Ask if the user wants to create a new notebook
    const createNew = confirm(
      `No notebook found for ${lang_name_map[lang]}. Would you like to create one?`
    );
    if (!createNew) return;

    notebook = [];
    notebooks[lang] = notebook;
  }

  // Add entry (translation + quiz)
  notebook.push({
    text: translatedText,
    quizHtml,
    date: new Date().toISOString(),
  });

  // Save back to Chrome storage
  await chrome.storage.local.set({ notebooks });

  alert(`✅ Saved to your "${lang}" notebook!`);
});

  const openNotebookBtn = document.getElementById('openNotebook');
  openNotebookBtn?.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('notebook.html') });
  });


});


// import { handleAction } from '../gemini/gemini-controller.js';

// console.log("popup.js loaded!");

// document.addEventListener('DOMContentLoaded', () => {
//   const inputEl = document.getElementById('input');
//   const outputEl = document.getElementById('output');
//   const langSelect = document.getElementById('targetLang');
//   const modeButtons = document.querySelectorAll('.mode-selector button');
//   const loader = document.getElementById('loader');
//   const translateBtn = document.getElementById('translate');
//   const generateQuizBtn = document.getElementById('generateQuiz');
//   const saveQuizBtn = document.getElementById('saveQuiz');
//   const quizContainer = document.getElementById('quizContainer');
//   const openNotebookBtn = document.getElementById('openNotebook');

//   let currentMode = 'as-is';
//   let lastTranslatedText = '';
//   let lastQuizData = null; // 🆕 store structured quiz data

//   /* ===========================
//      MODE SELECTION
//   ============================ */
//   modeButtons.forEach(btn => {
//     btn.addEventListener('click', () => {
//       modeButtons.forEach(b => b.classList.remove('active'));
//       btn.classList.add('active');
//       currentMode = btn.dataset.mode;
//     });
//   });

//   /* ===========================
//      TAB SWITCHING
//   ============================ */
//   const tabTranslate = document.getElementById('tab-translate');
//   const tabQuiz = document.getElementById('tab-quiz');
//   const translateSection = document.getElementById('translate-section');
//   const quizSection = document.getElementById('quiz-section');

//   function switchTab(tab) {
//     if (tab === 'translate') {
//       tabTranslate.classList.add('active');
//       tabQuiz.classList.remove('active');
//       translateSection.classList.add('active');
//       quizSection.classList.remove('active');
//     } else {
//       tabQuiz.classList.add('active');
//       tabTranslate.classList.remove('active');
//       quizSection.classList.add('active');
//       translateSection.classList.remove('active');
//     }
//   }

//   tabTranslate?.addEventListener('click', () => switchTab('translate'));
//   tabQuiz?.addEventListener('click', () => switchTab('quiz'));

//   /* ===========================
//      AUTOFILL SELECTED TEXT
//   ============================ */
//   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//     const tab = tabs[0];
//     if (!tab) return;

//     chrome.scripting.executeScript(
//       {
//         target: { tabId: tab.id },
//         func: () => window.getSelection().toString(),
//       },
//       (result) => {
//         if (result && result[0] && result[0].result) {
//           inputEl.value = result[0].result.trim();
//         }
//       }
//     );
//   });

//   /* ===========================
//      TRANSLATE HANDLER
//   ============================ */
//   translateBtn.addEventListener('click', async () => {
//     const text = inputEl.value.trim();
//     if (!text) return alert('Please enter or select some text.');

//     translateBtn.disabled = true;
//     loader.style.display = 'inline-block';
//     outputEl.textContent = '';

//     try {
//       const translated = await handleAction('translate', text, {
//         targetLanguage: langSelect.value,
//         mode: currentMode
//       });

//       outputEl.textContent = translated;
//       lastTranslatedText = translated;
//     } catch (err) {
//       outputEl.textContent = '⚠️ Error: ' + err.message;
//       console.error(err);
//     } finally {
//       translateBtn.disabled = false;
//       loader.style.display = 'none';
//     }
//   });

//   /* ===========================
//      QUIZ GENERATION
//   ============================ */
//   generateQuizBtn?.addEventListener('click', async () => {
//     const text = lastTranslatedText || outputEl.textContent.trim();
//     const lang = langSelect.value;

//     if (!text) return alert('Please translate some text first.');

//     generateQuizBtn.disabled = true;
//     loader.style.display = 'inline-block';
//     quizContainer.innerHTML = '';

//     try {
//       const quizData = await handleAction('generateQuiz', text, { targetLanguage: lang });
//       lastQuizData = quizData; // 🆕 store structured quiz
//       renderQuiz(quizData);
//       quizContainer.style.display = 'block';
//       saveQuizBtn.style.display = 'inline-block';
//     } catch (err) {
//       quizContainer.textContent = '⚠️ Failed to generate quiz: ' + err.message;
//     } finally {
//       loader.style.display = 'none';
//       generateQuizBtn.disabled = false;
//     }
//   });

//   /* ===========================
//      RENDER INTERACTIVE QUIZ
//   ============================ */
//   function renderQuiz(quizData) {
//     quizContainer.innerHTML = `
//       <h3>🧠 Quiz Time!</h3>
//       ${quizData.map((q, i) => `
//         <div class="quiz-question" data-index="${i}" style="margin-bottom:10px;">
//           <p><b>Q${i + 1}:</b> ${q.question}</p>
//           ${q.type === 'mcq'
//             ? q.options.map(opt => `
//               <label style="display:block;">
//                 <input type="radio" name="q${i}" value="${opt}"> ${opt}
//               </label>`).join('')
//             : `<input type="text" class="fill-answer" placeholder="Type your answer and press Enter..." style="width:90%; padding:5px;">`
//           }
//           <div class="feedback" style="margin-top:4px; font-size:0.85rem;"></div>
//         </div>
//       `).join('')}
//     `;

//     quizData.forEach((q, i) => {
//       const qEl = quizContainer.querySelector(`.quiz-question[data-index="${i}"]`);
//       const feedbackEl = qEl.querySelector('.feedback');

//       if (q.type === 'mcq') {
//         const radios = qEl.querySelectorAll('input[type="radio"]');
//         radios.forEach(radio => {
//           radio.addEventListener('change', () => {
//             const selected = qEl.querySelector('input[type="radio"]:checked');
//             const userAnswer = selected ? selected.value.trim() : '';
//             if (userAnswer.toLowerCase() === q.answer.toLowerCase()) {
//               feedbackEl.textContent = '✅ Correct!';
//               feedbackEl.style.color = 'green';
//             } else {
//               feedbackEl.textContent = `❌ Incorrect. Correct answer: ${q.answer}`;
//               feedbackEl.style.color = 'red';
//             }
//             radios.forEach(r => r.disabled = true);
//           });
//         });
//       } else {
//         const input = qEl.querySelector('.fill-answer');
//         input.addEventListener('keydown', (e) => {
//           if (e.key === 'Enter') {
//             const userAnswer = input.value.trim();
//             if (!userAnswer) return;
//             if (userAnswer.toLowerCase() === q.answer.toLowerCase()) {
//               feedbackEl.textContent = '✅ Correct!';
//               feedbackEl.style.color = 'green';
//             } else {
//               feedbackEl.textContent = `❌ Incorrect. Correct answer: ${q.answer}`;
//               feedbackEl.style.color = 'red';
//             }
//             input.disabled = true;
//           }
//         });
//       }
//     });
//   }

//   /* ===========================
//      SAVE QUIZ + TRANSLATION TO NOTEBOOK (structured)
//   ============================ */
//   saveQuizBtn?.addEventListener('click', async () => {
//     const lang = langSelect.value;
//     const translatedText = lastTranslatedText || outputEl.textContent.trim();

//     if (!translatedText || !lastQuizData) {
//       alert('⚠️ Please translate text and generate a quiz before saving.');
//       return;
//     }

//     const data = await chrome.storage.local.get(['notebooks']);
//     const notebooks = data.notebooks || {};

//     if (!notebooks[lang]) {
//       const createNew = confirm(`No notebook found for ${lang}. Create one?`);
//       if (!createNew) return;
//       notebooks[lang] = [];
//     }

//     notebooks[lang].push({
//       text: translatedText,
//       quiz: lastQuizData, // 🆕 structured quiz
//       date: new Date().toISOString()
//     });

//     await chrome.storage.local.set({ notebooks });
//     alert(`✅ Saved to your "${lang}" notebook!`);
//   });

//   openNotebookBtn?.addEventListener('click', () => {
//     chrome.tabs.create({ url: chrome.runtime.getURL('notebook.html') });
//   });
// });

