// 课堂记录模块：创建课堂记录、事件溯源进度更新、删除回滚

import { json, nowISO, generateId, truncate } from "./utils.js";
import { requireUser, requireRole, assertStudentAccess, assertStudentProjectAccess } from "./rbac.js";

function toInt(value, fallback = 0) {
  const num = Number.parseInt(value, 10);
  return Number.isFinite(num) ? num : fallback;
}

function clampProgress(value) {
  return Math.max(0, Math.min(100, value));
}

function jsonText(value) {
  if (value === undefined || value === null || value === "") return null;
  return typeof value === "string" ? value : JSON.stringify(value);
}

function mergeList(existingText, incoming) {
  const existing = safeParse(existingText);
  const base = Array.isArray(existing) ? existing : existing ? [String(existing)] : [];
  const next = Array.isArray(incoming) ? incoming : incoming ? [String(incoming)] : [];
  return Array.from(new Set(base.concat(next).map(item => String(item).trim()).filter(Boolean))).slice(-12);
}

async function updateStudentProfileFromSession(db, studentId, body) {
  const traits = body.personalityTraits ?? body.personality_traits;
  const interests = body.interestSignals ?? body.interest_signals;
  const learningStyle = body.learningStyle ?? body.learning_style;
  if (!traits && !interests && !learningStyle) return;

  const student = await db.prepare(
    "SELECT interest_direction, personality_traits FROM students WHERE student_id = ?"
  )
    .bind(studentId)
    .first();
  if (!student) return;

  await db.prepare(
    `UPDATE students
     SET interest_direction = ?, personality_traits = ?, learning_style = COALESCE(?, learning_style), updated_at = ?
     WHERE student_id = ?`
  )
    .bind(
      JSON.stringify(mergeList(student.interest_direction, interests)),
      JSON.stringify(mergeList(student.personality_traits, traits)),
      learningStyle ? truncate(learningStyle, 240) : null,
      nowISO(),
      studentId
    )
    .run();
}

function sessionRow(row) {
  return {
    id: row.id,
    studentProjectId: row.student_project_id,
    teacherId: row.teacher_id,
    sessionDate: row.session_date,
    durationMinutes: row.duration_minutes,
    rawTranscript: row.raw_transcript,
    structuredSummary: row.structured_summary,
    topicsCovered: safeParse(row.topics_covered),
    skillsDemonstrated: safeParse(row.skills_demonstrated),
    progressDelta: row.progress_delta,
    understandingScore: row.understanding_score,
    teacherNotes: row.teacher_notes,
    inputMethod: row.input_method
  };
}

function safeParse(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function recalculateProgress(db, studentProjectId) {
  const { results } = await db.prepare(
    "SELECT delta FROM progress_events WHERE student_project_id = ?"
  )
    .bind(studentProjectId)
    .all();

  const total = (results || []).reduce((sum, event) => sum + toInt(event.delta, 0), 0);
  const newPercent = clampProgress(total);
  let status = "IN_PROGRESS";
  let completedAt = null;

  if (newPercent <= 0) {
    status = "NOT_STARTED";
  } else if (newPercent >= 100) {
    status = "COMPLETED";
    completedAt = nowISO();
  }

  await db.prepare(
    `UPDATE student_projects
     SET progress_percent = ?, status = ?, completed_at = ?
     WHERE id = ?`
  )
    .bind(newPercent, status, completedAt, studentProjectId)
    .run();

  await db.prepare(
    `INSERT OR IGNORE INTO student_milestone_completions (id, student_project_id, milestone_id, completed_at, session_id)
     SELECT lower(hex(randomblob(16))), ?, m.id, ?, NULL
     FROM milestones m
     JOIN student_projects sp ON sp.project_id = m.project_id
     WHERE sp.id = ? AND m.expected_completion_percent <= ?`
  )
    .bind(studentProjectId, nowISO(), studentProjectId, newPercent)
    .run();

  return newPercent;
}

export async function handleCreateSession(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const roleError = requireRole(auth.user, ["teacher"]);
  if (roleError) return roleError;

  try {
    const body = await request.json();
    const studentProjectId = String(body.studentProjectId || body.student_project_id || "").trim();
    if (!studentProjectId) return json({ error: "缺少 studentProjectId" }, 400);

    const access = await assertStudentProjectAccess(env, auth.user, studentProjectId);
    if (access.response) return access.response;

    const current = toInt(access.studentProject.progress_percent, 0);
    const delta = toInt(body.progressDelta ?? body.progress_delta, 0);
    const id = generateId();
    const ts = nowISO();
    const sessionDate = truncate(body.sessionDate || body.session_date || ts, 40);
    const durationMinutes = body.durationMinutes ?? body.duration_minutes ?? null;
    const understandingScore = toInt(body.understandingScore ?? body.understanding_score, 3);

    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO sessions
         (id, student_project_id, teacher_id, session_date, duration_minutes, raw_transcript, structured_summary,
          topics_covered, skills_demonstrated, progress_delta, understanding_score, teacher_notes, input_method)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        studentProjectId,
        auth.user.id,
        sessionDate,
        durationMinutes,
        body.rawTranscript || body.raw_transcript || null,
        body.structuredSummary || body.structured_summary || null,
        jsonText(body.topicsCovered ?? body.topics_covered),
        jsonText(body.skillsDemonstrated ?? body.skills_demonstrated),
        delta,
        understandingScore,
        body.teacherNotes || body.teacher_notes || null,
        truncate(body.inputMethod || body.input_method || "API", 30)
      ),
      env.DB.prepare(
        `INSERT INTO progress_events
         (id, student_project_id, session_id, from_percent, to_percent, delta, reason, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        generateId(),
        studentProjectId,
        id,
        current,
        clampProgress(current + delta),
        delta,
        "SESSION_INCREMENT",
        auth.user.id,
        ts
      )
    ]);

    await updateStudentProfileFromSession(env.DB, access.studentProject.student_id, body);
    const progressPercent = await recalculateProgress(env.DB, studentProjectId);
    return json({ success: true, id, progressPercent });
  } catch (error) {
    return json({ error: "创建课堂记录失败", detail: error.message }, 400);
  }
}

export async function handleGetSession(request, env, id) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;

  const row = await env.DB.prepare("SELECT * FROM sessions WHERE id = ?")
    .bind(id)
    .first();
  if (!row) return json({ error: "课堂记录不存在" }, 404);

  const access = await assertStudentProjectAccess(env, auth.user, row.student_project_id);
  if (access.response) return access.response;

  return json({ session: sessionRow(row) });
}

export async function handleListSessionsForStudent(request, env, studentId) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;

  const access = await assertStudentAccess(env, auth.user, studentId);
  if (access.response) return access.response;

  const { results } = await env.DB.prepare(
    `SELECT se.*
     FROM sessions se
     JOIN student_projects sp ON se.student_project_id = sp.id
     WHERE sp.student_id = ?
     ORDER BY se.session_date DESC`
  )
    .bind(studentId)
    .all();

  return json({ sessions: (results || []).map(sessionRow) });
}

export async function handleDeleteSession(request, env, id) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const roleError = requireRole(auth.user, ["teacher"]);
  if (roleError) return roleError;

  try {
    const session = await env.DB.prepare("SELECT student_project_id FROM sessions WHERE id = ?")
      .bind(id)
      .first();
    if (!session) return json({ error: "课堂记录不存在" }, 404);

    const access = await assertStudentProjectAccess(env, auth.user, session.student_project_id);
    if (access.response) return access.response;

    await env.DB.batch([
      env.DB.prepare("DELETE FROM progress_events WHERE session_id = ?").bind(id),
      env.DB.prepare("DELETE FROM student_milestone_completions WHERE session_id = ?").bind(id),
      env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(id)
    ]);

    const progressPercent = await recalculateProgress(env.DB, session.student_project_id);
    return json({ success: true, progressPercent });
  } catch (error) {
    return json({ error: "删除课堂记录失败", detail: error.message }, 400);
  }
}
