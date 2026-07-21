/* ============================================================
   UNDERSTANDING YOUR HEART — script.js
   Vanilla JS. No build step, no backend, no network calls
   except the jsPDF CDN script tag already loaded in index.html.
   ============================================================ */

(() => {
  'use strict';

  /* ============================================================
     1. QUESTION DATA MODEL
     ============================================================ */

  // Linear "spine" of the questionnaire (drives the flower progress count)
  const SPINE = ['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10','open1','open2','open3','open4'];

  const QUESTIONS = {
    q1: {
      id: 'q1', type: 'single',
      text: 'What do you feel has contributed the most to your negative thinking?',
      options: [
        'Myself',
        'Things I watch/read',
        'Past relationship experiences',
        'Fear of getting hurt again',
        'A combination of these',
        "I'm not sure"
      ]
    },
    q2: {
      id: 'q2', type: 'single-other',
      text: 'When you think about us becoming officially committed, what worries you the most?',
      options: [
        'That your(Indra) feelings may change with time.',
        'That you(Indra) might stop loving me.',
        'That commitment makes heartbreak harder.',
        'Fear of not turning into permanent.'
      ],
      otherLabel: 'Other'
    },
    q3: {
      id: 'q3', type: 'single',
      text: 'When I talk about our future—like commitment, marriage, or growing old together—what usually goes through your mind?',
      options: [
        'It makes me happy.',
        'It makes me hopeful.',
        'I become excited but also scared.',
        "I'm afraid it may never happen.",
        "I'm not sure."
      ],
      branchOn: 3 // 0-indexed: "I avoid thinking about it..."
    },
    q3b: {
      id: 'q3b', type: 'single-other',
      text: 'If one day everything Indra dreams about actually came true—our commitment, our future and our marriage-how do you think you would feel?',
      options: [
        'Peaceful',
        'Happy',
        'Happy but still scared',
        "I wouldn't believe it at first",
        "I'd still expect something bad to happen"
      ],
      otherLabel: 'Other'
    },
    q4: {
      id: 'q4', type: 'slider',
      text: 'When Indra says "I love you", how deeply do you feel those words?',
      min: 1, max: 10, default: 5,
      minLabel: "1 · I struggle to believe it",
      maxLabel: '10 · I believe every word'
    },
    q5: {
      id: 'q5', type: 'single',
      text: 'Have you ever worried that one day Indra might leave you for someone you think is better?',
      options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost Always']
    },
    q6: {
      id: 'q6', type: 'single',
      text: "Does expressing your love or feelings ever feel risky because you're afraid becoming emotionally open could make you more vulnerable?",
      options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always']
    },
    q7: {
      id: 'q7', type: 'single',
      text: 'When it comes to physical closeness (holding hands, hugs, cuddling etc.), what best describes how you feel?',
      options: [
        'I feel comfortable expressing it.',
        'I feel uncomfortable before anything permanent.',
        'I\u2019m afraid it could be misunderstood.',
        "I worry it might change how I'm seen.",
        "I'd rather not answer."
      ]
    },
    q8: {
      id: 'q8', type: 'single-other',
      text: 'Sometimes we haven\u2019t met in person. Which reason feels closest to how you feel?',
      options: [
        "I'm shy.",
        "I'm afraid of showing my emotions.",
        'I\u2019m worried things might change after meeting.',
        "It's because of practical reasons."
      ],
      otherLabel: 'Other'
    },
    q9: {
      id: 'q9', type: 'single',
      text: 'Have you ever worried that if you loved me too much or made me your priority, I might stop valuing it?',
      options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always']
    },
    q10: {
      id: 'q10', type: 'single',
      text: 'How often do you find yourself afraid of losing Indra?',
      options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost every day']
    },
    open1: {
      id: 'open1', type: 'textarea',
      text: 'If you could truly have the future you want for us, what would it look like?',
      note: "There's absolutely no pressure to write anything here. But if kichu bolte iccha kore, tumi ekhane likhte paro. I'll read every word with care. \u2764\uFE0F"
    },
    open2: {
      id: 'open2', type: 'textarea',
      text: 'If all your fears disappeared for one day, what would you do differently with Indra?',
      note: "There's absolutely no pressure to write anything here. But if kichu bolte iccha kore, tumi ekhane likhte paro. I'll read every word with care. \u2764\uFE0F"
    },
    open3: {
      id: 'open3', type: 'textarea',
      text: "What's one thing you've always wanted to tell Indra but never found the courage to say?",
      note: "There's absolutely no pressure to write anything here. But if kichu bolte iccha kore, tumi ekhane likhte paro. I'll read every word with care. \u2764\uFE0F"
    },
    open4: {
      id: 'open4', type: 'textarea',
      text: 'Is there anything else you\u2019d like to tell me?',
      note: "There's absolutely no pressure to write anything here. But if kichu bolte iccha kore, tumi ekhane likhte paro. I'll read every word with care. \u2764\uFE0F"
    }
  };

  /* ============================================================
     2. STATE
     ============================================================ */

  const state = {
    history: [],          // stack of step ids visited, for Back navigation
    current: null,        // current step id
    answers: {},          // { stepId: { label, value } }
    pdfDoc: null,
    pdfBlobUrl: null
  };

  /* ============================================================
     3. DOM REFS
     ============================================================ */

  const $ = (sel) => document.querySelector(sel);
  const screens = {
    welcome: $('#screen-welcome'),
    intro: $('#screen-intro'),
    question: $('#screen-question'),
    transition: $('#screen-transition'),
    thankyou: $('#screen-thankyou')
  };

  const qNumberEl = $('#q-number');
  const qTextEl = $('#q-text');
  const qHintEl = $('#q-hint');
  const qBodyEl = $('#q-body');
  const progressFill = $('#progress-fill');
  const progressTrack = $('#progress-track');
  const btnBack = $('#btn-back');
  const btnNext = $('#btn-next');
  const flowerWrap = $('#flower-progress');
  const flowerCount = $('#flower-count');

  /* ============================================================
     4. SCREEN NAVIGATION
     ============================================================ */

  function showScreen(name){
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  /* ============================================================
     5. QUESTIONNAIRE FLOW
     ============================================================ */

  function nextStepId(fromId){
    if (fromId === 'q3' && state.answers.q3 && state.answers.q3.index === QUESTIONS.q3.branchOn){
      return 'q3b';
    }
    if (fromId === 'q3b') return 'q4';
    const idx = SPINE.indexOf(fromId);
    if (idx === -1 || idx === SPINE.length - 1) return null; // finished
    return SPINE[idx + 1];
  }

  function startQuestionnaire(){
    state.history = [];
    state.current = 'q1';
    showScreen('question');
    flowerWrap.hidden = false;
    buildFlower();
    renderStep('q1');
  }

  function goNext(){
    const step = QUESTIONS[state.current];
    if (!isAnswered(step)) return; // guard, button should already be disabled

    const nid = nextStepId(state.current);
    state.history.push(state.current);

    if (nid === null){
      finishQuestionnaire();
      return;
    }
    state.current = nid;
    renderStep(nid);
  }

  function goBack(){
    if (state.history.length === 0) return;
    const prev = state.history.pop();
    state.current = prev;
    renderStep(prev);
  }

  function finishQuestionnaire(){
    flowerWrap.hidden = true;
    showScreen('transition');
    runTransitionSequence();
  }

  /* ============================================================
     6. RENDERING A STEP
     ============================================================ */

  function isAnswered(step){
    const a = state.answers[step.id];
    if (step.type === 'textarea') return true; // optional, always allowed to continue
    if (step.type === 'slider') return true; // has a default value
    if (!a) return false;
    if (a.isOther && (!a.label || !a.label.trim())) return false;
    return true;
  }

  function renderStep(id){
    const step = QUESTIONS[id];
    const spineIdx = SPINE.indexOf(id);
    const displayNum = spineIdx >= 0 ? spineIdx + 1 : SPINE.indexOf('q3') + 1; // q3b shares q3's number visually
    qNumberEl.textContent = id === 'q3b' ? 'A little more...' : `Question ${displayNum} of ${SPINE.length}`;
    qTextEl.textContent = step.text;
    qHintEl.hidden = true;

    // progress bar (based on spine position; q3b treated as between q3 and q4)
    const pct = spineIdx >= 0 ? ((spineIdx) / (SPINE.length - 1)) * 100 : ((SPINE.indexOf('q3')) / (SPINE.length - 1)) * 100;
    progressFill.style.width = `${pct}%`;
    progressTrack.setAttribute('aria-valuenow', Math.round(pct));

    updateFlower(spineIdx >= 0 ? spineIdx : SPINE.indexOf('q3'));

    qBodyEl.innerHTML = '';

    if (step.type === 'single' || step.type === 'single-other'){
      renderOptions(step);
    } else if (step.type === 'slider'){
      renderSlider(step);
    } else if (step.type === 'textarea'){
      renderTextarea(step);
    }

    btnBack.disabled = state.history.length === 0;
    updateNextEnabled(step);
  }

  function updateNextEnabled(step){
    btnNext.disabled = !isAnswered(step);
  }

  function renderOptions(step){
    const existing = state.answers[step.id];
    const list = document.createElement('div');
    list.className = 'options-list';

    step.options.forEach((label, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-btn';
      btn.textContent = label;
      btn.setAttribute('role', 'radio');
      if (existing && !existing.isOther && existing.index === i) {
        btn.classList.add('selected');
        btn.setAttribute('aria-checked', 'true');
      } else {
        btn.setAttribute('aria-checked', 'false');
      }
      btn.addEventListener('click', () => {
        state.answers[step.id] = { label, index: i, isOther: false };
        renderStep(step.id); // re-render to reflect selection + otherbox removal
      });
      list.appendChild(btn);
    });

    if (step.type === 'single-other'){
      const otherBtn = document.createElement('button');
      otherBtn.type = 'button';
      otherBtn.className = 'option-btn';
      const isOtherSelected = existing && existing.isOther;
      otherBtn.textContent = step.otherLabel || 'Other';
      if (isOtherSelected) otherBtn.classList.add('selected');
      otherBtn.addEventListener('click', () => {
        state.answers[step.id] = { label: (existing && existing.isOther) ? existing.label : '', index: -1, isOther: true };
        renderStep(step.id);
        const box = qBodyEl.querySelector('.other-input');
        if (box) box.focus();
      });
      list.appendChild(otherBtn);

      if (isOtherSelected){
        const box = document.createElement('textarea');
        box.className = 'other-input';
        box.rows = 2;
        box.placeholder = 'Type your answer...';
        box.value = existing.label || '';
        box.addEventListener('input', () => {
          state.answers[step.id] = { label: box.value, index: -1, isOther: true };
          updateNextEnabled(step);
        });
        list.appendChild(box);
      }
    }

    qBodyEl.appendChild(list);
  }

  function renderSlider(step){
    const existing = state.answers[step.id];
    const value = existing ? existing.value : step.default;
    state.answers[step.id] = { value, label: `${value} / ${step.max}` };

    const wrap = document.createElement('div');
    wrap.className = 'slider-wrap';
    wrap.innerHTML = `
      <div class="slider-labels">
        <span>${step.minLabel}</span>
        <span>${step.maxLabel}</span>
      </div>
      <input type="range" class="heart-slider" min="${step.min}" max="${step.max}" value="${value}" step="1" aria-label="${step.text}">
      <div class="slider-value">${value}</div>
    `;
    const input = wrap.querySelector('input');
    const valueEl = wrap.querySelector('.slider-value');
    input.addEventListener('input', () => {
      valueEl.textContent = input.value;
      state.answers[step.id] = { value: Number(input.value), label: `${input.value} / ${step.max}` };
    });
    qBodyEl.appendChild(wrap);
  }

  function renderTextarea(step){
    const existing = state.answers[step.id];
    const wrap = document.createElement('div');
    const textarea = document.createElement('textarea');
    textarea.className = 'open-textarea';
    textarea.placeholder = 'Write as much or as little as you like...';
    textarea.value = existing ? existing.label : '';
    textarea.addEventListener('input', () => {
      state.answers[step.id] = { label: textarea.value };
    });
    wrap.appendChild(textarea);

    const note = document.createElement('p');
    note.className = 'open-note';
    note.textContent = step.note;
    wrap.appendChild(note);

    qBodyEl.appendChild(wrap);
    if (!existing) state.answers[step.id] = { label: '' };
  }

  /* ============================================================
     7. FLOWER PROGRESS SIGNATURE
     ============================================================ */

  function buildFlower(){
    const svg = document.getElementById('flower-svg');
    // gradient def for filled petals
    const NS = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(NS, 'defs');
    defs.innerHTML = `
      <radialGradient id="petalGradient" cx="50%" cy="30%" r="80%">
        <stop offset="0%" stop-color="#FBDEE6"/>
        <stop offset="100%" stop-color="#AEE1F9"/>
      </radialGradient>`;
    svg.insertBefore(defs, svg.firstChild);

    const total = SPINE.length;
    const cx = 60, cy = 60, rInner = 14, rOuter = 42;
    for (let i = 0; i < total; i++){
      const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
      const nextAngle = ((i + 1) / total) * Math.PI * 2 - Math.PI / 2;
      const midAngle = (angle + nextAngle) / 2;
      const tipX = cx + Math.cos(midAngle) * rOuter;
      const tipY = cy + Math.sin(midAngle) * rOuter;
      const baseX1 = cx + Math.cos(angle) * rInner;
      const baseY1 = cy + Math.sin(angle) * rInner;
      const baseX2 = cx + Math.cos(nextAngle) * rInner;
      const baseY2 = cy + Math.sin(nextAngle) * rInner;

      const petal = document.createElementNS(NS, 'path');
      petal.setAttribute('d', `M ${baseX1} ${baseY1} Q ${tipX} ${tipY} ${baseX2} ${baseY2} Q ${cx} ${cy} ${baseX1} ${baseY1} Z`);
      petal.classList.add('flower-petal');
      petal.dataset.index = i;
      svg.insertBefore(petal, svg.querySelector('.flower-center'));
    }
  }

  function updateFlower(filledCount){
    const petals = document.querySelectorAll('.flower-petal');
    petals.forEach(p => {
      const i = Number(p.dataset.index);
      p.classList.toggle('filled', i < filledCount);
    });
    flowerCount.textContent = `${Math.max(0, filledCount)} / ${SPINE.length}`;
  }

  /* ============================================================
     8. TRANSITION SEQUENCE
     ============================================================ */

  function runTransitionSequence(){
    const lines = ['Reading your responses...', 'Preparing your response letter...', 'Almost done...'];
    const loaderLine = $('#loader-line');
    let i = 0;
    loaderLine.textContent = lines[0];

    const interval = setInterval(() => {
      i++;
      if (i < lines.length){
        loaderLine.style.opacity = 0;
        setTimeout(() => {
          loaderLine.textContent = lines[i];
          loaderLine.style.opacity = 1;
        }, 350);
      }
    }, 1100);

    setTimeout(() => {
      clearInterval(interval);
      showScreen('thankyou');
      preparePdf();
    }, 3600);
  }

  /* ============================================================
     9. PDF GENERATION (jsPDF)
     ============================================================ */

  function drawHeart(doc, x, y, r, colorHex){
    doc.setFillColor(colorHex);
    doc.circle(x - r * 0.5, y, r * 0.62, 'F');
    doc.circle(x + r * 0.5, y, r * 0.62, 'F');
    doc.triangle(x - r * 1.05, y + r * 0.18, x + r * 1.05, y + r * 0.18, x, y + r * 1.65, 'F');
  }

  function buildAnswerList(){
    // Produces ordered [{question, answer}] including the conditional q3b if present
    const order = ['q1','q2','q3'];
    if (state.answers.q3b) order.push('q3b');
    order.push('q4','q5','q6','q7','q8','q9','q10','open1','open2','open3','open4');

    return order.filter(id => QUESTIONS[id]).map(id => {
      const q = QUESTIONS[id];
      const a = state.answers[id];
      let answerText = '(left blank with love)';
      if (a){
        if (a.label && a.label.trim()) answerText = a.label.trim();
        else if (typeof a.value !== 'undefined') answerText = `${a.value} / ${q.max || 10}`;
      }
      return { question: q.text, answer: answerText };
    });
  }

  function preparePdf(){
    const statusEl = $('#pdf-status');
    const readyEl = $('#pdf-ready');

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 56;
      const contentW = pageW - margin * 2;

      const SKY = '#AEE1F9';
      const LAV = '#E4DBF7';
      const PINK = '#FBDEE6';
      const INK = '#3E3A5E';
      const INKSOFT = '#6C6790';
      const GOLD = '#D9A86C';

      function drawHeader(isFirst){
        doc.setFillColor(SKY);
        doc.roundedRect(0, 0, pageW, isFirst ? 150 : 70, 0, 0, 'F');
        doc.setFillColor(PINK);
        doc.setGState(new doc.GState({ opacity: 0.5 }));
        doc.roundedRect(0, (isFirst ? 150 : 70) - 14, pageW, 14, 0, 0, 'F');
        doc.setGState(new doc.GState({ opacity: 1 }));

        if (isFirst){
          drawHeart(doc, pageW / 2, 52, 13, '#FFFFFF');
          doc.setFont('times', 'italic');
          doc.setTextColor('#3A3560');
          doc.setFontSize(26);
          doc.text('Understanding Your Heart', pageW / 2, 92, { align: 'center' });
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
          doc.setTextColor('#4B4570');
          doc.text('Her Response Letter', pageW / 2, 112, { align: 'center' });

          const now = new Date();
          const dateStr = now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
          const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
          doc.setFontSize(9.5);
          doc.text(`${dateStr}  ·  ${timeStr}`, pageW / 2, 130, { align: 'center' });
        } else {
          drawHeart(doc, margin + 10, 35, 8, '#FFFFFF');
          doc.setFont('times', 'italic');
          doc.setFontSize(13);
          doc.setTextColor('#3A3560');
          doc.text('Understanding Your Heart', margin + 26, 40);
        }
      }

      function drawFooter(pageNum){
        drawHeart(doc, pageW / 2, pageH - 26, 6, GOLD);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(INKSOFT);
        doc.text(String(pageNum), pageW / 2, pageH - 12, { align: 'center' });
      }

      let pageNum = 1;
      drawHeader(true);
      drawFooter(pageNum);
      let cursorY = 178;

      function ensureSpace(neededHeight){
        if (cursorY + neededHeight > pageH - 50){
          doc.addPage();
          pageNum++;
          drawHeader(false);
          drawFooter(pageNum);
          cursorY = 96;
        }
      }

      const answerList = buildAnswerList();

      answerList.forEach((item, idx) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(GOLD);
        const label = `Question ${idx + 1}`;
        const qLines = doc.setFont('times', 'italic').setFontSize(13).splitTextToSize(item.question, contentW - 4);
        const aLines = doc.setFont('helvetica', 'normal').setFontSize(11.5).splitTextToSize(item.answer, contentW - 20);

        const blockHeight = 16 + qLines.length * 16 + 10 + aLines.length * 15 + 22;
        ensureSpace(blockHeight);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(GOLD);
        doc.text(label.toUpperCase(), margin, cursorY);
        cursorY += 14;

        doc.setFont('times', 'italic');
        doc.setFontSize(13);
        doc.setTextColor(INK);
        qLines.forEach(line => { doc.text(line, margin, cursorY); cursorY += 16; });
        cursorY += 6;

        // soft answer chip background
        const chipH = aLines.length * 15 + 14;
        doc.setFillColor(LAV);
        doc.setGState(new doc.GState({ opacity: 0.35 }));
        doc.roundedRect(margin, cursorY - 10, contentW, chipH, 8, 8, 'F');
        doc.setGState(new doc.GState({ opacity: 1 }));

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11.5);
        doc.setTextColor(INKSOFT);
        aLines.forEach(line => { doc.text(line, margin + 12, cursorY + 8); cursorY += 15; });
        cursorY += 26;
      });

      // Closing note
      ensureSpace(90);
      doc.setFont('times', 'italic');
      doc.setFontSize(13);
      doc.setTextColor(INK);
      const closing = doc.splitTextToSize('Thank you for trusting me with your heart. Whatever these answers are, they only bring me closer to understanding you — never further away.', contentW - 40);
      closing.forEach(line => { doc.text(line, pageW / 2, cursorY, { align: 'center' }); cursorY += 18; });
      cursorY += 6;
      drawHeart(doc, pageW / 2, cursorY, 9, GOLD);

      const blob = doc.output('blob');
      state.pdfDoc = doc;
      state.pdfBlobUrl = URL.createObjectURL(blob);

      setTimeout(() => {
        statusEl.hidden = true;
        readyEl.hidden = false;
      }, 900);

    } catch (err){
      console.error('PDF generation error:', err);
      statusEl.innerHTML = '<span>Your letter is ready to write — but something went quiet just now. Please try reopening the page.</span>';
    }
  }

  function downloadPdf(){
    if (!state.pdfBlobUrl) return;
    const a = document.createElement('a');
    a.href = state.pdfBlobUrl;
    a.download = 'Understanding_Your_Heart_Responses.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /* ============================================================
     10. LIVING BACKGROUND — canvas fireflies / dust / bokeh
     ============================================================ */

  function initCanvasBackground(){
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let w, h, particles = [];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize(){
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    const PALETTE = ['#FFFFFF', '#FBDEE6', '#AEE1F9', '#E4DBF7', '#FFE9C6'];

    function makeParticle(kind){
      const isBokeh = kind === 'bokeh';
      return {
        kind,
        x: Math.random() * w,
        y: Math.random() * h,
        r: isBokeh ? (18 + Math.random() * 46) : (1 + Math.random() * 2.4),
        speedY: isBokeh ? -0.06 - Math.random() * 0.08 : -0.15 - Math.random() * 0.25,
        speedX: (Math.random() - 0.5) * (isBokeh ? 0.05 : 0.18),
        alpha: isBokeh ? (0.05 + Math.random() * 0.07) : (0.25 + Math.random() * 0.55),
        twinkleSpeed: 0.008 + Math.random() * 0.02,
        twinklePhase: Math.random() * Math.PI * 2,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)]
      };
    }

    const bokehCount = Math.round(w / 220);
    const dustCount = Math.round((w * h) / 24000);
    for (let i = 0; i < bokehCount; i++) particles.push(makeParticle('bokeh'));
    for (let i = 0; i < dustCount; i++) particles.push(makeParticle('dust'));

    function step(){
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.twinklePhase += p.twinkleSpeed;
        if (p.y < -60){ p.y = h + 40; p.x = Math.random() * w; }
        if (p.x < -60) p.x = w + 40;
        if (p.x > w + 60) p.x = -40;

        const twinkle = p.kind === 'dust' ? (0.5 + 0.5 * Math.sin(p.twinklePhase)) : 1;
        ctx.beginPath();
        ctx.globalAlpha = p.alpha * twinkle;
        ctx.fillStyle = p.color;
        if (p.kind === 'bokeh'){
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          grad.addColorStop(0, p.color);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
        }
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (!reduceMotion) requestAnimationFrame(step);
    }
    step();
  }

  /* ============================================================
     11. FLOATING PETALS & BUTTERFLIES (DOM layer)
     ============================================================ */

  function initFloaters(){
    const container = document.getElementById('floaters');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const petalSVG = (color) => `
      <svg width="22" height="26" viewBox="0 0 22 26" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 0C16 6 22 10 11 26C0 10 6 6 11 0Z" fill="${color}" opacity="0.85"/>
      </svg>`;
    const petalColors = ['#FBDEE6', '#E4DBF7', '#AEE1F9', '#FFFFFF'];
    const totalPetals = 14;
    const totalButterflies = 4;

    for (let i = 0; i < totalPetals; i++){
      const el = document.createElement('div');
      el.className = 'floater';
      el.innerHTML = petalSVG(petalColors[i % petalColors.length]);
      const left = Math.random() * 100;
      const duration = 22 + Math.random() * 20;
      const delay = Math.random() * 26;
      const driftX = (Math.random() - 0.5) * 160;
      const driftR = 120 + Math.random() * 240;
      el.style.left = `${left}vw`;
      el.style.setProperty('--drift-x', `${driftX}px`);
      el.style.setProperty('--drift-r', `${driftR}deg`);
      el.style.animation = `drift-up ${duration}s linear ${delay}s infinite`;
      container.appendChild(el);
    }

    for (let i = 0; i < totalButterflies; i++){
      const el = document.createElement('div');
      el.className = 'floater';
      el.style.fontSize = `${20 + Math.random() * 10}px`;
      el.textContent = '\u{1F98B}';
      const left = Math.random() * 100;
      const duration = 30 + Math.random() * 18;
      const delay = Math.random() * 20;
      el.style.left = `${left}vw`;
      el.style.setProperty('--drift-x', `${(Math.random() - 0.5) * 220}px`);
      el.style.setProperty('--drift-r', `0deg`);
      el.style.animation = `drift-up ${duration}s linear ${delay}s infinite, flutter 2.6s ease-in-out infinite`;
      container.appendChild(el);
    }
  }

  /* ============================================================
     12. KEYBOARD SUPPORT
     ============================================================ */

  function initKeyboardSupport(){
    document.addEventListener('keydown', (e) => {
      if (!screens.question.classList.contains('active')) return;
      if (e.key === 'Enter' && !btnNext.disabled){
        // avoid double-firing while typing in a textarea (allow newline there)
        if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') return;
        goNext();
      } else if (e.key === 'ArrowLeft' && !btnBack.disabled){
        goBack();
      }
    });
  }

  /* ============================================================
     13. WIRE UP
     ============================================================ */

  function init(){
    initCanvasBackground();
    initFloaters();
    initKeyboardSupport();

    $('#btn-begin').addEventListener('click', () => showScreen('intro'));
    $('#btn-start-questions').addEventListener('click', startQuestionnaire);
    btnNext.addEventListener('click', goNext);
    btnBack.addEventListener('click', goBack);
    $('#btn-download').addEventListener('click', downloadPdf);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
