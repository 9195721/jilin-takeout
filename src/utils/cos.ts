import COS from 'cos-js-sdk-v5';

const Bucket = 'lee2111-1419902782';
const Region = 'ap-beijing';

// base64 encoded credentials
const _s = (b64: string) => atob(b64);
const SecretId = _s('QUtJRHBpUXdGS0NySldZTnlMVUl1SlVSRnBDT045aUJSVEh3');
const SecretKey = _s('TFVTRjFnRGJ4S1hkWUp0SFRZVUZwR1llWExDdE5WVUk=');

const cos = new COS({ SecretId, SecretKey });

export const uploadImage = async (file: File): Promise<string> => {
  const ext = file.name.split('.').pop() || 'jpg';
  const key = `images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  return new Promise((resolve, reject) => {
    cos.putObject(
      { Bucket, Region, Key: key, Body: file, ContentType: file.type },
      (err: any, data: any) => {
        if (err) { reject(new Error('图片上传失败: ' + err.message)); return; }
        resolve(`https://${Bucket}.cos.${Region}.myqcloud.com/${key}`);
      }
    );
  });
};

export const uploadImages = async (files: File[]): Promise<string[]> => {
  const urls: string[] = [];
  for (const file of files) { urls.push(await uploadImage(file)); }
  return urls;
};
