// MakerMind AI — API 路由（Pages Functions / 本地开发共用）

import { json } from "./utils.js";
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
import {
  aiFeaturesPausedResponse,
  areAiFeaturesPaused,
  handleDialogueTaskBrief,
  handleGenerateInstructionPart,
  handleStructureSession
} from "./ai.js";
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

const AI_API_PATHS = new Set([
  "/api/dialogue-task-brief",
  "/api/generate-instruction-part",
  "/api/sessions/structure",
  "/api/generate-projects",
  "/api/generate-instruction"
]);

export async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method;

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

  if (AI_API_PATHS.has(pathname) && areAiFeaturesPaused(env)) {
    return aiFeaturesPausedResponse();
  }

  if (pathname === "/api/auth/register") {
    return method === "POST" ? handleRegister(request, env) : methodNotAllowed();
  }

  if (pathname === "/api/auth/login") {
    return method === "POST" ? handleLogin(request, env) : methodNotAllowed();
  }

  if (pathname === "/api/auth/me") {
    return method === "GET" ? handleMe(request, env) : methodNotAllowed();
  }

  if (pathname === "/api/health") {
    if (method !== "GET") return methodNotAllowed();
    return json({
      ok: true,
      platform: "pages",
      service: "makermind-ai",
      ai: {
        paused: areAiFeaturesPaused(env),
        hasApiKey: Boolean(env.AI_API_KEY),
        hasBaseUrl: Boolean(env.AI_BASE_URL),
        hasModel: Boolean(env.AI_MODEL),
        mockMode: env.AI_MOCK === "1"
      },
      bindings: {
        db: Boolean(env.DB)
      }
    });
  }

  if (pathname === "/api/dialogue-task-brief") {
    return method === "POST" ? handleDialogueTaskBrief(request, env) : methodNotAllowed();
  }

  if (pathname === "/api/generate-instruction-part") {
    return method === "POST" ? handleGenerateInstructionPart(request, env) : methodNotAllowed();
  }

  if (pathname === "/api/sessions/structure") {
    return method === "POST" ? handleStructureSession(request, env) : methodNotAllowed();
  }

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

  if (pathname === "/api/projects") {
    if (method === "POST") return handleCreateProject(request, env);
    if (method === "GET") return handleListProjects(request, env);
    return methodNotAllowed();
  }

  const projectMatch = pathname.match(/^\/api\/projects\/([^/]+)$/);
  if (projectMatch) {
    const id = projectMatch[1];
    if (method === "GET") return handleGetProject(request, env, id);
    if (method === "PUT") return handleUpdateProject(request, env, id);
    if (method === "DELETE") return handleDeleteProject(request, env, id);
    return methodNotAllowed();
  }

  const favMatch = pathname.match(/^\/api\/projects\/([^/]+)\/favorite$/);
  if (favMatch) {
    const id = favMatch[1];
    if (method === "POST") return handleAddFavorite(request, env, id);
    if (method === "DELETE") return handleRemoveFavorite(request, env, id);
    return methodNotAllowed();
  }

  if (pathname === "/api/favorites") {
    return method === "GET" ? handleListFavorites(request, env) : methodNotAllowed();
  }

  if (pathname === "/api/students") {
    if (method === "GET") return handleListStudents(request, env);
    if (method === "POST") return handleCreateStudent(request, env);
    return methodNotAllowed();
  }

  const studentProgressMatch = pathname.match(/^\/api\/students\/([^/]+)\/progress$/);
  if (studentProgressMatch) {
    return method === "GET" ? handleGetStudentProgress(request, env, studentProgressMatch[1]) : methodNotAllowed();
  }

  const studentProjectsMatch = pathname.match(/^\/api\/students\/([^/]+)\/projects$/);
  if (studentProjectsMatch) {
    const id = studentProjectsMatch[1];
    if (method === "GET") return handleListStudentProjects(request, env, id);
    if (method === "POST") return handleAssignProject(request, env, id);
    return methodNotAllowed();
  }

  const studentSessionsMatch = pathname.match(/^\/api\/students\/([^/]+)\/sessions$/);
  if (studentSessionsMatch) {
    return method === "GET" ? handleListSessionsForStudent(request, env, studentSessionsMatch[1]) : methodNotAllowed();
  }

  const feedbacksMatch = pathname.match(/^\/api\/students\/([^/]+)\/feedbacks$/);
  if (feedbacksMatch) {
    const id = feedbacksMatch[1];
    if (method === "GET") return handleListFeedbacks(request, env, id);
    if (method === "POST") return handleCreateFeedback(request, env, id);
    return methodNotAllowed();
  }

  const feedbackMatch = pathname.match(/^\/api\/students\/([^/]+)\/feedbacks\/([^/]+)$/);
  if (feedbackMatch) {
    return method === "DELETE" ? handleDeleteFeedback(request, env, feedbackMatch[1], feedbackMatch[2]) : methodNotAllowed();
  }

  const coursesMatch = pathname.match(/^\/api\/students\/([^/]+)\/courses$/);
  if (coursesMatch) {
    const id = coursesMatch[1];
    if (method === "GET") return handleListCourseRecords(request, env, id);
    if (method === "POST") return handleCreateCourseRecord(request, env, id);
    return methodNotAllowed();
  }

  const courseMatch = pathname.match(/^\/api\/students\/([^/]+)\/courses\/([^/]+)$/);
  if (courseMatch) {
    return method === "DELETE" ? handleDeleteCourseRecord(request, env, courseMatch[1], courseMatch[2]) : methodNotAllowed();
  }

  const worksMatch = pathname.match(/^\/api\/students\/([^/]+)\/works$/);
  if (worksMatch) {
    const id = worksMatch[1];
    if (method === "GET") return handleListWorks(request, env, id);
    if (method === "POST") return handleCreateWork(request, env, id);
    return methodNotAllowed();
  }

  const workMatch = pathname.match(/^\/api\/students\/([^/]+)\/works\/([^/]+)$/);
  if (workMatch) {
    const id = workMatch[1];
    const workId = workMatch[2];
    if (method === "PUT") return handleUpdateWork(request, env, id, workId);
    if (method === "DELETE") return handleDeleteWork(request, env, id, workId);
    return methodNotAllowed();
  }

  const competitionsMatch = pathname.match(/^\/api\/students\/([^/]+)\/competitions$/);
  if (competitionsMatch) {
    const id = competitionsMatch[1];
    if (method === "GET") return handleListCompetitions(request, env, id);
    if (method === "POST") return handleCreateCompetition(request, env, id);
    return methodNotAllowed();
  }

  const competitionMatch = pathname.match(/^\/api\/students\/([^/]+)\/competitions\/([^/]+)$/);
  if (competitionMatch) {
    return method === "DELETE" ? handleDeleteCompetition(request, env, competitionMatch[1], competitionMatch[2]) : methodNotAllowed();
  }

  const studentMatch = pathname.match(/^\/api\/students\/([^/]+)$/);
  if (studentMatch) {
    const id = studentMatch[1];
    if (method === "GET") return handleGetStudent(request, env, id);
    if (method === "PUT") return handleUpdateStudent(request, env, id);
    if (method === "DELETE") return handleDeleteStudent(request, env, id);
    return methodNotAllowed();
  }

  if (pathname === "/api/sessions") {
    return method === "POST" ? handleCreateSession(request, env) : methodNotAllowed();
  }

  const sessionMatch = pathname.match(/^\/api\/sessions\/([^/]+)$/);
  if (sessionMatch) {
    const id = sessionMatch[1];
    if (method === "GET") return handleGetSession(request, env, id);
    if (method === "DELETE") return handleDeleteSession(request, env, id);
    return methodNotAllowed();
  }

  const classProgressMatch = pathname.match(/^\/api\/classes\/([^/]+)\/progress$/);
  if (classProgressMatch) {
    return method === "GET" ? handleClassProgress(request, env, classProgressMatch[1]) : methodNotAllowed();
  }

  return json({ error: "Not found" }, 404);
}
