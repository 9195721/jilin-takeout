import COS from 'cos-js-sdk-v5';

const cos = new COS({
  SecretId: process.env.COS_SECRET_ID || '',
  SecretKey: process.env.COS_SECRET_KEY || '',
});

const Bucket = 'lee2111-1419902782';
const Region = 'ap-beijing';

export const uploadImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop() || 'jpg';
    const key = `images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    cos.putObject(
      {
        Bucket,
        Region,
        Key: key,
        Body: file,
        ContentType: file.type,
      },
      (err, data) => {
        if (err) {
          reject(new Error('图片上传失败: ' + err.message));
          return;
        }
        resolve(`https://${Bucket}.cos.${Region}.myqcloud.com/${key}`);
      }
    );
  });
};

export const uploadImages = async (files: File[]): Promise<string[]> => {
  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadImage(file);
    urls.push(url);
  }
  return urls;
};
