import jwt, { SignOptions, JwtPayload, Secret } from 'jsonwebtoken';
import { UnauthorizedException } from './exceptions';

export interface AccessTokenPayload extends JwtPayload {
  sub: string; // user id
  email: string;
  role: 'admin' | 'instructor' | 'student';
  name: string;
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  jti: string; // refresh token id (matches DB row)
}

export interface JwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpires: string;
  refreshExpires: string;
  issuer?: string;
}

export function loadJwtConfig(): JwtConfig {
  const accessSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!accessSecret || !refreshSecret) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET environment variables are required');
  }
  return {
    accessSecret,
    refreshSecret,
    accessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
    issuer: process.env.JWT_ISSUER ?? 'aaft-lms',
  };
}

export function signAccessToken(
  payload: Omit<AccessTokenPayload, 'iat' | 'exp' | 'iss'>,
  cfg: JwtConfig = loadJwtConfig(),
): string {
  const opts: SignOptions = {
    expiresIn: cfg.accessExpires as SignOptions['expiresIn'],
    issuer: cfg.issuer,
  };
  return jwt.sign(payload, cfg.accessSecret as Secret, opts);
}

export function signRefreshToken(
  payload: Omit<RefreshTokenPayload, 'iat' | 'exp' | 'iss'>,
  cfg: JwtConfig = loadJwtConfig(),
): string {
  const opts: SignOptions = {
    expiresIn: cfg.refreshExpires as SignOptions['expiresIn'],
    issuer: cfg.issuer,
  };
  return jwt.sign(payload, cfg.refreshSecret as Secret, opts);
}

export function verifyAccessToken(
  token: string,
  cfg: JwtConfig = loadJwtConfig(),
): AccessTokenPayload {
  try {
    return jwt.verify(token, cfg.accessSecret, { issuer: cfg.issuer }) as AccessTokenPayload;
  } catch {
    throw new UnauthorizedException('Invalid or expired access token');
  }
}

export function verifyRefreshToken(
  token: string,
  cfg: JwtConfig = loadJwtConfig(),
): RefreshTokenPayload {
  try {
    return jwt.verify(token, cfg.refreshSecret, { issuer: cfg.issuer }) as RefreshTokenPayload;
  } catch {
    throw new UnauthorizedException('Invalid or expired refresh token');
  }
}
