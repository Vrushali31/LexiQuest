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

  /* ===========================
     RENDER QUIZ UI
  ============================ */
  function renderQuiz(quizData) {
    quizContainer.innerHTML = `
      <h3>🧠 Quiz Time!</h3>
      ${quizData.map((q, i) => `
        <div class="quiz-question" style="margin-bottom:10px;">
          <p><b>Q${i + 1}:</b> ${q.question}</p>
          ${q.type === 'mcq'
            ? q.options.map(opt => `
              <label style="display:block;">
                <input type="radio" name="q${i}" value="${opt}"> ${opt}
              </label>`).join('')
            : `<input type="text" placeholder="Type your answer..." style="width:90%; padding:5px;">`
          }
        </div>
      `).join('')}
    `;
  }

  /* ===========================
     SAVE QUIZ TO LOCAL STORAGE
  ============================ */
  saveQuizBtn?.addEventListener('click', async () => {
    const lang = langSelect.value;
    const quizHtml = quizContainer.innerHTML;

    const data = await chrome.storage.local.get(['quizzes']);
    const quizzes = data.quizzes || {};
    if (!quizzes[lang]) quizzes[lang] = [];

    quizzes[lang].push({ html: quizHtml, date: new Date().toISOString() });

    await chrome.storage.local.set({ quizzes });
    alert(`✅ Quiz saved to your ${lang} notebook!`);
  });
});
