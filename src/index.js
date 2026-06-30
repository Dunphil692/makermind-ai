// MakerMind AI — Cloudflare Workers 主入口
// 路由分发：认证 / 项目存储 / AI 生成 / 静态资源

import { json, serveStatic } from "./utils.js";
import { handleRegister, handleLogin, handleMe } from "./auth.js";
import {
  handleCreateProject,
  handleListProjects,
  handleGetProject,
  handleUpdateProject,
  handleDeleteProject,
  handleAddFavorite,
  handleRemoveFavorite,
  handleListFavorites
} from "./projects.js";
import { handleDialogueTaskBrief, handleGenerateInstructionPart } from "./ai.js";

function methodNotAllowed() {
  return json({ error: "Method not allowed" }, 405);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // CORS 预检
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
        }
      });
    }

    // ---------- 认证 ----------
    if (pathname === "/api/auth/register") {
      return method === "POST" ? handleRegister(request, env) : methodNotAllowed();
    }

    if (pathname === "/api/auth/login") {
      return method === "POST" ? handleLogin(request, env) : methodNotAllowed();
    }

    if (pathname === "/api/auth/me") {
      return method === "GET" ? handleMe(request, env) : methodNotAllowed();
    }

    // ---------- AI 生成 ----------
    if (pathname === "/api/dialogue-task-brief") {
      return method === "POST" ? handleDialogueTaskBrief(request, env) : methodNotAllowed();
    }

    if (pathname === "/api/generate-instruction-part") {
      return method === "POST" ? handleGenerateInstructionPart(request, env) : methodNotAllowed();
    }

    // 兼容旧路径
    if (pathname === "/api/generate-projects" || pathname === "/api/generate-instruction") {
      if (method !== "POST") return methodNotAllowed();
      return json(
        {
          error: "This generator now uses segmented instruction generation",
          detail: "Please call /api/generate-instruction-part with part = overview, build, or practice."
        },
        400
      );
    }

    // ---------- 项目方案 ----------
    if (pathname === "/api/projects") {
      if (method === "POST") return handleCreateProject(request, env);
      if (method === "GET") return handleListProjects(request, env);
      return methodNotAllowed();
    }

    // /api/projects/:id
    const projectMatch = pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (projectMatch) {
      const id = projectMatch[1];
      if (method === "GET") return handleGetProject(request, env, id);
      if (method === "PUT") return handleUpdateProject(request, env, id);
      if (method === "DELETE") return handleDeleteProject(request, env, id);
      return methodNotAllowed();
    }

    // /api/projects/:id/favorite
    const favMatch = pathname.match(/^\/api\/projects\/([^/]+)\/favorite$/);
    if (favMatch) {
      const id = favMatch[1];
      if (method === "POST") return handleAddFavorite(request, env, id);
      if (method === "DELETE") return handleRemoveFavorite(request, env, id);
      return methodNotAllowed();
    }

    // /api/favorites
    if (pathname === "/api/favorites") {
      return method === "GET" ? handleListFavorites(request, env) : methodNotAllowed();
    }

    // ---------- 静态资源 ----------
    return serveStatic(request, env);
  }
};
