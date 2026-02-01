import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Validate environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Create Supabase client with service role key for backend operations
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create Supabase client with anon key for client-side operations
export const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          // Increase timeout to 30 seconds
          signal: AbortSignal.timeout(30000)
        });
      }
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
);

console.log('✅ Supabase client initialized');
