document.addEventListener('DOMContentLoaded', async () => {
  const quizList = document.getElementById('quizList');
  const langFilter = document.getElementById('langFilter');

  const data = await chrome.storage.local.get(['notebooks']);
  const quizzes = data.notebooks || {};

  const lang_name_map = {
    'es': 'Español',
    'ja': 'Japanese',
    'en': 'English',
  };

  // Populate language filter
  Object.keys(quizzes).forEach(lang => {
    const opt = document.createElement('option');
    opt.value = lang;
    opt.textContent = lang_name_map[lang];
    langFilter.appendChild(opt);
  });

  function escapeHtml(str = '') {
    return str
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function renderQuizzes(filterLang) {
    quizList.innerHTML = '';
    const langs = filterLang === 'all' ? Object.keys(quizzes) : [filterLang];

    langs.forEach(lang => {
      const entries = quizzes[lang];
      if (!entries || entries.length === 0) return;

      entries.forEach((entry, idx) => {
        const quizCard = document.createElement('div');
        quizCard.className = 'quiz-entry';

        quizCard.innerHTML = `
          <div class="quiz-header">
            <div>
              <h3>${lang.toUpperCase()} Quiz ${idx + 1}</h3>
              <span>${new Date(entry.date).toLocaleString()}</span>
            </div>
            <button class="delete-btn" data-lang="${lang}" data-index="${idx}">Delete</button>
          </div>
          <div class="quiz-content"></div>
        `;

        const contentEl = quizCard.querySelector('.quiz-content');

        if (entry.quiz && Array.isArray(entry.quiz)) {
          contentEl.innerHTML = entry.quiz.map((q, i) => {
            if (q.type === 'mcq') {
              const optionsHtml = q.options.map(opt => `<li>${escapeHtml(opt)}</li>`).join('');
              return `
                <div style="margin-bottom:8px">
                  <strong>Q${i+1}:</strong> ${escapeHtml(q.question)}<br>
                  <ul style="margin:6px 0 4px 18px">${optionsHtml}</ul>
                  <div class="correct-answer" style="display:none; color:#065f46; font-weight:600; margin-top:4px;">
                    Correct: ${escapeHtml(q.answer)}
                  </div>
                </div>
              `;
            } else {
              return `
                <div style="margin-bottom:8px">
                  <strong>Q${i+1}:</strong> ${escapeHtml(q.question)}<br>
                  <div class="correct-answer" style="display:none; color:#065f46; font-weight:600; margin-top:4px;">
                    Correct: ${escapeHtml(q.answer)}
                  </div>
                </div>
              `;
            }
          }).join('');

          const toggle = document.createElement('button');
          toggle.textContent = 'Show Answers';
          toggle.style.marginTop = '12px';
          toggle.style.background = '#2563eb';
          toggle.style.color = 'white';
          toggle.style.border = 'none';
          toggle.style.padding = '6px 10px';
          toggle.style.borderRadius = '8px';
          toggle.style.cursor = 'pointer';

          toggle.addEventListener('click', () => {
            const answers = contentEl.querySelectorAll('.correct-answer');
            const visible = answers.length && answers[0].style.display === 'block';
            answers.forEach(a => a.style.display = visible ? 'none' : 'block');
            toggle.textContent = visible ? 'Show Answers' : 'Hide Answers';
          });

          contentEl.appendChild(toggle);

        } else if (entry.quizHtml) {
          contentEl.innerHTML = entry.quizHtml + 
            '<p style="font-size:0.85rem;color:#6b7280;margin-top:8px;">(Correct answers not available for this entry)</p>';
        } else {
          contentEl.innerHTML = '<p style="color:#6b7280;">No quiz content available.</p>';
        }

        quizList.appendChild(quizCard);
      });
    });

    if (!quizList.innerHTML.trim()) {
      quizList.innerHTML = `<p class="empty">No quizzes found.</p>`;
    }
  }

  renderQuizzes('all');

  langFilter.addEventListener('change', e => renderQuizzes(e.target.value));

  quizList.addEventListener('click', async e => {
    if (e.target.classList.contains('delete-btn')) {
      const lang = e.target.dataset.lang;
      const index = parseInt(e.target.dataset.index);
      const confirmed = confirm('🗑️ Delete this quiz permanently?');
      if (!confirmed) return;

      quizzes[lang].splice(index, 1);
      if (quizzes[lang].length === 0) delete quizzes[lang];
      await chrome.storage.local.set({ notebooks: quizzes });

      renderQuizzes(langFilter.value);
    } else {
      const quizEntry = e.target.closest('.quiz-entry');
      if (quizEntry) quizEntry.classList.toggle('active');
    }
  });
});
