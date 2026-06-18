import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpDown,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Circle,
  Clock3,
  Layers3,
  LayoutGrid,
  LogOut,
  LucideSparkles,
  PencilLine,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  Zap,
} from 'lucide-react';
import { authService } from './lib/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const motionVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const defaultTaskForm = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
  tags: '',
};

const sortOptions = [
  { value: 'recent', label: 'Recent first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'due', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
];

const statusOptions = [
  { value: 'all', label: 'All tasks' },
  { value: 'todo', label: 'To do' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

async function apiRequest(session, path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (session) {
    headers.set('Authorization', `Bearer ${await session.getIdToken()}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed.');
  }

  return payload;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return 'No due date';
  }

  return new Date(dateValue).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function taskProgress(tasks) {
  if (!tasks.length) {
    return 0;
  }

  return Math.round((tasks.filter((task) => task.status === 'done').length / tasks.length) * 100);
}

function emptyStats(tasks) {
  return {
    total: tasks.length,
    completed: tasks.filter((task) => task.status === 'done').length,
    active: tasks.filter((task) => task.status !== 'done').length,
    urgent: tasks.filter((task) => task.priority === 'high').length,
  };
}

function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ displayName: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [filters, setFilters] = useState({ q: '', status: 'all', sort: 'recent' });
  const deferredQuery = useDeferredValue(filters.q);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState(defaultTaskForm);

  useEffect(() => {
    const unsubscribe = authService.subscribe((nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setTasks([]);
      return;
    }

    let active = true;

    async function loadTasks() {
      setTaskLoading(true);
      setTaskError('');

      try {
        const params = new URLSearchParams();

        if (deferredQuery.trim()) {
          params.set('q', deferredQuery.trim());
        }

        if (filters.status !== 'all') {
          params.set('status', filters.status);
        }

        if (filters.sort !== 'recent') {
          params.set('sort', filters.sort);
        }

        const response = await apiRequest(session, `/tasks${params.toString() ? `?${params}` : ''}`);

        if (active) {
          setTasks(response.tasks || []);
        }
      } catch (error) {
        if (active) {
          setTaskError(error.message);
        }
      } finally {
        if (active) {
          setTaskLoading(false);
        }
      }
    }

    loadTasks();

    return () => {
      active = false;
    };
  }, [session, deferredQuery, filters.status, filters.sort]);

  const stats = useMemo(() => emptyStats(tasks), [tasks]);
  const completion = useMemo(() => taskProgress(tasks), [tasks]);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const payload = {
        email: authForm.email.trim(),
        password: authForm.password,
        displayName: authForm.displayName.trim(),
      };

      const user =
        authMode === 'register'
          ? await authService.register(payload)
          : await authService.login(payload);

      setSession(user);
      setAuthForm({ displayName: '', email: '', password: '' });
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setSession(null);
    setTasks([]);
    setEditingTask(null);
    setEditorOpen(false);
  };

  const openComposer = (task = null) => {
    const nextTask = task || null;
    setEditingTask(nextTask);
    setTaskForm(
      nextTask
        ? {
            title: nextTask.title || '',
            description: nextTask.description || '',
            status: nextTask.status || 'todo',
            priority: nextTask.priority || 'medium',
            dueDate: nextTask.dueDate ? new Date(nextTask.dueDate).toISOString().slice(0, 10) : '',
            tags: Array.isArray(nextTask.tags) ? nextTask.tags.join(', ') : '',
          }
        : defaultTaskForm,
    );
    setEditorOpen(true);
  };

  const reloadTasks = async () => {
    const params = new URLSearchParams();

    if (deferredQuery.trim()) {
      params.set('q', deferredQuery.trim());
    }

    if (filters.status !== 'all') {
      params.set('status', filters.status);
    }

    if (filters.sort !== 'recent') {
      params.set('sort', filters.sort);
    }

    const response = await apiRequest(session, `/tasks${params.toString() ? `?${params}` : ''}`);
    setTasks(response.tasks || []);
  };

  const saveTask = async (event) => {
    event.preventDefault();
    if (!session) {
      return;
    }

    setTaskLoading(true);
    setTaskError('');

    const payload = {
      ...taskForm,
      tags: taskForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      if (editingTask) {
        await apiRequest(session, `/tasks/${editingTask.id}`, {
          method: 'PUT',
          body: payload,
        });
      } else {
        await apiRequest(session, '/tasks', {
          method: 'POST',
          body: payload,
        });
      }

      setEditorOpen(false);
      setEditingTask(null);
      setTaskForm(defaultTaskForm);
      await reloadTasks();
    } catch (error) {
      setTaskError(error.message);
    } finally {
      setTaskLoading(false);
    }
  };

  const updateTaskStatus = async (task, status) => {
    if (!session) {
      return;
    }

    setTaskLoading(true);

    try {
      await apiRequest(session, `/tasks/${task.id}`, {
        method: 'PUT',
        body: {
          title: task.title,
          description: task.description,
          status,
          priority: task.priority,
          dueDate: task.dueDate,
          tags: task.tags,
        },
      });

      await reloadTasks();
    } catch (error) {
      setTaskError(error.message);
    } finally {
      setTaskLoading(false);
    }
  };

  const removeTask = async (task) => {
    if (!session) {
      return;
    }

    setTaskLoading(true);

    try {
      await apiRequest(session, `/tasks/${task.id}`, {
        method: 'DELETE',
      });

      await reloadTasks();
    } catch (error) {
      setTaskError(error.message);
    } finally {
      setTaskLoading(false);
    }
  };

  const visibleTasks = tasks;

  return (
    <div className="app-shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="ambient ambient-c" />

      {!authReady ? (
        <div className="loading-stage">
          <div className="loading-pill">
            <Sparkles size={16} /> Booting workspace
          </div>
        </div>
      ) : session ? (
        <Dashboard
          session={session}
          stats={stats}
          completion={completion}
          filters={filters}
          setFilters={setFilters}
          tasks={visibleTasks}
          taskLoading={taskLoading}
          taskError={taskError}
          openComposer={openComposer}
          removeTask={removeTask}
          updateTaskStatus={updateTaskStatus}
          handleLogout={handleLogout}
          editorOpen={editorOpen}
          setEditorOpen={setEditorOpen}
          editingTask={editingTask}
          taskForm={taskForm}
          setTaskForm={setTaskForm}
          saveTask={saveTask}
          authService={authService}
        />
      ) : (
        <AuthScreen
          authMode={authMode}
          setAuthMode={setAuthMode}
          authForm={authForm}
          setAuthForm={setAuthForm}
          authError={authError}
          authLoading={authLoading}
          handleAuthSubmit={handleAuthSubmit}
          authService={authService}
        />
      )}
    </div>
  );
}

function Dashboard({
  session,
  stats,
  completion,
  filters,
  setFilters,
  tasks,
  taskLoading,
  taskError,
  openComposer,
  removeTask,
  updateTaskStatus,
  handleLogout,
  editorOpen,
  setEditorOpen,
  editingTask,
  taskForm,
  setTaskForm,
  saveTask,
  authService,
}) {
  const isDemo = authService.hasFirebaseConfig ? false : session.demo;

  return (
    <main className="workspace">
      <motion.header className="topbar" variants={motionVariants} initial="hidden" animate="show">
        <div className="brand-lockup">
          <div className="brand-mark">
            <ClipboardList size={20} />
          </div>
          <div>
            <p className="eyebrow">02 Task Management</p>
            <h1>Calm task control with sharp execution.</h1>
          </div>
        </div>

        <div className="topbar-meta">
          <div className="session-chip">
            <UserRound size={15} />
            <span>{session.displayName || session.email}</span>
            {isDemo ? <Badge tone="warn">Demo</Badge> : <Badge tone="success">Firebase</Badge>}
          </div>
          <button className="ghost-button" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </motion.header>

      <section className="hero-strip">
        <motion.article className="hero-panel" variants={motionVariants} initial="hidden" animate="show">
          <div className="hero-copy">
            <Badge tone="info">Live workspace</Badge>
            <h2>Plan the day, move the cards, and keep the whole surface breathing.</h2>
            <p>
              The interface uses soft depth, layered cards, and motion that feels hand-tuned instead of templated.
              Tasks can be created, edited, filtered, sorted, and completed without leaving the page.
            </p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => openComposer()}>
                <Plus size={16} /> New task
              </button>
              <button className="secondary-button" onClick={() => setEditorOpen(true)}>
                <Sparkles size={16} /> Fine tune board
              </button>
            </div>
          </div>

          <motion.div className="floating-preview" animate={{ y: [0, -8, 0] }} transition={{ duration: 7, repeat: Infinity }}>
            <div className="preview-card preview-card-a">
              <span className="preview-label">Today</span>
              <strong>{stats.active} active tasks</strong>
              <small>{completion}% completed</small>
            </div>
            <div className="preview-card preview-card-b">
              <span className="preview-label">Priority</span>
              <strong>{stats.urgent} high priority</strong>
              <small>Keep these in the foreground</small>
            </div>
          </motion.div>
        </motion.article>

        <motion.aside className="stats-grid" variants={staggerContainer} initial="hidden" animate="show">
          <StatCard icon={<Layers3 size={18} />} label="Total" value={stats.total} tone="neutral" />
          <StatCard icon={<CheckCircle2 size={18} />} label="Completed" value={stats.completed} tone="success" />
          <StatCard icon={<Clock3 size={18} />} label="Active" value={stats.active} tone="info" />
          <StatCard icon={<Zap size={18} />} label="High priority" value={stats.urgent} tone="warn" />
        </motion.aside>
      </section>

      <section className="board-layout">
        <motion.div className="board-panel filters-panel" variants={motionVariants} initial="hidden" animate="show">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Filters</p>
              <h3>Shape the board</h3>
            </div>
            <Badge tone="neutral">Realtime</Badge>
          </div>

          <div className="filters-row">
            <label className="search-field">
              <Search size={16} />
              <input
                type="search"
                placeholder="Search tasks"
                value={filters.q}
                onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
              />
            </label>

            <div className="select-grid">
              <label className="select-field">
                <span>Status</span>
                <select
                  value={filters.status}
                  onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="select-field">
                <span>Sort</span>
                <select
                  value={filters.sort}
                  onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </motion.div>

        <motion.div className="board-panel task-panel" variants={motionVariants} initial="hidden" animate="show">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Task list</p>
              <h3>Move with intent</h3>
            </div>

            <button className="primary-button compact" onClick={() => openComposer()}>
              <Plus size={16} /> Add task
            </button>
          </div>

          {taskError ? <div className="error-banner">{taskError}</div> : null}
          {taskLoading ? <div className="inline-loading">Syncing tasks…</div> : null}

          <AnimatePresence>
            {tasks.length ? (
              <motion.div className="task-grid" variants={staggerContainer} initial="hidden" animate="show">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={() => openComposer(task)}
                    onDelete={() => removeTask(task)}
                    onStatusChange={(status) => updateTaskStatus(task, status)}
                  />
                ))}
              </motion.div>
            ) : (
              <EmptyState onCreate={() => openComposer()} />
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      <AnimatePresence>
        {editorOpen ? (
          <TaskEditorModal
            editingTask={editingTask}
            taskForm={taskForm}
            setTaskForm={setTaskForm}
            saveTask={saveTask}
            closeModal={() => setEditorOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function AuthScreen({ authMode, setAuthMode, authForm, setAuthForm, authError, authLoading, handleAuthSubmit, authService }) {
  return (
    <main className="auth-shell">
      <motion.section className="auth-hero" variants={motionVariants} initial="hidden" animate="show">
        <Badge tone="info">Motion-first planner</Badge>
        <h1>Task management that feels curated, not assembled.</h1>
        <p>
          Register, sign in, and start organizing your work. The layout borrows the soft editorial tone from the
          reference while keeping the interaction logic practical and fast.
        </p>

        <div className="feature-stack">
          <div className="feature-card">
            <ShieldCheck size={18} />
            <div>
              <strong>Secure auth</strong>
              <span>Firebase when configured, demo fallback when not.</span>
            </div>
          </div>
          <div className="feature-card">
            <ClipboardList size={18} />
            <div>
              <strong>Task workflow</strong>
              <span>Create, edit, sort, filter, and remove entries.</span>
            </div>
          </div>
          <div className="feature-card">
            <LayoutGrid size={18} />
            <div>
              <strong>Responsive layers</strong>
              <span>Designed to breathe on mobile and desktop.</span>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section className="auth-card" variants={motionVariants} initial="hidden" animate="show">
        <div className="auth-tabs">
          <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>
            Login
          </button>
          <button className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleAuthSubmit}>
          {authMode === 'register' ? (
            <label>
              <span>Display name</span>
              <input
                type="text"
                value={authForm.displayName}
                onChange={(event) => setAuthForm((current) => ({ ...current, displayName: event.target.value }))}
                placeholder="Alex Morgan"
              />
            </label>
          ) : null}

          <label>
            <span>Email</span>
            <input
              type="email"
              value={authForm.email}
              onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={authForm.password}
              onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="••••••••"
              required
            />
          </label>

          {authError ? <div className="error-banner">{authError}</div> : null}

          <button className="primary-button wide" disabled={authLoading} type="submit">
            {authLoading ? 'Please wait…' : authMode === 'register' ? 'Create account' : 'Sign in'}
          </button>

          {!authService.hasFirebaseConfig ? (
            <p className="auth-note">
              Demo mode is active. Accounts are stored in your browser until Firebase credentials are added.
            </p>
          ) : null}
        </form>
      </motion.section>
    </main>
  );
}

function StatCard({ icon, label, value, tone }) {
  return (
    <motion.article className={`stat-card tone-${tone}`} variants={motionVariants}>
      <div className="stat-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </motion.article>
  );
}

function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const statusTone =
    task.status === 'done'
      ? 'success'
      : task.status === 'in-progress'
        ? 'info'
        : 'neutral';

  return (
    <motion.article className="task-card" variants={motionVariants}>
      <div className="task-card-top">
        <Badge tone={statusTone}>{task.status.replace('-', ' ')}</Badge>
        <div className="task-actions">
          <button className="icon-button" onClick={onEdit} aria-label="Edit task">
            <PencilLine size={15} />
          </button>
          <button className="icon-button danger" onClick={onDelete} aria-label="Delete task">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <h4>{task.title}</h4>
      <p>{task.description || 'No description added yet.'}</p>

      <div className="task-meta">
        <span>
          <CalendarDays size={14} /> {formatDate(task.dueDate)}
        </span>
        <span>
          <ArrowUpDown size={14} /> {priorityLabels[task.priority]}
        </span>
      </div>

      <div className="task-tags">
        {task.tags?.length ? task.tags.map((tag) => <Badge key={tag}>{tag}</Badge>) : <Badge tone="neutral">No tags</Badge>}
      </div>

      <div className="task-footer">
        <select value={task.status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="todo">To do</option>
          <option value="in-progress">In progress</option>
          <option value="done">Done</option>
        </select>

        {task.status === 'done' ? <CheckCircle2 size={16} className="done-icon" /> : <Circle size={16} />}
      </div>
    </motion.article>
  );
}

function EmptyState({ onCreate }) {
  return (
    <motion.div className="empty-state" variants={motionVariants}>
      <div className="empty-mark">
        <LucideSparkles size={26} />
      </div>
      <h4>Your board is clear.</h4>
      <p>Create the first card to give the workspace a pulse.</p>
      <button className="primary-button" onClick={onCreate}>
        <Plus size={16} /> New task
      </button>
    </motion.div>
  );
}

function TaskEditorModal({ editingTask, taskForm, setTaskForm, saveTask, closeModal }) {
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal}>
      <motion.div
        className="modal-card"
        initial={{ opacity: 0, y: 36, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ duration: 0.28 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="panel-header">
          <div>
            <p className="eyebrow">Task editor</p>
            <h3>{editingTask ? 'Edit task' : 'Create task'}</h3>
          </div>
          <button className="ghost-button small" onClick={closeModal}>
            Close
          </button>
        </div>

        <form className="editor-grid" onSubmit={saveTask}>
          <label>
            <span>Title</span>
            <input
              type="text"
              value={taskForm.title}
              onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
          </label>

          <label className="span-2">
            <span>Description</span>
            <textarea
              rows={4}
              value={taskForm.description}
              onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Capture the next step, edge cases, or context."
            />
          </label>

          <label>
            <span>Status</span>
            <select
              value={taskForm.status}
              onChange={(event) => setTaskForm((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="todo">To do</option>
              <option value="in-progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </label>

          <label>
            <span>Priority</span>
            <select
              value={taskForm.priority}
              onChange={(event) => setTaskForm((current) => ({ ...current, priority: event.target.value }))}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <label>
            <span>Due date</span>
            <input
              type="date"
              value={taskForm.dueDate}
              onChange={(event) => setTaskForm((current) => ({ ...current, dueDate: event.target.value }))}
            />
          </label>

          <label className="span-2">
            <span>Tags</span>
            <input
              type="text"
              value={taskForm.tags}
              onChange={(event) => setTaskForm((current) => ({ ...current, tags: event.target.value }))}
              placeholder="design, sprint, client"
            />
          </label>

          <button className="primary-button wide" type="submit">
            {editingTask ? 'Save changes' : 'Create task'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default App;