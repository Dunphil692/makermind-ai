// 认证模块：密码哈希（PBKDF2）、JWT 签发/验证、注册/登录 handler
// 全部使用 Web Crypto API，零依赖，原生支持 Cloudflare Workers

import { json, nowISO, generateId, isValidEmail, isValidPassword, truncate } from "./utils.js";

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 天

// ---------- 编码辅助 ----------

function bufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

function base64url(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let str = "";
  for (let i = 0; i < bytes.length; i += 1) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function textEncode(text) {
  return new TextEncoder().encode(text);
}

// ---------- 密码哈希 ----------

function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

async function hashPassword(password, saltBytes) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textEncode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );

  return bufferToHex(bits);
}

function saltToHex(saltBytes) {
  return bufferToHex(saltBytes);
}

function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function verifyPassword(password, storedHash, saltHex) {
  const saltBytes = hexToBuffer(saltHex);
  const testHash = await hashPassword(password, saltBytes);
  return testHash === storedHash;
}

// ---------- JWT（HMAC-SHA256）----------

async function signJWT(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encHeader = base64url(textEncode(JSON.stringify(header)));
  const encPayload = base64url(textEncode(JSON.stringify(payload)));
  const data = `${encHeader}.${encPayload}`;

  const key = await crypto.subtle.importKey(
    "raw",
    textEncode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", key, textEncode(data));
  return `${data}.${base64url(sig)}`;
}

async function verifyJWT(token, secret) {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const data = `${parts[0]}.${parts[1]}`;
  const key = await crypto.subtle.importKey(
    "raw",
    textEncode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const sigBytes = base64urlDecode(parts[2]);

  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, textEncode(data));
  if (!valid) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(parts[1])));
    if (payload.exp && Date.now() >= payload.exp * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------- 鉴权：从请求中解析当前用户 ----------

export async function getUser(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) return null;

  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload || !payload.sub) return null;

  const result = await env.DB.prepare("SELECT id, email, role, display_name, avatar FROM users WHERE id = ?")
    .bind(payload.sub)
    .first();

  return result || null;
}

// 生成安全的用户公开信息（不含密码）
function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    displayName: row.display_name,
    avatar: row.avatar || null
  };
}

// ---------- handler ----------

export async function handleRegister(request, env) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const displayName = String(body.displayName || "").trim();
    const role = body.role === "student" ? "student" : "teacher";

    if (!isValidEmail(email)) {
      return json({ error: "邮箱格式不正确" }, 400);
    }
    if (!isValidPassword(password)) {
      return json({ error: "密码至少需要 6 位" }, 400);
    }
    if (!displayName) {
      return json({ error: "请填写昵称" }, 400);
    }

    const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?")
      .bind(email)
      .first();

    if (existing) {
      return json({ error: "该邮箱已注册" }, 409);
    }

    const saltBytes = generateSalt();
    const passwordHash = await hashPassword(password, saltBytes);
    const saltHex = saltToHex(saltBytes);
    const id = generateId();
    const ts = nowISO();

    await env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, password_salt, role, display_name, avatar, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)`
    )
      .bind(id, email, passwordHash, saltHex, role, truncate(displayName, 40), ts, ts)
      .run();

    const token = await signJWT(
      { sub: id, email, role, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS },
      env.JWT_SECRET
    );

    return json({
      token,
      user: { id, email, role, displayName: truncate(displayName, 40), avatar: null }
    });
  } catch (error) {
    return json({ error: "注册失败", detail: error.message }, 500);
  }
}

export async function handleLogin(request, env) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return json({ error: "请输入邮箱和密码" }, 400);
    }

    const row = await env.DB.prepare(
      "SELECT id, email, password_hash, password_salt, role, display_name, avatar FROM users WHERE email = ?"
    )
      .bind(email)
      .first();

    if (!row) {
      return json({ error: "邮箱或密码不正确" }, 401);
    }

    const ok = await verifyPassword(password, row.password_hash, row.password_salt);
    if (!ok) {
      return json({ error: "邮箱或密码不正确" }, 401);
    }

    const token = await signJWT(
      { sub: row.id, email: row.email, role: row.role, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS },
      env.JWT_SECRET
    );

    return json({
      token,
      user: publicUser(row)
    });
  } catch (error) {
    return json({ error: "登录失败", detail: error.message }, 500);
  }
}

export async function handleMe(request, env) {
  const user = await getUser(request, env);
  if (!user) {
    return json({ error: "未登录或登录已过期" }, 401);
  }
  return json({ user: publicUser(user) });
}
