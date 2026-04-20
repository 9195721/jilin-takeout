const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// 生成 COS 签名
function getSignature(SecretId: string, SecretKey: string, method: string, pathname: string, query: string, headers: Record<string, string>) {
  const now = Math.floor(Date.now() / 1000);
  const expire = now + 3600;
  
  // 签名字段
  const qSignTime = `${now};${expire}`;
  const qKeyTime = `${now};${expire}`;
  
  // 构建签名串
  const httpMethod = method.toLowerCase();
  const headerList = Object.keys(headers).sort().join(';');
  const urlParamList = '';
  
  // 构建签名串
  const signString = [
    httpMethod,
    pathname,
    query,
    `q-header-list=${headerList}&q-url-param-list=${urlParamList}`,
    qSignTime,
  ].join('\n');
  
  return { qSignTime, qKeyTime, headerList, urlParamList, signString };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image, filename } = await req.json();
    
    if (!image || !filename) {
      return new Response(
        JSON.stringify({ error: 'Missing image or filename' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 腾讯云 COS 配置
    const SecretId = Deno.env.get('COS_SECRET_ID') || '';
    const SecretKey = Deno.env.get('COS_SECRET_KEY') || '';
    const Bucket = Deno.env.get('COS_BUCKET') || 'lee2111-1419902782';
    const Region = Deno.env.get('COS_REGION') || 'ap-beijing';

    if (!SecretId || !SecretKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const key = `images/${Date.now()}-${filename}`;
    const uploadUrl = `https://${Bucket}.cos.${Region}.myqcloud.com/${key}`;
    
    // Base64 转二进制
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // 计算 Content-MD5
    const contentMD5 = await crypto.subtle.digest('MD5', binaryData);
    const md5Hash = btoa(String.fromCharCode(...new Uint8Array(contentMD5)));
    
    // 使用简单方式：直接 PUT 上传（存储桶需要设置为公有写或配置正确的签名）
    // 由于签名复杂，这里使用预签名 URL 方式
    const now = Math.floor(Date.now() / 1000);
    const expire = now + 3600;
    
    // 构建签名字符串（腾讯云 COS 标准签名）
    const httpMethod = 'put';
    const signTime = `${now};${expire}`;
    const keyTime = `${now};${expire}`;
    
    // 签名串
    const signStr = [
      httpMethod,
      md5Hash,
      'image/jpeg',
      '',
      `content-md5=${md5Hash}&content-type=image%2Fjpeg`,
      '',
    ].join('\n') + '\n';
    
    // 计算签名
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SecretKey);
    
    // 先计算 signKey
    const signKeyData = encoder.encode(keyTime);
    const signKeyCrypto = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signKey = await crypto.subtle.sign('HMAC', signKeyCrypto, signKeyData);
    
    // 再计算最终签名
    const signKeyHex = Array.from(new Uint8Array(signKey)).map(b => b.toString(16).padStart(2, '0')).join('');
    const signStrData = encoder.encode(signStr);
    const finalCrypto = await crypto.subtle.importKey(
      'raw',
      encoder.encode(signKeyHex),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', finalCrypto, signStrData);
    const signatureHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const auth = `q-sign-algorithm=sha256&q-ak=${SecretId}&q-sign-time=${signTime}&q-key-time=${keyTime}&q-header-list=content-md5;content-type&q-url-param-list=&q-signature=${signatureHex}`;

    // 上传文件
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-MD5': md5Hash,
        'Authorization': auth,
        'Host': `${Bucket}.cos.${Region}.myqcloud.com`,
      },
      body: binaryData,
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('COS upload error:', response.status, responseText);
      throw new Error(`Upload failed: ${response.status} - ${responseText}`);
    }

    const imageUrl = `https://${Bucket}.cos.${Region}.myqcloud.com/${key}`;
    
    return new Response(
      JSON.stringify({ url: imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
