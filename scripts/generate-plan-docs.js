/**
 * 生成获客推广计划 Word 文档 — 海外版 + 国内版
 */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType,
  ExternalHyperlink, BorderStyle, ShadingType,
} = require('docx');

const desktop = 'C:/Users/Administrator/Desktop';

// ═══════════════════════════════════════════
//  Overseas Plan
// ═══════════════════════════════════════════
function buildOverseasDoc() {
  const children = [];

  const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 200 }, children: [new TextRun({ text, bold: true, size: 32, color: '1a56db' })] });
  const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 }, children: [new TextRun({ text, bold: true, size: 26, color: '1e40af' })] });
  const h3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 80 }, children: [new TextRun({ text, bold: true, size: 22 })] });
  const p = (text, opts = {}) => new Paragraph({ spacing: { after: 120 }, ...opts, children: [new TextRun({ text, size: 21, ...opts })] });
  const bullet = (text) => new Paragraph({ spacing: { after: 60 }, bullet: { level: 0 }, children: [new TextRun({ text, size: 21 })] });
  const spacer = () => new Paragraph({ spacing: { after: 80 }, children: [] });

  // ── Title ──
  children.push(new Paragraph({
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: 'CompressFast 海外版', size: 40, bold: true, color: '1a56db' })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: '获客推广执行计划 · 2026年7月-10月', size: 24, color: '64748b' })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
    children: [
      new TextRun({ text: '域名：compressfast.site  |  Twitter：@CompressFastApp', size: 20, color: '64748b' }),
    ],
  }));

  // ── 1. Status ──
  children.push(h1('一、当前状态与目标'));
  children.push(p('以下数据截至 2026-07-15：'));
  children.push(bullet('日均 PV（页面浏览）：40-70'));
  children.push(bullet('日均 UV（独立访客）：刚上线追踪，从零累积'));
  children.push(bullet('Twitter/X 粉丝：0 → 冷启动阶段'));
  children.push(bullet('产品目录外链：5 条已提交（DevHunt / Uneed / StartupStash / TinyStartups / SideProjectors）'));
  children.push(bullet('SaaSHub：已提交，免费版等 1 个月'));
  children.push(bullet('AlternativeTo：7/18 可提交（DA 60+，权重最高的外链）'));
  children.push(bullet('SEO 工具页：8 个，全部已交互化'));
  children.push(bullet('真实付费用户：0（测试订单不计）'));
  children.push(bullet('月收入：$0'));
  spacer();

  children.push(p('目标（保守估计）：', { bold: true }));
  const goalTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: ['指标', '当前', '8/1 目标', '9/1 目标', '10/1 目标'].map(c => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c, bold: true, size: 20 })] })] })) }),
      ...['日均 UV', 'Twitter 粉丝', 'SEO 工具页', '产品目录外链', 'Pro 付费用户', '月收入'].map((label, i) => {
        const row = [['~20', '50', '150', '300'], ['0', '30', '100', '200'], ['8', '10', '14', '18'], ['5', '7', '10', '12'], ['0', '3', '15', '30'], ['$0', '$75', '$375', '$750']][i];
        return new TableRow({ children: [label, ...row].map(c => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c, size: 20 })] })] })) });
      }),
    ],
  });
  children.push(goalTable);
  spacer();

  // ── 2. SEO ──
  children.push(h1('二、渠道一：SEO 工具页 ⭐⭐⭐（最高 ROI）'));
  children.push(p('为什么排第一：一次开发，永久有流量。工具页转化率 1.49%，是博客文章的 3 倍。Google 对新域名有 3-6 个月"沙盒期"，所以现在就开始铺页面，6 个月后开始稳定来流量。'));
  spacer();
  children.push(h3('已有工具页（8 个，全部可交互）'));
  children.push(bullet('/en/tools/compress-png — 在线压缩 PNG'));
  children.push(bullet('/en/tools/compress-jpeg — 在线压缩 JPEG'));
  children.push(bullet('/en/tools/convert-to-webp — 转 WebP'));
  children.push(bullet('/en/tools/compress-images — 通用图片压缩'));
  children.push(bullet('/en/tools/resize-image — 图片尺寸调整'));
  children.push(bullet('/en/tools/convert-jpg-to-png — JPG 转 PNG'));
  children.push(bullet('/en/tools/compress-gif — GIF 压缩'));
  children.push(bullet('/en/tools/tinypng-alternative — TinyPNG 替代品'));
  spacer();

  children.push(h3('备选关键词（按搜索量×竞争度排序）'));
  children.push(bullet('compress-svg — SVG 压缩（竞争低，搜索量中等）'));
  children.push(bullet('remove-image-metadata — EXIF 清除（差异化强）'));
  children.push(bullet('bulk-compress-images — 批量压缩（商业意图强）'));
  children.push(bullet('compress-image-to-100kb — 目标大小压缩（精准长尾）'));
  children.push(bullet('webp-to-png — WebP 转 PNG（工具类刚需）'));
  children.push(bullet('avif-compressor — AVIF 压缩（Pro 卖点关联）'));
  spacer();

  children.push(h3('执行节奏'));
  children.push(bullet('每 1-2 周新增 1 个工具页'));
  children.push(bullet('每页必须有：独立 Hero + 3 个 Benefits + How-to 步骤 + 3 个 FAQ + 相关工具链接'));
  children.push(bullet('每个工具页嵌入可交互的上传区（DropZone + 压缩控件）'));
  children.push(bullet('开发时间：每个页面约 1-2 小时'));
  children.push(bullet('难度：⭐⭐（低，有模板可复用）'));
  spacer();

  // ── 3. Twitter ──
  children.push(h1('三、渠道二：Twitter/X 冷启动 ⭐⭐'));
  children.push(p('账号：@CompressFastApp → x.com/CompressFastApp'));
  children.push(p('核心逻辑：0 粉丝 → 借大号流量 → 高质量回复 → 点进主页 → 关注'));
  spacer();

  children.push(h3('阶段一：前 14 天 — 只回复，不推销'));
  children.push(bullet('每天搜关键词 → 找讨论帖 → 写有料回复'));
  children.push(bullet('搜索词：image compression tool / compress images / tinypng alternative / reduce image size / image too large'));
  children.push(bullet('回复目标：@levelsio @leeerob @shadcn @rauchg 等大号'));
  children.push(bullet('铁律：不提产品链接、不敷衍（Great thread!）、每条回复提供真价值'));
  children.push(bullet('时间：每天 15 分钟'));
  spacer();

  children.push(h3('阶段二：15-30 天 — 回复 + 原创'));
  children.push(bullet('每天 1 条原创推文 + 3-5 条回复'));
  children.push(bullet('原创必须配图（文字推文没人看）'));
  children.push(bullet('短句、小写、不活得像企业号'));
  spacer();

  children.push(h3('10 天内容日历'));
  children.push(bullet('Day 1 ✅ 视觉冲击：Before/After 对比图'));
  children.push(bullet('Day 2 ✅ 故事：NDA 客户→隐私卖点'));
  children.push(bullet('Day 3 ✅ 干货：JPEG 画质拐点（85% 最佳）'));
  children.push(bullet('Day 4 ⬜ 爆款：EXIF/GPS 隐私泄露'));
  children.push(bullet('Day 5 ⬜ 视觉：30 张 8 秒批量速度'));
  children.push(bullet('Day 6 ⬜ 对比：vs TinyPNG'));
  children.push(bullet('Day 7 ⬜ 复盘：周数据（真实数字）'));
  children.push(bullet('Day 8 ⬜ 干货：格式选择指南'));
  children.push(bullet('Day 9 ⬜ 技术：技术栈 $0 月成本'));
  children.push(bullet('Day 10 ⬜ 科普：GIF 是 1987 年的'));
  spacer();

  children.push(h3('回复模板（5 套，按场景选用）'));
  children.push(p('模板 A（有人问压缩工具推荐）：', { bold: true }));
  children.push(p('"Depends what you need. Speed+batch→TinyPNG. Full control→Squoosh. Privacy→CompressFast (browser-based, zero upload). Three paths, pick your poison."'));
  children.push(p('模板 B（有人说图片太大）：', { bold: true }));
  children.push(p('"Quick fix without installing anything: open compressfast.site, drag in, compress, download. Browser does the work. Takes 10 seconds."'));
  children.push(p('模板 C（讨论性能优化）：', { bold: true }));
  children.push(p('"Format choice matters more than quality slider. Photo→WebP or JPEG 85%. Logo→PNG. Modern sites→AVIF with picture fallback. Getting the format right gives 2x savings."'));
  spacer();

  // ── 4. Directories ──
  children.push(h1('四、渠道三：产品目录提交 ⭐⭐'));
  children.push(p('价值：一劳永逸。dofollow 外链对 Google 排名有长期价值。'));
  spacer();

  children.push(h3('提交状态'));
  const dirTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: ['目录', '域名权重', '状态'].map(c => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c, bold: true, size: 20 })] })] })) }),
      ...['AlternativeTo       DA 60+        ⏳ 7/18 提交（最高权重）',
        'SaaSHub             DA 40+        ✅ 已提交，等 1 月',
        'DevHunt              DA 35+        ✅ 已提交',
        'Uneed                DA 30+        ✅ 排队中',
        'Startup Stash        DA 20+        ✅ 已提交',
        'Tiny Startups        DA 15+        ✅ 已提交',
        'SideProjectors       DA 20+        ✅ 审核中',
      ].map(row => {
        const [name, da, status] = row.split(/\s{2,}/);
        return new TableRow({ children: [name, da, status].map(c => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c, size: 20 })] })] })) });
      }),
    ],
  });
  children.push(dirTable);
  spacer();
  children.push(bullet('🔴 7/18 必做：提交 AlternativeTo（放在桌面日历提醒）'));
  children.push(bullet('BeBetaList / MicroLaunch：要钱，已跳过'));
  children.push(bullet('Peerlist：流程复杂（需实名验证+每周一发），跳过'));
  spacer();

  // ── 5. Reddit ──
  children.push(h1('五、渠道四：Reddit 社区 ⭐（长期埋伏）'));
  children.push(p('策略：前 4 周只帮忙，不提产品。Reddit 用户对推销零容忍。'));
  children.push(bullet('加入：r/webdev r/web_design r/SEO r/WordPress r/SideProject'));
  children.push(bullet('每天 15 分钟搜帖 → 有料回复'));
  children.push(bullet('回复末尾可加："I\'m building an image compression tool, happy to answer questions"'));
  children.push(bullet('4 周后再发帖正式介绍产品'));
  children.push(bullet('难度：⭐⭐（中，需要耐心积累社区信用）'));
  spacer();

  // ── 6. Daily ──
  children.push(h1('六、每日执行清单'));
  children.push(p('每天打开电脑，花 20 分钟先做前 3 件事，再做开发：'));
  spacer();
  children.push(p('□ 1. Twitter 发推文（按日历）                     5 min', { bold: true }));
  children.push(p('□ 2. Twitter 搜关键词回复 3 条                   10 min', { bold: true }));
  children.push(p('□ 3. 检查 compressfast.site/admin 数据             5 min', { bold: true }));
  children.push(p('□ 4. 检查产品目录审核状态（特别关注 AlternativeTo）'));
  children.push(p('□ 5. Reddit 搜帖回复（不提产品，纯帮忙）          15 min'));
  children.push(p('□ 6. SEO 工具页开发（每 1-2 周 1 个）           30-60 min'));
  spacer();

  // ── 7. Not Do ──
  children.push(h1('七、明确不做的事'));
  children.push(bullet('❌ 花钱投广告 — 没数据验证前 = 烧钱'));
  children.push(bullet('❌ 涨价 — 保持 $24.99，等有 50+ 付费用户再说'));
  children.push(bullet('❌ WP 插件 / Figma 插件 / Chrome 扩展 — 审核拉锯战，分散精力'));
  children.push(bullet('❌ 同时追 10 个渠道 — 前 3 个月只聚焦 SEO + Twitter + 目录'));
  children.push(bullet('❌ Reddit 直接发链接 — 会秒删封号'));
  children.push(bullet('❌ API 服务 — 没有用户系统基础'));
  spacer();

  // ── 8. Principles ──
  children.push(h1('八、核心原则'));
  children.push(bullet('获客 > 变现。没有流量，一切为零。'));
  children.push(bullet('工具页 > 博客。转化率高 3 倍。'));
  children.push(bullet('Twitter：80% 帮别人 + 20% 提自己。'));
  children.push(bullet('前 3 个月可能零收入 — 这是正常的，TinyPNG 花了 10 年积累 450 万用户。'));
  children.push(bullet('口号：Zero upload. Zero worry.'));
  children.push(bullet('每天稳定输出 1-2 小时 > 偶尔一天干 8 小时。'));
  spacer();

  return children;
}

// ═══════════════════════════════════════════
//  CN Plan
// ═══════════════════════════════════════════
function buildCNDoc() {
  const children = [];

  const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 200 }, children: [new TextRun({ text, bold: true, size: 32, color: 'c2410c' })] });
  const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 }, children: [new TextRun({ text, bold: true, size: 26, color: 'b91c1c' })] });
  const h3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 80 }, children: [new TextRun({ text, bold: true, size: 22 })] });
  const p = (text, opts = {}) => new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, size: 21, ...opts })] });
  const bullet = (text) => new Paragraph({ spacing: { after: 60 }, bullet: { level: 0 }, children: [new TextRun({ text, size: 21 })] });
  const spacer = () => new Paragraph({ spacing: { after: 80 }, children: [] });

  // ── Title ──
  children.push(new Paragraph({
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: '极速压图 国内版', size: 40, bold: true, color: 'c2410c' })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: '获客推广执行计划 · 2026年7月-10月', size: 24, color: '64748b' })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
    children: [
      new TextRun({ text: '域名：jisuyatu.com  |  服务器：阿里云轻量应用服务器 广州  |  ICP备案：已通过 ✅', size: 20, color: '64748b' }),
    ],
  }));

  // ── 1. Status ──
  children.push(h1('一、当前状态'));
  children.push(bullet('域名：jisuyatu.com（ICP 备案已通过 ✅，公安备案审核中）'));
  children.push(bullet('服务器：阿里云轻量应用服务器，广州，890MB 内存'));
  children.push(bullet('部署：Nginx → localhost:3000，PM2 管理进程'));
  children.push(bullet('SSL：Let\'s Encrypt 证书（10 月 7 日到期，自动续期）'));
  children.push(bullet('百度联盟广告：被驳回 ❌（原因：流量不足 + 域名太新）'));
  children.push(bullet('百度统计：已接入 ✅'));
  children.push(bullet('流量：极少（新域名，百度沙盒期）'));
  children.push(bullet('功能：全部免费，30 张/次批量，无需登录'));
  spacer();

  children.push(p('国内版核心定位：', { bold: true }));
  children.push(bullet('全免费工具 → 积累流量 → 百度联盟广告变现'));
  children.push(bullet('不做付费功能（国内用户无付费意愿）'));
  children.push(bullet('不额外投入获客精力，靠搜索自然增长'));
  spacer();

  // ── 2. Baidu SEO ──
  children.push(h1('二、渠道一：百度 SEO ⭐⭐⭐（核心渠道）'));
  children.push(p('国内搜索流量完全依赖百度。Google 在国内没有市场份额。'));
  spacer();

  children.push(h3('2.1 百度站长平台（必做）'));
  children.push(bullet('网址：ziyuan.baidu.com'));
  children.push(bullet('Sitemap：已提交 jisuyatu.com/sitemap.xml ✅'));
  children.push(bullet('手动提交 URL：每周提交新页面'));
  children.push(bullet('第一批 10 条已提交 ✅'));
  children.push(bullet('第二批 12 条待提交（见桌面 百度手动提交URL列表.txt）'));
  children.push(bullet('检查收录：百度搜 site:jisuyatu.com'));
  spacer();

  children.push(h3('2.2 页面优化（百度偏好）'));
  children.push(bullet('百度爬虫需要 SSR 内容 → 首页 SSR 占位已完成 ✅'));
  children.push(bullet('百度联盟验证 meta 标签 + bdunion.txt → 已配置 ✅'));
  children.push(bullet('页面 Title 含中文关键词（已内置中英文双语 metadata）'));
  children.push(bullet('备案号已在 Footer 展示（百度对备案站更友好）'));
  spacer();

  children.push(h3('2.3 百度 SEO 特点'));
  children.push(bullet('新站有 3-6 个月观察期，排名不会立刻起来'));
  children.push(bullet('百度对工具站比内容站审核更严'));
  children.push(bullet('百度更偏好：备案站 > 未备案站、站内原创内容 > 聚合页'));
  children.push(bullet('百度不认 dofollow/nofollow 外链概念，但导航站收录仍有用'));
  spacer();

  // ── 3. Zhihu ──
  children.push(h1('三、渠道二：知乎内容营销 ⭐⭐'));
  children.push(p('知乎在百度搜索中有极高权重。一篇好的知乎回答可能带来数年持续流量。'));
  spacer();

  children.push(h3('3.1 策略'));
  children.push(bullet('搜索"图片压缩"相关问题 → 写高质量专业回答'));
  children.push(bullet('回答末尾自然放置 jisuyatu.com（不要太硬）'));
  children.push(bullet('一篇文章写好后可以在多个相关问题下复用'));
  spacer();

  children.push(h3('3.2 目标问题（高浏览量）'));
  children.push(bullet('"有没有好用的免费图片压缩工具？"'));
  children.push(bullet('"如何在不损失画质的情况下压缩图片？"'));
  children.push(bullet('"网页加载太慢，图片怎么优化？"'));
  children.push(bullet('"PNG 和 JPEG 哪个更适合网页？"'));
  children.push(bullet('"TinyPNG 的替代品有哪些？"'));
  spacer();

  children.push(h3('3.3 执行节奏'));
  children.push(bullet('每月写 2-3 条知乎回答'));
  children.push(bullet('每条约 500-1000 字，配截图'));
  children.push(bullet('写完后把链接记下来，跟踪浏览量'));
  children.push(bullet('时间：每条约 30-60 分钟'));
  children.push(bullet('难度：⭐⭐（中，需要写好内容）'));
  spacer();

  // ── 4. Baidu Ads ──
  children.push(h1('四、渠道三：百度联盟广告（等流量达标后再申）'));
  children.push(p('2026-07-13 被驳回。原因：网站流量不足 + 域名太新 + 百度收录待确认。'));
  children.push(p('百度联盟要求：域名注册 >1 个月 + 已被百度收录 + 有一定流量。'));
  children.push(p('当前 jisuyatu.com 不满足流量条件 → 先做流量，后申联盟。'));
  spacer();

  children.push(h3('重新提交条件'));
  children.push(bullet('1. 域名满 1 个月 → 预计 7 月底/8 月初满足'));
  children.push(bullet('2. 百度收录 → 检查 site:jisuyatu.com，持续提交 URL'));
  children.push(bullet('3. 日均 UV 100+ → 靠知乎 + SEO + 导航站积累'));
  children.push(bullet('预计最早可重新提交：8 月中下旬'));
  spacer();

  children.push(h3('通过后的收益预估'));
  const adTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: ['日均 UV', '日均广告收入', '月收入'].map(c => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c, bold: true, size: 20 })] })] })) }),
      ...['100          ￥6 左右         ￥180',
        '500          ￥30 左右        ￥900',
        '1000         ￥60 左右        ￥1800',
        '5000         ￥300 左右       ￥9000',
      ].map(row => new TableRow({ children: row.split(/\s{2,}/).map(c => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c, size: 20 })] })] })) })),
    ],
  });
  children.push(adTable);
  spacer();

  // ── 5. Nav Sites ──
  children.push(h1('五、渠道四：导航站提交 ⭐'));
  children.push(p('国内工具导航站虽然单个流量小，但提交成本为零，外链积少成多。'));
  spacer();

  children.push(h3('已提交'));
  children.push(bullet('nav3.cn ✅'));
  children.push(bullet('新趣集 ✅'));
  children.push(bullet('Toolin.ai ✅'));
  children.push(bullet('Turbo0 ✅'));
  children.push(bullet('Solo 社区 ✅'));
  children.push(bullet('即刻 ✅'));
  children.push(bullet('RustPoint ✅'));
  spacer();

  children.push(h3('待补充（如有时间）'));
  children.push(bullet('总统网址导航'));
  children.push(bullet('AIGC 工具导航 aigc.cn'));
  children.push(bullet('优设导航 hao.uisdc.com（需人工联系编辑）'));
  spacer();

  // ── 6. Daily ──
  children.push(h1('六、每日执行清单'));
  children.push(p('国内版每天花 15 分钟，不耽误海外版：'));
  spacer();
  children.push(p('□ 1. 百度 ziyuan.baidu.com 检查收录状态', { bold: true }));
  children.push(p('□ 2. 有新页面 → 手动提交 URL', { bold: true }));
  children.push(p('□ 3. 知乎搜"图片压缩"→ 有问题就写回答', { bold: true }));
  children.push(p('□ 4. 检查百度联盟审核状态'));
  children.push(p('□ 5. 检查公安备案审核状态'));
  spacer();

  // ── 7. Milestones ──
  children.push(h1('七、30/60/90 天里程碑'));
  const cnMilestones = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: ['时间', '目标', '动作'].map(c => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c, bold: true, size: 20 })] })] })) }),
      ...['30 天（8/15）   百度联盟审核通过        替换 AdSlot 为真实广告；知乎写 3 条回答',
        '60 天（9/15）   日均 UV 50-100          继续导航站提交；知乎共 6 条回答',
        '90 天（10/15）  日均 UV 100-300         评估广告收入；考虑是否做微信小程序 MVP',
      ].map(row => new TableRow({ children: row.split(/\s{2,}/).map(c => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c, size: 20 })] })] })) })),
    ],
  });
  children.push(cnMilestones);
  spacer();

  // ── 8. Not Do ──
  children.push(h1('八、明确不做的事'));
  children.push(bullet('❌ 国内版做付费功能 — 国内用户无付费意愿'));
  children.push(bullet('❌ 微信小程序 — 架构冲突（Web Worker 不能用），开发量大'));
  children.push(bullet('❌ 企业定制 — 没有销售渠道，不是短期可执行的'));
  children.push(bullet('❌ 大规模推广 — 先等百度联盟通过、流量稳定'));
  children.push(bullet('❌ 国内版投放广告买量 — ROI 不划算'));
  spacer();

  return children;
}

// ═══════════════════════════════════════════
//  Generate both
// ═══════════════════════════════════════════
async function main() {
  const overseasDoc = new Document({
    sections: [{ properties: { page: { margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 } } }, children: buildOverseasDoc() }],
  });
  const cnDoc = new Document({
    sections: [{ properties: { page: { margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 } } }, children: buildCNDoc() }],
  });

  const overseasBuf = await Packer.toBuffer(overseasDoc);
  const cnBuf = await Packer.toBuffer(cnDoc);

  const ts = Date.now();
  fs.writeFileSync(path.join(desktop, `海外版-获客推广计划-${ts}.docx`), overseasBuf);
  fs.writeFileSync(path.join(desktop, `国内版-获客推广计划-${ts}.docx`), cnBuf);

  console.log('✅ 桌面/海外版-获客推广计划.docx');
  console.log('✅ 桌面/国内版-获客推广计划.docx');
}

main().catch(e => { console.error(e); process.exit(1); });
