import { request } from './request';

interface MenuImageUploadRequest {
  fileName: string;
  contentType: string;
  size: number;
}

interface MenuImageUploadResponse {
  uploadUrl: string;
  imageUrl: string;
}

export const createMenuImageUpload = (payload: MenuImageUploadRequest) => {
  return request<MenuImageUploadResponse>('/uploads/menu-image', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const uploadMenuImageFile = async (file: File) => {
  const { uploadUrl, imageUrl } = await createMenuImageUpload({
    fileName: file.name,
    contentType: file.type,
    size: file.size,
  });

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!res.ok) {
    throw new Error('Image upload failed');
  }

  return imageUrl;
};
