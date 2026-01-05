import { createClient } from '@supabase/supabase-js';

// Get config from global define
export const supabaseConfig = JSON.parse(__supabase_config);

export const supabase = createClient(supabaseConfig.url, supabaseConfig.key);

export const TABLE_NAME = 'patient_visits';
