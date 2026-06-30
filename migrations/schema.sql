-- ============================================================
-- MakerMind AI 数据库 Schema
-- 数据库：Cloudflare D1 (SQLite)
-- 覆盖：用户认证、项目方案云端化、知识点图谱、项目关系、班级管理
-- ============================================================

-- ---------- 用户表 ----------
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'teacher',        -- 'teacher' | 'student'
  display_name TEXT NOT NULL,
  avatar TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ---------- 学科表 ----------
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL
);

-- ---------- 知识点表 ----------
CREATE TABLE IF NOT EXISTS knowledge_points (
  id TEXT PRIMARY KEY,
  subject_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

CREATE INDEX IF NOT EXISTS idx_kp_subject ON knowledge_points(subject_id);
CREATE INDEX IF NOT EXISTS idx_kp_name ON knowledge_points(name);

-- ---------- 班级表（教师创建） ----------
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  teacher_id TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);

-- ---------- 班级成员表（学生加入班级） ----------
CREATE TABLE IF NOT EXISTS class_members (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  joined_at TEXT NOT NULL,
  UNIQUE(class_id, user_id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_cm_class ON class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_cm_user ON class_members(user_id);

-- ---------- 项目方案表（生成的 instruction 云端存储） ----------
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  class_id TEXT,
  knowledge_point_id TEXT,
  subject TEXT,
  concept TEXT,
  interest TEXT,
  kit TEXT,
  duration TEXT,
  level TEXT,
  image_key TEXT,
  overview_data TEXT,                          -- JSON 字符串
  build_data TEXT,                             -- JSON 字符串
  practice_data TEXT,                          -- JSON 字符串
  status TEXT NOT NULL DEFAULT 'draft',        -- 'draft' | 'published'
  parent_project_id TEXT,                      -- 衍生/版本关系
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (creator_id) REFERENCES users(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id),
  FOREIGN KEY (parent_project_id) REFERENCES projects(id)
);

CREATE INDEX IF NOT EXISTS idx_projects_creator ON projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_projects_kp ON projects(knowledge_point_id);
CREATE INDEX IF NOT EXISTS idx_projects_class ON projects(class_id);
CREATE INDEX IF NOT EXISTS idx_projects_parent ON projects(parent_project_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ---------- 项目方案关系表（衍生 / 变体 / 关联） ----------
CREATE TABLE IF NOT EXISTS project_relations (
  id TEXT PRIMARY KEY,
  source_project_id TEXT NOT NULL,
  target_project_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,                 -- 'derived' | 'variant' | 'related'
  created_at TEXT NOT NULL,
  UNIQUE(source_project_id, target_project_id, relation_type),
  FOREIGN KEY (source_project_id) REFERENCES projects(id),
  FOREIGN KEY (target_project_id) REFERENCES projects(id)
);

-- ---------- 收藏表 ----------
CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, project_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX IF NOT EXISTS idx_fav_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_fav_project ON favorites(project_id);

-- ---------- 学生学习进度表 ----------
CREATE TABLE IF NOT EXISTS student_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  class_id TEXT,
  status TEXT NOT NULL DEFAULT 'assigned',     -- 'assigned' | 'in_progress' | 'completed'
  assigned_at TEXT NOT NULL,
  completed_at TEXT,
  teacher_feedback TEXT,
  UNIQUE(user_id, project_id, class_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

CREATE INDEX IF NOT EXISTS idx_sp_user ON student_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_sp_project ON student_progress(project_id);
CREATE INDEX IF NOT EXISTS idx_sp_class ON student_progress(class_id);
