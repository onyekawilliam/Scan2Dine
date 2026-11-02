import api from './api';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Uploads a photo straight from the browser to Cloudinary. The backend only hands out a short-lived
// signature, so the Cloudinary API secret never reaches the browser. Returns the final image URL.
export async function uploadPhoto(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Please choose a JPG, PNG or WebP photo.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('That photo is larger than 5 MB. Please choose a smaller one.');
  }

  let signed;
  try {
    const res = await api.get('/menu/upload-signature');
    signed = res.data.data;
  } catch (err) {
    throw new Error(err.response?.data?.error?.message || 'Could not start the upload. Please try again.');
  }

  const body = new FormData();
  body.append('file', file);
  ['api_key', 'timestamp', 'signature', 'folder', 'allowed_formats'].forEach((key) => body.append(key, signed[key]));

  let response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloud_name}/image/upload`, { method: 'POST', body });
  } catch {
    throw new Error('Could not reach the photo service. Check your connection and try again.');
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || 'The photo could not be uploaded. Please try again.');
  }
  return result.secure_url;
}

// Cloudinary resizes and compresses on the fly: ask for a square crop at the size actually shown.
export const photoUrl = (url, size = 400) =>
  url && url.includes('/image/upload/')
    ? url.replace('/image/upload/', `/image/upload/c_fill,w_${size},h_${size},f_auto,q_auto/`)
    : url;
