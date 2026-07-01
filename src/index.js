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
import { handleDialogueTaskBrief, handleGenerateInstructionPart, handleStructureSession } from "./ai.js";
import {
  handleCreateStudent,
  handleListStudents,
  handleGetStudent,
  handleUpdateStudent,
  handleDeleteStudent,
  handleGetStudentProgress,
  handleAssignProject
} from "./students.js";
import { handleCreateSession, handleGetSession, handleListSessionsForStudent, handleDeleteSession } from "./sessions.js";
import { handleListStudentProjects, handleClassProgress } from "./progress.js";
import {
  handleCreateFeedback,
  handleListFeedbacks,
  handleDeleteFeedback,
  handleCreateCourseRecord,
  handleListCourseRecords,
  handleDeleteCourseRecord
} from "./feedback.js";
import {
  handleCreateWork,
  handleListWorks,
  handleUpdateWork,
  handleDeleteWork,
  handleCreateCompetition,
  handleListCompetitions,
  handleDeleteCompetition
} from "./works.js";

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

    if (pathname === "/api/sessions/structure") {
      return method === "POST" ? handleStructureSession(request, env) : methodNotAllowed();
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

    // ---------- 学员档案 ----------
    if (pathname === "/api/students") {
      if (method === "GET") return handleListStudents(request, env);
      if (method === "POST") return handleCreateStudent(request, env);
      return methodNotAllowed();
    }

    // /api/students/:id/progress
    const studentProgressMatch = pathname.match(/^\/api\/students\/([^/]+)\/progress$/);
    if (studentProgressMatch) {
      return method === "GET" ? handleGetStudentProgress(request, env, studentProgressMatch[1]) : methodNotAllowed();
    }

    // /api/students/:id/projects
    const studentProjectsMatch = pathname.match(/^\/api\/students\/([^/]+)\/projects$/);
    if (studentProjectsMatch) {
      const id = studentProjectsMatch[1];
      if (method === "GET") return handleListStudentProjects(request, env, id);
      if (method === "POST") return handleAssignProject(request, env, id);
      return methodNotAllowed();
    }

    // /api/students/:id/sessions
    const studentSessionsMatch = pathname.match(/^\/api\/students\/([^/]+)\/sessions$/);
    if (studentSessionsMatch) {
      return method === "GET" ? handleListSessionsForStudent(request, env, studentSessionsMatch[1]) : methodNotAllowed();
    }

    // /api/students/:id/feedbacks
    const feedbacksMatch = pathname.match(/^\/api\/students\/([^/]+)\/feedbacks$/);
    if (feedbacksMatch) {
      const id = feedbacksMatch[1];
      if (method === "GET") return handleListFeedbacks(request, env, id);
      if (method === "POST") return handleCreateFeedback(request, env, id);
      return methodNotAllowed();
    }

    // /api/students/:id/feedbacks/:fid
    const feedbackMatch = pathname.match(/^\/api\/students\/([^/]+)\/feedbacks\/([^/]+)$/);
    if (feedbackMatch) {
      return method === "DELETE" ? handleDeleteFeedback(request, env, feedbackMatch[1], feedbackMatch[2]) : methodNotAllowed();
    }

    // /api/students/:id/courses
    const coursesMatch = pathname.match(/^\/api\/students\/([^/]+)\/courses$/);
    if (coursesMatch) {
      const id = coursesMatch[1];
      if (method === "GET") return handleListCourseRecords(request, env, id);
      if (method === "POST") return handleCreateCourseRecord(request, env, id);
      return methodNotAllowed();
    }

    // /api/students/:id/courses/:courseId
    const courseMatch = pathname.match(/^\/api\/students\/([^/]+)\/courses\/([^/]+)$/);
    if (courseMatch) {
      return method === "DELETE" ? handleDeleteCourseRecord(request, env, courseMatch[1], courseMatch[2]) : methodNotAllowed();
    }

    // /api/students/:id/works
    const worksMatch = pathname.match(/^\/api\/students\/([^/]+)\/works$/);
    if (worksMatch) {
      const id = worksMatch[1];
      if (method === "GET") return handleListWorks(request, env, id);
      if (method === "POST") return handleCreateWork(request, env, id);
      return methodNotAllowed();
    }

    // /api/students/:id/works/:workId
    const workMatch = pathname.match(/^\/api\/students\/([^/]+)\/works\/([^/]+)$/);
    if (workMatch) {
      const id = workMatch[1];
      const workId = workMatch[2];
      if (method === "PUT") return handleUpdateWork(request, env, id, workId);
      if (method === "DELETE") return handleDeleteWork(request, env, id, workId);
      return methodNotAllowed();
    }

    // /api/students/:id/competitions
    const competitionsMatch = pathname.match(/^\/api\/students\/([^/]+)\/competitions$/);
    if (competitionsMatch) {
      const id = competitionsMatch[1];
      if (method === "GET") return handleListCompetitions(request, env, id);
      if (method === "POST") return handleCreateCompetition(request, env, id);
      return methodNotAllowed();
    }

    // /api/students/:id/competitions/:competitionId
    const competitionMatch = pathname.match(/^\/api\/students\/([^/]+)\/competitions\/([^/]+)$/);
    if (competitionMatch) {
      return method === "DELETE" ? handleDeleteCompetition(request, env, competitionMatch[1], competitionMatch[2]) : methodNotAllowed();
    }

    // /api/students/:id
    const studentMatch = pathname.match(/^\/api\/students\/([^/]+)$/);
    if (studentMatch) {
      const id = studentMatch[1];
      if (method === "GET") return handleGetStudent(request, env, id);
      if (method === "PUT") return handleUpdateStudent(request, env, id);
      if (method === "DELETE") return handleDeleteStudent(request, env, id);
      return methodNotAllowed();
    }

    // ---------- 课堂记录 ----------
    if (pathname === "/api/sessions") {
      return method === "POST" ? handleCreateSession(request, env) : methodNotAllowed();
    }

    // /api/sessions/:id
    const sessionMatch = pathname.match(/^\/api\/sessions\/([^/]+)$/);
    if (sessionMatch) {
      const id = sessionMatch[1];
      if (method === "GET") return handleGetSession(request, env, id);
      if (method === "DELETE") return handleDeleteSession(request, env, id);
      return methodNotAllowed();
    }

    // ---------- 班级进度 ----------
    const classProgressMatch = pathname.match(/^\/api\/classes\/([^/]+)\/progress$/);
    if (classProgressMatch) {
      return method === "GET" ? handleClassProgress(request, env, classProgressMatch[1]) : methodNotAllowed();
    }

    // ---------- 静态资源 ----------
    return serveStatic(request, env);
  }
};
