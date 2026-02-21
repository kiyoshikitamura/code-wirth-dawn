
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Only use this in server-side logic (API routes, etc.)
export const supabaseService = createClient(supabaseUrl, supabaseKey);
