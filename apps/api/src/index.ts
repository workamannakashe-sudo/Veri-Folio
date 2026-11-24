import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { defaultKeyRegistry } from './modules/seal/keys';
import { authRouter } from './routes/auth.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { entriesRouter } from './routes/entries.routes';
import { adminRouter } from './routes/admin.routes';
import { skillsRouter } from './routes/skills.routes';
import { verificationsRouter } from './routes/verifications.routes';
import { checkRouter } from './routes/check.routes';
import { viewerRouter } from './routes/viewer.routes';
import { consentRouter } from './routes/consent.routes';

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Public health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api' });
});

// Well-known public keys for Ed25519 seal verification
app.get('/.well-known/verifolio-keys.json', (_req, res) => {
  res.json(defaultKeyRegistry.getWellKnownKeys());
});

// Routes
app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);
app.use('/entries', entriesRouter);
app.use('/admin', adminRouter);
app.use('/skills', skillsRouter);
app.use('/verifications', verificationsRouter);
app.use('/check', checkRouter);
app.use('/viewer', viewerRouter);
app.use('/consent', consentRouter);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, '0.0.0.0', () => {
    console.log(`VeriFolio API listening on port ${port}`);
  });
}

export default app;
