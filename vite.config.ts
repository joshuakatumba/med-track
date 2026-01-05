import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    define: {
      __firebase_config: JSON.stringify(JSON.stringify({
        apiKey: env.VITE_FIREBASE_API_KEY,
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: env.VITE_FIREBASE_APP_ID
      })),
      __app_id: JSON.stringify("muzeeyi-app"),
      __initial_auth_token: "undefined",
      __supabase_config: JSON.stringify(JSON.stringify({
        url: env.VITE_SUPABASE_URL,
        key: env.VITE_SUPABASE_ANON_KEY
      }))
    }
  }
})
