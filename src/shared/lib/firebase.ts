import { getApp, getApps, initializeApp } from 'firebase/app'
import {
  connectAuthEmulator,
  getAuth,
  type Auth,
} from 'firebase/auth'

import { getEnvironment } from '@/shared/config/environment'

let authInstance: Auth | undefined
let emulatorConnected = false

export function getFirebaseAuth(): Auth {
  if (authInstance) {
    return authInstance
  }

  const { firebase } = getEnvironment()
  const firebaseOptions = {
    apiKey: firebase.apiKey,
    authDomain: firebase.authDomain,
    projectId: firebase.projectId,
    appId: firebase.appId,
    ...(firebase.storageBucket ? { storageBucket: firebase.storageBucket } : {}),
    ...(firebase.messagingSenderId ? { messagingSenderId: firebase.messagingSenderId } : {}),
  }
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseOptions)
  authInstance = getAuth(app)

  if (firebase.authEmulatorUrl && !emulatorConnected) {
    connectAuthEmulator(authInstance, firebase.authEmulatorUrl, {
      disableWarnings: true,
    })
    emulatorConnected = true
  }

  return authInstance
}
