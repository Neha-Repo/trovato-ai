interface EnvironmentVariables {
  SUPABASE_URL?: string;
  SUPABASE_SECRET_KEY?: string;
  FIREBASE_SERVICE_ACCOUNT_PATH?: string;
  VIATOR_API_KEY?: string;
  VIATOR_API_BASE_URL?: string;
  PORT?: string;
  CORS_ORIGINS?: string;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const environment = config as EnvironmentVariables;

  const requiredVariables = [
    'SUPABASE_URL',
    'SUPABASE_SECRET_KEY',
    'FIREBASE_SERVICE_ACCOUNT_PATH',
    'VIATOR_API_KEY',
    'VIATOR_API_BASE_URL',
    'CORS_ORIGINS',
  ] as const;

  const missingVariables = requiredVariables.filter(
    (variable) => !environment[variable]?.trim(),
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(', ')}`,
    );
  }

  if (environment.PORT && !/^\d+$/.test(environment.PORT)) {
    throw new Error('PORT must be a valid number.');
  }

  return config;
}
