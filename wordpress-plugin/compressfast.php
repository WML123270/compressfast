<?php
/**
 * Plugin Name: CompressFast — Image Optimizer
 * Plugin URI:  https://compressfast.site
 * Description: Automatically compress images on upload. Reduce file sizes by up to 80% without visible quality loss. Uses your server's GD or Imagick — no external API, files never leave your server.
 * Version:     1.0.0
 * Author:      CompressFast
 * Author URI:  https://compressfast.site
 * License:     GPL-2.0+
 * Text Domain: compressfast
 * Domain Path: /languages
 *
 * @package CompressFast
 */

// ─── Prevent direct access ──────────────────────────
if (!defined('ABSPATH')) exit;

// ─── Constants ──────────────────────────────────────
define('CF_VERSION', '1.0.0');
define('CF_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CF_PLUGIN_URL', plugin_dir_url(__FILE__));
define('CF_SETTINGS_KEY', 'compressfast_settings');
define('CF_STATS_KEY', 'compressfast_stats');

// ─── Default settings ───────────────────────────────
function cf_default_settings(): array {
    return [
        'jpeg_quality'    => 82,
        'png_quality'     => 6,   // 0-9 (GD: compression level, Imagick: quality)
        'max_width'       => 2560,
        'max_height'      => 2560,
        'auto_compress'   => true,
        'strip_metadata'  => true,
        'keep_original'   => false,
        'convert_to_webp' => false,
    ];
}

function cf_get_settings(): array {
    $saved = get_option(CF_SETTINGS_KEY, []);
    return wp_parse_args($saved, cf_default_settings());
}

function cf_get_stats(): array {
    return get_option(CF_STATS_KEY, [
        'images_compressed' => 0,
        'bytes_saved'       => 0,
        'total_original'    => 0,
        'total_compressed'  => 0,
    ]);
}

function cf_update_stats(int $originalSize, int $compressedSize): void {
    $stats = cf_get_stats();
    $stats['images_compressed']++;
    $stats['bytes_saved'] += max(0, $originalSize - $compressedSize);
    $stats['total_original'] += $originalSize;
    $stats['total_compressed'] += $compressedSize;
    update_option(CF_STATS_KEY, $stats);
}

// ─── Image Compression Engine ───────────────────────

/**
 * Compress an image file. Returns compressed file path or WP_Error.
 */
function cf_compress_image(string $filePath, array $options = []): string|WP_Error {
    if (!file_exists($filePath)) {
        return new WP_Error('not_found', 'File not found');
    }

    $settings = cf_get_settings();
    $quality   = (int) ($options['jpeg_quality'] ?? $settings['jpeg_quality']);
    $maxW      = (int) ($options['max_width'] ?? $settings['max_width']);
    $maxH      = (int) ($options['max_height'] ?? $settings['max_height']);
    $stripMeta = (bool) ($options['strip_metadata'] ?? $settings['strip_metadata']);

    $mime = wp_get_image_mime($filePath);
    if (!$mime) {
        return new WP_Error('invalid_image', 'Not a valid image');
    }

    // Use Imagick if available, else GD
    if (class_exists('Imagick') && in_array($mime, ['image/jpeg', 'image/png', 'image/webp'])) {
        return cf_compress_imagick($filePath, $mime, $quality, $maxW, $maxH, $stripMeta);
    }

    if (function_exists('imagecreatefromjpeg')) {
        return cf_compress_gd($filePath, $mime, $quality, $maxW, $maxH);
    }

    return new WP_Error('no_library', 'No image library (Imagick or GD) available');
}

/**
 * Compress using Imagick (supports JPEG, PNG, WebP).
 */
function cf_compress_imagick(string $filePath, string $mime, int $quality, int $maxW, int $maxH, bool $stripMeta): string|WP_Error {
    try {
        $img = new Imagick($filePath);

        // Strip metadata
        if ($stripMeta) {
            $img->stripImage();
        }

        // Resize if oversized
        $w = $img->getImageWidth();
        $h = $img->getImageHeight();
        if (($maxW > 0 && $w > $maxW) || ($maxH > 0 && $h > $maxH)) {
            $img->resizeImage($maxW, $maxH, Imagick::FILTER_LANCZOS, 1, true);
        }

        // Set compression
        switch ($mime) {
            case 'image/jpeg':
                $img->setImageCompression(Imagick::COMPRESSION_JPEG);
                $img->setImageCompressionQuality($quality);
                // Remove EXIF
                if ($stripMeta) {
                    $profiles = $img->getImageProfiles('icc', true);
                    $img->stripImage();
                    if (!empty($profiles) && isset($profiles['icc'])) {
                        $img->profileImage('icc', $profiles['icc']);
                    }
                }
                break;

            case 'image/png':
                $img->setImageCompression(Imagick::COMPRESSION_ZIP);
                // quality 0-9 → Imagick quality 100-10
                $img->setImageCompressionQuality(max(10, 100 - ($quality * 10)));
                break;

            case 'image/webp':
                $img->setImageCompression(Imagick::COMPRESSION_WEBP);
                $img->setImageCompressionQuality($quality);
                break;
        }

        // Optimize interlace
        $img->setInterlaceScheme(Imagick::INTERLACE_PLANE);

        $img->writeImage($filePath);
        $img->clear();
        $img->destroy();

        return $filePath;
    } catch (Exception $e) {
        return new WP_Error('imagick_error', $e->getMessage());
    }
}

/**
 * Compress using GD library (fallback for JPEG/PNG).
 */
function cf_compress_gd(string $filePath, string $mime, int $quality, int $maxW, int $maxH): string|WP_Error {
    // Load image
    switch ($mime) {
        case 'image/jpeg':
            $src = @imagecreatefromjpeg($filePath);
            break;
        case 'image/png':
            $src = @imagecreatefrompng($filePath);
            break;
        case 'image/webp':
            $src = @imagecreatefromwebp($filePath);
            break;
        default:
            return new WP_Error('unsupported_format', 'GD: unsupported format ' . $mime);
    }

    if (!$src) {
        return new WP_Error('gd_load_error', 'GD: failed to load image');
    }

    $w = imagesx($src);
    $h = imagesy($src);

    // Resize if needed
    if (($maxW > 0 && $w > $maxW) || ($maxH > 0 && $h > $maxH)) {
        $ratio = min($maxW / $w, $maxH / $h, 1);
        $newW  = (int) round($w * $ratio);
        $newH  = (int) round($h * $ratio);
        $dst   = imagecreatetruecolor($newW, $newH);

        // Preserve transparency for PNG
        if ($mime === 'image/png') {
            imagealphablending($dst, false);
            imagesavealpha($dst, true);
        }

        imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $w, $h);
        imagedestroy($src);
        $src = $dst;
    }

    // Save compressed
    switch ($mime) {
        case 'image/jpeg':
            @imagejpeg($src, $filePath, $quality);
            break;
        case 'image/png':
            // quality 0-9 → compression 9-0
            $compression = max(0, 9 - $quality);
            @imagepng($src, $filePath, $compression);
            break;
        case 'image/webp':
            @imagewebp($src, $filePath, $quality);
            break;
    }

    imagedestroy($src);
    return $filePath;
}

// ─── Upload Hook ─────────────────────────────────────

/**
 * Auto-compress image on upload.
 */
function cf_handle_upload($metadata, int $attachmentId): array {
    $settings = cf_get_settings();
    if (!$settings['auto_compress']) {
        return $metadata;
    }

    $filePath = get_attached_file($attachmentId);
    if (!$filePath) {
        return $metadata;
    }

    $originalSize = filesize($filePath);
    $result = cf_compress_image($filePath);

    if (is_wp_error($result)) {
        error_log('[CompressFast] Error compressing attachment #' . $attachmentId . ': ' . $result->get_error_message());
        return $metadata;
    }

    clearstatcache(true, $filePath);
    $compressedSize = filesize($filePath);

    if ($compressedSize && $originalSize) {
        cf_update_stats($originalSize, $compressedSize);

        $savedPercent = round((1 - $compressedSize / $originalSize) * 100, 1);
        update_post_meta($attachmentId, '_cf_original_size', $originalSize);
        update_post_meta($attachmentId, '_cf_compressed_size', $compressedSize);
        update_post_meta($attachmentId, '_cf_saved_percent', $savedPercent);

        error_log("[CompressFast] Attachment #{$attachmentId}: " . size_format($originalSize) . " → " . size_format($compressedSize) . " (saved {$savedPercent}%)");
    }

    return $metadata;
}
add_filter('wp_generate_attachment_metadata', 'cf_handle_upload', 99, 2);

// ─── Admin Menu ─────────────────────────────────────

function cf_admin_menu(): void {
    add_menu_page(
        'CompressFast',
        'CompressFast',
        'manage_options',
        'compressfast',
        'cf_render_settings_page',
        'dashicons-images-alt2',
        80
    );

    add_submenu_page(
        'compressfast',
        'Settings',
        'Settings',
        'manage_options',
        'compressfast',
        'cf_render_settings_page'
    );

    add_submenu_page(
        'compressfast',
        'Bulk Optimize',
        'Bulk Optimize',
        'manage_options',
        'compressfast-bulk',
        'cf_render_bulk_page'
    );
}
add_action('admin_menu', 'cf_admin_menu');

// ─── Settings Page ──────────────────────────────────

function cf_render_settings_page(): void {
    // Save settings
    if (isset($_POST['cf_save_settings']) && check_admin_referer('cf_settings')) {
        $settings = cf_get_settings();
        $settings['jpeg_quality']   = max(1, min(100, (int) ($_POST['cf_jpeg_quality'] ?? 82)));
        $settings['png_quality']    = max(0, min(9, (int) ($_POST['cf_png_quality'] ?? 6)));
        $settings['max_width']      = max(0, (int) ($_POST['cf_max_width'] ?? 2560));
        $settings['max_height']     = max(0, (int) ($_POST['cf_max_height'] ?? 2560));
        $settings['auto_compress']  = !empty($_POST['cf_auto_compress']);
        $settings['strip_metadata'] = !empty($_POST['cf_strip_metadata']);
        $settings['keep_original']  = !empty($_POST['cf_keep_original']);
        update_option(CF_SETTINGS_KEY, $settings);
        echo '<div class="notice notice-success is-dismissible"><p>Settings saved.</p></div>';
    }

    $s = cf_get_settings();
    $stats = cf_get_stats();
    ?>
    <div class="wrap">
        <h1>
            <span class="dashicons dashicons-images-alt2" style="font-size:28px;width:28px;height:28px;vertical-align:-6px;"></span>
            CompressFast Settings
        </h1>

        <!-- Stats card -->
        <div style="background:#fff;border:1px solid #ccd0d4;border-radius:8px;padding:16px 20px;margin:16px 0;display:flex;gap:40px;flex-wrap:wrap;">
            <div style="text-align:center;">
                <div style="font-size:28px;font-weight:700;color:#1e293b;"><?php echo number_format_i18n($stats['images_compressed']); ?></div>
                <div style="color:#64748b;font-size:12px;">Images Compressed</div>
            </div>
            <div style="text-align:center;">
                <div style="font-size:28px;font-weight:700;color:#16a34a;"><?php echo esc_html(size_format($stats['bytes_saved'])); ?></div>
                <div style="color:#64748b;font-size:12px;">Total Saved</div>
            </div>
            <div style="text-align:center;">
                <div style="font-size:28px;font-weight:700;color:#2563eb;">
                    <?php
                    $original = $stats['total_original'];
                    $compressed = $stats['total_compressed'];
                    echo $original > 0 ? round((1 - $compressed / $original) * 100) . '%' : '—';
                    ?>
                </div>
                <div style="color:#64748b;font-size:12px;">Average Reduction</div>
            </div>
        </div>

        <form method="post" style="background:#fff;border:1px solid #ccd0d4;border-radius:8px;padding:20px;max-width:600px;margin-top:16px;">
            <?php wp_nonce_field('cf_settings'); ?>
            <table class="form-table">
                <tr>
                    <th><label for="cf_auto_compress">Auto Compress on Upload</label></th>
                    <td>
                        <input type="checkbox" name="cf_auto_compress" id="cf_auto_compress" <?php checked($s['auto_compress']); ?>>
                        <p class="description">Automatically compress images when uploaded to the Media Library.</p>
                    </td>
                </tr>
                <tr>
                    <th><label for="cf_jpeg_quality">JPEG Quality</label></th>
                    <td>
                        <input type="range" name="cf_jpeg_quality" id="cf_jpeg_quality" min="1" max="100" value="<?php echo esc_attr($s['jpeg_quality']); ?>" style="width:200px;">
                        <span id="cf_jpeg_quality_val"><?php echo esc_html($s['jpeg_quality']); ?></span>
                        <p class="description">Lower = smaller file. Recommended: 75-85.</p>
                    </td>
                </tr>
                <tr>
                    <th><label for="cf_png_quality">PNG Compression</label></th>
                    <td>
                        <input type="range" name="cf_png_quality" id="cf_png_quality" min="0" max="9" value="<?php echo esc_attr($s['png_quality']); ?>" style="width:200px;">
                        <span id="cf_png_quality_val"><?php echo esc_html($s['png_quality']); ?></span>
                        <p class="description">0 = no compression, 9 = maximum. Recommended: 6.</p>
                    </td>
                </tr>
                <tr>
                    <th><label for="cf_max_width">Max Width</label></th>
                    <td>
                        <input type="number" name="cf_max_width" id="cf_max_width" value="<?php echo esc_attr($s['max_width']); ?>" class="small-text"> px
                        <p class="description">Images wider than this will be scaled down. 0 = no limit.</p>
                    </td>
                </tr>
                <tr>
                    <th><label for="cf_max_height">Max Height</label></th>
                    <td>
                        <input type="number" name="cf_max_height" id="cf_max_height" value="<?php echo esc_attr($s['max_height']); ?>" class="small-text"> px
                    </td>
                </tr>
                <tr>
                    <th><label for="cf_strip_metadata">Strip Metadata</label></th>
                    <td>
                        <input type="checkbox" name="cf_strip_metadata" id="cf_strip_metadata" <?php checked($s['strip_metadata']); ?>>
                        <p class="description">Remove EXIF, GPS, camera info — smaller files, better privacy.</p>
                    </td>
                </tr>
            </table>
            <p class="submit">
                <button type="submit" name="cf_save_settings" class="button button-primary">Save Settings</button>
            </p>
        </form>

        <p style="margin-top:20px;color:#64748b;font-size:12px;">
            CompressFast v<?php echo CF_VERSION; ?> ·
            <a href="https://compressfast.site" target="_blank">compressfast.site</a> ·
            Powered by your server's GD/Imagick — files never leave your server.
        </p>
    </div>

    <script>
    document.getElementById('cf_jpeg_quality').addEventListener('input', function() {
        document.getElementById('cf_jpeg_quality_val').textContent = this.value;
    });
    document.getElementById('cf_png_quality').addEventListener('input', function() {
        document.getElementById('cf_png_quality_val').textContent = this.value;
    });
    </script>
    <?php
}

// ─── Bulk Optimize Page ──────────────────────────────

function cf_render_bulk_page(): void {
    $stats = cf_get_stats();
    $settings = cf_get_settings();

    // Handle bulk action
    $message = '';
    if (isset($_POST['cf_bulk_run']) && check_admin_referer('cf_bulk')) {
        $processed = 0;
        $errors = 0;
        $saved = 0;

        $attachments = get_posts([
            'post_type'      => 'attachment',
            'post_mime_type' => 'image',
            'posts_per_page' => -1,
            'post_status'    => 'any',
        ]);

        foreach ($attachments as $att) {
            $filePath = get_attached_file($att->ID);
            if (!$filePath || !file_exists($filePath)) continue;

            $originalSize = filesize($filePath);
            $result = cf_compress_image($filePath, $settings);

            if (is_wp_error($result)) {
                $errors++;
                continue;
            }

            clearstatcache(true, $filePath);
            $compressedSize = filesize($filePath);
            $saved += max(0, $originalSize - $compressedSize);
            cf_update_stats($originalSize, $compressedSize);
            update_post_meta($att->ID, '_cf_original_size', $originalSize);
            update_post_meta($att->ID, '_cf_compressed_size', $compressedSize);
            $processed++;
        }

        $message = sprintf(
            '<div class="notice notice-success is-dismissible"><p>Done! Processed <strong>%d</strong> images, saved <strong>%s</strong>. Errors: %d.</p></div>',
            $processed,
            size_format($saved),
            $errors
        );
    }

    $stats = cf_get_stats(); // Refresh stats
    $totalImages = wp_count_posts('attachment')->inherit ?? 0;
    ?>
    <div class="wrap">
        <h1>Bulk Image Optimization</h1>
        <p>Compress all existing images in your Media Library.</p>

        <?php echo $message; ?>

        <div style="background:#fff;border:1px solid #ccd0d4;border-radius:8px;padding:20px;max-width:500px;margin:16px 0;">
            <p>📷 Total images in library: <strong><?php echo number_format_i18n($totalImages); ?></strong></p>
            <p>✅ Already compressed: <strong><?php echo number_format_i18n($stats['images_compressed']); ?></strong></p>
            <p>💾 Total saved: <strong><?php echo esc_html(size_format($stats['bytes_saved'])); ?></strong></p>

            <form method="post">
                <?php wp_nonce_field('cf_bulk'); ?>
                <p class="submit">
                    <button type="submit" name="cf_bulk_run" class="button button-primary" onclick="return confirm('This will optimize ALL images in your library. Continue?');">
                        Optimize All Images
                    </button>
                </p>
            </form>
        </div>

        <p style="color:#64748b;font-size:12px;">
            ⚠️ This modifies original files. Ensure you have a backup before running bulk optimization.
        </p>
    </div>
    <?php
}

// ─── Media Library Column ───────────────────────────

function cf_media_columns(array $columns): array {
    $columns['cf_compression'] = 'Compression';
    return $columns;
}
add_filter('manage_media_columns', 'cf_media_columns');

function cf_media_column_content(string $columnName, int $attachmentId): void {
    if ($columnName !== 'cf_compression') return;

    $original = get_post_meta($attachmentId, '_cf_original_size', true);
    $compressed = get_post_meta($attachmentId, '_cf_compressed_size', true);
    $saved = get_post_meta($attachmentId, '_cf_saved_percent', true);

    if ($original && $compressed) {
        echo '<span style="color:#16a34a;font-weight:600;">' . esc_html($saved) . '% saved</span><br>';
        echo '<small style="color:#64748b;">' . esc_html(size_format($original)) . ' → ' . esc_html(size_format($compressed)) . '</small>';
    } else {
        echo '<span style="color:#94a3b8;">—</span>';
    }
}
add_action('manage_media_custom_column', 'cf_media_column_content', 10, 2);

// ─── Plugin action links ────────────────────────────

function cf_plugin_action_links(array $links): array {
    $settingsLink = '<a href="' . admin_url('admin.php?page=compressfast') . '">Settings</a>';
    array_unshift($links, $settingsLink);
    return $links;
}
add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'cf_plugin_action_links');

// ─── Activation ─────────────────────────────────────

function cf_activate(): void {
    if (!get_option(CF_SETTINGS_KEY)) {
        add_option(CF_SETTINGS_KEY, cf_default_settings());
    }
    if (!get_option(CF_STATS_KEY)) {
        add_option(CF_STATS_KEY, [
            'images_compressed' => 0,
            'bytes_saved'       => 0,
            'total_original'    => 0,
            'total_compressed'  => 0,
        ]);
    }
}
register_activation_hook(__FILE__, 'cf_activate');
