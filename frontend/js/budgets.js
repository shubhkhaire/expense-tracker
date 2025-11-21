(async function () {
  const form = document.getElementById("budgetForm");
  const list = document.getElementById("budgetsList");

  async function load() {
    const res = await apiFetch("/budgets");
    if (!res.ok) return (list.innerHTML = "<p>Error loading</p>");
    list.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.className = "list-card";
    (res.body.data || []).forEach((b) => {
      const div = document.createElement("div");
      div.className = "item-card";

      const badge = document.createElement("div");
      badge.className = "item-badge";
      badge.style.background = "linear-gradient(180deg,#10b981,#059669)";
      badge.textContent = b.month.slice(5) || "M";

      const body = document.createElement("div");
      body.className = "item-body";
      const title = document.createElement("div");
      title.className = "item-title";
      title.textContent = b.month;
      const sub = document.createElement("div");
      sub.className = "item-sub";
      sub.textContent = `Budget: ${formatCurrency(
        b.amount
      )} — Spent: ${formatCurrency(b.spent || 0)}`;
      body.appendChild(title);
      body.appendChild(sub);

      const actions = document.createElement("div");
      actions.className = "item-actions";
      const del = document.createElement("button");
      del.className = "del";
      del.dataset.id = b.id;
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
        const r = await apiFetch(`/budgets/${id}`, { method: "DELETE" });
        if (r.ok) load();
        else alert("Error");
      })
    );
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const month = document.getElementById("month").value;
    const amount = document.getElementById("amount").value;
    // backend expects allocated_amount
    const res = await apiFetch("/budgets", {
      method: "POST",
      body: JSON.stringify({ month, allocated_amount: amount }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      document.getElementById("month").value = "";
      document.getElementById("amount").value = "";
      load();
    } else alert(res.body && res.body.message ? res.body.message : "Error");
  });

  load();
})();
