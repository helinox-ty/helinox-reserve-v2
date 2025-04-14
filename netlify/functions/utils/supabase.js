const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nvnbrlgfsqwnjpxaunuh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52bmJybGdmc3F3bmpweGF1bnVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1OTA1MjQsImV4cCI6MjA2MDE2NjUyNH0.nP4YSKvolsBau-iMxQvmAqxzYR83luAhFqtHekodmac'
);

module.exports = supabase; 