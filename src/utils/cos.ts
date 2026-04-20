import { supabase } from '../supabase/client';

export const uploadImage = async (file: File): Promise<string> => {
  // 读取文件为 base64
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  // 调用 Edge Function 上传
  const { data, error } = await supabase.functions.invoke('upload-image', {
    body: {
      image: base64,
      filename: file.name,
    },
  });

  if (error) {
    throw new Error(error.message || '上传失败');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data.url;
};

export const uploadImages = async (files: File[]): Promise<string[]> => {
  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadImage(file);
    urls.push(url);
  }
  return urls;
};
