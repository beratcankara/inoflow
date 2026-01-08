import { createClient } from '@supabase/supabase-js';

// Ortam değişkenlerinde sonlarında yeni satır/boşluk kalmış olabilir (%0A hatası)
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseUrl = rawUrl.trim();
const supabaseKey = rawKey.trim();

// Supabase client - hem client hem server-side için
export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    // Görünürlük değişimlerinde tekrarlı yoğun yeniden bağlanmayı yumuşat
    heartbeatIntervalMs: 30_000,
    params: { eventsPerSecond: 2 },
  },
});
