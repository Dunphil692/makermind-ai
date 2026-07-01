// 项目方案存储模块：CRUD + 收藏
// 所有写操作均需登录鉴权

import { json, nowISO, generateId, truncate } from "./utils.js";
import { getUser } from "./auth.js";

// 从 instruction 数据中提取摘要字段，写入独立列以便检索与建立关系
function extractSummary(body) {
  const overview = body.overview || {};
  const meta = overview.meta || {};
  return {
    title: truncate(overview.projectName || body.title || "未命名项目", 120),
    subject: truncate(meta.subject || body.subject || "", 60),
    concept: truncate(meta.knowledgePoint || body.concept || "", 120),
    interest: truncate(meta.interest || body.interest || "", 60),
    kit: truncate(meta.hardware || body.kit || "", 60),
    duration: truncate(meta.timeRequired || body.duration || "", 60),
    level: truncate(overview.interactionFlow?.level || body.level || "", 30),
    imageKey: truncate(overview.imageKey || body.imageKey || "", 60)
  };
}

function projectListRow(row) {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    concept: row.concept,
    interest: row.interest,
    kit: row.kit,
    duration: row.duration,
    level: row.level,
    imageKey: row.image_key,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function projectDetailRow(row) {
  return {
    id: row.id,
    title: row.title,
    creatorId: row.creator_id,
    subject: row.subject,
    concept: row.concept,
    interest: row.interest,
    kit: row.kit,
    duration: row.duration,
    level: row.level,
    imageKey: row.image_key,
    status: row.status,
    parentProjectId: row.parent_project_id,
    overview: safeParse(row.overview_data),
    build: safeParse(row.build_data),
    practice: safeParse(row.practice_data),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function safeParse(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ---------- 项目 CRUD ----------

// POST /api/projects
export async function handleCreateProject(request, env) {
  const user = await getUser(request, env);
  if (!user) return json({ error: "请先登录" }, 401);

  try {
    const body = await request.json();
    const summary = extractSummary(body);
    const id = generateId();
    const ts = nowISO();
    const status = body.status === "published" ? "published" : "draft";

    await env.DB.prepare(
      `INSERT INTO projects
       (id, title, creator_id, class_id, knowledge_point_id, subject, concept, interest, kit, duration, level, image_key, overview_data, build_data, practice_data, status, parent_project_id, created_at, updated_at)
       VALUES (?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`
    )
      .bind(
        id, summary.title, user.id,
        summary.subject, summary.concept, summary.interest, summary.kit, summary.duration, summary.level, summary.imageKey,
        body.overview ? JSON.stringify(body.overview) : null,
        body.build ? JSON.stringify(body.build) : null,
        body.practice ? JSON.stringify(body.practice) : null,
        status,
        ts, ts
      )
      .run();

    return json({ id, ...summary, status, createdAt: ts });
  } catch (error) {
    return json({ error: "保存项目失败", detail: error.message }, 500);
  }
}

// GET /api/projects
export async function handleListProjects(request, env) {
  const user = await getUser(request, env);
  if (!user) return json({ error: "请先登录" }, 401);

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);

  const { results } = await env.DB.prepare(
    `SELECT id, title, subject, concept, interest, kit, duration, level, image_key, status, created_at, updated_at
     FROM projects WHERE creator_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`
  )
    .bind(user.id, limit, offset)
    .all();

  return json({ projects: results.map(projectListRow) });
}

// GET /api/projects/:id
export async function handleGetProject(request, env, id) {
  const user = await getUser(request, env);
  if (!user) return json({ error: "请先登录" }, 401);

  const row = await env.DB.prepare(
    `SELECT * FROM projects WHERE id = ?`
  )
    .bind(id)
    .first();

  if (!row) return json({ error: "项目不存在" }, 404);

  // 仅创建者、已发布项目，或被布置到自己/孩子名下的项目可查看
  if (row.creator_id !== user.id && row.status !== "published") {
    const assigned = await env.DB.prepare(
      `SELECT sp.id
       FROM student_projects sp
       JOIN students s ON sp.student_id = s.student_id
       WHERE sp.project_id = ?
         AND (s.user_id = ? OR s.parent_id = ?)
       LIMIT 1`
    )
      .bind(id, user.id, user.id)
      .first();

    if (!assigned) return json({ error: "无权查看此项目" }, 403);
  }

  return json({ project: projectDetailRow(row) });
}

// PUT /api/projects/:id
export async function handleUpdateProject(request, env, id) {
  const user = await getUser(request, env);
  if (!user) return json({ error: "请先登录" }, 401);

  const existing = await env.DB.prepare("SELECT creator_id FROM projects WHERE id = ?")
    .bind(id)
    .first();

  if (!existing) return json({ error: "项目不存在" }, 404);
  if (existing.creator_id !== user.id) return json({ error: "无权修改此项目" }, 403);

  try {
    const body = await request.json();
    const summary = extractSummary(body);
    const ts = nowISO();
    const status = body.status === "published" ? "published" : body.status === "draft" ? "draft" : undefined;

    await env.DB.prepare(
      `UPDATE projects SET
        title = ?, subject = ?, concept = ?, interest = ?, kit = ?, duration = ?, level = ?, image_key = ?,
        overview_data = ?, build_data = ?, practice_data = ?,
        status = COALESCE(?, status),
        updated_at = ?
       WHERE id = ?`
    )
      .bind(
        summary.title, summary.subject, summary.concept, summary.interest, summary.kit, summary.duration, summary.level, summary.imageKey,
        body.overview ? JSON.stringify(body.overview) : null,
        body.build ? JSON.stringify(body.build) : null,
        body.practice ? JSON.stringify(body.practice) : null,
        status,
        ts, id
      )
      .run();

    return json({ id, ...summary, updatedAt: ts });
  } catch (error) {
    return json({ error: "更新项目失败", detail: error.message }, 500);
  }
}

// DELETE /api/projects/:id
export async function handleDeleteProject(request, env, id) {
  const user = await getUser(request, env);
  if (!user) return json({ error: "请先登录" }, 401);

  const existing = await env.DB.prepare("SELECT creator_id FROM projects WHERE id = ?")
    .bind(id)
    .first();

  if (!existing) return json({ error: "项目不存在" }, 404);
  if (existing.creator_id !== user.id) return json({ error: "无权删除此项目" }, 403);

  await env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();
  // 级联清理收藏与进度
  await env.DB.prepare("DELETE FROM favorites WHERE project_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM student_projects WHERE project_id = ?").bind(id).run();

  return json({ ok: true, id });
}

// ---------- 收藏 ----------

// POST /api/projects/:id/favorite
export async function handleAddFavorite(request, env, id) {
  const user = await getUser(request, env);
  if (!user) return json({ error: "请先登录" }, 401);

  const project = await env.DB.prepare("SELECT id FROM projects WHERE id = ?").bind(id).first();
  if (!project) return json({ error: "项目不存在" }, 404);

  try {
    await env.DB.prepare(
      "INSERT INTO favorites (id, user_id, project_id, created_at) VALUES (?, ?, ?, ?)"
    )
      .bind(generateId(), user.id, id, nowISO())
      .run();
  } catch (error) {
    // 已收藏则忽略
    if (!String(error.message).includes("UNIQUE")) {
      return json({ error: "收藏失败", detail: error.message }, 500);
    }
  }

  return json({ ok: true, favorited: true });
}

// DELETE /api/projects/:id/favorite
export async function handleRemoveFavorite(request, env, id) {
  const user = await getUser(request, env);
  if (!user) return json({ error: "请先登录" }, 401);

  await env.DB.prepare("DELETE FROM favorites WHERE user_id = ? AND project_id = ?")
    .bind(user.id, id)
    .run();

  return json({ ok: true, favorited: false });
}

// GET /api/favorites
export async function handleListFavorites(request, env) {
  const user = await getUser(request, env);
  if (!user) return json({ error: "请先登录" }, 401);

  const { results } = await env.DB.prepare(
    `SELECT p.id, p.title, p.subject, p.concept, p.interest, p.kit, p.duration, p.level, p.image_key, p.status, p.created_at, f.created_at AS favorited_at
     FROM favorites f
     JOIN projects p ON f.project_id = p.id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC`
  )
    .bind(user.id)
    .all();

  return json({ favorites: results });
}
