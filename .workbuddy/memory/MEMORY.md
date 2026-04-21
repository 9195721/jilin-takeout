# MEMORY.md - jilin-takeout 项目记忆

## 项目背景
- GitHub: 9195721/jilin-takeout
- 域名: moojilin55.site，Vercel 部署
- 技术栈: React 18 + TS + Vite/Tailwind/Webpack，后端 Supabase + COS
- 备份文件: `C:\Users\Administrator\Desktop\jilin-takeout-backup-20260421.zip`（4/21 18:50 最新备份，源码含 framer-motion 优化、骨架屏）

## 备份存档记录
| 文件 | 时间 | 说明 |
|---|---|---|
| `jilin-takeout-backup-20260421.zip` | 4/21 18:50 | 优化版（含 framer-motion、骨架屏）|
| `jilin-takeout-backup-20260422-0700.zip` | 4/22 07:19 | 4.22 早版存档（从 4/21 备份恢复后构建版）|

## Supabase Management API（远程 SQL 执行）
- API: `POST https://api.supabase.com/v1/projects/{ref}/database/query`
- Token: `sbp_3148ab6712946da117391fbd7d21f0bb84d4e09e`（Management API key，非 anon key）
- 用 PowerShell `Invoke-WebRequest` 调用，JSON body: `{"query": "SELECT ..."}`
- CLI 方式: `supabase link` + `supabase db query --linked`（需要 `~/.supabase/profile` 配置文件）
- CLI profile 格式: JSON `{"name":"supabase","token":"sbp_...",...}`

## 重要教训
- **备份覆盖风险**：本地工作区（`oneday_zip_1776721924659`）创建于 4/21 5:53，晚于该时间的备份才是最新版本
- **操作前比对时间戳**：用 `(Get-Item $f).LastWriteTime` 确认备份版本新旧
- **源码恢复流程**：备份 zip 解压到临时目录 → 整体替换 src/ 而非合并（避免嵌套问题）→ npm install → npm run build → git add & push
- **PowerShell 编码**：脚本文件避免中文，改用 ASCII 或 `-Command` 内联 + `chcp 65001`
