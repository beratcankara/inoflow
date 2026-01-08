import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const taskId = form.get('taskId');
    if (!taskId || typeof taskId !== 'string') {
      return NextResponse.json({ error: 'taskId gerekli' }, { status: 400 });
    }

    const files = form.getAll('files');
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Yüklenecek dosya yok' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const uploaded: Array<{ name: string; url?: string }> = [];

    for (const f of files) {
      if (!(f instanceof File)) continue;
      const file = f as File;
      const ext = file.name.split('.').pop() || 'bin';
      const key = `${taskId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const arrayBuffer = await file.arrayBuffer();
      const { error: uploadErr } = await supabase.storage
        .from('attachments')
        .upload(key, new Uint8Array(arrayBuffer), { contentType: file.type, upsert: false });
      if (uploadErr) {
        console.error('upload error', uploadErr);
        return NextResponse.json({ error: 'Upload başarısız' }, { status: 500 });
      }

      // Public URL
      const { data: pub } = supabase.storage.from('attachments').getPublicUrl(key);
      const publicUrl = pub?.publicUrl || null;

      // DB kaydı
      const { error: dbErr } = await supabase
        .from('task_attachments')
        .insert({
          task_id: taskId,
          file_name: file.name,
          mime_type: file.type || 'application/octet-stream',
          size_bytes: file.size,
          storage_path: key,
          public_url: publicUrl,
        });
      if (dbErr) {
        console.error('db insert error', dbErr);
      }

      uploaded.push({ name: file.name, url: publicUrl || undefined });
    }

    return NextResponse.json({ ok: true, files: uploaded });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Beklenmeyen hata' }, { status: 500 });
  }
}


