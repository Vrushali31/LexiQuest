document.addEventListener('DOMContentLoaded', async () => {
  const quizList = document.getElementById('quizList');
  const langFilter = document.getElementById('langFilter');
  const svg = d3.select("#progressChart");
  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const margin = { top: 30, right: 20, bottom: 40, left: 50 };

  let data = await chrome.storage.local.get(['notebooks']);
  let quizzes = data.notebooks || {};

  const lang_name_map = {
    'es': 'Español',
    'ja': 'Japanese',
    'en': 'English',
  };

  // Populate language filter
  Object.keys(quizzes).forEach(lang => {
    const opt = document.createElement('option');
    opt.value = lang;
    opt.textContent = lang_name_map[lang] || lang;
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

  
  //D3 CHART: QUIZ PROGRESS BY LANGUAGE  
  function renderProgressChart() {
    svg.selectAll("*").remove(); // Clear previous chart

    const progressData = Object.entries(quizzes).map(([lang, entries]) => ({
      lang,
      count: entries.length
    }));

    if (progressData.length === 0) {
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#6b7280")
        .text("No saved quizzes yet.");
      return;
    }

    const x = d3.scaleBand()
      .domain(progressData.map(d => d.lang))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(progressData, d => d.count)]).nice()
      .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal()
      .domain(progressData.map(d => d.lang))
      .range(["#2563eb","#f59e0b", "#10b981", "#ef4444"]);

    svg.selectAll(".bar")
      .data(progressData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.lang))
      .attr("y", d => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", d => y(0) - y(d.count))
      .attr("fill", d => color(d.lang))
      .on("mouseover", function (e, d) {
        d3.select(this).attr("fill", "#303748ff");
      })
      .on("mouseout", function (e, d) {
        d3.select(this).attr("fill", color(d.lang));
      });

    // X Axis
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d => lang_name_map[d] || d))
      .selectAll("text")
      .style("font-size", "0.85rem");

    // Y Axis
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .style("font-size", "0.85rem");

    // Labels
    svg.selectAll(".label")
      .data(progressData)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d => x(d.lang) + x.bandwidth() / 2)
      .attr("y", d => y(d.count) - 5)
      .attr("text-anchor", "middle")
      .attr("fill", "#111827")
      .style("font-size", "0.8rem")
      .text(d => d.count);
  }

  
  //RENDER QUIZ ENTRIES  
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
              <h3>${lang_name_map[lang] || lang} Quiz ${idx + 1}</h3>
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

    // Refresh the progress chart every time we re-render quizzes
    renderProgressChart();
  }

  renderQuizzes('all');

  langFilter.addEventListener('change', e => {
    const selectedLang = e.target.value;
    renderQuizzes(selectedLang);
    renderSkillGraph(selectedLang);
  });


  quizList.addEventListener('click', async e => {
    if (e.target.classList.contains('delete-btn')) {
      const lang = e.target.dataset.lang;
      const index = parseInt(e.target.dataset.index);
      const confirmed = confirm('🗑️ Delete this quiz permanently?');
      if (!confirmed) return;

      quizzes[lang].splice(index, 1);
      if (quizzes[lang].length === 0) delete quizzes[lang];
      await chrome.storage.local.set({ notebooks: quizzes });

      renderQuizzes(langFilter.value); // refresh UI + chart
    } else {
      const quizEntry = e.target.closest('.quiz-entry');
      if (quizEntry) quizEntry.classList.toggle('active');
    }
  });

  


  // === Skill Graph Visualization ===


//D3 CHART: SKILL GRAPH
const skillSvg = d3.select("#skillGraph");
const skillWidth = +skillSvg.attr("width");
const skillHeight = +skillSvg.attr("height");
const skillMargin = { top: 30, right: 30, bottom: 60, left: 60 };

function renderSkillGraph(filterLang = 'all') {
  const skillContainer = document.getElementById("skillGraph");
  skillContainer.innerHTML = ''; // clear old graphs

  const langs = filterLang === 'all' ? Object.keys(quizzes) : [filterLang];

  if (langs.length === 0) {
    skillContainer.innerHTML = '<p style="text-align:center;color:#6b7280;">No skill data yet.</p>';
    return;
  }

  langs.forEach(lang => {
    const entries = quizzes[lang] || [];
    let aggregated = {};

    entries.forEach(entry => {
      const analysis = entry.analysis;
      if (analysis?.learned_skills) {
        analysis.learned_skills.forEach(skill => {
          const { concept, confidence } = skill;
          if (!aggregated[concept]) {
            aggregated[concept] = { total: confidence, count: 1 };
          } else {
            aggregated[concept].total += confidence;
            aggregated[concept].count += 1;
          }
        });
      }
    });

    const avgSkills = Object.entries(aggregated).map(([concept, val]) => ({
      concept,
      confidence: val.total / val.count
    }));

    const container = document.createElement("div");
    container.style.marginBottom = "30px";

    const title = document.createElement("h3");
    title.textContent = `${lang_name_map[lang] || lang}`;
    title.style.textAlign = "center";
    title.style.marginBottom = "10px";
    container.appendChild(title);

    const svg = d3.select(container)
      .append("svg")
      .attr("width", 700)
      .attr("height", 420)
      .attr("overflow", "visible");

    const skillWidth = 700;
    const skillHeight = 420;
    const skillMargin = { top: 30, right: 30, bottom: 110, left: 60 };

    if (avgSkills.length === 0) {
      svg.append("text")
        .attr("x", skillWidth / 2)
        .attr("y", skillHeight / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#6b7280")
        .text("No skill data yet.");
      skillContainer.appendChild(container);
      return;
    }

    const x = d3.scaleBand()
      .domain(avgSkills.map(d => d.concept))
      .range([skillMargin.left, skillWidth - skillMargin.right])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, 1]).nice()
      .range([skillHeight - skillMargin.bottom, skillMargin.top]);

    const color = d3.scaleLinear()
      .domain([0, 1])
      .range(["#fca5a5", "#16a34a"]);

    svg.selectAll(".bar")
      .data(avgSkills)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.concept))
      .attr("y", d => y(d.confidence))
      .attr("width", x.bandwidth())
      .attr("height", d => y(0) - y(d.confidence))
      .attr("fill", d => color(d.confidence))
      .append("title")
      .text(d => `${d.concept}: ${(d.confidence * 100).toFixed(1)}%`);

    const maxLabel = 12;
    svg.append("g")
      .attr("transform", `translate(0,${skillHeight - skillMargin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d => d.length > maxLabel ? d.slice(0, maxLabel) + '…' : d))
      .selectAll("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-40)")
      .style("font-size", "0.8rem")
      .each(function(d) { // add full label as tooltip
        d3.select(this).append("title").text(d);
      });

    svg.append("g")
      .attr("transform", `translate(${skillMargin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .style("font-size", "0.8rem");

    svg.selectAll(".label")
      .data(avgSkills)
      .enter()
      .append("text")
      .attr("x", d => x(d.concept) + x.bandwidth() / 2)
      .attr("y", d => y(d.confidence) - 5)
      .attr("text-anchor", "middle")
      .attr("fill", "#111827")
      .style("font-size", "0.75rem")
      .text(d => `${(d.confidence * 100).toFixed(0)}%`);

    skillContainer.appendChild(container);
  });
}



renderSkillGraph(langFilter.value);

// function showNextSuggestions(suggestions) {
//   const container = document.getElementById("suggestions");
//   container.innerHTML = `
//     <h3>Next Suggested Topics</h3>
//     <ul>${suggestions.map(s => `<li>${s}</li>`).join("")}</ul>
//   `;
// }


});

