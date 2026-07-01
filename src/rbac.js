// RBAC 工具：基于 MakerMind JWT 当前用户做角色与学员访问控制

import { json } from "./utils.js";
import { getUser } from "./auth.js";

export async function requireUser(request, env) {
  const user = await getUser(request, env);
  if (!user) {
    return { user: null, response: json({ error: "请先登录" }, 401) };
  }
  return { user, response: null };
}

export function hasRole(user, roles) {
  return !!user && roles.includes(user.role);
}

export function requireRole(user, roles) {
  if (!hasRole(user, roles)) {
    return json({ error: "无权执行此操作" }, 403);
  }
  return null;
}

export async function getStudentForAccess(env, studentId) {
  return env.DB.prepare(
    `SELECT student_id, user_id, parent_id, assigned_teacher_id, name
     FROM students WHERE student_id = ?`
  )
    .bind(studentId)
    .first();
}

export async function assertStudentAccess(env, user, studentId) {
  const student = await getStudentForAccess(env, studentId);
  if (!student) return { student: null, response: json({ error: "学员不存在" }, 404) };

  if (user.role === "teacher") return { student, response: null };
  if (user.role === "parent" && student.parent_id === user.id) return { student, response: null };
  if (user.role === "student" && student.user_id === user.id) return { student, response: null };

  return { student, response: json({ error: "无权查看该学员" }, 403) };
}

export async function assertStudentProjectAccess(env, user, studentProjectId) {
  const row = await env.DB.prepare(
    `SELECT sp.id, sp.student_id, sp.project_id, sp.teacher_id, sp.progress_percent,
            s.user_id AS student_user_id, s.parent_id, s.assigned_teacher_id
     FROM student_projects sp
     JOIN students s ON sp.student_id = s.student_id
     WHERE sp.id = ?`
  )
    .bind(studentProjectId)
    .first();

  if (!row) return { studentProject: null, response: json({ error: "学生项目不存在" }, 404) };

  if (user.role === "teacher") return { studentProject: row, response: null };
  if (user.role === "parent" && row.parent_id === user.id) return { studentProject: row, response: null };
  if (user.role === "student" && row.student_user_id === user.id) return { studentProject: row, response: null };

  return { studentProject: row, response: json({ error: "无权查看该项目进度" }, 403) };
}
