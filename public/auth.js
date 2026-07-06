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
      const roleHome = user.role === "teacher" ? "teacher.html" : user.role === "parent" ? "parent.html" : user.role === "student" ? "student.html" : "dashboard.html";
      const roleLabel = user.role === "teacher" ? "教师端" : user.role === "parent" ? "家长端" : user.role === "student" ? "学生端" : "工作台";
      area.innerHTML =
        '<a href="' + roleHome + '" class="nav-user-link">👤 ' +
        escapeHtml(user.displayName || roleLabel || "我") +
        "</a>" +
        '<a href="' + roleHome + '" class="nav-user-link">' + roleLabel + '</a>' +
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
    document.addEventListener("DOMContentLoaded", function () { updateNavAuth(); injectMobileNav(); injectBackToTop(); injectSkipLink(); });
  } else {
    updateNavAuth();
    injectMobileNav();
    injectBackToTop();
    injectSkipLink();
  }

  /* ===== Mobile hamburger navigation ===== */
  function injectMobileNav() {
    if (document.getElementById("mm-hamburger-btn")) return;

    // Hamburger button
    const hamburger = document.createElement("button");
    hamburger.id = "mm-hamburger-btn";
    hamburger.className = "hamburger-btn";
    hamburger.setAttribute("aria-label", "菜单");
    hamburger.innerHTML = "<span></span><span></span><span></span>";

    // Mobile drawer
    const drawer = document.createElement("div");
    drawer.id = "mm-mobile-drawer";
    drawer.className = "mobile-nav-drawer";

    // Clone nav links into drawer
    const navLinks = document.querySelector(".nav-links");
    const links = navLinks ? navLinks.querySelectorAll("a") : [];
    const currentPath = location.pathname.split("/").pop() || "index.html";

    let drawerHTML = '<div class="drawer-panel">';
    links.forEach(function (a) {
      const href = a.getAttribute("href");
      const isActive = href === currentPath || a.classList.contains("active");
      drawerHTML += '<a href="' + href + '" class="' + (isActive ? "active" : "") + '">' + a.textContent + '</a>';
    });
    // Add auth links
    const user = getCurrentUser();
    if (user) {
      const roleHome = user.role === "teacher" ? "teacher.html" : user.role === "parent" ? "parent.html" : user.role === "student" ? "student.html" : "dashboard.html";
      drawerHTML += '<div class="drawer-divider"></div>';
      drawerHTML += '<a href="' + roleHome + '">👤 ' + escapeHtml(user.displayName || "我") + '</a>';
      drawerHTML += '<a href="#" id="mmDrawerLogout">退出登录</a>';
    } else {
      drawerHTML += '<div class="drawer-divider"></div>';
      drawerHTML += '<a href="login.html">登录</a>';
      drawerHTML += '<a href="login.html?mode=register">注册</a>';
    }
    drawerHTML += '</div>';
    drawer.innerHTML = drawerHTML;

    // Toggle
    hamburger.addEventListener("click", function () {
      const isOpen = hamburger.classList.toggle("open");
      drawer.classList.toggle("open");
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    drawer.addEventListener("click", function (e) {
      if (e.target === drawer || e.target.classList.contains("drawer-panel")) return;
      if (e.target.id === "mmDrawerLogout") { e.preventDefault(); logout(); }
      hamburger.classList.remove("open");
      drawer.classList.remove("open");
      document.body.style.overflow = "";
    });

    const topbar = document.querySelector(".topbar");
    if (topbar) {
      topbar.appendChild(hamburger);
      document.body.appendChild(drawer);
    }
  }

  /* ===== Back to top button ===== */
  function injectBackToTop() {
    if (document.getElementById("mm-back-to-top")) return;
    const btn = document.createElement("button");
    btn.id = "mm-back-to-top";
    btn.className = "back-to-top";
    btn.setAttribute("aria-label", "返回顶部");
    btn.innerHTML = "↑";
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    document.body.appendChild(btn);

    let scrollTicking = false;
    window.addEventListener("scroll", function () {
      if (!scrollTicking) {
        requestAnimationFrame(function () {
          if (window.scrollY > 400) {
            btn.classList.add("visible");
          } else {
            btn.classList.remove("visible");
          }
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }, { passive: true });
  }

  /* ===== Preload critical above-fold images ===== */
  (function () {
    var criticalImages = document.querySelectorAll(".instruction-visual img, .project-card-img");
    criticalImages.forEach(function (img) {
      if (img.loading === "lazy") img.loading = "eager";
    });
  })();

  /* ===== Image lazy load observer ===== */
  (function () {
    if (!("IntersectionObserver" in window)) return;
    var imgObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            delete img.dataset.src;
          }
          img.addEventListener("load", function () { img.classList.add("loaded"); });
          if (img.complete) img.classList.add("loaded");
          imgObserver.unobserve(img);
        }
      });
    }, { rootMargin: "200px" });
    document.querySelectorAll("img[loading='lazy']").forEach(function (img) {
      imgObserver.observe(img);
    });
    // Also observe dynamically added images
    if (window.MutationObserver) {
      new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          m.addedNodes.forEach(function (node) {
            if (node.tagName === "IMG" && node.loading === "lazy") {
              imgObserver.observe(node);
            }
            if (node.querySelectorAll) {
              node.querySelectorAll("img[loading='lazy']").forEach(function (img) {
                imgObserver.observe(img);
              });
            }
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
    }
  })();

  /* ===== Global image error fallback ===== */
  document.addEventListener("error", function (e) {
    var img = e.target;
    if (img && img.tagName === "IMG" && !img.dataset.fallbackTried) {
      img.dataset.fallbackTried = "1";
      var fallback = "/assets/reaction-trainer.jpg";
      if (img.src !== fallback) img.src = fallback;
    }
  }, true);

  /* ===== Skip to content (accessibility) ===== */
  function injectSkipLink() {
    if (document.getElementById("mm-skip-link")) return;
    var skipLink = document.createElement("a");
    skipLink.id = "mm-skip-link";
    skipLink.href = "#main-content";
    skipLink.textContent = "跳转到主要内容";
    skipLink.setAttribute("style", "position:absolute;top:-100px;left:16px;z-index:100;padding:12px 20px;background:#ff6b35;color:#fff;font-weight:700;border-radius:0 0 12px 12px;transition:top 0.2s;");
    skipLink.addEventListener("focus", function () { skipLink.style.top = "0"; });
    skipLink.addEventListener("blur", function () { skipLink.style.top = "-100px"; });
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Ensure main content has an id for skip link
    var mainEl = document.querySelector("main");
    if (mainEl && !mainEl.id) mainEl.id = "main-content";
  }

  /* ===== Global Escape key handler ===== */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;

    // Close mobile nav drawer
    var hamburger = document.getElementById("mm-hamburger-btn");
    var drawer = document.getElementById("mm-mobile-drawer");
    if (hamburger && hamburger.classList.contains("open")) {
      hamburger.classList.remove("open");
      if (drawer) drawer.classList.remove("open");
      document.body.style.overflow = "";
      return;
    }

    // Close any visible modal overlays
    var modals = document.querySelectorAll(".modal-overlay");
    modals.forEach(function (modal) {
      if (modal.style.display !== "none" && getComputedStyle(modal).display !== "none") {
        modal.style.display = "none";
      }
    });
  });
})();
