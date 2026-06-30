/* ===== MakerMind AI 前端认证工具 =====
 * 负责：token 存储、带鉴权的请求、导航栏登录状态自动注入
 * 在每个页面引入即可自动工作，无需手动调用
 */
(function () {
  const TOKEN_KEY = "makermind_token";
  const USER_KEY = "makermind_user";

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  }

  function isLoggedIn() {
    return !!getToken();
  }

  function setAuth(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function logout() {
    clearAuth();
    location.href = "index.html";
  }

  // 带鉴权的 fetch：自动附加 token，401 时清除登录态
  async function authFetch(url, options) {
    options = options || {};
    const token = getToken();
    const headers = Object.assign({}, options.headers || {});
    if (token) headers["Authorization"] = "Bearer " + token;
    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(url, Object.assign({}, options, { headers }));
    if (res.status === 401) {
      clearAuth();
    }
    return res;
  }

  // 需要登录：未登录则跳转登录页，返回 false
  function requireAuth(redirect) {
    if (!isLoggedIn()) {
      const back = redirect || location.pathname.split("/").pop() || "index.html";
      location.href = "login.html?redirect=" + encodeURIComponent(back);
      return false;
    }
    return true;
  }

  // 注入导航栏登录状态样式（自包含，不污染 styles.css）
  function injectNavStyle() {
    if (document.getElementById("mm-auth-nav-style")) return;
    const style = document.createElement("style");
    style.id = "mm-auth-nav-style";
    style.textContent = [
      ".nav-auth-area{display:flex;align-items:center;gap:4px;margin-left:auto;padding-left:16px;border-left:1px solid rgba(148,163,184,.25);}",
      ".nav-auth-area a{font-size:14px;font-weight:500;color:#64748b;text-decoration:none;padding:6px 12px;border-radius:999px;transition:all .2s;white-space:nowrap;}",
      ".nav-auth-area a:hover{color:#ff6b35;background:rgba(255,107,53,.08);}",
      ".nav-auth-area .nav-user-link{color:#1e293b;font-weight:600;}",
      ".nav-auth-area .nav-logout-link{color:#94a3b8;font-weight:400;}",
      ".nav-auth-area .nav-register-link{background:linear-gradient(135deg,#ff6b35,#ff8e53);color:#fff;}",
      ".nav-auth-area .nav-register-link:hover{color:#fff;opacity:.92;}"
    ].join("");
    document.head.appendChild(style);
  }

  // 在导航栏注入登录状态
  function updateNavAuth() {
    injectNavStyle();
    const nav = document.querySelector(".nav-links");
    if (!nav) return;

    const old = nav.querySelector(".nav-auth-area");
    if (old) old.remove();

    const user = getCurrentUser();
    const area = document.createElement("span");
    area.className = "nav-auth-area";

    if (user) {
      area.innerHTML =
        '<a href="dashboard.html" class="nav-user-link">👤 ' +
        escapeHtml(user.displayName || "我") +
        "</a>" +
        '<a href="#" class="nav-logout-link" id="mmNavLogout">退出</a>';
      nav.appendChild(area);
      const btn = area.querySelector("#mmNavLogout");
      if (btn) btn.addEventListener("click", function (e) { e.preventDefault(); logout(); });
    } else {
      area.innerHTML =
        '<a href="login.html" class="nav-login-link">登录</a>' +
        '<a href="login.html?mode=register" class="nav-register-link">注册</a>';
      nav.appendChild(area);
    }
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
  }

  // 暴露到全局
  window.MMAuth = {
    getToken,
    getCurrentUser,
    isLoggedIn,
    setAuth,
    clearAuth,
    logout,
    authFetch,
    requireAuth,
    updateNavAuth
  };

  // 自动注入导航状态
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateNavAuth);
  } else {
    updateNavAuth();
  }
})();
