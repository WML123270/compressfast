=== CompressFast ===
Contributors: compressfast
Tags: compress images, image optimization, webp, reduce image size, page speed
Requires at least: 5.8
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.0.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Compress images automatically on upload. Reduce file sizes by up to 80% — all on your server, no external API. Supports JPEG, PNG, WebP.

== Description ==

CompressFast automatically optimizes your images when you upload them to WordPress. It uses your server's built-in GD or Imagick library — your files never leave your server.

**Key Features:**

- **Auto Compress** — Images are optimized automatically on upload, including the generated WordPress image sizes
- **Bulk Optimize** — Compress all existing images in one click, skipping images that were already optimized
- **High Compression** — Reduce file sizes by up to 80% without visible quality loss
- **Privacy First** — All processing is local, no external API calls, no account and no quota
- **Resize** — Automatically scale down oversized images
- **Strip Metadata** — Remove EXIF, GPS, and camera data for smaller files and better privacy
- **Media Library Stats** — See per-image savings directly in your media list

**Supported Formats:**
JPEG, PNG, WebP. WebP requires GD or Imagick with WebP support.

**Requirements:**
Your server needs either the GD library (included with PHP) or Imagick (recommended for better quality). Most hosts have one or both enabled by default.

= Privacy =

CompressFast processes images entirely on your server. No data is sent to external services. No tracking, no analytics, no third-party APIs.

== Installation ==

1. Upload the `compressfast` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' screen in WordPress
3. Go to **CompressFast > Settings** to adjust quality and options
4. Go to **CompressFast > Bulk Optimize** to compress existing images

== Frequently Asked Questions ==

= Does this send my images to an external server? =

No. All compression happens on your own server using GD or Imagick. Your files never leave your server.

= Will I lose image quality? =

With the default quality setting (82 for JPEG), the difference is virtually invisible while reducing file size significantly. You can adjust quality in Settings.

= What happens to my original images? =

The uploaded file is replaced with the optimized version. Bulk Optimize also overwrites the original files in place, so take a backup before running it.

= Does it work with all image sizes? =

Yes. The uploaded original and all WordPress-generated image sizes (thumbnail, medium, large, etc.) are compressed.

= Does it require an account or API key? =

No. The plugin is fully self-contained and only uses the image library already available on your server.

== Changelog ==

= 1.0.1 =
* WordPress.org review fixes: admin JavaScript is now loaded with wp_enqueue_script, all output is escaped, and every function, constant, option, post meta key and form field uses the compressfast_ prefix
* Readme tags reduced to the five-tag limit
* Fixed PNG compression level mapping and PNG settings being ignored
* Compression now also processes WordPress-generated image sizes
* Bulk Optimize skips images that were already optimized
* Added capability checks and EXIF orientation handling
* PHP 7.4 compatibility (removed PHP 8-only union types)

= 1.0.0 =
* Initial release
* Auto compress on upload
* Bulk optimization
* Settings page
* Imagick + GD support
