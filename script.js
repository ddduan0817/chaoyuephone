/* ============================================
   捡手机文学 - 核心逻辑
   ============================================ */

(function () {
  'use strict';

  // --- State ---
  let currentView = 'lockscreen'; // 手机框内的当前视图
  let episodes = [];
  let currentEpisode = null;

  // --- DOM refs ---
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // 着陆页（全屏浮层，手机框外）
  const landingOverlay = $('#landingOverlay');
  const landingText = $('#landingText');
  const landingBtn = $('#landingBtn');
  const landingHint = $('#landingHint');

  // 手机框
  const phoneFrame = $('#phoneFrame');

  // 手机框内的视图
  const views = {
    lockscreen: $('#viewLockscreen'),
    homescreen: $('#viewHomescreen'),
    chatlist: $('#viewChatlist'),
    wechat: $('#viewWechat'),
    reading: $('#viewReading'),
  };

  const statusBar = $('#statusBar');
  const statusTime = $('#statusTime');
  const lockTime = $('#lockTime');
  const lockDate = $('#lockDate');
  const cardTrack = $('#cardTrack');
  const cardCarousel = $('#cardCarousel');
  const wechatRowMsg = $('#wechatRowMsg');
  const wechatXiaoyueRow = $('#wechatXiaoyueRow');
  let activeCardIndex = 0;
  let selectedEpisode = null;

  const readingTitle = $('#readingTitle');
  const readingContent = $('#readingContent');
  const readingFooter = $('#readingFooter');
  const readingBack = $('#readingBack');
  const readingNextBtn = $('#readingNextBtn');

  // --- Init ---
  async function init() {
    updateClock();
    setInterval(updateClock, 1000);
    createParticles();
    createStreetDust();
    await loadEpisodes();
    bindEvents();
    startLandingAnimation();
  }

  // --- Clock ---
  function updateClock() {
    const now = new Date();
    const h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${h}:${m}`;
    statusTime.textContent = timeStr;
    lockTime.querySelector('.lock-time-h').textContent = h;
    lockTime.querySelector('.lock-time-m').textContent = m;

    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const shortWeekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    // 农历
    const lunarStr = (() => {
      try {
        const stems = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
        const branches = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
        const yr = now.getFullYear();
        const gz = stems[(yr - 4) % 10] + branches[(yr - 4) % 12] + '年';
        const cnNums = ['','一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
        const fmt = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', { month: 'long', day: 'numeric' });
        const parts = fmt.formatToParts(now);
        const lunarM = parts.find(p => p.type === 'month')?.value || '';
        const lunarDNum = parseInt(parts.find(p => p.type === 'day')?.value) || 0;
        const lunarD = cnNums[lunarDNum] || lunarDNum;
        return gz + lunarM + lunarD;
      } catch(e) { return ''; }
    })();
    const lunarPart = lunarStr ? ' · ' + lunarStr : '';
    lockDate.textContent = `${now.getMonth() + 1}月${now.getDate()}日${shortWeekdays[now.getDay()]}${lunarPart}`;

    const calDay = document.getElementById('calDay');
    const calWeekday = document.getElementById('calWeekday');
    if (calDay) calDay.textContent = now.getDate();
    if (calWeekday) calWeekday.textContent = shortWeekdays[now.getDay()];
  }

  // --- Particles (landing page) ---
  function createParticles() {
    const container = $('#particles');
    if (!container) return;
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = (60 + Math.random() * 40) + '%';
      p.style.animationDuration = (4 + Math.random() * 4) + 's';
      p.style.animationDelay = Math.random() * 4 + 's';
      p.style.width = p.style.height = (2 + Math.random() * 2) + 'px';
      container.appendChild(p);
    }
  }

  // --- Street Dust (background particles for desktop) ---
  function createStreetDust() {
    const container = $('#streetDust');
    if (!container) return;
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('div');
      p.className = 'street-dust-particle';
      p.style.left = (10 + Math.random() * 80) + '%';
      p.style.top = (40 + Math.random() * 50) + '%';
      p.style.animationDuration = (6 + Math.random() * 8) + 's';
      p.style.animationDelay = Math.random() * 6 + 's';
      const size = 1 + Math.random() * 2;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.opacity = 0.1 + Math.random() * 0.2;
      container.appendChild(p);
    }
  }

  // --- Typewriter ---
  function typeWriter(text, element, speed = 100) {
    return new Promise((resolve) => {
      element.innerHTML = '';
      const cursor = document.createElement('span');
      cursor.className = 'cursor';

      let i = 0;
      function type() {
        if (i < text.length) {
          element.textContent = text.slice(0, i + 1);
          element.appendChild(cursor);
          i++;
          setTimeout(type, speed);
        } else {
          resolve();
        }
      }
      type();
    });
  }

  // --- Landing Animation ---
  async function startLandingAnimation() {
    const dialogue = document.getElementById('landingDialogue');
    const narration = document.getElementById('landingNarration');
    const phoneShape = document.querySelector('.landing-phone-shape');
    const phoneGlow = document.querySelector('.landing-phone-glow');
    await sleep(1000);
    // 1. 手机 + 对话气泡同时渐显
    phoneShape.classList.add('visible');
    if (phoneGlow) phoneGlow.style.opacity = '1';
    dialogue.classList.add('visible');
    await sleep(2000);
    // 2. 叙事弹窗淡入
    narration.classList.add('visible');
    await sleep(1000);
    // 3. 提示出现
    landingHint.classList.add('visible');
    // Make the phone shape clickable
    document.querySelector('.landing-phone-shape').addEventListener('click', (e) => {
      e.stopPropagation();
      playPickup();
      pickupPhone();
    });
  }

  // --- Pickup: landing -> show phone (screen off) ---
  function pickupPhone() {
    // 1. Animate the landing phone shape
    const scene = document.querySelector('.landing-scene');
    scene.classList.add('picking-up');

    // 2. After pickup animation, fade out landing & show phone (black screen)
    setTimeout(() => {
      landingOverlay.classList.add('hidden');
      phoneFrame.classList.remove('hidden');
      phoneFrame.classList.add('entering');
      // Lock screen starts as "screen off" (black)
      views.lockscreen.classList.add('screen-off');
      statusBar.style.opacity = '0';

      setTimeout(() => {
        phoneFrame.classList.remove('entering');
      }, 800);
    }, 500);
  }

  // --- Load Episodes ---
  async function loadEpisodes() {
    try {
      const res = await fetch('data/episodes.json');
      const data = await res.json();
      episodes = data.episodes;
    } catch (e) {
      console.error('Failed to load episodes:', e);
      episodes = [];
    }
  }

  // --- Render Card Carousel ---
  function renderCards() {
    cardTrack.innerHTML = '';

    episodes.forEach((ep, index) => {
      // Card
      const card = document.createElement('div');
      card.className = 'ep-card' + (index === activeCardIndex ? ' active' : '');
      card.dataset.index = index;
      card.innerHTML = `<span class="ep-card-title">${ep.title}</span>`;
      cardTrack.appendChild(card);
    });

    updateCarousel(activeCardIndex, false);
    bindCarouselEvents();
  }

  // --- Update Carousel Position ---
  function updateCarousel(index, animate) {
    if (animate === undefined) animate = true;
    activeCardIndex = Math.max(0, Math.min(index, episodes.length - 1));

    // Position: each card is 110px wide + 16px gap = 126px per step
    const offset = -activeCardIndex * 126;
    if (animate) {
      cardTrack.classList.remove('dragging');
    } else {
      cardTrack.classList.add('dragging');
    }
    cardTrack.style.transform = `translateX(${offset}px)`;
    if (!animate) {
      // Remove dragging class next frame so future transitions animate
      requestAnimationFrame(() => cardTrack.classList.remove('dragging'));
    }

    // Update active states
    const cards = cardTrack.querySelectorAll('.ep-card');
    cards.forEach((c, i) => c.classList.toggle('active', i === activeCardIndex));
  }

  // --- Carousel Touch/Mouse Drag ---
  function bindCarouselEvents() {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let startOffset = 0;

    function onStart(x) {
      isDragging = true;
      startX = x;
      currentX = x;
      startOffset = -activeCardIndex * 126;
      cardTrack.classList.add('dragging');
    }

    function onMove(x) {
      if (!isDragging) return;
      currentX = x;
      const dx = currentX - startX;
      cardTrack.style.transform = `translateX(${startOffset + dx}px)`;
    }

    function onEnd() {
      if (!isDragging) return;
      isDragging = false;
      cardTrack.classList.remove('dragging');
      const dx = currentX - startX;
      const threshold = 40;
      if (dx < -threshold && activeCardIndex < episodes.length - 1) {
        playCardSwipe();
        updateCarousel(activeCardIndex + 1);
      } else if (dx > threshold && activeCardIndex > 0) {
        playCardSwipe();
        updateCarousel(activeCardIndex - 1);
      } else {
        updateCarousel(activeCardIndex);
      }
    }

    // Touch - bind on carousel container for wider swipe area
    cardCarousel.addEventListener('touchstart', (e) => onStart(e.touches[0].clientX), { passive: true });
    cardCarousel.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX), { passive: true });
    cardCarousel.addEventListener('touchend', onEnd, { passive: true });

    // Mouse
    cardCarousel.addEventListener('mousedown', (e) => { e.preventDefault(); onStart(e.clientX); });
    document.addEventListener('mousemove', (e) => onMove(e.clientX));
    document.addEventListener('mouseup', onEnd);

    // Card tap -> enter wechat view
    cardCarousel.addEventListener('click', (e) => {
      // Ignore if it was a drag
      if (Math.abs(currentX - startX) > 10) return;
      const card = e.target.closest('.ep-card');
      if (!card) return;
      const index = parseInt(card.dataset.index);
      if (index !== activeCardIndex) {
        // Tap non-active card: navigate to it
        playCardSwipe();
        updateCarousel(index);
      } else {
        // Tap active card: select episode and enter wechat
        selectedEpisode = episodes[index];
        if (selectedEpisode) {
          playCardSelect();
          if (selectedEpisode.preview) {
            wechatRowMsg.textContent = selectedEpisode.preview;
          }
          navigateTo('wechat');
        }
      }
    });
  }

  // --- Render Reading View ---
  function renderReading(episode) {
    currentEpisode = episode;
    readingTitle.textContent = '小越';
    readingContent.innerHTML = '';
    readingContent.scrollTop = 0;

    // Try loading images: ep01/01.jpg, ep01/02.jpg, ...
    const maxImages = episode.imageCount || 20;
    for (let i = 1; i <= maxImages; i++) {
      const img = document.createElement('img');
      img.loading = i <= 3 ? 'eager' : 'lazy';
      img.alt = `聊天截图 第${i}张`;
      img.src = `episodes/${episode.id}/${String(i).padStart(2, '0')}.jpg`;
      img.draggable = false;

      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s ease';
      img.onload = () => { img.style.opacity = '1'; };
      // Hide broken images (episode may have fewer than maxImages)
      img.onerror = () => { img.style.display = 'none'; };

      readingContent.appendChild(img);
    }

    readingFooter.style.display = 'block';
    readingContent.appendChild(readingFooter);

    const currentIndex = episodes.indexOf(episode);
    if (currentIndex < episodes.length - 1) {
      readingNextBtn.style.display = 'inline-block';
      readingNextBtn.onclick = () => {
        const nextEp = episodes[currentIndex + 1];
        renderReading(nextEp);
        readingContent.scrollTop = 0;
      };
    } else {
      readingNextBtn.style.display = 'none';
    }
  }

  // --- View Navigation (within phone frame only) ---
  function navigateTo(viewName) {
    const prevView = views[currentView];
    const nextView = views[viewName];

    // Status bar text color
    if (viewName === 'wechat' || viewName === 'reading') {
      statusBar.classList.add('dark-text');
    } else {
      statusBar.classList.remove('dark-text');
    }

    switch (`${currentView}->${viewName}`) {
      case 'lockscreen->homescreen':
        prevView.classList.add('enter-unlock');
        setTimeout(() => {
          prevView.classList.remove('active', 'enter-unlock');
          prevView.style.display = 'none';
          nextView.classList.add('active');
          nextView.style.display = 'flex';
          nextView.style.opacity = '1';
          // After unlock: badge → sound → dialogue
          showWechatHint();
        }, 400);
        break;

      case 'homescreen->chatlist':
        // Hide hint boxes immediately
        const h1 = document.getElementById('wechatHint1');
        const h2 = document.getElementById('wechatHint2');
        if (h1) { h1.classList.remove('show'); h1.style.display = 'none'; }
        if (h2) { h2.classList.remove('show'); h2.style.display = 'none'; }
        renderCards();
        // Show wechat view underneath first
        views.wechat.style.display = 'flex';
        views.wechat.style.opacity = '1';
        views.wechat.classList.add('active');
        // Overlay card picker on top
        nextView.style.display = 'flex';
        nextView.style.opacity = '1';
        nextView.classList.add('active', 'slide-in');
        setTimeout(() => {
          prevView.classList.remove('active');
          prevView.style.display = 'none';
          nextView.classList.remove('slide-in');
        }, 350);
        break;

      case 'chatlist->wechat':
        // Fade out the card picker overlay, wechat is already visible underneath
        prevView.style.opacity = '0';
        setTimeout(() => {
          prevView.classList.remove('active');
          prevView.style.display = 'none';
          prevView.style.opacity = '';
        }, 400);
        break;

      case 'wechat->reading':
        nextView.style.display = 'flex';
        nextView.style.opacity = '1';
        nextView.classList.add('active', 'slide-in');
        setTimeout(() => {
          nextView.classList.remove('slide-in');
        }, 350);
        break;

      case 'reading->wechat':
        prevView.classList.add('slide-out');
        nextView.classList.add('active');
        nextView.style.display = 'flex';
        nextView.style.opacity = '1';
        setTimeout(() => {
          prevView.classList.remove('active', 'slide-out');
          prevView.style.display = 'none';
          readingContent.innerHTML = '';
          readingFooter.style.display = 'none';
        }, 300);
        break;

      case 'chatlist->homescreen':
        prevView.classList.add('slide-down-out');
        setTimeout(() => {
          prevView.classList.remove('active', 'slide-down-out');
          prevView.style.display = 'none';
          // Also hide wechat view underneath
          views.wechat.classList.remove('active');
          views.wechat.style.display = 'none';
          nextView.classList.add('active');
          nextView.style.display = 'flex';
          nextView.style.opacity = '1';
        }, 350);
        break;

      case 'wechat->homescreen':
        prevView.classList.add('slide-down-out');
        setTimeout(() => {
          prevView.classList.remove('active', 'slide-down-out');
          prevView.style.display = 'none';
          nextView.classList.add('active');
          nextView.style.display = 'flex';
          nextView.style.opacity = '1';
        }, 350);
        break;

      case 'reading->homescreen':
        prevView.classList.add('slide-down-out');
        setTimeout(() => {
          prevView.classList.remove('active', 'slide-down-out');
          prevView.style.display = 'none';
          views.wechat.classList.remove('active');
          views.wechat.style.display = 'none';
          readingContent.innerHTML = '';
          readingFooter.style.display = 'none';
          nextView.classList.add('active');
          nextView.style.display = 'flex';
          nextView.style.opacity = '1';
        }, 350);
        break;

      default:
        if (prevView) {
          prevView.classList.remove('active');
          prevView.style.display = 'none';
        }
        nextView.classList.add('active');
        nextView.style.display = 'flex';
        nextView.style.opacity = '1';
    }

    currentView = viewName;
  }

  // --- WeChat Hint after unlock ---
  async function showWechatHint() {
    const badge = document.getElementById('wechatBadge');
    const sound = document.getElementById('wechatSound');
    const h1 = document.getElementById('wechatHint1');
    const h2 = document.getElementById('wechatHint2');

    // 1. Badge + sound together immediately
    if (badge) badge.style.display = 'flex';
    if (sound) { sound.currentTime = 0; sound.play().catch(() => {}); }

    // 2. First dialogue
    await sleep(600);
    if (h1) h1.classList.add('show');

    // 3. Second dialogue
    await sleep(1800);
    if (h2) h2.classList.add('show');
  }

  // --- Events ---
  function bindEvents() {
    // Landing: only phone shape triggers pickup (not blank area)
    // landingOverlay click disabled

    // Lockscreen: tap to wake, then tap to unlock
    views.lockscreen.addEventListener('click', () => {
      if (views.lockscreen.classList.contains('screen-off')) {
        // First tap: wake up (show lock screen content)
        views.lockscreen.classList.remove('screen-off');
        statusBar.style.opacity = '1';
        playScreenOn();
      } else {
        // Second tap: unlock to homescreen
        playUnlock();
        navigateTo('homescreen');
      }
    });

    // Homescreen - App icons
    views.homescreen.addEventListener('click', (e) => {
      const icon = e.target.closest('.app-icon');
      if (!icon) return;

      if (icon.dataset.app === 'wechat') {
        playTap();
        navigateTo('chatlist');
      } else {
        // Icon shake only
        playTap();
        const img = icon.querySelector('.app-icon-img');
        if (img) {
          img.classList.add('icon-shake');
          img.addEventListener('animationend', () => img.classList.remove('icon-shake'), { once: true });
        }
      }
    });

    // WeChat: tap 小越 -> reading
    wechatXiaoyueRow.addEventListener('click', () => {
      if (selectedEpisode) {
        playTap();
        renderReading(selectedEpisode);
        navigateTo('reading');
      }
    });

    // Reading -> Back to wechat
    readingBack.addEventListener('click', () => {
      navigateTo('wechat');
    });

    // Swipe back gesture (mobile)
    let touchStartX = 0;
    let touchStartY = 0;
    views.reading.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    views.reading.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
      if (touchStartX < 30 && dx > 80 && dy < 100) {
        navigateTo('wechat');
      }
    }, { passive: true });

    // Swipe up from bottom to go home (iOS-style, touch + mouse)
    function addSwipeUpHome(viewEl, backTo) {
      let syStart = 0;
      let sxStart = 0;
      let mouseDown = false;
      const phoneScreen = document.getElementById('phoneScreen');

      // Touch
      viewEl.addEventListener('touchstart', (e) => {
        syStart = e.touches[0].clientY;
        sxStart = e.touches[0].clientX;
      }, { passive: true });
      viewEl.addEventListener('touchend', (e) => {
        const dy = syStart - e.changedTouches[0].clientY;
        const dx = Math.abs(e.changedTouches[0].clientX - sxStart);
        const rect = phoneScreen.getBoundingClientRect();
        if (syStart > rect.bottom - 60 && dy > 80 && dx < 80) {
          navigateTo(backTo);
        }
      }, { passive: true });

      // Mouse (desktop)
      viewEl.addEventListener('mousedown', (e) => {
        syStart = e.clientY;
        sxStart = e.clientX;
        mouseDown = true;
      });
      viewEl.addEventListener('mouseup', (e) => {
        if (!mouseDown) return;
        mouseDown = false;
        const dy = syStart - e.clientY;
        const dx = Math.abs(e.clientX - sxStart);
        const rect = phoneScreen.getBoundingClientRect();
        if (syStart > rect.bottom - 60 && dy > 80 && dx < 80) {
          navigateTo(backTo);
        }
      });
    }
    addSwipeUpHome(views.chatlist, 'homescreen');
    addSwipeUpHome(views.wechat, 'homescreen');
    addSwipeUpHome(views.reading, 'homescreen');
  }

  // --- Sound Effects (Web Audio API) ---
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  // 轻触音 - 短促清脆
  function playTap() {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }

  // 解锁音 - 上升滑音
  function playUnlock() {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  // 亮屏音 - 微弱敲击
  function playScreenOn() {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.03);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  }

  // 捡起手机 - 低沉的拾取音
  function playPickup() {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc2.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.3);
    osc2.frequency.setValueAtTime(300, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
    osc2.stop(ctx.currentTime + 0.4);
  }

  // 选卡确认音 - 双音阶
  function playCardSelect() {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523, ctx.currentTime);        // C5
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.08); // E5
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  // 滑动切卡音 - 轻微气流感
  function playCardSwipe() {
    const ctx = getAudioCtx();
    const bufferSize = ctx.sampleRate * 0.06;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.value = 0.03;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(ctx.currentTime);
  }

  // --- Util ---
  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // --- Go ---
  document.addEventListener('DOMContentLoaded', init);
})();
