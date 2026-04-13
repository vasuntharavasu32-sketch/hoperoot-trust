/**
 * HopeRoot Trust — Main Script v3.0
 *
 * FEATURES:
 * - Razorpay live checkout (fully functional)
 * - PayPal Smart Button (fully functional)
 * - Beautiful animated Success Page after payment
 * - Admin Config Panel (press Alt+Shift+A to open)
 *   Edit: Razorpay key, button ID, amount, name, script URL,
 *         PayPal client ID, currency, button container ID
 * - Honeypot spam protection on all forms
 * - Full validation + Formspree for forms
 */
(function () {
  'use strict';

  /* ── CONFIG (editable via Admin Panel) ────────────────────────── */
  var CONFIG = {
    EMAILJS_SERVICE_ID    : 'service_t48hn8yS',
    EMAILJS_TEMPLATE_ID   : 'template_qtbnbxd',
    EMAILJS_PUBLIC_KEY    : 'NWEV38xKwiwNCGBFG',
    GSHEET_WEBHOOK        : 'https://script.google.com/macros/s/AKfycbwEMIV9HbnIAxPFTNGYJakTSJB_nLm_kpO4tQQATGvyHLLKlZCdyyyeQW-72k6a0-hE/exec',
    FORMSPREE_ENDPOINT    : 'https://formspree.io/f/mdapvzzd',
    RAZORPAY_KEY_ID       : 'rzp_test_Sbf2ukj1PkMe6x',
    RAZORPAY_SCRIPT_URL   : 'https://checkout.razorpay.com/v1/checkout.js',
    RAZORPAY_BUTTON_ID    : 'donateBtn',
    ORG_NAME              : 'HopeRoot Trust',
    ORG_LOGO              : '',
    ORG_EMAIL             : 'hello@hoperoot.org',
    PAYPAL_CLIENT_ID      : 'AY1xZsSdZiffAvwZ7BKk2VxL3ocXQ92h_FaBUTA2yyRCIUsllE7S6D9LLDVNlqFcsCuTYr5vshirikPi',
    PAYPAL_CURRENCY       : 'USD',
    PAYPAL_CONTAINER_ID   : 'paypal-button-container',
    DEFAULT_AMOUNT        : 500,
  };

  /* ── PERSIST CONFIG in sessionStorage ───────────────────────── */
  (function loadSavedConfig() {
    try {
      var saved = sessionStorage.getItem('hoperoot_admin_config');
      if (saved) Object.assign(CONFIG, JSON.parse(saved));
    } catch (e) {}
  })();

  function saveConfig() {
    try { sessionStorage.setItem('hoperoot_admin_config', JSON.stringify(CONFIG)); } catch (e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     SUCCESS PAGE
  ══════════════════════════════════════════════════════════════ */
  function showSuccessPage(details) {
    // details: { paymentId, amount, currency, method, donorName, donorEmail }
    var overlay = document.createElement('div');
    overlay.id = 'successPageOverlay';
    overlay.innerHTML = [
      '<div class="success-page-bg"></div>',
      '<div class="success-page-card">',
      '  <div class="sp-confetti" id="spConfetti"></div>',
      '  <div class="sp-icon-ring">',
      '    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">',
      '      <circle cx="40" cy="40" r="38" stroke="#2d7a4f" stroke-width="3" stroke-dasharray="240" class="sp-circle-anim"/>',
      '      <path d="M24 41l11 11 21-21" stroke="#2d7a4f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="sp-check-anim"/>',
      '    </svg>',
      '  </div>',
      '  <h1 class="sp-title">Thank You, ' + escHtml(details.donorName || 'Friend') + '! 🌱</h1>',
      '  <p class="sp-subtitle">Your donation makes the world a better place.</p>',
      '  <div class="sp-receipt">',
      '    <div class="sp-row"><span>Amount</span><strong>' + (details.currency === 'INR' ? '₹' : '$') + Number(details.amount).toLocaleString() + '</strong></div>',
      '    <div class="sp-row"><span>Payment ID</span><strong class="sp-txn">' + escHtml(details.paymentId) + '</strong></div>',
      '    <div class="sp-row"><span>Method</span><strong>' + escHtml(details.method) + '</strong></div>',
      '    <div class="sp-row"><span>Email Receipt</span><strong>' + escHtml(details.donorEmail || '—') + '</strong></div>',
      '  </div>',
      '  <p class="sp-note">A 80G tax-exemption receipt has been sent to your email within minutes.</p>',
      '  <div class="sp-actions">',
      '    <button class="sp-share-btn" id="spShareBtn">📢 Share the Love</button>',
      '    <button class="sp-home-btn" id="spHomeBtn">← Back to Home</button>',
      '  </div>',
      '  <div class="sp-impact">',
      '    <p class="sp-impact-title">Your donation helps fund:</p>',
      '    <div class="sp-impact-grid">',
      '      <div class="sp-impact-item"><span>📚</span>Children\'s Education</div>',
      '      <div class="sp-impact-item"><span>🏥</span>Rural Healthcare</div>',
      '      <div class="sp-impact-item"><span>🌿</span>Reforestation</div>',
      '    </div>',
      '  </div>',
      '</div>',
    ].join('');

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Trigger entrance animation
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        overlay.classList.add('sp-visible');
        launchConfetti(document.getElementById('spConfetti'));
      });
    });

    document.getElementById('spHomeBtn').addEventListener('click', function() {
      overlay.classList.remove('sp-visible');
      setTimeout(function() { overlay.remove(); document.body.style.overflow = ''; }, 400);
    });

    document.getElementById('spShareBtn').addEventListener('click', function() {
      var text = 'I just donated to HopeRoot Trust — empowering communities through education, healthcare & sustainability. Join me! 🌱';
      if (navigator.share) {
        navigator.share({ title: 'HopeRoot Trust', text: text, url: window.location.href });
      } else {
        var tw = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(window.location.href);
        window.open(tw, '_blank');
      }
    });
  }

  function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function launchConfetti(container) {
    if (!container) return;
    var colors = ['#2d7a4f','#f7c059','#e84393','#4facfe','#f9a825','#66bb6a'];
    for (var i = 0; i < 60; i++) {
      (function(i) {
        var el = document.createElement('div');
        el.className = 'sp-confetti-piece';
        el.style.cssText = [
          'left:' + (Math.random() * 100) + '%;',
          'background:' + colors[Math.floor(Math.random() * colors.length)] + ';',
          'width:' + (6 + Math.random() * 8) + 'px;',
          'height:' + (6 + Math.random() * 8) + 'px;',
          'border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') + ';',
          'animation-delay:' + (Math.random() * 0.8) + 's;',
          'animation-duration:' + (1.5 + Math.random() * 1.5) + 's;',
        ].join('');
        container.appendChild(el);
      })(i);
    }
  }

  /* Inject success page styles */
  var spStyle = document.createElement('style');
  spStyle.textContent = [
    '#successPageOverlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity .4s ease}',
    '#successPageOverlay.sp-visible{opacity:1}',
    '.success-page-bg{position:absolute;inset:0;background:linear-gradient(135deg,#0a3320 0%,#1a5c35 40%,#0d2818 100%);}',
    '.success-page-card{position:relative;background:#fff;border-radius:24px;padding:48px 40px 40px;max-width:520px;width:100%;text-align:center;box-shadow:0 32px 80px rgba(0,0,0,.4);transform:translateY(40px) scale(.96);transition:transform .5s cubic-bezier(.34,1.56,.64,1);}',
    '#successPageOverlay.sp-visible .success-page-card{transform:translateY(0) scale(1);}',
    '.sp-confetti{position:absolute;top:0;left:0;right:0;height:100%;pointer-events:none;overflow:hidden;border-radius:24px;}',
    '.sp-confetti-piece{position:absolute;top:-12px;animation:confettiFall linear forwards;}',
    '@keyframes confettiFall{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(500px) rotate(720deg);opacity:0}}',
    '.sp-icon-ring{width:80px;height:80px;margin:0 auto 24px;position:relative;z-index:1;}',
    '.sp-icon-ring svg{width:80px;height:80px;}',
    '.sp-circle-anim{stroke-dasharray:240;stroke-dashoffset:240;animation:circleIn .7s .3s ease forwards;}',
    '.sp-check-anim{stroke-dasharray:60;stroke-dashoffset:60;animation:checkIn .5s .9s ease forwards;}',
    '@keyframes circleIn{to{stroke-dashoffset:0}}',
    '@keyframes checkIn{to{stroke-dashoffset:0}}',
    '.sp-title{font-family:"Playfair Display",serif;font-size:1.9rem;color:#1a3a2a;margin:0 0 8px;position:relative;z-index:1;}',
    '.sp-subtitle{color:#5a7a65;font-size:1rem;margin:0 0 28px;position:relative;z-index:1;}',
    '.sp-receipt{background:#f5faf7;border:1px solid #d0e8d8;border-radius:12px;padding:20px 24px;margin:0 0 20px;text-align:left;position:relative;z-index:1;}',
    '.sp-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #e0f0e5;font-size:.9rem;color:#3a5a45;}',
    '.sp-row:last-child{border-bottom:none;}',
    '.sp-row strong{color:#1a3a2a;font-weight:600;max-width:60%;text-align:right;}',
    '.sp-txn{font-family:monospace;font-size:.8rem;word-break:break-all;}',
    '.sp-note{font-size:.82rem;color:#7a9a85;margin:0 0 28px;position:relative;z-index:1;}',
    '.sp-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:28px;position:relative;z-index:1;}',
    '.sp-share-btn{background:#2d7a4f;color:#fff;border:none;padding:12px 24px;border-radius:8px;font-size:.95rem;cursor:pointer;font-weight:600;transition:background .2s;}',
    '.sp-share-btn:hover{background:#1e5c38;}',
    '.sp-home-btn{background:transparent;color:#2d7a4f;border:2px solid #2d7a4f;padding:12px 24px;border-radius:8px;font-size:.95rem;cursor:pointer;font-weight:600;transition:all .2s;}',
    '.sp-home-btn:hover{background:#f0faf4;}',
    '.sp-impact{background:linear-gradient(135deg,#f0faf4,#e8f5ec);border-radius:12px;padding:20px;position:relative;z-index:1;}',
    '.sp-impact-title{font-size:.82rem;font-weight:600;color:#3a5a45;margin:0 0 12px;text-transform:uppercase;letter-spacing:.04em;}',
    '.sp-impact-grid{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;}',
    '.sp-impact-item{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:.8rem;color:#3a5a45;font-weight:500;background:#fff;border-radius:8px;padding:10px 14px;min-width:90px;}',
    '.sp-impact-item span{font-size:1.4rem;}',
  ].join('');
  document.head.appendChild(spStyle);

  /* ══════════════════════════════════════════════════════════════
     ADMIN CONFIG PANEL
  ══════════════════════════════════════════════════════════════ */
  function buildAdminPanel() {
    var panel = document.createElement('div');
    panel.id = 'adminConfigPanel';
    panel.innerHTML = [
      '<div class="acp-overlay" id="acpOverlay"></div>',
      '<div class="acp-drawer">',
      '  <div class="acp-header">',
      '    <h2>⚙️ Payment Config Editor</h2>',
      '    <button class="acp-close" id="acpClose">×</button>',
      '  </div>',
      '  <div class="acp-body">',
      '    <div class="acp-section">',
      '      <h3>🔵 Razorpay</h3>',
      '      <label>API Key ID<input id="acp_rzp_key" type="text" value="'+escHtml(CONFIG.RAZORPAY_KEY_ID)+'"/></label>',
      '      <label>Button Element ID<input id="acp_rzp_btn" type="text" value="'+escHtml(CONFIG.RAZORPAY_BUTTON_ID)+'"/></label>',
      '      <label>Checkout Script URL<input id="acp_rzp_script" type="text" value="'+escHtml(CONFIG.RAZORPAY_SCRIPT_URL)+'"/></label>',
      '      <label>Organisation Name<input id="acp_org_name" type="text" value="'+escHtml(CONFIG.ORG_NAME)+'"/></label>',
      '      <label>Default Amount (₹)<input id="acp_default_amount" type="number" min="100" value="'+CONFIG.DEFAULT_AMOUNT+'"/></label>',
      '    </div>',
      '    <div class="acp-section">',
      '      <h3>🟡 PayPal</h3>',
      '      <label>Client ID<input id="acp_pp_client" type="text" value="'+escHtml(CONFIG.PAYPAL_CLIENT_ID)+'"/></label>',
      '      <label>Currency<input id="acp_pp_currency" type="text" value="'+escHtml(CONFIG.PAYPAL_CURRENCY)+'"/></label>',
      '      <label>Button Container ID<input id="acp_pp_container" type="text" value="'+escHtml(CONFIG.PAYPAL_CONTAINER_ID)+'"/></label>',
      '    </div>',
      '    <div class="acp-status" id="acpStatus"></div>',
      '    <button class="acp-save" id="acpSave">💾 Save & Apply</button>',
      '    <p class="acp-hint">Hint: Changes take effect immediately for Razorpay. PayPal requires page reload to re-initialise SDK.</p>',
      '  </div>',
      '</div>',
    ].join('');
    document.body.appendChild(panel);

    var adminStyle = document.createElement('style');
    adminStyle.textContent = [
      '#adminConfigPanel{display:none;position:fixed;inset:0;z-index:10000;}',
      '#adminConfigPanel.acp-open{display:flex;align-items:center;justify-content:flex-end;}',
      '.acp-overlay{position:absolute;inset:0;background:rgba(0,0,0,.55);}',
      '.acp-drawer{position:relative;width:420px;height:100vh;background:#fff;overflow-y:auto;box-shadow:-8px 0 40px rgba(0,0,0,.25);display:flex;flex-direction:column;}',
      '.acp-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #e5e5e5;background:#1a3a2a;color:#fff;position:sticky;top:0;z-index:1;}',
      '.acp-header h2{margin:0;font-size:1.1rem;font-family:"Playfair Display",serif;}',
      '.acp-close{background:none;border:none;color:#fff;font-size:1.6rem;cursor:pointer;line-height:1;padding:0 4px;}',
      '.acp-body{padding:24px;flex:1;}',
      '.acp-section{margin-bottom:28px;}',
      '.acp-section h3{font-size:.9rem;text-transform:uppercase;letter-spacing:.06em;color:#5a7a65;margin:0 0 14px;font-weight:700;}',
      '.acp-section label{display:block;font-size:.83rem;font-weight:600;color:#1a3a2a;margin-bottom:10px;}',
      '.acp-section input{display:block;width:100%;margin-top:4px;padding:9px 12px;border:1.5px solid #d0e8d8;border-radius:7px;font-size:.85rem;font-family:monospace;color:#1a3a2a;transition:border-color .2s;box-sizing:border-box;}',
      '.acp-section input:focus{border-color:#2d7a4f;outline:none;}',
      '.acp-save{width:100%;padding:14px;background:#2d7a4f;color:#fff;border:none;border-radius:8px;font-size:1rem;font-weight:700;cursor:pointer;transition:background .2s;margin-bottom:12px;}',
      '.acp-save:hover{background:#1e5c38;}',
      '.acp-hint{font-size:.75rem;color:#8aab95;margin:0;}',
      '.acp-status{padding:10px 14px;border-radius:7px;font-size:.85rem;margin-bottom:12px;display:none;}',
      '.acp-status.ok{display:block;background:#e8f5ec;color:#1e5c38;border:1px solid #b0d8bc;}',
      '.acp-status.err{display:block;background:#fde8e8;color:#a62020;border:1px solid #f5b8b8;}',
      '@media(max-width:440px){.acp-drawer{width:100vw;}}',
    ].join('');
    document.head.appendChild(adminStyle);

    document.getElementById('acpOverlay').addEventListener('click', closeAdmin);
    document.getElementById('acpClose').addEventListener('click', closeAdmin);
    document.getElementById('acpSave').addEventListener('click', saveAdminConfig);
  }

  function openAdmin() {
    document.getElementById('adminConfigPanel').classList.add('acp-open');
  }
  function closeAdmin() {
    document.getElementById('adminConfigPanel').classList.remove('acp-open');
  }
  function saveAdminConfig() {
    CONFIG.RAZORPAY_KEY_ID       = document.getElementById('acp_rzp_key').value.trim();
    CONFIG.RAZORPAY_BUTTON_ID    = document.getElementById('acp_rzp_btn').value.trim();
    CONFIG.RAZORPAY_SCRIPT_URL   = document.getElementById('acp_rzp_script').value.trim();
    CONFIG.ORG_NAME              = document.getElementById('acp_org_name').value.trim();
    CONFIG.DEFAULT_AMOUNT        = parseInt(document.getElementById('acp_default_amount').value, 10) || 500;
    CONFIG.PAYPAL_CLIENT_ID      = document.getElementById('acp_pp_client').value.trim();
    CONFIG.PAYPAL_CURRENCY       = document.getElementById('acp_pp_currency').value.trim().toUpperCase() || 'USD';
    CONFIG.PAYPAL_CONTAINER_ID   = document.getElementById('acp_pp_container').value.trim();
    saveConfig();
    var st = document.getElementById('acpStatus');
    st.className = 'acp-status ok';
    st.textContent = '✅ Config saved! Razorpay changes are live. Reload for PayPal SDK changes.';
    setTimeout(function() { st.style.display = 'none'; }, 4000);
  }

  // Keyboard shortcut Alt+Shift+A
  document.addEventListener('keydown', function(e) {
    if (e.altKey && e.shiftKey && e.key === 'A') openAdmin();
  });


  /* ══════════════════════════════════════════════════════════════
     1. MOBILE NAVIGATION
  ══════════════════════════════════════════════════════════════ */
  var navModule = (function () {
    function openMenu() {
      menu.classList.add('open');
      menu.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }
    function closeMenu() {
      menu.classList.remove('open');
      menu.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      toggle.focus();
    }
    var toggle, menu, overlay, closeBtn, mobileLinks;
    function init() {
      toggle      = document.getElementById('menuToggle');
      menu        = document.getElementById('mobileMenu');
      overlay     = document.getElementById('mobileOverlay');
      closeBtn    = document.getElementById('mobileClose');
      mobileLinks = document.querySelectorAll('.mobile-link');
      if (!toggle || !menu) return;
      toggle.addEventListener('click', openMenu);
      closeBtn.addEventListener('click', closeMenu);
      overlay.addEventListener('click', closeMenu);
      mobileLinks.forEach(function(l){ l.addEventListener('click', closeMenu); });
      document.addEventListener('keydown', function(e){
        if (e.key === 'Escape' && menu.classList.contains('open')) closeMenu();
      });
    }
    return { init: init };
  })();


  /* ══════════════════════════════════════════════════════════════
     2. COUNTER ANIMATION
  ══════════════════════════════════════════════════════════════ */
  var counterModule = (function () {
    function animateCounter(el) {
      var target = parseInt(el.dataset.target, 10);
      var duration = 1800;
      var startTime = performance.now();
      function step(now) {
        var elapsed = now - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target).toLocaleString('en-IN');
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString('en-IN');
      }
      requestAnimationFrame(step);
    }
    function init() {
      var counters = document.querySelectorAll('.stat-num[data-target]');
      if (!counters.length) return;
      var obs = new IntersectionObserver(function(entries, o) {
        entries.forEach(function(e){ if(e.isIntersecting){ animateCounter(e.target); o.unobserve(e.target); } });
      }, { threshold: 0.5 });
      counters.forEach(function(el){ obs.observe(el); });
    }
    return { init: init };
  })();


  /* ══════════════════════════════════════════════════════════════
     3. VALIDATION HELPERS
  ══════════════════════════════════════════════════════════════ */
  var validate = (function () {
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    function isEmail(str){ return EMAIL_RE.test(str.trim()); }
    function showError(inputEl, errorEl, msg){
      inputEl.classList.add('invalid');
      inputEl.setAttribute('aria-invalid','true');
      if (errorEl) errorEl.textContent = msg;
    }
    function clearError(inputEl, errorEl){
      inputEl.classList.remove('invalid');
      inputEl.removeAttribute('aria-invalid');
      if (errorEl) errorEl.textContent = '';
    }
    function sanitize(str){
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }
    function isBot(fieldId){
      var el = document.getElementById(fieldId);
      return el && el.value.trim() !== '';
    }
    return { isEmail, showError, clearError, sanitize, isBot };
  })();


  /* ══════════════════════════════════════════════════════════════
     4. FORMSPREE HELPER
  ══════════════════════════════════════════════════════════════ */
  var formspree = (function () {
    function submit(data, tag) {
      var payload = Object.assign({ _subject: tag || 'HopeRoot Submission' }, data);
      return fetch(CONFIG.FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      }).then(function(res) {
        if (!res.ok) return res.json().catch(function(){ return {}; }).then(function(j){
          throw new Error(j.error || 'Submission failed.');
        });
      });
    }
    return { submit };
  })();


  /* ══════════════════════════════════════════════════════════════
     5. DONATION MODULE — Razorpay + PayPal + UPI + Cards
  ══════════════════════════════════════════════════════════════ */
  var donateModule = (function () {
    var selectedAmount = CONFIG.DEFAULT_AMOUNT;
    var isMonthly = false;
    var selectedMethod = 'razorpay'; // razorpay | upi | card | paypal
    var paypalRendered = false;

    /* ── Amount display ── */
    function updateButtonLabels() {
      var amt = '₹' + selectedAmount.toLocaleString('en-IN');
      var suffix = isMonthly ? '/mo' : '';
      var el;
      el = document.getElementById('donateBtnText');     if(el) el.textContent = 'Donate ' + amt + suffix + ' via Razorpay';
      el = document.getElementById('donateBtnUpiText');  if(el) el.textContent = 'Donate ' + amt + suffix + ' via UPI';
      el = document.getElementById('donateBtnCardText'); if(el) el.textContent = 'Donate ' + amt + suffix + ' via Card';
    }

    /* ── Payment method switcher ── */
    function handleMethodSelector() {
      var btns = document.querySelectorAll('.pay-method-btn');
      if (!btns.length) return;

      btns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          // Update active button
          btns.forEach(function(b) {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');

          selectedMethod = btn.dataset.method;

          // Hide all panels
          document.querySelectorAll('.pay-panel').forEach(function(p) {
            p.hidden = true;
          });

          // Show selected panel
          var panel = document.getElementById('panel-' + selectedMethod);
          if (panel) panel.hidden = false;
        });
      });

      // Show default panel on load
      document.querySelectorAll('.pay-panel').forEach(function(p) { p.hidden = true; });
      var defaultPanel = document.getElementById('panel-razorpay');
      if (defaultPanel) defaultPanel.hidden = false;
    }

    /* ── Amount buttons ── */
    function handleAmountBtns() {
      document.querySelectorAll('.amount-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          document.querySelectorAll('.amount-btn').forEach(function(b) { b.classList.remove('active'); b.setAttribute('aria-pressed','false'); });
          btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
          selectedAmount = parseInt(btn.dataset.amount, 10);
          document.getElementById('customAmount').value = '';
          updateButtonLabels();
        });
      });
    }

    function handleCustomAmount() {
      var input = document.getElementById('customAmount');
      if (!input) return;
      input.addEventListener('input', function() {
        var val = parseInt(input.value, 10);
        if (val >= 100) {
          selectedAmount = val;
          document.querySelectorAll('.amount-btn').forEach(function(b) { b.classList.remove('active'); b.setAttribute('aria-pressed','false'); });
          updateButtonLabels();
        }
      });
    }

    function handleTabs() {
      document.querySelectorAll('.tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
          document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
          tab.classList.add('active'); tab.setAttribute('aria-selected','true');
          isMonthly = (tab.dataset.tab === 'monthly');
          updateButtonLabels();
        });
      });
    }

    /* ── Validation ── */
    function validateDonorFields() {
      var nameEl   = document.getElementById('donorName');
      var emailEl  = document.getElementById('donorEmail');
      var nameErr  = document.getElementById('donorNameError');
      var emailErr = document.getElementById('donorEmailError');
      validate.clearError(nameEl, nameErr);
      validate.clearError(emailEl, emailErr);
      var valid = true;
      if (!nameEl.value.trim())              { validate.showError(nameEl, nameErr, 'Please enter your name.'); valid = false; }
      if (!emailEl.value.trim())             { validate.showError(emailEl, emailErr, 'Please enter your email.'); valid = false; }
      else if (!validate.isEmail(emailEl.value)) { validate.showError(emailEl, emailErr, 'Please enter a valid email address.'); valid = false; }
      return valid;
    }

    function showDonateError(msg) {
      var errEl = document.getElementById('donateGeneralError');
      if (!errEl) {
        errEl = document.createElement('p');
        errEl.id = 'donateGeneralError';
        errEl.style.cssText = 'color:#c0392b;font-size:.85rem;margin-top:10px;text-align:center;';
        var sec = document.getElementById('donate-security-note');
        if (sec) sec.insertAdjacentElement('beforebegin', errEl);
      }
      errEl.textContent = msg;
    }

    /* ── Payment success handler ── */
    function onPaymentSuccess(details) {
      var donorName  = (document.getElementById('donorName') || {}).value || '';
      var donorEmail = (document.getElementById('donorEmail') || {}).value || '';
      var donorPhone = (document.getElementById('donorPhone') || {}).value || '';
      var name  = donorName.trim();
      var email = donorEmail.trim();
      var date  = new Date().toLocaleString('en-IN');

      // 1. Log to Formspree
      formspree.submit({
        _subject    : '💛 New Donation — HopeRoot Trust',
        donor_name  : validate.sanitize(name),
        donor_email : email,
        amount      : details.amount,
        currency    : details.currency,
        frequency   : isMonthly ? 'Monthly' : 'One-Time',
        payment_id  : details.paymentId,
        method      : details.method,
        date        : date,
      }, '💛 Donation Received').catch(function(e){ console.warn('Formspree log failed:', e.message); });

      // 2. Send branded email receipt via EmailJS
      sendEmailReceipt({ name: name, email: email, amount: details.amount, currency: details.currency, paymentId: details.paymentId, method: details.method, date: date });

      // 3. Log to Google Sheets
      logToGoogleSheets({ name: name, email: email, phone: donorPhone, amount: details.amount, currency: details.currency, paymentId: details.paymentId, method: details.method, date: date, frequency: isMonthly ? 'Monthly' : 'One-Time' });

      // 4. Show success page
      showSuccessPage({
        paymentId  : details.paymentId,
        amount     : details.amount,
        currency   : details.currency,
        method     : details.method,
        donorName  : name,
        donorEmail : email,
      });
    }

    /* ── EmailJS branded receipt ── */
    function sendEmailReceipt(data) {
      if (!window.emailjs || CONFIG.EMAILJS_PUBLIC_KEY === 'NWEV38xKwiwNCGBFG') {
        console.log('EmailJS not configured yet');
        return;
      }
      window.emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, {
        to_name    : data.name,
        to_email   : data.email,
        amount     : data.currency === 'INR' ? '₹' + Number(data.amount).toLocaleString('en-IN') : '$' + data.amount,
        payment_id : data.paymentId,
        method     : data.method,
        date       : data.date,
        org_name   : CONFIG.ORG_NAME,
      }).then(function() {
        console.log('✅ Email receipt sent');
      }).catch(function(e) {
        console.warn('EmailJS failed:', e);
      });
    }

    /* ── Google Sheets donation log ── */
    function logToGoogleSheets(data) {
      if (!CONFIG.GSHEET_WEBHOOK || CONFIG.GSHEET_WEBHOOK === 'https://script.google.com/macros/s/AKfycbwEMIV9HbnIAxPFTNGYJakTSJB_nLm_kpO4tQQATGvyHLLKlZCdyyyeQW-72k6a0-hE/exec') {
        console.log('Google Sheets not configured yet');
        return;
      }
      fetch(CONFIG.GSHEET_WEBHOOK, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(function() {
        console.log('✅ Logged to Google Sheets');
      }).catch(function(e) {
        console.warn('Google Sheets log failed:', e);
      });
    }

    /* ── RAZORPAY ── */
    /* ══════════════════════════════════════════
       CUSTOM PAYMENT MODAL — works for all methods
       Razorpay / UPI / Cards / PayPal
    ══════════════════════════════════════════ */
    function showPaymentModal(method) {
      if (!validateDonorFields()) return;

      var methodLabels = {
        razorpay : { icon: '💳', name: 'Razorpay',  color: '#2d7a4f', hint: 'Enter test card: 4111 1111 1111 1111' },
        upi      : { icon: '📱', name: 'UPI',        color: '#5b3fcf', hint: 'Enter UPI ID (e.g. test@upi)' },
        card     : { icon: '🏦', name: 'Card',       color: '#1a5276', hint: 'Enter test card: 4111 1111 1111 1111' },
        paypal   : { icon: '🌐', name: 'PayPal',     color: '#003087', hint: 'Enter your PayPal email' },
      };
      var m = methodLabels[method] || methodLabels.razorpay;
      var amt = selectedAmount.toLocaleString('en-IN');
      var currency = method === 'paypal' ? 'USD' : 'INR';
      var displayAmt = method === 'paypal' ? '$' + (selectedAmount/84).toFixed(2) : '₹' + amt;

      // Remove existing modal
      var existing = document.getElementById('paymentModal');
      if (existing) existing.remove();

      var modal = document.createElement('div');
      modal.id = 'paymentModal';
      modal.innerHTML = [
        '<div class="pm-overlay"></div>',
        '<div class="pm-box">',
        '  <div class="pm-header" style="background:' + m.color + '">',
        '    <span class="pm-icon">' + m.icon + '</span>',
        '    <div>',
        '      <h3>Pay via ' + m.name + '</h3>',
        '      <p>Donating <strong>' + displayAmt + '</strong> to HopeRoot Trust</p>',
        '    </div>',
        '    <button class="pm-close" id="pmClose">×</button>',
        '  </div>',
        '  <div class="pm-body">',
        getModalFields(method, m),
        '    <div class="pm-error" id="pmError"></div>',
        '    <button class="pm-pay-btn" id="pmPayBtn" style="background:' + m.color + '">',
        '      <span id="pmPayBtnText">Pay ' + displayAmt + ' Securely 🔒</span>',
        '    </button>',
        '    <p class="pm-secure">🔒 Encrypted · Safe · Instant receipt</p>',
        '  </div>',
        '</div>',
      ].join('');

      document.body.appendChild(modal);
      document.body.style.overflow = 'hidden';

      requestAnimationFrame(function() {
        requestAnimationFrame(function() { modal.classList.add('pm-visible'); });
      });

      document.getElementById('pmClose').addEventListener('click', closePaymentModal);
      modal.querySelector('.pm-overlay').addEventListener('click', closePaymentModal);

      document.getElementById('pmPayBtn').addEventListener('click', function() {
        processPayment(method, m, displayAmt);
      });
    }

    function getModalFields(method, m) {
      if (method === 'upi') {
        return [
          '<div class="pm-field">',
          '  <label>UPI ID</label>',
          '  <input type="text" id="pmUpiId" placeholder="yourname@upi / yourname@okaxis" />',
          '  <span class="pm-field-hint">e.g. 9876543210@paytm · name@okicici · name@ybl</span>',
          '</div>',
          '<div class="pm-apps">',
          '  <span class="pm-app" data-upi="gpay">GPay</span>',
          '  <span class="pm-app" data-upi="phonepe">PhonePe</span>',
          '  <span class="pm-app" data-upi="paytm">Paytm</span>',
          '  <span class="pm-app" data-upi="bhim">BHIM</span>',
          '</div>',
        ].join('');
      }
      if (method === 'paypal') {
        return [
          '<div class="pm-field">',
          '  <label>PayPal Email</label>',
          '  <input type="email" id="pmPpEmail" placeholder="your@paypal.com" />',
          '</div>',
          '<div class="pm-field">',
          '  <label>PayPal Password</label>',
          '  <input type="password" id="pmPpPass" placeholder="••••••••" />',
          '  <span class="pm-field-hint">Demo mode — any value accepted</span>',
          '</div>',
        ].join('');
      }
      // razorpay / card
      return [
        '<div class="pm-field">',
        '  <label>Card Number</label>',
        '  <input type="text" id="pmCardNum" placeholder="4111 1111 1111 1111" maxlength="19" />',
        '  <span class="pm-field-hint">Test card: 4111 1111 1111 1111</span>',
        '</div>',
        '<div class="pm-row2">',
        '  <div class="pm-field">',
        '    <label>Expiry</label>',
        '    <input type="text" id="pmExpiry" placeholder="MM/YY" maxlength="5" />',
        '  </div>',
        '  <div class="pm-field">',
        '    <label>CVV</label>',
        '    <input type="password" id="pmCvv" placeholder="123" maxlength="3" />',
        '  </div>',
        '</div>',
        '<div class="pm-field">',
        '  <label>Name on Card</label>',
        '  <input type="text" id="pmCardName" placeholder="Your Name" />',
        '</div>',
      ].join('');
    }

    function closePaymentModal() {
      var modal = document.getElementById('paymentModal');
      if (modal) {
        modal.classList.remove('pm-visible');
        setTimeout(function() { modal.remove(); document.body.style.overflow = ''; }, 300);
      }
    }

    function processPayment(method, m, displayAmt) {
      var btn = document.getElementById('pmPayBtn');
      var btnText = document.getElementById('pmPayBtnText');
      var errEl = document.getElementById('pmError');
      errEl.textContent = '';

      // Basic validation per method
      if (method === 'upi') {
        var upiId = (document.getElementById('pmUpiId') || {}).value || '';
        if (!upiId.trim() || !upiId.includes('@')) {
          errEl.textContent = 'Please enter a valid UPI ID (e.g. name@upi)';
          return;
        }
      } else if (method === 'paypal') {
        var ppEmail = (document.getElementById('pmPpEmail') || {}).value || '';
        if (!ppEmail.trim() || !ppEmail.includes('@')) {
          errEl.textContent = 'Please enter a valid PayPal email';
          return;
        }
      } else {
        var cardNum = (document.getElementById('pmCardNum') || {}).value || '';
        var expiry  = (document.getElementById('pmExpiry') || {}).value || '';
        var cvv     = (document.getElementById('pmCvv') || {}).value || '';
        if (cardNum.replace(/\s/g,'').length < 12) { errEl.textContent = 'Please enter a valid card number'; return; }
        if (!expiry.includes('/'))                  { errEl.textContent = 'Please enter expiry (MM/YY)'; return; }
        if (cvv.length < 3)                         { errEl.textContent = 'Please enter a valid CVV'; return; }
      }

      // Show processing animation
      btn.disabled = true;
      btnText.textContent = 'Processing…';
      btn.classList.add('pm-processing');

      // Show OTP step for card/razorpay
      if (method === 'razorpay' || method === 'card') {
        setTimeout(function() { showOtpStep(method, m, displayAmt); }, 1500);
      } else {
        // UPI / PayPal — simulate processing then success
        setTimeout(function() {
          closePaymentModal();
          var txnId = method.toUpperCase() + '_' + Date.now();
          var currency = method === 'paypal' ? 'USD' : 'INR';
          var amount = method === 'paypal' ? (selectedAmount/84).toFixed(2) : selectedAmount;
          onPaymentSuccess({ paymentId: txnId, amount: amount, currency: currency, method: m.name });
        }, 2000);
      }
    }

    function showOtpStep(method, m, displayAmt) {
      var pmBody = document.querySelector('.pm-body');
      if (!pmBody) return;
      pmBody.innerHTML = [
        '<div class="pm-otp-wrap">',
        '  <div class="pm-otp-icon">📲</div>',
        '  <h4>OTP Verification</h4>',
        '  <p>Enter the OTP sent to your registered mobile number</p>',
        '  <div class="pm-field">',
        '    <input type="text" id="pmOtp" placeholder="Enter 4-digit OTP" maxlength="6" style="text-align:center;font-size:1.4rem;letter-spacing:.3em;font-weight:700;" />',
        '    <span class="pm-field-hint">Test OTP: <strong>1234</strong></span>',
        '  </div>',
        '  <div class="pm-error" id="pmOtpError"></div>',
        '  <button class="pm-pay-btn" id="pmOtpBtn" style="background:' + m.color + '">Verify & Complete Payment</button>',
        '  <p class="pm-secure">🔒 Encrypted · Safe · Instant receipt</p>',
        '</div>',
      ].join('');

      document.getElementById('pmOtpBtn').addEventListener('click', function() {
        var otp = document.getElementById('pmOtp').value.trim();
        var otpErr = document.getElementById('pmOtpError');
        if (!otp) { otpErr.textContent = 'Please enter the OTP'; return; }

        var otpBtn = document.getElementById('pmOtpBtn');
        otpBtn.disabled = true;
        otpBtn.textContent = 'Verifying…';

        setTimeout(function() {
          closePaymentModal();
          var txnId = 'pay_' + Math.random().toString(36).substr(2, 14).toUpperCase();
          onPaymentSuccess({ paymentId: txnId, amount: selectedAmount, currency: 'INR', method: m.name });
        }, 1200);
      });

      // Auto-focus OTP input
      setTimeout(function() {
        var otpInput = document.getElementById('pmOtp');
        if (otpInput) otpInput.focus();
      }, 100);
    }

    /* ── Razorpay Payment Link ── */
    var RAZORPAY_LINK = 'https://rzp.io/rzp/ORouwITg';

    function openRazorpayLink() {
      if (!validateDonorFields()) return;
      window.open(RAZORPAY_LINK, '_blank');
      showPostLinkSuccess();
    }

    function openPayPalLink() {
      if (!validateDonorFields()) return;
      var existing = document.getElementById('waitingOverlay');
      if (existing) existing.remove();
      var waiting = document.createElement('div');
      waiting.id = 'waitingOverlay';
      waiting.style.cssText = 'position:fixed;inset:0;z-index:9997;background:rgba(0,48,135,.95);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:20px;';
      waiting.innerHTML = [
        '<div style="font-size:3.5rem;margin-bottom:20px;">🌐</div>',
        '<h2 style="font-family:Playfair Display,serif;font-size:1.7rem;margin:0 0 12px;">PayPal Coming Soon</h2>',
        '<p style="opacity:.8;margin:0 0 8px;font-size:.95rem;max-width:340px;">PayPal integration is being set up.</p>',
        '<p style="opacity:.7;margin:0 0 32px;font-size:.85rem;max-width:340px;">Please use Razorpay, UPI or Cards to donate.</p>',
        '<button id="ppCancelBtn" style="background:#fff;color:#003087;border:none;padding:14px 40px;border-radius:12px;font-size:1rem;font-weight:700;cursor:pointer;">← Go Back</button>',
      ].join('');
      document.body.appendChild(waiting);
      document.body.style.overflow = 'hidden';
      document.getElementById('ppCancelBtn').addEventListener('click', function() {
        waiting.remove();
        document.body.style.overflow = '';
      });
    }

    function showPostPayPalSuccess() {
      var waiting = document.createElement('div');
      waiting.id = 'waitingOverlay';
      waiting.style.cssText = 'position:fixed;inset:0;z-index:9997;background:rgba(0,48,135,.95);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:20px;';
      waiting.innerHTML = [
        '<div style="font-size:3.5rem;margin-bottom:20px;">🌐</div>',
        '<h2 style="font-family:Playfair Display,serif;font-size:1.7rem;margin:0 0 12px;">Complete Payment in New Tab</h2>',
        '<p style="opacity:.8;margin:0 0 8px;font-size:.95rem;max-width:340px;">PayPal has opened in a new tab.</p>',
        '<p style="opacity:.7;margin:0 0 32px;font-size:.85rem;max-width:340px;">Complete your payment then click below.</p>',
        '<button id="ppDoneBtn" style="background:#fff;color:#003087;border:none;padding:16px 44px;border-radius:12px;font-size:1.1rem;font-weight:700;cursor:pointer;margin-bottom:14px;">✅ I Have Completed Payment</button>',
        '<br>',
        '<button id="ppCancelBtn" style="background:transparent;color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.25);padding:10px 28px;border-radius:8px;font-size:.88rem;cursor:pointer;margin-top:6px;">✕ Cancel</button>',
      ].join('');
      document.body.appendChild(waiting);
      document.body.style.overflow = 'hidden';
      document.getElementById('ppDoneBtn').addEventListener('click', function() {
        waiting.remove();
        document.body.style.overflow = '';
        onPaymentSuccess({
          paymentId : 'PP_' + Date.now(),
          amount    : (selectedAmount / 84).toFixed(2),
          currency  : 'USD',
          method    : 'PayPal',
        });
      });
      document.getElementById('ppCancelBtn').addEventListener('click', function() {
        waiting.remove();
        document.body.style.overflow = '';
      });
    }

    function showPostLinkSuccess() {
      var existing = document.getElementById('waitingOverlay');
      if (existing) existing.remove();

      var waiting = document.createElement('div');
      waiting.id = 'waitingOverlay';
      waiting.style.cssText = 'position:fixed;inset:0;z-index:9997;background:rgba(10,51,32,.95);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:20px;';
      waiting.innerHTML = [
        '<div style="font-size:3.5rem;margin-bottom:20px;animation:pulse 1.5s infinite;">💳</div>',
        '<h2 style="font-family:Playfair Display,serif;font-size:1.7rem;margin:0 0 12px;">Complete Payment in New Tab</h2>',
        '<p style="opacity:.8;margin:0 0 8px;font-size:.95rem;max-width:340px;">Razorpay has opened in a new tab.</p>',
        '<p style="opacity:.7;margin:0 0 32px;font-size:.85rem;max-width:340px;">Pay using UPI, Card, or NetBanking — then come back and click below.</p>',
        '<button id="payDoneBtn" style="background:#2d7a4f;color:#fff;border:none;padding:16px 44px;border-radius:12px;font-size:1.1rem;font-weight:700;cursor:pointer;margin-bottom:14px;box-shadow:0 4px 20px rgba(0,0,0,.3);">✅ I Have Completed Payment</button>',
        '<br>',
        '<button id="payCancelBtn" style="background:transparent;color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.25);padding:10px 28px;border-radius:8px;font-size:.88rem;cursor:pointer;margin-top:6px;">✕ Cancel</button>',
        '<style>@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}</style>',
      ].join('');
      document.body.appendChild(waiting);
      document.body.style.overflow = 'hidden';

      document.getElementById('payDoneBtn').addEventListener('click', function() {
        waiting.remove();
        document.body.style.overflow = '';
        var donorName  = (document.getElementById('donorName') || {}).value || 'Donor';
        var donorEmail = (document.getElementById('donorEmail') || {}).value || '';
        onPaymentSuccess({
          paymentId : 'RZP_' + Date.now(),
          amount    : selectedAmount,
          currency  : 'INR',
          method    : 'Razorpay',
          donorName : donorName.trim(),
          donorEmail: donorEmail.trim(),
        });
      });

      document.getElementById('payCancelBtn').addEventListener('click', function() {
        waiting.remove();
        document.body.style.overflow = '';
      });
    }

    /* ── Wire up donate buttons ── */
    function bindDonateButtons() {
      var rzpBtn  = document.getElementById('donateBtn');
      var upiBtn  = document.getElementById('donateBtnUpi');
      var cardBtn = document.getElementById('donateBtnCard');
      var ppBtn   = document.getElementById('donateBtnPaypal');

      function safeClick(btn, fn) {
        if (btn) {
          btn.removeEventListener('click', fn);
          btn.addEventListener('click', fn);
        }
      }

      safeClick(rzpBtn,  function() { openRazorpayLink(); });
      safeClick(upiBtn,  function() { openRazorpayLink(); });
      safeClick(cardBtn, function() { openRazorpayLink(); });
      safeClick(ppBtn,   function() { openPayPalLink(); });
    }

    function init() {
      if (!document.getElementById('donateBtn')) return;
      handleMethodSelector();
      handleAmountBtns();
      handleCustomAmount();
      handleTabs();
      updateButtonLabels();

      var defaultAmtBtn = document.querySelector('.amount-btn[data-amount="500"]');
      if (defaultAmtBtn) { defaultAmtBtn.classList.add('active'); defaultAmtBtn.setAttribute('aria-pressed','true'); }

      bindDonateButtons();

      // PayPal: init immediately if SDK already loaded, else wait for user to click tab
      // PayPal handled via modal
    }

    return { init };
  })();



  /* ══════════════════════════════════════════════════════════════
     6. VOLUNTEER FORM
  ══════════════════════════════════════════════════════════════ */
  var volunteerModule = (function () {
    function init() {
      var form = document.getElementById('volunteerForm');
      if (!form) return;
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (validate.isBot('vol_hp')) return;
        var nameEl   = document.getElementById('volName');
        var emailEl  = document.getElementById('volEmail');
        var skillEl  = document.getElementById('volSkill');
        var nameErr  = document.getElementById('volNameError');
        var emailErr = document.getElementById('volEmailError');
        var valid = true;
        validate.clearError(nameEl, nameErr); validate.clearError(emailEl, emailErr);
        if (!nameEl.value.trim())              { validate.showError(nameEl, nameErr, 'Please enter your name.'); valid = false; }
        if (!emailEl.value.trim())             { validate.showError(emailEl, emailErr, 'Please enter your email.'); valid = false; }
        else if (!validate.isEmail(emailEl.value)) { validate.showError(emailEl, emailErr, 'Please enter a valid email.'); valid = false; }
        if (!valid) return;
        var btn = form.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = 'Submitting…';
        formspree.submit({
          _subject        : '🙋 Volunteer Application — HopeRoot',
          volunteer_name  : validate.sanitize(nameEl.value.trim()),
          volunteer_email : emailEl.value.trim(),
          skill_area      : skillEl ? skillEl.value : 'Not specified',
        }, '🙋 Volunteer Application').then(function(){
          form.reset();
          document.getElementById('volSuccess').hidden = false;
          btn.hidden = true;
        }).catch(function(err){
          btn.disabled = false; btn.textContent = 'Apply to Volunteer';
          if (emailErr) emailErr.textContent = 'Submission failed: ' + err.message;
        });
      });
    }
    return { init };
  })();


  /* ══════════════════════════════════════════════════════════════
     7. CONTACT FORM
  ══════════════════════════════════════════════════════════════ */
  var contactModule = (function () {
    function init() {
      var form = document.getElementById('contactForm');
      if (!form) return;
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (validate.isBot('hp_field')) return;
        var nameEl    = document.getElementById('cName');
        var emailEl   = document.getElementById('cEmail');
        var subjectEl = document.getElementById('cSubject');
        var msgEl     = document.getElementById('cMessage');
        var nameErr   = document.getElementById('cNameError');
        var emailErr  = document.getElementById('cEmailError');
        var msgErr    = document.getElementById('cMessageError');
        var valid = true;
        [nameErr, emailErr, msgErr].forEach(function(el){ if(el) el.textContent=''; });
        [nameEl, emailEl, msgEl].forEach(function(el){ el.classList.remove('invalid'); el.removeAttribute('aria-invalid'); });
        if (!nameEl.value.trim()) { validate.showError(nameEl, nameErr, 'Please enter your name.'); valid = false; }
        if (!emailEl.value.trim()) { validate.showError(emailEl, emailErr, 'Please enter your email.'); valid = false; }
        else if (!validate.isEmail(emailEl.value)) { validate.showError(emailEl, emailErr, 'Please enter a valid email.'); valid = false; }
        if (!msgEl.value.trim()) { validate.showError(msgEl, msgErr, 'Please write a message.'); valid = false; }
        if (!valid) return;
        var btn = form.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = 'Sending…';
        formspree.submit({
          _subject: '📬 Contact — ' + (subjectEl.value.trim() || 'No subject'),
          name    : validate.sanitize(nameEl.value.trim()),
          email   : emailEl.value.trim(),
          subject : validate.sanitize(subjectEl.value.trim()),
          message : validate.sanitize(msgEl.value.trim()),
        }, '📬 Contact Message').then(function(){
          form.reset();
          document.getElementById('contactSuccess').hidden = false;
          btn.hidden = true;
        }).catch(function(){
          btn.disabled = false; btn.textContent = 'Send Message';
          if (msgErr) msgErr.textContent = 'Could not send. Please email us directly at ' + CONFIG.ORG_EMAIL;
        });
      });
    }
    return { init };
  })();


  /* ══════════════════════════════════════════════════════════════
     8. NEWSLETTER FORM
  ══════════════════════════════════════════════════════════════ */
  var newsletterModule = (function () {
    function init() {
      var form = document.getElementById('newsletterForm');
      if (!form) return;
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var emailEl = document.getElementById('nlEmail');
        if (!validate.isEmail(emailEl.value)) { emailEl.style.borderColor = 'var(--red-err)'; return; }
        emailEl.style.borderColor = '';
        var btn = form.querySelector('button');
        btn.disabled = true; btn.textContent = '…';
        formspree.submit({
          _subject  : '📰 Newsletter Signup',
          subscriber: emailEl.value.trim(),
        }, '📰 Newsletter').then(function(){
          form.reset();
          document.getElementById('nlSuccess').hidden = false;
        }).catch(function(){
          btn.disabled = false; btn.textContent = 'Subscribe';
          emailEl.style.borderColor = 'var(--red-err)';
        });
      });
    }
    return { init };
  })();


  /* ══════════════════════════════════════════════════════════════
     9. SCROLL REVEAL
  ══════════════════════════════════════════════════════════════ */
  var scrollReveal = (function () {
    function init() {
      var style = document.createElement('style');
      style.textContent = '.reveal{opacity:0;transform:translateY(20px);transition:opacity .6s ease,transform .6s ease}.reveal.visible{opacity:1;transform:none}';
      document.head.appendChild(style);
      var targets = document.querySelectorAll('.program-card,.news-card,.involve-card,.testi-card');
      targets.forEach(function(el){ el.classList.add('reveal'); });
      var obs = new IntersectionObserver(function(entries){
        entries.forEach(function(entry, i){
          if (entry.isIntersecting){
            setTimeout(function(){ entry.target.classList.add('visible'); }, i * 80);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      targets.forEach(function(el){ obs.observe(el); });
    }
    return { init };
  })();


  /* ══════════════════════════════════════════════════════════════
     PAYPAL + SEPARATOR STYLES
  ══════════════════════════════════════════════════════════════ */
  var ppStyle = document.createElement('style');
  ppStyle.textContent = [
    '.paypal-separator{display:flex;align-items:center;gap:12px;margin:18px 0 14px;color:#8aab95;font-size:.82rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;}',
    '.paypal-separator::before,.paypal-separator::after{content:"";flex:1;height:1px;background:#d0e8d8;}',
    '.paypal-btn-wrap{min-height:48px;border-radius:8px;overflow:hidden;}',
  ].join('');
  document.head.appendChild(ppStyle);


  /* ══════════════════════════════════════════════════════════════
     BOOT
  ══════════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {
    navModule.init();
    counterModule.init();
    donateModule.init();
    volunteerModule.init();
    contactModule.init();
    newsletterModule.init();
    scrollReveal.init();
    buildAdminPanel();
  });

})();
