import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { uploadPhoto, photoUrl } from '../utils/cloudinary';

// Photo picker for a menu item. `value` is the saved image URL ('' when none); `emoji` is the fallback icon.
export default function ImageUpload({ value, onChange, emoji = '🍽️' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow choosing the same file again later
    if (!file) return;

    setError('');
    setUploading(true);
    try {
      onChange(await uploadPhoto(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <p className="label">Photo</p>
      <div className="flex items-center gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-3xl">
          {value ? <img src={photoUrl(value, 200)} alt="Menu item" className="size-full object-cover" /> : emoji}
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="btn btn-secondary btn-sm">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
              {uploading ? 'Uploading…' : value ? 'Replace photo' : 'Upload photo'}
            </button>
            {value && !uploading && (
              <button type="button" onClick={() => onChange('')} className="btn btn-ghost btn-sm !text-red-600 hover:!bg-red-50">
                <Trash2 size={14} /> Remove
              </button>
            )}
          </div>
          <p className="hint">JPG, PNG or WebP, up to 5 MB. Square photos look best.</p>
        </div>

        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" aria-label="Choose a photo" />
      </div>

      {error && <p role="alert" className="alert-error mt-3">{error}</p>}
    </div>
  );
}
