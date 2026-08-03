=== CompressFast ===
Contributors: compressfast
Tags: compress images, image optimization, compress jpg, compress png, webp, reduce image size, page speed, performance
Requires at least: 5.8
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Compress images automatically on upload. Reduce file sizes by up to 80% — all on your server, no external API. Supports JPEG, PNG, WebP.

== Description ==

CompressFast automatically optimizes your images when you upload them to WordPress. It uses your server's built-in GD or Imagick library — your files never leave your server.

**Key Features:**

- **Auto Compress** — Images are optimized automatically on upload
- **Bulk Optimize** — Compress all existing images in one click
- **High Compression** — Reduce file sizes by up to 80% without visible quality loss
- **Privacy First** — All processing is local, no external API calls
- **Resize** — Automatically scale down oversized images
- **Strip Metadata** — Remove EXIF, GPS, and camera data for smaller files and better privacy
- **Media Library Stats** — See compression results directly in your media list

**Supported Formats:**
JPEG, PNG, WebP (with Imagick).

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

By default, the original file is replaced with the compressed version. You can enable "Keep Original" in settings to preserve backups.

= Does it work with all image sizes? =

Yes. All registered image sizes (thumbnail, medium, large, etc.) are processed.

== Screenshots ==

1. Settings page — adjust quality, size limits, and options
2. Bulk Optimize page — compress all existing images in one click
3. Media Library — compression stats for each image

== Changelog ==

= 1.0.0 =
* Initial release
* Auto compress on upload
* Bulk optimization
* Settings page
* Imagick + GD support
