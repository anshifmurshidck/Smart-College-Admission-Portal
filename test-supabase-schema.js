import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evskpbbqojkclyyjvpjr.supabase.co';
const supabaseAnonKey = 'sb_publishable_6cV57fiEzgN8GVbr-m3B9w_S6i6SuXs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      id, 
      full_name, 
      email, 
      status,
      assigned_student_id,
      department:departments(name, code),
      status_history(comments, status)
    `);
  if (error) {
    console.error('Error returned by Supabase:', error);
  } else {
    console.log('Query succeeded, fetched records count:', data.length);
  }
}

test();
