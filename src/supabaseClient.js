import { createClient } from '@supabase/supabase-js';

// Use runtime config (window.ENV) if available, otherwise fall back to build-time env
const getEnvVar = (key) => {
  // Common prefixes to check: VITE_ (Standard), REACT_APP_ (Easypanel default)
  const variants = [key, key.replace('VITE_', 'REACT_APP_')];

  // 1. Check runtime config first (production)
  if (typeof window !== 'undefined' && window.ENV) {
    for (const variant of variants) {
      if (window.ENV[variant]) return window.ENV[variant];
    }
  }

  // 2. Fall back to build-time env (development)
  if (import.meta.env) {
    for (const variant of variants) {
      if (import.meta.env[variant]) return import.meta.env[variant];
    }
  }

  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL')?.replace(/\/$/, '') || '';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_ID') || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing!');
  console.warn('URL:', supabaseUrl ? 'Found' : 'Missing');
  console.warn('Key:', supabaseAnonKey ? 'Found' : 'Missing');
  console.info('Check if environment variables VITE_SUPABASE_URL/ID or REACT_APP_SUPABASE_URL/ID are set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
