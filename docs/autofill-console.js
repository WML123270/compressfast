/**
 * 极速压图 - 浏览器控制台自动填表脚本
 *
 * 用法：
 *   1. 在浏览器打开任意提交页面
 *   2. 按 F12 打开 DevTools → Console
 *   3. 复制下面的代码粘贴到 Console，按 Enter 执行
 *
 * 会自动识别表单字段并填充产品信息
 */

(function () {
  'use strict';

  const PRODUCT = {
    name: 'CompressFast',
    url: 'https://compressfast.site',
    shortDesc: 'Privacy-first image compression — zero upload, works offline',
    longDesc:
      'Free browser-based image compressor. 100% local processing — files never leave your device. Supports PNG, JPEG, WebP, AVIF, GIF, BMP, SVG, HEIC. Batch up to 30 images (500 with Pro). Built-in EXIF removal, watermark, resize, format conversion. Pro $24.99 one-time purchase, no subscription.',
    tags: 'image-compression, image-optimizer, web-performance, developer-tools, design-tools, privacy, batch-processing, tinypng-alternative',
    category: 'Developer Tools',
    email: 'support@compressfast.site',
    price: 'Free (Pro $24.99 lifetime)',
    twitter: '@CompressFastApp',
    competitors: 'TinyPNG, Squoosh, iLoveIMG',
  };

  // 字段名 → 值的模糊匹配规则
  const RULES = [
    { keys: ['name', 'title', 'product_name', 'productname', 'site_name', 'app_name'], val: PRODUCT.name },
    { keys: ['url', 'website', 'link', 'site', 'product_url', 'homepage'], val: PRODUCT.url },
    { keys: ['description', 'desc', 'summary', 'intro', 'introduction', 'bio'], val: PRODUCT.longDesc },
    { keys: ['short', 'brief', 'oneliner', 'slogan', 'tagline'], val: PRODUCT.shortDesc },
    { keys: ['tag', 'tags', 'keyword', 'keywords', 'label', 'labels'], val: PRODUCT.tags },
    { keys: ['category', 'cat', 'categories', 'type', '分类', '类别'], val: PRODUCT.category },
    { keys: ['email', 'contact', 'mail'], val: PRODUCT.email },
    { keys: ['price', 'pricing', '收费', '价格'], val: PRODUCT.price },
  ];

  function match(name, keys) {
    const n = name.toLowerCase();
    return keys.some((k) => n.includes(k));
  }

  let filled = 0;
  const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="file"]), textarea, select');

  for (const el of inputs) {
    const nameAttr = (el.getAttribute('name') || '').toLowerCase();
    const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
    const id = (el.id || '').toLowerCase();
    const label = el.closest('label')?.textContent?.toLowerCase() || '';
    const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
    const combined = nameAttr + ' ' + placeholder + ' ' + id + ' ' + label + ' ' + ariaLabel;

    for (const rule of RULES) {
      if (match(combined, rule.keys)) {
        try {
          if (el.tagName === 'SELECT') {
            // 对于 select，尝试匹配选项
            const options = Array.from(el.options);
            const match = options.find(
              (o) => o.text.toLowerCase().includes(rule.val.toLowerCase())
            );
            if (match) {
              el.value = match.value;
              el.dispatchEvent(new Event('change', { bubbles: true }));
              filled++;
            }
          } else {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              'value'
            )?.set;
            const nativeTextareaSetter = Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement.prototype,
              'value'
            )?.set;

            if (el.tagName === 'TEXTAREA' && nativeTextareaSetter) {
              nativeTextareaSetter.call(el, rule.val);
            } else if (nativeInputValueSetter) {
              nativeInputValueSetter.call(el, rule.val);
            } else {
              el.value = rule.val;
            }

            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            filled++;
          }

          console.log(
            `%c✓%c ${nameAttr || placeholder || id || el.tagName}: %c${rule.val.slice(0, 60)}...`,
            'color:green;font-weight:bold',
            'color:inherit',
            'color:#666'
          );

          el.style.border = '2px solid #22c55e';
          el.style.backgroundColor = '#f0fdf4';
        } catch (e) {
          console.warn(`✗ 填充失败: ${nameAttr || id}`, e.message);
        }
        break; // 匹配到一个规则后跳出
      }
    }
  }

  // 高亮未匹配的字段
  for (const el of inputs) {
    if (!el.style.border.includes('22c55e')) {
      const nameAttr = el.getAttribute('name') || el.id || '';
      console.log(
        `%c⚠ 未匹配%c ${el.tagName}: name="${nameAttr}" placeholder="${el.getAttribute('placeholder') || ''}"`,
        'color:orange',
        'color:inherit'
      );
    }
  }

  console.log(`\n%c✅ 已自动填充 ${filled}/${inputs.length} 个字段`, 'font-size:14px;color:green;font-weight:bold');
  console.log('%c💡 绿色边框 = 已填充 ｜ 请检查后手动提交', 'color:#666');

  // 特殊处理：如果有 file input（截图上传），高亮提示
  const fileInputs = document.querySelectorAll('input[type="file"]');
  if (fileInputs.length > 0) {
    console.log('%c📷 检测到文件上传字段，请手动上传产品截图', 'color:#3b82f6;font-weight:bold');
    for (const fi of fileInputs) {
      fi.style.border = '2px dashed #3b82f6';
      fi.style.padding = '4px';
    }
  }

  // 特殊处理：显示提交按钮
  const submitBtns = document.querySelectorAll(
    'button[type="submit"], input[type="submit"], button:has-text("提交"), button:has-text("Submit")'
  );
  if (submitBtns.length > 0) {
    console.log('%c📤 找到提交按钮，请检查后点击提交', 'color:#3b82f6;font-weight:bold');
  } else {
    console.log('%c⚠️ 未找到提交按钮，请手动查找', 'color:orange');
  }
})();
