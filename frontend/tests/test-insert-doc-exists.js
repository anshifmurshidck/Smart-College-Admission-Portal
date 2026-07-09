import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evskpbbqojkclyyjvpjr.supabase.co';
const supabaseAnonKey = 'sb_publishable_6cV57fiEzgN8GVbr-m3B9w_S6i6SuXs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsertDoc() {
  const appId = 'APP-2026-5004'; // We know this application exists from our previous test-insert-app.js run
  console.log('Inserting test document for existing app:', appId);
  const { data, error } = await supabase.from('documents').insert([
    { 
      application_id: appId, 
      document_type: '10th Marksheet', 
      file_path: 'https://evskpbbqojkclyyjvpjr.supabase.co/storage/v1/object/public/documents/APP-2026-5004/marksheet10.png' 
    }
  ]).select('*');

  if (error) {
    console.error('Insert Doc Error:', error.message, error.details);
  } else {
    console.log('Insert Doc Success:', data);
  }
}

testInsertDoc();
