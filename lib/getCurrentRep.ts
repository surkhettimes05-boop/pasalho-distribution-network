import { verifyToken } from './auth';

export function getCurrentRepFromAuthHeader(request: Request) {
  try {
    const auth = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!auth) return null;
    const parts = auth.split(' ');
    if (parts.length !== 2) return null;
    const token = parts[1];
    const payload = verifyToken(token);
    return payload;
  } catch (err) {
    return null;
  }
}
