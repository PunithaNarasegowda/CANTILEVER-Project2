import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardList,
  Clock3,
  Download,
  Filter,
  HeartHandshake,
  Home,
  LayoutDashboard,
  Leaf,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  PencilLine,
  Phone,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  SlidersHorizontal,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { authService } from './lib/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
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
  { to: '/services', label: 'Services', icon: BriefcaseBusiness },
  { to: '/contact', label: 'Contact', icon: MessageSquare },
];

const privateLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/services', label: 'Services', icon: BriefcaseBusiness },
  { to: '/contact', label: 'Contact', icon: MessageSquare },
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
  { label: 'Conversion', value: '94%', detail: 'Elegant, responsive, and fast' },
  { label: 'Tasks', value: 'Live', detail: 'CRUD, filters, and sorting' },
  { label: 'Auth', value: 'Secure', detail: 'Firebase + local demo fallback' },
];

const designPrinciples = [
  {
    title: 'Warm, premium surfaces',
    text: 'Cream backgrounds, glassy cards, deep green accents, and restrained borders echo the reference without copying it directly.',
  },
  {
    title: 'Editorial spacing',
    text: 'Large headlines, generous gutters, and strong hierarchy make the app feel designed by a human with taste.',
  },
  {
    title: 'Soft motion',
    text: 'Cards lift, panels drift, and focus states feel tactile instead of noisy.',
  },
];

const serviceCards = [
  {
    title: 'Product design system',
    text: 'A consistent set of cards, buttons, badges, and layouts reused across every page.',
    icon: Sparkles,
  },
  {
    title: 'Task workflow',
    text: 'Create, read, update, delete, filter, and sort tasks with a responsive data layer.',
    icon: ClipboardList,
  },
  {
    title: 'Authentication flow',
    text: 'Login, register, logout, and password reset support with Firebase or demo mode.',
    icon: ShieldCheck,
  },
  {
    title: 'Deployment ready',
    text: 'Netlify/Vercel frontend support and Render backend deployment guidance.',
    icon: Download,
  },
];

const contactChannels = [
  { label: 'Email', value: 'hello@taskflow.app', icon: Mail },
  { label: 'Phone', value: '+1 (555) 012-2070', icon: Phone },
  { label: 'Location', value: 'Remote-first product team', icon: MapPin },
];

const profileStats = [
  { label: 'Completion', value: '78%' },
  { label: 'Open tasks', value: '12' },
  { label: 'High priority', value: '3' },
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
          <Sparkles size={16} />
          Loading workspace
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
  return (
    <header className="public-header">
      <Link className="brand-mark" to="/" aria-label="TaskFlow home">
        <ClipboardList size={20} />
      </Link>
      <nav className="public-nav">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink key={link.to} to={link.to} end={link.exact} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <Icon size={16} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="header-actions">
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
              Create account
              <ArrowRight size={16} />
            </Link>
          </>
        )}
      </div>
    </header>
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
          <p>Calm execution space</p>
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
          <h3>Build with confidence</h3>
          <p>Responsive components, Firebase auth, and MongoDB-backed tasks are all wired together.</p>
        </div>
        <Link className="ghost-button full" to="/services">
          Explore services
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
            <Badge tone="success">Productivity workspace</Badge>
            <h1>Elegant task management with a calm, human-made interface.</h1>
            <p>
              TaskFlow blends a premium dashboard aesthetic with practical planning tools. The design system is based on the reference
              image, then extended into a cohesive product for home, about, services, contact, auth, and dashboard pages.
            </p>
            <div className="hero-actions">
              <Link className="primary-button" to={session ? '/dashboard' : '/register'}>
                {session ? 'Open dashboard' : 'Start free'}
                <ArrowRight size={16} />
              </Link>
              <Link className="secondary-button" to="/about">
                See the system
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
                <Badge tone="neutral">Dashboard preview</Badge>
                <h2>Designed to feel composed, not assembled.</h2>
              </div>
              <button className="icon-button" type="button">
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="preview-stack">
              <div className="preview-card green-card">
                <span>Total projects</span>
                <strong>24</strong>
                <p>Increased from last month</p>
              </div>
              <div className="preview-card">
                <span>Running projects</span>
                <strong>12</strong>
                <p>Organized and in progress</p>
              </div>
              <div className="preview-card">
                <span>Pending projects</span>
                <strong>2</strong>
                <p>Waiting for review</p>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="content-grid three-up">
          {designPrinciples.map((item) => (
            <motion.article key={item.title} className="card-soft feature-card" variants={fadeUp} initial="hidden" animate="show">
              <div className="feature-icon">
                <Leaf size={18} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </motion.article>
          ))}
        </section>

        <section className="content-grid split-layout">
          <motion.article className="card-soft panel-card" variants={fadeUp} initial="hidden" animate="show">
            <div className="section-head">
              <div>
                <Badge tone="neutral">What ships</Badge>
                <h2>One design language across every page</h2>
              </div>
            </div>
            <div className="bullet-list">
              <div><CheckCircle2 size={18} /> Modern typography and hierarchy</div>
              <div><CheckCircle2 size={18} /> Rounded cards, subtle borders, soft shadows</div>
              <div><CheckCircle2 size={18} /> Responsive layouts for mobile and desktop</div>
              <div><CheckCircle2 size={18} /> Smooth hover and motion treatment</div>
            </div>
          </motion.article>

          <motion.article className="card-soft panel-card panel-dark" variants={fadeUp} initial="hidden" animate="show">
            <div className="section-head">
              <div>
                <Badge tone="info">Core workflow</Badge>
                <h2>Auth, tasks, filters, and profile pages</h2>
              </div>
            </div>
            <p>
              The homepage sets the tone, while dashboard and auth views reuse the same spacing, color system, and component language.
            </p>
            <Link className="primary-button" to="/dashboard">
              Explore the dashboard
              <ArrowRight size={16} />
            </Link>
          </motion.article>
        </section>
      </main>
    </div>
  );
}

function AboutPage({ session }) {
  return (
    <div className="page-shell marketing-shell">
      <SharedHeader session={session} />
      <main>
        <section className="page-hero card-soft">
          <Badge tone="success">About the system</Badge>
          <h1>Built from the reference image, extended into a full product identity.</h1>
          <p>
            We kept the warm neutral palette, the deep green accent, the rounded cards, and the spacious layout language. Then we
            refined the hierarchy, interactions, and responsive behavior so the entire site feels intentionally crafted.
          </p>
        </section>

        <section className="content-grid three-up">
          <motion.article className="card-soft stat-tile" variants={fadeUp} initial="hidden" animate="show">
            <Users size={18} />
            <h3>Human-centered spacing</h3>
            <p>Room to breathe on desktop and stacked polish on mobile.</p>
          </motion.article>
          <motion.article className="card-soft stat-tile" variants={fadeUp} initial="hidden" animate="show">
            <Sparkles size={18} />
            <h3>Subtle motion</h3>
            <p>Cards drift, buttons lift, and transitions stay restrained.</p>
          </motion.article>
          <motion.article className="card-soft stat-tile" variants={fadeUp} initial="hidden" animate="show">
            <ShieldCheck size={18} />
            <h3>Consistent system</h3>
            <p>Every page shares the same surface, radius, and typography rules.</p>
          </motion.article>
        </section>
      </main>
    </div>
  );
}

function ServicesPage({ session }) {
  return (
    <div className="page-shell marketing-shell">
      <SharedHeader session={session} />
      <main>
        <section className="page-hero card-soft">
          <Badge tone="info">Services</Badge>
          <h1>Product-grade capabilities wrapped in a premium interface.</h1>
          <p>These are the same app features presented as a design system and workflow toolkit.</p>
        </section>

        <section className="content-grid four-up">
          {serviceCards.map((service) => {
            const Icon = service.icon;
            return (
              <motion.article key={service.title} className="card-soft service-card" variants={fadeUp} initial="hidden" animate="show">
                <div className="feature-icon"><Icon size={18} /></div>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </motion.article>
            );
          })}
        </section>

        <section className="content-grid split-layout">
          <motion.article className="card-soft panel-card" variants={fadeUp} initial="hidden" animate="show">
            <Badge tone="neutral">Motion recipe</Badge>
            <h2>Hover lift, active states, animated modal entry, and staggered cards.</h2>
            <p>These patterns keep the product lively without becoming decorative clutter.</p>
          </motion.article>
          <motion.article className="card-soft panel-card" variants={fadeUp} initial="hidden" animate="show">
            <Badge tone="neutral">Responsive recipe</Badge>
            <h2>Desktop sidebar on large screens, stacked panels on mobile.</h2>
            <p>Layouts condense naturally while retaining readable hierarchy and touch-friendly controls.</p>
          </motion.article>
        </section>
      </main>
    </div>
  );
}

function ContactPage({ session, contactStatus, setContactStatus }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    setContactStatus('Message sent. We will get back to you shortly.');
  };

  return (
    <div className="page-shell marketing-shell">
      <SharedHeader session={session} />
      <main>
        <section className="page-hero card-soft">
          <Badge tone="warn">Contact</Badge>
          <h1>Need a polished app or a production-ready workflow?</h1>
          <p>Use the form or the direct channels below to start the next step.</p>
        </section>

        <section className="content-grid contact-grid">
          <motion.form className="card-soft form-card" variants={fadeUp} initial="hidden" animate="show" onSubmit={handleSubmit}>
            <div className="form-row two-up">
              <label>
                <span>Name</span>
                <input type="text" placeholder="Your name" />
              </label>
              <label>
                <span>Email</span>
                <input type="email" placeholder="you@example.com" />
              </label>
            </div>
            <label>
              <span>Message</span>
              <textarea rows="6" placeholder="Tell us what you want to build"></textarea>
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
    login: 'Sign in to manage tasks, review progress, and keep the board moving.',
    register: 'Start with a clean workspace and a design system that already feels cohesive.',
    forgot: 'We will send a reset email or simulate the flow in demo mode.',
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
          <Badge tone="success">TaskFlow identity</Badge>
          <h1>{titleMap[mode]}</h1>
          <p>{bodyMap[mode]}</p>
          <div className="auth-benefits">
            <div><ShieldCheck size={18} /><span>Secure auth</span></div>
            <div><Sparkles size={18} /><span>Responsive design</span></div>
            <div><HeartHandshake size={18} /><span>One visual language</span></div>
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
              <p className="auth-note">Demo mode is active. Account data lives in your browser until Firebase is configured.</p>
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
            <h1>Account and workspace summary</h1>
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
              {profileStats.map((item) => (
                <div key={item.label} className="metric-card slim">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="progress-pill">
              <span>Overall completion</span>
              <strong>{completion}%</strong>
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
            <Badge tone="info">Security</Badge>
            <h2>Login, register, logout, and reset password are all wired.</h2>
            <p>Profile is just a presentation layer on top of the same auth state and task data model.</p>
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
            <Badge tone="success">Dashboard</Badge>
            <h1>Plan, prioritize, and accomplish tasks with ease.</h1>
            <p>Task filtering and sorting are built into the board, with a premium visual system inspired by the reference image.</p>
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
              <Badge tone="info">Focus rail</Badge>
              <h2>{taskCounts.filtered} shown of {taskCounts.total}</h2>
              <p>Filtered count updates instantly with your search, status chips, and sort selection.</p>
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
              <Badge tone="success">Reminder</Badge>
              <h3>Review pending items before the day ends.</h3>
              <ul>
                <li>Check high priority tasks</li>
                <li>Move in-progress cards forward</li>
                <li>Close completed items</li>
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
        <Sparkles size={24} />
      </div>
      <h3>{filtersActive ? 'No tasks match the current filters.' : 'Your board is clear.'}</h3>
      <p>{filtersActive ? 'Broaden the filter set or clear the search field to reveal cards.' : 'Create the first task to give the board a pulse.'}</p>
      <div className="empty-actions">
        <button className="primary-button" type="button" onClick={onCreate}><Plus size={16} /> New task</button>
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

function AuthShellHero() {
  return (
    <div className="auth-lattice">
      <div className="auth-ring auth-ring-a" />
      <div className="auth-ring auth-ring-b" />
      <div className="auth-preview card-soft">
        <Badge tone="success">Product ecosystem</Badge>
        <h3>Shared typography, color, spacing, and motion across every page.</h3>
        <div className="auth-preview-list">
          <div><Users size={16} /> Registration and login</div>
          <div><ClipboardList size={16} /> Task CRUD and filters</div>
          <div><LayoutDashboard size={16} /> Home, dashboard, and profile pages</div>
        </div>
      </div>
    </div>
  );
}

function AuthTabs({ mode }) {
  return (
    <div className="auth-tabs">
      <Link to="/login" className={mode === 'login' ? 'auth-tab active' : 'auth-tab'}>Login</Link>
      <Link to="/register" className={mode === 'register' ? 'auth-tab active' : 'auth-tab'}>Register</Link>
      <Link to="/forgot-password" className={mode === 'forgot' ? 'auth-tab active' : 'auth-tab'}>Forgot</Link>
    </div>
  );
}

export default App;
