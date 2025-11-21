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

    const logoPart = found
      ? `<div class="nav-left"><img class="nav-logo" src="${found}" alt="logo"/></div>`
      : `<div class="nav-left"><h1>Expense Tracker</h1></div>`;

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
  })();
});
