
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://sohojvlvvhshsxdrhexr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvaG9qdmx2dmhzaHN4ZHJoZXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MDA5MjgsImV4cCI6MjA1NzI3NjkyOH0.7F1A9DdJ7Qoio-waMD3sYE-iy4PqSGnIGgn49IIa2ag";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
