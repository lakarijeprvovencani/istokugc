/**
 * Klijentski helper za upload portfolio fajlova.
 *
 * Fajl ide DIREKTNO iz browsera u Supabase Storage preko signed upload
 * tokena, zaobilazeci Vercel-ov 4.5MB limit na serverless request body.
 * Supabase Storage ima CORS prepodesen, pa browser upload radi bez
 * dodatne konfiguracije.
 *
 * Flow:
 *  1. POST /api/upload/portfolio/presign -> { bucket, path, token, publicUrl }
 *  2. supabase.storage.from(bucket).uploadToSignedUrl(path, token, file)
 *  3. vrati publicUrl
 */
import { createClient } from '@/lib/supabase/client';

export interface UploadedPortfolioFile {
  url: string;
  isVideo: boolean;
}

/**
 * Sigurno parsira fetch Response kao JSON. Ako server vrati ne-JSON
 * (npr. "Request Entity Too Large" plain text), vraca jasnu gresku
 * umesto "Unexpected token" crash-a.
 */
export async function safeJson(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    if (response.status === 413) {
      return { error: 'Fajl je prevelik za upload.' };
    }
    return { error: `Neočekivan odgovor servera (${response.status}). Pokušajte ponovo.` };
  }
}

export async function uploadPortfolioFileToR2(
  file: File,
  creatorId: string
): Promise<UploadedPortfolioFile> {
  // 1. Trazi signed upload token od naseg servera
  const presignRes = await fetch('/api/upload/portfolio/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creatorId,
      contentType: file.type,
      fileName: file.name,
      fileSize: file.size,
    }),
  });

  const presignData = await safeJson(presignRes);
  if (!presignRes.ok) {
    throw new Error(presignData.error || 'Greška pri pripremi uploada');
  }

  // 2. Upload direktno u Supabase Storage (browser -> Supabase, bez Vercel limita)
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(presignData.bucket)
    .uploadToSignedUrl(presignData.path, presignData.token, file, {
      contentType: file.type,
    });

  if (error) {
    throw new Error('Upload fajla nije uspeo. Proverite internet konekciju i pokušajte ponovo.');
  }

  return {
    url: presignData.publicUrl,
    isVideo: !!presignData.isVideo,
  };
}
