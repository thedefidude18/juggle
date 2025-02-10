import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-client-info': 'bantah@1.0.0'
    }
  },
  db: {
    schema: 'public'
  }
});

// Add connection health check with retry logic
let isConnected = true;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    isConnected = false;
  } else if (event === 'SIGNED_IN') {
    isConnected = true;
    retryCount = 0;
  }
});

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const checkConnection = async () => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      throw error;
    }
    isConnected = true;
    retryCount = 0;
    return true;
  } catch (error) {
    console.error('Connection check failed:', error);
    isConnected = false;

    // Implement retry logic
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      await wait(RETRY_DELAY * retryCount);
      return checkConnection();
    }

    return false;
  }
};

export const getConnectionStatus = () => isConnected;

// Add retry wrapper for Supabase operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES
): Promise<T> => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await operation();
      retryCount = 0; // Reset retry count on success
      return result;
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${i + 1} failed:`, error);
      
      if (i < maxRetries - 1) {
        await wait(RETRY_DELAY * (i + 1));
      }
    }
  }

  throw lastError;
};