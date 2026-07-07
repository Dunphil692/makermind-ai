// 通用工具函数：响应、静态文件服务、ID 生成、时间戳

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
    }
  });
}

export function nowISO() {
  return new Date().toISOString();
}

export function generateId() {
  return crypto.randomUUID();
}

// 邀请码：6 位大写字母数字
export function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 6; i += 1) {
    code += chars[arr[i] % chars.length];
  }
  return code;
}

export async function serveStatic(request, env) {
  const url = new URL(request.url);

  if (url.pathname === "/") {
    url.pathname = "/index.html";
  } else if (!url.pathname.includes(".") && !url.pathname.startsWith("/api/")) {
    url.pathname = `${url.pathname}.html`;
  }

  const response = await env.ASSETS.fetch(new Request(url.toString(), request));

  // 为静态资源添加缓存头，加速页面切换
  const isHtml = url.pathname.endsWith(".html") || url.pathname === "/";
  const headers = new Headers(response.headers);

  if (isHtml) {
    // HTML 页面：短缓存，确保更新及时生效
    headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  } else {
    // CSS/JS/图片：长缓存，浏览器复用已下载文件
    headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// 输入校验：邮箱格式
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

// 输入校验：密码强度（至少 6 位）
export function isValidPassword(password) {
  return typeof password === "string" && password.length >= 6;
}

// 安全截断字符串
export function truncate(value, max = 200) {
  const text = String(value ?? "");
  return text.length > max ? text.slice(0, max) : text;
}
