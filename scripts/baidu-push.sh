#!/bin/bash
# ================================================================
# 极速压图 — 搜索引擎 URL 推送脚本
# 支持: 百度 (需 token) / Bing (已配置 API key)
#
# 百度 token 获取: https://ziyuan.baidu.com/ → 普通收录 → 手动提交
# ================================================================
set -e

DOMAIN_CN="jisuyatu.com"
DOMAIN_OS="compressfast.site"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# ─── 颜色 ────────────────────────────
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  极速压图 — SEO URL 推送${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ─── 1. 生成完整 URL 列表 ──────────────
echo -e "${GREEN}>>> [1/3] 生成 URL 列表${NC}"

URL_LIST="$PROJECT_DIR/test-results/baidu-urls-$(date +%Y%m%d).txt"

cat > "$URL_LIST" << 'URLEOF'
# 国内站 URL 列表 — 百度提交用
# 生成时间: $(date)
# 使用方法: 复制全部 URL → ziyuan.baidu.com → 普通收录 → 手动提交

# === 首页 ===
https://jisuyatu.com/
https://jisuyatu.com/zh
https://jisuyatu.com/en

# === 工具页总览 ===
https://jisuyatu.com/zh/tool
https://jisuyatu.com/en/tool

# === SEO 工具页 (中英双版) ===
https://jisuyatu.com/zh/tools/compress-png
https://jisuyatu.com/en/tools/compress-png
https://jisuyatu.com/zh/tools/compress-jpeg
https://jisuyatu.com/en/tools/compress-jpeg
https://jisuyatu.com/zh/tools/convert-to-webp
https://jisuyatu.com/en/tools/convert-to-webp
https://jisuyatu.com/zh/tools/compress-images
https://jisuyatu.com/en/tools/compress-images
https://jisuyatu.com/zh/tools/compress-gif
https://jisuyatu.com/en/tools/compress-gif
https://jisuyatu.com/zh/tools/resize-image
https://jisuyatu.com/en/tools/resize-image
https://jisuyatu.com/zh/tools/convert-jpg-to-png
https://jisuyatu.com/en/tools/convert-jpg-to-png
https://jisuyatu.com/zh/tools/webp-to-png
https://jisuyatu.com/en/tools/webp-to-png
https://jisuyatu.com/zh/tools/remove-metadata
https://jisuyatu.com/en/tools/remove-metadata
https://jisuyatu.com/zh/tools/tinypng-alternative
https://jisuyatu.com/en/tools/tinypng-alternative
https://jisuyatu.com/zh/tools/heic-to-jpg
https://jisuyatu.com/en/tools/heic-to-jpg
https://jisuyatu.com/zh/tools/heic-to-png
https://jisuyatu.com/en/tools/heic-to-png
https://jisuyatu.com/zh/tools/compress-svg
https://jisuyatu.com/en/tools/compress-svg
https://jisuyatu.com/zh/tools/png-to-jpg
https://jisuyatu.com/en/tools/png-to-jpg
https://jisuyatu.com/zh/tools/jpg-to-webp
https://jisuyatu.com/en/tools/jpg-to-webp
https://jisuyatu.com/zh/tools/png-to-webp
https://jisuyatu.com/en/tools/png-to-webp
https://jisuyatu.com/zh/tools/svg-to-png
https://jisuyatu.com/en/tools/svg-to-png
https://jisuyatu.com/zh/tools/webp-to-jpg
https://jisuyatu.com/en/tools/webp-to-jpg
https://jisuyatu.com/zh/tools/image-to-pdf
https://jisuyatu.com/en/tools/image-to-pdf

# === 其他页面 ===
https://jisuyatu.com/zh/about
https://jisuyatu.com/en/about
https://jisuyatu.com/zh/help
https://jisuyatu.com/en/help
https://jisuyatu.com/zh/contact
https://jisuyatu.com/en/contact
https://jisuyatu.com/zh/privacy
https://jisuyatu.com/en/privacy
https://jisuyatu.com/zh/terms
https://jisuyatu.com/en/terms
https://jisuyatu.com/zh/vs-tinypng
https://jisuyatu.com/en/vs-tinypng

# === Sitemap ===
https://jisuyatu.com/sitemap.xml
URLEOF

# Replace the date placeholder
CURRENT_DATE=$(date '+%Y-%m-%d %H:%M:%S')
sed -i "s/\$(date)/$CURRENT_DATE/" "$URL_LIST"

# Count URLs (skip comments and empty lines)
URL_COUNT=$(grep -c '^https://' "$URL_LIST")
echo -e "  ✅ 生成 ${GREEN}$URL_COUNT${NC} 个 URL → $URL_LIST"

# ─── 2. 百度 API 推送 ──────────────────
echo ""
echo -e "${GREEN}>>> [2/3] 百度推送${NC}"

# Try to find Baidu token
BAIDU_TOKEN=""
if [ -f "$PROJECT_DIR/.baidu-token" ]; then
  BAIDU_TOKEN=$(cat "$PROJECT_DIR/.baidu-token" | head -1)
fi

if [ -n "$BAIDU_TOKEN" ]; then
  echo "  🔑 找到百度 token: ${BAIDU_TOKEN:0:8}..."

  # Extract URLs (no comments, no empty lines)
  URLS=$(grep '^https://' "$URL_LIST" | tr '\n' '\n')

  RESPONSE=$(curl -s -X POST "http://data.zz.baidu.com/urls?site=$DOMAIN_CN&token=$BAIDU_TOKEN" \
    -H "Content-Type: text/plain" \
    --data "$URLS")

  echo "  百度响应: $RESPONSE"
else
  echo -e "  ${YELLOW}⚠️  未找到百度 token${NC}"
  echo ""
  echo "  获取 token 步骤:"
  echo "    1. 打开 https://ziyuan.baidu.com/"
  echo "    2. 登录 → 站点管理 → jisuyatu.com"
  echo "    3. 普通收录 → 手动提交 → 复制 token"
  echo "    4. 保存 token: echo '你的token' > .baidu-token"
  echo ""
  echo "  或者手动提交:"
  echo "    打开 https://ziyuan.baidu.com/linksubmit/url"
  echo "    粘贴 $URL_LIST 中的所有 URL"
fi

# ─── 3. Bing IndexNow 推送 ─────────────
echo ""
echo -e "${GREEN}>>> [3/3] Bing IndexNow 推送${NC}"

# Bing IndexNow API key (from .env.local or hardcoded)
BING_API_KEY=""
if [ -f "$PROJECT_DIR/.env.local" ]; then
  BING_API_KEY=$(grep BING_API_KEY "$PROJECT_DIR/.env.local" 2>/dev/null | cut -d= -f2 || echo "")
fi

# Also try the bing-verify API
if [ -n "$BING_API_KEY" ]; then
  echo "  Using Bing API key: ${BING_API_KEY:0:8}..."
fi

# Submit sitemap to Bing
echo "  Submitting sitemap to Bing..."
curl -s "https://www.bing.com/webmaster/ping?sitemap=https://$DOMAIN_CN/sitemap.xml" -o /dev/null && echo "  ✅ Bing sitemap pinged" || echo "  ⚠️  Bing ping failed"

# Also submit to Bing via IndexNow
URL_LIST_BING=$(grep '^https://' "$URL_LIST" | head -1)
curl -s -X POST "https://www.bing.com/indexnow" \
  -H "Content-Type: application/json" \
  -d "{\"host\":\"$DOMAIN_CN\",\"key\":\"${BING_API_KEY:-}\",\"keyLocation\":\"https://$DOMAIN_CN/bing-verify\",\"urlList\":[\"$URL_LIST_BING\"]}" \
  -o /dev/null 2>/dev/null && echo "  ✅ Bing IndexNow pinged" || echo "  ⚠️  Bing IndexNow skipped (no key)"

# ─── 完成 ──────────────────────────────
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ✅ URL 推送工具已完成${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "  URL 列表: $URL_LIST ($URL_COUNT 条)"
echo "  Sitemap:  https://$DOMAIN_CN/sitemap.xml"
echo ""
echo "  手动提交入口:"
echo "    百度: https://ziyuan.baidu.com/linksubmit/url"
echo "    Bing: https://www.bing.com/webmasters"
echo ""
echo "  一键推送 (设置 token 后):"
echo "    echo '你的百度token' > .baidu-token"
echo "    bash scripts/baidu-push.sh"
