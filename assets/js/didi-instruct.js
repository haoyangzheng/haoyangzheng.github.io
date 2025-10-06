(() => {
// ---------- config ----------
const BASE = '{{ base_path }}'; // provided by {% include base_path %}
const DATA = {
  arm:  `/assets/data/arm_trace.json`,   // was '/assets/data/arm_trace.json'
  mdlm: `/assets/data/mdlm_trace.json`,  // was '/assets/data/mdlm_trace.json'
  didi: `/assets/data/didi_trace.json`   // was '/assets/data/didi_trace.json'
};
const NFEs_MAP = {
  arm:  s => s,
  mdlm: s => s,
  didi: s => s
};
const TOK_MASK = '[MASK]';

// ---------- state ----------
let method = 'didi'; // Default to DiDi
let trace = null;
let seq = [];
let step = 0;
let playing = false;
let isLooping = true; // NEW: Looping state
let baseMsPerStep = 500;
let speed = 1.0;
let rafId = null;

// ---------- dom ----------
const $tabs = [...document.querySelectorAll('.method-tabs .tab')];
const $btnPrev = document.getElementById('btn-prev');
const $btnPlay = document.getElementById('btn-play');
const $btnReplay = document.getElementById('btn-replay');
const $btnNext = document.getElementById('btn-next');
const $speed = document.getElementById('speed');
const $speedVal = document.getElementById('speed-val');
const $line = document.getElementById('token-line');
const $step = document.getElementById('step-readout');
// const $nfeVal = document.getElementById('nfe-val');

// ---------- helpers ----------
// Asynchronously loads and processes the trace data for the animation.
async function loadTrace(name, autoplay = false) {
  try {
    const res = await fetch(DATA[name], {cache: 'no-store'});
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    trace = await res.json();
    
    // --- Start: New logic to fix the container height ---
    const $viewer = document.querySelector('.viewer');

    // 1. Reset the animation to its initial state (all '[MASK]' tokens).
    // This is the state that has the maximum height.
    resetAnimation(); 
    
    // 2. Measure the height of the container in its initial, widest state.
    const initialHeight = $viewer.offsetHeight;
    
    // 3. Set this measured height as the container's minimum height.
    // This will prevent the container from shrinking as the animation plays.
    $viewer.style.minHeight = `${initialHeight}px`;
    // --- End: Height fixing logic ---

    updateReadout();
    
    // If autoplay is requested, start the animation.
    if (autoplay) {
        togglePlay();
    }
  } catch (e) {
    console.error("Failed to load trace data:", e);
    $line.textContent = `Error: Could not load data for ${name}.`;
  }
}
function render(highlightNew=false) {
  const L = seq.length;
  const newSet = new Set();
  if (highlightNew && trace && trace.steps[step]) {
    for (const r of trace.steps[step].reveals) newSet.add(r.i);
  }
  const frag = document.createDocumentFragment();
  for (let i=0;i<L;i++) {
    const span = document.createElement('span');
    span.className = 'token ' + (seq[i]===TOK_MASK ? 'mask' : (newSet.has(i)?'new':'known'));
    span.textContent = (seq[i]===TOK_MASK? TOK_MASK : seq[i]) + ' ';
    frag.appendChild(span);
  }
  $line.replaceChildren(frag);
}
function applyStep(k) {
  if (!trace || !trace.steps[k]) return;
  for (const r of trace.steps[k].reveals) {
    seq[r.i] = r.tok;
  }
}
function updateReadout() {
  const total = trace ? trace.steps.length : 0;
  $step.textContent = `NFEs: ${Math.min(step, total)}/${total}`;
}
// Resets the animation to its initial state.
function resetAnimation() {
    // Fix: The 'seq' array must be re-initialized with the correct length 
    // from the currently loaded trace data. Otherwise, seq.fill() would not work correctly
    // on an empty or incorrectly sized array.
    const len = trace ? trace.meta.seq_len : 0;
    seq = Array(len).fill(TOK_MASK);

    step = 0;
    render();
    // The updateReadout() call is not strictly needed for the height calculation,
    // but it is necessary for correctly resetting the UI text, so we keep it.
    updateReadout();
}
function togglePlay() {
  if (!trace) return;
  playing = !playing;
  $btnPlay.textContent = playing ? '⏸ Pause' : '▶ Play';
  if (playing) {
      if (step >= trace.steps.length) { // if at the end, reset
          resetAnimation();
      }
      loop();
  } else {
      cancelAnimationFrame(rafId);
  }
}
function loop() {
  let lastTime = performance.now();
  const tick = (now) => {
    const ms = baseMsPerStep / speed;
    if (now - lastTime >= ms) {
      lastTime = now;
      if (step < trace.steps.length) {
        applyStep(step);
        render(true);
        step++;
        updateReadout();
      } else { // Animation finished
        if (isLooping) {
          resetAnimation();
        } else {
          playing = false;
          $btnPlay.textContent = '▶ Play';
          cancelAnimationFrame(rafId);
          return;
        }
      }
    }
    if (playing) {
      rafId = requestAnimationFrame(tick);
    }
  };
  rafId = requestAnimationFrame(tick);
}

// ---------- events ----------
$tabs.forEach(btn => btn.addEventListener('click', async () => {
  $tabs.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
  });
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');
  method = btn.dataset.method;
  cancelAnimationFrame(rafId);
  playing = false; $btnPlay.textContent = '▶ Play';
  await loadTrace(method, true);
}));
$btnPrev.addEventListener('click', () => {
  if (!trace || step === 0) return;
  if (playing) togglePlay();
  step--;
  seq.fill(TOK_MASK);
  for (let k=0;k<step;k++) applyStep(k);
  render();
  updateReadout();
});
$btnNext.addEventListener('click', () => {
  if (!trace || step >= trace.steps.length) return;
  if (playing) togglePlay();
  applyStep(step);
  render(true);
  step++;
  updateReadout();
});

// MODIFIED Replay Button Logic
$btnReplay.addEventListener('click', () => {
    if (!trace) return;
    isLooping = !isLooping; // Toggle looping state
    $btnReplay.textContent = isLooping ? '↻ Loop' : '↺ Replay'; //
    $btnReplay.style.borderColor = isLooping ? '#d32f2f' : '#d0d7de'; // Highlight if looping

    // If animation is not playing, reset it.
    if (!playing) {
        cancelAnimationFrame(rafId);
        resetAnimation();
    }
});

$btnPlay.addEventListener('click', togglePlay);

$speed.addEventListener('input', (e) => {
  speed = parseFloat(e.target.value);
  $speedVal.textContent = speed.toFixed(2) + '×';
});

// ---------- init ----------
$btnReplay.textContent = '↻ Loop';
$btnReplay.style.borderColor = '#d32f2f';
loadTrace(method, true);
})();

const copyBtn = document.getElementById('copy-bibtex-btn');
const bibtexContent = document.getElementById('bibtex-content');
// Get references to the two icons inside the button
const copyIcon = copyBtn.querySelector('.copy-icon');
const checkIcon = copyBtn.querySelector('.check-icon');

copyBtn.addEventListener('click', () => {
  const textToCopy = bibtexContent.innerText.trim();
  
  navigator.clipboard.writeText(textToCopy).then(() => {
    // This is the new logic: hide the copy icon and show the check icon
    copyIcon.style.display = 'none';
    checkIcon.style.display = 'inline-block';
    
    // Reset the icon after 2 seconds
    setTimeout(() => {
      copyIcon.style.display = 'inline-block';
      checkIcon.style.display = 'none';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy BibTeX: ', err);
  });
});