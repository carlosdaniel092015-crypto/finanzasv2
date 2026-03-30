import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key) => {
  const variants = [key, key.replace('VITE_', 'REACT_APP_')];
  if (typeof window !== 'undefined' && window.ENV) {
    for (const variant of variants) {
      if (window.ENV[variant]) return window.ENV[variant];
    }
  }
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
  db: { schema: 'finanzas' },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
