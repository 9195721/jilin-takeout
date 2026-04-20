# 腾讯云 COS 配置

## 存储桶信息
- **Bucket 名称**: lee2111-1419902782
- **Region**: ap-beijing
- **APPID**: 1419902782

## 密钥信息
- **SecretId**: 见 Vercel 环境变量 COS_SECRET_ID
- **SecretKey**: 见 Vercel 环境变量 COS_SECRET_KEY

## 存储桶权限设置
1. 访问权限: 公有读私有写
2. CORS 配置:
   - 来源 Origin: `*`
   - 允许 Methods: PUT, POST, GET, HEAD
   - 允许 Headers: `*`
   - 暴露 Headers: ETag, x-cos-request-id
   - 超时时间: 3600

## 图片上传功能
- Edge Function: upload-image
- 上传路径: images/{timestamp}-{filename}
- 图片大小限制: 5MB
- 支持格式: jpg, jpeg, png, gif, webp
