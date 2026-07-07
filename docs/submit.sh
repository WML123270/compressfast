#!/bin/bash
# 极速压图 - 导航站批量提交助手
# 用法: bash docs/submit.sh [站点编号]
# 无参数时，依次打开所有提交页面

echo "========================================="
echo "  极速压图 - 导航站提交助手"
echo "========================================="
echo ""

# === 复制到剪贴板的通用文案 ===
INTRO_SHORT="极速压图是一款纯浏览器端图片压缩工具，文件不上传任何服务器，支持6种格式批量处理，永久免费。"
INTRO_LONG="极速压图是纯浏览器端运行的在线图片压缩工具。所有压缩在本地 Web Worker 中完成，文件不会上传到任何服务器——断网也能正常使用。支持 PNG/JPEG/WebP/GIF/BMP/SVG 六种格式，单次 100 张批量处理，三种预设档位一键压缩，画质实时预览，指定目标大小压缩，格式互转，一键 ZIP 打包下载。完全免费，无广告。"
URL="https://jisuyatu.com"
TAGS="图片压缩,在线工具,图片处理,设计工具,开发者工具,效率工具"

# === 各站点信息 ===
# 1: rustpoint.com
RUSTPOINT_URL="https://rustpoint.com/nav"
RUSTPOINT_CATEGORY="设计工具"
RUSTPOINT_DESC="纯浏览器端图片压缩工具，文件不上传服务器，支持6种格式(含PNG/JPEG/WebP/GIF/BMP/SVG)批量处理，单次100张，三种预设档位，永久免费。适合前端开发者、设计师、自媒体运营。"
RUSTPOINT_TAGS="图片压缩,在线工具,设计工具,效率工具,开发者工具"

# 2: nav3.cn
NAV3_URL="https://nav3.cn"
NAV3_DESC="纯浏览器端图片压缩工具，文件不上传，支持批量处理、格式互转，永久免费"

# 3: toolin.ai
TOOLIN_URL="https://toolin.ai"
TOOLIN_DESC="纯浏览器端本地图片压缩工具，文件不上传服务器。支持批量处理、智能压缩算法自动选择最佳参数、格式互转。永久免费。"

# 4: V2EX
V2EX_URL="https://v2ex.com/go/create"

# 5: 知乎 (搜索图片压缩相关问题)
ZHIHU_URL="https://www.zhihu.com/search?type=content&q=图片压缩工具推荐"

open_browser() {
  local url="$1"
  if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
    cmd //c start "$url" 2>/dev/null
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    open "$url" 2>/dev/null
  else
    xdg-open "$url" 2>/dev/null || echo "请手动打开: $url"
  fi
}

submit_rustpoint() {
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  📍 第 1 站：锈点导航 rustpoint.com"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "  🔗 正在打开: $RUSTPOINT_URL"
  echo ""
  echo "  📋 请复制以下内容到提交表单："
  echo ""
  echo "  ┌─ 名称 ─────────────────────────────"
  echo "  │ 极速压图"
  echo "  ├─ URL ──────────────────────────────"
  echo "  │ $URL"
  echo "  ├─ 分类 ─────────────────────────────"
  echo "  │ $RUSTPOINT_CATEGORY"
  echo "  ├─ 简介 ─────────────────────────────"
  echo "  │ $RUSTPOINT_DESC"
  echo "  ├─ 标签 ─────────────────────────────"
  echo "  │ $RUSTPOINT_TAGS"
  echo "  └─────────────────────────────────────"
  echo ""
  echo "  ⚠️  需要上传截图（首页+压缩结果）"
  echo ""
  open_browser "$RUSTPOINT_URL"
}

submit_nav3() {
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  📍 第 2 站：发现导航 nav3.cn"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "  🔗 正在打开: $NAV3_URL"
  echo ""
  echo "  📋 找到站内「提交收录」功能，填写："
  echo ""
  echo "  ┌─ 名称 ─────────────────────────────"
  echo "  │ 极速压图"
  echo "  ├─ URL ──────────────────────────────"
  echo "  │ $URL"
  echo "  ├─ 描述 ─────────────────────────────"
  echo "  │ $NAV3_DESC"
  echo "  └─────────────────────────────────────"
  echo ""
  open_browser "$NAV3_URL"
}

submit_toolin() {
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  📍 第 3 站：Toolin.ai"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "  🔗 正在打开: $TOOLIN_URL"
  echo ""
  echo "  📋 点击右上角「提交AI工具」按钮，填写："
  echo ""
  echo "  ┌─ 工具名称 ─────────────────────────"
  echo "  │ 极速压图"
  echo "  ├─ URL ──────────────────────────────"
  echo "  │ $URL"
  echo "  ├─ 简介 ─────────────────────────────"
  echo "  │ $TOOLIN_DESC"
  echo "  ├─ 价格 ─────────────────────────────"
  echo "  │ 免费"
  echo "  ├─ 分类 ─────────────────────────────"
  echo "  │ 设计工具 / 图片处理"
  echo "  └─────────────────────────────────────"
  echo ""
  open_browser "$TOOLIN_URL"
}

submit_v2ex() {
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  📍 第 4 站：V2EX 分享创造"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "  🔗 正在打开: $V2EX_URL"
  echo ""
  echo "  📋 标题（复制粘贴）："
  echo ""
  echo "  极速压图 - 一个纯浏览器端的图片压缩工具，文件完全不上传"
  echo ""
  echo "  📋 正文已复制到 docs/v2ex-post.md，请在浏览器中粘贴"
  echo "  或直接打开该文件复制全部内容"
  echo ""
  open_browser "$V2EX_URL"
}

submit_zhihu() {
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  📍 第 5 站：知乎"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "  🔗 正在打开: $ZHIHU_URL"
  echo ""
  echo "  📋 搜索「图片压缩工具推荐」相关问题"
  echo "  在回答中自然植入极速压图推荐"
  echo "  参考文案见 docs/submission-guide.md"
  echo ""
  open_browser "$ZHIHU_URL"
}

# === 主流程 ===
case "${1:-all}" in
  1) submit_rustpoint ;;
  2) submit_nav3 ;;
  3) submit_toolin ;;
  4) submit_v2ex ;;
  5) submit_zhihu ;;
  all|*)
    echo "正在依次打开所有提交页面..."
    echo ""
    submit_rustpoint
    echo ""
    read -p "按 Enter 继续下一个..." dummy
    submit_nav3
    echo ""
    read -p "按 Enter 继续下一个..." dummy
    submit_toolin
    echo ""
    read -p "按 Enter 继续下一个..." dummy
    submit_v2ex
    echo ""
    read -p "按 Enter 继续下一个..." dummy
    submit_zhihu
    ;;
esac

echo ""
echo "========================================="
echo "  ✅ 全部提交页面已打开"
echo "  请在各站点表单中粘贴对应内容"
echo "========================================="
