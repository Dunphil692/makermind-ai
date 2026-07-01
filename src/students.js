// 学员档案模块：学员 CRUD、项目布置、个人进度总览

import { json, nowISO, generateId, truncate } from "./utils.js";
import { requireUser, requireRole, assertStudentAccess } from "./rbac.js";

function stringifyValue(value) {
  if (value === undefined || value === null || value === "") return null;
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function toNullableInt(value) {
  if (value === undefined || value === null || value === "") return null;
  const num = Number.parseInt(value, 10);
  return Number.isFinite(num) ? num : null;
}

function studentRow(row) {
  return {
    studentId: row.student_id,
    userId: row.user_id,
    name: row.name,
    age: row.age,
    grade: row.grade,
    school: row.school,
    parentId: row.parent_id,
    parentPhone: row.parent_phone,
    assignedTeacherId: row.assigned_teacher_id,
    enrolledAt: row.enrolled_at,
    currentStage: row.current_stage,
    skillLevel: parseMaybeJson(row.skill_level),
    interestDirection: parseMaybeJson(row.interest_direction),
    personalityTraits: parseMaybeJson(row.personality_traits),
    learningStyle: row.learning_style,
    learningGoal: parseMaybeJson(row.learning_goal),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function projectProgressRow(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    projectId: row.project_id,
    teacherId: row.teacher_id,
    status: row.status,
    progressPercent: row.progress_percent,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    title: row.title,
    subject: row.subject,
    concept: row.concept,
    difficultyLevel: row.difficulty_level,
    expectedDurationHours: row.expected_duration_hours
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

export async function handleListStudents(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;

  let query = "SELECT * FROM students ORDER BY created_at DESC";
  const params = [];

  if (auth.user.role === "parent") {
    query = "SELECT * FROM students WHERE parent_id = ? ORDER BY created_at DESC";
    params.push(auth.user.id);
  } else if (auth.user.role === "student") {
    query = "SELECT * FROM students WHERE user_id = ? ORDER BY created_at DESC";
    params.push(auth.user.id);
  }

  const { results } = await env.DB.prepare(query).bind(...params).all();
  return json({ students: (results || []).map(studentRow) });
}

export async function handleCreateStudent(request, env) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const roleError = requireRole(auth.user, ["teacher"]);
  if (roleError) return roleError;

  try {
    const body = await request.json();
    const name = truncate(body.name || "", 80).trim();
    if (!name) return json({ error: "请填写学员姓名" }, 400);

    const id = truncate(body.studentId || body.student_id || generateId(), 80);
    const ts = nowISO();

    await env.DB.prepare(
      `INSERT INTO students
       (student_id, user_id, name, age, grade, school, parent_id, parent_phone, assigned_teacher_id,
        enrolled_at, current_stage, skill_level, interest_direction, personality_traits, learning_style, learning_goal, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        body.userId || body.user_id || null,
        name,
        toNullableInt(body.age),
        stringifyValue(body.grade),
        stringifyValue(body.school),
        body.parentId || body.parent_id || null,
        stringifyValue(body.parentPhone ?? body.parent_phone),
        body.assignedTeacherId || body.assigned_teacher_id || auth.user.id,
        stringifyValue(body.enrolledAt ?? body.enrolled_at) || ts,
        stringifyValue(body.currentStage ?? body.current_stage),
        stringifyValue(body.skillLevel ?? body.skill_level),
        stringifyValue(body.interestDirection ?? body.interest_direction),
        stringifyValue(body.personalityTraits ?? body.personality_traits),
        stringifyValue(body.learningStyle ?? body.learning_style),
        stringifyValue(body.learningGoal ?? body.learning_goal),
        stringifyValue(body.notes),
        ts,
        ts
      )
      .run();

    return json({ success: true, studentId: id });
  } catch (error) {
    return json({ error: "创建学员失败", detail: error.message }, 400);
  }
}

export async function handleGetStudent(request, env, id) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;

  const access = await assertStudentAccess(env, auth.user, id);
  if (access.response) return access.response;

  const row = await env.DB.prepare("SELECT * FROM students WHERE student_id = ?")
    .bind(id)
    .first();
  return json({ student: studentRow(row) });
}

export async function handleUpdateStudent(request, env, id) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const roleError = requireRole(auth.user, ["teacher"]);
  if (roleError) return roleError;

  const existing = await env.DB.prepare("SELECT student_id FROM students WHERE student_id = ?")
    .bind(id)
    .first();
  if (!existing) return json({ error: "学员不存在" }, 404);

  try {
    const body = await request.json();
    const ts = nowISO();
    await env.DB.prepare(
      `UPDATE students SET
       name = COALESCE(?, name),
       age = COALESCE(?, age),
       grade = COALESCE(?, grade),
       school = COALESCE(?, school),
       parent_id = COALESCE(?, parent_id),
       user_id = COALESCE(?, user_id),
       parent_phone = COALESCE(?, parent_phone),
       assigned_teacher_id = COALESCE(?, assigned_teacher_id),
       enrolled_at = COALESCE(?, enrolled_at),
       current_stage = COALESCE(?, current_stage),
       skill_level = COALESCE(?, skill_level),
       interest_direction = COALESCE(?, interest_direction),
       personality_traits = COALESCE(?, personality_traits),
       learning_style = COALESCE(?, learning_style),
       learning_goal = COALESCE(?, learning_goal),
       notes = COALESCE(?, notes),
       updated_at = ?
       WHERE student_id = ?`
    )
      .bind(
        body.name === undefined ? null : truncate(body.name, 80),
        body.age === undefined ? null : toNullableInt(body.age),
        body.grade === undefined ? null : stringifyValue(body.grade),
        body.school === undefined ? null : stringifyValue(body.school),
        body.parentId || body.parent_id || null,
        body.userId || body.user_id || null,
        body.parentPhone === undefined && body.parent_phone === undefined ? null : stringifyValue(body.parentPhone ?? body.parent_phone),
        body.assignedTeacherId || body.assigned_teacher_id || null,
        body.enrolledAt === undefined && body.enrolled_at === undefined ? null : stringifyValue(body.enrolledAt ?? body.enrolled_at),
        body.currentStage === undefined && body.current_stage === undefined ? null : stringifyValue(body.currentStage ?? body.current_stage),
        body.skillLevel === undefined && body.skill_level === undefined ? null : stringifyValue(body.skillLevel ?? body.skill_level),
        body.interestDirection === undefined && body.interest_direction === undefined ? null : stringifyValue(body.interestDirection ?? body.interest_direction),
        body.personalityTraits === undefined && body.personality_traits === undefined ? null : stringifyValue(body.personalityTraits ?? body.personality_traits),
        body.learningStyle === undefined && body.learning_style === undefined ? null : stringifyValue(body.learningStyle ?? body.learning_style),
        body.learningGoal === undefined && body.learning_goal === undefined ? null : stringifyValue(body.learningGoal ?? body.learning_goal),
        body.notes === undefined ? null : stringifyValue(body.notes),
        ts,
        id
      )
      .run();

    return json({ success: true, updatedAt: ts });
  } catch (error) {
    return json({ error: "更新学员失败", detail: error.message }, 400);
  }
}

export async function handleDeleteStudent(request, env, id) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const roleError = requireRole(auth.user, ["teacher"]);
  if (roleError) return roleError;

  await env.DB.prepare("DELETE FROM students WHERE student_id = ?")
    .bind(id)
    .run();
  return json({ success: true });
}

export async function handleGetStudentProgress(request, env, id) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;

  const access = await assertStudentAccess(env, auth.user, id);
  if (access.response) return access.response;

  const { results } = await env.DB.prepare(
    `SELECT sp.*, p.title, p.subject, p.concept, p.difficulty_level, p.expected_duration_hours
     FROM student_projects sp
     JOIN projects p ON sp.project_id = p.id
     WHERE sp.student_id = ?
     ORDER BY sp.started_at DESC`
  )
    .bind(id)
    .all();

  const projects = (results || []).map(projectProgressRow);
  const averageProgress = projects.length
    ? Math.round(projects.reduce((sum, item) => sum + Number(item.progressPercent || 0), 0) / projects.length)
    : 0;

  return json({ progress: projects, summary: { totalProjects: projects.length, averageProgress } });
}

export async function handleAssignProject(request, env, id) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const roleError = requireRole(auth.user, ["teacher"]);
  if (roleError) return roleError;

  const student = await env.DB.prepare("SELECT student_id FROM students WHERE student_id = ?")
    .bind(id)
    .first();
  if (!student) return json({ error: "学员不存在" }, 404);

  try {
    const body = await request.json();
    const projectId = String(body.projectId || body.project_id || "").trim();
    if (!projectId) return json({ error: "缺少 projectId" }, 400);

    const project = await env.DB.prepare("SELECT id FROM projects WHERE id = ?")
      .bind(projectId)
      .first();
    if (!project) return json({ error: "项目不存在" }, 404);

    const assignmentId = generateId();
    const ts = nowISO();
    await env.DB.prepare(
      `INSERT INTO student_projects (id, student_id, project_id, teacher_id, status, progress_percent, started_at, completed_at)
       VALUES (?, ?, ?, ?, 'NOT_STARTED', 0, ?, NULL)`
    )
      .bind(assignmentId, id, projectId, body.teacherId || body.teacher_id || auth.user.id, ts)
      .run();

    return json({ success: true, id: assignmentId, startedAt: ts });
  } catch (error) {
    return json({ error: "布置项目失败", detail: error.message }, 400);
  }
}
