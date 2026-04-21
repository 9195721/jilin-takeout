const { Client } = require('pg');

// Supabase 直连 (port 5432) 和 pooler (port 6543)
const configs = [
  // 尝试直连
  {
    host: 'db.edclbolgjqozkjmnlwmp.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'pp2515128!!!',
    label: 'direct'
  },
  // 尝试 pooler session mode
  {
    host: 'aws-0-ap-northeast-1.pooler.supabase.com',
    port: 6543,
    database: 'edclbolgjqozkjmnlwmp',
    user: 'postgres.edclbolgjqozkjmnlwmp',
    password: 'pp2515128!!!',
    label: 'pooler-session'
  },
  // 尝试 pooler transaction mode
  {
    host: 'aws-0-ap-northeast-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.edclbolgjqozkjmnlwmp',
    password: 'pp2515128!!!',
    label: 'pooler-tx'
  }
];

const sqls = [
  `CREATE POLICY "用户可以创建自己的资料" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);`,
  `CREATE POLICY "商家可查看自己的申请" ON public.merchants FOR SELECT USING (auth.uid() = user_id);`
];

async function tryConnect(config) {
  const client = new Client({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000
  });
  try {
    await client.connect();
    console.log(`[${config.label}] Connected!`);
    for (const sql of sqls) {
      const r = await client.query(sql);
      console.log(`[${config.label}] Executed: ${sql.substring(0, 60)}...`);
    }
    await client.end();
    console.log('All done!');
    return true;
  } catch (err) {
    console.error(`[${config.label}] Failed: ${err.message}`);
    try { await client.end(); } catch {}
    return false;
  }
}

async function run() {
  for (const config of configs) {
    const ok = await tryConnect(config);
    if (ok) return;
  }
  console.error('All connection methods failed.');
  process.exit(1);
}

run();
