// Shared helper for fetch with auth
function getToken() {
  return localStorage.getItem("token");
}

// Determine API base: prefer `window.APP_API` or `window.API`, fallback to localhost
const API_BASE = window.APP_API || window.API || "http://localhost:5000";

async function apiFetch(url, opts = {}) {
  const headers = opts.headers || {};
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;
  opts.headers = headers;

  // If a relative path is provided, prefix with API base
  let fetchUrl = url;
  if (typeof url === "string" && url.startsWith("/")) {
    fetchUrl = API_BASE + url;
  }

  const res = await fetch(fetchUrl, opts);
  // Try parse JSON, otherwise return raw text for callers to inspect
  let body = null;
  let raw = null;
  try {
    raw = await res.text();
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch (e) {
      body = raw;
    }
  } catch (err) {
    body = null;
  }

  // If unauthorized, clear token so subsequent requests fail fast and let UI handle redirect
  if (res.status === 401) {
    try {
      localStorage.removeItem("token");
    } catch (e) {}
  }

  return { ok: res.ok, status: res.status, body, raw };
}

function formatCurrency(n) {
  return Number(n).toFixed(2);
}

window.apiFetch = apiFetch;
window.formatCurrency = formatCurrency;
