/* ===============================
   Expense Tracker - app.js
   Backend runs on: http://localhost:5000
   Frontend runs on:  http://127.0.0.1:5500
   =============================== */

// Change API base if needed
const API = "http://localhost:5000";
// expose to other frontend modules that may use relative URLs
window.API = API;

// Token helpers
function setToken(t) {
  localStorage.setItem("token", t);
}
function getToken() {
  return localStorage.getItem("token");
}

/* =========================================
   LOGIN + REGISTER PAGE LOGIC
   ========================================= */

if (document.getElementById("loginForm")) {
  // Show register form
  document.getElementById("showRegister").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("registerForm").classList.remove("hidden");
  });

  // Back to login
  const showLoginBtn = document.getElementById("showLogin");
  if (showLoginBtn) {
    showLoginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("registerForm").classList.add("hidden");
      document.getElementById("loginForm").classList.remove("hidden");
    });
  }

  /* ---------- LOGIN HANDLER ---------- */
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const raw = await res.text();
      let data = null;

      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {}

      if (res.ok) {
        setToken(data.token);
        window.location = "dashboard.html"; // redirect to dashboard
      } else {
        alert(data?.message || raw || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Network error");
    }
  });

  /* ---------- REGISTER HANDLER ---------- */
  document
    .getElementById("registerForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("rname").value;
      const email = document.getElementById("remail").value;
      const password = document.getElementById("rpassword").value;

      try {
        const res = await fetch(`${API}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const raw = await res.text();
        let data = null;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch {}

        if (res.ok) {
          alert("Registered successfully. Please login.");
          document.getElementById("registerForm").classList.add("hidden");
          document.getElementById("loginForm").classList.remove("hidden");
        } else {
          alert(data?.message || raw || "Register failed");
        }
      } catch (err) {
        console.error("Register error:", err);
        alert("Network error");
      }
    });
}

/* =========================================
   DASHBOARD PAGE (expenses, charts)
   ========================================= */

if (document.getElementById("expenseForm")) {
  const token = getToken();
  if (!token) window.location = "/"; // require login

  /* ---------- LOGOUT ---------- */
  const logoutBtn =
    document.getElementById("logout") || document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location = "/";
    });
  }

  /* ---------- ADD EXPENSE FORM ---------- */
  const form = document.getElementById("expenseForm");

  // Load categories into the dashboard category select
  async function loadCategoriesForDashboard() {
    try {
      const res = await fetch(`${API}/categories`, {
        headers: { Authorization: "Bearer " + token },
      });
      const body = await res.json();
      const cats = Array.isArray(body) ? body : body?.data || body || [];
      const sel = document.getElementById("categorySelect");
      if (!sel) return;
      sel.innerHTML = "<option value=''>No category</option>";
      cats.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name;
        sel.appendChild(opt);
      });
    } catch (e) {
      console.warn("Could not load categories for dashboard", e);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const amount = document.getElementById("amount").value;
    // some pages use 'title' as short description; prefer '#description' then '#title'
    const noteEl =
      document.getElementById("description") ||
      document.getElementById("title");
    const note = noteEl ? noteEl.value : "";
    const date = document.getElementById("date").value;
    const receipt = document.getElementById("receipt").files[0];

    const fd = new FormData();
    fd.append("amount", amount);
    fd.append("note", note);
    fd.append("date", date);
    const catEl = document.getElementById("categorySelect");
    if (catEl && catEl.value) fd.append("category_id", catEl.value);
    if (receipt) fd.append("receipt", receipt);

    const res = await fetch(`${API}/expenses`, {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: fd,
    });

    const data = await res.json();

    if (res.ok) {
      alert("Expense Added!");
      loadExpenses();
      loadChart();
    } else {
      alert(data.message || "Error adding expense");
    }
  });

  /* =========================================
     LOAD EXPENSES LIST
     ========================================= */
  async function loadExpenses() {
    // use apiFetch (handles API base and auth) and provide friendly errors
    const res = await window.apiFetch("/expenses");
    const list = document.getElementById("expensesList");

    if (!res.ok) {
      console.error("Failed to load expenses", res);
      if (res.status === 401) {
        // token invalid or expired — force login
        try {
          localStorage.removeItem("token");
        } catch (e) {}
        window.location = "/";
        return;
      }
      if (list)
        list.innerHTML =
          '<div class="list-card"><p class="muted">Could not load expenses.</p></div>';
      return;
    }

    const items = Array.isArray(res.body) ? res.body : res.body?.data || [];

    // set navbar logo from first receipt if not already set
    if (!localStorage.getItem("logoUrl")) {
      const firstWithReceipt = items.find((x) => x && x.receipt_path);
      if (firstWithReceipt && firstWithReceipt.receipt_path) {
        try {
          localStorage.setItem("logoUrl", firstWithReceipt.receipt_path);
        } catch (e) {}
      }
    }

    if (!list) return;
    list.innerHTML = "";

    if (!items || items.length === 0) {
      list.innerHTML =
        '<div class="list-card"><p class="muted">No expenses yet.</p></div>';
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "list-card";

    items.forEach((exp) => {
      const div = document.createElement("div");
      div.className = "item-card";

      const badge = document.createElement("div");
      badge.className = "item-badge";
      badge.style.background = (exp && exp.category_color) || "#0a84ff";
      badge.textContent = (exp && exp.note && exp.note[0]) || "$";

      const body = document.createElement("div");
      body.className = "item-body";
      const title = document.createElement("div");
      title.className = "item-title";
      title.textContent = `${formatCurrency(exp.amount)} — ${exp.note || ""}`;
      const sub = document.createElement("div");
      sub.className = "item-sub";
      sub.textContent = exp.date || "";
      body.appendChild(title);
      body.appendChild(sub);

      const actions = document.createElement("div");
      actions.className = "item-actions";
      if (exp && exp.receipt_path) {
        const a = document.createElement("a");
        const href = exp.receipt_path.startsWith("/")
          ? (window.API || API) + exp.receipt_path
          : exp.receipt_path;
        a.href = href;
        a.target = "_blank";
        a.textContent = "Receipt";
        actions.appendChild(a);
      }

      div.appendChild(badge);
      div.appendChild(body);
      div.appendChild(actions);

      wrapper.appendChild(div);
    });

    list.appendChild(wrapper);
  }

  /* =========================================
     LOAD CHART
     ========================================= */
  async function loadChart() {
    // read selected year from selector if present
    const yearSelect = document.getElementById("chartYearSelect");
    const year = yearSelect
      ? yearSelect.value || new Date().getFullYear()
      : new Date().getFullYear();

    const res = await fetch(
      `${API}/dashboard/chart-data?year=${encodeURIComponent(year)}`,
      {
        headers: { Authorization: "Bearer " + token },
      }
    );
    if (!res.ok) return;
    const d = await res.json();
    const monthly = d.data && d.data.monthly ? d.data.monthly : [];
    const cats = d.data && d.data.categories ? d.data.categories : [];
    const catTotals = d.data && d.data.catTotals ? d.data.catTotals : [];

    // Monthly line chart
    const ctx = document.getElementById("monthlyChart").getContext("2d");
    if (window._monthlyChart) window._monthlyChart.destroy();

    const monthLabels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, "rgba(37,99,235,0.18)");
    gradient.addColorStop(1, "rgba(37,99,235,0.02)");

    window._monthlyChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: monthLabels,
        datasets: [
          {
            label: "Monthly Spending",
            data: monthly,
            backgroundColor: gradient,
            borderColor: "#2563eb",
            pointBackgroundColor: "#fff",
            pointBorderColor: "#2563eb",
            pointRadius: 4,
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.04)" } },
        },
      },
    });

    // Category doughnut chart
    const catEl = document.getElementById("categoryChart");
    if (catEl) {
      const cctx = catEl.getContext("2d");
      if (window._categoryChart) window._categoryChart.destroy();

      // generate colors for categories
      const palette = catTotals.map((_, i) => {
        const hues = [220, 190, 160, 30, 10, 260, 340, 45, 200, 120];
        const h = hues[i % hues.length];
        return `hsl(${h} 70% ${50 - (i % 3) * 6}%)`;
      });

      window._categoryChart = new Chart(cctx, {
        type: "doughnut",
        data: {
          labels: cats,
          datasets: [{ data: catTotals, backgroundColor: palette }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } },
        },
      });
    }
  }

  // Populate year selector with a reasonable range and bind change
  function initYearSelector() {
    const sel = document.getElementById("chartYearSelect");
    if (!sel) return;
    const current = new Date().getFullYear();
    const range = 3; // show current +/- range
    sel.innerHTML = "";
    for (let y = current + range; y >= current - range; y--) {
      const opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y;
      if (y === current) opt.selected = true;
      sel.appendChild(opt);
    }
    sel.addEventListener("change", () => loadChart());
  }

  /* Load data on dashboard load */
  loadCategoriesForDashboard();
  loadExpenses();
  initYearSelector();
  loadChart();
}

/* ==========================
   UI helpers: theme toggle, toast, FAB, dropzone, skeletons, countUp, topbar
   Compatible with Bootstrap if loaded, otherwise fallbacks
   ========================== */

// Initialize theme from localStorage
(function initTheme() {
  const theme = localStorage.getItem("theme");
  if (theme === "dark") document.documentElement.classList.add("dark");
})();

// showToast: uses Bootstrap Toast if available, else fallback
function showToast(message, timeout = 3000) {
  try {
    const bsEl = document.getElementById("bsToast");
    if (window.bootstrap && bsEl) {
      bsEl.querySelector(".toast-body").textContent = message;
      const t = new bootstrap.Toast(bsEl);
      t.show();
      return;
    }
  } catch (e) {
    console.warn("Bootstrap toast error", e);
  }

  // fallback simple toast
  let el = document.getElementById("appToast");
  if (!el) {
    el = document.createElement("div");
    el.id = "appToast";
    el.className = "app-toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), timeout);
}

// FAB click behavior: focus first form field in `expenseForm`
document.addEventListener("click", (e) => {
  if (!e.target.closest) return;
  const fab = e.target.closest(".fab");
  if (fab) {
    const form = document.getElementById("expenseForm");
    if (form) {
      const el = form.querySelector("input,select,textarea,button");
      if (el) el.focus();
      const rect = form.getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + rect.top - 80,
        behavior: "smooth",
      });
    }
  }
});

// Bind dropzones
document.querySelectorAll(".dropzone").forEach((dz) => {
  ["dragenter", "dragover"].forEach((ev) =>
    dz.addEventListener(ev, (e) => {
      e.preventDefault();
      dz.classList.add("dragover");
    })
  );
  ["dragleave", "drop"].forEach((ev) =>
    dz.addEventListener(ev, (e) => {
      e.preventDefault();
      dz.classList.remove("dragover");
    })
  );
  dz.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    const input = dz.querySelector("input[type=file]");
    if (input && files.length) input.files = files;
  });
});

// Simple skeleton toggler
function showSkeleton(selector, show = true) {
  const el = document.querySelector(selector);
  if (!el) return;
  if (show) {
    el.dataset.orig = el.innerHTML;
    el.innerHTML =
      '<div class="skeleton skeleton-line" style="width:80%"></div>'.repeat(4);
  } else if (el.dataset.orig) {
    el.innerHTML = el.dataset.orig;
  }
}

// Count-up numbers
function countUp(elOrSelector, to, ms = 900) {
  const el =
    typeof elOrSelector === "string"
      ? document.querySelector(elOrSelector)
      : elOrSelector;
  if (!el) return;
  const start = 0;
  const startTime = performance.now();
  function step(now) {
    const t = Math.min(1, (now - startTime) / ms);
    el.textContent = Math.round(start + (to - start) * t).toLocaleString();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Topbar shadow on scroll
window.addEventListener("scroll", () => {
  const tb =
    document.querySelector(".site-topbar") || document.querySelector("header");
  if (!tb) return;
  tb.classList.toggle("scrolled", window.scrollY > 8);
});

// Ensure 'Home' navigation and login page behavior for authenticated users
document.addEventListener("DOMContentLoaded", () => {
  try {
    const token = getToken();
    const path = window.location.pathname || "";
    const isIndex = path === "/" || path.endsWith("/index.html") || path === "";
    if (token) {
      // Redirect to dashboard if on the index/login page
      if (isIndex) {
        window.location.href = "dashboard.html";
        return;
      }

      // Update any Home links that point to index to go to dashboard instead
      document
        .querySelectorAll(
          'a[href="index.html"], a[href="/"], a[href="/index.html"]'
        )
        .forEach((a) => {
          a.setAttribute("href", "dashboard.html");
        });
    }
  } catch (e) {
    console.warn("Navigation helper error:", e);
  }
});
