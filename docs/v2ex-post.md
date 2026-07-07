**标题**: [分享创造] 极速压图 — 纯本地图片压缩，支持 AVIF 输出，文件绝不上传

**正文**:

之前一直用 TinyPNG 压图，但公司项目的设计稿不太方便往别人服务器传。周末写了个工具自己用，打磨了两个月，现在分享出来。

## 核心亮点

**1. 纯本地处理，绝对隐私**
压缩全程在浏览器里完成，文件不会上传到任何服务器。断网也能正常用，打开 F12 网络面板看——零图片数据外发。

**2. 支持 AVIF 输出**
市面上支持 AVIF 编码的在线工具极少。同等画质下 AVIF 比 JPEG 小 50%，比 WebP 也小 20-30%。Chrome/Firefox/Safari 都已支持，覆盖率 95%。做网站、写博客省带宽利器。

**3. 功能全面**
- 📦 免费 30 张/次，Pro 500 张
- 🎨 7 种格式输入（PNG/JPEG/WebP/GIF/BMP/SVG/HEIC），5 种输出（含 AVIF）
- 🔧 画质/速度滑块 + 目标 KB 模式 + 无损压缩
- 📐 尺寸调整（像素 + 预设比例 50%/75%/1080p）
- 🔄 旋转/翻转 + 拖拽排序
- 🛡️ EXIF 隐私清除（照片 GPS/相机信息一键抹掉）
- 🎯 oxipng WASM 无损 PNG 压缩
- 🌙 暗色模式 + PWA（可装桌面当本地应用）
- 📋 Ctrl+V 粘贴截图直接压

**4. Pro 定价**
$24.99 一次性买断，不是订阅。买断后 500 张/次，自定义预设，去广告，5 设备。不需要注册账号——付款后发激活码到邮箱。

## 和 TinyPNG 的对比

做了个对比页：https://jisuyatu.com/zh/vs-tinypng

## 技术栈

Next.js 14 + Canvas API + Web Workers + WASM (oxipng + AVIF 编码器) + Zustand + TailwindCSS

## 链接

🔗 国内：https://jisuyatu.com
🌍 海外：https://compressfast.site

代码后续整理好考虑开源。

欢迎试用，有问题直接提 🙏
