import { createClient } from '@supabase/supabase-js';

// Use runtime config (window.ENV) if available, otherwise fall back to build-time env
const getEnvVar = (key) => {
  // Check runtime config first (production)
  if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }
  // Fall back to build-time env (development)
  return import.meta.env[key];
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL')?.replace(/\/$/, '') || '';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_ID') || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing!');
  console.error('Please check:');
  console.error('1. Development: Ensure .env file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_ID');
  console.error('2. Production: Ensure Docker container has environment variables set');
  console.error('3. Check that /env-config.js is accessible and contains values');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
