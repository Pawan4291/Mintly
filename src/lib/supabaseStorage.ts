import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function uploadImage(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
  const { error } = await supabase.storage
    .from('nft-images')
    .upload(fileName, buffer, { contentType, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('nft-images').getPublicUrl(fileName);
  return data.publicUrl;
}