// 作品与比赛记录模块：R2 上传暂不接入，文件信息先存字符串

import { json, nowISO, truncate } from "./utils.js";
import { requireUser, requireRole, assertStudentAccess } from "./rbac.js";

function textValue(value, max = 500) {
  if (value === undefined || value === null || value === "") return null;
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  return truncate(text, max);
}

function intValue(value) {
  if (value === undefined || value === null || value === "") return null;
  const num = Number.parseInt(value, 10);
  return Number.isFinite(num) ? num : null;
}

function workRow(row) {
  return {
    workId: row.work_id,
    studentId: row.student_id,
    workName: row.work_name,
    workType: row.work_type,
    description: row.description,
    sourceType: row.source_type,
    filePaths: parseMaybeJson(row.file_paths),
    imageUrls: parseMaybeJson(row.image_urls),
    sourceUrl: row.source_url,
    extractedContent: row.extracted_content,
    status: row.status,
    competitionId: row.competition_id,
    createdDate: row.created_date
  };
}

function competitionRow(row) {
  return {
    competitionId: row.competition_id,
    studentId: row.student_id,
    competitionName: row.competition_name,
    year: row.year,
    workName: row.work_name,
    award: row.award,
    status: row.status,
    createdAt: row.created_at
  };
}

function parseMaybeJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function handleListWorks(request, env, studentId) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const access = await assertStudentAccess(env, auth.user, studentId);
  if (access.response) return access.response;

  const { results } = await env.DB.prepare(
    "SELECT * FROM works WHERE student_id = ? ORDER BY created_date DESC"
  )
    .bind(studentId)
    .all();
  return json({ works: (results || []).map(workRow) });
}

export async function handleCreateWork(request, env, studentId) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const access = await assertStudentAccess(env, auth.user, studentId);
  if (access.response) return access.response;
  if (auth.user.role === "parent") return json({ error: "家长端仅可查看作品" }, 403);

  try {
    const body = await request.json();
    const result = await env.DB.prepare(
      `INSERT INTO works
       (student_id, work_name, work_type, description, source_type, file_paths, image_urls,
        source_url, extracted_content, status, competition_id, created_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        studentId,
        textValue(body.workName ?? body.work_name, 120),
        textValue(body.workType ?? body.work_type, 60),
        textValue(body.description, 1000),
        textValue(body.sourceType ?? body.source_type, 40),
        textValue(body.filePaths ?? body.file_paths ?? body.file_url, 2000),
        textValue(body.imageUrls ?? body.image_urls, 2000),
        textValue(body.sourceUrl ?? body.source_url, 500),
        textValue(body.extractedContent ?? body.extracted_content, 4000),
        textValue(body.status || "submitted", 40),
        intValue(body.competitionId ?? body.competition_id),
        textValue(body.createdDate ?? body.created_date ?? nowISO(), 40)
      )
      .run();

    return json({ success: true, workId: result.meta?.last_row_id });
  } catch (error) {
    return json({ error: "创建作品失败", detail: error.message }, 400);
  }
}

export async function handleUpdateWork(request, env, studentId, workId) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const access = await assertStudentAccess(env, auth.user, studentId);
  if (access.response) return access.response;
  if (auth.user.role === "parent") return json({ error: "家长端仅可查看作品" }, 403);

  try {
    const body = await request.json();
    await env.DB.prepare(
      `UPDATE works SET
       work_name = COALESCE(?, work_name),
       work_type = COALESCE(?, work_type),
       description = COALESCE(?, description),
       source_type = COALESCE(?, source_type),
       file_paths = COALESCE(?, file_paths),
       image_urls = COALESCE(?, image_urls),
       source_url = COALESCE(?, source_url),
       extracted_content = COALESCE(?, extracted_content),
       status = COALESCE(?, status),
       competition_id = COALESCE(?, competition_id)
       WHERE student_id = ? AND work_id = ?`
    )
      .bind(
        textValue(body.workName ?? body.work_name, 120),
        textValue(body.workType ?? body.work_type, 60),
        textValue(body.description, 1000),
        textValue(body.sourceType ?? body.source_type, 40),
        textValue(body.filePaths ?? body.file_paths ?? body.file_url, 2000),
        textValue(body.imageUrls ?? body.image_urls, 2000),
        textValue(body.sourceUrl ?? body.source_url, 500),
        textValue(body.extractedContent ?? body.extracted_content, 4000),
        textValue(body.status, 40),
        intValue(body.competitionId ?? body.competition_id),
        studentId,
        workId
      )
      .run();
    return json({ success: true });
  } catch (error) {
    return json({ error: "更新作品失败", detail: error.message }, 400);
  }
}

export async function handleDeleteWork(request, env, studentId, workId) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const roleError = requireRole(auth.user, ["teacher"]);
  if (roleError) return roleError;

  await env.DB.prepare("DELETE FROM works WHERE student_id = ? AND work_id = ?")
    .bind(studentId, workId)
    .run();
  return json({ success: true });
}

export async function handleListCompetitions(request, env, studentId) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const access = await assertStudentAccess(env, auth.user, studentId);
  if (access.response) return access.response;

  const { results } = await env.DB.prepare(
    "SELECT * FROM competition_records WHERE student_id = ? ORDER BY year DESC, created_at DESC"
  )
    .bind(studentId)
    .all();
  return json({ competitions: (results || []).map(competitionRow) });
}

export async function handleCreateCompetition(request, env, studentId) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const roleError = requireRole(auth.user, ["teacher"]);
  if (roleError) return roleError;

  try {
    const body = await request.json();
    const result = await env.DB.prepare(
      `INSERT INTO competition_records
       (student_id, competition_name, year, work_name, award, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        studentId,
        textValue(body.competitionName ?? body.competition_name, 120),
        intValue(body.year),
        textValue(body.workName ?? body.work_name, 120),
        textValue(body.award, 120),
        textValue(body.status || "recorded", 40),
        nowISO()
      )
      .run();
    return json({ success: true, competitionId: result.meta?.last_row_id });
  } catch (error) {
    return json({ error: "创建比赛记录失败", detail: error.message }, 400);
  }
}

export async function handleDeleteCompetition(request, env, studentId, competitionId) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const roleError = requireRole(auth.user, ["teacher"]);
  if (roleError) return roleError;

  await env.DB.prepare("DELETE FROM competition_records WHERE student_id = ? AND competition_id = ?")
    .bind(studentId, competitionId)
    .run();
  return json({ success: true });
}
