import dotenv from 'dotenv';
dotenv.config();
import admin from 'firebase-admin';

function hasFirebaseAdminConfig() {
  return (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
}
 if (hasFirebaseAdminConfig() && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

function parseDemoToken(token) {
  const [, uid = '', encodedEmail = ''] = token.split(':');

  if (!uid) {
    return null;
  }

  return {
    uid,
    email: encodedEmail ? decodeURIComponent(encodedEmail) : '',
    demo: true,
  };
}

export async function requireUser(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!token) {
    return res.status(401).json({ message: 'Missing authorization token.' });
  }

  if (token.startsWith('demo:')) {
    const session = parseDemoToken(token);

    if (!session) {
      return res.status(401).json({ message: 'Invalid demo session.' });
    }

    req.user = session;
    return next();
  }

  if (!hasFirebaseAdminConfig()) {
    return res.status(401).json({ message: 'Firebase Admin credentials are not configured.' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || '',
      demo: false,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired Firebase token.' });
  }
}