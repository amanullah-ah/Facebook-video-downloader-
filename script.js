  const API_URL = "https://eliteprotech-apis.zone.id/facebook1";

  const urlInput = document.getElementById('urlInput');
  const fetchBtn = document.getElementById('fetchBtn');
  const loading = document.getElementById('loading');
  const resultCard = document.getElementById('resultCard');
  const videoTitle = document.getElementById('videoTitle');
  const qualityBadge = document.getElementById('qualityBadge');
  const downloadLinkBtn = document.getElementById('downloadLinkBtn');
  const newDownloadBtn = document.getElementById('newDownloadBtn');
  const errorMessageDiv = document.getElementById('errorMessage');
  const qualityDropdown = document.getElementById('qualityDropdown');
  const qualityToggleBtn = document.getElementById('qualityToggleBtn');
  const qualityToggleLabel = document.getElementById('qualityToggleLabel');
  const qualityButtons = document.getElementById('qualityButtons');

  let videoData = null;
  let selectedQualityUrl = '';
  let currentThumbnail = '';
  const thumbFrame = document.getElementById('thumbFrame');
  const historySection = document.getElementById('historySection');
  const historyList = document.getElementById('historyList');
  const historyClearBtn = document.getElementById('historyClearBtn');
  const statTotal = document.getElementById('statTotal');
  const statToday = document.getElementById('statToday');

  const STORE_KEY = 'fbdl_history_v1';
  const STATS_KEY = 'fbdl_stats_v1';

  function loadHistory(){
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
    catch(e){ return []; }
  }
  function saveHistory(list){
    localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(0, 20)));
  }
  function loadStats(){
    try { return JSON.parse(localStorage.getItem(STATS_KEY)) || { total:0, day:'', dayCount:0 }; }
    catch(e){ return { total:0, day:'', dayCount:0 }; }
  }
  function saveStats(stats){ localStorage.setItem(STATS_KEY, JSON.stringify(stats)); }

  function renderStats(){
    const stats = loadStats();
    statTotal.textContent = stats.total || 0;
    const today = new Date().toDateString();
    statToday.textContent = (stats.day === today) ? (stats.dayCount || 0) : 0;
  }

  function bumpStats(){
    const stats = loadStats();
    const today = new Date().toDateString();
    stats.total = (stats.total || 0) + 1;
    if (stats.day === today){ stats.dayCount = (stats.dayCount || 0) + 1; }
    else { stats.day = today; stats.dayCount = 1; }
    saveStats(stats);
    renderStats();
  }

  function renderHistory(){
    const list = loadHistory();
    if (!list.length){
      historySection.style.display = 'none';
      return;
    }
    historySection.style.display = 'block';
    historyList.innerHTML = list.map(item => `
      <div class="history-item">
        <div class="h-dot"></div>
        <div class="h-info">
          <div class="h-title-text">${item.title}</div>
          <div class="h-meta">${item.quality} · ${item.time}</div>
        </div>
      </div>
    `).join('');
  }

  function addToHistory(title, quality){
    const list = loadHistory();
    list.unshift({
      title: title || 'Facebook Video',
      quality: quality || '',
      time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
    });
    saveHistory(list);
    renderHistory();
  }

  historyClearBtn.addEventListener('click', () => {
    localStorage.removeItem(STORE_KEY);
    renderHistory();
    showToast('History cleared');
  });

  renderStats();
  renderHistory();

  function showError(msg){
    errorMessageDiv.textContent = msg;
    errorMessageDiv.style.display = 'block';
    setTimeout(() => errorMessageDiv.style.display = 'none', 5000);
  }
  function hideError(){ errorMessageDiv.style.display = 'none'; }

  function showToast(msg, isError = false){
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    if (isError) toast.style.borderColor = '#ff4d6d';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  function isValidFacebookUrl(url){
    if (!url) return false;
    const patterns = [
      /facebook\.com\/.*\/videos\/\d+/i,
      /facebook\.com\/watch\?v=\d+/i,
      /facebook\.com\/reel\/\d+/i,
      /facebook\.com\/share\/[a-zA-Z0-9]+\/?/i,
      /facebook\.com\/share\/r\/[a-zA-Z0-9]+\/?/i,
      /fb\.watch\/[a-zA-Z0-9]+/i,
      /facebook\.com\/[a-zA-Z0-9.]+\/videos\/\d+/i,
      /facebook\.com\/[a-zA-Z0-9.]+\/reel\/\d+/i
    ];
    return patterns.some(p => p.test(url));
  }

  function formatQualityName(quality){
    const q = quality.toLowerCase();
    if (q.includes('1080')) return '1080p Full HD';
    if (q.includes('960')) return '960p HD+';
    if (q.includes('840')) return '840p HD';
    if (q.includes('720')) return '720p HD';
    if (q.includes('480')) return '480p SD';
    if (q.includes('360')) return '360p SD';
    return quality;
  }

  function classifyQuality(quality){
    const q = quality.toLowerCase();
    if (q.includes('1080')) return { res:'1080p', tag:'Full HD · Best quality', tier:4 };
    if (q.includes('960'))  return { res:'960p',  tag:'HD+',                    tier:3 };
    if (q.includes('840'))  return { res:'840p',  tag:'HD',                     tier:3 };
    if (q.includes('720'))  return { res:'720p',  tag:'HD',                     tier:3 };
    if (q.includes('480'))  return { res:'480p',  tag:'SD',                     tier:2 };
    if (q.includes('360'))  return { res:'360p',  tag:'SD · Smallest file',     tier:1 };
    return { res: quality, tag:'', tier:2 };
  }

  function displayQualityOptions(results){
    if (!results || results.length === 0){
      qualityButtons.innerHTML = '<div style="color:#6c85a8;">No quality options available</div>';
      return;
    }
    qualityButtons.innerHTML = results.map((item, i) => {
      const info = classifyQuality(item.quality);
      const bars = [1,2,3,4].map(n => `<span class="${info.tier >= n ? 'lit' : ''}"></span>`).join('');
      return `
        <button class="quality-btn ${i === 0 ? 'active' : ''}" data-url="${item.url}" data-quality="${item.quality}">
          <div class="q-signal">${bars}</div>
          <div class="q-info">
            <div class="q-res">${info.res}</div>
            <div class="q-tag">${info.tag}</div>
          </div>
          <div class="q-radio"></div>
        </button>
      `;
    }).join('');

    selectedQualityUrl = results[0].url;
    qualityBadge.textContent = `Selected: ${formatQualityName(results[0].quality)}`;
    qualityToggleLabel.textContent = `Quality: ${formatQualityName(results[0].quality)}`;
    downloadLinkBtn.style.display = 'flex';
    downloadLinkBtn.href = selectedQualityUrl;
    downloadLinkBtn.download = `facebook_video_${Date.now()}.mp4`;

    document.querySelectorAll('.quality-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedQualityUrl = btn.dataset.url;
        const name = formatQualityName(btn.dataset.quality);
        qualityBadge.textContent = `Selected: ${name}`;
        qualityToggleLabel.textContent = `Quality: ${name}`;
        downloadLinkBtn.href = selectedQualityUrl;
        showToast(`Quality changed to ${name}`);
        qualityDropdown.classList.remove('open');
        qualityButtons.style.display = 'none';
      });
    });

    downloadLinkBtn.addEventListener('click', () => {
      const activeBtn = document.querySelector('.quality-btn.active');
      const qName = activeBtn ? formatQualityName(activeBtn.dataset.quality) : '';
      addToHistory(videoTitle.textContent, qName);
      bumpStats();
    }, { once:false });
  }

  async function fetchVideo(){
    const url = urlInput.value.trim();

    if (!url){
      showError('Please enter a Facebook video URL.');
      return;
    }
    if (!isValidFacebookUrl(url)){
      showError('Invalid Facebook URL. Please check the format.');
      return;
    }

    fetchBtn.disabled = true;
    loading.style.display = 'block';
    resultCard.style.display = 'none';
    qualityDropdown.classList.remove('open');
    qualityButtons.style.display = 'none';
    downloadLinkBtn.style.display = 'none';
    hideError();

    try {
      const requestUrl = `${API_URL}?url=${encodeURIComponent(url)}`;
      const response = await fetch(requestUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (data.success === true && data.results && data.results.length > 0){
        videoData = data.results;
        videoTitle.textContent = data.title || 'Facebook Video';
        currentThumbnail = data.thumbnail || data.thumb || '';
        if (currentThumbnail){
          thumbFrame.innerHTML = `<img src="${currentThumbnail}" alt="thumbnail" onerror="this.parentElement.innerHTML='<svg viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%2322d3ee\\' stroke-width=\\'1.6\\'><path d=\\'M4 6h16v12H4z\\' stroke-linejoin=\\'round\\'/><path d=\\'M10 9.5v5l4.5-2.5z\\' fill=\\'%2322d3ee\\' stroke=\\'none\\'/></svg>'">`;
        } else {
          thumbFrame.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="1.6"><path d="M4 6h16v12H4z" stroke-linejoin="round"/><path d="M10 9.5v5l4.5-2.5z" fill="#22d3ee" stroke="none"/></svg>';
        }

        displayQualityOptions(videoData);
        resultCard.style.display = 'block';
        showToast(`Found ${videoData.length} quality option(s)`);
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        throw new Error('No video found. Check the URL or try a different video.');
      }
    } catch (error) {
      showError(`Error: ${error.message}`);
      showToast(`Failed: ${error.message}`, true);
    } finally {
      fetchBtn.disabled = false;
      loading.style.display = 'none';
    }
  }

  function resetForm(){
    urlInput.value = '';
    resultCard.style.display = 'none';
    qualityDropdown.classList.remove('open');
    qualityButtons.style.display = 'none';
    qualityToggleLabel.textContent = 'Select quality';
    downloadLinkBtn.style.display = 'none';
    videoData = null;
    selectedQualityUrl = '';
    videoTitle.textContent = '-';
    qualityBadge.textContent = 'Choose quality below';
    currentThumbnail = '';
    thumbFrame.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="1.6"><path d="M4 6h16v12H4z" stroke-linejoin="round"/><path d="M10 9.5v5l4.5-2.5z" fill="#22d3ee" stroke="none"/></svg>';
    urlInput.focus();
    showToast('Ready for new download');
  }

  fetchBtn.addEventListener('click', fetchVideo);
  newDownloadBtn.addEventListener('click', resetForm);
  urlInput.addEventListener('keypress', e => { if (e.key === 'Enter') fetchVideo(); });
  qualityToggleBtn.addEventListener('click', () => {
    const isOpen = qualityDropdown.classList.toggle('open');
    qualityButtons.style.display = isOpen ? 'flex' : 'none';
    qualityButtons.style.flexDirection = 'column';
  });

  const waOverlay = document.getElementById('waOverlay');
  const waModalClose = document.getElementById('waModalClose');
  const waModalLater = document.getElementById('waModalLater');
  waModalClose.addEventListener('click', () => waOverlay.classList.remove('show'));
  waModalLater.addEventListener('click', () => waOverlay.classList.remove('show'));
  waOverlay.addEventListener('click', (e) => {
    if (e.target === waOverlay) waOverlay.classList.remove('show');
  });
  setTimeout(() => { waOverlay.classList.add('show'); }, 1000);
