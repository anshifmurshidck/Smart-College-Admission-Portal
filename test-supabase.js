import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://evskpbbqojkclyyjvpjr.supabase.co';
const supabaseAnonKey = 'sb_publishable_6cV57fiEzgN8GVbr-m3B9w_S6i6SuXs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing Supabase connection...');
  
  // 1. Try to list buckets (might fail due to RLS, but let's see the error)
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    console.error('Error listing buckets (expected if no policy):', bucketsError.message);
  } else {
    console.log('Buckets:', buckets.map(b => b.name));
  }

  // 2. Try a dummy upload to 'documents' bucket
  console.log('Attempting dummy upload to documents bucket...');
  const { data, error } = await supabase.storage.from('documents').upload('test.txt', 'hello world', {
    upsert: true
  });
  
  if (error) {
    console.error('Upload Error:', error);
  } else {
    console.log('Upload Success:', data);
  }
}

test();
