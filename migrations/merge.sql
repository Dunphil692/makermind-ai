-- ============================================================
-- MakerMind AI × SparkMinds 合并迁移（Loop 1）
-- 目标：在保留 MakerMind 现有账号与项目模型的基础上，加入学员追踪闭环表
-- 说明：本脚本可在空本地 D1 或已有 MakerMind 基础 schema 上执行
-- ============================================================

PRAGMA foreign_keys = OFF;

BEGIN TRANSACTION;

-- ---------- MakerMind 基础表兜底：允许空本地 D1 直接执行本迁移 ----------
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'teacher',
  display_name TEXT NOT NULL,
  avatar TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL
);

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
  overview_data TEXT,
  build_data TEXT,
  practice_data TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  parent_project_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (creator_id) REFERENCES users(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id),
  FOREIGN KEY (parent_project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS project_relations (
  id TEXT PRIMARY KEY,
  source_project_id TEXT NOT NULL,
  target_project_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(source_project_id, target_project_id, relation_type),
  FOREIGN KEY (source_project_id) REFERENCES projects(id),
  FOREIGN KEY (target_project_id) REFERENCES projects(id)
);

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

-- ---------- projects 向前兼容扩展 ----------
-- SQLite/D1 当前环境不支持 ALTER TABLE ADD COLUMN IF NOT EXISTS，
-- 因此用重建表方式确保空库、旧库和重复执行都不报错。
DROP TABLE IF EXISTS projects_next;

CREATE TABLE projects_next (
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
  overview_data TEXT,
  build_data TEXT,
  practice_data TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  parent_project_id TEXT,
  is_template INTEGER DEFAULT 0,
  difficulty_level TEXT,
  expected_duration_hours REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (creator_id) REFERENCES users(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id),
  FOREIGN KEY (parent_project_id) REFERENCES projects(id)
);

INSERT OR IGNORE INTO projects_next (
  id, title, creator_id, class_id, knowledge_point_id, subject, concept, interest, kit, duration, level, image_key,
  overview_data, build_data, practice_data, status, parent_project_id, is_template, difficulty_level,
  expected_duration_hours, created_at, updated_at
)
SELECT
  id, title, creator_id, class_id, knowledge_point_id, subject, concept, interest, kit, duration, level, image_key,
  overview_data, build_data, practice_data, status, parent_project_id, 0, NULL, NULL, created_at, updated_at
FROM projects;

DROP TABLE projects;
ALTER TABLE projects_next RENAME TO projects;

CREATE INDEX IF NOT EXISTS idx_projects_creator ON projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_projects_kp ON projects(knowledge_point_id);
CREATE INDEX IF NOT EXISTS idx_projects_class ON projects(class_id);
CREATE INDEX IF NOT EXISTS idx_projects_parent ON projects(parent_project_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_template ON projects(is_template);

-- ---------- 学员档案表 ----------
CREATE TABLE IF NOT EXISTS students (
  student_id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE,
  name TEXT NOT NULL,
  age INTEGER,
  grade TEXT,
  school TEXT,
  parent_id TEXT,
  parent_phone TEXT,
  assigned_teacher_id TEXT,
  enrolled_at TEXT,
  current_stage TEXT,
  skill_level TEXT,
  interest_direction TEXT,
  personality_traits TEXT,
  learning_style TEXT,
  learning_goal TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_teacher_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_teacher_id ON students(assigned_teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_parent_phone ON students(parent_phone);

-- ---------- 学生项目实例表（替代旧 student_progress） ----------
CREATE TABLE IF NOT EXISTS student_projects (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  teacher_id TEXT,
  status TEXT DEFAULT 'NOT_STARTED',
  progress_percent INTEGER DEFAULT 0,
  started_at TEXT,
  completed_at TEXT,
  UNIQUE(student_id, project_id),
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_student_projects_student ON student_projects(student_id);
CREATE INDEX IF NOT EXISTS idx_student_projects_teacher ON student_projects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_projects_project ON student_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_student_projects_status ON student_projects(status);

-- ---------- 课堂记录表 ----------
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  student_project_id TEXT NOT NULL,
  teacher_id TEXT,
  session_date TEXT NOT NULL,
  duration_minutes INTEGER,
  raw_transcript TEXT,
  structured_summary TEXT,
  topics_covered TEXT,
  skills_demonstrated TEXT,
  progress_delta INTEGER DEFAULT 0,
  understanding_score INTEGER DEFAULT 3,
  teacher_notes TEXT,
  input_method TEXT DEFAULT 'API',
  FOREIGN KEY (student_project_id) REFERENCES student_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_sp_id ON sessions(student_project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher_id ON sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date);

-- ---------- 进度事件表（事件溯源） ----------
CREATE TABLE IF NOT EXISTS progress_events (
  id TEXT PRIMARY KEY,
  student_project_id TEXT NOT NULL,
  session_id TEXT UNIQUE,
  from_percent INTEGER NOT NULL,
  to_percent INTEGER NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (student_project_id) REFERENCES student_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_progress_events_sp ON progress_events(student_project_id);
CREATE INDEX IF NOT EXISTS idx_progress_events_session ON progress_events(session_id);
CREATE INDEX IF NOT EXISTS idx_progress_events_created_at ON progress_events(created_at);

-- ---------- 项目里程碑表 ----------
CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER,
  expected_completion_percent INTEGER,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);

-- ---------- 学生里程碑完成表 ----------
CREATE TABLE IF NOT EXISTS student_milestone_completions (
  id TEXT PRIMARY KEY,
  student_project_id TEXT NOT NULL,
  milestone_id TEXT NOT NULL,
  completed_at TEXT,
  session_id TEXT,
  UNIQUE(student_project_id, milestone_id),
  FOREIGN KEY (student_project_id) REFERENCES student_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_smc_student_project ON student_milestone_completions(student_project_id);
CREATE INDEX IF NOT EXISTS idx_smc_milestone ON student_milestone_completions(milestone_id);

-- ---------- 课程记录表 ----------
CREATE TABLE IF NOT EXISTS course_records (
  course_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  course_name TEXT,
  content TEXT,
  teacher TEXT,
  course_date TEXT,
  created_at TEXT,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_course_records_student_id ON course_records(student_id);
CREATE INDEX IF NOT EXISTS idx_course_records_date ON course_records(course_date);
CREATE INDEX IF NOT EXISTS idx_course_records_teacher ON course_records(teacher);

-- ---------- 教师反馈表 ----------
CREATE TABLE IF NOT EXISTS feedbacks (
  feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  course_name TEXT,
  content TEXT,
  teacher TEXT,
  feedback_date TEXT,
  created_at TEXT,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_student_id ON feedbacks(student_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_date ON feedbacks(feedback_date);
CREATE INDEX IF NOT EXISTS idx_feedbacks_teacher ON feedbacks(teacher);

-- ---------- 比赛记录表 ----------
CREATE TABLE IF NOT EXISTS competition_records (
  competition_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  competition_name TEXT,
  year INTEGER,
  work_name TEXT,
  award TEXT,
  status TEXT,
  created_at TEXT,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_competition_student_id ON competition_records(student_id);
CREATE INDEX IF NOT EXISTS idx_competition_name ON competition_records(competition_name);

-- ---------- 作品表 ----------
CREATE TABLE IF NOT EXISTS works (
  work_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  work_name TEXT,
  work_type TEXT,
  description TEXT,
  source_type TEXT,
  file_paths TEXT,
  image_urls TEXT,
  source_url TEXT,
  extracted_content TEXT,
  status TEXT,
  competition_id INTEGER,
  created_date TEXT,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (competition_id) REFERENCES competition_records(competition_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_works_student_id ON works(student_id);
CREATE INDEX IF NOT EXISTS idx_works_type ON works(work_type);
CREATE INDEX IF NOT EXISTS idx_works_created_date ON works(created_date);

-- 旧进度表由 student_projects + progress_events 替代；历史数据迁移不在本次范围内
DROP TABLE IF EXISTS student_progress;

COMMIT;

PRAGMA foreign_keys = ON;
