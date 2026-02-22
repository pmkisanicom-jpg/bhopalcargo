/* ============================================================
   BHOPAL CARGO — script.js
   Premium Logistics Website Scripts
   Google Sheets Live Tracking via opensheet.elk.sh JSON
   ============================================================ */

/* ── Google Sheet Config (opensheet JSON API) ── */
const SHEET_JSON_URL = 'https://opensheet.elk.sh/1MFKUIXNJ9w_YYM_mmg4IfvsHvXpb2x9a7tGkmbT2YpI/Sheet1';

/* ── Navbar scroll effect ── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

/* ── Hamburger menu ── */
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('nav-mobile');
if (hamburger && navMobile) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navMobile.classList.toggle('open');
  });
  navMobile.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navMobile.classList.remove('open');
    });
  });
}

/* ── Active nav link ── */
(function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html') ||
      (page === 'index.html' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

/* ── Ripple effect on buttons ── */
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', function (e) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  });
});

/* ── Scroll reveal (Intersection Observer) ── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── Counter animation ── */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const suffix = el.dataset.suffix || '';
  const duration = 1800;
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));


/* ============================================================
   TRACKING FORM — Live Google Sheets JSON Lookup (opensheet.elk.sh)
   ============================================================ */
const trackingForm = document.getElementById('tracking-form');
if (trackingForm) {
  trackingForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const input = document.getElementById('lr-input');
    const val = input.value.trim();
    if (!val) { input.focus(); return; }

    // Show loading state
    const btn = this.querySelector('button[type="submit"]');
    const orig = btn.innerHTML;
    btn.innerHTML = '⏳ Searching...';
    btn.disabled = true;

    // Hide previous result / error
    const resultEl = document.getElementById('tracking-result');
    if (resultEl) resultEl.classList.remove('show');
    const errorEl = document.getElementById('tracking-error');
    if (errorEl) errorEl.style.display = 'none';

    try {
      const resp = await fetch(SHEET_JSON_URL);
      if (!resp.ok) throw new Error('Sheet not accessible');
      const rows = await resp.json(); // opensheet returns JSON array directly

      // Find matching bill — case-insensitive
      const match = rows.find(r =>
        (r['Bill Number'] || '').trim().toLowerCase() === val.toLowerCase()
      );

      if (match) {
        displayTrackingResult(match);
      } else {
        showTrackingError(val);
      }
    } catch (err) {
      console.error('Tracking error:', err);
      showSheetError();
    } finally {
      btn.innerHTML = orig;
      btn.disabled = false;
    }
  });
}

/** Display result from Google Sheets row */
function displayTrackingResult(row) {
  const resultEl = document.getElementById('tracking-result');
  if (!resultEl) return;

  // Bill number
  setText('result-lr-num', row['Bill Number'] || '—');

  // Route cities
  setText('result-from-city', row['From'] || 'Indore');
  setText('result-to-city', row['To'] || 'Bhopal');

  // Dates
  setText('result-booking-date', row['Booking Date'] || '—');
  setText('result-delivery-date', row['Delivered Date'] || '—');

  // Product details
  setText('result-product', row['Product'] || '—');
  setText('result-qty', row['Qty'] || '—');

  // Vehicle & Driver
  setText('result-vehicle', row['Vehicle Number'] || '—');
  setText('result-driver', row['Driver Name'] || '—');
  setText('result-driver-mobile', row['Driver Mobile Number'] ? `📞 ${row['Driver Mobile Number']}` : '—');

  // Status badge + timeline
  const status = (row['Current Status'] || 'Booked').trim();
  renderStatusBadge(status);
  renderTimeline(status);

  resultEl.classList.add('show');
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderStatusBadge(status) {
  const el = document.getElementById('result-status');
  if (!el) return;
  const s = status.toLowerCase();
  if (s.includes('deliver')) {
    el.className = 'badge badge-green';
    el.textContent = '✅ Delivered';
  } else if (s.includes('out') || s.includes('ofd')) {
    el.className = 'badge badge-yellow';
    el.textContent = '📦 Out for Delivery';
  } else if (s.includes('transit')) {
    el.className = 'badge badge-blue';
    el.textContent = '🚚 In Transit';
  } else if (s.includes('pick') || s.includes('collected')) {
    el.className = 'badge badge-blue';
    el.textContent = '🏠 Picked Up';
  } else {
    el.className = 'badge badge-yellow';
    el.textContent = `📋 ${status}`;
  }
}

/**
 * Map status string to which timeline step is active.
 * Steps: 0=Booked, 1=Picked Up, 2=In Transit, 3=Out for Delivery, 4=Delivered
 */
function renderTimeline(status) {
  const steps = document.querySelectorAll('.timeline-step');
  steps.forEach(s => s.classList.remove('done', 'active'));

  const s = status.toLowerCase();
  let activeIdx = 0;
  if (s.includes('deliver') && !s.includes('out')) activeIdx = 4;   // Delivered
  else if (s.includes('out') || s.includes('ofd')) activeIdx = 3;  // OFD
  else if (s.includes('transit')) activeIdx = 2;  // In Transit
  else if (s.includes('pick') || s.includes('collect')) activeIdx = 1; // Picked Up
  else activeIdx = 0;  // Booked

  steps.forEach((step, idx) => {
    if (idx < activeIdx) step.classList.add('done');
    else if (idx === activeIdx) step.classList.add('active');
  });

  // If delivered, mark all done
  if (activeIdx === 4) steps.forEach(s => s.classList.add('done'));
}

/** Show "not found" error */
function showTrackingError(billNo) {
  const errorEl = document.getElementById('tracking-error');
  if (errorEl) {
    errorEl.style.display = 'block';
    const billEl = errorEl.querySelector('.error-bill');
    if (billEl) billEl.textContent = billNo;
  }
}

/** Show "sheet unreachable" error */
function showSheetError() {
  const errorEl = document.getElementById('tracking-error');
  if (errorEl) {
    errorEl.style.display = 'block';
    const msg = errorEl.querySelector('.error-msg');
    if (msg) msg.textContent = 'Unable to connect to tracking server. Please try again or contact us.';
  }
}

/* ── Contact form → Google Apps Script Web App ── */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxA-J253N8SnN8EpnUw_nX6boVmORHRAHFAwjyOFdLdYDoiOy2m27QC1ewFeo7cfqBG/exec';

const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const btn = document.getElementById('contact-submit-btn');
    const feedback = document.getElementById('form-feedback');

    // Basic validation
    const name = document.getElementById('c-name').value.trim();
    const phone = document.getElementById('c-phone').value.trim();
    if (!name || !phone) {
      showFormFeedback(feedback, 'error', '⚠️ Please fill in Name and Phone fields.');
      return;
    }

    // Collect all field values
    const payload = {
      name,
      phone,
      email: document.getElementById('c-email').value.trim(),
      from: document.getElementById('c-from').value,
      to: document.getElementById('c-to').value,
      service: document.getElementById('c-service').value,
      message: document.getElementById('c-msg').value.trim(),
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };

    // Loading state
    const origHTML = btn.innerHTML;
    btn.innerHTML = '⏳ Sending...';
    btn.disabled = true;
    if (feedback) feedback.style.display = 'none';

    try {
      // Google Apps Script requires no-cors mode when called from a browser
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',         // Apps Script CORS limitation workaround
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // no-cors always gives opaque response — treat reaching here as success
      showFormFeedback(feedback, 'success', `✅ Booking Submitted Successfully! We will contact you shortly.`);
      contactForm.reset();

    } catch (err) {
      console.error('Contact form error:', err);
      showFormFeedback(feedback, 'error', '❌ Something went wrong. Please call us directly at +91 90090 08010.');
    } finally {
      btn.innerHTML = origHTML;
      btn.disabled = false;
    }
  });
}

/** Show success or error feedback below the submit button */
function showFormFeedback(el, type, msg) {
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  if (type === 'success') {
    el.style.background = 'rgba(34,197,94,.12)';
    el.style.border = '1px solid rgba(34,197,94,.4)';
    el.style.color = '#4ade80';
  } else {
    el.style.background = 'rgba(239,68,68,.1)';
    el.style.border = '1px solid rgba(239,68,68,.35)';
    el.style.color = '#f87171';
  }
  // Auto-hide success after 6s
  if (type === 'success') setTimeout(() => { el.style.display = 'none'; }, 6000);
}


/* ── Smooth parallax on hero ── */
const heroSection = document.querySelector('.hero');
if (heroSection) {
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const heroContent = heroSection.querySelector('.hero-inner');
    if (heroContent && scrolled < window.innerHeight) {
      heroContent.style.transform = `translateY(${scrolled * 0.12}px)`;
      heroContent.style.opacity = 1 - (scrolled / window.innerHeight) * 1.2;
    }
  }, { passive: true });
}


const form = document.getElementById("contact-form");
const submitBtn = document.getElementById("contact-submit-btn");
const feedback = document.getElementById("form-feedback");

const scriptURL = "https://script.google.com/macros/s/AKfycbzKwxx5jMvj-4jgZn2k5KxDs_7o5LI3NlmAqxGqbA-9M1xgYNzYxRYwkZwBwedx4igwLw/exec";

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  submitBtn.innerText = "Sending...";
  submitBtn.disabled = true;

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  try {
    const response = await fetch(scriptURL, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      }
    });

    const result = await response.json();

    if (result.status === "success") {
      feedback.style.display = "block";
      feedback.style.background = "#DCFCE7";
      feedback.style.color = "#166534";
      feedback.innerText = "Booking Submitted Successfully ✅";
      form.reset();
    } else {
      throw new Error("Submission failed");
    }

  } catch (error) {
    feedback.style.display = "block";
    feedback.style.background = "#FEE2E2";
    feedback.style.color = "#991B1B";
    feedback.innerText = "Something went wrong ❌";
  }

  submitBtn.innerText = "📨 Send Message";
  submitBtn.disabled = false;
});