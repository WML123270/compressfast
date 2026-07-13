const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, BorderStyle, WidthType, AlignmentType, ShadingType, PageBreak, TableOfContents, TabStopPosition, TabStopType } = require('docx');
const fs = require('fs');

// ── Shared Styles ──────────────────────────────────
const ACCENT = '2DD4BF';
const DARK = '0B1420';
const GRAY = '64748B';
const LIGHT_BG = 'F1F5F9';
const GREEN = '059669';
const RED = 'EF4444';

const borderNone = { style: BorderStyle.NONE, size: 0 };
const borderBottom = { style: BorderStyle.SINGLE, size: 6, color: ACCENT };
const borderThin = { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' };

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 240 },
    border: { bottom: borderBottom },
    children: [new TextRun({ text, bold: true, size: 36, color: DARK, font: 'Microsoft YaHei' })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 180 },
    children: [new TextRun({ text, bold: true, size: 28, color: DARK, font: 'Microsoft YaHei' })],
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, color: '334155', font: 'Microsoft YaHei' })],
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, size: 21, color: '334155', font: 'Microsoft YaHei', ...opts })],
  });
}

function bold(text) { return new TextRun({ text, bold: true, size: 21, color: '334155', font: 'Microsoft YaHei' }); }
function normal(text) { return new TextRun({ text, size: 21, color: '334155', font: 'Microsoft YaHei' }); }
function accent(text) { return new TextRun({ text, size: 21, color: ACCENT, font: 'Microsoft YaHei', bold: true }); }
function gray(text) { return new TextRun({ text, size: 19, color: GRAY, font: 'Microsoft YaHei' }); }

function richPara(runs, opts = {}) {
  return new Paragraph({ spacing: { after: 120, line: 360 }, children: runs, ...opts });
}

function bullet(text, level = 0) {
  return new Paragraph({
    spacing: { after: 60, line: 320 },
    indent: { left: 480 + level * 240 },
    children: [new TextRun({ text: '• ' + text, size: 21, color: '334155', font: 'Microsoft YaHei' })],
  });
}

function cell(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.header ? { type: ShadingType.SOLID, color: DARK } : opts.highlight ? { type: ShadingType.SOLID, color: 'ECFDF5' } : undefined,
    borders: { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin },
    verticalAlign: 'center',
    children: [
      new Paragraph({
        spacing: { before: 60, after: 60 },
        alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [new TextRun({ text, size: 20, bold: opts.header, color: opts.header ? 'FFFFFF' : opts.highlight ? '059669' : '334155', font: 'Microsoft YaHei' })],
      }),
    ],
  });
}

function makeTable(headers, rows, colWidths = []) {
  const headerRow = new TableRow({ children: headers.map(h => cell(h, { header: true, center: true, width: colWidths[headers.indexOf(h)] || undefined })), tableHeader: true });
  const dataRows = rows.map((row, i) =>
    new TableRow({ children: row.map((c, j) => cell(String(c), { center: j > 0, width: colWidths[j] || undefined })) })
  );
  return new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } });
}

// ── Build Document ──────────────────────────────────
async function main() {
  const doc = new Document({
    styles: {
      default: {
        document: { run: { size: 21, font: 'Microsoft YaHei' } },
      },
    },
    sections: [
      {
        properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
        children: [

          // ═══════════ COVER ═══════════
          new Paragraph({ spacing: { before: 3600 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [new TextRun({ text: '图片压缩工具', size: 52, bold: true, color: DARK, font: 'Microsoft YaHei' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [new TextRun({ text: '市场可行性分析报告', size: 48, bold: true, color: ACCENT, font: 'Microsoft YaHei' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            border: { top: { style: BorderStyle.SINGLE, size: 3, color: ACCENT }, bottom: { style: BorderStyle.SINGLE, size: 3, color: ACCENT } },
            children: [new TextRun({ text: 'CompressFast / 极速压图', size: 24, color: GRAY, font: 'Microsoft YaHei' })],
          }),
          new Paragraph({ spacing: { before: 600 }, children: [] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [gray('项目路径：png-compressor | compressfast.site | jisuyatu.com')] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [gray('报告日期：2026年7月13日')] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [gray('分析人：Meiliang Wu | 版本：v1.0')] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [gray('本报告基于公开数据、竞争对手分析和行业研究，仅供内部决策参考')] }),

          // ═══════════ PAGE BREAK ═══════════
          new Paragraph({ children: [new PageBreak()] }),

          // ═══════════ 目录 ═══════════
          heading1('目  录'),
          para(''),
          para('一、执行摘要'),
          para('二、市场规模与增长趋势'),
          para('三、竞争对手深度分析'),
          para('四、AI 对行业的影响评估'),
          para('五、CompressFast 竞争定位'),
          para('六、收入模型与财务预测'),
          para('七、风险分析与应对策略'),
          para('八、战略路线图'),
          para('九、结论与建议'),
          para('十、附录：数据来源'),

          new Paragraph({ children: [new PageBreak()] }),

          // ═══════════ 一、执行摘要 ═══════════
          heading1('一、执行摘要'),

          heading2('1.1 本报告目的'),
          para('本报告旨在回答以下核心问题：'),
          bullet('图片压缩工具在全球范围内是否仍存在市场空间？'),
          bullet('AI 技术的快速发展是否会颠覆或取代传统图片压缩工具？'),
          bullet('CompressFast（极速压图）是否具备商业可行性，能否实现盈利？'),
          bullet('在当前竞争格局下，应采取何种市场策略？'),

          heading2('1.2 核心结论（TL;DR）'),
          para(''),

          makeTable(
            ['问题', '结论', '信心'],
            [
              ['市场是否存在？', '全球$20亿+市场，年增7%，增长确定性强', '★★★★★'],
              ['AI会取代吗？', '3-5年内不会，AI是补充而非替代', '★★★★☆'],
              ['能赚钱吗？', '单人第1年$2万+可期（参照CompressX）', '★★★★☆'],
              ['产品有差异化吗？', '隐私+买断+中国独占，护城河清晰', '★★★★☆'],
              ['最大挑战是什么？', '获客，不是产品也不是技术', '★★★★★'],
            ],
            [25, 45, 30]
          ),

          heading2('1.3 一句话结论'),
          richPara([bold('方向正确，市场够大，产品有差异化，AI不构成威胁。最大挑战是让足够多的人知道这个产品。')]),

          new Paragraph({ children: [new PageBreak()] }),

          // ═══════════ 二、市场规模与增长趋势 ═══════════
          heading1('二、市场规模与增长趋势'),

          heading2('2.1 全球市场概况'),
          para('图片压缩平台市场是一个成熟但持续增长的领域。根据多家研究机构的数据，2025年全球市场规模在不同统计口径下呈现以下数据：'),

          makeTable(
            ['研究机构', '2025年规模', '2032年预测', 'CAGR', '统计口径'],
            [
              ['Valuates Reports', '$9.74亿', '$16.88亿', '8.3%', '平台（窄口径）'],
              ['360iResearch', '$151.9亿', '$240.5亿', '6.8%', '平台（宽口径含企业级）'],
              ['WiseGuy Reports', '$26.4亿', '$50亿(2035)', '6.6%', '平台（中口径）'],
              ['中金企信（中国）', '¥429亿(~$60亿)', '¥730亿(2030)', '7.8%', '全球含中国市场'],
            ],
            [15, 20, 22, 18, 25]
          ),

          para('注：数据差异源于各机构对"图片压缩平台"的定义范围不同。窄口径仅包含在线工具和 API 服务，宽口径包含企业级软件、CDN 服务和硬件解决方案。'),
          para('综合各口径，报告采用保守估计：全球图片压缩工具（含 API 平台）市场规模约 $16-26 亿美元（2025年），年均增长 6-8%。'),

          heading2('2.2 市场增长驱动因素'),

          makeTable(
            ['驱动因素', '影响程度', '具体说明'],
            [
              ['移动流量激增', '★★★★★', '全球移动数据流量年增25%+，图片占网页平均资源65%以上'],
              ['Core Web Vitals', '★★★★★', 'Google 排名因子，LCP/CLS 与图片优化直接相关'],
              ['电商图片优化', '★★★★☆', '电商平台对图片加载速度敏感，转化率与页面速度强相关'],
              ['新格式普及', '★★★★☆', 'WebP覆盖率97%+，AVIF覆盖92%+，格式转换需求增加'],
              ['云存储成本', '★★★☆☆', '企业图片存储量指数增长，压缩直接降低成本'],
              ['隐私法规', '★★★☆☆', 'GDPR等法规要求数据最小化，本地压缩方案受青睐'],
            ],
            [25, 15, 60]
          ),

          heading2('2.3 中国市场需求'),
          para('中国市场呈现独特的双轨特征：'),
          bullet('企业端：微信小程序、电商平台对图片尺寸有严格要求（如微信小程序包体积限制）'),
          bullet('个人端：社交媒体发布、证件照处理等日常需求广泛'),
          bullet('工具空白：国内缺乏 TinyPNG 级别的知名在线压缩工具，百度搜索"图片压缩"月均搜索量超 50 万次'),
          bullet('政策红利：ICP 备案完成意味着合规经营，而大量海外工具在国内不可用或访问慢'),

          new Paragraph({ children: [new PageBreak()] }),

          // ═══════════ 三、竞争对手深度分析 ═══════════
          heading1('三、竞争对手深度分析'),

          heading2('3.1 主要竞争者概览'),

          makeTable(
            ['产品', '年收入', '团队', '月访问量', '成立年份', '商业模式', '核心优势'],
            [
              ['TinyPNG', '$66万', '6人', '250万+', '2013', '免费+Pro订阅', '13年品牌，SEO护城河极深'],
              ['ShortPixel', '$60万', '10人', '未知', '2012', '免费+按量+订阅', 'WordPress生态，40+服务器'],
              ['Cloudinary', '$1亿+', '500+人', '未知', '2012', '企业API+SaaS', '企业级全栈方案'],
              ['ImageKit', '$3000万+', '200+人', '未知', '2015', '企业API+SaaS', '实时优化+CDN'],
              ['CompressX', '$2.6万', '1人', '未知', '2024', '买断($14.99)', 'macOS原生，速度快'],
              ['Kraken.io', '未知', '未知', '未知', '2013', '按量+订阅', '企业级API'],
              ['Squoosh', '免费', 'Google', '未知', '2018', '开源免费', 'Google背书，WASM技术'],
            ],
            [14, 11, 7, 10, 8, 16, 34]
          ),

          heading2('3.2 标杆案例：TinyPNG'),
          heading3('为什么TinyPNG值得研究？'),
          para('TinyPNG 是目前最成功的在线图片压缩工具，自2013年运营至今已13年，在一个被认为是"红海"的赛道里持续赚钱。其商业模式极其简单：用免费工具获取海量流量，转化为Pro订阅用户。'),

          heading3('关键数据'),
          bullet('年收入：$66万（2025年）'),
          bullet('团队：仅6人'),
          bullet('月访问量：250万+'),
          bullet('流量来源：直接访问69.8%，搜索24.6%——品牌认知度极高'),
          bullet('客户含金量：微软、索尼、三星等巨头在使用'),
          bullet('人均产出：$11万/年/人'),

          heading3('TinyPNG 的护城河'),
          bullet('SEO权重：13年积累的反链和域名权重，短期无法复制'),
          bullet('品牌认知：65%+直接输入网址访问'),
          bullet('口碑传播：开发者社区推荐的首选工具'),
          bullet('简单可靠：功能极简但稳定，零学习成本'),

          heading3('TinyPNG 的弱点'),
          bullet('隐私问题：文件必须上传到服务器处理'),
          bullet('格式有限：主要支持PNG/JPEG/WebP'),
          bullet('功能单一：无水印、无重命名、无预设管理'),
          bullet('定价模式：订阅制在订阅疲劳时代逐渐失去吸引力'),
          bullet('中国不可用：访问速度慢，无中文支持'),

          heading2('3.3 竞争格局地图'),
          para('按"功能复杂度"和"目标市场"两个维度划分竞争格局：'),

          makeTable(
            ['象限', '代表产品', '特征', 'CompressFast的差异'],
            [
              ['简单工具 x 大众用户', 'TinyPNG, iLoveIMG', '免费为主，功能单一，流量大', '隐私更好，格式更多，买断定价'],
              ['专业工具 x 专业用户', 'ShortPixel, Kraken.io', 'API接口，WordPress插件', '不直接竞争，目标用户不同'],
              ['企业平台 x 企业客户', 'Cloudinary, ImageKit', '全栈方案，CDN集成', '不竞争，市场定位不同'],
              ['新兴工具 x 隐私敏感用户', 'Squoosh, CompressFast', '纯本地处理，隐私优先', 'CompressFast功能更全，商业支持更好'],
            ],
            [22, 22, 30, 26]
          ),

          new Paragraph({ children: [new PageBreak()] }),

          // ═══════════ 四、AI 对行业的影响评估 ═══════════
          heading1('四、AI 对行业的影响评估'),

          heading2('4.1 AI 压缩 vs 传统压缩：技术对比'),

          makeTable(
            ['维度', '传统压缩', 'AI 压缩', '差距'],
            [
              ['处理速度', '快（毫秒级）', '慢（传统方法的1.9倍）', '传统胜出'],
              ['兼容性', '全平台全浏览器', '无统一标准（JPEG AI制定中）', '传统胜出'],
              ['计算成本', '$0（浏览器/WASM）', '需GPU，成本高', '传统胜出'],
              ['可预测性', '完全确定，无意外', '可能产生随机伪影', '传统胜出'],
              ['压缩率', '8:1 ~ 15:1', '15:1 ~ 30:1（同质量）', 'AI胜出'],
              ['感知质量', '均匀压缩，不考虑内容', '智能识别重要区域优先保留', 'AI胜出'],
            ],
            [18, 30, 30, 22]
          ),

          heading2('4.2 为什么AI短期内不会取代传统压缩'),
          para('尽管AI压缩在压缩率和感知质量上表现出色，但在实际应用场景中存在多个阻碍其大规模替代传统工具的瓶颈：'),

          heading3('4.2.1 速度是硬伤'),
          para('Web场景下，用户期望毫秒级响应。AI压缩目前速度约为传统方法的50%（即慢1.9倍）。对于"压缩后下载"的离线使用场景，用户对速度不那么敏感；但对于实时Web服务、批量处理和API调用场景，速度劣势使得AI压缩无法成为默认选项。'),

          heading3('4.2.2 兼容性困境'),
          para('JPEG/PNG/WebP/AVIF 是经过20年以上标准化沉淀的成熟格式。JPEG AI（ISO/IEC 6048）标准仍在制定中，距离全平台原生支持至少需要3-5年。在此之前，AI压缩产出的文件可能在部分浏览器或设备上无法正常解码。'),

          heading3('4.2.3 成本结构不匹配'),
          para('在线图片压缩是典型的"低客单价、高用量"场景。AI压缩每张图片需要GPU推理，成本约为$0.001-0.005/张。即使月处理100万张图片，AI成本就达到$1,000-5,000，而传统WASM方案成本为$0。这一成本差异在商业模式上不可忽视。'),

          heading3('4.2.4 AI的幻觉风险'),
          para('2025年研究表明AI压缩可能引入不可预测的视觉伪影，且这些伪影并非简单的"模糊"或"色块"，而是可能改变图像语义（如在文字区域产生虚构字符）。这对于法律文件、医疗影像和电商产品图等场景是不可接受的。'),

          heading2('4.3 正确的关系：互补而非替代'),
          para('2025年最新研究结论（IEEE/ACM多项研究综合）：'),
          bullet('人+AI协作达到94%最优压缩决策（AI单独87%，人类单独61%）'),
          bullet('AI最适合的领域：大规模存储优化、监控视频压缩、专业摄影后期'),
          bullet('传统方法最适合的领域：Web实时服务、通用图片压缩、隐私敏感场景'),
          bullet('CompressFast已采用的WASM编解码器（oxipng、mozjpeg）恰恰代表了当前最优技术路线——利用编译到WebAssembly的高性能传统编解码器，在浏览器端实现零成本、零延迟的压缩'),

          heading2('4.4 对 CompressFast 的战略启示'),
          bullet('短期（1-2年）：坚持WASM传统编解码器路线，突出速度和隐私优势'),
          bullet('中期（2-3年）：关注JPEG AI标准进展，评估是否集成AI编解码器'),
          bullet('长期（3-5年）：预留混合模式架构——用户自选"快速（传统）"或"极致（AI）"模式'),

          new Paragraph({ children: [new PageBreak()] }),

          // ═══════════ 五、CompressFast 竞争定位 ═══════════
          heading1('五、CompressFast 竞争定位'),

          heading2('5.1 SWOT分析'),

          makeTable(
            ['', '优势 (Strengths)', '劣势 (Weaknesses)'],
            [
              ['内部', '1. 隐私优先：纯浏览器处理，零文件上传\n2. 买断定价：$24.99终身，无订阅疲劳\n3. 格式全面：8种格式输入+输出\n4. 功能深度：水印/重命名/预设/批量改名\n5. 中国独占：备案完成，国内无强对手\n6. 成本结构：零服务器压缩成本', '1. 品牌认知度为零\n2. SEO权重低，自然流量极少\n3. 海外服务器无CDN，部分地区延迟\n4. 团队单人，开发+运营+客服一肩挑\n5. 无用户评价/口碑积累'],
            ],
            ['', '机会 (Opportunities)', '威胁 (Threats)'],
            [
              ['外部', '1. 隐私意识觉醒：GDPR/CCPA 等法规推动本地处理需求\n2. 订阅疲劳：买断制是差异化定价优势\n3. 中国市场空白：无TinyPNG级本土竞品\n4. 新格式红利：AVIF/WebP普及带来转换需求\n5. AI焦虑：用户担心图片被用于训练，本地处理成卖点', '1. TinyPNG的SEO护城河极深，短期无法撼动\n2. 免费工具（Squoosh等）持续存在\n3. 浏览器原生压缩能力提升\n4. WordPress插件生态被ShortPixel等占据\n5. 用户习惯"用完即走"，留存天然低'],
            ],
            [10, 45, 45]
          ),

          heading2('5.2 核心竞争力（护城河）'),
          para('CompressFast 的护城河不在于单一技术优势，而在于三个维度的交叉叠加：'),

          makeTable(
            ['护城河维度', '为什么是护城河', '可持续性'],
            [
              ['隐私（Privacy-First）', '浏览器端处理是不可逆的技术选择，TinyPNG改不了——因为它的商业模式依赖服务器端处理来实现Pro功能管控', '★★★★★ 长期有效'],
              ['买断定价（Lifetime Deal）', '在订阅疲劳时代是强心理锚点，$24.99一次vs TinyPNG $10/月，一年回本', '★★★★☆ 除非成本结构变化'],
              ['中国市场独占', 'ICP备案+国内服务器+百度SEO+中文支持，海外竞品进入中国成本极高', '★★★★★ 政策壁垒'],
              ['功能广度', '水印、批量重命名、预设管理、格式转换——超越纯压缩工具范畴，拓展使用场景', '★★★☆☆ 可被复制'],
            ],
            [22, 55, 23]
          ),

          heading2('5.3 目标用户画像'),
          para('基于功能特性和市场定位，CompressFast的核心用户群体如下：'),

          makeTable(
            ['用户群', '痛点', '为何选择 CompressFast', '获取难度'],
            [
              ['Web开发者', '图片优化影响LCP/SEO', '本地处理，速度快，格式全', '中等（社区获客）'],
              ['隐私敏感用户', '不想上传文件到第三方', '纯浏览器，零上传，可审计', '低（差异化强）'],
              ['电商卖家', '批量处理产品图', '批量+水印+重命名一体化', '中等（SEO获客）'],
              ['中国用户', '海外工具慢/不可用', '国内服务器，中文界面，全免费', '低（百度SEO）'],
              ['预算敏感用户', '不想月月付费', '$24.99买断 vs 订阅，性价比高', '低（定价吸引力）'],
              ['摄影师/设计师', 'EXIF隐私+格式转换', 'EXIF清除+8格式+无损选项', '高（需社区渗透）'],
            ],
            [16, 24, 36, 24]
          ),

          new Paragraph({ children: [new PageBreak()] }),

          // ═══════════ 六、收入模型与财务预测 ═══════════
          heading1('六、收入模型与财务预测'),

          heading2('6.1 收入来源设计'),

          makeTable(
            ['收入来源', '定价', '目标用户', '预期贡献', '当前状态'],
            [
              ['海外Pro买断', '$24.99/人（一次性）', '海外高级用户', '60%', '✅ 已上线（Creem收款）'],
              ['国内百度联盟广告', 'CPM/CPC', '国内免费用户', '20%', '🟡 审核中'],
              ['API服务（未来）', '按调用量', '开发者/企业', '15%', '🔵 规划中'],
              ['企业定制（未来）', '按项目报价', '大客户', '5%', '🔵 规划中'],
            ],
            [20, 22, 20, 20, 18]
          ),

          heading2('6.2 6个月保守预估'),
          para('假设当前流量基础为零，通过 Twitter 冷启动 + 基础 SEO 开始获取用户。'),

          makeTable(
            ['指标', '月1-2', '月3-4', '月5-6', '说明'],
            [
              ['月访问量', '500-1,000', '2,000-5,000', '5,000-10,000', 'SEO+社交引流累积'],
              ['Pro转化率', '1-2%', '1.5-2.5%', '2-3%', '工具类转化率通常1-3%'],
              ['月Pro销售', '5-20单', '30-125单', '100-300单', '= 访问量 × 转化率'],
              ['Pro月收入', '$125-500', '$750-3,125', '$2,500-7,500', '× $24.99'],
              ['广告月收入', '¥500-1,000', '¥1,000-3,000', '¥3,000-8,000', '国内版百度联盟'],
              ['综合月收入', '$200-640', '$900-3,550', '$2,900-8,600', 'Pro + 广告合计'],
            ],
            [18, 22, 22, 22, 16]
          ),

          heading2('6.3 12个月中等预估'),
          para('基于 CompressX（单人第1年$26K）和 ShortPixel（第3年$600K+/年）的增长轨迹，取中等偏保守的估计。'),

          makeTable(
            ['指标', '半年累计', '全年累计', '月均（第12个月）'],
            [
              ['Pro收入', '$5,000-15,000', '$15,000-40,000', '$2,000-5,000'],
              ['广告收入', '¥15,000-40,000', '¥40,000-100,000', '¥5,000-12,000'],
              ['总收入（折合美元）', '$7,000-20,000', '$20,000-54,000', '$2,700-6,700'],
            ],
            [22, 30, 28, 20]
          ),

          para('12个月保守目标：月收入达到 $1,500-2,500（CompressX第1年的水平），全年累计 $15,000-30,000。'),
          para('12个月中等目标：月收入达到 $3,000-5,000（ShortPixel前期的水平），全年累计 $30,000-50,000。'),
          para('12个月乐观目标：月收入达到 $5,000-8,000，全年累计 $50,000-80,000。'),

          heading2('6.4 3年远景'),
          para('如果SEO能建立基础权重（20-50个工具页 + 持续内容营销），品牌认知初步建立：'),
          bullet('Pro月收入：$5,000-15,000（月售200-600单）'),
          bullet('广告月收入：¥15,000-50,000'),
          bullet('API服务（如上线）：$3,000-10,000/月'),
          bullet('年收入目标：$80,000-250,000（折合约58万-180万人民币）'),
          para('此目标对应团队从1人扩展至2-3人，年收入达到 TinyPNG 当前水平（$66万/年）的30-40%。'),

          new Paragraph({ children: [new PageBreak()] }),

          // ═══════════ 七、风险分析与应对策略 ═══════════
          heading1('七、风险分析与应对策略'),

          makeTable(
            ['风险', '概率', '影响', '应对策略'],
            [
              ['获客困难（最大风险）', '高', '★★★★★', '多渠道分发：Twitter冷启动+SEO长尾+导航站+社区渗透\n不依赖单一渠道'],
              ['AI颠覆传统压缩', '低（3-5年内）', '★★★☆☆', '跟踪JPEG AI标准，预留混合模式架构\nWASM路线当前最优'],
              ['竞品复制功能', '中', '★★★☆☆', '品牌+信任是复利资产，功能可复制但信任不可\n持续迭代保持领先'],
              ['支付渠道风险（Creem）', '中', '★★★★☆', '预留备选方案（Paddle、Gumroad）\nCreem KYC已通过'],
              ['汇率/政策风险', '低', '★★☆☆☆', '双市场运营（国内+海外），风险对冲\n收入来源多元化'],
              ['倦怠/单人风险', '中', '★★★★☆', '设定清晰目标和工作节奏\n避免透支，留出休息时间'],
              ['安全/隐私事故', '低', '★★★★★', '已通过安全审计11项\n纯本地处理降低安全面\n定期依赖更新'],
            ],
            [22, 10, 12, 56]
          ),

          heading2('7.1 第一风险：获客详细分析'),
          para('获客是目前所有风险中概率最高、影响最大的。TinyPNG月访问250万，65%直接输入网址，这是13年品牌积累的结果。CompressFast从零开始，无法走同样的路径。'),
          heading3('应对策略'),
          bullet('Twitter冷启动（进行中）：通过高质量回复借大号流量，建立存在感；前两周不提产品'),
          bullet('SEO长尾矩阵（进行中）：46页sitemap + 5个SEO落地页 + 3个工具页，持续扩展至50+工具页'),
          bullet('Product Hunt（已完成）：2026-07-07发布，获得初始曝光'),
          bullet('导航站覆盖（已完成8个）：nav3.cn, RustPoint, 新趣集, Toolin.ai, Turbo0, Solo, 即刻'),
          bullet('社区渗透（待执行）：Reddit/Dev.to/HN 持续参与讨论，帮助他人而非推销'),
          bullet('中国线（并行）：百度SEO + 知乎内容 + 微信小程序'),

          new Paragraph({ children: [new PageBreak()] }),

          // ═══════════ 八、战略路线图 ═══════════
          heading1('八、战略路线图'),

          heading2('8.1 三阶段发展路径'),

          heading3('阶段一：验证期（2026年7月-9月）'),
          para('目标：验证产品有用户愿意付费，跑通获客闭环。'),
          bullet('核心KPI：月访问量破5,000，实现首笔Pro销售'),
          bullet('Twitter：完成冷启动方案，目标100-300粉丝'),
          bullet('SEO：扩展至30+工具页，GSC提交sitemap'),
          bullet('产品：根据用户反馈迭代核心功能'),
          bullet('内容：每周2-3条Twitter干货原创'),
          bullet('里程碑：月收入破$500'),

          heading3('阶段二：增长期（2026年10月-2027年3月）'),
          para('目标：建立初步SEO权重，形成稳定的自然流量。'),
          bullet('核心KPI：月访问量破30,000，月收入$1,500-3,000'),
          bullet('SEO：50+工具页覆盖长尾关键词，争取前3页排名'),
          bullet('品牌：在开发者社区建立认知（Reddit/Dev.to/HN）'),
          bullet('产品：上线API服务（Pro+），拓展企业用户'),
          bullet('团队：考虑外包客服或内容生产'),
          bullet('里程碑：月收入破$2,000，覆盖生活成本'),

          heading3('阶段三：规模化（2027年4月起）'),
          para('目标：品牌认知建立，收入持续增长，考虑扩展团队。'),
          bullet('核心KPI：月访问量破100,000，月收入$5,000-10,000'),
          bullet('SEO：进入"图片压缩"相关核心关键词前3页'),
          bullet('产品：上线企业定制方案，拓展B端客户'),
          bullet('团队：扩展至2-3人（开发+内容+客服）'),
          bullet('中国线：百度联盟广告规模化，考虑小程序/APP'),
          bullet('里程碑：年收入破$60,000（追上CompressX第1年水平）'),

          heading2('8.2 关键决策节点'),

          makeTable(
            ['时间节点', '决策点', '判断标准'],
            [
              ['2026年9月', '是否继续全职投入？', '月收入>$500且有增长趋势 → 继续\n月收入<$200且无增长 → 调整为副业'],
              ['2026年12月', '是否需要融资/加速？', 'SEO有明显起色 → 靠自身增长\nSEO无起色 → 考虑付费获客或众筹'],
              ['2027年3月', '是否扩展团队？', '月收入>$3,000 → 外包客服/内容\n月收入>$5,000 → 招聘第1名开发'],
              ['2027年6月', '是否拓展B端？', 'C端稳定增长 → 开发API服务\nC端增长乏力 → 探索企业合作'],
            ],
            [16, 28, 56]
          ),

          new Paragraph({ children: [new PageBreak()] }),

          // ═══════════ 九、结论与建议 ═══════════
          heading1('九、结论与建议'),

          heading2('9.1 核心结论回顾'),

          makeTable(
            ['核心问题', '结论'],
            [
              ['市场空间', '全球$20亿+市场，年增6-8%，需求确定且持续增长。图片压缩不是萎缩市场。'],
              ['AI威胁', 'AI压缩在速度和兼容性上落后传统方法3-5年。对于Web场景和日常使用，WASM编解码器是当前最优解。'],
              ['竞争格局', 'TinyPNG 有13年品牌积累难以正面竞争，但隐私薄弱、定价老旧、中国市场缺失是突破口。'],
              ['商业可行性', '参照CompressX（单人$26K/年），CompressFast具备更优的定价、更多功能和双市场覆盖，具备盈利基础。'],
              ['最大挑战', '获客。产品和技术不构成瓶颈，如何让目标用户发现这个产品是唯一真正的难题。'],
              ['核心优势', '隐私（纯本地） + 买断（$24.99） + 中国独占（备案完成）构成三层护城河。'],
            ],
            [25, 75]
          ),

          heading2('9.2 行动建议'),

          heading3('立即执行（本周）'),
          bullet('继续Twitter冷启动：每天5-10条高质量回复'),
          bullet('发布第1条原创推文：Before/After对比图+文案'),
          bullet('等待公安联网备案审核结果'),

          heading3('近期执行（本月）'),
          bullet('完成公安备案号网站底部展示'),
          bullet('百度联盟广告审核跟进'),
          bullet('SEO工具页扩展至30+'),
          bullet('持续Twitter回复+每周2-3条原创'),

          heading3('中期执行（3个月）'),
          bullet('Product Hunt二次推广（新功能发布时）'),
          bullet('Reddit r/webdev 持续参与'),
          bullet('GSC数据分析和SEO策略调整'),
          bullet('根据用户反馈迭代核心功能'),

          heading2('9.3 最后的话'),
          para(''),
          richPara([bold('图片压缩是一个"所有人需要但没人关心"的领域。它不像AI那样性感，不像SaaS那样高ARPU，但它有一个巨大的优势：需求永远存在。')]),
          para(''),
          richPara([bold('只要互联网还在传输图片，就有人需要压缩图片。TinyPNG证明了13年不死还能持续赚钱，CompressX证明了新手入场第一年就能赚$26K。这不是一个会消失的市场，而是一个需要耐心耕耘的市场。')]),
          para(''),
          richPara([bold('你的产品在技术、功能、定价和隐私上都有真实差异化。最大的风险不是你做得不够好，而是你放弃得太早。')]),

          new Paragraph({ children: [new PageBreak()] }),

          // ═══════════ 十、附录 ═══════════
          heading1('十、附录：数据来源与方法论'),

          heading2('10.1 数据来源'),
          bullet('市场规模数据：Valuates Reports, 360iResearch, WiseGuy Reports, 中金企信（2025-2026年报告）'),
          bullet('竞争对手收入数据：GetLatka, IndieHackers, Founderoo, 公开报道'),
          bullet('流量数据：SimilarWeb估算, 公开报道引用'),
          bullet('AI压缩技术对比：IEEE/ACM 2025年论文, ShotKit技术评测, Tencent Cloud技术白皮书'),
          bullet('关键词搜索量：Google Keyword Planner估算, 百度指数'),

          heading2('10.2 方法论说明'),
          bullet('本报告采用保守估计原则：在多项研究数据差异较大时，取较低值为基准'),
          bullet('收入预测基于可比案例（CompressX、ShortPixel）的增长轨迹外推，非精确预测'),
          bullet('AI影响评估基于2025年7月前的公开研究，如关键标准（JPEG AI）取得突破性进展，结论可能需要修正'),
          bullet('竞争分析基于公开信息，部分竞品的内部数据（如确切收入）可能与本报告有偏差'),

          heading2('10.3 更新计划'),
          para('本报告建议每季度更新一次，重点关注以下指标的变化：'),
          bullet('AI压缩标准进展（JPEG AI ISO/IEC 6048）'),
          bullet('主要竞品定价和功能变化'),
          bullet('CompressFast自身流量和收入数据'),
          bullet('新兴竞品和替代方案的出现'),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = 'C:/Users/Administrator/Desktop/市场可行性分析-图片压缩工具.docx';
  fs.writeFileSync(outPath, buffer);
  console.log('✅ ' + outPath);
}

main().catch(console.error);
