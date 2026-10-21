/**
 * Wan 2.1 Video Generator - Pure HTML/JS Hugging Face ZeroGPU Client
 * Powered by Wan 2.1 14B + CausVid LoRA (multimodalart/wan2-1-fast)
 */

// State Management
const STATE = {
  mode: 'i2v', // 'i2v' or 't2v'
  currentImageBlob: null,
  currentImageMeta: { width: 896, height: 512 },
  spaceId: localStorage.getItem('wan_space_id') || 'multimodalart/wan2-1-fast',
  hfToken: localStorage.getItem('wan_hf_token') || '',
  isGenerating: false,
  timerInterval: null,
  elapsedSeconds: 0,
  currentVideoUrl: null,
  history: JSON.parse(localStorage.getItem('wan_history') || '[]'),
};

// DOM Elements
const DOM = {
  // Tabs
  tabBtns: document.querySelectorAll('.tab-btn'),
  imageInputSection: document.getElementById('imageInputSection'),
  t2vHelperSection: document.getElementById('t2vHelperSection'),
  btnGenBaseImage: document.getElementById('btnGenBaseImage'),

  // Dropzone & Image
  dropzone: document.getElementById('dropzone'),
  fileInput: document.getElementById('fileInput'),
  dropzonePrompt: document.getElementById('dropzonePrompt'),
  imagePreviewContainer: document.getElementById('imagePreviewContainer'),
  imagePreview: document.getElementById('imagePreview'),
  imageMeta: document.getElementById('imageMeta'),
  imageActions: document.getElementById('imageActions'),
  btnClearImage: document.getElementById('btnClearImage'),
  btnChangeImage: document.getElementById('btnChangeImage'),
  sampleBtns: document.querySelectorAll('.sample-btn'),

  // Prompt & Chips
  promptInput: document.getElementById('promptInput'),
  promptCharCount: document.getElementById('promptCharCount'),
  chips: document.querySelectorAll('.chip'),
  negativePrompt: document.getElementById('negativePrompt'),

  // Settings & Params
  ratioBtns: document.querySelectorAll('.ratio-btn'),
  durationSlider: document.getElementById('durationSlider'),
  durationVal: document.getElementById('durationVal'),
  stepsSlider: document.getElementById('stepsSlider'),
  stepsVal: document.getElementById('stepsVal'),
  guidanceSlider: document.getElementById('guidanceSlider'),
  guidanceVal: document.getElementById('guidanceVal'),
  seedInput: document.getElementById('seedInput'),
  randomSeedCheck: document.getElementById('randomSeedCheck'),

  // Generate Button
  btnGenerate: document.getElementById('btnGenerate'),
  btnGenText: document.getElementById('btnGenText'),

  // Video Stage
  videoStage: document.getElementById('videoStage'),
  stagePlaceholder: document.getElementById('stagePlaceholder'),
  stageLoading: document.getElementById('stageLoading'),
  loadingTitle: document.getElementById('loadingTitle'),
  loadingSubtitle: document.getElementById('loadingSubtitle'),
  progressBar: document.getElementById('progressBar'),
  progressStep: document.getElementById('progressStep'),
  progressTimer: document.getElementById('progressTimer'),
  resultVideo: document.getElementById('resultVideo'),
  videoActions: document.getElementById('videoActions'),
  btnDownload: document.getElementById('btnDownload'),
  btnFullscreen: document.getElementById('btnFullscreen'),

  // Info Bar
  genInfoBar: document.getElementById('genInfoBar'),
  infoDim: document.getElementById('infoDim'),
  infoTime: document.getElementById('infoTime'),
  infoSeed: document.getElementById('infoSeed'),

  // History
  historyGrid: document.getElementById('historyGrid'),
  historyEmpty: document.getElementById('historyEmpty'),
  btnClearHistory: document.getElementById('btnClearHistory'),

  // Settings Modal
  btnSettings: document.getElementById('btnSettings'),
  settingsModal: document.getElementById('settingsModal'),
  modalBackdrop: document.getElementById('modalBackdrop'),
  btnCloseModal: document.getElementById('btnCloseModal'),
  hfSpaceInput: document.getElementById('hfSpaceInput'),
  hfTokenInput: document.getElementById('hfTokenInput'),
  btnSaveSettings: document.getElementById('btnSaveSettings'),
  presetSpaceBtns: document.querySelectorAll('.preset-space-btn'),

  // Toast
  toast: document.getElementById('toast'),
};

/**
 * Dynamic Gradio Client Loader with CDN Fallback
 */
let gradioClientModule = null;
async function loadGradioClient() {
  if (gradioClientModule) return gradioClientModule;
  const sources = [
    'https://cdn.jsdelivr.net/npm/@gradio/client/+esm',
    'https://esm.sh/@gradio/client'
  ];

  for (const src of sources) {
    try {
      console.log(`[Wan 2.1] Loading Gradio Client from ${src}...`);
      const mod = await import(src);
      if (mod && mod.Client) {
        console.log('[Wan 2.1] Gradio Client loaded successfully.');
        gradioClientModule = mod;
        return mod;
      }
    } catch (err) {
      console.warn(`[Wan 2.1] Failed to load from ${src}:`, err);
    }
  }
  throw new Error('មិនអាចទាញយកបណ្ណាល័យ Gradio Client បានទេ។ សូមពិនិត្យការតភ្ជាប់អ៊ីនធឺណិត។');
}

/**
 * Toast Notification Utility
 */
let toastTimeout = null;
function showToast(message, type = 'info', duration = 4000) {
  if (toastTimeout) clearTimeout(toastTimeout);
  DOM.toast.className = `toast toast-${type}`;
  DOM.toast.textContent = message;
  DOM.toast.style.display = 'block';

  toastTimeout = setTimeout(() => {
    DOM.toast.style.display = 'none';
  }, duration);
}

/**
 * Image Upload & Preview Handlers
 */
function handleFileSelect(file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('សូមជ្រើសរើសឯកសាររូបភាព (PNG, JPG, WEBP)', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const img = new Image();
    img.onload = () => {
      // Round to nearest multiples of 32 for optimal Wan2.1 compatibility
      let targetW = Math.round(img.width / 32) * 32;
      let targetH = Math.round(img.height / 32) * 32;
      
      // Keep within acceptable bounds (between 256 and 896)
      targetW = Math.min(Math.max(targetW, 256), 896);
      targetH = Math.min(Math.max(targetH, 256), 896);

      STATE.currentImageBlob = file;
      DOM.imagePreview.src = dataUrl;
      DOM.imagePreviewContainer.style.display = 'flex';
      DOM.dropzonePrompt.style.display = 'none';
      DOM.imageActions.style.display = 'block';
      DOM.imageMeta.textContent = `${img.width} × ${img.height} (AI: ${targetW}×${targetH})`;

      // Auto update ratio selection if close to standard
      updateDimensionInputs(targetW, targetH);
      showToast('រូបភាពត្រូវបានផ្ទុកជោគជ័យ!', 'success');
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

function clearImage() {
  STATE.currentImageBlob = null;
  DOM.fileInput.value = '';
  DOM.imagePreview.src = '';
  DOM.imagePreviewContainer.style.display = 'none';
  DOM.dropzonePrompt.style.display = 'block';
  DOM.imageActions.style.display = 'none';
}

async function loadSampleImage(url) {
  try {
    showToast('កំពុងទាញយករូបភាពគំរូ...', 'info', 2000);
    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], 'sample.jpg', { type: blob.type || 'image/jpeg' });
    handleFileSelect(file);
  } catch (err) {
    console.error('Sample fetch error:', err);
    showToast('មិនអាចទាញយករូបភាពគំរូបានទេ', 'error');
  }
}

/**
 * Text-to-Image Helper (creates base image before video animation)
 */
async function generateBaseImageFromPrompt() {
  const prompt = DOM.promptInput.value.trim();
  if (!prompt) {
    showToast('សូមសរសេរ Prompt ពិពណ៌នារូបភាពជាមុនសិន!', 'error');
    DOM.promptInput.focus();
    return;
  }

  const btn = DOM.btnGenBaseImage;
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span>កំពុងគូររូបភាពដោយ AI... (សូមរង់ចាំ 2-3 វិនាទី)</span>`;

  try {
    const width = STATE.currentImageMeta.width;
    const height = STATE.currentImageMeta.height;
    const seed = Math.floor(Math.random() * 100000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Pollinations request failed');
    const blob = await response.blob();
    const file = new File([blob], `base-image-${seed}.jpg`, { type: 'image/jpeg' });
    
    handleFileSelect(file);
    showToast('រូបភាពត្រូវបានបង្កើតជោគជ័យ! ឥឡូវចុច "បង្កើតវីដេអូ" ដើម្បីដំណើរការ Wan 2.1', 'success', 5000);
  } catch (err) {
    console.error('Base image generation failed:', err);
    showToast('បរាជ័យក្នុងការបង្កើតរូបភាពគំរូ។ សូមព្យាយាមម្តងទៀត។', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

/**
 * Aspect Ratio & Parameter Updates
 */
function updateDimensionInputs(w, h) {
  STATE.currentImageMeta.width = w;
  STATE.currentImageMeta.height = h;

  DOM.ratioBtns.forEach(btn => {
    const bw = parseInt(btn.dataset.w);
    const bh = parseInt(btn.dataset.h);
    if (bw === w && bh === h) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/**
 * Timer & Progress Helpers
 */
function startTimer() {
  STATE.elapsedSeconds = 0;
  DOM.progressTimer.textContent = 'រយៈពេល: 00:00';
  clearInterval(STATE.timerInterval);
  STATE.timerInterval = setInterval(() => {
    STATE.elapsedSeconds++;
    const mins = String(Math.floor(STATE.elapsedSeconds / 60)).padStart(2, '0');
    const secs = String(STATE.elapsedSeconds % 60).padStart(2, '0');
    DOM.progressTimer.textContent = `រយៈពេល: ${mins}:${secs}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(STATE.timerInterval);
  const mins = String(Math.floor(STATE.elapsedSeconds / 60)).padStart(2, '0');
  const secs = String(STATE.elapsedSeconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function updateProgress(percent, title, stepDesc) {
  DOM.progressBar.style.width = `${Math.min(Math.max(percent, 5), 100)}%`;
  if (title) DOM.loadingTitle.textContent = title;
  if (stepDesc) DOM.progressStep.textContent = stepDesc;
}

/**
 * Main Video Generation Execution (Wan 2.1 ZeroGPU)
 */
async function generateVideo() {
  if (STATE.isGenerating) return;

  const prompt = DOM.promptInput.value.trim();
  if (!prompt) {
    showToast('សូមបញ្ចូលការណែនាំចលនា / Prompt!', 'error');
    DOM.promptInput.focus();
    return;
  }

  // If in Text-to-Video mode or no image uploaded, auto-generate base image first
  if (!STATE.currentImageBlob) {
    if (STATE.mode === 't2v') {
      showToast('កំពុងបង្កើតរូបភាពដើមចេញពី Prompt ជាមុនសិន...', 'info', 3000);
      await generateBaseImageFromPrompt();
      if (!STATE.currentImageBlob) return;
    } else {
      showToast('សូមបញ្ចូលរូបភាពដើម (Input Image) ជាមុនសិន!', 'error');
      DOM.dropzone.scrollIntoView({ behavior: 'smooth' });
      return;
    }
  }

  // Lock UI
  STATE.isGenerating = true;
  DOM.btnGenerate.disabled = true;
  DOM.btnGenText.textContent = 'កំពុងបង្កើតវីដេអូ...';
  DOM.stagePlaceholder.style.display = 'none';
  DOM.resultVideo.style.display = 'none';
  DOM.videoActions.style.display = 'none';
  DOM.genInfoBar.style.display = 'none';
  DOM.stageLoading.style.display = 'flex';
  
  startTimer();
  updateProgress(10, 'កំពុងតភ្ជាប់ទៅកាន់ម៉ាស៊ីន Wan 2.1...', 'ស្ថានភាព: កំពុងតភ្ជាប់ Space');

  try {
    // 1. Load Gradio Client module
    const { Client, handle_file } = await loadGradioClient();

    // 2. Connect to Hugging Face Space
    updateProgress(20, 'កំពុងតភ្ជាប់ Hugging Face ZeroGPU...', `Space: ${STATE.spaceId}`);
    
    const clientOptions = {};
    if (STATE.hfToken) {
      clientOptions.token = STATE.hfToken;
    }

    const client = await Client.connect(STATE.spaceId, clientOptions);
    console.log('[Wan 2.1] Space connected:', client);

    // 3. Prepare parameters
    updateProgress(35, 'កំពុងបញ្ចូលរូបភាព និងរៀបចំបញ្ជា...', 'ស្ថានភាព: កំពុងផ្ញើរូបភាព');
    
    const handledImage = await handle_file(STATE.currentImageBlob);
    const width = Number(STATE.currentImageMeta.width) || 896;
    const height = Number(STATE.currentImageMeta.height) || 512;
    const duration = parseFloat(DOM.durationSlider.value) || 2.0;
    const steps = parseInt(DOM.stepsSlider.value) || 4;
    const guidance = parseFloat(DOM.guidanceSlider.value) || 1.0;
    const isRandomSeed = DOM.randomSeedCheck.checked;
    const seed = isRandomSeed ? Math.floor(Math.random() * 2147483647) : parseInt(DOM.seedInput.value) || 42;
    const negativePrompt = DOM.negativePrompt.value.trim() || 'Bright tones, overexposed, static, blurred details, ugly, deformed';

    updateProgress(45, 'កំពុងចូលជួរ ZeroGPU (Queue)...', 'ស្ថានភាព: កំពុងរង់ចាំដំណើរការ');

    // 4. Submit Job with real-time SSE updates
    const job = client.submit('/generate_video', {
      input_image: handledImage,
      prompt: prompt,
      height: height,
      width: width,
      negative_prompt: negativePrompt,
      duration_seconds: duration,
      guidance_scale: guidance,
      steps: steps,
      seed: seed,
      randomize_seed: isRandomSeed
    });

    let finalData = null;

    // Listen to real-time events from Gradio Queue
    for await (const msg of job) {
      console.log('[Wan 2.1 Event]', msg);

      if (msg.type === 'status') {
        const { stage, progress, eta, queue_position } = msg;

        if (stage === 'pending') {
          const queueText = queue_position !== null ? `ជួរលេខ: ${queue_position}` : 'កំពុងរង់ចាំជួរ';
          const etaText = eta ? ` • ប៉ាន់ស្មាន ${Math.round(eta)}s` : '';
          updateProgress(50, 'កំពុងរង់ចាំជួរម៉ាស៊ីន (In Queue)...', `${queueText}${etaText}`);
        } else if (stage === 'generating') {
          let percent = 55;
          if (progress && Array.isArray(progress) && progress[0] !== undefined) {
            percent = 55 + Math.round((progress[0] / (progress[1] || steps)) * 40);
          } else if (typeof progress === 'number') {
            percent = 55 + Math.round(progress * 40);
          }
          updateProgress(percent, 'កំពុងដំណើរការបង្កើតវីដេអូចលនា...', `Wan 2.1 ZeroGPU (${percent}%)`);
        } else if (stage === 'complete') {
          updateProgress(98, 'កំពុងបញ្ចប់វីដេអូ...', 'ស្ថានភាព: ជិតរួចរាល់');
        }
      } else if (msg.type === 'data') {
        finalData = msg.data;
      }
    }

    if (!finalData || !finalData[0]) {
      throw new Error('ពុំមានទិន្នន័យវីដេអូត្រូវបានប្រគល់ត្រឡប់មកវិញទេ');
    }

    // 5. Parse returned Video URL
    const videoResult = finalData[0];
    let videoUrl = '';
    if (typeof videoResult === 'string') {
      videoUrl = videoResult;
    } else if (videoResult.video && videoResult.video.url) {
      videoUrl = videoResult.video.url;
    } else if (videoResult.url) {
      videoUrl = videoResult.url;
    } else if (videoResult.video && videoResult.video.path) {
      // Relative path from Gradio root
      const rootUrl = client.config ? client.config.root : `https://${STATE.spaceId.replace('/', '-')}.hf.space`;
      videoUrl = `${rootUrl}/file=${videoResult.video.path}`;
    }

    if (!videoUrl) {
      throw new Error('មិនអាចស្វែងរក URL វីដេអូបានឡើយ');
    }

    // Resolve relative URL if needed
    if (videoUrl.startsWith('/')) {
      const rootUrl = client.config ? client.config.root : `https://${STATE.spaceId.replace('/', '-')}.hf.space`;
      videoUrl = `${rootUrl}${videoUrl}`;
    }

    const elapsedFormatted = stopTimer();
    updateProgress(100, 'ជោគជ័យ!', 'វីដេអូបានបង្កើតរួចរាល់ 100%');

    // 6. Display Video
    STATE.currentVideoUrl = videoUrl;
    DOM.resultVideo.src = videoUrl;
    DOM.resultVideo.style.display = 'block';
    DOM.videoActions.style.display = 'flex';
    DOM.stageLoading.style.display = 'none';

    // Update Info Bar
    DOM.infoDim.textContent = `${width} × ${height}`;
    DOM.infoTime.textContent = elapsedFormatted;
    DOM.infoSeed.textContent = finalData[1] || seed;
    DOM.genInfoBar.style.display = 'flex';

    // Attempt video autoplay
    DOM.resultVideo.play().catch(e => console.log('Autoplay blocked:', e));

    // Save to History
    saveToHistory({
      videoUrl,
      prompt,
      dimensions: `${width}×${height}`,
      time: elapsedFormatted,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    showToast('🎉 បង្កើតវីដេអូបានជោគជ័យ!', 'success', 5000);

  } catch (err) {
    console.error('[Wan 2.1 Error]', err);
    stopTimer();
    DOM.stageLoading.style.display = 'none';
    DOM.stagePlaceholder.style.display = 'flex';
    showToast(`កំហុស៖ ${err.message || 'មិនអាចបង្កើតវីដេអូបានទេ'}`, 'error', 7000);
  } finally {
    STATE.isGenerating = false;
    DOM.btnGenerate.disabled = false;
    DOM.btnGenText.textContent = 'បង្កើតវីដេអូឥឡូវនេះ (Generate Video)';
  }
}

/**
 * History / Gallery Management
 */
function saveToHistory(item) {
  STATE.history.unshift(item);
  if (STATE.history.length > 12) STATE.history.pop();
  localStorage.setItem('wan_history', JSON.stringify(STATE.history));
  renderHistory();
}

function renderHistory() {
  if (STATE.history.length === 0) {
    DOM.historyEmpty.style.display = 'block';
    DOM.historyGrid.querySelectorAll('.history-card').forEach(c => c.remove());
    return;
  }

  DOM.historyEmpty.style.display = 'none';
  DOM.historyGrid.querySelectorAll('.history-card').forEach(c => c.remove());

  STATE.history.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.title = item.prompt;
    card.innerHTML = `
      <video src="${item.videoUrl}" muted playsinline></video>
      <div class="history-card-overlay">
        <div class="history-play-icon">▶</div>
      </div>
    `;
    card.addEventListener('click', () => {
      DOM.resultVideo.src = item.videoUrl;
      DOM.resultVideo.style.display = 'block';
      DOM.stagePlaceholder.style.display = 'none';
      DOM.stageLoading.style.display = 'none';
      DOM.videoActions.style.display = 'flex';
      DOM.resultVideo.play();
      DOM.resultVideo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    DOM.historyGrid.appendChild(card);
  });
}

function clearHistory() {
  if (confirm('តើអ្នកពិតជាចង់លុបប្រវត្តិវីដេអូទាំងអស់មែនទេ?')) {
    STATE.history = [];
    localStorage.removeItem('wan_history');
    renderHistory();
    showToast('ប្រវត្តិវីដេអូត្រូវបានលុប!', 'info');
  }
}

/**
 * Video Download
 */
async function downloadCurrentVideo() {
  if (!STATE.currentVideoUrl) return;
  const filename = `wan2.1-video-${Date.now()}.mp4`;
  showToast('កំពុងទាញយកវីដេអូ...', 'info', 2000);

  try {
    const res = await fetch(STATE.currentVideoUrl);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    showToast('ទាញយកវីដេអូរួចរាល់!', 'success');
  } catch (err) {
    console.warn('Direct download fetch failed, opening URL instead:', err);
    const a = document.createElement('a');
    a.href = STATE.currentVideoUrl;
    a.target = '_blank';
    a.download = filename;
    a.click();
  }
}

/**
 * Event Listeners Initialization
 */
function initEventListeners() {
  // Mode Switcher (Image-to-Video vs Text-to-Video)
  DOM.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.mode = btn.dataset.mode;

      if (STATE.mode === 't2v') {
        DOM.t2vHelperSection.style.display = 'flex';
      } else {
        DOM.t2vHelperSection.style.display = 'none';
      }
    });
  });

  // Base Image Generator button (in T2V mode)
  DOM.btnGenBaseImage.addEventListener('click', generateBaseImageFromPrompt);

  // Dropzone Click & Change
  DOM.dropzone.addEventListener('click', () => DOM.fileInput.click());
  DOM.fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
  });

  // Dropzone Drag & Drop
  ['dragenter', 'dragover'].forEach(eventName => {
    DOM.dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      DOM.dropzone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    DOM.dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      DOM.dropzone.classList.remove('drag-over');
    });
  });

  DOM.dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  });

  // Global Clipboard Paste (Ctrl+V)
  document.addEventListener('paste', (e) => {
    if (e.clipboardData && e.clipboardData.items) {
      for (const item of e.clipboardData.items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          handleFileSelect(file);
          break;
        }
      }
    }
  });

  // Image Action Buttons
  DOM.btnClearImage.addEventListener('click', clearImage);
  DOM.btnChangeImage.addEventListener('click', (e) => {
    e.stopPropagation();
    DOM.fileInput.click();
  });

  // Sample Buttons
  DOM.sampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.url;
      if (url) loadSampleImage(url);
    });
  });

  // Prompt Character Count
  DOM.promptInput.addEventListener('input', () => {
    const len = DOM.promptInput.value.length;
    DOM.promptCharCount.textContent = `${len} / 500`;
  });

  // Prompt Style Chips
  DOM.chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const appendText = chip.dataset.append;
      const current = DOM.promptInput.value.trim();
      if (current) {
        DOM.promptInput.value = `${current}, ${appendText}`;
      } else {
        DOM.promptInput.value = appendText;
      }
      DOM.promptInput.dispatchEvent(new Event('input'));
      DOM.promptInput.focus();
    });
  });

  // Ratio Buttons
  DOM.ratioBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const w = parseInt(btn.dataset.w);
      const h = parseInt(btn.dataset.h);
      updateDimensionInputs(w, h);
    });
  });

  // Parameter Sliders Real-time Value Updates
  DOM.durationSlider.addEventListener('input', (e) => {
    DOM.durationVal.textContent = `${parseFloat(e.target.value).toFixed(1)}s`;
  });

  DOM.stepsSlider.addEventListener('input', (e) => {
    DOM.stepsVal.textContent = e.target.value;
  });

  DOM.guidanceSlider.addEventListener('input', (e) => {
    DOM.guidanceVal.textContent = parseFloat(e.target.value).toFixed(1);
  });

  DOM.randomSeedCheck.addEventListener('change', (e) => {
    DOM.seedInput.disabled = e.target.checked;
  });

  // Generate Button Click
  DOM.btnGenerate.addEventListener('click', generateVideo);

  // Video Actions (Download & Fullscreen)
  DOM.btnDownload.addEventListener('click', downloadCurrentVideo);
  DOM.btnFullscreen.addEventListener('click', () => {
    if (DOM.resultVideo.requestFullscreen) {
      DOM.resultVideo.requestFullscreen();
    }
  });

  // History Clear
  DOM.btnClearHistory.addEventListener('click', clearHistory);

  // Settings Modal Controls
  DOM.btnSettings.addEventListener('click', () => {
    DOM.hfSpaceInput.value = STATE.spaceId;
    DOM.hfTokenInput.value = STATE.hfToken;
    DOM.settingsModal.style.display = 'flex';
  });

  const closeModal = () => DOM.settingsModal.style.display = 'none';
  DOM.btnCloseModal.addEventListener('click', closeModal);
  DOM.modalBackdrop.addEventListener('click', closeModal);

  DOM.btnSaveSettings.addEventListener('click', () => {
    const newSpace = DOM.hfSpaceInput.value.trim() || 'multimodalart/wan2-1-fast';
    const newToken = DOM.hfTokenInput.value.trim();
    STATE.spaceId = newSpace;
    STATE.hfToken = newToken;
    localStorage.setItem('wan_space_id', newSpace);
    localStorage.setItem('wan_hf_token', newToken);
    closeModal();
    showToast('ការកំណត់ត្រូវបានរក្សាទុក!', 'success');
  });

  DOM.presetSpaceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.hfSpaceInput.value = btn.dataset.space;
    });
  });
}

// Initial Boot
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  renderHistory();
  console.log('[Wan 2.1 Video AI App Initialized]');
});
