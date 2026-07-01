import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evskpbbqojkclyyjvpjr.supabase.co';
const supabaseAnonKey = 'sb_publishable_6cV57fiEzgN8GVbr-m3B9w_S6i6SuXs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function trackApp(id) {
  try {
    const { data: appData, error: appError } = await supabase
      .from('applications')
      .select(`
        full_name,
        status,
        assigned_student_id,
        created_at,
        department:departments(name, code)
      `)
      .eq('id', id)
      .single();

    if (appError) {
      console.log('App Error:', appError);
      return;
    }
    
    console.log('App Data:', appData);
  } catch (err) {
    console.log('Catch Block Error:', err);
  }
}

trackApp('APP-2026-5500');
