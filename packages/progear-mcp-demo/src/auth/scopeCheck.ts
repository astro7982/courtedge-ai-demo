export interface ScopeDenial {
  error: 'access_denied';
  reason: string;
  required_scopes: string[];
  missing_scopes: string[];
  granted_scopes: string[];
}

export const checkScopes = (required: readonly string[], granted: readonly string[]): ScopeDenial | null => {
  const missing = required.filter((s) => !granted.includes(s));
  if (missing.length === 0) return null;
  return {
    error: 'access_denied',
    reason: `Your token is missing required scope(s): ${missing.join(', ')}. Access to this tool requires all of: ${required.join(', ')}.`,
    required_scopes: [...required],
    missing_scopes: missing,
    granted_scopes: [...granted],
  };
};
