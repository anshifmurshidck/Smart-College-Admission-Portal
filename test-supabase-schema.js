import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evskpbbqojkclyyjvpjr.supabase.co';
const supabaseAnonKey = 'sb_publishable_6cV57fiEzgN8GVbr-m3B9w_S6i6SuXs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('applications').select('*').limit(1);
  if (error) {
    console.error(error);
  } else {
    console.log(data.length > 0 ? Object.keys(data[0]) : 'No data');
  }
}

test();
