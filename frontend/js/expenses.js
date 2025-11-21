(async function () {
  const form = document.getElementById("filterForm");
  const list = document.getElementById("expensesList");
  const pager = document.getElementById("pager");

  // populate category filter dropdown
  async function populateCategoryFilter() {
    try {
      const res = await apiFetch("/categories");
      const cats = Array.isArray(res.body) ? res.body : res.body?.data || [];
      const sel = document.getElementById("categoryFilter");
      if (!sel) return;
      sel.innerHTML = '<option value="">All categories</option>';
      cats.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name;
        sel.appendChild(opt);
      });
    } catch (e) {
      console.warn("Could not load categories for filter", e);
    }
  }

  async function load(page = 1) {
    const q = new URLSearchParams();
    q.set("page", page);

    const start = document.getElementById("fromDate")?.value;
    const end = document.getElementById("toDate")?.value;
    const search = document.getElementById("search")?.value;
    const category = document.getElementById("categoryFilter")?.value;

    if (start) q.set("startDate", start);
    if (end) q.set("endDate", end);
    if (search) q.set("search", search);
    if (category) q.set("category", category);

    const res = await apiFetch("/expenses?" + q.toString());
    if (!res.ok) {
      if (res.status === 401) {
        try {
          localStorage.removeItem("token");
        } catch (e) {}
        window.location = "/";
        return;
      }
      return (list.innerHTML = "<p class='muted'>Error loading</p>");
    }

    const data = Array.isArray(res.body) ? res.body : res.body?.data || [];

    list.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.className = "list-card";
    data.forEach((e) => {
      const div = document.createElement("div");
      div.className = "item-card";

      const badge = document.createElement("div");
      badge.className = "item-badge";
      if (e.category_color) badge.style.background = e.category_color;
      else badge.style.background = "#0a84ff";
      badge.textContent = (e.note && e.note[0]) || "$";

      const body = document.createElement("div");
      body.className = "item-body";
      const title = document.createElement("div");
      title.className = "item-title";
      title.textContent = `${formatCurrency(e.amount)} — ${e.note || ""}`;
      const sub = document.createElement("div");
      sub.className = "item-sub";
      sub.textContent = e.date || "";
      body.appendChild(title);
      body.appendChild(sub);

      const actions = document.createElement("div");
      actions.className = "item-actions";
      if (e.receipt_path) {
        const a = document.createElement("a");
        const href = e.receipt_path.startsWith("/")
          ? window.location.origin + e.receipt_path
          : e.receipt_path;
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

    // pager
    pager.innerHTML = "";
    const total =
      res.body?.total || (Array.isArray(res.body) ? data.length : 0);
    const limit = res.body?.limit || (total > 0 ? total : 20);
    const pages = Math.max(1, Math.ceil(total / limit));
    for (let i = 1; i <= pages; i++) {
      const b = document.createElement("button");
      b.textContent = i;
      b.disabled = i === page;
      b.addEventListener("click", () => load(i));
      pager.appendChild(b);
    }
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      load();
    });
  }

  await populateCategoryFilter();
  load();
})();
