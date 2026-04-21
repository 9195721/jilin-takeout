const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 从环境变量读取永久密钥
    const SecretId = Deno.env.get('COS_SECRET_ID') || '';
    const SecretKey = Deno.env.get('COS_SECRET_KEY') || '';

    if (!SecretId || !SecretKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 腾讯云 CAM 临时密钥 API
    const timestamp = Math.floor(Date.now() / 1000);
    const config = {
      durationSeconds: 1800,
      SecretId,
      SecretKey,
      bucket: 'lee2111-1419902782',
      region: 'ap-beijing',
      allowPrefix: 'images/*',
      allowActions: [
        'name/cos:PutObject',
        'name/cos:PostObject',
      ],
    };

    // 调用 STS API 获取临时密钥
    const stsUrl = 'https://sts.tencentcloudapi.com/';
    const payload = {
      Action: 'GetFederationToken',
      Version: '2018-08-13',
      Name: 'cos-upload',
      DurationSeconds: config.durationSeconds,
      Policy: JSON.stringify({
        version: '2.0',
        statement: [{
          effect: 'allow',
          resource: [`qcs::cos:${config.region}:uid/1250000000:${config.bucket}/${config.allowPrefix}`],
          action: config.allowActions,
        }],
      }),
      Timestamp: new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z'),
      Nonce: Math.floor(Math.random() * 100000),
    };

    // 简单签名 v3
    const host = 'sts.tencentcloudapi.com';
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const payloadStr = JSON.stringify(payload);
    const signStr = `POSTsts.tencentcloudapi.com/?Action=GetFederationToken`;
    
    // 使用 TC3-HMAC-SHA256 签名
    const algorithm = 'TC3-HMAC-SHA256';
    const service = 'sts';
    const credentialScope = `${date}/${service}/tc3_request`;
    
    const hashedPayload = await sha256Hex(payloadStr);
    const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${host}\nx-tc-action:getfederationtoken\n`;
    const signedHeaders = 'content-type;host;x-tc-action';
    const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${hashedPayload}`;
    
    const hashedCanonicalRequest = await sha256Hex(canonicalRequest);
    const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`;
    
    const secretDate = await hmacSha256(`TC3${config.SecretKey}`, date);
    const secretService = await hmacSha256(secretDate, service);
    const secretSigning = await hmacSha256(secretService, 'tc3_request');
    const signature = await hmacSha256Hex(secretSigning, stringToSign);
    
    const authorization = `${algorithm} Credential=${config.SecretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(stsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Host': host,
        'X-TC-Action': 'GetFederationToken',
        'X-TC-Version': '2018-08-13',
        'X-TC-Timestamp': String(timestamp),
        'Authorization': authorization,
      },
      body: payloadStr,
    });

    const result = await response.json();
    
    if (result.Response && result.Response.Error) {
      throw new Error(result.Response.Error.Message);
    }

    const credentials = result.Response.Credentials;
    const expiredTime = timestamp + config.durationSeconds;

    return new Response(
      JSON.stringify({
        credentials: {
          tmpSecretId: credentials.TmpSecretId,
          tmpSecretKey: credentials.TmpSecretKey,
          sessionToken: credentials.SessionToken,
        },
        startTime: timestamp,
        expiredTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('STS error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get temporary credentials' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sha256Hex(data: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(key: string | ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const keyData = typeof key === 'string' ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
}

async function hmacSha256Hex(key: string | ArrayBuffer, data: string): Promise<string> {
  const result = await hmacSha256(key, data);
  return Array.from(new Uint8Array(result)).map(b => b.toString(16).padStart(2, '0')).join('');
}
