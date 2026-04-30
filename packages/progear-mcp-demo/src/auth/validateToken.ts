import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import type { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

const jwks = createRemoteJWKSet(new URL(`${config.oktaIssuer}/v1/keys`));

export interface AuthContext {
  sub: string;
  scopes: string[];
  raw: JWTPayload;
}

declare module 'express-serve-static-core' {
  interface Request {
    demoAuth?: AuthContext;
  }
}

const extractScopes = (payload: JWTPayload): string[] => {
  const scp = (payload as Record<string, unknown>).scp;
  if (Array.isArray(scp)) return scp.filter((s): s is string => typeof s === 'string');
  const scope = (payload as Record<string, unknown>).scope;
  if (typeof scope === 'string') return scope.split(/\s+/).filter(Boolean);
  return [];
};

export const validateToken = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing_authorization_header' });
  }

  const token = header.slice('Bearer '.length);

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: config.oktaIssuer,
      audience: config.oktaAudience,
    });

    req.demoAuth = {
      sub: String(payload.sub || 'unknown'),
      scopes: extractScopes(payload),
      raw: payload,
    };
    next();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'verification_failed';
    return res.status(401).json({ error: 'invalid_token', detail: msg });
  }
};
