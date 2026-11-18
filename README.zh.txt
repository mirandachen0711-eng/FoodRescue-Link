FoodRescue Link 项目源码
打包日期：2026-11-18

本包是本机 work/foodrescue-email 的开发源码副本，不是经过核实的比赛提交原始快照，也不保证与当前线上部署逐字一致。
其中包含后续开发的账号删除功能，正式部署前需检查、配置并验收。

目录
public/：网站页面、CSS、JavaScript、三语内容、PWA、图片、演示视频和营养手册。
src/：Cloudflare Worker 后端与邮箱认证客户端。
lib/：食物、预约、机构、通知及账号删除逻辑。
migrations/：Cloudflare D1 数据库结构迁移。
tests/：自动测试。
scripts/：构建脚本。

运行（Node.js >=22.13.0）
1. 在此目录运行 npm ci。
2. 配置 wrangler.jsonc 中你自己的 Supabase URL、publishable key 和 D1 database_id。
3. 如需管理员，替换 src/worker.mjs 中 REPLACE_WITH_ADMIN_USER_ID。
4. npm run db:local
5. npm run dev
6. 测试：npm test；构建：npm run build。

部署
本包默认使用 foodrescue-link-copy，不自动绑定正式网站域名。
使用你自己的 Cloudflare 账号登录 Wrangler，配置 D1，运行远程 migrations 后才可部署。
邮件登录需要 Supabase 的邮件认证配置；预约邮件通知需另外配置 RESEND_API_KEY。
账号删除涉及的服务端密钥仅通过 Worker secrets 配置，不能放到浏览器代码。

已排除 node_modules、本地数据库、Wrangler 登录缓存及环境凭证文件；部署配置和管理员身份已改成占位符。
未包含任何线上用户、预约或库存数据导出。图片、视频和文档仍适用各自的原有使用权限。
此次仅打包源码，没有修改或部署线上网站，也没有重新执行功能验收。
