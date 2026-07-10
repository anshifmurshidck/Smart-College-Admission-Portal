import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evskpbbqojkclyyjvpjr.supabase.co';
const supabaseAnonKey = 'sb_publishable_6cV57fiEzgN8GVbr-m3B9w_S6i6SuXs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFolderUpload() {
  const appId = 'APP-2026-4231';
  console.log(`Uploading test.txt to ${appId}/test.txt ...`);
  const { data, error } = await supabase.storage.from('documents').upload(`${appId}/test.txt`, 'hello world', {
    upsert: true
  });
  if (error) {
    console.error('Upload Error:', error);
  } else {
    console.log('Upload Success:', data);
  }
}

testFolderUpload();
