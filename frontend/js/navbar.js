document.addEventListener("DOMContentLoaded", function () {
  (async function buildNavbar() {
    const candidatePaths = [
      localStorage.getItem("logoUrl"),
      "/assets/expense-logo.png",
      "/assets/expense%20logo.png",
      "/assets/expense-logo.svg",
      ,
      "expense logo.png",
    ].filter(Boolean);

    function testImage(src) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
      });
    }

    let found = null;
    for (const p of candidatePaths) {
      try {
        // try loading; if localStorage value is relative/absolute it will be tested too
        /* eslint-disable no-await-in-loop */
        const ok = await testImage(p);
        /* eslint-enable no-await-in-loop */
        if (ok) {
          found = p;
          break;
        }
      } catch (e) {
        // ignore and continue
      }
    }

    // Use an inline image if available, otherwise render an animated canvas logo
    const inlineCanvas = `<div class="nav-left" style="position:relative;display:flex;align-items:center;gap:8px"><canvas class="nav-logo-canvas" width="48" height="48" aria-label="App logo" role="img"></canvas><span class="sr-only">Expense Tracker</span></div>`;

    const logoPart = found
      ? `<div class="nav-left" style="position:relative;display:flex;align-items:center;gap:8px"><img class="nav-logo" src="${found}" alt="logo"/><span class="sr-only">Expense Tracker</span></div>`
      : inlineCanvas;

    const navHtml = `
      ${logoPart}
      <nav class="top-nav">
        <a class="nav-item" href="dashboard.html">Dashboard</a>
        <a class="nav-item" href="expenses.html">Expenses</a>
        <a class="nav-item" href="categories.html">Categories</a>
        <a class="nav-item" href="budgets.html">Budgets</a>
      </nav>
      <div class="nav-right">
        <button id="logout" class="btn ghost">Logout</button>
      </div>
    `;

    const newHeader = document.createElement("header");
    newHeader.innerHTML = navHtml;

    const existing = document.querySelector("header");
    if (existing) existing.replaceWith(newHeader);
    else document.body.insertBefore(newHeader, document.body.firstChild);

    // Determine active link by filename
    const path = (window.location.pathname || "").split("/").pop();
    const file = path === "" ? "index.html" : path;
    const links = newHeader.querySelectorAll(".top-nav .nav-item");
    links.forEach((a) => {
      const href = a.getAttribute("href");
      if (href === file || (file === "" && href === "index.html")) {
        a.classList.add("active");
      }
    });

    // Hide logout if no token present
    const token = localStorage.getItem("token");
    const logoutBtn = newHeader.querySelector("#logout");
    if (!logoutBtn) return;
    if (!token) logoutBtn.style.display = "none";
    else logoutBtn.style.display = "";

    logoutBtn.addEventListener("click", function () {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "index.html";
    });

    links.forEach((a) => a.setAttribute("tabindex", "0"));

    const navLogo = newHeader.querySelector(".nav-logo");
    if (navLogo) {
      navLogo.style.cursor = "pointer";
      navLogo.addEventListener("click", () => {
        if (localStorage.getItem("token"))
          window.location.href = "dashboard.html";
        else window.location.href = "index.html";
      });
    }

    // Animated canvas fallback: draw a rounded gradient square with a subtle rotation + dollar glyph
    const canvas = newHeader.querySelector(".nav-logo-canvas");
    if (canvas && canvas.getContext) {
      const ctx = canvas.getContext("2d");
      let t = 0;
      const W = canvas.width;
      const H = canvas.height;

      function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      }

      function draw() {
        t += 0.02;
        ctx.clearRect(0, 0, W, H);

        // gradient background
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, "#0a84ff");
        g.addColorStop(1, "#006fe6");
        ctx.fillStyle = g;
        roundRect(ctx, 0, 0, W, H, 8);
        ctx.fill();

        // subtle inner highlight
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = "#ffffff";
        roundRect(ctx, 2, 2, W - 4, H - 4, 7);
        ctx.fill();
        ctx.restore();

        // rotating symbol
        ctx.save();
        ctx.translate(W / 2, H / 2 + 1);
        ctx.rotate(Math.sin(t) * 0.08);
        ctx.fillStyle = "#fff";
        ctx.font = "20px Inter, Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("$", 0, 0);
        ctx.restore();

        requestAnimationFrame(draw);
      }

      // scale canvas for crispness on high-DPI screens
      (function scaleCanvas() {
        const dpr = window.devicePixelRatio || 1;
        if (dpr !== 1) {
          canvas.width = 48 * dpr;
          canvas.height = 48 * dpr;
          canvas.style.width = "48px";
          canvas.style.height = "48px";
          ctx.scale(dpr, dpr);
        }
      })();

      draw();
      canvas.style.cursor = "pointer";
      canvas.addEventListener("click", () => {
        if (localStorage.getItem("token"))
          window.location.href = "dashboard.html";
        else window.location.href = "index.html";
      });
    }
  })();
});
