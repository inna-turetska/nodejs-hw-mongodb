import createHttpError from 'http-errors';
import { sessionsCollection } from '../db/models/sessions.js';
import { UsersCollection } from '../db/models/users.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.get('Authorization');

  if (!authHeader) {
    next(createHttpError(401, 'Please provide Authorization header'));
    return;
  }
  const [bearer, token] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !token) {
    next(createHttpError(401, 'Auth header should be of type Bearer'));
    return;
  }
  const session = await sessionsCollection.findOne({ accessToken: token });
  if (!session) {
    next(createHttpError(401, 'Session not found'));
    return;
  }
  const isTokenExpired = new Date() > new Date(session.accessTokenValidUntil);
  if (isTokenExpired) {
    next(createHttpError(401, 'Access token expired'));
  }

  const user = await UsersCollection.findById(session.userId);
  if (!user) {
    next(createHttpError(401));
    return;
  }
  req.user = user;
  next();
};
