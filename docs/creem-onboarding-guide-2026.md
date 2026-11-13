# Creem 开通与接入完整流程（2026-11 版）

> 面向：极速压图 / CompressFast 海外版（数字产品、一次性买断、$24.99）
> 目标：从零注册 Creem 商店 → 通过审核 → 创建产品 → 测试支付 → Webhook 自动发码 → 提现闭环
> 说明：平台规则和费率会调整，执行前以官方页面为准；本文不构成法律/税务建议。

---

## 0. 先看结论（10 条）

1. Creem 是 **Merchant of Record（MoR）**：它作为名义卖家收款，代你处理 190+ 国家的 VAT/GST/销售税、退款和拒付。
2. 支持**中国大陆个人和公司**开户（国家表里是 `China*`，星号指向中国特有的提现限额）。
3. 个人不需要注册公司，但要过 KYC（政府证件 + 人脸）；公司要过 KYB（营业执照等）。
4. 必须有**自有域名网站**，有 Privacy Policy、Terms of Service、可见的支持邮箱，且产品已可上线。
5. 费率：**3.9% + $0.40 / 笔**；无月费、无开户费。
6. 提现：最低 **$50 / €50**，每月 **1 号和 15 号**处理；资金先冻结 **7–12 天**做风控。
7. 提现方式：银行转账（7 USD/EUR 或 1%，取高者）、USDC（2%）；中国个人可用**支付宝**，中国公司用**对公银行账户**。
8. 中国个人支付宝提现限额：**单笔 5 万 CNY、每年 30–60 万 CNY**；本地银行账户不限额。
9. 收款成功的唯一可信信号是 **`checkout.completed` Webhook**，不能依赖支付成功跳转页。
10. 测试环境和生产环境**完全隔离**：不同 API Key、不同端点、不同 Webhook 密钥。

---

## 1. 注册前准备清单

先把下面这些准备好，能显著缩短审核时间。

### 1.1 网站与邮箱

| 项目 | 要求 | 本项目状态 |
|---|---|---|
| 自有域名 | 必须是自己的域名或子域名，例如 `compressfast.site` 或 `app.yourdomain.com` | ✅ 已有 |
| 网站可访问 | 不能密码保护、不能 404、不能是纯落地页 | ✅ 需确认 |
| 产品可上线 | 审核时产品要能用，不能是“Coming soon” | ✅ 已有 |
| 定价清晰 | 访客能在页面上看到价格和买什么 | ✅ `/pro` 页 |
| Privacy Policy | 必须可访问 | ✅ 已有 `/privacy` |
| Terms of Service | 必须可访问 | ✅ 已有 `/terms` |
| 支持邮箱 | 必须显示在网站页脚/联系页，且与 Creem 后台一致 | ⚠️ 建议用 `support@compressfast.site` 这类域名邮箱 |
| 业务邮箱 | 审核时会核对网站上的邮箱 | ⚠️ 不要用 Gmail/QQ/临时邮箱 |
| 禁止项 | 社交主页、应用市场页、GitHub、免费子域名、网盘链接 | 不要提交这类地址 |

### 1.2 身份/公司材料

**个人开户（推荐先用个人）：**

- 中国大陆居民身份证正反面照片（清晰、不加水印、不反光、四角完整）
- 或护照照片
- 人脸识别（按页面提示）
- 个人住址、国籍、手机号、税务居住地
- 收款账户持有人姓名必须与 KYC 身份完全一致

**公司开户：**

- 营业执照
- 公司法定名称、注册地址、税务居住地
- 法人/实际受益人信息
- 对公银行账户（户名必须与公司实体一致）

> 常见拒因：照片模糊、证件过期、姓名不一致、证件加水印。证件照片不要做任何涂改。

### 1.3 收款账户（建议提前开好）

| 方式 | 适合 | 说明 |
|---|---|---|
| 支付宝 | 中国大陆个人 | 单笔上限 5 万 CNY，年度 30–60 万 CNY |
| 本地银行账户 | 中国大陆公司 | 官方说明不限额 |
| Wise EUR 账户 | 个人/公司 | 作为“银行转账”收款账户使用，IBAN 填入 Creem |
| USDC（Polygon） | 有链上钱包 | 提现费 2% |

> 姓名匹配是硬性要求：KYC 用谁的身份，提现账户就必须是谁的名字。中文名建议按 Wise/银行显示的拼音大写填写（如 `ZHANG SAN`），顺序与账户一致。

### 1.4 产品信息

- 产品名称：CompressFast Pro（Lifetime）
- 价格：$24.99 USD
- 计费类型：One-time（一次性）
- 税务分类：Digital goods / SaaS（以 Creem 选项为准）
- 成功跳转页：`https://compressfast.site/en/pro?success=1`（建议做轮询激活状态）
- 退款政策：建议写 7–14 天无理由退款（MoR 平台通常要求明确政策）
- 产品说明：不要写“unlimited”等无法兑现的承诺；不要伪造用户数/评价

---

## 2. 注册账号与创建商店

### 2.1 注册

1. 打开 https://www.creem.io
2. 点击 **Sign up**
3. 用邮箱注册（建议用域名邮箱），或 Google 登录
4. 验证邮箱
5. 创建 Store：
   - Store name：`CompressFast`
   - Website：`https://compressfast.site`
   - Country：China（或你的公司注册地）
   - Currency：USD

> 注册不需要信用卡。注册成功 ≠ 可以收 live 款，必须通过账户审核。

### 2.2 后台基础设置

进入 **Settings → Business Details**，填写：

- Legal name：个人真实姓名 / 公司法定名称
- Business email：必须与网站上显示的支持邮箱一致
- Country / Tax residence：个人填个人税务居住地；公司填公司税务居住地
- Address、Phone
- Branding：Logo、品牌色、收据上的商家名称

> 网站页脚、Contact、Privacy/Terms 里都要能看到同一个支持邮箱。

---

## 3. 创建产品与收银台

### 3.1 创建一次性产品

1. 左侧 **Products → New Product**
2. 填写：
   - Name：`CompressFast Pro — Lifetime`
   - Description：说明包含哪些功能、永久有效、最多设备数等
   - Price：`24.99`
   - Currency：`USD`
   - Billing type：`One-time`
   - Tax category：数字商品/SaaS（按 Creem 当前选项）
3. 可选：License keys
   - 如果开启，Creem 会在支付成功后生成 license key，并放在 Webhook 的 `license_keys` 里。
   - 如果不开，继续用你现有的“自己生成激活码”逻辑（当前项目就是这样）。
4. 保存后记下 **Product ID**（形如 `prod_xxxxxxxx`）。

### 3.2 两种收款方式

**方式 A：托管支付链接（当前项目使用）**

```text
https://www.creem.io/payment/prod_xxxxxxxx
```

可以附加邮箱预填：

```text
https://www.creem.io/payment/prod_xxxxxxxx?customer_email=buyer@example.com
```

优点：无需后端、最快上线；缺点：不能动态传 metadata、不能灵活控制 success URL。

**方式 B：后端创建 Checkout（推荐后续升级）**

```http
POST https://api.creem.io/v1/checkouts
x-api-key: creem_xxxxxxxx
Content-Type: application/json

{
  "product_id": "prod_xxxxxxxx",
  "success_url": "https://compressfast.site/en/pro?success=1",
  "customer": { "email": "buyer@example.com" },
  "metadata": {
    "plan": "pro-lifetime",
    "affiliate": "xxx",
    "site": "compressfast"
  }
}
```

返回 `checkout_url`，前端跳转过去。API Key 只能放在后端环境变量里，绝不能进浏览器。

> 建议：等基础闭环稳定后，从静态链接迁移到 API Checkout，这样可以传 affiliate/metadata，并做更严格的订单追踪。

---

## 4. 测试模式（Test Mode）

### 4.1 开启方式

- 后台左下角 **Test Mode** 开关
- 测试环境 API：`https://test-api.creem.io`
- 生产环境 API：`https://api.creem.io`
- 测试 Key 前缀：`creem_test_`；生产 Key 以 `creem_` 开头
- 测试/生产 Webhook 是分开的，密钥也不同

### 4.2 测试卡

| 卡号 | 结果 |
|---|---|
| `4111 1111 1111 1111` | 支付成功 |
| `4507 9900 0000 0028` | 卡被拒绝 |
| `4507 9900 0000 0010` | 余额不足 |
| `4507 9900 0000 0044` | CVC 错误 |

有效期填未来任意日期，CVV 任意，账单地址任意。

### 4.3 测试 Webhook

- 本地开发用 `creem listen --forward-to http://localhost:3000/api/creem`
- 或 ngrok / Cloudflare Tunnel 暴露本地端口
- 在 Test Mode 下配置测试 Webhook URL
- 在后台 **Settings → Webhooks → Send test event** 可发送 `checkout.completed`，其中会带 `license_keys`
- 用成功卡完成一笔测试支付，确认 Webhook 真实到达

### 4.4 测试必须覆盖

- [ ] 支付成功 → Webhook 到达 → 激活码生成 → 邮件发送
- [ ] 支付失败/拒绝 → 不生成激活码
- [ ] 重复 Webhook → 幂等，不重复发码/不重复加权益
- [ ] 退款/拒付事件（如已订阅）
- [ ] 成功页刷新/重复打开不重复发码
- [ ] 测试 Key 不会打到生产端点
- [ ] Webhook 签名错误时返回 401

---

## 5. Webhook 配置与安全

### 5.1 配置

1. 后台 **Developers → Webhooks**
2. 添加 Endpoint：`https://compressfast.site/api/creem`
3. 选择事件：
   - `checkout.completed`（必需）
   - `refund.created`（建议）
   - `dispute.created`（建议）
4. 复制签名密钥 `whsec_...`，写入 `CREEM_WEBHOOK_SECRET`

### 5.2 签名验证（关键）

- Header：`creem-signature`
- 算法：`HMAC-SHA256(原始请求体, whsec_...)`，输出小写十六进制
- 必须用**原始 body** 验证，再 `JSON.parse`
- 使用恒时比较（timing-safe），先比长度
- Creem 没有固定出口 IP，**不要用 IP 白名单做鉴权**

Node/Next.js 伪代码：

```ts
const raw = await request.text()
const expected = createHmac('sha256', process.env.CREEM_WEBHOOK_SECRET!)
  .update(raw)
  .digest('hex')
const got = request.headers.get('creem-signature') ?? ''
// 长度相同再 timingSafeEqual
const ok = got.length === expected.length &&
  timingSafeEqual(Buffer.from(got), Buffer.from(expected))
if (!ok) return new Response('Invalid signature', { status: 401 })
const event = JSON.parse(raw)
```

### 5.3 重试与幂等

- 最多 5 次投递：立即、30 秒、5 分钟、30 分钟、6 小时
- 超过 24 小时不再重试
- 单次请求 15 秒超时，超时视为失败
- 任何 2xx 都算成功
- **同一事件可能重复投递**，必须按 `event.id` / `order.id` 做幂等
- 后台手动重发会生成新的 event id，不能只靠 event id 去重，建议同时用 `order.id`

### 5.4 关键 Payload 字段

```json
{
  "id": "evt_...",
  "eventType": "checkout.completed",
  "object": {
    "id": "ch_...",
    "order": {
      "id": "ord_...",
      "amount": 2499,
      "currency": "USD",
      "status": "paid",
      "type": "..."
    },
    "product": { "id": "prod_...", "name": "..." },
    "customer": { "id": "cus_...", "email": "buyer@example.com" },
    "license_keys": [],
    "metadata": {},
    "mode": "test"
  }
}
```

> 注意：`mode` 会标明 test/live；测试事件不要写入生产激活码库。

---

## 6. KYC / KYB 与账户审核（决定能否收 live 款）

### 6.1 触发审核

- 进入 **Balance → Payout Account → Set up Payout Account**
- 只有 live 模式才有 payout account
- 填写提现账户时自动开始 KYC/KYB
- Creem 可能做一笔小额测试购买（有时用 100% 折扣券，产生 0 元订单）

### 6.2 需要提交的信息

- 个人全名 / 公司法定名称
- Store / Product 名称
- 自有域名网站 URL
- 业务模式说明：卖什么、怎么交付、目标客户
- 产品说明
- 税务居住国家/地区
- 身份/公司文件
- 提现账户

### 6.3 网站硬性要求（逐项自查）

- [ ] 自有域名，HTTPS 正常
- [ ] 首页能看懂产品是什么
- [ ] 定价页面可访问
- [ ] Privacy Policy 可访问
- [ ] Terms of Service 可访问
- [ ] 页脚/联系页有支持邮箱，且与后台一致
- [ ] 没有密码保护/404/报错
- [ ] 没有虚假评价、虚假用户数
- [ ] 产品已上线可用
- [ ] 一个网站对应一个 Store（不要多站共用一个 Store）
- [ ] 产品名不侵权
- [ ] 订阅类产品必须提供取消入口（本项目是一次性买断，不涉及）

### 6.4 时间线与结果

- 通常 **1–2 个工作日**，高峰期最多 **3 个工作日**
- 结果邮件通知
- 三种结果：
  1. **Approved**：可收 live 款
  2. **Changes requested**：按邮件修改后点 **Request re-review**
  3. **Rejected**：该 Store 的最终决定，不能复审

### 6.5 常见被要求修改的原因

1. 支持邮箱与网站不一致
2. 网站打不开/密码保护/报错
3. 没有自有域名
4. 缺少 Privacy Policy 或 Terms
5. 虚假评价/用户数
6. 产品未准备好就送审
7. AI 类产品缺少 moderation/AUP/披露
8. 用社交主页、应用市场、GitHub、网盘链接代替官网
9. 一个 Store 挂在多个网站
10. 证件模糊/过期/姓名不一致

> 本项目已有 Privacy/Terms/定价/产品页，主要需要补的是：**域名支持邮箱 + 确保页脚可见 + 网站可正常访问**。

---

## 7. 提现设置与到账

### 7.1 设置提现账户

- **Balance → Payout Account → Add Account**
- 个人：支付宝 / 本地银行 / Wise EUR / USDC
- 公司：对公银行账户 / USDC
- 设置为 Default
- 账户持有人姓名必须与 KYC/KYB 完全一致

### 7.2 提现规则

| 项目 | 规则 |
|---|---|
| 最低余额 | $50 USD / €50 EUR |
| 处理日期 | 每月 1 日和 15 日 |
| 风控冻结 | 支付后 7–12 天 |
| 15 日到账的截止 | 8 日之前处理的款项（官方示例） |
| 1 日到账的截止 | 23 日之前处理的款项（官方示例） |
| 银行转账费 | 7 USD/EUR 或 1%，取高者 |
| USDC 费 | 2% |
| 货币转换 | 银行伙伴可能另收少量费用 |

### 7.3 中国提现注意事项

- 个人支付宝：单笔上限 **5 万 CNY**，年度 **30–60 万 CNY**
- 中国公司本地银行：官方说明不限额
- 支付宝大额提现可能要求补充说明/材料（第三方经验，非官方硬性规则）
- Wise 路线：Creem → Wise EUR → 支付宝/微信/银行卡；到账通常很快，但同样受外汇与合规约束
- 姓名不一致是提现失败的第一大原因

> 合规提示：跨境收款、结汇、个人外汇额度、个人所得税/企业所得税申报，请按中国当地法规处理。本文不构成税务或法律建议。

---

## 8. 费率与单位经济模型

### 8.1 基础费率

- 每笔成功交易：**3.9% + $0.40**
- 无月费、无开户费、无最低流水
- 费用按**含税订单金额**计算（VAT/GST 也计入基数）

### 8.2 $24.99 的真实到手

```text
订单金额：            $24.99
Creem 手续费：        $24.99 × 3.9% + $0.40 = $1.3746
到手（提现前）：       $23.6154
综合费率：            ≈ 5.50%
```

提现费另算：

| 单次提现 | 提现费 | 实际费率 |
|---:|---:|---:|
| $50 | $7 | 14% |
| $100 | $7 | 7% |
| $700 | $7 | 1% |
| $2,000 | $20 | 1% |

> 建议：余额累计到 $700 以上再提，避免最低 $7 的固定费吃掉利润。

### 8.3 退款/拒付

- 退款：原交易手续费**不退**；退款金额从后续余额扣除
- 拒付（chargeback）：官方退款文档标注 **25 USD/EUR / 笔**（以当前页面为准）
- Creem 作为 MoR 会代为处理拒付
- 客服需在 **3 个工作日内**响应，否则 Creem 可能代为退款

### 8.4 可选附加费（第三方资料，执行前核对）

- Split payments：+2%
- Affiliate platform：+2%
- Abandoned cart recovery：+5%

---

## 9. 上线（Go Live）检查清单

### 9.1 代码与环境变量

```bash
# .env.production / Vercel Environment Variables
CREEM_WEBHOOK_SECRET=whsec_xxxxxxxx
NEXT_PUBLIC_CREEM_CHECKOUT_URL=https://www.creem.io/payment/prod_xxxxxxxx
# 如果改用 API Checkout：
CREEM_API_KEY=creem_xxxxxxxx
```

注意：

- `NEXT_PUBLIC_` 变量会进浏览器，只能放公开的 checkout URL，不能放 API Key
- 测试 Key/端点和生产 Key/端点不能混用
- Webhook 密钥不要提交到 Git

### 9.2 上线步骤

1. Test Mode 全流程通过
2. 后台切到 Live，创建/确认 live 产品
3. 生成 live API Key（如用 API）
4. 注册 **live Webhook**（与测试 Webhook 分开）
5. 替换环境变量并重新部署
6. 用一笔真实小额订单验证（可考虑先建 $1 测试产品，完成后退款；注意手续费不退）
7. 检查：订单、Webhook 日志、激活码、邮件、后台统计
8. 确认提现账户已设为默认
9. 监控首周支付成功率、拒付、退款

### 9.3 Webhook 生产检查

- [ ] 生产 URL 是 HTTPS
- [ ] 返回 2xx 在 15 秒内
- [ ] 签名校验使用 raw body
- [ ] 幂等键：`order.id` / `event.id`
- [ ] 失败会记录日志并可重放
- [ ] 测试事件带 `mode: test` 时不发生产权益
- [ ] WAF/Cloudflare 不拦截 Creem 回调（Creem 无固定 IP）

---

## 10. 与当前项目代码的对照

### 10.1 现有链路

```text
/pro 输入邮箱
  → POST /api/create-license
  → 返回 Creem 支付链接（customer_email 预填）
  → 用户付款
  → Creem POST /api/creem（checkout.completed）
  → HMAC-SHA256 验签
  → createLicense() 生成激活码
  → sendLicenseEmail() 发邮件
```

对应文件：

- `app/[lang]/pro/page.tsx`
- `app/api/create-license/route.ts`
- `app/api/creem/route.ts`
- `lib/license.ts`
- `lib/email.ts`
- `lib/affiliate.ts`

### 10.2 当前用到的环境变量

| 变量 | 用途 |
|---|---|
| `NEXT_PUBLIC_CREEM_CHECKOUT_URL` | 托管支付链接，可覆盖默认 product |
| `CREEM_WEBHOOK_SECRET` | Webhook 验签密钥 `whsec_...` |

> 当前代码没有使用 Creem API Key，因为走的是静态支付链接；如果改用 API Checkout，才需要 `CREEM_API_KEY`。

### 10.3 建议补强（按优先级）

1. **幂等**：用 `order.id` 作为 Redis key，重复 Webhook 不重复发码。
2. **订单落库**：记录 `order.id`、`customer.email`、`product.id`、金额、模式（test/live）、时间。
3. **忽略 test 事件**：`object.mode === 'test'` 时不写生产权益。
4. **退款/拒付处理**：订阅 `refund.created` / `dispute.created`，停用对应激活码。
5. **成功页轮询**：支付成功后不要立即假设已发码，轮询 `/api/verify-license` 或订单状态。
6. **API Checkout**：把 affiliate/metadata 传过去，替代本地 attribution 的时序依赖。
7. **邮件失败重试**：Webhook 已 2xx 但邮件失败时，要有补偿任务。
8. **管理后台**：显示 Creem 订单号、金额、模式、退款状态。

---

## 11. 时间线（建议执行顺序）

### Day 0：准备

- [ ] 确认网站可访问、Privacy/Terms/定价/支持邮箱齐全
- [ ] 准备域名邮箱（如 `support@compressfast.site`）
- [ ] 准备身份证/护照/营业执照
- [ ] 准备支付宝或 Wise/对公账户

### Day 1：注册 + 建产品 + 测试

- [ ] 注册 Creem，创建 Store
- [ ] 填 Business Details，邮箱与网站一致
- [ ] 创建 $24.99 一次性产品，拿 Product ID
- [ ] 开 Test Mode，配置测试 Webhook
- [ ] 用测试卡跑通支付 → Webhook → 发码 → 邮件

### Day 2：提交审核

- [ ] Balance → Payout Account → Set up
- [ ] 提交 KYC/KYB 与提现账户
- [ ] 提交网站/产品/业务说明
- [ ] 等待 1–3 个工作日

### 审核通过后

- [ ] 切 Live，创建/确认 live 产品
- [ ] 配置 live Webhook + 密钥
- [ ] 更新生产环境变量并部署
- [ ] 真实小额订单验证
- [ ] 设置默认提现账户
- [ ] 监控首周数据

---

## 12. 常见坑（按踩坑概率排序）

1. **用 Gmail/QQ 邮箱做业务邮箱** → 审核要求修改；必须域名邮箱并显示在网站上。
2. **网站上的邮箱与后台不一致** → 最常见拒因。
3. **没有 Privacy/Terms** → 直接卡审核。
4. **证件加水印/模糊/过期** → KYC 失败。
5. **KYC 姓名与提现账户姓名不一致** → 提现失败。
6. **测试 Key 打到生产端点**（或反之）→ 全部支付失败。
7. **先 JSON.parse 再验签** → 签名永远对不上。
8. **Webhook 不幂等** → 重复发码/重复加权益。
9. **依赖 success redirect 发码** → 用户可伪造/跳转丢失。
10. **一个 Store 挂多个网站** → 审核问题。
11. **产品没上线就送审** → 要求修改。
12. **忽略 test 事件** → 测试订单污染生产数据。
13. **余额不足 $50 就等提现** → 提现按钮不亮。
14. **频繁小额提现** → 每次 $7 固定费，利润被吃掉。
15. **支付宝超年度限额** → 需要改为银行/Wise/USDC。
16. **客服 3 个工作日不回复** → Creem 可能代你退款。

---

## 13. 官方来源

- 快速开始：https://docs.creem.io/getting-started/introduction
- 支持国家（含 China*）：https://docs.creem.io/merchant-of-record/supported-countries
- 提现规则（含中国限额）：https://docs.creem.io/merchant-of-record/finance/payouts
- 账户审核：https://docs.creem.io/merchant-of-record/account-reviews/account-reviews
- FAQ：https://docs.creem.io/guides/faq
- Webhook：https://docs.creem.io/code/webhooks
- 测试模式：https://docs.creem.io/getting-started/test-mode
- 定价：https://www.creem.io/pricing
- 退款与拒付：https://docs.creem.io/merchant-of-record/finance/refunds-and-chargebacks

### 第三方实践参考（非官方，可能有滞后）

- 个人开发者 Creem + Wise/支付宝提现全流程（2026 版）：
  https://opc.bitou.tech/blog/个人开发者海外收款实战-Creem-支付宝-Wise-提现全流程
- 通过 Wise 中转提现：
  https://yeekal.com/indie-dev/creem-payout-to-alipay/

> 第三方文章中的审核时长、支付宝申报要求、姓名拼音格式等属于经验值，执行前以 Creem 官方页面/客服为准。
