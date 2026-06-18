import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);
const demoUsersKey = 'taskflow-demo-users';
const demoSessionKey = 'taskflow-demo-session';

function readDemoUsers() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem(demoUsersKey) || '[]');
  } catch {
    return [];
  }
}

function writeDemoUsers(users) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(demoUsersKey, JSON.stringify(users));
}

function readDemoSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return JSON.parse(window.localStorage.getItem(demoSessionKey) || 'null');
  } catch {
    return null;
  }
}

function writeDemoSession(session) {
  if (typeof window === 'undefined') {
    return;
  }

  if (session) {
    window.localStorage.setItem(demoSessionKey, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(demoSessionKey);
  }
}

function normalizeDemoUser(user) {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email.split('@')[0],
    demo: true,
    getIdToken: async () => `demo:${user.uid}:${encodeURIComponent(user.email)}`,
  };
}

function normalizeFirebaseUser(user) {
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Operator',
    demo: false,
    getIdToken: async () => user.getIdToken(),
  };
}

let firebaseAuth = null;

if (hasFirebaseConfig) {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  firebaseAuth = getAuth(app);
}

export const authService = {
  hasFirebaseConfig,
  subscribe(callback) {
    if (firebaseAuth) {
      return onAuthStateChanged(firebaseAuth, (user) => {
        callback(user ? normalizeFirebaseUser(user) : null);
      });
    }

    const currentSession = readDemoSession();
    callback(currentSession ? normalizeDemoUser(currentSession) : null);

    const handleStorage = () => {
      const nextSession = readDemoSession();
      callback(nextSession ? normalizeDemoUser(nextSession) : null);
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  },
  async register({ email, password, displayName }) {
    if (firebaseAuth) {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      return normalizeFirebaseUser(credential.user);
    }

    const users = readDemoUsers();

    if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with that email already exists.');
    }

    const user = {
      uid: crypto.randomUUID(),
      email,
      password,
      displayName: displayName || email.split('@')[0],
    };

    users.push(user);
    writeDemoUsers(users);
    writeDemoSession(user);
    return normalizeDemoUser(user);
  },
  async login({ email, password }) {
    if (firebaseAuth) {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      return normalizeFirebaseUser(credential.user);
    }

    const user = readDemoUsers().find(
      (entry) => entry.email.toLowerCase() === email.toLowerCase() && entry.password === password,
    );

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    writeDemoSession(user);
    return normalizeDemoUser(user);
  },
  async logout() {
    if (firebaseAuth) {
      await signOut(firebaseAuth);
      return;
    }

    writeDemoSession(null);
  },
};