const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ymdbrndajkwatdfqmagx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZGJybmRhamt3YXRkZnFtYWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY1NDA5ODcsImV4cCI6MjA0MjExNjk4N30.m4bmL3EzfvnPhEGyUp75nvVtc3Ptnie7OCzuhUtuwoU'; // Paste the copied anon_key here

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = supabase