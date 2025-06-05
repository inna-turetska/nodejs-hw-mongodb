import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import handlebars from 'handlebars';
import path from 'node:path';
import fs from 'node:fs/promises';
import createHttpError from 'http-errors';
import { SMTP, TEMPLATES_DIR } from '../constans/index.js';
import { getEnvVar } from '../utils/getEnvVar.js';
import { sendEmail } from '../utils/sendEmail.js';
import { UsersCollection } from '../db/models/users.js';
import { FIFTEEN_MINUTES, THIRTY_DAYS } from '../constans/index.js';
import { sessionsCollection } from '../db/models/sessions.js';

export const registerUser = async (payload) => {
  const user = await UsersCollection.findOne({ email: payload.email });
  if (user) throw createHttpError(409, 'Email in use');

  const encryptedPassword = await bcrypt.hash(payload.password, 10);
  return await UsersCollection.create({
    ...payload,
    password: encryptedPassword,
  });
};

export const logInUser = async (payload) => {
  const user = await UsersCollection.findOne({ email: payload.email });
  if (!user) {
    throw createHttpError(401, 'User not found');
  }
  const isEqual = await bcrypt.compare(payload.password, user.password);
  if (!isEqual) {
    throw createHttpError(401, 'Unauthorized');
  }

  await sessionsCollection.deleteOne({ userId: user._id });

  const accessToken = randomBytes(30).toString('base64');
  const refreshToken = randomBytes(30).toString('base64');

  return await sessionsCollection.create({
    userId: user._id,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + THIRTY_DAYS),
  });
};

const createSession = () => {
  const accessToken = randomBytes(30).toString('base64');
  const refreshToken = randomBytes(30).toString('base64');

  return {
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + THIRTY_DAYS),
  };
};
export const refreshUserSession = async ({ sessionId, refreshToken }) => {
  const session = await sessionsCollection.findOne({
    _id: sessionId,
    refreshToken,
  });
  if (!session) {
    throw createHttpError(401, 'Session not found');
  }
  const isSessionTokenExpired =
    new Date() > new Date(session.refreshTokenValidUntil);
  if (isSessionTokenExpired) {
    throw createHttpError(401, 'Session token expired');
  }
  const newSession = createSession();

  await sessionsCollection.deleteOne({ _id: sessionId, refreshToken });
  return await sessionsCollection.create({
    userId: session.userId,
    ...newSession,
  });
};

export const logOutUser = async (sessionId) => {
  await sessionsCollection.deleteOne({ _id: sessionId });
};

export const requestResetToken = async (email) => {
  const user = await UsersCollection.findOne({ email });
  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  const jwtSecret = await getEnvVar('JWT_SECRET');
  const resetToken = jwt.sign(
    {
      sub: user.id,
      email,
    },
    jwtSecret,
    { expiresIn: '15m' },
  );

  const appDomain = await getEnvVar('APP_DOMAIN');
  const smtpFrom = await getEnvVar(SMTP.SMTP_FROM);

  const resetPasswordTemplatesPath = path.join(
    TEMPLATES_DIR,
    'reset-password-email.html',
  );

  const templateSource = (
    await fs.readFile(resetPasswordTemplatesPath)
  ).toString();

  const template = handlebars.compile(templateSource);

  const html = template({
    name: user.name,
    link: `${appDomain}/reset-password?token=${resetToken}`,
  });

  await sendEmail({
    from: smtpFrom,
    to: email,
    subject: 'Reset your password',
    html,
  }).catch(() => {
    throw createHttpError(
      500,
      'Failed to send the email, please try again later.',
    );
  });
};

export const resetPassword = async (payload) => {
  let entries;

  try {
    entries = jwt.verify(payload.token, getEnvVar('JWT_SECRET'));
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError)
      throw createHttpError(401, 'Token is expired or invalid.');
    throw err;
  }

  const user = await UsersCollection.findOne({
    email: entries.email,
    _id: entries.sub,
  });

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  const encryptedPassword = await bcrypt.hash(payload.password, 10);

  await UsersCollection.updateOne(
    { _id: user._id },
    { password: encryptedPassword },
  );
};
