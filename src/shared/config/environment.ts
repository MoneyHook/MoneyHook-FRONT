import { z } from 'zod'

const optionalUrl = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().url().optional(),
)

const environmentSchema = z.object({
  VITE_API_BASE_URL: z.string().url().transform((value) => value.replace(/\/$/, '')),
  VITE_FIREBASE_API_KEY: z.string().min(1),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1),
  VITE_FIREBASE_APP_ID: z.string().min(1),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  VITE_FIREBASE_AUTH_EMULATOR_URL: optionalUrl,
})

export type Environment = {
  apiBaseUrl: string
  firebase: {
    apiKey: string
    authDomain: string
    projectId: string
    appId: string
    storageBucket?: string
    messagingSenderId?: string
    authEmulatorUrl?: string
  }
}

export class EnvironmentConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EnvironmentConfigurationError'
  }
}

let cachedEnvironment: Environment | undefined

export function getEnvironment(): Environment {
  if (cachedEnvironment) {
    return cachedEnvironment
  }

  const result = environmentSchema.safeParse(import.meta.env)
  if (!result.success) {
    const missingKeys = result.error.issues
      .map((issue) => issue.path.join('.'))
      .filter(Boolean)
      .join(', ')

    throw new EnvironmentConfigurationError(
      `環境設定を確認してください: ${missingKeys || 'Vite environment variables'}`,
    )
  }

  cachedEnvironment = {
    apiBaseUrl: result.data.VITE_API_BASE_URL,
    firebase: {
      apiKey: result.data.VITE_FIREBASE_API_KEY,
      authDomain: result.data.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: result.data.VITE_FIREBASE_PROJECT_ID,
      appId: result.data.VITE_FIREBASE_APP_ID,
      storageBucket: result.data.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: result.data.VITE_FIREBASE_MESSAGING_SENDER_ID,
      authEmulatorUrl: result.data.VITE_FIREBASE_AUTH_EMULATOR_URL,
    },
  }

  return cachedEnvironment
}
