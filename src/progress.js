// 进度查询模块：学生项目列表与班级进度概览

import { json } from "./utils.js";
import { requireUser, assertStudentAccess, requireRole } from "./rbac.js";

function progressRow(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    projectId: row.project_id,
    title: row.title,
    subject: row.subject,
    concept: row.concept,
    teacherId: row.teacher_id,
    status: row.status,
    progressPercent: row.progress_percent,
    startedAt: row.started_at,
    completedAt: row.completed_at
  };
}

export async function handleListStudentProjects(request, env, studentId) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;

  const access = await assertStudentAccess(env, auth.user, studentId);
  if (access.response) return access.response;

  const { results } = await env.DB.prepare(
    `SELECT sp.*, s.name AS student_name, p.title, p.subject, p.concept
     FROM student_projects sp
     JOIN students s ON sp.student_id = s.student_id
     JOIN projects p ON sp.project_id = p.id
     WHERE sp.student_id = ?
     ORDER BY sp.started_at DESC`
  )
    .bind(studentId)
    .all();

  return json({ projects: (results || []).map(progressRow) });
}

export async function handleClassProgress(request, env, classId) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const roleError = requireRole(auth.user, ["teacher"]);
  if (roleError) return roleError;

  const classRow = await env.DB.prepare("SELECT id, teacher_id FROM classes WHERE id = ?")
    .bind(classId)
    .first();
  if (!classRow) return json({ error: "班级不存在" }, 404);
  if (classRow.teacher_id !== auth.user.id) return json({ error: "无权查看该班级" }, 403);

  const { results } = await env.DB.prepare(
    `SELECT sp.*, s.name AS student_name, p.title, p.subject, p.concept
     FROM class_members cm
     JOIN students s ON s.user_id = cm.user_id
     LEFT JOIN student_projects sp ON sp.student_id = s.student_id
     LEFT JOIN projects p ON p.id = sp.project_id
     WHERE cm.class_id = ?
     ORDER BY s.name ASC, sp.started_at DESC`
  )
    .bind(classId)
    .all();

  return json({ progress: (results || []).map(progressRow) });
}
