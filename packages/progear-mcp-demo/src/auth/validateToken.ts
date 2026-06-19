import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { config } from '../config.js';

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

// RFC 9728: point unauthenticated callers at this server's protected-resource metadata
// so an Okta Agent Gateway / MCP client can discover the authorization server.
const wwwAuthenticate = (req: Request): string =>
  `Bearer resource_metadata="https://${req.get('host')}/.well-known/oauth-protected-resource${req.originalUrl.split('?')[0]}"`;

// Build a token-validation middleware bound to a specific authorization server
// (issuer + audience). Each per-domain endpoint gets its own validator so the
// Bridge can broker a distinct ID-JAG token per domain/resource.
export const makeValidateToken = (opts: { issuer: string; audience: string }): RequestHandler => {
  const jwks = createRemoteJWKSet(new URL(`${opts.issuer}/v1/keys`));
  return async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      res.set('WWW-Authenticate', wwwAuthenticate(req));
      return res.status(401).json({ error: 'missing_authorization_header' });
    }

    const token = header.slice('Bearer '.length);

    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: opts.issuer,
        audience: opts.audience,
      });

      req.demoAuth = {
        sub: String(payload.sub || 'unknown'),
        scopes: extractScopes(payload),
        raw: payload,
      };
      next();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'verification_failed';
      res.set('WWW-Authenticate', wwwAuthenticate(req));
      return res.status(401).json({ error: 'invalid_token', detail: msg });
    }
  };
};

// Default validator bound to the consolidated JC AS (used by /mcp).
export const validateToken = makeValidateToken({
  issuer: config.oktaIssuer,
  audience: config.oktaAudience,
});
