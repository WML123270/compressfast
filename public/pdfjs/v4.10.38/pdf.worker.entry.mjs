// 先装 polyfill，再执行 pdf.js worker（静态 import 按源码顺序求值）
import './promise-with-resolvers.mjs'
import './pdf.worker.min.mjs'
