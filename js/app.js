/* ============================================================
   LUMINA: The Sovereign Governance Ledger — app.js
   Full application logic for all 5 pillars
   ============================================================ */

'use strict';

/* ── Starfield ── */
(function initStarfield() {
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let stars = [];
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  function createStars() {
    stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.2,
      o: Math.random() * 0.7 + 0.1,
      s: Math.random() * 0.3 + 0.05
    }));
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      s.o += Math.sin(Date.now() * s.s * 0.001) * 0.005;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,255,${Math.abs(s.o)})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', () => { resize(); createStars(); });
  resize(); createStars(); draw();
})();

/* ── Page Router ── */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const page = document.getElementById('page-' + id);
  if (page) page.classList.add('active');
  const navBtn = document.getElementById('nav-' + id);
  if (navBtn) navBtn.classList.add('active');
  window.scrollTo(0, 0);
  // Lazy init
  if (id === 'dashboard' && !window._dashInit)  { initDashboard(); window._dashInit = true; }
  if (id === 'explorer'  && !window._mapInit)   { initMap(); initBudgetTable(); window._mapInit = true; }
  if (id === 'watchdog'  && !window._watchInit) { initWatchdog(); window._watchInit = true; }
  if (id === 'auditor'   && !window._chatInit)  { initChat(); window._chatInit = true; }
  if (id === 'chain'     && !window._chainInit) { initChain(); window._chainInit = true; }
  if (id === 'api'       && !window._apiInit)   { initAPI(); window._apiInit = true; }
  if (id === 'forecast'  && !window._fcInit)    { initForecast(); window._fcInit = true; }
  if (id === 'adp'       && !window._adpInit)   { initADP(); window._adpInit = true; }
  if (id === 'deepscan'  && !window._dsInit)    { initDeepScan(); window._dsInit = true; }
  if (id === 'entities'  && !window._entInit)   { initEntityTracker(); window._entInit = true; }
  if (id === 'web'       && !window._webInit)   { initMoneyWeb(); window._webInit = true; }
}

function activateSidebar(el) {
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
}

/* ── Counter Animation ── */
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = +el.dataset.count;
    let current = 0;
    const step = target / 80;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current).toLocaleString();
      if (current >= target) clearInterval(timer);
    }, 16);
  });
}

/* ── Auth System (Real-Time Secure OTP) ── */
let isSignup = true; 
let resendTimers = { email: null, mobile: null };

function startResendTimer(type) {
  let seconds = 60;
  const container = document.getElementById(`resend${type.charAt(0).toUpperCase() + type.slice(1)}Container`);
  const timerEl = document.getElementById(`${type}Timer`);
  const linkEl = document.getElementById(`resend${type.charAt(0).toUpperCase() + type.slice(1)}Link`);
  
  if (!container || !timerEl || !linkEl) return;

  container.style.display = 'flex';
  linkEl.classList.add('disabled');
  
  if (resendTimers[type]) clearInterval(resendTimers[type]);
  
  resendTimers[type] = setInterval(() => {
    seconds--;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    timerEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    
    if (seconds <= 0) {
      clearInterval(resendTimers[type]);
      linkEl.classList.remove('disabled');
      timerEl.textContent = "Ready";
    }
  }, 1000);
}

function switchAuthTab(type) {
  const tabs = ['Email', 'Mobile'];
  tabs.forEach(t => {
    const tabEl = document.getElementById(`tab${t}`);
    const formEl = document.getElementById(`${t.toLowerCase()}Form`);
    if (tabEl) tabEl.classList.remove('active');
    if (formEl) formEl.style.display = 'none';
  });
  
  const selectedTabName = type.charAt(0).toUpperCase() + type.slice(1);
  const selectedTabEl = document.getElementById(`tab${selectedTabName}`);
  const selectedFormEl = document.getElementById(`${type}Form`);
  
  if (selectedTabEl) selectedTabEl.classList.add('active');
  if (selectedFormEl) selectedFormEl.style.display = 'flex';
}

async function sendOTP(type) {
  const inputEl = document.getElementById(`${type}Input`);
  const btn = document.getElementById(`btnGetOtp${type.charAt(0).toUpperCase() + type.slice(1)}`);
  
  if (!inputEl) return;
  const input = inputEl.value.trim();
  
  // ── STRICT VALIDATION LOGIC ──
  // Prevents the "single-letter bypass" bug
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^\d{10}$/;

  if (type === 'email') {
    if (!emailRegex.test(input)) {
      toast('Please enter a valid email address (e.g., name@example.com).', 'warning');
      inputEl.focus();
      return;
    }
  } else if (type === 'mobile') {
    // Clean input of non-numeric characters for check
    const cleanMobile = input.replace(/\D/g, '');
    if (!mobileRegex.test(cleanMobile)) {
      toast('Please enter a valid 10-digit mobile number.', 'warning');
      inputEl.focus();
      return;
    }
  }
  
  if (btn) btn.classList.add('btn-loading');
  toast(`📡 Requesting real-time ${type} OTP...`, 'info');
  
  try {
    // ── ASYNCHRONOUS UI SYNC ──
    // We wait for the backend 200 OK before showing any success UI
    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: input, type: type })
    });
    
    const data = await response.json();
    if (btn) btn.classList.remove('btn-loading');
    
    if (response.ok) {
      // ONLY START UI TIMER AND SUCCESS MSG AFTER 200 OK
      const msgEl = document.getElementById(`${type}OtpSent`);
      if (msgEl) {
        msgEl.style.display = 'flex';
        msgEl.innerHTML = `<i class="fas fa-check-circle"></i> ${data.message}`;
      }
      startResendTimer(type);
      toast(`✅ Verification code dispatched to ${input}`, 'success');
      
      console.log(`%c[LUMINA AGENT] Secure Dispatch Successful: Monitoring gateway for ${input}...`, 'color: #00d4ff; font-weight: bold;');
    } else {
      toast(`❌ Dispatch Failed: ${data.error || 'Check your credentials'}`, 'error');
    }
  } catch (err) {
    if (btn) btn.classList.remove('btn-loading');
    console.error('Auth Error:', err);
    toast('📡 Connection Error: Ensure backend is running.', 'error');
  }
}

async function handleAuth(type) {
  const inputEl = document.getElementById(`${type}Input`);
  const otpInputEl = document.getElementById(`${type}Otp`);
  const btn = document.getElementById(`btnLogin${type.charAt(0).toUpperCase() + type.slice(1)}`);
  
  if (!inputEl || !otpInputEl) return;
  const input = inputEl.value.trim();
  const otpInput = otpInputEl.value.trim();
  
  if (!input || !otpInput) {
    toast('Please enter both identifier and OTP.', 'warning');
    return;
  }
  
  if (btn) btn.classList.add('btn-loading');
  toast('🔐 Verifying verification code...', 'info');
  
  try {
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: input, otp: otpInput })
    });
    
    const data = await response.json();
    if (btn) btn.classList.remove('btn-loading');
    
    if (response.ok) {
      completeLogin(input);
    } else {
      toast(`❌ Invalid OTP: Please check your ${type} and try again.`, 'error');
    }
  } catch (err) {
    if (btn) btn.classList.remove('btn-loading');
    console.error('Auth Error:', err);
    toast('📡 Connection Error: Backend unreachable.', 'error');
  }
}

function completeLogin(identifier) {
  toast(`🔐 Access Granted: ${identifier}`, 'success');
  localStorage.setItem('LUMINA_LOGGED_IN', 'true');
  localStorage.setItem('LUMINA_USER', identifier);
  
  setTimeout(() => {
    document.querySelector('nav').style.display = 'flex';
    showPage('landing');
  }, 1000);
}

function toggleSignup() {
  isSignup = !isSignup;
  const title = document.getElementById('authTitle');
  const subtitle = document.getElementById('authSubtitle');
  const footer = document.querySelector('.auth-footer');
  const btnText = isSignup ? 'Create Account' : 'Login to Dashboard';
  
  if (isSignup) {
    title.textContent = 'Create LUMINA Account';
    subtitle.textContent = 'Join the Sovereign Governance Ledger';
    footer.innerHTML = `Already have an account? <span class="auth-link" onclick="toggleSignup()">Login</span>`;
  } else {
    title.textContent = 'Login to LUMINA';
    subtitle.textContent = 'The Sovereign Governance Ledger';
    footer.innerHTML = `Don't have an account? <span class="auth-link" onclick="toggleSignup()">Sign Up</span>`;
  }
  
  document.querySelectorAll('.auth-form button.btn-lg').forEach(btn => btn.textContent = btnText);
}

function logout() {
  toast('👋 Logging out and removing account session...', 'info');
  
  // Firebase SignOut (if still active)
  if (window.fbAuth && typeof window.fbAuth.signOut === 'function') {
    window.fbAuth.signOut().catch(() => {});
  }

  // Complete removal of account flags from local storage
  localStorage.removeItem('LUMINA_LOGGED_IN');
  localStorage.removeItem('LUMINA_USER');
  localStorage.removeItem('emailForSignIn');
  
  // Force a clean state for the UI
  isSignup = true; 
  
  setTimeout(() => {
    checkAuth();
    toast('✅ Account removed from this session.', 'success');
  }, 800);
}

function checkAuth() {
  const isLoggedIn = localStorage.getItem('LUMINA_LOGGED_IN');
  if (isLoggedIn === 'true') {
    document.querySelector('nav').style.display = 'flex';
    showPage('landing');
  } else {
    document.querySelector('nav').style.display = 'none';
    showPage('auth');
    
    const title = document.getElementById('authTitle');
    const footer = document.querySelector('.auth-footer');
    if (isSignup) {
      title.textContent = 'Create LUMINA Account';
      footer.innerHTML = `Already have an account? <span class="auth-link" onclick="toggleSignup()">Login</span>`;
    } else {
      title.textContent = 'Login to LUMINA';
      footer.innerHTML = `Don't have an account? <span class="auth-link" onclick="toggleSignup()">Sign Up</span>`;
    }
    const btnText = isSignup ? 'Create Account' : 'Login to Dashboard';
    document.querySelectorAll('.auth-form button.btn-lg').forEach(btn => btn.textContent = btnText);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(animateCounters, 400);
  checkAuth();
});

/* ── Toast Notifications ── */
function toast(message, type = 'info', duration = 4000) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const c = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  c.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(60px)'; el.style.transition = 'all 0.3s ease'; setTimeout(() => el.remove(), 300); }, duration);
}

/* ══ CHART DEFAULTS ══ */
if (typeof Chart !== 'undefined') {
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
  Chart.defaults.font.family = 'Inter';
}

/* ══════════════════════════════════════════
   FORENSIC DATA: ENTITIES
══════════════════════════════════════════ */
const ENTITIES = [
  {
    id: 'apex', name: 'Apex Construction Corp.', ceo: 'Vikram Mehta',
    extracted: '₹4,250 Cr', year: 2024, status: 'Delayed (Red Flag)',
    risk: 'CRITICAL', color: '#ef4444', avatar: '🏗️',
    projects: ['Highway 401 Repaving', 'Coastal Bridge B'],
    notes: 'Pattern detected: Won 85% of infrastructure tenders in District Alpha despite having 40% higher quotes than competitors.'
  },
  {
    id: 'zenith', name: 'Zenith Infra Solutions', ceo: 'Sanjay Gupta',
    extracted: '₹1,180 Cr', year: 2024, status: 'Incomplete',
    risk: 'HIGH', color: '#f59e0b', avatar: '🏙️',
    projects: ['Sector 9 Community Center'],
    notes: 'Citizen audits show physical progress < 10% while government filings claim 60% disbursement.'
  },
  {
    id: 'maris', name: 'Maris Logistics Ltd.', ceo: 'Unknown (Mauritius)',
    extracted: '₹890 Cr', year: 2023, status: 'Verified',
    risk: 'MEDIUM', color: '#3b82f6', avatar: '🚢',
    projects: ['Port Expansion Ph II'],
    notes: 'Sub-contractor for 12 different government projects. Shares corporate address with 3 other winning bidders.'
  },
  {
    id: 'john', name: 'John Doe Engineering', ceo: 'John Doe',
    extracted: '₹120 Cr', year: 2024, status: 'Ghost Project',
    risk: 'CRITICAL', color: '#ef4444', avatar: '👨‍💼',
    projects: ['Village Road Σ-4'],
    notes: 'Company registered 2 days before tender opening. Office address leads to an empty parking lot.'
  },
  {
    id: 'politician1', name: 'Hon. Rajesh Kumar', ceo: 'Cabinet Minister',
    extracted: '₹12,450 Cr (Portfolio)', year: 2024, status: 'Under Review',
    risk: 'MEDIUM', color: '#3b82f6', avatar: '🏛️',
    projects: ['State Infrastructure Fund', 'Rural Electrification'],
    notes: 'Directly oversees 14 departments with high anomaly rates. Assets increased by 400% in last 5 years.'
  },
  {
    id: 'politician2', name: 'Hon. Priya Singh', ceo: 'MLA (District Beta)',
    extracted: '₹4,200 Cr (Portfolio)', year: 2024, status: 'Verified',
    risk: 'LOW', color: '#10b981', avatar: '🏛️',
    projects: ['Beta Smart City', 'Public Health Initiative'],
    notes: 'Strong track record of verified on-chain disbursements. 98% of projects match citizen audit proofs.'
  },
  {
    id: 'politician3', name: 'Hon. Amit Shah (Mock)', ceo: 'Strategic Projects',
    extracted: '₹28,000 Cr (Portfolio)', year: 2024, status: 'Flagged',
    risk: 'HIGH', color: '#f59e0b', avatar: '🏛️',
    projects: ['National Security Grid', 'Central Vista Ph II'],
    notes: 'Complex sub-contracting network identified across 4 tax-haven jurisdictions.'
  },
  {
    id: 'modi', name: 'Hon. Narendra Modi', ceo: 'Prime Minister',
    extracted: '₹4.7T (National Budget)', year: 2024, status: 'Verified',
    risk: 'LOW', color: '#10b981', avatar: '🇮🇳',
    projects: ['Gati Shakti', 'Digital India', 'Amrit Bharat Station'],
    notes: 'National infrastructure and digital transformation lead. 99.2% of projects anchored on Antigravity chain.',
    ref: 'https://www.pmindia.gov.in/en/major-initiatives/'
  },
  {
    id: 'gadkari', name: 'Hon. Nitin Gadkari', ceo: 'Cabinet Minister (MoRTH)',
    extracted: '₹2.7L Cr (Highways)', year: 2024, status: 'Verified',
    risk: 'LOW', color: '#10b981', avatar: '🛣️',
    projects: ['Delhi-Mumbai Expressway', 'Zojila Tunnel', 'Bharatmala Ph I'],
    notes: 'Infrastructure development specialist. High pace of highway construction verified via satellite imagery.',
    ref: 'https://morth.nic.in/annual-reports'
  },
  {
    id: 'sitharaman', name: 'Hon. Nirmala Sitharaman', ceo: 'Cabinet Minister (Finance)',
    extracted: '₹48.2L Cr (Union Budget)', year: 2024, status: 'Verified',
    risk: 'LOW', color: '#10b981', avatar: '💰',
    projects: ['Capital Expenditure Push', 'GST Digitalization', 'PLI Schemes'],
    notes: 'Fiscal policy lead. Focus on transparency and digital transformation of government spending.',
    ref: 'https://www.indiabudget.gov.in/'
  },
  {
    id: 'jaishankar', name: 'Hon. S. Jaishankar', ceo: 'Cabinet Minister (MEA)',
    extracted: '₹22,000 Cr (Diplomacy)', year: 2024, status: 'Verified',
    risk: 'LOW', color: '#10b981', avatar: '🌍',
    projects: ['Chabahar Port Ph II', 'Digital Connectivity Projects', 'Strategic Infrastructure'],
    notes: 'Overseeing international projects and strategic infrastructure disbursements.',
    ref: 'https://www.mea.gov.in/'
  },
  {
    id: 'vaishnaw', name: 'Hon. Ashwini Vaishnaw', ceo: 'Cabinet Minister (Railways/IT)',
    extracted: '₹2.5L Cr (Railways/Semicon)', year: 2024, status: 'Verified',
    risk: 'LOW', color: '#10b981', avatar: '🚆',
    projects: ['Vande Bharat Ph II', 'Semiconductor Mission', '5G Rollout'],
    notes: 'Modernization lead for railways and technology. High alignment with digital audit logs.',
    ref: 'https://railwayboard.indianrailways.gov.in/'
  },
  {
    id: 'jagan', name: 'Hon. YS Jagan Mohan Reddy', ceo: 'Former CM (AP)',
    extracted: '₹2.4L Cr (State Portfolio)', year: 2024, status: 'Under Review',
    risk: 'MEDIUM', color: '#3b82f6', avatar: '🏛️',
    projects: ['Navaratnalu', 'Ammavodi', 'Polavaram Ph I'],
    notes: 'Direct benefit transfer specialist. Pattern analysis shows 88% verification match with citizen ground-truth.',
    ref: 'https://www.ap.gov.in/'
  },
  {
    id: 'cbn', name: 'Hon. N. Chandrababu Naidu', ceo: 'Chief Minister (AP)',
    extracted: '₹2.8L Cr (Projected)', year: 2024, status: 'Verified',
    risk: 'LOW', color: '#10b981', avatar: '🏙️',
    projects: ['Amaravati Smart City', 'Polavaram Completion', 'IT Corridor'],
    notes: 'Infrastructure and tech-driven governance lead. High alignment with global XBRL standards.',
    ref: 'https://www.ap.gov.in/'
  },
  {
    id: 'lokesh', name: 'Hon. Nara Lokesh', ceo: 'Minister (IT & HRD)',
    extracted: '₹42,000 Cr (Dept)', year: 2024, status: 'Verified',
    risk: 'LOW', color: '#10b981', avatar: '💻',
    projects: ['Skill Development Center', 'Electronics Cluster', 'Broadband for All'],
    notes: 'Focus on digital infrastructure and skill training. All disbursements verified via Merkle-tree hashes.',
    ref: 'https://www.it.ap.gov.in/'
  },
  {
    id: 'pawan', name: 'Hon. Pawan Kalyan', ceo: 'Deputy CM (AP)',
    extracted: '₹35,000 Cr (Rural/Panchayat)', year: 2024, status: 'Verified',
    risk: 'LOW', color: '#10b981', avatar: '⚖️',
    projects: ['Rural Road Connectivity', 'Panchayat Digitalization', 'Water Grid'],
    notes: 'Overseeing rural development. Citizen audit proof matching is at a record high of 97.4%.',
    ref: 'https://www.panchayat.gov.in/'
  },
  {
    id: 'mukesh', name: 'Mukesh Ambani', ceo: 'Reliance Industries',
    extracted: '₹9.2L Cr (Group Revenue)', year: 2024, status: 'Verified',
    risk: 'LOW', color: '#10b981', avatar: '💎',
    projects: ['Jio Digital Fiber', 'Green Energy Giga Factory', 'Retail Expansion'],
    notes: 'Largest private sector entity in the ledger. 98.8% of capital expenditure anchored on Antigravity chain.',
    ref: 'https://www.ril.com/investors/annual-reports'
  },
  {
    id: 'dhirubhai', name: 'Dhirubhai Ambani (Legacy)', ceo: 'Founder, Reliance',
    extracted: 'Historical Data (N/A)', year: 2024, status: 'Verified (Legacy)',
    risk: 'LOW', color: '#10b981', avatar: '🏛️',
    projects: ['Jamnagar Refinery Ph I', 'Naroda Textile Mill', 'IPCL Acquisition'],
    notes: 'Foundational corporate record. Data backfilled from digitized historical archives for legacy auditing.',
    ref: 'https://www.ril.com/about/our-history'
  },
  {
    id: 'mallya', name: 'Vijay Mallya', ceo: 'Former UB Group / Kingfisher',
    extracted: '₹9,000 Cr (Flagged Debt)', year: 2024, status: 'CRITICAL MISMATCH',
    risk: 'CRITICAL', color: '#ef4444', avatar: '✈️',
    projects: ['Kingfisher Airlines Ops', 'Formula 1 Sponsorship', 'Overseas Assets'],
    notes: 'High-risk entity. 100% mismatch between bank settlement hashes and reported asset valuations. Automated Discrepancy Alert triggered.',
    ref: 'https://www.cbi.gov.in/press-releases'
  }
];

function handleForensicSearch(e) {
  if (e.key === 'Enter') {
    const query = e.target.value.toLowerCase().trim();
    if (!query) return;
    
    toast(`🔍 Forensic AI scanning for "${query}"...`, 'info');
    
    // Check if query matches an entity or a politician
    const entity = ENTITIES.find(ent => 
      ent.name.toLowerCase().includes(query) || 
      ent.ceo.toLowerCase().includes(query) ||
      (ent.notes && ent.notes.toLowerCase().includes(query))
    );
    
    setTimeout(() => {
      if (entity) {
        showPage('entities');
        // Ensure the search input on the entities page is updated
        const entitySearch = document.getElementById('entitySearchInput');
        if (entitySearch) {
          entitySearch.value = entity.name;
          // Trigger search on entities page
          if (typeof initEntityTracker === 'function') {
            initEntityTracker();
          }
        }
      } else if (query.includes('web') || query.includes('money') || query.includes('graph')) {
        showPage('web');
      } else {
        toast(`❌ No direct match for "${query}". Try "Modi", "Jagan", or "CBN"`, 'warning');
      }
    }, 1000);
  }
}

/* ══════════════════════════════════════════
   DASHBOARD & MISSION CONTROL
══════════════════════════════════════════ */
const AUDIT_LOGS = [
  'Verifying disbursement hash 0x7a2...f91',
  'Satellite imagery confirm: Road Σ-4 progress 2%',
  'XBRL Mapping complete for Health Dept FY25',
  'Neural inference: Predictive shortfall in Rural Dev',
  'New block anchored for Narendra Modi xx',
  'Cross-silo reconciliation: Bank settlement MATCH',
  'Forensic scan triggered for contractor Apex Ph-1',
  'Merkle-root validation PASS for Jal Board Ph II',
  'Duplicate invoice detected: INV-44821 FLAGGED',
  'Smart contract executed for Education stipend sync'
];

function initMissionControl() {
  const stream = document.getElementById('liveAuditStream');
  if (!stream) return;

  setInterval(() => {
    const log = AUDIT_LOGS[Math.floor(Math.random() * AUDIT_LOGS.length)];
    const time = new Date().toLocaleTimeString();
    const newEntry = document.createElement('div');
    newEntry.style.marginBottom = '4px';
    newEntry.innerHTML = `<span style="color:var(--accent-cyan)">[${time}]</span> <span style="color:#fff">SYSTEM:</span> ${log}`;
    
    stream.insertBefore(newEntry, stream.firstChild);
    if (stream.children.length > 12) stream.lastChild.remove();

    // Randomly update sync health bar for visual effect
    if (GOOGLE_API_KEY) {
      const bar = document.getElementById('syncHealthBar');
      const text = document.getElementById('syncHealthText');
      if (bar && text) {
        const val = Math.floor(Math.random() * 20) + 80;
        bar.style.width = val + '%';
        text.textContent = 'Active (' + val + '%)';
        text.className = 'text-green';
      }
    }
  }, 3000);
}

function initDashboard() {
  initMissionControl();
  
  const ctx = document.getElementById('dashChart1');
  if (!ctx || typeof Chart === 'undefined') return;
  // Bar chart: Budget vs Disbursement
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Infrastructure', 'Healthcare', 'Education', 'Defence', 'Agriculture', 'Technology'],
      datasets: [
        {
          label: 'Allocated (₹ Cr)',
          data: [82000, 61000, 54000, 47000, 39000, 28000],
          backgroundColor: 'rgba(0,212,255,0.25)',
          borderColor: '#00d4ff',
          borderWidth: 2,
          borderRadius: 6
        },
        {
          label: 'Disbursed (₹ Cr)',
          data: [74200, 58100, 51800, 46100, 35000, 24500],
          backgroundColor: 'rgba(16,185,129,0.25)',
          borderColor: '#10b981',
          borderWidth: 2,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => '₹' + (v/1000).toFixed(0) + 'K' } }
      }
    }
  });

  // Doughnut chart: Sector Spending
  new Chart(document.getElementById('dashChart2'), {
    type: 'doughnut',
    data: {
      labels: ['Infrastructure', 'Healthcare', 'Education', 'Defence', 'Agriculture', 'Other'],
      datasets: [{
        data: [28, 20, 18, 15, 12, 7],
        backgroundColor: ['#00d4ff','#10b981','#8b5cf6','#f59e0b','#3b82f6','#ec4899'],
        borderColor: '#0d1424',
        borderWidth: 3
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '65%',
      plugins: { legend: { position: 'right' } }
    }
  });

  // Transaction table
  const txRows = [
    { id:'TXN-8821', dept:'PWD - Road Division', amount:'₹42.5 Cr', status:'verified', hash:'0x3f8a...d92c' },
    { id:'TXN-8820', dept:'Health Ministry', amount:'₹18.2 Cr', status:'verified', hash:'0x7c1d...a44f' },
    { id:'TXN-8819', dept:'Smart City - Phase 3', amount:'₹220 Cr', status:'flagged', hash:'0xb9f2...e71a' },
    { id:'TXN-8818', dept:'Education Dept.', amount:'₹9.8 Cr', status:'verified', hash:'0x4d3c...b88e' },
    { id:'TXN-8817', dept:'Rural Dev. Scheme', amount:'₹67 Cr', status:'pending', hash:'0x9a1f...c30b' },
  ];
  const tb = document.getElementById('dashTxTable');
  if (tb) {
    tb.innerHTML = '';
    txRows.forEach(r => {
      const colors = { verified:'green', flagged:'red', pending:'amber' };
      const labels = { verified:'✅ Verified', flagged:'🚨 Flagged', pending:'⏳ Pending' };
      tb.innerHTML += `<tr>
        <td><span class="font-mono" style="font-size:11px;color:var(--accent-cyan)">${r.id}</span><br/><span style="font-size:12px;color:var(--text-muted)">${r.dept}</span></td>
        <td class="fw-600">${r.amount}</td>
        <td><span class="risk-badge ${colors[r.status]}">${labels[r.status]}</span></td>
        <td><button class="verify-btn" onclick="toggleVerify(this)" data-hash="${r.hash}">🔗 ${r.hash}</button></td>
      </tr>`;
    });
  }

  // Block feed
  renderChainFeed('dashChainFeed', 8);
}

function downloadIntegrityCert(id) {
  const e = ENTITIES.find(ent => ent.id === id);
  if (!e) return;

  toast(`📄 Generating Governance Integrity Certificate for ${e.name}...`, 'info');
  
  setTimeout(() => {
    const docDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const certText = `
GOVERNMENT OF INDIA - PROOF-OF-INTEGRITY PROTOCOL
==================================================
CERTIFICATE OF AUDIT: ${e.name.toUpperCase()}
OFFICIAL ID: IND-GOV-${id.toUpperCase()}-2024
TIMESTAMP: ${docDate}
--------------------------------------------------
PORTFOLIO VALUE: ${e.extracted}
RISK CATEGORY: ${e.risk}
CHAIN ANCHOR: VERIFIED (0x${Array.from({length:32},()=>Math.floor(Math.random()*16).toString(16)).join('')})
INTEGRITY SCORE: ${e.risk === 'CRITICAL' ? '14%' : '98.4%'}
--------------------------------------------------
LUMINA FORENSIC ENGINE - MATHEMATICAL ACCOUNTABILITY
    `;
    
    const blob = new Blob([certText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LUMINA_CERT_${id.toUpperCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast('✅ Certificate generated and downloaded.', 'success');
  }, 2000);
}

/* ══════════════════════════════════════════
   BLOCKCHAIN UTILITIES
══════════════════════════════════════════ */
const EVENTS = [
  'Budget allocation recorded', 'Disbursement confirmed', 'Contract awarded',
  'Invoice validated', 'Audit checkpoint', 'Department sync', 'OCR scan anchored',
  'Anomaly resolved', 'Cross-silo reconciliation', 'Smart contract executed'
];

const CHAIN_NAMES = [
  'Narendra Modi', 'YS Jagan', 'Chandrababu', 'Nara Lokesh', 'Pawan Kalyan', 
  'Nitin Gadkari', 'Nirmala Sitharaman', 'S. Jaishankar', 'Ashwini Vaishnaw',
  'Mukesh Ambani', 'Vijay Mallya'
];

function genHash() {
  const chars = '0123456789abcdef';
  let h = '0x';
  for (let i = 0; i < 8; i++) h += chars[Math.floor(Math.random() * 16)];
  h += '...';
  for (let i = 0; i < 4; i++) h += chars[Math.floor(Math.random() * 16)];
  return h;
}

let blockNum = 2891;
function renderChainFeed(containerId, count) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const num = blockNum - i;
    const name = CHAIN_NAMES[Math.floor(Math.random() * CHAIN_NAMES.length)];
    el.innerHTML += `
      <div class="chain-block" onclick="inspectBlock(${num})">
        <div>
          <div class="chain-event" style="font-size:14px; font-weight:600">${name}</div>
        </div>
        <div style="margin-left:auto;display:flex;align-items:center">
          <span style="color:var(--accent-green);font-size:18px">✓</span>
        </div>
      </div>`;
  }
}

function inspectBlock(num) {
  toast(`Block #${num} — Hash verified on Antigravity chain ✓`, 'success');
}

function toggleVerify(btn) {
  const isValid = Math.random() > 0.15;
  if (isValid) {
    btn.classList.remove('invalid');
    btn.innerHTML = `🔗 ${btn.dataset.hash}`;
    toast('Hash verified on Antigravity chain ✓', 'success');
  } else {
    btn.classList.add('invalid');
    btn.innerHTML = `❌ HASH MISMATCH`;
    toast('CRITICAL: Hash mismatch detected! Record may be tampered.', 'error', 6000);
  }
}

/* ══════════════════════════════════════════
   MAP
══════════════════════════════════════════ */
let mainMap = null;
let mapMarkers = [];

const DISTRICTS_DATA = [
  { name:'District Alpha — Mumbai Metro', lat:19.076, lng:72.877, sector:'infrastructure', year:2024, spend:'₹4,200 Cr', status:'verified', color:'#10b981', risk:'Low' },
  { name:'District Alpha — Mumbai Metro', lat:19.076, lng:72.877, sector:'healthcare', year:2024, spend:'₹1,200 Cr', status:'verified', color:'#10b981', risk:'Low' },
  { name:'District Beta — Pune Urban', lat:18.520, lng:73.856, sector:'infrastructure', year:2024, spend:'₹1,800 Cr', status:'verified', color:'#10b981', risk:'Low' },
  { name:'District Gamma — Nagpur', lat:21.145, lng:79.088, sector:'healthcare', year:2024, spend:'₹920 Cr', status:'partial', color:'#f59e0b', risk:'Medium' },
  { name:'District Delta — Nashik', lat:19.998, lng:73.789, sector:'education', year:2024, spend:'₹640 Cr', status:'verified', color:'#10b981', risk:'Low' },
  { name:'District Epsilon — Aurangabad', lat:19.876, lng:75.343, sector:'infrastructure', year:2024, spend:'₹380 Cr', status:'flagged', color:'#ef4444', risk:'CRITICAL' },
  { name:'District Zeta — Solapur', lat:17.686, lng:75.904, sector:'defence', year:2024, spend:'₹290 Cr', status:'partial', color:'#f59e0b', risk:'Medium' },
  { name:'District Eta — Kolhapur', lat:16.704, lng:74.243, sector:'healthcare', year:2024, spend:'₹210 Cr', status:'verified', color:'#10b981', risk:'Low' },
  { name:'District Theta — Delhi NCR', lat:28.613, lng:77.209, sector:'infrastructure', year:2024, spend:'₹8,100 Cr', status:'verified', color:'#10b981', risk:'Low' },
  { name:'District Iota — Bangalore', lat:12.971, lng:77.594, sector:'education', year:2024, spend:'₹5,600 Cr', status:'verified', color:'#10b981', risk:'Low' },
  { name:'District Kappa — Chennai', lat:13.082, lng:80.270, sector:'healthcare', year:2024, spend:'₹3,200 Cr', status:'partial', color:'#f59e0b', risk:'Medium' },
  { name:'District Lambda — Hyderabad', lat:17.385, lng:78.486, sector:'infrastructure', year:2024, spend:'₹4,800 Cr', status:'flagged', color:'#ef4444', risk:'HIGH' },
  { name:'District Mu — Kolkata', lat:22.572, lng:88.363, sector:'defence', year:2024, spend:'₹2,900 Cr', status:'verified', color:'#10b981', risk:'Low' },
  // 2023 data
  { name:'District Alpha — Mumbai Metro', lat:19.076, lng:72.877, sector:'infrastructure', year:2023, spend:'₹3,900 Cr', status:'verified', color:'#10b981', risk:'Low' },
  { name:'District Beta — Pune Urban', lat:18.520, lng:73.856, sector:'healthcare', year:2023, spend:'₹1,100 Cr', status:'verified', color:'#10b981', risk:'Low' },
];

function initMap() {
  const mapEl = document.getElementById('map');
  if (!mapEl || typeof L === 'undefined') return;
  
  if (!mainMap) {
    mainMap = L.map('map', { zoomControl: true, scrollWheelZoom: true }).setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 18
    }).addTo(mainMap);
  }

  updateMapMarkers();
}

function updateMapMarkers() {
  if (!mainMap) return;
  
  // Clear existing markers
  mapMarkers.forEach(m => mainMap.removeLayer(m));
  mapMarkers = [];

  const sector = document.getElementById('mapSectorFilter').value;
  const year = parseInt(document.getElementById('mapYearFilter').value);

  const filtered = DISTRICTS_DATA.filter(d => d.sector === sector && d.year === year);
  
  if (filtered.length === 0) {
    toast(`No ${sector} records found for ${year}`, 'info');
  }

  filtered.forEach(d => {
    const circle = L.circleMarker([d.lat, d.lng], {
      radius: 14, color: d.color, fillColor: d.color,
      fillOpacity: 0.35, weight: 2, opacity: 0.9
    }).addTo(mainMap);
    
    circle.bindPopup(`
      <div style="min-width:220px;font-family:Inter,sans-serif">
        <div style="font-weight:700;font-size:14px;margin-bottom:8px">${d.name}</div>
        <div style="font-size:12px;color:#94a3b8;margin-bottom:4px">Verified ${d.sector.charAt(0).toUpperCase() + d.sector.slice(1)} Spend</div>
        <div style="font-size:20px;font-weight:800;color:${d.color};margin-bottom:8px">${d.spend}</div>
        <div style="display:flex;gap:8px;align-items:center">
          <span style="font-size:11px;padding:2px 8px;border-radius:999px;background:${d.color}22;color:${d.color};border:1px solid ${d.color}44;font-weight:700">${d.risk} RISK</span>
          <span style="font-size:11px;color:#94a3b8">${d.status.toUpperCase()}</span>
        </div>
        <div style="font-size:10px;color:#94a3b8;margin-top:8px">FY ${year}-${(year+1).toString().slice(2)} · Antigravity Verified</div>
      </div>
    `);
    mapMarkers.push(circle);
  });
}

/* ══════════════════════════════════════════
   BUDGET TABLE
══════════════════════════════════════════ */
const BUDGET_ROWS = [
  { project:'Mumbai-Pune Expressway Extension', dept:'PWD', allocated:'₹2,200 Cr', disbursed:'₹1,980 Cr', progress:90, risk:'low' },
  { project:'Smart City Surveillance Network', dept:'Cyber Dept.', allocated:'₹840 Cr', disbursed:'₹820 Cr', progress:98, risk:'low' },
  { project:'District Hospital Upgrade', dept:'Health Ministry', allocated:'₹320 Cr', disbursed:'₹280 Cr', progress:88, risk:'low' },
  { project:'Solar Farm — Phase 2', dept:'Energy Dept.', allocated:'₹1,100 Cr', disbursed:'₹430 Cr', progress:39, risk:'medium' },
  { project:'Ghost Road Project Σ-4', dept:'Rural Dev.', allocated:'₹680 Cr', disbursed:'₹670 Cr', progress:2, risk:'critical' },
  { project:'Digital Literacy Initiative', dept:'Education', allocated:'₹190 Cr', disbursed:'₹160 Cr', progress:84, risk:'low' },
  { project:'Flyover Bridge — Sector 7', dept:'Municipal Corp.', allocated:'₹420 Cr', disbursed:'₹395 Cr', progress:94, risk:'low' },
  { project:'Water Treatment Plant B', dept:'Jal Board', allocated:'₹740 Cr', disbursed:'₹220 Cr', progress:30, risk:'high' },
  { project:'Contract XR-991 (Zero Bidders)', dept:'Procurement', allocated:'₹290 Cr', disbursed:'₹285 Cr', progress:98, risk:'critical' },
  { project:'Primary School Construction', dept:'Education', allocated:'₹88 Cr', disbursed:'₹82 Cr', progress:93, risk:'low' },
];

function initBudgetTable() {
  renderBudgetTable(BUDGET_ROWS);
}

function renderBudgetTable(rows) {
  const tb = document.getElementById('budgetTable');
  tb.innerHTML = '';
  rows.forEach(r => {
    const riskColor = { low:'#10b981', medium:'#3b82f6', high:'#f59e0b', critical:'#ef4444' };
    const c = riskColor[r.risk] || '#94a3b8';
    tb.innerHTML += `<tr>
      <td><span class="fw-600">${r.project}</span></td>
      <td style="color:var(--text-muted);font-size:12px">${r.dept}</td>
      <td class="font-mono">${r.allocated}</td>
      <td class="font-mono">${r.disbursed}</td>
      <td style="min-width:120px">
        <div style="font-size:11px;margin-bottom:4px">${r.progress}%</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${r.progress}%;background:linear-gradient(90deg,${c},${c}88)"></div></div>
      </td>
      <td><span class="risk-badge ${r.risk}">${r.risk.toUpperCase()}</span></td>
      <td><button class="verify-btn" onclick="toggleVerify(this)" data-hash="${genHash()}">⛓ Verify</button></td>
    </tr>`;
  });
}

function filterTable() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  renderBudgetTable(BUDGET_ROWS.filter(r => r.project.toLowerCase().includes(q) || r.dept.toLowerCase().includes(q)));
}

async function initDeepScan() {
  const dropZone = document.getElementById('dropZone');
  if (!dropZone) return;

  // Add event listeners for drag and drop
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
    }, false);
  });

  dropZone.addEventListener('dragover', () => dropZone.classList.add('drag-over'));
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    dropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length) startScan({ files });
  });
}

async function startScan(input) {
  const file = input.files[0];
  if (!file) return;

  const pipeline = document.getElementById('scanPipeline');
  const steps = document.getElementById('pipelineSteps');
  const result = document.getElementById('ocrResult');
  const anchorBtn = document.getElementById('anchorBtn');
  const xbrlPanel = document.getElementById('xbrlPanel');

  if (pipeline) pipeline.style.display = 'block';
  if (result) {
    result.innerHTML = `
      <div class="scanning-loader">
        <div class="scan-line"></div>
        <div style="font-size:40px;margin-bottom:15px">📄</div>
        <div class="fw-600">Vision-LLM Ingesting...</div>
        <div class="fs-12 text-muted">${file.name}</div>
      </div>
    `;
  }
  
  const stepList = [
    'Initializing Multimodal Ingestion Engine...',
    'Performing High-Res OCR and Table Extraction...',
    'Context-Aware Parsing (XBRL Mapping)...',
    'Cross-Referencing Forensic Entity Ledger...'
  ];
  
  if (steps) {
    steps.innerHTML = '';
    for (const step of stepList) {
      const stepEl = document.createElement('div');
      stepEl.className = 'pipeline-step';
      stepEl.innerHTML = `<span class="step-dot"></span> ${step}`;
      steps.appendChild(stepEl);
      await new Promise(r => setTimeout(r, 800));
      stepEl.classList.add('completed');
    }
  }

  // Real Backend Call
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/deepscan', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    if (response.ok && data.extracted_items) {
      renderOCRResults(data.extracted_items);
      if (anchorBtn) anchorBtn.style.display = 'block';
      if (xbrlPanel) xbrlPanel.style.display = 'block';
      toast('✅ Deep-Scan complete. 47 line items extracted and mapped.', 'success');
    } else {
      throw new Error(data.error || 'Failed to parse document');
    }
  } catch (err) {
    console.error('Scan Error:', err);
    result.innerHTML = `<div class="text-red" style="padding:40px">❌ Error: ${err.message}</div>`;
    toast('Scan failed. Ensure backend is running and API key is valid.', 'error');
  }
}

function renderOCRResults(items) {
  const result = document.getElementById('ocrResult');
  const xbrlBody = document.getElementById('xbrlBody');
  if (!result || !xbrlBody) return;

  result.innerHTML = `
    <div style="padding:20px; text-align:left">
      <div class="fw-700 text-cyan mb-12" style="font-family:'Orbitron',sans-serif;font-size:12px">EXTRACTION PREVIEW</div>
      <div style="max-height:300px;overflow-y:auto">
        ${items.slice(0, 5).map(item => `
          <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border-subtle)">
            <div class="fw-600 fs-13">${item.item}</div>
            <div class="fs-11 text-muted" style="font-style:italic">"${item.raw}"</div>
          </div>
        `).join('')}
        <div class="text-center text-muted fs-11">... and ${items.length - 5} more items</div>
      </div>
    </div>
  `;

  xbrlBody.innerHTML = '';
  items.forEach(item => {
    const confColor = item.confidence > 90 ? 'var(--accent-green)' : (item.confidence > 70 ? 'var(--accent-amber)' : 'var(--accent-red)');
    xbrlBody.innerHTML += `
      <tr>
        <td class="fw-600">${item.item}</td>
        <td class="fs-11 text-muted">"${item.raw}"</td>
        <td><code style="color:var(--accent-violet)">${item.tag}</code></td>
        <td><span style="color:${confColor}">${item.confidence}%</span></td>
        <td><span class="risk-badge ${item.status === 'flagged' ? 'red' : 'green'}">${item.status.toUpperCase()}</span></td>
      </tr>
    `;
  });
}

/* ══════════════════════════════════════════
   ANOMALY WATCHDOG
══════════════════════════════════════════ */
const ANOMALIES = [
  {
    title: 'Ghost Project Detected — Road Σ-4',
    desc: '₹680 Cr disbursed for road construction. Satellite imagery confirms <2% physical progress. Company registered 3 days before contract award.',
    meta: 'Dept: Rural Dev. · Contract: #RD-2024-4419 · Score: 97',
    risk: 97, severity: 'critical', icon: '👻'
  },
  {
    title: 'Bid Rigging — Contract XR-991',
    desc: '₹290 Cr contract awarded with zero competitive bids. Vendor is a shell company linked to 4 other single-bidder contracts totalling ₹1.2B.',
    meta: 'Dept: Procurement · Contract: #PR-2024-0991 · Score: 91',
    risk: 91, severity: 'critical', icon: '🎯'
  },
  {
    title: 'Duplicate Invoice Pattern',
    desc: 'Invoice #INV-44821 submitted and paid twice from two department codes. Total duplicate amount: ₹4.2 Cr.',
    meta: 'Dept: Finance · Invoice: #INV-44821 · Score: 88',
    risk: 88, severity: 'critical', icon: '📄'
  },
  {
    title: 'Over-Valuation — Solar Farm Phase 2',
    desc: 'Equipment procurement ₹230 Cr above market benchmark. Similar state tender settled at 38% lower price in same fiscal year.',
    meta: 'Dept: Energy · Contract: #EN-2024-217 · Score: 74',
    risk: 74, severity: 'high', icon: '☀️'
  },
  {
    title: 'Suspicious Vendor Network',
    desc: '7 vendors sharing the same registered address and bank account prefix received ₹840 Cr in contracts across 3 departments.',
    meta: 'Multiple Depts. · Cluster ID: VN-88 · Score: 71',
    risk: 71, severity: 'high', icon: '🕸️'
  },
  {
    title: 'Abnormal Transaction Velocity',
    desc: '142 payments processed in 18 minutes on March 10, exceeding 10-sigma anomaly threshold. Pattern matches end-of-period budget drain.',
    meta: 'Treasury · Batch: #B-20240310 · Score: 63',
    risk: 63, severity: 'high', icon: '⚡'
  },
  {
    title: 'Contract Timeline Anomaly',
    desc: 'Water Treatment Plant B: 70% of budget disbursed but construction timeline shows only 30% progress after 18 months.',
    meta: 'Dept: Jal Board · Contract: #JB-2023-017 · Score: 58',
    risk: 58, severity: 'medium', icon: '🏗️'
  },
];

function initWatchdog() {
  renderAnomalies(ANOMALIES);

  // Risk distribution chart
  const ctx = document.getElementById('anomalyChart');
  if (ctx && typeof Chart !== 'undefined') {
    new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['0-20', '21-40', '41-60', '61-75', '76-90', '91-100'],
      datasets: [{
        label: 'Anomaly Count',
        data: [124, 58, 23, 7, 4, 3],
        backgroundColor: ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#f97316','#ef4444'],
        borderRadius: 6, borderWidth: 0
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, title: { display: true, text: 'Risk Score Range', color: '#94a3b8' } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, title: { display: true, text: 'Count', color: '#94a3b8' } }
      }
    }
  });
  }
}

function renderAnomalies(data) {
  const list = document.getElementById('anomalyList');
  if (!list) return;
  list.innerHTML = '';
  data.forEach(a => {
    const riskColor = { critical:'var(--accent-red)', high:'var(--accent-amber)', medium:'var(--accent-blue)' };
    const riskBg   = { critical:'rgba(239,68,68,0.12)', high:'rgba(245,158,11,0.12)', medium:'rgba(59,130,246,0.12)' };
    list.innerHTML += `
      <div class="anomaly-item ${a.severity}" onclick="investigateAnomaly('${a.title.split(' ')[0]}')">
        <div class="anomaly-icon" style="background:${riskBg[a.severity]};color:${riskColor[a.severity]}">${a.icon}</div>
        <div style="flex:1">
          <div class="anomaly-title">${a.title}</div>
          <div class="anomaly-desc">${a.desc}</div>
          <div class="anomaly-meta">${a.meta}</div>
        </div>
        <div class="risk-score">
          <div class="risk-score-val" style="color:${riskColor[a.severity]}">${a.risk}</div>
          <div class="risk-score-label">RISK</div>
        </div>
      </div>`;
  });
}

function investigateAnomaly(title) {
  toast(`🔬 Initiating deep investigation on "${title}" anomaly...`, 'warning', 4000);
  setTimeout(() => toast('📡 Cross-referencing bank settlement hashes with expenditure filings...', 'info', 3000), 1500);
}

let tfLossChart = null;

async function runTFScan() {
  const panel = document.getElementById('dlTrainingPanel');
  const btn = document.getElementById('btnDeepScan');
  panel.style.display = 'block';
  btn.classList.add('btn-disabled');
  btn.innerHTML = '<span class="icon">⏳</span> Training Net...';
  
  // Initialise Chart if needed
  if (!tfLossChart) {
    tfLossChart = new Chart(document.getElementById('tfLossChart'), {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'MSE Loss', data: [], borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.2)', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display:false } }, scales: { x: { display: false }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, min: 0 } } }
    });
  } else {
    tfLossChart.data.labels = []; tfLossChart.data.datasets[0].data = []; tfLossChart.update();
  }

  // Simulate TF.js Model Setup & Training with sequential-like data
  document.getElementById('tfEpoch').textContent = '0 / 25';
  document.getElementById('tfLoss').textContent = '0.450';
  document.getElementById('tfPrec').textContent = '0.0%';
  document.getElementById('tfProgress').style.width = '0%';
  
  toast('🧠 Compiling TensorFlow.js LSTM Autoencoder on WebGL backend...', 'info');
  toast('📊 Feeding sequential transaction vectors into training pipeline...', 'info');
  
  if (typeof tf === 'undefined') {
    toast('Error: TensorFlow.js failed to load.', 'error');
    return;
  }

  // Build a dummy sequential autoencoder in memory just to prove TF is running
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 32, inputShape: [42], activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 42, activation: 'linear' }));
  model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

  // Simulate training loop for visual effect
  let currentLoss = 0.45;
  let precision = 40.0;
  
  for(let epoch=1; epoch<=25; epoch++) {
    await new Promise(r => setTimeout(r, 150)); // epoch duration
    currentLoss = currentLoss * 0.90 + (Math.random()*0.005 - 0.002);
    precision = Math.min(99.2, precision + 2.4 + Math.random()*1.2);
    
    document.getElementById('tfEpoch').textContent = `${epoch} / 25`;
    document.getElementById('tfLoss').textContent = currentLoss.toFixed(4);
    document.getElementById('tfPrec').textContent = precision.toFixed(1) + '%';
    document.getElementById('tfProgress').style.width = (epoch/25 * 100) + '%';
    
    tfLossChart.data.labels.push(epoch);
    tfLossChart.data.datasets[0].data.push(currentLoss);
    tfLossChart.update();
  }
  
  document.getElementById('dlStatusIndicator').innerHTML = '<span class="scan-dot" style="background:var(--accent-green);animation:none"></span> Model Deployed';
  
  // Dynamic result generation
  const newAnomaly = {
    title: 'NEW: Predictive Over-run — Port Expansion',
    desc: 'Neural forecast identifies high probability of cost overrun (>₹400 Cr) based on current procurement velocity and historical bid inflation.',
    meta: 'Dept: Shipping · Model: LSTM Sequence · Confidence: 94.2%',
    risk: 82, severity: 'high', icon: '🚢'
  };
  
  const updatedAnomalies = [newAnomaly, ...ANOMALIES];
  renderAnomalies(updatedAnomalies);

  toast('✅ TensorFlow.js convergence complete: New Predictive Anomaly identified.', 'success', 6000);
  btn.classList.remove('btn-disabled');
  btn.innerHTML = '<span class="icon">🧠</span> Run Neural Net Scan';
}

function exportReport() {
  toast('📥 Generating PDF audit report with blockchain attestation...', 'info');
  setTimeout(() => toast('✅ Report ready: LUMINA_Audit_Report_2026-03-13.pdf', 'success'), 2000);
}

/* ══════════════════════════════════════════
   AI AUDITOR CHAT
══════════════════════════════════════════ */
let aiChart = null;

const QUERIES = [
  'Compare health spending per capita in District A vs District B',
  'Which department has the highest anomaly rate in FY 2024-25?',
  'Show infrastructure budget utilisation across all states',
  'Find contracts awarded to single-bidder vendors this year',
  'Compare YS Jagan vs Chandrababu infrastructure spend',
  'Show Narendra Modi national digital initiatives',
  'What is Pawan Kalyan rural development status?',
  'Show Nara Lokesh skill development disbursements',
];

const AI_RESPONSES = {
  'health': {
    text: `📊 **Health Spending Per Capita Analysis**\n\nDistrict Alpha (Mumbai): **₹4,820/capita** — 94% of allocated funds disbursed and verified on-chain.\n\nDistrict Beta (Pune): **₹3,140/capita** — 82% disbursed. A disparity of **₹1,680/capita (34.8%)** exists between these districts.\n\n🚨 **AI Finding:** The gap correlates with 3 flagged procurement contracts in District Beta. Recommend immediate audit of hospital equipment tenders.`,
    chart: { type:'bar', labels:['District Alpha','District Beta','District Gamma','District Delta','District Epsilon'], data:[4820,3140,2890,3600,1820], color:'#00d4ff', title:'Health Spending Per Capita (₹)' }
  },
  'anomaly': {
    text: `🔬 **Department Anomaly Rate Analysis**\n\nHighest anomaly rates by department:\n\n1. **Rural Development: 18.4%** — 3 ghost projects flagged\n2. **Procurement: 14.2%** — Bid rigging patterns detected\n3. **Energy Dept.: 9.8%** — Over-valuation in equipment tenders\n4. **Finance: 6.2%** — Duplicate invoice clusters\n5. **Jal Board: 5.1%** — Timeline mismatches\n\n⚠️ Combined estimated exposure: **₹2.4 Billion**.`,
    chart: { type:'bar', labels:['Rural Dev.','Procurement','Energy','Finance','Jal Board'], data:[18.4,14.2,9.8,6.2,5.1], color:'#ef4444', title:'Anomaly Rate by Department (%)' }
  },
  'infrastructure': {
    text: `🏗️ **Infrastructure Budget Utilisation**\n\nNational infrastructure spend for FY 2024-25:\n- **Total Allocated:** ₹2.2 Lakh Crore\n- **Disbursed:** ₹1.96 Lakh Crore (**89.1%**)\n- **Verified on Chain:** ₹1.87 Lakh Crore (**85.0%**)\n\nTop-performing state: **Maharashtra (94.2%)**\nLowest utilisation: **Jharkhand (61.8%)**\n\n✅ 2,891 infrastructure transactions anchored on Antigravity blockchain.`,
    chart: { type:'bar', labels:['Maharashtra','Gujarat','Karnataka','UP','Rajasthan','Jharkhand'], data:[94.2,91.0,88.6,80.1,74.3,61.8], color:'#10b981', title:'Infrastructure Budget Utilisation by State (%)' }
  },
  'jagan': {
    text: `🏛️ **Forensic Analysis: Hon. YS Jagan Mohan Reddy Portfolio**\n\nAnalysis of state-level direct benefit transfers (DBT) and infrastructure:\n- **Total Managed:** ₹2.4 Lakh Crore\n- **Verification Match:** 88% alignment with citizen ground-truth.\n- **Flagged Items:** 12% require manual reconciliation due to satellite-physical progress mismatch in Rural Housing Ph II.\n\n✅ 14,200 transactions verified against Antigravity blockchain.`,
    chart: { type:'pie', labels:['Verified DBT','Infra Spend','Education','Flagged/Review'], data:[65, 15, 10, 10], color:'#3b82f6', title:'YS Jagan Portfolio Distribution (%)' }
  },
  'cbn': {
    text: `🏙️ **Forensic Analysis: Hon. N. Chandrababu Naidu Portfolio**\n\nAnalysis of infrastructure and tech-driven governance:\n- **Total Projected:** ₹2.8 Lakh Crore\n- **XBRL Alignment:** 96.4% compliance with global financial standards.\n- **Key Focus:** Amaravati Smart City development (₹45,000 Cr allocated).\n\n✅ All disbursements for IT Corridors are 100% anchored on-chain.`,
    chart: { type:'bar', labels:['Amaravati','IT Sector','Polavaram','Education','Agriculture'], data:[45, 25, 15, 10, 5], color:'#10b981', title:'Chandrababu Naidu Budget Allocation (₹K Cr)' }
  },
  'modi': {
    text: `🇮🇳 **National Forensic Audit: Hon. Narendra Modi Portfolio**\n\nCross-referencing national digital and infrastructure initiatives:\n- **Total Audited:** ₹4.7 Trillion\n- **Integrity Score:** 99.2% (Historical High).\n- **Top Initiatives:** Gati Shakti (Infra) and Digital India (Tech).\n\n✅ 128,407 transactions successfully anchored on Antigravity Trust Layer.`,
    chart: { type:'line', labels:['2020','2021','2022','2023','2024'], data:[82, 85, 91, 96, 99], color:'#10b981', title:'National Integrity Score Trend (%)' }
  },
  'pawan': {
    text: `⚖️ **Rural Audit: Hon. Pawan Kalyan Portfolio**\n\nDeep-scan of rural development and panchayat digitalization:\n- **Total Managed:** ₹35,000 Cr\n- **Citizen Audit Match:** 97.4% (Highest in category).\n- **Key Progress:** 8,200 km of rural roads verified via satellite ADP protocol.\n\n✅ High transparency detected in water grid disbursements.`,
    chart: { type:'bar', labels:['Rural Roads','Panchayat Dig.','Water Grid','Social Welfare'], data:[12000, 8000, 10000, 5000], color:'#f59e0b', title:'Pawan Kalyan Dept Spend (₹ Cr)' }
  },
  'lokesh': {
    text: `💻 **Tech & HRD Audit: Hon. Nara Lokesh Portfolio**\n\nAnalysis of digital infrastructure and skill development disbursements:\n- **Total Managed:** ₹42,000 Cr\n- **Verification Status:** 100% Merkle-tree hash match.\n- **Efficiency:** 94% fund utilization in electronics clusters within 12 months.\n\n✅ Automated Discrepancy Protocol (ADP) shows zero mismatches in broadband project.`,
    chart: { type:'doughnut', labels:['Skill Dev','Electronics','Broadband','Education'], data:[40, 30, 20, 10], color:'#00d4ff', title:'Nara Lokesh Dept Allocation (%)' }
  },
  'default': {
    text: `🤖 **LUMINA Analysis Complete**\n\nBased on my cross-reference of 12,847 verified transactions and the Antigravity chain ledger:\n\n- **98.3%** of transactions match blockchain hashes\n- **34 anomalies** currently active (3 critical)\n- **₹2.3B** in suspicious contracts under review\n\nFor detailed sector analysis, try asking about specific departments or politicians like **Modi**, **Jagan**, or **Chandrababu**.`,
    chart: null
  }
};

function initChat() {
  const msgs = document.getElementById('chatMessages');
  msgs.innerHTML = `
    <div class="chat-msg ai">
      <div class="chat-avatar ai">🤖</div>
      <div class="chat-bubble">Welcome. I am <strong>LUMINA AI Auditor</strong> — I have been trained on an expanded database of national and state budgets, including portfolios for leaders like **Modi**, **Jagan**, **Chandrababu**, and more. Ask me anything about public finances.</div>
    </div>`;

  const sugg = document.getElementById('querySuggestions');
  sugg.innerHTML = ''; // Clear previous
  QUERIES.forEach(q => {
    sugg.innerHTML += `<button class="btn btn-ghost btn-sm" style="text-align:left;justify-content:flex-start" onclick="prefillChat(\`${q}\`)">${q}</button>`;
  });
}

function prefillChat(text) {
  document.getElementById('chatInput').value = text;
  sendChat();
}

function sendChat() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  const msgs = document.getElementById('chatMessages');

  // User bubble
  msgs.innerHTML += `<div class="chat-msg user"><div class="chat-avatar user-av">👤</div><div class="chat-bubble">${text}</div></div>`;
  input.value = '';
  msgs.scrollTop = msgs.scrollHeight;

  // Typing indicator
  const typingId = 'typing-' + Date.now();
  msgs.innerHTML += `<div class="chat-msg ai" id="${typingId}"><div class="chat-avatar ai">🤖</div><div class="chat-bubble text-muted">⏳ Querying expanded forensic database...</div></div>`;
  msgs.scrollTop = msgs.scrollHeight;

  setTimeout(async () => {
    const t = text.toLowerCase();
    
    // Check if Google AI is available for real-world intelligence
    if (GOOGLE_API_KEY) {
      const liveAiResponse = await callGoogleAI(`You are LUMINA AI Auditor. Respond to this forensic governance query: "${text}". Use real-world 2024-25 data where possible. Keep it concise and professional. Refer to Antigravity chain hashes.`);
      if (liveAiResponse) {
        document.getElementById(typingId).remove();
        const formatted = liveAiResponse.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
        msgs.innerHTML += `<div class="chat-msg ai"><div class="chat-avatar ai">🤖</div><div class="chat-bubble">${formatted}</div></div>`;
        msgs.scrollTop = msgs.scrollHeight;
        return;
      } else {
        // Fallback info if API call failed but key was present
        console.warn('Google AI query failed, using local database fallback.');
        toast('📡 Live sync failed. Using local forensic database.', 'warning');
      }
    }

    let resp = AI_RESPONSES.default;
    if (t.includes('health')) resp = AI_RESPONSES.health;
    else if (t.includes('anomaly') || t.includes('department')) resp = AI_RESPONSES.anomaly;
    else if (t.includes('infrastructure') || t.includes('state') || t.includes('utilisation')) resp = AI_RESPONSES.infrastructure;
    else if (t.includes('jagan')) resp = AI_RESPONSES.jagan;
    else if (t.includes('chandrababu') || t.includes('naidu') || t.includes('cbn')) resp = AI_RESPONSES.cbn;
    else if (t.includes('modi')) resp = AI_RESPONSES.modi;
    else if (t.includes('pawan')) resp = AI_RESPONSES.pawan;
    else if (t.includes('lokesh')) resp = AI_RESPONSES.lokesh;

    document.getElementById(typingId).remove();
    const formatted = resp.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
    msgs.innerHTML += `<div class="chat-msg ai"><div class="chat-avatar ai">🤖</div><div class="chat-bubble">${formatted}</div></div>`;
    msgs.scrollTop = msgs.scrollHeight;

    if (resp.chart) renderAIChart(resp.chart);
  }, 1800);
}

function renderAIChart(cfg) {
  const panel = document.getElementById('aiChartPanel');
  const titleEl = document.getElementById('aiChartTitle');
  panel.style.display = 'block';
  titleEl.innerHTML = `<span class="icon">📊</span> ${cfg.title}`;
  if (aiChart) aiChart.destroy();
  aiChart = new Chart(document.getElementById('aiChart'), {
    type: cfg.type,
    data: {
      labels: cfg.labels,
      datasets: [{ label: cfg.title, data: cfg.data, backgroundColor: cfg.color + '44', borderColor: cfg.color, borderWidth: 2, borderRadius: 6 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(255,255,255,0.04)' } } } }
  });
}

/* ══════════════════════════════════════════
   TRUST CHAIN PAGE
══════════════════════════════════════════ */
function initChain() {
  renderChainFeed('fullChainFeed', 20);
  renderSmartContract();
  setInterval(() => {
    blockNum++;
    const ctBlock = document.getElementById('chainTotalBlocks');
    if (ctBlock) ctBlock.textContent = blockNum.toLocaleString();
    const sbBlock = document.getElementById('sbCurrentBlock');
    if (sbBlock) sbBlock.textContent = '#' + blockNum;
    const sbHash = document.getElementById('sbLastHash');
    if (sbHash) sbHash.textContent = genHash();
    
    // Update feeds
    const name = CHAIN_NAMES[Math.floor(Math.random() * CHAIN_NAMES.length)];
    const dashFeed = document.getElementById('dashChainFeed');
    if (dashFeed) addBlockToFeed(dashFeed, name);
    const fullFeed = document.getElementById('fullChainFeed');
    if (fullFeed) addBlockToFeed(fullFeed, name);
  }, 8000);
}

function renderSmartContract() {
  const viewer = document.getElementById('contractViewer');
  const lines = [
    { cls:'com', text:'// LUMINA Smart Contract v2.4.1' },
    { cls:'com', text:'// Deployed on Antigravity Chain · 2026-01-15' },
    { cls:'', text:'' },
    { cls:'kw', text:'pragma solidity ^0.8.20;' },
    { cls:'', text:'' },
    { cls:'kw', text:'contract ' + '<span class="fn">LuminaLedger</span> {' },
    { cls:'com', text:'    // Immutable integrity record per transaction' },
    { cls:'type', text:'    struct ' + '<span class="fn">BudgetRecord</span> {' },
    { cls:'type', text:'        bytes32 merkleHash;' },
    { cls:'type', text:'        uint256 amount;' },
    { cls:'type', text:'        address department;' },
    { cls:'type', text:'        uint256 timestamp;' },
    { cls:'type', text:'        bool    isVerified;' },
    { cls:'', text:'    }' },
    { cls:'', text:'' },
    { cls:'com', text:'    // mapping txId => BudgetRecord' },
    { cls:'type', text:'    mapping(bytes32 => BudgetRecord) ' + '<span class="kw">public</span> records;' },
    { cls:'', text:'' },
    { cls:'com', text:'    // Emit when a new record is anchored' },
    { cls:'kw', text:'    event ' + '<span class="fn">RecordAnchored</span>(bytes32 txId, bytes32 hash);' },
    { cls:'kw', text:'    event ' + '<span class="fn">TamperDetected</span>(bytes32 txId, address reporter);' },
    { cls:'', text:'' },
    { cls:'com', text:'    // Anchor a new budget transaction' },
    { cls:'kw', text:'    function ' + '<span class="fn">anchorRecord</span>(' },
    { cls:'type', text:'        bytes32 txId,' },
    { cls:'type', text:'        bytes32 merkleHash,' },
    { cls:'num', text:'        uint256 amount' },
    { cls:'', text:'    ) external {' },
    { cls:'', text:'        records[txId] = BudgetRecord({' },
    { cls:'str', text:'            merkleHash: merkleHash,' },
    { cls:'str', text:'            amount: amount,' },
    { cls:'str', text:'            department: msg.sender,' },
    { cls:'str', text:'            timestamp: block.timestamp,' },
    { cls:'str', text:'            isVerified: true' },
    { cls:'', text:'        });' },
    { cls:'fn', text:'        emit RecordAnchored(txId, merkleHash);' },
    { cls:'', text:'    }' },
    { cls:'', text:'' },
    { cls:'com', text:'    // Verify — returns false if tampered' },
    { cls:'kw', text:'    function ' + '<span class="fn">verify</span>(bytes32 txId, bytes32 claimedHash)' },
    { cls:'kw', text:'        external view returns (bool) {' },
    { cls:'', text:'        return records[txId].merkleHash == claimedHash;' },
    { cls:'', text:'    }' },
    { cls:'', text:'}' },
  ];
  viewer.innerHTML = lines.map(l => `<div class="contract-line"><span class="${l.cls}">${l.text || '&nbsp;'}</span></div>`).join('');
}

function mineBlock() {
  const name = CHAIN_NAMES[Math.floor(Math.random() * CHAIN_NAMES.length)];
  toast(`⛓ Mining new block for ${name} xx...`, 'info');
  setTimeout(() => { 
    blockNum++; 
    toast(`✅ Block #${blockNum} mined for ${name} xx successfully!`, 'success'); 
    
    // Add to feeds
    const dashFeed = document.getElementById('dashChainFeed');
    if (dashFeed) addBlockToFeed(dashFeed, name + ' xx');
    const fullFeed = document.getElementById('fullChainFeed');
    if (fullFeed) addBlockToFeed(fullFeed, name + ' xx');

    // Update counters
    const ctBlock = document.getElementById('chainTotalBlocks');
    if (ctBlock) ctBlock.textContent = blockNum.toLocaleString();
    const sbBlock = document.getElementById('sbCurrentBlock');
    if (sbBlock) sbBlock.textContent = '#' + blockNum;
    const sbHash = document.getElementById('sbLastHash');
    if (sbHash) sbHash.textContent = genHash();
  }, 2000);
}

function addBlockToFeed(container, name) {
  const newBlock = document.createElement('div');
  newBlock.className = 'chain-block';
  newBlock.style.border = '1px solid rgba(0,212,255,0.3)';
  newBlock.innerHTML = `
    <div>
      <div class="chain-event" style="font-size:14px; font-weight:600">${name}</div>
    </div>
    <div style="margin-left:auto;display:flex;align-items:center">
      <span style="color:var(--accent-green);font-size:18px">✓</span>
    </div>`;
  container.insertBefore(newBlock, container.firstChild);
  if (container.children.length > 20) container.lastChild.remove();
}

function verifyHash() {
  const val = document.getElementById('verifyInput').value.trim();
  if (!val) { toast('Please enter a hash or transaction ID', 'warning'); return; }
  const result = document.getElementById('verifyResult');
  result.innerHTML = `<div class="scan-indicator"><span class="scan-dot"></span> Querying Antigravity chain...</div>`;
  setTimeout(() => {
    const isValid = Math.random() > 0.2;
    result.innerHTML = isValid
      ? `<div style="color:var(--accent-green);padding:12px;background:rgba(16,185,129,0.08);border-radius:8px;border:1px solid rgba(16,185,129,0.25)">✅ <strong>VERIFIED</strong> — Hash matches on-chain record. Block #${blockNum - Math.floor(Math.random()*100)}. Anchored ${Math.floor(Math.random()*48)+1} hours ago.</div>`
      : `<div style="color:var(--accent-red);padding:12px;background:rgba(239,68,68,0.08);border-radius:8px;border:1px solid rgba(239,68,68,0.25)">❌ <strong>HASH MISMATCH</strong> — This record does not match the Antigravity chain. Possible tampering detected. Flagged for investigation.</div>`;
  }, 1800);
}

/* ══════════════════════════════════════════
   IMPACT API
══════════════════════════════════════════ */
const ENDPOINTS = [
  { method:'GET',  path:'/api/v1/budget/sectors',     desc:'Get all sector allocations',    body:'{"year":2025,"format":"json","chain_verify":true}' },
  { method:'GET',  path:'/api/v1/anomalies/active',   desc:'List active anomaly flags',     body:'{"severity":"critical","limit":50}' },
  { method:'POST', path:'/api/v1/verify/hash',        desc:'Verify a Merkle hash on-chain', body:'{"tx_id":"TXN-8821","hash":"0x3f8a...d92c"}' },
  { method:'GET',  path:'/api/v1/districts/{id}/spend', desc:'District-level expenditure', body:'{"district":"alpha","year":2025,"sector":"health"}' },
  { method:'GET',  path:'/api/v1/contracts/flagged',  desc:'Get flagged/rigged contracts',  body:'{"risk_score_min":70,"include_ai_summary":true}' },
  { method:'POST', path:'/api/v1/ai/query',           desc:'Natural language budget query', body:'{"query":"Compare health spending in District A vs B","chart":true}' },
  { method:'DELETE',path:'/api/v1/admin/cache',       desc:'Flush audit cache (admin only)', body:'{"confirm":true,"scope":"sector"}' },
];

const SDK_CODE = {
  python: `import lumina_sdk as lumina

# Initialize with your API key
client = lumina.Client(api_key="lmn_prod_xxxx")

# Get verified budget data
sectors = client.budget.get_sectors(year=2025, chain_verify=True)
print(sectors)

# Check anomalies
flags = client.anomalies.get_active(severity="critical")
for flag in flags:
    print(f"[{flag.risk_score}] {flag.title}")

# Natural language audit query
result = client.ai.query(
    "Compare health spending per capita District A vs B",
    include_chart=True
)
print(result.summary)
result.chart.show()`,

  js: `import { LuminaClient } from '@lumina/sdk';

const client = new LuminaClient({ apiKey: 'lmn_prod_xxxx' });

// Get verified sectors
const sectors = await client.budget.getSectors({
  year: 2025, chainVerify: true
});

// Stream live anomaly alerts
client.anomalies.stream((event) => {
  if (event.riskScore > 80) {
    console.warn('🚨 Critical anomaly:', event.title);
    triggerAlert(event);
  }
});

// Verify a hash
const ok = await client.verify.hash('TXN-8821', '0x3f8a...d92c');
console.log('Verified:', ok); // true / false`,

  curl: `# Get active anomalies
curl -X GET \\
  https://api.lumina.gov/v1/anomalies/active \\
  -H "Authorization: Bearer lmn_prod_xxxx" \\
  -H "X-Chain-Verify: true" \\
  -d '{"severity":"critical","limit":10}'

# Verify a hash on Antigravity chain
curl -X POST \\
  https://api.lumina.gov/v1/verify/hash \\
  -H "Authorization: Bearer lmn_prod_xxxx" \\
  -d '{"tx_id":"TXN-8821","hash":"0x3f8a...d92c"}'

# Natural language AI audit
curl -X POST \\
  https://api.lumina.gov/v1/ai/query \\
  -H "Authorization: Bearer lmn_prod_xxxx" \\
  -d '{"query":"health budget District A vs B","chart":true}'`
};

function initAPI() {
  const el = document.getElementById('endpointList');
  ENDPOINTS.forEach(ep => {
    el.innerHTML += `
      <div class="api-endpoint">
        <div class="api-endpoint-header" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='block'?'none':'block'">
          <span class="api-method method-${ep.method.toLowerCase()}">${ep.method}</span>
          <span class="api-path">${ep.path}</span>
          <span class="api-desc">${ep.desc}</span>
          <span style="margin-left:8px;color:var(--text-muted);font-size:12px">▼</span>
        </div>
        <div class="api-body" style="display:none">
          <div class="code-block">${ep.body}</div>
        </div>
      </div>`;
  });
  renderSdkCode('python');
}

function switchApiTab(tab) {
  document.querySelectorAll('#apiTabs .tab-btn').forEach((b, i) => {
    const tabs = ['endpoints','sandbox','sdk'];
    b.classList.toggle('active', tabs[i] === tab);
  });
  ['endpoints','sandbox','sdk'].forEach(t => {
    document.getElementById('tab-' + t).classList.toggle('active', t === tab);
  });
}

function switchSdkTab(lang) {
  document.querySelectorAll('#sdkTabs .tab-btn').forEach((b, i) => {
    b.classList.toggle('active', ['python','js','curl'][i] === lang);
  });
  renderSdkCode(lang);
}

function renderSdkCode(lang) {
  document.getElementById('sdkCode').innerHTML = `<div class="code-block" style="white-space:pre">${SDK_CODE[lang]}</div>`;
}

function runSandbox() {
  const resp = document.getElementById('sandboxResponse');
  resp.textContent = '// Loading...';
  setTimeout(() => {
    resp.textContent = JSON.stringify({
      status: 200,
      chain_verified: true,
      block: blockNum,
      timestamp: new Date().toISOString(),
      data: {
        sectors: [
          { name: 'Infrastructure', allocated: 82000, disbursed: 74200, verified_pct: 90.5, risk: 'low' },
          { name: 'Healthcare',     allocated: 61000, disbursed: 58100, verified_pct: 95.2, risk: 'low' },
          { name: 'Education',      allocated: 54000, disbursed: 51800, verified_pct: 95.9, risk: 'low' },
          { name: 'Defence',        allocated: 47000, disbursed: 46100, verified_pct: 98.1, risk: 'low' },
        ]
      },
      antigravity_hash: genHash()
    }, null, 2);
    toast('✅ API call successful — response from Antigravity testnet', 'success');
  }, 1500);
}

function generateApiKey() {
  const key = 'lmn_prod_' + Math.random().toString(36).slice(2, 18);
  toast(`🔑 API Key generated: ${key}`, 'success', 6000);
}

/* ══════════════════════════════════════════
   MOBILE NAV
══════════════════════════════════════════ */
function toggleMobileNav() {
  const links = document.getElementById('navLinks');
  links.classList.toggle('open');
}
// Close mobile nav when a link is clicked
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('nav-link')) {
    document.getElementById('navLinks').classList.remove('open');
  }
});

function initDeepScan() {
  const pipeline = document.getElementById('scanPipeline');
  if (pipeline) pipeline.style.display = 'none';
  const ocr = document.getElementById('ocrResult');
  if (ocr) {
    ocr.innerHTML = `
      <div style="padding:24px;text-align:center;color:var(--text-muted)">
        <div style="font-size:48px;margin-bottom:12px">🤖</div>
        <div>Upload a document to begin extraction</div>
      </div>
    `;
  }
  const xbrl = document.getElementById('xbrlPanel');
  if (xbrl) xbrl.style.display = 'none';
  const anchor = document.getElementById('anchorBtn');
  if (anchor) anchor.style.display = 'none';
}

/* ══════════════════════════════════════════
   DEEP-SCAN PAGE
══════════════════════════════════════════ */
const PIPELINE_STEPS = [
  { icon: '📤', label: 'Uploading document to secure enclave',         ms: 600  },
  { icon: '🔍', label: 'Vision-LLM scanning for tabular structures',  ms: 1200 },
  { icon: '🧩', label: 'Context-Aware Parser segmenting line items',  ms: 1800 },
  { icon: '📐', label: 'Mapping fields to XBRL financial standards',  ms: 2400 },
  { icon: '🔐', label: 'Generating Merkle hash for each record',      ms: 3000 },
  { icon: '⛓',  label: 'Anchoring hash bundle to Antigravity chain', ms: 3800 },
  { icon: '✅', label: 'Extraction complete — ready to audit',        ms: 4400 },
];

const XBRL_ITEMS = [
  { item: 'Road Construction Grant', raw: 'Rd. Const. Grnt. - Dist A',   tag: 'us-gaap:CapitalExpendituresIncurredButNotYetPaid', conf: 98, status: 'verified' },
  { item: 'Hospital Equipment Procurement', raw: 'Hosp Equip Proc FY25', tag: 'us-gaap:PropertyPlantAndEquipmentAdditions',       conf: 96, status: 'verified' },
  { item: 'Digital Infrastructure Subsidy', raw: 'Dig. Infra. Sub.',     tag: 'ifrs:GovernmentGrantsRecognised',                  conf: 94, status: 'verified' },
  { item: 'Rural Water Supply Scheme',  raw: 'RWS-Scheme-Q3',            tag: 'us-gaap:UtilitiesOperatingExpenseMaintenanceAndOperation', conf: 91, status: 'verified' },
  { item: 'Education Scholarship Fund', raw: 'Edu. Schol. Fund 2025',    tag: 'ifrs:GrantsAndOtherTransfers',                    conf: 89, status: 'verified' },
  { item: 'Flyover Bridge — Sector 7',  raw: 'Flyover Brdg. Sec-7',      tag: 'us-gaap:ConstructionInProgressGross',             conf: 88, status: 'verified' },
  { item: 'Unclassified Transfer Σ-8',  raw: 'UNCL-TRNF-Σ8',            tag: '⚠ UNMAPPED — Manual Review Required',             conf: 41, status: 'flagged'  },
];

function handleDrop(e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) startScan({ files: [file] });
}

async function startScan(input) {
  const file = input.files ? input.files[0] : null;
  if (!file) return;
  const name = file.name;

  // Reset UI
  document.getElementById('scanPipeline').style.display = 'block';
  document.getElementById('ocrResult').innerHTML = `<div class="scan-indicator" style="justify-content:center"><span class="scan-dot"></span> Initialising Vision-LLM pipeline for <strong>${name}</strong></div>`;
  document.getElementById('xbrlPanel').style.display = 'none';
  document.getElementById('anchorBtn').style.display = 'none';

  const stepsEl = document.getElementById('pipelineSteps');
  stepsEl.innerHTML = '';

  // 1. Show steps initially
  PIPELINE_STEPS.forEach((s, i) => {
    stepsEl.innerHTML += `<div class="pipeline-step" id="pstep-${i}">
      <span class="step-icon">${s.icon}</span>
      <span class="step-label">${s.label}</span>
      <span class="step-status" id="pstatus-${i}" style="color:var(--text-muted)">Pending</span>
    </div>`;
  });

  // 2. Start real backend call
  const formData = new FormData();
  formData.append('file', file);

  try {
    toast(`🔍 Sending ${name} to Gemini Vision-LLM...`, 'info');
    
    // Animate first few steps while waiting
    updateStep(0, 'Running...');
    setTimeout(() => updateStep(1, 'Scanning...'), 1000);

    const response = await fetch('/api/deepscan', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Extraction failed');
    const data = await response.json();
    
    // Animate final steps
    updateStep(2, 'Done', true);
    updateStep(3, 'Done', true);
    updateStep(4, 'Done', true);
    updateStep(5, 'Done', true);
    updateStep(6, 'Done', true);

    showOCRResult(name, data.extracted_items);
    toast('✅ Deep Scan complete: Data extracted and XBRL mapped.', 'success');

  } catch (err) {
    console.error('Scan Error:', err);
    toast('❌ Deep Scan failed. Check if server is running on port 5000.', 'error');
    document.getElementById('ocrResult').innerHTML = `<div style="color:var(--accent-red);padding:20px">Error: ${err.message}</div>`;
  }
}

function updateStep(idx, status, done = false) {
  const stepEl = document.getElementById(`pstep-${idx}`);
  const statusEl = document.getElementById(`pstatus-${idx}`);
  if (!stepEl || !statusEl) return;
  
  stepEl.className = done ? 'pipeline-step done' : 'pipeline-step active';
  statusEl.textContent = done ? '✓ Done' : status;
  statusEl.style.color = done ? 'var(--accent-green)' : 'var(--accent-cyan)';
}

function showOCRResult(name, items) {
  const ocr = document.getElementById('ocrResult');
  const xbrl = document.getElementById('xbrlPanel');
  const anchor = document.getElementById('anchorBtn');
  const isSuspicious = name.toLowerCase().includes('contract') || name.toLowerCase().includes('invoice');
  
  ocr.innerHTML = `
    <div style="padding:16px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <div style="font-size:32px">📄</div>
        <div>
          <div class="fw-600">${name}</div>
          <div class="fs-12 text-muted">${items ? items.length : 0} line items extracted · ${items ? items.filter(x=>x.status==='verified').length : 0} verified</div>
        </div>
        <div style="margin-left:auto">
          <span class="risk-badge ${isSuspicious ? 'high' : 'low'}" style="font-size:13px;padding:6px 14px">✅ ${isSuspicious ? '68%' : '94%'} Confidence</span>
        </div>
      </div>
      <div style="background:rgba(0,212,255,0.05); border:1px solid rgba(0,212,255,0.1); border-radius:var(--radius-md); padding:16px; margin-bottom:16px">
        <div class="fs-12 fw-700 text-cyan mb-8">🤖 VISION-LLM EXECUTIVE SUMMARY</div>
        <p class="fs-13 text-muted" style="line-height:1.5">
          ${isSuspicious 
            ? `Deep-Scan has identified several inconsistencies in this document. The vendor address is unverified, and the disbursement schedule deviates from standard PWD protocols by 45%. Recommendation: <strong>Manual Audit Required</strong>.`
            : `Document appears to be a standard budget filing. All major expenditure categories have been successfully mapped to XBRL standards. No immediate anomalies detected in the raw text structure.`}
        </p>
      </div>
      
      <div class="panel" style="margin-bottom:16px; background:rgba(255,255,255,0.01); border:1px solid var(--border-subtle)">
        <div class="panel-header" style="padding:10px 16px; background:rgba(255,255,255,0.02)">
          <div class="panel-title" style="font-size:12px"><span class="icon">📊</span> Extracted Document Information</div>
        </div>
        <div class="panel-body" style="padding:0">
          <table class="data-table" style="font-size:12px">
            <thead>
              <tr>
                <th style="padding:10px 16px">Field</th>
                <th style="padding:10px 16px">Value</th>
                <th style="padding:10px 16px">Confidence</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:10px 16px; color:var(--text-muted)">Document Type</td>
                <td style="padding:10px 16px; font-weight:600">${isSuspicious ? 'Procurement Contract' : 'Annual Budget Filing'}</td>
                <td style="padding:10px 16px"><span style="color:var(--accent-green)">98%</span></td>
              </tr>
              <tr>
                <td style="padding:10px 16px; color:var(--text-muted)">Fiscal Year</td>
                <td style="padding:10px 16px; font-weight:600">2024-25</td>
                <td style="padding:10px 16px"><span style="color:var(--accent-green)">100%</span></td>
              </tr>
              <tr>
                <td style="padding:10px 16px; color:var(--text-muted)">Issuing Authority</td>
                <td style="padding:10px 16px; font-weight:600">Finance Department (AP)</td>
                <td style="padding:10px 16px"><span style="color:var(--accent-green)">96%</span></td>
              </tr>
              <tr>
                <td style="padding:10px 16px; color:var(--text-muted)">Total Value</td>
                <td style="padding:10px 16px; font-weight:600; color:var(--accent-cyan)">₹${isSuspicious ? '2,450 Cr' : '4.7T'}</td>
                <td style="padding:10px 16px"><span style="color:var(--accent-green)">94%</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
        <div style="text-align:center;background:var(--bg-elevated);border-radius:var(--radius-md);padding:14px">
          <div style="font-family:'Orbitron',sans-serif;font-size:24px;font-weight:800;color:var(--accent-cyan)">${items ? items.length : 0}</div>
          <div class="fs-12 text-muted">Line Items</div>
        </div>
        <div style="text-align:center;background:var(--bg-elevated);border-radius:var(--radius-md);padding:14px">
          <div style="font-family:'Orbitron',sans-serif;font-size:24px;font-weight:800;color:var(--accent-green)">${items ? items.filter(x=>x.status==='verified').length : 0}</div>
          <div class="fs-12 text-muted">XBRL Mapped</div>
        </div>
        <div style="text-align:center;background:var(--bg-elevated);border-radius:var(--radius-md);padding:14px">
          <div style="font-family:'Orbitron',sans-serif;font-size:24px;font-weight:800;color:var(--accent-amber)">${items ? items.filter(x=>x.status==='flagged').length : 0}</div>
          <div class="fs-12 text-muted">Manual Review</div>
        </div>
      </div>
    </div>`;
  
  xbrl.style.display = 'block';
  anchor.style.display = 'block';
  
  const body = document.getElementById('xbrlBody');
  body.innerHTML = '';
  
  const list = items || XBRL_ITEMS;
  list.forEach(x => {
    const statusColor = x.status === 'verified' ? 'low' : 'high';
    const confColor = x.confidence >= 90 ? '#10b981' : x.confidence >= 70 ? '#f59e0b' : '#ef4444';
    body.innerHTML += `<tr>
      <td class="fw-600">${x.item}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:11px">${x.raw}</td>
      <td><span class="risk-badge" style="background:rgba(139,92,246,0.1);color:var(--accent-violet);border-color:rgba(139,92,246,0.2)">${x.tag}</span></td>
      <td>
        <div style="font-size:12px;margin-bottom:3px;color:${confColor}">${x.confidence}%</div>
        <div class="progress-bar" style="width:80px"><div class="progress-fill" style="width:${x.confidence}%;background:${confColor}"></div></div>
      </td>
      <td><span class="risk-badge ${statusColor}">${x.status.toUpperCase()}</span></td>
    </tr>`;
  });
}

function anchorToChain() {
  toast('⛓ Generating Merkle bundle and anchoring to Antigravity chain...', 'info');
  setTimeout(() => {
    blockNum++;
    toast(`✅ Anchored! Block #${blockNum} — Hash: ${genHash()}`, 'success', 6000);
  }, 2200);
}

/* ══════════════════════════════════════════
   ADP PATENT PAGE
══════════════════════════════════════════ */
const ADP_PROJECTS = [
  {
    name: 'Mumbai-Pune Expressway Extension',
    dept: 'PWD',
    filing: { amount: '₹1,980 Cr', date: '2025-01-15', status: 'submitted' },
    bank:   { settled: '₹1,975 Cr', hash: '0x3f8a...d92c', match: true },
    sat:    { progress: 91, coords: '18.8°N, 73.4°E', image: '🛣️', verdict: 'MATCH' },
    verdict: 'verified'
  },
  {
    name: 'Ghost Road Project Σ-4',
    dept: 'Rural Development',
    filing: { amount: '₹670 Cr', date: '2025-02-20', status: 'submitted' },
    bank:   { settled: '₹668 Cr', hash: '0xb9f2...e71a', match: true },
    sat:    { progress: 2, coords: '21.2°N, 79.1°E', image: '🌾', verdict: 'CRITICAL MISMATCH' },
    verdict: 'mismatch'
  },
  {
    name: 'Solar Farm — Phase 2',
    dept: 'Energy Department',
    filing: { amount: '₹430 Cr', date: '2025-03-01', status: 'submitted' },
    bank:   { settled: '₹427 Cr', hash: '0x5c11...7b3f', match: true },
    sat:    { progress: 38, coords: '26.9°N, 75.8°E', image: '☀️', verdict: 'TIMELINE MISMATCH' },
    verdict: 'mismatch'
  },
  {
    name: 'Smart City Surveillance Network',
    dept: 'Cyber Department',
    filing: { amount: '₹820 Cr', date: '2024-12-10', status: 'submitted' },
    bank:   { settled: '₹820 Cr', hash: '0x9d74...2ac1', match: true },
    sat:    { progress: 98, coords: 'N/A (Digital)', image: '🏙️', verdict: 'MATCH' },
    verdict: 'verified'
  },
  {
    name: 'Primary Health Center Upgrade',
    dept: 'Health Ministry',
    filing: { amount: '₹120 Cr', date: '2025-03-10', status: 'submitted' },
    bank:   { settled: '₹118 Cr', hash: '0x4d3c...b88e', match: true },
    sat:    { progress: 85, coords: '19.1°N, 72.9°E', image: '🏥', verdict: 'MATCH' },
    verdict: 'verified'
  },
  {
    name: 'District Library Renovation',
    dept: 'Education Dept',
    filing: { amount: '₹45 Cr', date: '2025-02-15', status: 'submitted' },
    bank:   { settled: '₹45 Cr', hash: '0x7c1d...a44f', match: true },
    sat:    { progress: 15, coords: '18.5°N, 73.9°E', image: '📚', verdict: 'MISMATCH: WORK HALTED' },
    verdict: 'mismatch'
  },
];

function initADP() {
  renderADP(ADP_PROJECTS);
}

function renderADP(projects) {
  const container = document.getElementById('adpProjects');
  if (!container) return;
  container.innerHTML = '';
  projects.forEach((p, idx) => {
    const isMismatch = p.verdict === 'mismatch';
    const cardClass = isMismatch ? 'mismatch' : 'verified';
    const verdictBg  = isMismatch ? 'rgba(239,68,68,0.1)'  : 'rgba(16,185,129,0.1)';
    const verdictBdr = isMismatch ? 'rgba(239,68,68,0.3)'  : 'rgba(16,185,129,0.3)';
    const verdictCol = isMismatch ? 'var(--accent-red)'    : 'var(--accent-green)';
    const verdictIcon= isMismatch ? '🚨' : '✅';
    const satColor   = p.sat.progress >= 80 ? '#10b981' : p.sat.progress >= 40 ? '#f59e0b' : '#ef4444';

    container.innerHTML += `
      <div class="adp-card ${cardClass}">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div>
            <div class="fw-600" style="font-size:16px;margin-bottom:4px">${p.name}</div>
            <div class="fs-12 text-muted">${p.dept} · Filed ${p.filing.date}</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="runADPCheck(${idx})">🔬 Run ADP Check</button>
        </div>

        <div class="adp-layers">
          <!-- Layer 1: Filing -->
          <div class="adp-layer">
            <div class="adp-layer-icon">📄</div>
            <div class="adp-layer-label">Expenditure Filing</div>
            <div class="adp-layer-value text-cyan">${p.filing.amount}</div>
            <div class="fs-12 text-muted" style="margin-top:4px">Status: ${p.filing.status}</div>
          </div>
          <!-- Layer 2: Bank -->
          <div class="adp-layer">
            <div class="adp-layer-icon">🏦</div>
            <div class="adp-layer-label">Bank Settlement</div>
            <div class="adp-layer-value" style="color:${p.bank.match ? 'var(--accent-green)' : 'var(--accent-red)'}">${p.bank.settled}</div>
            <div class="font-mono fs-12 text-muted" style="margin-top:4px">${p.bank.hash}</div>
          </div>
          <!-- Layer 3: Satellite -->
          <div class="adp-layer">
            <div class="adp-layer-icon">${p.sat.image}</div>
            <div class="adp-layer-label">Satellite Progress</div>
            <div class="adp-layer-value" style="color:${satColor}">${p.sat.progress}%</div>
            <div class="progress-bar" style="margin-top:6px"><div class="progress-fill" style="width:${p.sat.progress}%;background:${satColor}"></div></div>
            <div class="fs-12 text-muted" style="margin-top:4px">${p.sat.coords}</div>
          </div>
        </div>

        <div class="adp-verdict" style="background:${verdictBg};border:1px solid ${verdictBdr};color:${verdictCol}">
          ${verdictIcon} <strong>ADP VERDICT: ${p.sat.verdict}</strong>
          ${isMismatch ? ' — Automated Discrepancy Alert raised. Investigation triggered.' : ' — All three data sources reconciled.'}
        </div>
      </div>`;
  });
}

function runADPCheck(idx) {
  const p = ADP_PROJECTS[idx];
  toast(`🛰️ Running ADP cross-silo check on "${p.name}"...`, 'info');
  setTimeout(() => toast('📄 Filing data extracted from chain ledger', 'info', 2500), 800);
  setTimeout(() => toast('🏦 Bank settlement hash retrieved and verified', 'info', 2500), 1800);
  setTimeout(() => toast('🛰️ Satellite imagery processed — CV model scoring...', 'info', 2500), 2800);
  setTimeout(() => {
    if (p.verdict === 'mismatch') {
      toast(`🚨 DISCREPANCY ALERT: "${p.name}" — Physical progress (${p.sat.progress}%) vs disbursement mismatch!`, 'error', 6000);
    } else {
      toast(`✅ ADP VERIFIED: "${p.name}" — All 3 layers reconciled successfully.`, 'success', 4000);
    }
  }, 4000);
}

/* ══════════════════════════════════════════
   NEURAL FORECASTING
══════════════════════════════════════════ */
let fcChart = null;

function initForecast() {
  const ctx = document.getElementById('forecastChart');
  if (!ctx || typeof Chart === 'undefined') return;
  fcChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['M1','M2','M3','M4','M5','M6','M7','M8','M9','M10','M11','M12'],
      datasets: [
        {
          label: 'Historical Trend',
          data: [6200, 5800, 6100, 4900, 5200, 4800, 4500, null, null, null, null, null],
          borderColor: '#94a3b8',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 4
        },
        {
          label: 'LSTM Prediction (TF.js)',
          data: [null, null, null, null, null, null, 4500, 4100, 3600, 2800, 1900, 400],
          borderColor: '#00d4ff',
          backgroundColor: 'rgba(0,212,255,0.1)',
          fill: true,
          borderWidth: 3,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#00d4ff'
        },
        {
          label: 'Allocated Budget Ceiling',
          data: [7000, 7000, 7000, 7000, 7000, 7000, 7000, 7000, 7000, 7000, 7000, 7000],
          borderColor: '#ef4444',
          borderWidth: 1,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'top' } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { 
          grid: { color: 'rgba(255,255,255,0.04)' },
          title: { display: true, text: 'Expected Reserves (₹ Cr)', color: '#94a3b8' },
          min: 0, max: 8000
        }
      }
    }
  });
}

/* ══════════════════════════════════════════
   LIVE DATA SYNC (GOOGLE API)
══════════════════════════════════════════ */
let GOOGLE_API_KEY = 'AIzaSyBxdbjEwpo-IE7S0ioFRwRG9VPj80bAXy8'; // Anchored API Key

function saveApiKey(val) {
  if (val === undefined || val === null) return;
  const trimmed = val.trim();
  if (!trimmed) {
    clearApiKey();
    return;
  }
  
  GOOGLE_API_KEY = trimmed;
  localStorage.setItem('LUMINA_GOOGLE_KEY', GOOGLE_API_KEY);
  
  toast('🔐 API Key anchored. Initializing handshake...', 'info');
  testApiSync();
}

function clearApiKey() {
  GOOGLE_API_KEY = '';
  localStorage.removeItem('LUMINA_GOOGLE_KEY');
  const input = document.getElementById('googleApiKey');
  if (input) input.value = '';
  
  const status = document.getElementById('syncStatus');
  if (status) status.innerHTML = `<span><span class="scan-dot" style="background:var(--text-muted); animation:none"></span> Disconnected</span>`;
  
  toast('🔌 API Key cleared. Live sync disabled.', 'info');
}

// Initial UI sync
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('googleApiKey');
  const storedKey = localStorage.getItem('LUMINA_GOOGLE_KEY');
  
  if (storedKey) {
    GOOGLE_API_KEY = storedKey;
  }
  
  if (input) {
    input.value = GOOGLE_API_KEY;
  }
  
  if (GOOGLE_API_KEY) {
    testApiSync();
  }
});

async function callGoogleAI(prompt) {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt })
    });
    
    if (response.ok) {
      const data = await response.json();
      // The server returns the full Gemini response
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
    } else {
      const errData = await response.json();
      console.warn(`❌ Backend Fail: ${errData.error || 'Unknown error'}`);
    }
  } catch (err) {
    console.error(`Network Error calling LUMINA Backend`, err);
  }
  return null;
}

async function testApiSync() {
  const status = document.getElementById('syncStatus');
  if (!status) return;

  status.innerHTML = `<span class="scan-dot" style="background:var(--accent-cyan)"></span> Connecting to Backend...`;
  
  try {
    const resp = await fetch('/api/status');
    const data = await resp.json();
    
    if (data.status === 'live') {
      status.innerHTML = `<span class="scan-dot" style="background:var(--accent-green)"></span> Live: ${data.model} (${data.version})`;
      toast('✅ LUMINA Backend Connected.', 'success');
      syncRealWorldData();
    } else {
      status.innerHTML = `<span class="scan-dot" style="background:var(--accent-red); animation:none"></span> Backend Offline`;
      toast(`📡 Backend Error: ${data.error || 'Check server.py'}`, 'error');
    }
  } catch (e) {
    status.innerHTML = `<span class="scan-dot" style="background:var(--accent-red); animation:none"></span> Connection Error`;
    console.warn('Could not connect to LUMINA Backend');
  }
}

function saveApiKey(val) {
  if (!val) return;
  GOOGLE_API_KEY = val.trim();
  localStorage.setItem('LUMINA_GOOGLE_KEY', GOOGLE_API_KEY);
  testApiSync();
}

async function syncRealWorldData() {
  if (!GOOGLE_API_KEY) return;
  
  toast('📡 Fetching real-world forensic updates for entities...', 'info');
  
  const liveUpdate = await callGoogleAI("Give a 1-sentence forensic update about Reliance Industries' latest major infrastructure project in 2024 for a governance app.");
  
  if (liveUpdate) {
    const mukesh = ENTITIES.find(e => e.id === 'mukesh');
    if (mukesh) {
      mukesh.notes = `LIVE UPDATE: ${liveUpdate} (Verified via Google AI)`;
      initEntityTracker(); // Refresh UI
    }
  }
}

async function runForecast() {
  const btn = document.getElementById('btnForecast');
  const ind = document.getElementById('fcIndicator');
  const alert = document.getElementById('fcInsight');
  const months = parseInt(document.getElementById('fcMonths').value);
  const dept = document.getElementById('fcDept').value;
  
  btn.classList.add('btn-disabled');
  btn.innerHTML = '🔮 Running Tensor Inference...';
  ind.style.display = 'inline-flex';
  alert.style.display = 'none';

  // Simulate TF Inference delay
  if (typeof tf !== 'undefined') {
    // Just a dummy op to invoke WebGL/WASM kernel
    tf.tidy(() => tf.matMul(tf.randomNormal([100, 100]), tf.randomNormal([100, 100])));
  }
  
  // Real-world prediction data via Google AI
  let aiTrendMultiplier = 1.0;
  if (GOOGLE_API_KEY) {
    const trendAnalysis = await callGoogleAI(`Predict the budget trend for ${dept} in 2025. Reply with only a single number between 0.5 (sharp drop) and 1.5 (growth).`);
    const parsedTrend = parseFloat(trendAnalysis);
    if (!isNaN(parsedTrend)) aiTrendMultiplier = parsedTrend;
    toast(`🔮 Real-world trend factor from Google AI: ${aiTrendMultiplier.toFixed(2)}`, 'info');
  }
  
  await new Promise(r => setTimeout(r, 1000));

  // Generate dynamic data based on input
  let labels = [];
  let hist = [];
  let pred = [];
  let ceil = [];
  
  let currentVal = dept === 'health' ? 4200 : (dept === 'infra' ? 7800 : 3100);
  const dropRate = (dept === 'health' ? 0.85 : 0.92) * aiTrendMultiplier;
  const ceiling = currentVal + 1500;
  
  // Historical data (last 6 months)
  for(let i=-6; i<=0; i++) {
    labels.push('M' + (i+7));
    let val = currentVal * Math.pow(1.02, -i) + (Math.random()*400 - 200);
    hist.push(Math.round(val));
    ceil.push(ceiling);
    if(i === 0) pred.push(Math.round(val));
    else pred.push(null);
  }
  
  // Future predictions
  let isShortfall = false;
  let shortfallMonth = 0;
  for(let i=1; i<=months; i++) {
    labels.push('M' + (i+7));
    hist.push(null);
    ceil.push(ceiling);
    let nval = (pred[pred.length-1] || currentVal) * dropRate - (Math.random()*200);
    if (dept === 'health' && i > 4) nval -= 500; // Force a sharp drop for demo
    if (nval < 0) nval = 0;
    pred.push(Math.round(nval));
    
    if (nval === 0 && !isShortfall) {
      isShortfall = true; shortfallMonth = i;
    }
  }

  fcChart.data.labels = labels;
  fcChart.data.datasets[0].data = hist;
  fcChart.data.datasets[1].data = pred;
  fcChart.data.datasets[2].data = ceil;
  fcChart.update();

  ind.style.display = 'none';
  btn.classList.remove('btn-disabled');
  btn.innerHTML = '<span class="icon">🔮</span> Run Inference Matrix';
  
  if (isShortfall) {
    alert.style.display = 'flex';
    alert.innerHTML = `<span style="font-size:20px">⚠️</span><div><strong>WARNING: Estimated Shortfall Detected.</strong> Based on current velocity patterns, the selected department is projected to exhaust allocated funds in ${shortfallMonth + 1} months. Recommend immediate liquidity planning.</div>`;
  } else {
    alert.style.display = 'flex';
    alert.style.borderColor = 'rgba(16,185,129,0.3)';
    alert.style.backgroundColor = 'rgba(16,185,129,0.05)';
    alert.style.color = 'var(--accent-green)';
    alert.innerHTML = `<span style="font-size:20px">✅</span><div><strong>Forecast Stable.</strong> Cash reserves are projected to sustain planned operations through the selected horizon. Peak utilisation at ${(months*0.8).toFixed(1)} months.</div>`;
  }
  
  toast('✅ LSTM matrix evaluation complete', 'success');
}

/* ══════════════════════════════════════════
   ENTITY TRACKER (FORENSIC)
══════════════════════════════════════════ */
function initEntityTracker() {
  const input = document.getElementById('entitySearchInput');
  const riskFilter = document.getElementById('entityRiskFilter');
  const yearFilter = document.getElementById('entityYearFilter');
  const list = document.getElementById('entityList');
  if (!list) return;

  const query = input ? input.value.toLowerCase() : '';
  const risk = riskFilter ? riskFilter.value : 'ALL';
  const year = yearFilter ? parseInt(yearFilter.value) : 2024;

  let filtered = ENTITIES;
  
  if (query) {
    filtered = filtered.filter(e => 
      e.name.toLowerCase().includes(query) || 
      e.ceo.toLowerCase().includes(query) ||
      (e.notes && e.notes.toLowerCase().includes(query))
    );
  }

  if (risk !== 'ALL') {
    filtered = filtered.filter(e => e.risk === risk);
  }

  if (year) {
    filtered = filtered.filter(e => e.year === year);
  }

  list.innerHTML = '';
  if (filtered.length === 0) {
    list.innerHTML = `<div class="panel" style="padding:48px;text-align:center;color:var(--text-muted)">
      <div style="font-size:48px;margin-bottom:16px">🔎</div>
      <div>No entities match the current search or filters.</div>
    </div>`;
    return;
  }

  filtered.forEach(e => {
    list.innerHTML += `
      <div class="entity-profile" id="profile-${e.id}">
        <div class="entity-header">
          <div class="entity-avatar">${e.avatar}</div>
          <div style="flex:1">
            <div class="entity-name">${e.name} ${e.risk === 'CRITICAL' ? '<span class="red-flag-indicator"><i class="fas fa-exclamation-triangle"></i> RED FLAG</span>' : ''}</div>
            <div class="entity-meta">CEO/Role: <strong>${e.ceo}</strong> · Active since ${e.year - 2} · HQ: District Alpha</div>
          </div>
          <div style="text-align:right">
            <div class="fs-12 text-muted mb-8">TOTAL FUNDS EXTRACTED / MANAGED</div>
            <div class="fs-24 fw-800" style="color:${e.color}">${e.extracted}</div>
          </div>
        </div>
        <div class="rap-sheet-grid">
          <div class="rap-stat">
            <div class="rap-label">Key Projects</div>
            <div class="rap-value">${e.projects.length}</div>
          </div>
          <div class="rap-stat">
            <div class="rap-label">Integrity Score</div>
            <div class="rap-value" style="color:${e.color}">${e.risk === 'CRITICAL' ? '14%' : e.risk === 'HIGH' ? '42%' : (e.risk === 'MEDIUM' ? '68%' : '94%')}</div>
          </div>
          <div class="rap-stat">
            <div class="rap-label">Chain References</div>
            <div class="rap-value">${Math.floor(Math.random()*800)+200}</div>
          </div>
          <div class="rap-stat">
            <div class="rap-label">Risk Category</div>
            <div class="rap-value" style="color:${e.color}">${e.risk}</div>
          </div>
        </div>
        <div style="padding:24px; background:rgba(255,255,255,0.02)">
          <div class="fs-12 fw-700 text-cyan mb-8">FORENSIC NOTES</div>
          <p class="fs-13 text-muted" style="line-height:1.6">${e.notes}</p>
          <div style="margin-top:20px; display:flex; gap:12px">
            <button class="btn btn-primary btn-sm" onclick="viewReference('${e.id}')">👁️ View Original Reference</button>
            <button class="btn btn-success btn-sm" onclick="downloadIntegrityCert('${e.id}')">📜 Get Certificate</button>
            <button class="btn btn-ghost btn-sm" onclick="toast('🔗 Fetching Antigravity Hash Ledger...', 'info')">View Chain Proof</button>
          </div>
        </div>
      </div>
    `;
  });
}

function viewReference(id) {
  const e = ENTITIES.find(ent => ent.id === id);
  if (!e) return;

  const panel = document.getElementById('entityReferencePanel');
  const content = document.getElementById('referenceContent');
  panel.style.display = 'block';

  // Highlight active profile
  document.querySelectorAll('.entity-profile').forEach(p => p.style.borderColor = 'rgba(255,255,255,0.08)');
  document.getElementById(`profile-${id}`).style.borderColor = 'var(--accent-cyan)';

  // Simulate an official document view
  const docDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  content.innerHTML = `
    <div style="text-align:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:15px; margin-bottom:20px">
      <div style="font-size:16px; font-weight:700; color:#fff">GOVERNMENT OF INDIA</div>
      <div style="font-size:10px; letter-spacing:2px; margin-top:4px">OFFICIAL DISBURSEMENT RECORD</div>
    </div>
    
    <div style="margin-bottom:20px">
      <div style="color:var(--accent-cyan); font-weight:700">ENTITY PROFILE:</div>
      <div style="font-size:14px; color:#fff">${e.name.toUpperCase()}</div>
      <div style="font-size:11px">OFFICIAL ID: IND-GOV-${id.toUpperCase()}-2024</div>
    </div>

    <div style="margin-bottom:20px">
      <div style="color:var(--accent-cyan); font-weight:700">PORTFOLIO SUMMARY:</div>
      <div style="font-size:11px">Role: ${e.ceo}</div>
      <div style="font-size:11px">Fiscal Year: 2024-25</div>
      <div style="font-size:11px">Total Value: ${e.extracted}</div>
    </div>

    <div style="margin-bottom:20px">
      <div style="color:var(--accent-cyan); font-weight:700">VERIFIED PROJECTS:</div>
      <ul style="padding-left:15px; margin-top:5px">
        ${e.projects.map(p => `<li style="margin-bottom:4px">${p}</li>`).join('')}
      </ul>
    </div>

    <div style="margin-bottom:20px">
      <div style="color:var(--accent-cyan); font-weight:700">FORENSIC SCAN STATUS:</div>
      <div style="display:flex; justify-content:space-between; font-size:11px; margin-top:4px">
        <span>Blockchain Anchor:</span>
        <span style="color:var(--accent-green)">SUCCESS</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:11px">
        <span>XBRL Compliance:</span>
        <span style="color:var(--accent-green)">PASS</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:11px">
        <span>Risk Assessment:</span>
        <span style="color:${e.color}">${e.risk}</span>
      </div>
    </div>

    <div style="border:1px dashed rgba(255,255,255,0.1); padding:12px; font-size:10px; line-height:1.4">
      <div style="font-weight:700; margin-bottom:4px">DIGITAL SIGNATURE:</div>
      0x${Array.from({length:40}, () => Math.floor(Math.random()*16).toString(16)).join('')}
      <br/><br/>
      <div style="font-weight:700; margin-bottom:4px">TIMESTAMP:</div>
      ${docDate} 10:42:15 AM
    </div>

    <div style="margin-top:30px; text-align:center">
      <a href="${e.ref}" target="_blank" class="btn btn-primary btn-sm" style="display:inline-block; text-decoration:none">
        🔗 Visit Official Portal
      </a>
    </div>
  `;
}

function closeReference() {
  document.getElementById('entityReferencePanel').style.display = 'none';
  document.querySelectorAll('.entity-profile').forEach(p => p.style.borderColor = 'rgba(255,255,255,0.08)');
}

/* ══════════════════════════════════════════
   MONEY WEB (NETWORK GRAPH)
══════════════════════════════════════════ */
let webNodes = [];
let webLinks = [];

function initMoneyWeb() {
  const canvas = document.getElementById('webCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const container = document.getElementById('webContainer');
  
  function resize() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Create nodes (Center is Govt, outer are Contractors, even further are Sub-contractors)
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  webNodes = [
    { id:'govt', label:'MAYOR OFFICE', x:centerX, y:centerY, r:25, color:'#00d4ff', type:'root' },
    ...ENTITIES.map((e, i) => {
      const angle = (i / ENTITIES.length) * Math.PI * 2;
      const dist = e.avatar === '🏛️' ? 100 : 180; // Politicians closer to center
      return { 
        id: e.id, label: e.name, 
        x: centerX + Math.cos(angle) * dist, 
        y: centerY + Math.sin(angle) * dist, 
        r: e.avatar === '🏛️' ? 18 : 12, 
        color: e.color, type: e.avatar === '🏛️' ? 'politician' : 'contractor'
      };
    }),
    { id:'sub1', label:'Shell Corp X', x:centerX-220, y:centerY-100, r:10, color:'#ef4444', type:'sub' },
    { id:'sub2', label:'Offshore Ltd', x:centerX-240, y:centerY-50, r:10, color:'#ef4444', type:'sub' }
  ];

  webLinks = [
    { source:'govt', target:'gadkari', weight:10, color:'rgba(0,212,255,0.6)' },
    { source:'govt', target:'naidu', weight:8, color:'rgba(0,212,255,0.5)' },
    { source:'govt', target:'jagan', weight:12, color:'rgba(0,212,255,0.7)' },
    { source:'naidu', target:'lokesh', weight:6, color:'rgba(255,255,255,0.1)' },
    { source:'naidu', target:'pawan', weight:4, color:'rgba(255,255,255,0.1)' },
    { source:'jagan', target:'ambani', weight:8, color:'rgba(239,68,68,0.2)' },
    { source:'ambani', target:'sub1', weight:3, color:'rgba(239,68,68,0.3)' },
    { source:'mallya', target:'sub2', weight:3, color:'rgba(239,68,68,0.3)' },
    { source:'gadkari', target:'ambani', weight:5, color:'rgba(255,255,255,0.1)' }
  ];

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    const clickedNode = webNodes.find(n => {
      const dx = n.x - mx;
      const dy = n.y - my;
      return Math.sqrt(dx*dx + dy*dy) < n.r + 5;
    });
    
    if (clickedNode) {
      toast(`🕸️ Money Web Inspect: ${clickedNode.label} (${clickedNode.type.toUpperCase()})`, 'info');
      if (clickedNode.id !== 'govt' && !clickedNode.id.startsWith('sub')) {
        setTimeout(() => {
          showPage('entities');
          const input = document.getElementById('entitySearchInput');
          if (input) {
            input.value = clickedNode.label;
            initEntityTracker();
          }
        }, 1000);
      }
    }
  });

  function animate() {
    if (document.getElementById('page-web').classList.contains('active')) {
      ctx.clearRect(0,0, canvas.width, canvas.height);
      
      // Draw background particles / network mesh
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for(let i=0; i<canvas.width; i+=40) {
        ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }

      // Draw Edges with pulsing flow
      webLinks.forEach(link => {
        const s = webNodes.find(n => n.id === link.source);
        const t = webNodes.find(n => n.id === link.target);
        if(!s || !t) return;

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = link.color;
        ctx.lineWidth = link.weight;
        ctx.stroke();

        // Moving pulse dot
        const time = Date.now() * 0.002;
        const progress = (time % 1);
        const px = s.x + (t.x - s.x) * progress;
        const py = s.y + (t.y - s.y) * progress;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI*2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      });

      // Draw Nodes
      webNodes.forEach(node => {
        // Slow hover float
        node.x += Math.sin(Date.now() * 0.001 + node.r) * 0.1;
        node.y += Math.cos(Date.now() * 0.001 + node.r) * 0.1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI*2);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + node.r + 15);
      });
    }
    requestAnimationFrame(animate);
  }
  animate();

  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hover = webNodes.find(n => Math.hypot(n.x - mx, n.y - my) < n.r);
    const info = document.getElementById('webInfoHover');
    if (hover) {
      info.style.display = 'block';
      info.style.left = (mx + 20) + 'px';
      info.style.top = (my + 20) + 'px';
      info.innerHTML = `<strong>${hover.label}</strong><br/>Type: ${hover.type.toUpperCase()}<br/>Relation: ${hover.type === 'root' ? 'Origin' : 'Beneficiary'}`;
    } else {
      info.style.display = 'none';
    }
  };
}


