// 反馈与课程记录模块：教师写入，师生家长按权限查看

import { json, nowISO, truncate } from "./utils.js";
import { requireUser, requireRole, assertStudentAccess } from "./rbac.js";

function feedbackRow(row) {
  return {
    feedbackId: row.feedback_id,
    studentId: row.student_id,
    courseName: row.course_name,
    content: row.content,
    teacher: row.teacher,
    feedbackDate: row.feedback_date,
    createdAt: row.created_at
  };
}

function courseRow(row) {
  return {
    courseId: row.course_id,
    studentId: row.student_id,
    courseName: row.course_name,
    content: row.content,
    teacher: row.teacher,
    courseDate: row.course_date,
    createdAt: row.created_at
  };
}

export async function handleListFeedbacks(request, env, studentId) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const access = await assertStudentAccess(env, auth.user, studentId);
  if (access.response) return access.response;

  const { results } = await env.DB.prepare(
    "SELECT * FROM feedbacks WHERE student_id = ? ORDER BY feedback_date DESC, created_at DESC"
  )
    .bind(studentId)
    .all();
  return json({ feedbacks: (results || []).map(feedbackRow) });
}

export async function handleCreateFeedback(request, env, studentId) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const roleError = requireRole(auth.user, ["teacher"]);
  if (roleError) return roleError;

  const access = await assertStudentAccess(env, auth.user, studentId);
  if (access.response) return access.response;

  try {
    const body = await request.json();
    const content = truncate(body.content || "", 2000).trim();
    if (!content) return json({ error: "请填写反馈内容" }, 400);

    const ts = nowISO();
    const result = await env.DB.prepare(
      `INSERT INTO feedbacks (student_id, course_name, content, teacher, feedback_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        studentId,
        truncate(body.courseName || body.course_name || "", 120) || null,
        content,
        truncate(body.teacher || auth.user.display_name || "老师", 80),
        truncate(body.feedbackDate || body.feedback_date || ts.slice(0, 10), 20),
        ts
      )
      .run();

    return json({ success: true, feedbackId: result.meta?.last_row_id });
  } catch (error) {
    return json({ error: "创建反馈失败", detail: error.message }, 400);
  }
}

export async function handleDeleteFeedback(request, env, studentId, feedbackId) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const roleError = requireRole(auth.user, ["teacher"]);
  if (roleError) return roleError;

  await env.DB.prepare("DELETE FROM feedbacks WHERE student_id = ? AND feedback_id = ?")
    .bind(studentId, feedbackId)
    .run();
  return json({ success: true });
}

export async function handleListCourseRecords(request, env, studentId) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const access = await assertStudentAccess(env, auth.user, studentId);
  if (access.response) return access.response;

  const { results } = await env.DB.prepare(
    "SELECT * FROM course_records WHERE student_id = ? ORDER BY course_date DESC, created_at DESC"
  )
    .bind(studentId)
    .all();
  return json({ courses: (results || []).map(courseRow) });
}

export async function handleCreateCourseRecord(request, env, studentId) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const roleError = requireRole(auth.user, ["teacher"]);
  if (roleError) return roleError;

  const access = await assertStudentAccess(env, auth.user, studentId);
  if (access.response) return access.response;

  try {
    const body = await request.json();
    const ts = nowISO();
    const result = await env.DB.prepare(
      `INSERT INTO course_records (student_id, course_name, content, teacher, course_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        studentId,
        truncate(body.courseName || body.course_name || "", 120) || null,
        truncate(body.content || "", 2000) || null,
        truncate(body.teacher || auth.user.display_name || "老师", 80),
        truncate(body.courseDate || body.course_date || ts.slice(0, 10), 20),
        ts
      )
      .run();

    return json({ success: true, courseId: result.meta?.last_row_id });
  } catch (error) {
    return json({ error: "创建课程记录失败", detail: error.message }, 400);
  }
}

export async function handleDeleteCourseRecord(request, env, studentId, courseId) {
  const auth = await requireUser(request, env);
  if (auth.response) return auth.response;
  const roleError = requireRole(auth.user, ["teacher"]);
  if (roleError) return roleError;

  await env.DB.prepare("DELETE FROM course_records WHERE student_id = ? AND course_id = ?")
    .bind(studentId, courseId)
    .run();
  return json({ success: true });
}
