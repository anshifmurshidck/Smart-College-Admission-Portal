import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evskpbbqojkclyyjvpjr.supabase.co';
const supabaseAnonKey = 'sb_publishable_6cV57fiEzgN8GVbr-m3B9w_S6i6SuXs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testListRoot() {
  console.log('Listing root of documents bucket...');
  const { data, error } = await supabase.storage.from('documents').list();
  if (error) {
    console.error('List Error:', error.message);
  } else {
    console.log('Files/folders in root:', data);
  }
}

testListRoot();
