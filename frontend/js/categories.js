(async function () {
  const form = document.getElementById("categoryForm");
  const list = document.getElementById("categoriesList");

  async function load() {
    const res = await apiFetch("/categories");
    if (!res.ok) return (list.innerHTML = "<p>Error loading</p>");
    list.innerHTML = "";
    const cats = res.body || [];
    const wrapper = document.createElement("div");
    wrapper.className = "list-card";
    cats.forEach((c) => {
      const div = document.createElement("div");
      div.className = "item-card";

      const color = c.color || "linear-gradient(180deg,#0a84ff,#006fe6)";
      const initial = (c.name && c.name[0]) || "#";

      const badge = document.createElement("div");
      badge.className = "item-badge";
      badge.style.background = c.color || "#0a84ff";
      badge.textContent = initial.toUpperCase();

      const body = document.createElement("div");
      body.className = "item-body";
      const title = document.createElement("div");
      title.className = "item-title";
      title.textContent = c.name;
      body.appendChild(title);

      const actions = document.createElement("div");
      actions.className = "item-actions";
      const del = document.createElement("button");
      del.className = "del";
      del.dataset.id = c.id;
      del.textContent = "Delete";
      actions.appendChild(del);

      div.appendChild(badge);
      div.appendChild(body);
      div.appendChild(actions);

      wrapper.appendChild(div);
    });
    list.appendChild(wrapper);
    wrapper.querySelectorAll(".del").forEach((b) =>
      b.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        const r = await apiFetch(`/categories/${id}`, { method: "DELETE" });
        if (r.ok) load();
        else alert("Error");
      })
    );
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("catName").value;
    const res = await apiFetch("/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      document.getElementById("catName").value = "";
      load();
    } else alert(res.body && res.body.message ? res.body.message : "Error");
  });

  load();
})();
