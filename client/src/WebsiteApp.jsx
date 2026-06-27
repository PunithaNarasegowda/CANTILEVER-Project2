import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardList,
  Filter,
  Home,
  Kanban,
  LayoutDashboard,
  Leaf,
  ListChecks,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  PencilLine,
  Phone,
  Plus,
  Search,
  Send,
  Settings2,
  SlidersHorizontal,
  Target,
  Trash2,
  TrendingUp,
  UserRound,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { API_BASE } from './apiConfig';
import { authService } from './lib/auth';

const fadeUp = {
  hidden: { opacity: 0, y: 16, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.42, ease: 'easeOut' } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const navLinks = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/about', label: 'About', icon: Users },
  { to: '/services', label: 'Features', icon: ListChecks },
  { to: '/contact', label: 'Contact', icon: MessageSquare },
];

const privateLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/services', label: 'Features', icon: ListChecks },
  { to: '/contact', label: 'Support', icon: MessageSquare },
];

const sortOptions = [
  { value: 'recent', label: 'Recent first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'due', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
];

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To do' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const priorityOrder = {
  high: 0,
  medium: 1,
  low: 2,
};

const heroMetrics = [
  { label: 'Active teams', value: '12K+', detail: 'Planning and delivering daily' },
  { label: 'Tasks completed', value: '2.4M', detail: 'Tracked across workspaces' },
  { label: 'On-time delivery', value: '94%', detail: 'Deadlines met with clarity' },
];

const coreFeatures = [
  {
    title: 'Smart prioritization',
    text: 'Rank tasks by urgency and impact so your team always knows what deserves attention next.',
    icon: SlidersHorizontal,
  },
  {
    title: 'Deadline visibility',
    text: 'Calendar views and due-date alerts keep projects on schedule without constant check-ins.',
    icon: CalendarDays,
  },
  {
    title: 'Team collaboration',
    text: 'Assign owners, share context, and track progress together in one calm workspace.',
    icon: Users,
  },
];

const workflowSteps = [
  { step: '01', title: 'Capture tasks', text: 'Add work items with descriptions, tags, and due dates in seconds.' },
  { step: '02', title: 'Prioritize', text: 'Sort by urgency, filter by status, and focus on what moves the needle.' },
  { step: '03', title: 'Track progress', text: 'Move cards through stages and watch completion rates climb.' },
  { step: '04', title: 'Deliver on time', text: 'Hit deadlines with reminders, status updates, and team visibility.' },
];

const demoTasks = [
  { title: 'Finalize Q2 roadmap', status: 'in-progress', priority: 'high', due: 'Jun 28' },
  { title: 'Review design mockups', status: 'todo', priority: 'medium', due: 'Jun 26' },
  { title: 'Ship sprint retrospective', status: 'done', priority: 'low', due: 'Jun 24' },
  { title: 'Update stakeholder report', status: 'in-progress', priority: 'high', due: 'Jun 27' },
];

const platformFeatures = [
  {
    title: 'Kanban boards',
    text: 'Visualize workflow with drag-ready columns for to-do, in progress, and done.',
    icon: Kanban,
  },
  {
    title: 'Priority lanes',
    text: 'Filter by high, medium, or low priority to surface critical work instantly.',
    icon: Filter,
  },
  {
    title: 'Progress analytics',
    text: 'Completion rates, weekly rhythm charts, and workspace health at a glance.',
    icon: BarChart3,
  },
  {
    title: 'Deadline alerts',
    text: 'Never miss a due date with reminders and overdue task highlighting.',
    icon: Bell,
  },
];

const userBenefits = [
  { title: 'Reduce context switching', text: 'One workspace for tasks, deadlines, and team updates.', icon: Target },
  { title: 'Ship faster', text: 'Clear priorities mean less debate and more delivery.', icon: Zap },
  { title: 'Stay accountable', text: 'Assignees, status badges, and progress bars keep everyone aligned.', icon: TrendingUp },
  { title: 'Work with clarity', text: 'A calm interface designed for focus, not distraction.', icon: Leaf },
];

const contactChannels = [
  { label: 'Email support', value: 'help@taskflow.app', icon: Mail },
  { label: 'Sales inquiries', value: '+1 (555) 012-2070', icon: Phone },
  { label: 'Headquarters', value: 'Remote-first, worldwide', icon: MapPin },
];

function apiRequest(session, path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  return (async () => {
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
  })();
}

function formatDate(value) {
  if (!value) {
    return 'No due date';
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function calculateCompletion(tasks) {
  if (!tasks.length) {
    return 0;
  }

  return Math.round((tasks.filter((task) => task.status === 'done').length / tasks.length) * 100);
}

function calculateStats(tasks) {
  return {
    total: tasks.length,
    completed: tasks.filter((task) => task.status === 'done').length,
    active: tasks.filter((task) => task.status !== 'done').length,
    urgent: tasks.filter((task) => task.priority === 'high').length,
  };
}

function matchesTaskFilters(task, filters) {
  const search = filters.q.trim().toLowerCase();

  const matchesSearch =
    !search ||
    task.title.toLowerCase().includes(search) ||
    task.description.toLowerCase().includes(search) ||
    (task.tags || []).some((tag) => tag.toLowerCase().includes(search));

  const matchesStatus = filters.status === 'all' || task.status === filters.status;

  return matchesSearch && matchesStatus;
}

function compareTasks(left, right, sort) {
  if (sort === 'oldest') {
    return new Date(left.createdAt) - new Date(right.createdAt);
  }

  if (sort === 'due') {
    const leftDue = left.dueDate ? new Date(left.dueDate).getTime() : Number.POSITIVE_INFINITY;
    const rightDue = right.dueDate ? new Date(right.dueDate).getTime() : Number.POSITIVE_INFINITY;

    if (leftDue !== rightDue) {
      return leftDue - rightDue;
    }

    return new Date(right.createdAt) - new Date(left.createdAt);
  }

  if (sort === 'priority') {
    const delta = priorityOrder[left.priority] - priorityOrder[right.priority];

    if (delta !== 0) {
      return delta;
    }

    return new Date(right.createdAt) - new Date(left.createdAt);
  }

  return new Date(right.createdAt) - new Date(left.createdAt);
}

function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function AppFrame({ children }) {
  return (
    <div className="app-shell">
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="orb orb-c" />
      {children}
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ q: '', status: 'all', sort: 'recent' });
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [taskEditorOpen, setTaskEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    tags: '',
  });
  const [contactStatus, setContactStatus] = useState('');

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
        const response = await apiRequest(session, '/tasks');
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
  }, [session]);

  const stats = useMemo(() => calculateStats(tasks), [tasks]);
  const completion = useMemo(() => calculateCompletion(tasks), [tasks]);

  const filteredTasks = useMemo(
    () => [...tasks].filter((task) => matchesTaskFilters(task, filters)).sort((left, right) => compareTasks(left, right, filters.sort)),
    [tasks, filters],
  );

  const activeFilterSummary = useMemo(() => {
    const summary = [];

    if (filters.q.trim()) {
      summary.push(`Search: ${filters.q.trim()}`);
    }

    if (filters.status !== 'all') {
      summary.push(`Status: ${statusOptions.find((option) => option.value === filters.status)?.label || filters.status}`);
    }

    if (filters.sort !== 'recent') {
      summary.push(`Sort: ${sortOptions.find((option) => option.value === filters.sort)?.label || filters.sort}`);
    }

    return summary;
  }, [filters]);

  const taskCounts = useMemo(
    () => ({
      filtered: filteredTasks.length,
      total: tasks.length,
    }),
    [filteredTasks.length, tasks.length],
  );

  const authSubmit = async (mode, payload) => {
    if (mode === 'forgot') {
      return authService.resetPassword(payload.email);
    }

    if (mode === 'register') {
      return authService.register(payload);
    }

    return authService.login(payload);
  };

  const refreshTasks = async () => {
    if (!session) {
      return;
    }

    const response = await apiRequest(session, '/tasks');
    setTasks(response.tasks || []);
  };

  const handleSaveTask = async (event) => {
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

      setTaskEditorOpen(false);
      setEditingTask(null);
      setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', dueDate: '', tags: '' });
      await refreshTasks();
    } catch (error) {
      setTaskError(error.message);
    } finally {
      setTaskLoading(false);
    }
  };

  const handleTaskStatusChange = async (task, status) => {
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

      await refreshTasks();
    } catch (error) {
      setTaskError(error.message);
    } finally {
      setTaskLoading(false);
    }
  };

  const handleTaskDelete = async (task) => {
    if (!session) {
      return;
    }

    setTaskLoading(true);

    try {
      await apiRequest(session, `/tasks/${task.id}`, {
        method: 'DELETE',
      });
      await refreshTasks();
    } catch (error) {
      setTaskError(error.message);
    } finally {
      setTaskLoading(false);
    }
  };

  const openTaskEditor = (task = null) => {
    const currentTask = task || null;
    setEditingTask(currentTask);
    setTaskForm(
      currentTask
        ? {
            title: currentTask.title || '',
            description: currentTask.description || '',
            status: currentTask.status || 'todo',
            priority: currentTask.priority || 'medium',
            dueDate: currentTask.dueDate ? new Date(currentTask.dueDate).toISOString().slice(0, 10) : '',
            tags: Array.isArray(currentTask.tags) ? currentTask.tags.join(', ') : '',
          }
        : { title: '', description: '', status: 'todo', priority: 'medium', dueDate: '', tags: '' },
    );
    setTaskEditorOpen(true);
  };

  const handleLogout = async () => {
    await authService.logout();
    setSession(null);
    setTasks([]);
    setTaskEditorOpen(false);
    setEditingTask(null);
  };

  return (
    <BrowserRouter>
      <AppFrame>
        <Routes>
          <Route path="/" element={<HomePage session={session} />} />
          <Route path="/about" element={<AboutPage session={session} />} />
          <Route path="/services" element={<ServicesPage session={session} />} />
          <Route path="/contact" element={<ContactPage session={session} contactStatus={contactStatus} setContactStatus={setContactStatus} />} />
          <Route path="/login" element={<AuthPage mode="login" session={session} authReady={authReady} onSubmit={authSubmit} />} />
          <Route path="/register" element={<AuthPage mode="register" session={session} authReady={authReady} onSubmit={authSubmit} />} />
          <Route path="/forgot-password" element={<AuthPage mode="forgot" session={session} authReady={authReady} onSubmit={authSubmit} />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute authReady={authReady} session={session}>
                <DashboardPage
                  session={session}
                  tasks={tasks}
                  filteredTasks={filteredTasks}
                  stats={stats}
                  completion={completion}
                  filters={filters}
                  setFilters={setFilters}
                  taskCounts={taskCounts}
                  taskLoading={taskLoading}
                  taskError={taskError}
                  activeFilterSummary={activeFilterSummary}
                  openTaskEditor={openTaskEditor}
                  handleTaskDelete={handleTaskDelete}
                  handleTaskStatusChange={handleTaskStatusChange}
                  handleLogout={handleLogout}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute authReady={authReady} session={session}>
                <ProfilePage session={session} tasks={tasks} stats={stats} completion={completion} handleLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <AnimatePresence>
          {taskEditorOpen && session ? (
            <TaskEditorModal
              editingTask={editingTask}
              taskForm={taskForm}
              setTaskForm={setTaskForm}
              onSave={handleSaveTask}
              onClose={() => setTaskEditorOpen(false)}
            />
          ) : null}
        </AnimatePresence>
      </AppFrame>
    </BrowserRouter>
  );
}

function ProtectedRoute({ authReady, session, children }) {
  if (!authReady) {
    return (
      <section className="loading-screen">
        <div className="loading-card">
          <Leaf size={16} />
          Loading your workspace
        </div>
      </section>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function SharedHeader({ session }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="public-header card-soft">
      <Link className="brand-mark" to="/" aria-label="TaskFlow home" onClick={() => setMobileOpen(false)}>
        <ClipboardList size={20} />
      </Link>
      <nav className={`public-nav${mobileOpen ? ' open' : ''}`}>
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.exact}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={16} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="header-actions">
        <button
          className="icon-button mobile-nav-toggle"
          type="button"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        {session ? (
          <Link className="primary-button small" to="/dashboard">
            Open dashboard
            <ArrowRight size={16} />
          </Link>
        ) : (
          <>
            <Link className="ghost-button small" to="/login">
              Sign in
            </Link>
            <Link className="primary-button small" to="/register">
              Get started
              <ArrowRight size={16} />
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

function SharedFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-brand">
        <h3>TaskFlow</h3>
        <p>Task management built for teams who value clarity, focus, and on-time delivery.</p>
      </div>
      <div className="footer-col">
        <h4>Product</h4>
        <Link to="/services">Features</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/about">About</Link>
      </div>
      <div className="footer-col">
        <h4>Resources</h4>
        <Link to="/contact">Help center</Link>
        <Link to="/contact">Contact support</Link>
        <Link to="/register">Create account</Link>
      </div>
      <div className="footer-col">
        <h4>Company</h4>
        <Link to="/about">Our story</Link>
        <Link to="/contact">Careers</Link>
        <Link to="/contact">Privacy</Link>
      </div>
      <div className="footer-bottom">
        <span>© 2026 TaskFlow. Built for productive teams.</span>
        <span>Manage tasks. Meet deadlines. Move forward.</span>
      </div>
    </footer>
  );
}

function DashboardSidebar({ session, handleLogout }) {
  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark brand-mark-large">
          <ClipboardList size={24} />
        </div>
        <div>
          <h1>TaskFlow</h1>
          <p>Focus. Plan. Deliver.</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {privateLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
              <Icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-card promo-card">
        <div className="promo-copy">
          <h3>Weekly planning tip</h3>
          <p>Review high-priority tasks every Monday to keep your team aligned on what matters most.</p>
        </div>
        <Link className="ghost-button full" to="/dashboard">
          View my tasks
        </Link>
      </div>

      <div className="sidebar-profile">
        <div className="avatar avatar-green">{session?.displayName?.[0] || 'U'}</div>
        <div>
          <strong>{session?.displayName || session?.email}</strong>
          <p>{session?.email}</p>
        </div>
        <button className="sidebar-logout" onClick={handleLogout} type="button">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

function HomePage({ session }) {
  return (
    <div className="page-shell marketing-shell">
      <SharedHeader session={session} />
      <main>
        <section className="hero-grid">
          <motion.div className="hero-copy card-soft hero-card" variants={fadeUp} initial="hidden" animate="show">
            <Badge tone="success">Task management, refined</Badge>
            <h1>Organize work. Hit deadlines. Keep your team in sync.</h1>
            <p className="section-intro">
              TaskFlow gives teams a calm, focused workspace to capture tasks, set priorities, track progress, and
              deliver on time — without the clutter of generic project tools.
            </p>
            <div className="hero-actions">
              <Link className="primary-button" to={session ? '/dashboard' : '/register'}>
                {session ? 'Go to dashboard' : 'Start free trial'}
                <ArrowRight size={16} />
              </Link>
              <Link className="secondary-button" to="/services">
                Explore features
              </Link>
            </div>
            <div className="hero-inline-stats">
              {heroMetrics.map((metric) => (
                <div key={metric.label} className="mini-metric">
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                  <small>{metric.detail}</small>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div className="hero-preview card-soft" variants={fadeUp} initial="hidden" animate="show">
            <div className="preview-top">
              <div>
                <Badge tone="neutral">Live workspace</Badge>
                <h2>Today&apos;s task board</h2>
              </div>
              <Badge tone="info">4 active</Badge>
            </div>
            <div className="progress-bar-wrap">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--muted)' }}>
                <span>Sprint progress</span>
                <strong style={{ color: 'var(--accent-deep)' }}>68%</strong>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: '68%' }} />
              </div>
            </div>
            <div className="task-preview-list">
              {demoTasks.map((task) => (
                <div key={task.title} className="task-preview-item">
                  <div className={`task-preview-check${task.status === 'done' ? ' done' : ''}`}>
                    {task.status === 'done' ? <CheckCircle2 size={14} /> : null}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.92rem', display: 'block' }}>{task.title}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Due {task.due}</span>
                  </div>
                  <div className="task-preview-meta">
                    <span className={`priority-dot ${task.priority}`} />
                    <Badge tone={task.status === 'done' ? 'success' : task.status === 'in-progress' ? 'info' : 'neutral'}>
                      {task.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="content-grid three-up">
          {coreFeatures.map((item) => {
            const Icon = item.icon;
            return (
              <motion.article key={item.title} className="card-soft feature-card" variants={fadeUp} initial="hidden" animate="show">
                <div className="feature-icon">
                  <Icon size={18} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </motion.article>
            );
          })}
        </section>

        <section className="workflow-section">
          <motion.div className="section-head" variants={fadeUp} initial="hidden" animate="show">
            <div>
              <Badge tone="neutral">How it works</Badge>
              <h2 style={{ fontFamily: "'Fraunces', serif", margin: '8px 0 0', letterSpacing: '-0.02em' }}>
                From capture to completion in four steps
              </h2>
            </div>
          </motion.div>
          <div className="workflow-steps">
            {workflowSteps.map((item) => (
              <motion.article key={item.step} className="card-soft workflow-step" variants={fadeUp} initial="hidden" animate="show">
                <span className="workflow-step-num">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="content-grid split-layout">
          <motion.article className="card-soft panel-card" variants={fadeUp} initial="hidden" animate="show">
            <div className="section-head">
              <div>
                <Badge tone="neutral">Why teams choose TaskFlow</Badge>
                <h2>Built for real productivity workflows</h2>
              </div>
            </div>
            <div className="benefits-grid">
              {userBenefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div key={benefit.title} className="benefit-item">
                    <Icon size={18} />
                    <div>
                      <strong>{benefit.title}</strong>
                      <p>{benefit.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.article>

          <motion.article className="card-soft panel-card panel-dark" variants={fadeUp} initial="hidden" animate="show">
            <div className="section-head">
              <div>
                <Badge tone="info">Ready to focus?</Badge>
                <h2>Start managing tasks with clarity today</h2>
              </div>
            </div>
            <p>
              Join thousands of teams who use TaskFlow to plan sprints, track deadlines, and collaborate without losing
              momentum.
            </p>
            <Link className="primary-button" to={session ? '/dashboard' : '/register'}>
              {session ? 'Open your workspace' : 'Create free account'}
              <ArrowRight size={16} />
            </Link>
          </motion.article>
        </section>
      </main>
      <SharedFooter />
    </div>
  );
}

function AboutPage({ session }) {
  return (
    <div className="page-shell marketing-shell">
      <SharedHeader session={session} />
      <main>
        <section className="page-hero card-soft">
          <Badge tone="success">About TaskFlow</Badge>
          <h1>Task management designed for teams who deliver.</h1>
          <p>
            We built TaskFlow because most project tools feel overwhelming. Our mission is simple: help individuals and
            teams capture work, prioritize effectively, track progress, and meet deadlines — all in a workspace that
            feels calm and intentional.
          </p>
        </section>

        <section className="content-grid three-up">
          <motion.article className="card-soft stat-tile" variants={fadeUp} initial="hidden" animate="show">
            <Target size={18} />
            <h3>Focus-first design</h3>
            <p>Every screen is built around the task lifecycle — capture, prioritize, execute, and review.</p>
          </motion.article>
          <motion.article className="card-soft stat-tile" variants={fadeUp} initial="hidden" animate="show">
            <Users size={18} />
            <h3>Built for collaboration</h3>
            <p>Assign tasks, share context, and keep everyone aligned on priorities and deadlines.</p>
          </motion.article>
          <motion.article className="card-soft stat-tile" variants={fadeUp} initial="hidden" animate="show">
            <TrendingUp size={18} />
            <h3>Progress you can see</h3>
            <p>Completion rates, status badges, and weekly charts make momentum visible at a glance.</p>
          </motion.article>
        </section>

        <section className="content-grid split-layout">
          <motion.article className="card-soft panel-card" variants={fadeUp} initial="hidden" animate="show">
            <Badge tone="neutral">Our approach</Badge>
            <h2>Productivity without the noise</h2>
            <p>
              TaskFlow strips away unnecessary complexity. No bloated feature lists — just the tools teams need to plan
              sprints, manage deadlines, and track deliverables with confidence.
            </p>
            <div className="bullet-list" style={{ marginTop: 16 }}>
              <div><CheckCircle2 size={18} /> Task creation with priorities, tags, and due dates</div>
              <div><CheckCircle2 size={18} /> Kanban-style status tracking</div>
              <div><CheckCircle2 size={18} /> Smart filters and sorting</div>
              <div><CheckCircle2 size={18} /> Workspace analytics and progress monitoring</div>
            </div>
          </motion.article>
          <motion.article className="card-soft panel-card panel-dark" variants={fadeUp} initial="hidden" animate="show">
            <Badge tone="info">Join us</Badge>
            <h2>Ready to transform how your team works?</h2>
            <p>Thousands of teams rely on TaskFlow to stay organized and deliver on time.</p>
            <Link className="primary-button" to={session ? '/dashboard' : '/register'}>
              {session ? 'Go to dashboard' : 'Get started free'}
              <ArrowRight size={16} />
            </Link>
          </motion.article>
        </section>
      </main>
      <SharedFooter />
    </div>
  );
}

function ServicesPage({ session }) {
  return (
    <div className="page-shell marketing-shell">
      <SharedHeader session={session} />
      <main>
        <section className="page-hero card-soft">
          <Badge tone="info">Platform features</Badge>
          <h1>Everything you need to manage tasks and deliver on time.</h1>
          <p>
            From daily to-do lists to cross-team project tracking, TaskFlow provides the tools to organize work,
            monitor progress, and keep deadlines front and center.
          </p>
        </section>

        <section className="content-grid four-up">
          {platformFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.article key={feature.title} className="card-soft service-card" variants={fadeUp} initial="hidden" animate="show">
                <div className="feature-icon"><Icon size={18} /></div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </motion.article>
            );
          })}
        </section>

        <section className="content-grid split-layout">
          <motion.article className="card-soft panel-card" variants={fadeUp} initial="hidden" animate="show">
            <Badge tone="neutral">Task tracking</Badge>
            <h2>Create, edit, and complete tasks without friction</h2>
            <p>
              Add titles, descriptions, priorities, due dates, and tags. Move tasks through to-do, in progress, and done
              with a single status change.
            </p>
            <div className="bullet-list" style={{ marginTop: 16 }}>
              <div><CheckCircle2 size={18} /> Full CRUD task management</div>
              <div><CheckCircle2 size={18} /> Priority levels: high, medium, low</div>
              <div><CheckCircle2 size={18} /> Tag-based organization</div>
            </div>
          </motion.article>
          <motion.article className="card-soft panel-card" variants={fadeUp} initial="hidden" animate="show">
            <Badge tone="neutral">Filters & sorting</Badge>
            <h2>Find the right task in seconds</h2>
            <p>
              Search by keyword, filter by status, and sort by due date, priority, or recency. Your board adapts to how
              you actually work.
            </p>
            <div className="bullet-list" style={{ marginTop: 16 }}>
              <div><CheckCircle2 size={18} /> Real-time search across tasks</div>
              <div><CheckCircle2 size={18} /> Status chip filters</div>
              <div><CheckCircle2 size={18} /> Flexible sort options</div>
            </div>
          </motion.article>
        </section>
      </main>
      <SharedFooter />
    </div>
  );
}

function ContactPage({ session, contactStatus, setContactStatus }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    setContactStatus('Thanks for reaching out. Our support team will respond within one business day.');
  };

  return (
    <div className="page-shell marketing-shell">
      <SharedHeader session={session} />
      <main>
        <section className="page-hero card-soft">
          <Badge tone="warn">Support</Badge>
          <h1>Questions about task management? We&apos;re here to help.</h1>
          <p>
            Whether you need help setting up your workspace, onboarding your team, or troubleshooting a workflow —
            reach out and we&apos;ll get back to you promptly.
          </p>
        </section>

        <section className="content-grid contact-grid">
          <motion.form className="card-soft form-card" variants={fadeUp} initial="hidden" animate="show" onSubmit={handleSubmit}>
            <div className="form-row two-up">
              <label>
                <span>Name</span>
                <input type="text" placeholder="Your name" required />
              </label>
              <label>
                <span>Email</span>
                <input type="email" placeholder="you@company.com" required />
              </label>
            </div>
            <label>
              <span>How can we help?</span>
              <textarea rows="6" placeholder="Describe your question about tasks, teams, or workflows…" required />
            </label>
            <button className="primary-button" type="submit">
              Send message
              <Send size={16} />
            </button>
            {contactStatus ? <div className="success-banner">{contactStatus}</div> : null}
          </motion.form>

          <div className="stack-grid">
            {contactChannels.map((channel) => {
              const Icon = channel.icon;
              return (
                <motion.article key={channel.label} className="card-soft contact-card" variants={fadeUp} initial="hidden" animate="show">
                  <Icon size={18} />
                  <div>
                    <strong>{channel.label}</strong>
                    <p>{channel.value}</p>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>
      </main>
      <SharedFooter />
    </div>
  );
}

function AuthPage({ mode, session, authReady, onSubmit }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const titleMap = {
    login: 'Welcome back',
    register: 'Create your account',
    forgot: 'Reset your password',
  };

  const bodyMap = {
    login: 'Sign in to access your task board, review priorities, and track team progress.',
    register: 'Create your workspace and start organizing tasks, deadlines, and projects in minutes.',
    forgot: 'Enter your email and we\'ll send a link to reset your password.',
  };

  if (session && authReady && mode !== 'forgot') {
    return <Navigate to="/dashboard" replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const payload = {
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        password: form.password,
      };

      const result = await onSubmit(mode, payload);

      if (mode === 'forgot') {
        setMessage(result.message);
      } else {
        navigate('/dashboard');
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell auth-shell-shell">
      <SharedHeader session={session} />
      <main className="auth-layout">
        <motion.section className="auth-intro card-soft auth-panel" variants={fadeUp} initial="hidden" animate="show">
          <Badge tone="success">TaskFlow workspace</Badge>
          <h1>{titleMap[mode]}</h1>
          <p>{bodyMap[mode]}</p>
          <div className="auth-benefits">
            <div><ListChecks size={18} /><span>Full task management</span></div>
            <div><CalendarDays size={18} /><span>Deadline tracking</span></div>
            <div><Users size={18} /><span>Team collaboration</span></div>
          </div>
        </motion.section>

        <motion.section className="card-soft auth-form-card" variants={fadeUp} initial="hidden" animate="show">
          <div className="auth-tabs">
            <Link to="/login" className={mode === 'login' ? 'auth-tab active' : 'auth-tab'}>Login</Link>
            <Link to="/register" className={mode === 'register' ? 'auth-tab active' : 'auth-tab'}>Register</Link>
            <Link to="/forgot-password" className={mode === 'forgot' ? 'auth-tab active' : 'auth-tab'}>Forgot</Link>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === 'register' ? (
              <label>
                <span>Display name</span>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                  placeholder="Alex Morgan"
                />
              </label>
            ) : null}

            <label>
              <span>Email</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="you@example.com"
              />
            </label>

            {mode !== 'forgot' ? (
              <label>
                <span>Password</span>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="••••••••"
                />
              </label>
            ) : null}

            {error ? <div className="error-banner">{error}</div> : null}
            {message ? <div className="success-banner">{message}</div> : null}

            <button className="primary-button full" disabled={loading} type="submit">
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset link'}
              <ArrowRight size={16} />
            </button>

            {authService.hasFirebaseConfig ? null : (
              <p className="auth-note">Demo mode is active. Your tasks are stored locally until you connect Firebase.</p>
            )}
          </form>
        </motion.section>
      </main>
    </div>
  );
}

function ProfilePage({ session, tasks, stats, completion, handleLogout }) {
  const navigate = useNavigate();

  const doLogout = async () => {
    await handleLogout();
    navigate('/');
  };

  return (
    <div className="page-shell dashboard-shell profile-shell">
      <DashboardSidebar session={session} handleLogout={doLogout} />
      <main className="dashboard-main">
        <header className="dashboard-topbar card-soft topbar-compact">
          <div>
            <Badge tone="neutral">Profile</Badge>
            <h1>Your account & workspace overview</h1>
          </div>
          <div className="topbar-actions">
            <Link className="ghost-button" to="/dashboard">Back to dashboard</Link>
          </div>
        </header>

        <section className="content-grid profile-grid">
          <motion.article className="card-soft profile-card" variants={fadeUp} initial="hidden" animate="show">
            <div className="profile-avatar avatar-large">{session?.displayName?.[0] || 'U'}</div>
            <h2>{session?.displayName || 'Operator'}</h2>
            <p>{session?.email}</p>
            <div className="profile-tags">
              <Badge tone="success">Active user</Badge>
              <Badge tone="neutral">{session?.demo ? 'Demo mode' : 'Firebase'}</Badge>
            </div>
          </motion.article>

          <motion.article className="card-soft" variants={fadeUp} initial="hidden" animate="show">
            <div className="section-head">
              <h2>Workspace health</h2>
            </div>
            <div className="metric-grid slim-grid">
              <div className="metric-card slim">
                <strong>{completion}%</strong>
                <span>Completion</span>
              </div>
              <div className="metric-card slim">
                <strong>{stats.active}</strong>
                <span>Open tasks</span>
              </div>
              <div className="metric-card slim">
                <strong>{stats.urgent}</strong>
                <span>High priority</span>
              </div>
            </div>
            <div className="progress-pill">
              <span>Overall progress</span>
              <strong>{completion}%</strong>
            </div>
            <div className="progress-bar-wrap" style={{ marginTop: 12 }}>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${completion}%` }} />
              </div>
            </div>
          </motion.article>
        </section>

        <section className="content-grid split-layout">
          <motion.article className="card-soft panel-card" variants={fadeUp} initial="hidden" animate="show">
            <Badge tone="neutral">Recent tasks</Badge>
            <div className="mini-list">
              {tasks.slice(0, 4).map((task) => (
                <div key={task.id} className="mini-list-row">
                  <span>{task.title}</span>
                  <small>{priorityLabels[task.priority]}</small>
                </div>
              ))}
            </div>
          </motion.article>
          <motion.article className="card-soft panel-card" variants={fadeUp} initial="hidden" animate="show">
            <Badge tone="info">Account security</Badge>
            <h2>Your data stays protected</h2>
            <p>Secure authentication keeps your tasks and workspace information safe. Sign out anytime from the sidebar or profile page.</p>
          </motion.article>
        </section>
      </main>
    </div>
  );
}

function DashboardPage({
  session,
  filteredTasks,
  stats,
  completion,
  filters,
  setFilters,
  taskCounts,
  taskLoading,
  taskError,
  activeFilterSummary,
  openTaskEditor,
  handleTaskDelete,
  handleTaskStatusChange,
  handleLogout,
}) {
  const navigate = useNavigate();

  const doLogout = async () => {
    await handleLogout();
    navigate('/');
  };

  return (
    <div className="dashboard-shell">
      <DashboardSidebar session={session} handleLogout={doLogout} />

      <main className="dashboard-main">
        <header className="dashboard-topbar card-soft">
          <label className="dashboard-search">
            <Search size={16} />
            <input
              type="search"
              value={filters.q}
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
              placeholder="Search tasks"
            />
          </label>
          <div className="topbar-actions">
            <button className="icon-button" type="button"><Bell size={16} /></button>
            <button className="icon-button" type="button"><Settings2 size={16} /></button>
            <div className="profile-chip">
              <span className="avatar avatar-sm">{session?.displayName?.[0] || 'U'}</span>
              <div>
                <strong>{session?.displayName || session?.email}</strong>
                <small>{session?.demo ? 'Demo' : 'Firebase'}</small>
              </div>
            </div>
          </div>
        </header>

        <section className="dashboard-hero card-soft">
          <div>
            <Badge tone="success">Your workspace</Badge>
            <h1>Plan, prioritize, and accomplish tasks with clarity.</h1>
            <p>Track deadlines, filter by status, and monitor progress — all from one focused dashboard.</p>
          </div>
          <div className="dashboard-hero-actions">
            <button className="primary-button" type="button" onClick={() => openTaskEditor()}>
              <Plus size={16} /> Add task
            </button>
            <Link className="secondary-button" to="/profile">
              View profile
            </Link>
          </div>
        </section>

        <section className="metric-grid">
          <motion.article className="metric-card metric-green" variants={fadeUp} initial="hidden" animate="show">
            <span>Total tasks</span>
            <strong>{stats.total}</strong>
            <small>Board-wide activity</small>
          </motion.article>
          <motion.article className="metric-card" variants={fadeUp} initial="hidden" animate="show">
            <span>Completed</span>
            <strong>{stats.completed}</strong>
            <small>Delivered items</small>
          </motion.article>
          <motion.article className="metric-card" variants={fadeUp} initial="hidden" animate="show">
            <span>In progress</span>
            <strong>{stats.active}</strong>
            <small>Active workstreams</small>
          </motion.article>
          <motion.article className="metric-card" variants={fadeUp} initial="hidden" animate="show">
            <span>Completion</span>
            <strong>{completion}%</strong>
            <small>Progress toward done</small>
          </motion.article>
        </section>

        <section className="dashboard-grid">
          <motion.section className="card-soft board-panel" variants={fadeUp} initial="hidden" animate="show">
            <div className="panel-head">
              <div>
                <Badge tone="neutral">Filters</Badge>
                <h2>Shape the board</h2>
              </div>
              <button className="text-button" type="button" onClick={() => setFilters({ q: '', status: 'all', sort: 'recent' })}>
                Clear
              </button>
            </div>

            <div className="filter-stack">
              <div className="chip-row">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={filters.status === option.value ? 'chip active' : 'chip'}
                    onClick={() => setFilters((current) => ({ ...current, status: option.value }))}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <label className="select-field">
                <span>Sort tasks</span>
                <select value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}>
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <div className="filter-summary">
                <Filter size={16} />
                <span>{activeFilterSummary.length ? activeFilterSummary.join(' • ') : 'No filters applied'}</span>
              </div>
            </div>

            {taskError ? <div className="error-banner">{taskError}</div> : null}
            {taskLoading ? <div className="inline-loading">Syncing tasks…</div> : null}

            <AnimatePresence mode="wait">
              {filteredTasks.length ? (
                <motion.div className="task-grid" variants={stagger} initial="hidden" animate="show">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => openTaskEditor(task)}
                      onDelete={() => handleTaskDelete(task)}
                      onStatusChange={(status) => handleTaskStatusChange(task, status)}
                    />
                  ))}
                </motion.div>
              ) : (
                <EmptyBoard filtersActive={activeFilterSummary.length > 0} onCreate={() => openTaskEditor()} onClear={() => setFilters({ q: '', status: 'all', sort: 'recent' })} />
              )}
            </AnimatePresence>
          </motion.section>

          <aside className="dashboard-rail">
            <motion.article className="card-soft rail-card" variants={fadeUp} initial="hidden" animate="show">
              <Badge tone="info">Task overview</Badge>
              <h2>{taskCounts.filtered} of {taskCounts.total} tasks</h2>
              <p>Filtered results update instantly as you search, filter by status, or change sort order.</p>
            </motion.article>

            <motion.article className="card-soft rail-card small-chart" variants={fadeUp} initial="hidden" animate="show">
              <div className="section-head compact">
                <h3>Weekly rhythm</h3>
                <Badge tone="neutral">Live</Badge>
              </div>
              <div className="bar-chart">
                {[56, 42, 70, 84, 64, 38, 50].map((value, index) => (
                  <span key={`${value}-${index}`} style={{ height: `${value}%` }} />
                ))}
              </div>
              <div className="chart-labels">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
            </motion.article>

            <motion.article className="card-soft rail-card reminders-card" variants={fadeUp} initial="hidden" animate="show">
              <Badge tone="success">Daily checklist</Badge>
              <h3>End-of-day review</h3>
              <ul>
                <li>Review high-priority tasks due tomorrow</li>
                <li>Update in-progress items with next steps</li>
                <li>Mark completed work as done</li>
              </ul>
            </motion.article>
          </aside>
        </section>
      </main>
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const tone = task.status === 'done' ? 'success' : task.status === 'in-progress' ? 'info' : 'neutral';

  return (
    <motion.article className="task-card" variants={fadeUp}>
      <div className="task-head">
        <Badge tone={tone}>{task.status.replace('-', ' ')}</Badge>
        <div className="task-actions">
          <button className="icon-button" type="button" onClick={onEdit} aria-label="Edit task"><PencilLine size={15} /></button>
          <button className="icon-button danger" type="button" onClick={onDelete} aria-label="Delete task"><Trash2 size={15} /></button>
        </div>
      </div>
      <h3>{task.title}</h3>
      <p>{task.description || 'No description added yet.'}</p>
      <div className="task-meta">
        <span><CalendarDays size={14} /> {formatDate(task.dueDate)}</span>
        <span><SlidersHorizontal size={14} /> {priorityLabels[task.priority]}</span>
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
        {task.status === 'done' ? <CheckCircle2 size={16} className="done-icon" /> : <Circle size={16} className="done-icon muted" />}
      </div>
    </motion.article>
  );
}

function EmptyBoard({ filtersActive, onCreate, onClear }) {
  return (
    <motion.div className="empty-board" variants={fadeUp}>
      <div className="empty-mark">
        <ClipboardList size={24} />
      </div>
      <h3>{filtersActive ? 'No tasks match your filters' : 'Your task board is empty'}</h3>
      <p>
        {filtersActive
          ? 'Try broadening your search or clearing filters to see more tasks.'
          : 'Create your first task to start tracking work, deadlines, and progress.'}
      </p>
      <div className="empty-actions">
        <button className="primary-button" type="button" onClick={onCreate}><Plus size={16} /> Add task</button>
        {filtersActive ? <button className="ghost-button" type="button" onClick={onClear}>Clear filters</button> : null}
      </div>
    </motion.div>
  );
}

function TaskEditorModal({ editingTask, taskForm, setTaskForm, onSave, onClose }) {
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="modal-card"
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.985 }}
        transition={{ duration: 0.22 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <Badge tone="neutral">Task editor</Badge>
            <h2>{editingTask ? 'Edit task' : 'Create task'}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close modal"><X size={16} /></button>
        </div>

        <form className="modal-form" onSubmit={onSave}>
          <label>
            <span>Title</span>
            <input
              type="text"
              required
              value={taskForm.title}
              onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
            />
          </label>
          <label className="wide-field">
            <span>Description</span>
            <textarea
              rows={4}
              value={taskForm.description}
              onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Capture the next step or important context."
            />
          </label>
          <label>
            <span>Status</span>
            <select value={taskForm.status} onChange={(event) => setTaskForm((current) => ({ ...current, status: event.target.value }))}>
              <option value="todo">To do</option>
              <option value="in-progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </label>
          <label>
            <span>Priority</span>
            <select value={taskForm.priority} onChange={(event) => setTaskForm((current) => ({ ...current, priority: event.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label>
            <span>Due date</span>
            <input type="date" value={taskForm.dueDate} onChange={(event) => setTaskForm((current) => ({ ...current, dueDate: event.target.value }))} />
          </label>
          <label className="wide-field">
            <span>Tags</span>
            <input
              type="text"
              value={taskForm.tags}
              onChange={(event) => setTaskForm((current) => ({ ...current, tags: event.target.value }))}
              placeholder="design, sprint, client"
            />
          </label>
          <button className="primary-button full" type="submit">
            {editingTask ? 'Save changes' : 'Create task'}
            <ArrowRight size={16} />
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default App;
