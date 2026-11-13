# 从 0 到第一笔美元：独立开发者海外收款完整教程（Creem 实战版）

> 版本：2026-11
> 适用对象：想做海外数字产品、但没有海外公司/美国税号/支付牌照的个人开发者和小团队
> 案例：一个纯浏览器图片工具站，Pro 版 $24.99 一次性买断
> 说明：本文基于我们自己的真实接入流程整理。平台规则、费率、审核口径会变化，执行前以 Creem 官方页面为准。本文不构成法律、税务或外汇建议。

---

## 目录

1. 先搞清楚：海外收款到底难在哪
2. 路线选择：Stripe、PayPal 还是 MoR
3. 准备阶段：网站、邮箱、法律页、身份材料
4. 注册 Creem：从账号到商店
5. 产品与定价：$24.99 一次性买断怎么设计
6. 支付集成：从支付链接到自动发码
7. Webhook：整个系统最关键的一环
8. 测试模式：上线前必须跑完的剧本
9. KYC / KYB 审核：怎么一次过
10. Go Live：切换生产环境
11. 提现：钱怎么回到国内
12. 运营：退款、拒付、客服、税务
13. 真实踩坑复盘 + 必须提前防的 8 个风险
14. 30 天行动计划
15. 附录：模板、代码、检查清单
16. 发布建议：如何拆成系列文章
17. 官方来源与免责声明

---

## 0. 快速版（先看这 12 条）

1. 海外收款最难的不是写代码，是**主体、税务、合规和风控**。
2. 个人开发者优先用 **MoR（Merchant of Record）**，不要一上来就折腾 Stripe 美国公司。
3. MoR 里，**Creem 支持中国大陆个人开户**（官方国家表 `China*`，星号是提现限额）。
4. 必须有**自有域名网站**：Privacy Policy、Terms、定价页、可见的支持邮箱，一个都不能少。
5. 业务邮箱不要用 Gmail/QQ/临时邮箱，用 `support@yourdomain.com` 并显示在网站上。
6. 费率 **3.9% + $0.40/笔**；$24.99 到手约 **$23.62**（提现前）。
7. 提现最低 **$50**，每月 **1 号/15 号**，资金先冻结 **7–12 天**。
8. 中国个人可用**支付宝**提现：单笔 5 万 CNY、年度 30–60 万 CNY；公司可用对公账户。
9. 收款成功的唯一可信信号是 **`checkout.completed` Webhook**，不是支付成功跳转页。
10. Webhook 必须验证 **`creem-signature` = HMAC-SHA256(raw body)**，先验签再解析。
11. **付款前不要生成可用激活码**，否则会被白嫖（我们真实踩过）。
12. 测试环境和生产环境完全隔离：不同 Key、不同端点、不同 Webhook 密钥。

---

## 1. 先搞清楚：海外收款到底难在哪

很多教程只讲“怎么接 Stripe”，但真正卡住中国开发者的通常是下面 6 件事：

| 难点 | 具体表现 | 解决思路 |
|---|---|---|
| 主体 | Stripe 通常要海外公司/海外银行账户 | 用支持个人的 MoR，或注册海外主体 |
| 税务 | 欧盟 VAT、英国 VAT、美国各州销售税 | MoR 代扣代缴 |
| 拒付 | 信用卡拒付、争议、封号 | MoR 作为名义卖家处理 |
| 提现 | 美元怎么回国、结汇、限额 | 支付宝/Wise/对公账户/USDC |
| 合规 | 网站条款、隐私政策、退款政策 | 上线前补齐 |
| 风控 | 测试 Key 混用、Webhook 被伪造 | 环境隔离 + 签名校验 |

### 1.1 先确认你卖的是什么

MoR 平台通常只接受**数字产品/软件/SaaS**，不接受：

- 咨询、设计、开发、代运营等服务
- 需要物流的实物
- 部分金融、博彩、成人、盗版、侵权产品
- 生成式 AI 产品通常需要额外审核（内容审核/AUP/披露）

我们的产品是“浏览器本地图片处理工具”，属于数字软件，审核相对简单。

### 1.2 你需要准备的最小闭环

```text
一个能访问的网站
  → 一个能付款的产品页
  → 一个 MoR 收款链接
  → 一个支付成功后的自动交付（激活码/会员权限）
  → 一个能收到钱的提现账户
```

只要这 5 件事跑通，海外收款就算闭环。

---

## 2. 路线选择：Stripe、PayPal 还是 MoR

### 2.1 三种路线对比

| 维度 | Stripe | PayPal | MoR（Creem / Paddle / Lemon Squeezy） |
|---|---|---|---|
| 中国大陆个人直接开 | 很难 | 可收但风控严 | Creem 支持个人 |
| 是否需要海外公司 | 通常需要 | 不一定 | 不需要 |
| 税务 | 自己处理 | 自己处理 | MoR 代扣销售税 |
| 拒付 | 自己处理 | 自己处理 | MoR 协助处理 |
| 费率（参考） | 2.9% + $0.30 起 | 4% 左右 + 固定费 | 3.9% + $0.40 起 |
| 提现到国内 | 需要海外银行 | 可提现但限制多 | 支付宝/Wise/对公/USDC |
| 适合谁 | 有海外主体、流水大 | 小额、备用 | 个人开发者起步 |

### 2.2 为什么我们选 Creem

1. **个人可开**：不需要先注册美国公司。
2. **支持中国大陆**：官方国家表里有 `China*`。
3. **MoR**：VAT/GST/销售税由平台处理，省掉大量合规工作。
4. **接入简单**：托管支付链接 + Webhook 就能跑通。
5. **提现路径适合国内**：支付宝、Wise、对公账户、USDC。

> 其他 MoR 也可以考虑：Paddle、Lemon Squeezy、Polar、Gumroad。费率和地区政策不同，本文以 Creem 为例；核心流程是相通的。

---

## 3. 准备阶段：网站、邮箱、法律页、身份材料

这一阶段决定你审核能不能一次过。

### 3.1 网站必须有的 6 个东西

- [ ] 自有域名（`yourdomain.com` 或 `app.yourdomain.com`）
- [ ] HTTPS 正常，页面可访问
- [ ] 产品说明 + 定价（访客能看懂买什么、多少钱）
- [ ] Privacy Policy（隐私政策）
- [ ] Terms of Service（服务条款）
- [ ] 可见的支持邮箱（页脚/Contact/法律页）

**不要用**：

- 免费子域名（`xxx.vercel.app`、`xxx.github.io`）
- 社交主页、应用市场页、GitHub 仓库、网盘链接
- 密码保护/未上线的落地页
- 虚假评价、虚假用户数

### 3.2 邮箱怎么弄

审核会核对“网站上的邮箱”和“Creem 后台的 Business email”是否一致。

推荐：

```text
support@yourdomain.com
```

实现方式：

| 方案 | 成本 | 说明 |
|---|---|---|
| Cloudflare Email Routing | 免费 | 转发到你的 Gmail/QQ 邮箱，收信用 |
| Zoho Mail | 免费档 | 域名邮箱 |
| Google Workspace | 付费 | 稳定 |
| Resend / Postmark / SES | 按量 | 发交易邮件（激活码、收据） |

**重要**：收信邮箱和发信服务可以分开。网站显示 `support@yourdomain.com`，实际收信转发到你的常用邮箱；发激活码用 Resend/SES/QQ SMTP 都行。

> 我们项目早期用 QQ SMTP 发激活码，简单、不用翻墙；但如果客户主要在欧美，建议换成 Resend/Postmark/SES，并配置 SPF/DKIM/DMARC，避免进垃圾箱。

### 3.3 身份/公司材料

**个人开户：**

- 身份证正反面（清晰、不加水印、不反光）
- 或护照
- 人脸识别
- 个人住址、国籍、税务居住地

**公司开户：**

- 营业执照
- 公司法定名称、注册地址、税务居住地
- 法人/实际受益人
- 对公银行账户

### 3.4 收款账户

| 方式 | 适合 | 限额/费用 |
|---|---|---|
| 支付宝 | 中国大陆个人 | 单笔 5 万 CNY；年度 30–60 万 CNY |
| 本地银行 | 中国大陆公司 | 官方说明不限额 |
| Wise EUR | 个人/公司 | 作为银行转账账户，IBAN 填入 Creem |
| USDC（Polygon） | 有链上钱包 | 提现费 2% |

**姓名必须一致**：KYC 用谁的身份，提现账户就必须是谁的名字。中文名建议按银行/Wise 显示的拼音大写填写（如 `ZHANG SAN`）。

---

## 4. 注册 Creem：从账号到商店

### 4.1 注册

1. 打开 https://www.creem.io
2. Sign up（邮箱或 Google）
3. 验证邮箱
4. 创建 Store：
   - Store name：你的品牌名
   - Website：你的自有域名
   - Country：China（个人）或公司注册地
   - Currency：USD

> 注册不需要信用卡；但注册成功不代表能收 live 款，必须通过账户审核。

### 4.2 后台基础设置

**Settings → Business Details：**

- Legal name：个人真实姓名 / 公司法定名称
- Business email：与网站显示的支持邮箱一致
- Country / Tax residence：个人填个人；公司填公司
- Address、Phone
- Branding：Logo、品牌色、收据商家名

### 4.3 先开 Test Mode

后台左下角打开 **Test Mode**：

- 测试 API：`https://test-api.creem.io`
- 生产 API：`https://api.creem.io`
- 测试 Key：`creem_test_...`
- 生产 Key：`creem_...`
- 测试/生产 Webhook 完全分开

**不要混用**，混用会导致所有支付失败。

---

## 5. 产品与定价：$24.99 一次性买断怎么设计

### 5.1 一次性买断 vs 订阅

| 模式 | 优点 | 缺点 | 适合 |
|---|---|---|---|
| 一次性买断 | 转化高、用户决策简单 | 收入不可持续、长期维护成本 | 工具类、轻量软件 |
| 订阅 | 收入可预测 | 转化低、取消/退款多 | SaaS、持续服务 |

我们的选择：**一次性买断**。原因：

- 工具型产品，用户使用频率不固定
- 目标用户对订阅疲劳
- 降低客服和退款复杂度

> 注意：不要写“永久 unlimited”，容易被理解为无限设备/无限功能/永久更新。建议写“Lifetime license for the current major version”，并明确设备数。

### 5.2 全球定价

- 美国/欧洲用户对 $19–$49 的工具接受度高
- $24.99 是一个心理价位：低于 $25，高于 $19.99
- 不要按国内 ¥9.9 的思维定价；海外获客成本更高
- 可以后续加 $39.99 的“Pro+”或团队版

### 5.3 创建产品

1. **Products → New Product**
2. 填写：
   - Name：`YourApp Pro — Lifetime`
   - Description：功能、设备数、更新范围
   - Price：`24.99`
   - Currency：`USD`
   - Billing type：`One-time`
   - Tax category：数字商品/SaaS
3. 记下 **Product ID**（`prod_...`）
4. 选择是否使用 Creem License Keys：
   - 开启：Creem 生成 key，放在 Webhook `license_keys`
   - 关闭：自己生成激活码（我们项目用的是这种）

### 5.4 两种收银台方式

**方式 A：托管支付链接（最快）**

```text
https://www.creem.io/payment/prod_xxxxxxxx
```

预填邮箱：

```text
https://www.creem.io/payment/prod_xxxxxxxx?customer_email=buyer@example.com
```

适合：第一版、个人项目、不想写太多后端。

**方式 B：API Checkout（更灵活）**

```http
POST https://api.creem.io/v1/checkouts
x-api-key: creem_xxxxxxxx
Content-Type: application/json

{
  "product_id": "prod_xxxxxxxx",
  "success_url": "https://yourdomain.com/success",
  "customer": { "email": "buyer@example.com" },
  "metadata": { "plan": "pro", "affiliate": "xxx" }
}
```

返回 `checkout_url`，前端跳转。

适合：需要 metadata、affiliate 归因、动态定价、订单追踪。

> 我们第一版用方式 A，先把闭环跑通；后续再升级到方式 B。

---

## 6. 支付集成：从支付链接到自动发码

### 6.1 整体架构

```text
用户浏览器
  │ 1. 输入邮箱
  ▼
POST /api/create-license
  │ 2. 校验邮箱、限流、记录推广归因
  │ 3. 返回 Creem 支付链接（带 customer_email）
  ▼
Creem 托管收银台
  │ 4. 用户付款
  ▼
POST /api/creem（Webhook）
  │ 5. 验证 HMAC 签名
  │ 6. 生成/激活 license
  │ 7. 发邮件
  ▼
用户收到激活码 → 在站内验证 → 解锁 Pro
```

### 6.2 前端：收集邮箱

```tsx
async function handleCheckout(email: string) {
  const res = await fetch('/api/create-license', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, locale: 'en' }),
  })
  const data = await res.json()
  if (data.checkoutUrl) window.location.href = data.checkoutUrl
}
```

### 6.3 后端：`/api/create-license`

职责：

- 校验邮箱格式/长度
- IP 限流
- 记录 affiliate 归因
- **只返回支付链接，不生成可用激活码**

我们真实代码的精简版：

```ts
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  }

  const { email: rawEmail, locale = 'en' } = await request.json()
  const email = String(rawEmail || '').toLowerCase().trim()
  if (!email || !email.includes('@') || email.length > 254) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  // 推广归因：付款前先记下 email ↔ affiliate 的关系
  const affRef = request.cookies.get('aff_ref')?.value
  if (affRef) {
    const aff = await getAffiliate(affRef)
    if (aff?.active) await saveAttribution(email, affRef)
  }

  const checkoutUrl = new URL(process.env.NEXT_PUBLIC_CREEM_CHECKOUT_URL!)
  checkoutUrl.searchParams.set('customer_email', email)

  return NextResponse.json({ success: true, checkoutUrl: checkoutUrl.toString() })
}
```

**安全关键**：这个接口不生成激活码。付款前没有任何可用权益。

### 6.4 激活码设计

我们的 license 记录：

```ts
interface LicenseRecord {
  code: string          // XXXX-XXXX-XXXX
  email: string
  created_at: string
  active: boolean       // 只有支付确认后才为 true
  devices: string[]
  orderId?: string      // Creem 订单号
  orderAmount?: string  // 例如 "24.99 USD"
}
```

`createLicense(email, orderId, amount)` 的核心逻辑：

```ts
const paid = !!orderId   // 没有订单号 = 未支付 = 不可用

const existing = await getLicenseByEmail(email)
if (existing) {
  // 重复回调：只补订单信息/激活，不重复发新码
  if (paid && !existing.active) existing.active = true
  return existing
}

const code = generateLicenseCode()
const record = { code, email, active: paid, devices: [], orderId, orderAmount }
await saveLicense(record)
return record
```

**教训**：早期如果“请求支付链接时就生成 active 码”，用户不付款也能拿到可用码。我们后来改成“无 orderId 一律 inactive”，堵住了白嫖。

### 6.5 激活码校验

```ts
POST /api/verify-license
Body: { code, fingerprint? }

→ { valid: true, plan: 'pro', devices: [...] }
→ { valid: false, reason: 'not_found' | 'inactive' | 'device_limit' }
```

要点：

- 限流（我们用的 10 次/分钟/IP）
- 设备指纹 + 设备数上限
- 大小写/空格归一化
- 不返回敏感信息

---

## 7. Webhook：整个系统最关键的一环

### 7.1 配置

1. Creem 后台 **Developers → Webhooks**
2. Endpoint：`https://yourdomain.com/api/creem`
3. 事件：`checkout.completed`（必需）、`refund.created`、`dispute.created`（建议）
4. 复制 `whsec_...` 到环境变量 `CREEM_WEBHOOK_SECRET`

### 7.2 验签

```ts
const secret = process.env.CREEM_WEBHOOK_SECRET!
const signature = request.headers.get('creem-signature')
const raw = await request.text()   // 必须在 JSON.parse 之前

const expected = createHmac('sha256', secret).update(raw).digest('hex')
const ok = signature?.length === expected.length &&
  timingSafeEqual(Buffer.from(signature), Buffer.from(expected))

if (!ok) return new Response('Invalid signature', { status: 401 })

const event = JSON.parse(raw)
```

**错误示范**：

```ts
const body = await request.json()   // ❌ 已经解析，字节变了，验签必失败
```

### 7.3 处理 `checkout.completed`

```ts
if (event.eventType !== 'checkout.completed') {
  return NextResponse.json({ received: true, skipped: event.eventType })
}

const email = event.object?.customer?.email
const orderId = event.object?.order?.id
const amount = event.object?.order?.amount
const currency = event.object?.order?.currency || 'USD'
const mode = event.object?.mode   // "test" | "live"

// 生产环境忽略测试事件
if (mode === 'test' && process.env.NODE_ENV === 'production') {
  return NextResponse.json({ received: true, skipped: 'test' })
}

const license = await createLicense(email, orderId, `${(amount / 100).toFixed(2)} ${currency}`)

await sendLicenseEmail({ to: email, code: license.code, locale: 'en' })
return NextResponse.json({ success: true })
```

### 7.4 幂等（强烈建议）

Creem 会重试 Webhook，同一个事件可能到达多次。建议：

```ts
const key = `creem:event:${event.id}`
if (await redis.set(key, '1', { nx: true, ex: 60 * 60 * 24 * 7 }) === null) {
  return NextResponse.json({ received: true, duplicate: true })
}
```

同时用 `order.id` 做业务幂等（一个订单只发一次码）。我们当前的 `createLicense` 按 email 查到已有记录就复用，已经能防大部分重复发码；但生产级最好再加 event/order 级去重。

### 7.5 重试规则

- 最多 5 次：立即、30 秒、5 分钟、30 分钟、6 小时
- 超过 24 小时不再重试
- 单次 15 秒超时
- 任意 2xx 视为成功
- 同一事件重试会保留 event id；后台手动重发会生成新 id

### 7.6 退款/拒付

建议订阅：

- `refund.created`：按订单/邮箱撤销 license
- `dispute.created`：标记风险订单，暂停权益

---

## 8. 测试模式：上线前必须跑完的剧本

### 8.1 测试卡

| 卡号 | 结果 |
|---|---|
| `4111 1111 1111 1111` | 成功 |
| `4507 9900 0000 0028` | 被拒绝 |
| `4507 9900 0000 0010` | 余额不足 |
| `4507 9900 0000 0044` | CVC 错误 |

有效期任意未来日期，CVV 任意。

### 8.2 本地 Webhook

```bash
creem listen --forward-to http://localhost:3000/api/creem
```

或：

```bash
ngrok http 3000
```

把 ngrok 地址填到 Test Mode 的 Webhook。

### 8.3 必测清单

- [ ] 支付成功 → Webhook 到达 → 发码 → 邮件收到
- [ ] 支付失败 → 不发码
- [ ] 重复 Webhook → 不重复发码
- [ ] 错误签名 → 401
- [ ] 测试 Key 打生产端点 → 失败（确认没混用）
- [ ] 成功页刷新 → 不重复发码
- [ ] `mode=test` 事件不写生产数据
- [ ] 退款事件能撤销权益（如果已实现）

### 8.4 自动化测试（可选但推荐）

我们用 Playwright 做了端到端测试：

- 打开 `/pro`
- 输入邮箱
- 拦截 `/api/create-license`，确认返回 checkout URL
- 模拟 Webhook（带正确签名）→ 确认 license 生成
- 调 `/api/verify-license` 确认可用
- 重复 Webhook → 确认幂等

这样每次改支付相关代码都能回归。

---

## 9. KYC / KYB 审核：怎么一次过

### 9.1 触发

**Balance → Payout Account → Set up Payout Account**

只有 live 模式才有提现账户；提交提现账户时自动开始 KYC/KYB。

### 9.2 提交内容

- 个人/公司法定名称
- Store/Product 名称
- 网站 URL（自有域名）
- 业务说明：卖什么、怎么交付、目标客户
- 产品说明
- 税务居住地
- 身份/公司文件
- 提现账户

### 9.3 网站自查

- [ ] 自有域名，HTTPS 正常
- [ ] 首页能看懂产品
- [ ] 定价可查
- [ ] Privacy Policy
- [ ] Terms of Service
- [ ] 支持邮箱与后台一致
- [ ] 网站不报错/不密码保护
- [ ] 产品已上线
- [ ] 无虚假评价/用户数
- [ ] 一个网站一个 Store

### 9.4 时间线

- 通常 1–2 个工作日
- 高峰期最多 3 个工作日
- 结果：Approved / Changes requested / Rejected

### 9.5 常见拒因

1. 支持邮箱与网站不一致
2. 网站打不开/密码保护
3. 没有自有域名
4. 缺 Privacy/Terms
5. 虚假评价
6. 产品未上线
7. AI 产品缺 moderation/AUP
8. 一个 Store 挂多个网站
9. 证件模糊/过期/姓名不一致

> 我们的经验：网站合规页和域名邮箱是最容易补、也最容易被卡的项。先把这两件事做好，审核通常很快。

---

## 10. Go Live：切换生产环境

### 10.1 环境变量

```bash
# 生产
CREEM_WEBHOOK_SECRET=whsec_xxxxxxxx
NEXT_PUBLIC_CREEM_CHECKOUT_URL=https://www.creem.io/payment/prod_xxxxxxxx

# 如果改用 API Checkout
CREEM_API_KEY=creem_xxxxxxxx

# 其他
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
UPSTASH_REDIS_URL=...
UPSTASH_REDIS_TOKEN=...
RESEND_API_KEY=...   # 或 SMTP
```

注意：

- `NEXT_PUBLIC_` 会进浏览器，不能放 API Key
- 测试/生产 Key 和端点不能混用
- Webhook secret 不要提交 Git

### 10.2 上线步骤

1. Test Mode 全流程通过
2. 后台切 Live，创建/确认 live 产品
3. 生成 live API Key（如用 API）
4. 注册 live Webhook（和测试分开）
5. 替换环境变量并重新部署
6. 真实小额订单验证
7. 检查订单、Webhook 日志、激活码、邮件、统计
8. 设置默认提现账户
9. 监控首周支付成功率/拒付/退款

### 10.3 成功页不要直接发权益

错误做法：`/success` 页面直接调用“发码”。

原因：URL 可以被伪造/重放，用户不付款也能访问。

正确做法：成功页只轮询“订单是否已处理”，真正的权益由 Webhook 发放。

---

## 11. 提现：钱怎么回到国内

### 11.1 规则

| 项目 | 规则 |
|---|---|
| 最低余额 | $50 / €50 |
| 处理日期 | 每月 1 日、15 日 |
| 冻结期 | 支付后 7–12 天 |
| 15 日到账 | 8 日之前处理的款项（官方示例） |
| 1 日到账 | 23 日之前处理的款项（官方示例） |
| 银行转账费 | 7 USD/EUR 或 1%，取高 |
| USDC 费 | 2% |
| 货币转换 | 银行伙伴可能另收费 |

### 11.2 中国路径

**个人：**

- 支付宝：单笔 5 万 CNY，年度 30–60 万 CNY
- Wise EUR：Creem → Wise → 支付宝/微信/银行卡
- 本地银行：以官方支持为准

**公司：**

- 对公银行账户：官方说明不限额
- USDC：适合有链上钱包的团队

### 11.3 费用优化

| 提现额 | 银行费 | 实际费率 |
|---:|---:|---:|
| $50 | $7 | 14% |
| $100 | $7 | 7% |
| $700 | $7 | 1% |
| $2,000 | $20 | 1% |

**建议**：余额累计到 $700 以上再提，避免固定费吃掉利润。

### 11.4 合规提示

跨境收款、结汇、个人外汇额度、个人所得税/企业所得税申报，请按中国当地法规处理并咨询专业人士。本文不提供规避监管的建议。

---

## 12. 运营：退款、拒付、客服、税务

### 12.1 退款政策

建议在网站写明：

- 7 天或 14 天无理由退款（数字产品）
- 退款后撤销 license
- 退款原交易手续费不退（平台规则）

模板见附录。

### 12.2 拒付

- Creem 作为 MoR 处理拒付
- 官方退款文档标注拒付费约 25 USD/EUR/笔（以当前页面为准）
- 低客单价产品要重视拒付率；清晰的条款、交付记录、客服响应能降低风险

### 12.3 客服

- 3 个工作日内响应，否则 Creem 可能代你退款
- 准备模板：未收到码、换邮箱、退款、设备超限、发票
- 支持邮箱显示在网站和收据上

### 12.4 税务

- Creem 作为 MoR 代扣 VAT/GST/销售税
- 你的**所得税**仍需自己申报
- 个人开户不需要美国公司/税号；规模大了再考虑公司主体
- 不要为了省税做虚假信息，平台会复核

---

## 13. 真实踩坑复盘 + 必须提前防的 8 个风险

> 先说明：原文把“我们真实踩过的坑”和“行业常见风险”混在一起写了，这样不严谨。
> 下面 13.1 的 7 条，我们能在项目记录、代码或 git 历史里找到证据；
> 13.2 的 8 条，是我们**没有亲历**、但根据官方规则和行业经验必须提前防的风险。
> 写教程时，建议保留这个区分：能指出“什么时候、什么现象、怎么修”的，才叫真实踩坑。

### 13.1 我们真实发生/真实存在的 7 个问题

#### 1. 付款前就生成 `active: true` 的激活码（真实漏洞，2026-11-05 修复）

**背景**：最初为了让用户“付款后马上收到码”，`/api/create-license` 在用户只输入邮箱时就调用了 `createLicense(email)`，并立刻把激活码设为 `active: true`，同时发邮件。

**症状**：任何人不需要付款，只要调用两个公开接口：

```text
POST /api/create-license  { email: "任意邮箱" }
POST /api/resend-license  { email: "同一个邮箱" }
```

就能拿到一个可用的 Pro 激活码。这是完整的白嫖链路，不是理论风险。

**根因**：

1. 发码时机错误：付款前就创建了“可用权益”。
2. `createLicense()` 默认 `active: true`，没有区分“已付款”和“未付款”。
3. 公开接口没有限流，攻击成本极低。

**修复**（3 处）：

1. `lib/license.ts`：只有传入 `orderId`（支付回调才有）时才 `active: true`；没有 `orderId` 一律 `active: false`。
2. `/api/create-license`：付款前不再生成激活码，只返回 Creem 支付链接。
3. `/api/create-license`：加 IP 限流（3 次/分钟）。

核心代码：

```ts
const paid = !!orderId   // 没有订单号 = 未支付 = 不可用

const existing = await getLicenseByEmail(email)
if (existing) {
  if (paid && !existing.active) existing.active = true
  return existing
}

const record = {
  code: generateLicenseCode(),
  email,
  active: paid,          // 关键：付款前一定是 false
  devices: [],
  orderId,
}
```

**验证**：修复时专门测了 7 个攻击向量：白嫖查码、伪造签名回调、金额篡改、回调重放、设备上限、乱猜激活码、正常流程。全部通过。

**教训**：

- 权益只能在“支付确认”之后发放。
- 支付前最多创建 `pending` 订单，绝不能创建可用 license。
- 公开的发码/查码接口必须限流。

---

#### 2. Creem Webhook 完全不验签（真实漏洞，2026-07-08 安全审计修复）

**背景**：第一版 `/api/creem` 直接读取 JSON，判断 `eventType === 'checkout.completed'` 就发码。

**修复前的代码长这样**：

```ts
export async function POST(request: NextRequest) {
  const body = await request.json()
  if (body?.eventType !== 'checkout.completed') {
    return NextResponse.json({ received: true })
  }
  const email = body?.object?.customer?.email
  const license = await createLicense(email, body?.object?.order?.id)
  await sendLicenseEmail({ to: email, code: license.code })
}
```

**症状**：Webhook 是一个公开 URL。任何人只要 POST 一段伪造 JSON：

```json
{
  "eventType": "checkout.completed",
  "object": {
    "customer": { "email": "attacker@example.com" },
    "order": { "id": "fake_order" }
  }
}
```

就能给任意邮箱发一个可用的 Pro 激活码。完全不需要 Creem、不需要付款。

**根因**：

1. 没有验证 `creem-signature`。
2. 没有校验事件来源、金额、产品 ID。
3. 把“公开回调”当成了“可信内部调用”。

**修复**：

1. 用原始请求体 `request.text()` 计算 HMAC-SHA256，和 `creem-signature` 比对。
2. 先验签，再 `JSON.parse`；无签名/错签名直接 401。
3. 只处理 `checkout.completed`。
4. 后续继续补：校验 `mode`、`order.id`、`product.id`、金额。

修复后的核心：

```ts
const raw = await request.text()
const expected = createHmac('sha256', process.env.CREEM_WEBHOOK_SECRET!)
  .update(raw)
  .digest('hex')
const got = request.headers.get('creem-signature') ?? ''

const ok = got.length === expected.length &&
  timingSafeEqual(Buffer.from(got), Buffer.from(expected))

if (!ok) return new Response('Invalid signature', { status: 401 })
const event = JSON.parse(raw)   // 验签之后才解析
```

**教训**：

- Webhook 是公开端点，默认不可信。
- 必须验签 + 校验事件类型 + 校验金额/产品 + 幂等。
- 验签必须用 raw body，不能用已经解析过的 JSON 重新序列化。

---

#### 3. 没有自有域名，KYC 被卡住（真实阻塞，2026-07 解决）

**背景**：项目早期只有 Vercel 临时域名/社交主页，Creem KYC 要求“自有域名网站”。

**症状**：KYC 审核无法通过，直接影响 live 收款。

**修复**：绑定 `compressfast.site`，部署正式站，补齐 Privacy/Terms、定价页、支持邮箱。

**教训**：

- 免费子域名（`*.vercel.app`、`*.github.io`）、社交主页、GitHub 仓库、网盘链接都不算“网站”。
- 审核前先把域名、站点、法律页准备好，不要等 KYC 卡住再补。

---

#### 4. Creem 审核要求统一邮箱，被迫 re-review（真实经历，2026-07-07）

**背景**：网站上的联系邮箱和 Creem 后台的 Business Details 不一致。

**症状**：审核没有一次通过，被要求修改；修改后进入 re-review，上线时间被推迟。

**修复**：

1. 网站对外邮箱统一改为 `support@compressfast.site`。
2. Cloudflare Email Routing 把 `support@` 转发到常用邮箱。
3. Creem 后台 Business Details 同步为同一个邮箱。
4. 提交 re-review。

**教训**：

- 网站页脚、Contact、Privacy、Terms、收据、Creem 后台，必须是同一个域名邮箱。
- 不要用 Gmail/QQ/临时邮箱作为对外业务邮箱。
- 审核前自己先全文搜一遍邮箱，确认没有旧邮箱残留。

---

#### 5. 测试收银台 URL 兜底，差点把生产用户送去测试付款（真实配置问题，2026-07-07 移除）

**背景**：开发时为了本地方便，`NEXT_PUBLIC_CREEM_CHECKOUT_URL` 缺失时会 fallback 到 Creem 的 **test payment** 链接。

**症状**：如果生产环境变量漏配，用户会被送到测试收银台；即使付款，也不会产生真实订单/真实发码。

**修复**：删除测试 URL 兜底，fallback 改为生产产品 URL；上线前逐项核对环境变量。

**教训**：

- 测试环境和生产环境不能互为兜底。
- 环境变量缺失时应该显式报错，而不是静默使用测试链接。
- 上线清单里必须有“检查 checkout URL 是 live 还是 test”。

---

#### 6. Resend 域名未验证 403，付款成功但激活码邮件发不出（真实事故，2026-11-05）

**背景**：用 Resend 发激活码，`jisuyatu.com` 域名未验证/配置不完整，API 返回 403。

**症状**：用户付款成功，Webhook 也可能已经生成了激活码，但邮件发不出去，用户收不到码。

**修复**：

1. 切换到 QQ SMTP（授权码）作为可用通道。
2. 后续建议：换成 Resend/SES/Postmark，验证 `compressfast.site`，配置 SPF/DKIM/DMARC。
3. 后台保留“按邮箱查码/重发”能力，避免邮件失败等于交付失败。

**教训**：

- 支付成功 ≠ 交付成功。
- 邮件服务必须有域名验证、SPF/DKIM/DMARC，最好有备用通道。
- Webhook 返回 2xx 不代表用户收到码；要有补偿机制。

---

#### 7. 重复回调只做了 email 级防重，没有 event/order 级幂等（真实缺口，未造成事故）

**背景**：`createLicense()` 会按 email 查已有记录，所以同一个邮箱的重复 Webhook 不会生成第二个新码。

**但这不是完整幂等**：

- 没有按 `event.id` 去重：重复投递可能重复发邮件、重复统计。
- 没有按 `order.id` 去重：未来一个邮箱买多单/多产品时会复用错权益。
- 没有“发邮件”的独立幂等：Webhook 成功但邮件失败/重复发送时不好追踪。

**建议补强**：

```ts
const eventKey = `creem:event:${event.id}`
const first = await redis.set(eventKey, '1', { nx: true, ex: 60 * 60 * 24 * 7 })
if (first === null) return NextResponse.json({ duplicate: true })

const orderKey = `creem:order:${order.id}`
const orderFirst = await redis.set(orderKey, '1', { nx: true })
if (orderFirst === null) return NextResponse.json({ duplicate: true })
```

**教训**：

- 幂等要分三层：事件去重、订单去重、交付（发码/发邮件）去重。
- “按邮箱复用”只能防一部分重复，不能替代订单级幂等。

---

### 13.2 我们没亲历、但你必须提前防的 8 个风险

> 下面这些没有出现在我们的真实事故记录里，但都是 Creem 官方规则或行业高频问题。
> 写进教程是为了提醒读者，而不是冒充“我们踩过”。

1. **用个人邮箱做业务邮箱**  
   Gmail/QQ/临时邮箱容易被审核要求修改。用 `support@yourdomain.com`，并显示在网站和收据上。

2. **缺 Privacy Policy、Terms、Refund Policy**  
   Creem 审核明确要求 Privacy + Terms；退款政策建议也补上。缺了会被要求修改。

3. **依赖支付成功跳转页发权益**  
   成功页 URL 可以被伪造/重放。权益只能由 Webhook 发放；成功页只做轮询/提示。

4. **先 `JSON.parse` 再验签**  
   这是 Webhook 验签的经典错误。必须用 raw body 验证，再解析 JSON；否则签名永远对不上。  
   （我们当时的问题是“完全没验签”，不是这个具体写法，但修复后统一成了 raw body。）

5. **测试/生产 Key、端点混用**  
   `creem_test_` 只能配 `test-api.creem.io`，live key 只能配 `api.creem.io`；Webhook 密钥也分测试/生产。混用会导致支付失败或事件丢失。  
   （我们有过“测试 URL 兜底”的同类风险，已修复。）

6. **提现姓名与 KYC 不一致**  
   个人提现账户必须与 KYC 身份同名；公司账户必须与公司实体同名。中文名建议按银行/Wise 显示的拼音大写填写。  
   （我们尚未实际提现，这是官方规则 + 第三方经验。）

7. **频繁小额提现 + 支付宝年度限额**  
   银行提现费是 7 USD/EUR 或 1%（取高），提 $50 实际费率 14%；支付宝个人还有单笔 5 万 CNY、年度 30–60 万 CNY 限制。  
   （我们只做了费用测算，没有实际提现经验。）

8. **一个 Store 挂多个网站 / 产品没上线就送审 / 客服超 3 个工作日不回复**  
   官方要求一个网站一个 Store；审核时产品要已上线；客服 3 个工作日内不响应，Creem 可能代你退款。  
   （这三条我们没亲历，属于官方审核/运营规则。）

---

## 14. 30 天行动计划

### Week 1：准备

- [ ] 确定产品、价格、交付方式
- [ ] 域名、网站、Privacy、Terms、定价页
- [ ] 域名邮箱（support@）
- [ ] 身份证/营业执照、收款账户
- [ ] 注册 Creem，创建 Store

### Week 2：接入

- [ ] 创建产品，拿 Product ID
- [ ] 跑通托管支付链接
- [ ] 写 `/api/create-license`（只返回链接）
- [ ] 写 Webhook（验签 + 发码 + 邮件）
- [ ] 写 `/api/verify-license`
- [ ] Test Mode 配 Webhook

### Week 3：测试与审核

- [ ] 测试卡成功/失败/重复回调/错误签名
- [ ] 自动化 E2E
- [ ] 网站合规自查
- [ ] 提交 KYC/提现账户
- [ ] 等待审核（1–3 个工作日）

### Week 4：上线与首单

- [ ] 切 Live Key/端点/Webhook
- [ ] 真实小额订单验证
- [ ] 监控支付/邮件/激活
- [ ] 设置默认提现账户
- [ ] 发产品/内容，拿第一笔真实收入

---

## 15. 附录：模板、代码、检查清单

### 15.1 环境变量模板

```bash
# 站点
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Creem
CREEM_WEBHOOK_SECRET=whsec_xxxxxxxx
NEXT_PUBLIC_CREEM_CHECKOUT_URL=https://www.creem.io/payment/prod_xxxxxxxx
# 可选：API Checkout
CREEM_API_KEY=creem_xxxxxxxx

# 存储（license/限流/幂等）
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# 邮件（二选一）
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@yourdomain.com
# 或 SMTP
SMTP_HOST=
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
```

### 15.2 网站上线检查清单

- [ ] 自有域名 + HTTPS
- [ ] 产品页/定价
- [ ] Privacy Policy
- [ ] Terms of Service
- [ ] Refund Policy（建议）
- [ ] 支持邮箱可见
- [ ] 邮箱与 Creem 后台一致
- [ ] 无密码保护/无 404
- [ ] 无虚假评价
- [ ] 一个网站一个 Store
- [ ] 产品已上线可用

### 15.3 退款政策模板（英文）

```text
Refund Policy

We offer a 14-day money-back guarantee on your first purchase.
If you are not satisfied, contact support@yourdomain.com within 14 days
of purchase and we will issue a refund to the original payment method.

Refunds are processed by our payment provider. The original transaction
processing fee may not be refunded. After a refund, the associated license
key will be deactivated.

This policy does not affect your statutory rights.
```

### 15.4 支持邮件模板

**未收到激活码：**

```text
Subject: Re: Your license key

Hi {name},

Thanks for your purchase. I've resent your license key below.
If you don't see it within a few minutes, please check spam.

License: XXXX-XXXX-XXXX

— {your name}
```

**退款：**

```text
Subject: Re: Refund request

Hi {name},

I've processed your refund. It usually appears within 5–10 business days,
depending on your bank. Your license has been deactivated.

If there's anything we can improve, I'd love to hear it.

— {your name}
```

### 15.5 Webhook 处理检查清单

- [ ] 使用 raw body 验签
- [ ] 恒时比较
- [ ] 只处理 `checkout.completed`
- [ ] 校验 `mode`（test/live）
- [ ] 用 order.id 幂等
- [ ] 发码/发邮件失败可重试
- [ ] 退款/拒付事件有处理
- [ ] 15 秒内返回 2xx
- [ ] 日志记录 event id/order id/email
- [ ] 不记录完整卡号/敏感信息

---

## 16. 发布建议：如何拆成系列文章

如果你要把这份教程发到公众号/知乎/Dev.to，建议拆成 7 篇，每篇 2000–4000 字：

1. **《为什么中国独立开发者需要一个 MoR》**  
   Stripe/PayPal/MoR 对比，税务和拒付痛点。
2. **《Creem 开户实录：个人身份、KYC、审核一次过》**  
   材料清单、网站要求、常见拒因。
3. **《海外收款网站的合规清单》**  
   域名、邮箱、Privacy、Terms、定价页、退款政策。
4. **《数字产品定价：$24.99 一次性买断是怎么定的》**  
   全球定价、费率、单位经济模型。
5. **《从支付链接到自动发码：Creem + Next.js 实战》**  
   代码、Webhook、验签、幂等。
6. **《上线前必须跑完的支付测试剧本》**  
   测试卡、Webhook 重试、E2E。
7. **《钱怎么回国：Creem 提现、Wise/支付宝/对公账户》**  
   限额、费用、合规提示。

每篇末尾放一个本站/本教程的 CTA，形成内容闭环。

---

## 17. 官方来源与免责声明

### 官方文档

- 快速开始：https://docs.creem.io/getting-started/introduction
- 支持国家：https://docs.creem.io/merchant-of-record/supported-countries
- 提现规则：https://docs.creem.io/merchant-of-record/finance/payouts
- 账户审核：https://docs.creem.io/merchant-of-record/account-reviews/account-reviews
- FAQ：https://docs.creem.io/guides/faq
- Webhook：https://docs.creem.io/code/webhooks
- 测试模式：https://docs.creem.io/getting-started/test-mode
- 定价：https://www.creem.io/pricing
- 退款与拒付：https://docs.creem.io/merchant-of-record/finance/refunds-and-chargebacks

### 第三方实践参考（非官方）

- 个人开发者 Creem + Wise/支付宝提现全流程（2026 版）  
  https://opc.bitou.tech/blog/个人开发者海外收款实战-Creem-支付宝-Wise-提现全流程
- 通过 Wise 中转提现  
  https://yeekal.com/indie-dev/creem-payout-to-alipay/

### 免责声明

本文基于我们自己的项目实践和 2026 年 11 月的公开资料整理。平台费率、支持国家、审核要求、提现规则可能随时变化，请以 Creem 官方页面和客服答复为准。跨境收款、结汇、税务申报涉及当地法律法规，请咨询专业人士；不要伪造网站、公司信息或交易记录。
