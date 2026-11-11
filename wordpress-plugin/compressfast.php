<?php
/**
 * Plugin Name: CompressFast
 * Plugin URI:  https://compressfast.site
 * Description: Automatically compress images on upload. Reduce file sizes by up to 80% without visible quality loss. Uses your server's GD or Imagick — no external API, files never leave your server.
 * Version:     1.0.1
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Author:      CompressFast
 * License:     GPL-2.0+
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: compressfast
 *
 * @package CompressFast
 */

// Prevent direct access.
if (!defined('ABSPATH')) {
    exit;
}

// Constants.
define('COMPRESSFAST_VERSION', '1.0.1');
define('COMPRESSFAST_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('COMPRESSFAST_PLUGIN_URL', plugin_dir_url(__FILE__));
define('COMPRESSFAST_SETTINGS_KEY', 'compressfast_settings');
define('COMPRESSFAST_STATS_KEY', 'compressfast_stats');
define('COMPRESSFAST_META_ORIGINAL', '_compressfast_original_size');
define('COMPRESSFAST_META_COMPRESSED', '_compressfast_compressed_size');
define('COMPRESSFAST_META_SAVED', '_compressfast_saved_percent');

/**
 * Default settings.
 */
function compressfast_default_settings(): array {
    return array(
        'jpeg_quality'   => 82,
        'png_quality'    => 6, // 0 = no compression, 9 = maximum compression.
        'max_width'      => 2560,
        'max_height'     => 2560,
        'auto_compress'  => true,
        'strip_metadata' => true,
    );
}

/**
 * Get current settings merged with defaults.
 */
function compressfast_get_settings(): array {
    $saved = get_option(COMPRESSFAST_SETTINGS_KEY, array());
    return wp_parse_args($saved, compressfast_default_settings());
}

/**
 * Get lifetime compression stats.
 */
function compressfast_get_stats(): array {
    return get_option(COMPRESSFAST_STATS_KEY, array(
        'images_compressed' => 0,
        'bytes_saved'       => 0,
        'total_original'    => 0,
        'total_compressed'  => 0,
    ));
}

/**
 * Add one attachment's compression results to the global stats.
 */
function compressfast_update_stats(int $original_size, int $compressed_size): void {
    $stats = compressfast_get_stats();
    $stats['images_compressed'] = (int) $stats['images_compressed'] + 1;
    $stats['bytes_saved']       = (int) $stats['bytes_saved'] + max(0, $original_size - $compressed_size);
    $stats['total_original']    = (int) $stats['total_original'] + $original_size;
    $stats['total_compressed']  = (int) $stats['total_compressed'] + $compressed_size;
    update_option(COMPRESSFAST_STATS_KEY, $stats);
}

// ─── Image compression ───────────────────────────────────────────────

/**
 * Compress one image file in place.
 *
 * @param string $file_path Absolute path to the image.
 * @param array  $options   Optional settings overrides.
 * @return string|WP_Error Path on success, WP_Error on failure.
 */
function compressfast_compress_image(string $file_path, array $options = array()) {
    if (!is_file($file_path) || !is_readable($file_path)) {
        return new WP_Error('compressfast_not_found', 'File not found');
    }

    $settings = wp_parse_args($options, compressfast_get_settings());
    $mime     = wp_get_image_mime($file_path);

    if (!$mime) {
        return new WP_Error('compressfast_invalid_image', 'Not a valid image');
    }
    if (!in_array($mime, array('image/jpeg', 'image/png', 'image/webp'), true)) {
        return new WP_Error('compressfast_unsupported_format', 'Unsupported image format');
    }

    if ('image/png' === $mime) {
        $quality = max(0, min(9, (int) $settings['png_quality']));
    } else {
        $quality = max(1, min(100, (int) $settings['jpeg_quality']));
    }

    $max_width  = max(0, (int) $settings['max_width']);
    $max_height = max(0, (int) $settings['max_height']);
    $strip      = !empty($settings['strip_metadata']);

    if (class_exists('Imagick')) {
        $result = compressfast_compress_imagick($file_path, $mime, $quality, $max_width, $max_height, $strip);
        if (!is_wp_error($result)) {
            return $result;
        }
    }

    // Fall back to GD when Imagick is missing or failed.
    return compressfast_compress_gd($file_path, $mime, $quality, $max_width, $max_height);
}

/**
 * Rotate an Imagick image according to its EXIF orientation, then reset the tag.
 */
function compressfast_imagick_fix_orientation(Imagick $image): void {
    try {
        $orientation = $image->getImageOrientation();
    } catch (Exception $e) {
        return;
    }

    switch ($orientation) {
        case Imagick::ORIENTATION_BOTTOMRIGHT:
            $image->rotateImage('#000000', 180);
            break;
        case Imagick::ORIENTATION_RIGHTTOP:
            $image->rotateImage('#000000', 90);
            break;
        case Imagick::ORIENTATION_LEFTBOTTOM:
            $image->rotateImage('#000000', -90);
            break;
        default:
            return;
    }

    $image->setImageOrientation(Imagick::ORIENTATION_TOPLEFT);
}

/**
 * Compress using Imagick (JPEG, PNG, WebP).
 *
 * @return string|WP_Error
 */
function compressfast_compress_imagick(string $file_path, string $mime, int $quality, int $max_width, int $max_height, bool $strip_metadata) {
    try {
        $image = new Imagick($file_path);

        compressfast_imagick_fix_orientation($image);

        // Preserve the ICC profile for JPEG even when stripping metadata.
        $icc_profile = '';
        if ($strip_metadata && 'image/jpeg' === $mime) {
            $profiles = $image->getImageProfiles('icc', true);
            if (is_array($profiles) && !empty($profiles['icc'])) {
                $icc_profile = $profiles['icc'];
            }
        }

        if ($strip_metadata) {
            $image->stripImage();
        }
        $image->setImageOrientation(Imagick::ORIENTATION_TOPLEFT);

        $width  = $image->getImageWidth();
        $height = $image->getImageHeight();
        if ($width < 1 || $height < 1) {
            $image->clear();
            $image->destroy();
            return new WP_Error('compressfast_invalid_dimensions', 'Invalid image dimensions');
        }

        if (($max_width > 0 && $width > $max_width) || ($max_height > 0 && $height > $max_height)) {
            $ratio = 1.0;
            if ($max_width > 0) {
                $ratio = min($ratio, $max_width / $width);
            }
            if ($max_height > 0) {
                $ratio = min($ratio, $max_height / $height);
            }
            $new_width  = max(1, (int) round($width * $ratio));
            $new_height = max(1, (int) round($height * $ratio));
            $image->resizeImage($new_width, $new_height, Imagick::FILTER_LANCZOS, 1, true);
        }

        switch ($mime) {
            case 'image/jpeg':
                $image->setImageCompression(Imagick::COMPRESSION_JPEG);
                $image->setImageCompressionQuality($quality);
                break;

            case 'image/png':
                if (!defined('Imagick::COMPRESSION_ZIP')) {
                    $image->clear();
                    $image->destroy();
                    return new WP_Error('compressfast_imagick_zip', 'Imagick ZIP compression is not available');
                }
                $image->setImageCompression(Imagick::COMPRESSION_ZIP);
                // 0-9 UI scale maps to ImageMagick's 0-90 PNG compression scale.
                $image->setImageCompressionQuality($quality * 10);
                break;

            case 'image/webp':
                if (!defined('Imagick::COMPRESSION_WEBP')) {
                    $image->clear();
                    $image->destroy();
                    return new WP_Error('compressfast_imagick_webp', 'Imagick WebP support is not available');
                }
                $image->setImageCompression(Imagick::COMPRESSION_WEBP);
                $image->setImageCompressionQuality($quality);
                break;
        }

        if ($icc_profile) {
            $image->profileImage('icc', $icc_profile);
        }

        $image->setInterlaceScheme(Imagick::INTERLACE_PLANE);
        $image->writeImage($file_path);
        $image->clear();
        $image->destroy();

        return $file_path;
    } catch (Exception $e) {
        return new WP_Error('compressfast_imagick_error', $e->getMessage());
    }
}

/**
 * Rotate a GD image according to JPEG EXIF orientation.
 *
 * @param resource|GdImage $image     GD image resource.
 * @param string           $file_path Source file path.
 * @return resource|GdImage
 */
function compressfast_gd_fix_orientation($image, string $file_path) {
    if (!function_exists('exif_read_data') || !function_exists('imagerotate')) {
        return $image;
    }

    $exif = @exif_read_data($file_path); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
    if (empty($exif['Orientation'])) {
        return $image;
    }

    $angle = 0;
    switch ((int) $exif['Orientation']) {
        case 3:
            $angle = 180;
            break;
        case 6:
            $angle = -90;
            break;
        case 8:
            $angle = 90;
            break;
    }

    if (0 === $angle) {
        return $image;
    }

    $rotated = imagerotate($image, $angle, 0);
    if (false === $rotated) {
        return $image;
    }

    imagedestroy($image);
    return $rotated;
}

/**
 * Compress using GD (JPEG, PNG, WebP when the PHP build supports them).
 *
 * @return string|WP_Error
 */
function compressfast_compress_gd(string $file_path, string $mime, int $quality, int $max_width, int $max_height) {
    switch ($mime) {
        case 'image/jpeg':
            if (!function_exists('imagecreatefromjpeg')) {
                return new WP_Error('compressfast_gd_jpeg', 'GD JPEG support is not available');
            }
            $image = @imagecreatefromjpeg($file_path); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
            break;

        case 'image/png':
            if (!function_exists('imagecreatefrompng')) {
                return new WP_Error('compressfast_gd_png', 'GD PNG support is not available');
            }
            $image = @imagecreatefrompng($file_path); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
            break;

        case 'image/webp':
            if (!function_exists('imagecreatefromwebp') || !function_exists('imagewebp')) {
                return new WP_Error('compressfast_gd_webp', 'GD WebP support is not available');
            }
            $image = @imagecreatefromwebp($file_path); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
            break;

        default:
            return new WP_Error('compressfast_gd_unsupported', 'GD: unsupported format');
    }

    if (!$image) {
        return new WP_Error('compressfast_gd_load', 'GD: failed to load image');
    }

    if ('image/jpeg' === $mime) {
        $image = compressfast_gd_fix_orientation($image, $file_path);
    }

    $width  = imagesx($image);
    $height = imagesy($image);

    if (($max_width > 0 && $width > $max_width) || ($max_height > 0 && $height > $max_height)) {
        $ratio = 1.0;
        if ($max_width > 0) {
            $ratio = min($ratio, $max_width / $width);
        }
        if ($max_height > 0) {
            $ratio = min($ratio, $max_height / $height);
        }
        $new_width  = max(1, (int) round($width * $ratio));
        $new_height = max(1, (int) round($height * $ratio));

        $resized = imagecreatetruecolor($new_width, $new_height);
        if (!$resized) {
            imagedestroy($image);
            return new WP_Error('compressfast_gd_resize', 'GD: failed to create resized image');
        }

        if ('image/png' === $mime) {
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
        }

        imagecopyresampled($resized, $image, 0, 0, 0, 0, $new_width, $new_height, $width, $height);
        imagedestroy($image);
        $image = $resized;
    }

    $saved = false;
    switch ($mime) {
        case 'image/jpeg':
            $saved = imagejpeg($image, $file_path, $quality);
            break;
        case 'image/png':
            $saved = imagepng($image, $file_path, $quality);
            break;
        case 'image/webp':
            $saved = imagewebp($image, $file_path, $quality);
            break;
    }

    imagedestroy($image);

    if (!$saved) {
        return new WP_Error('compressfast_gd_save', 'GD: failed to save image');
    }

    return $file_path;
}

/**
 * Compress an attachment's original file and all generated image sizes.
 *
 * @param int   $attachment_id Attachment ID.
 * @param array $metadata      Attachment metadata (contains sizes).
 * @param array $settings      Optional settings.
 * @return true|WP_Error
 */
function compressfast_compress_attachment(int $attachment_id, array $metadata, array $settings = array()) {
    $original_path = get_attached_file($attachment_id);
    if (!$original_path || !is_file($original_path)) {
        return new WP_Error('compressfast_missing_file', 'Attachment file not found');
    }

    $paths   = array($original_path);
    $dirname = dirname($original_path);

    if (!empty($metadata['sizes']) && is_array($metadata['sizes'])) {
        foreach ($metadata['sizes'] as $size) {
            if (empty($size['file'])) {
                continue;
            }
            $size_path = trailingslashit($dirname) . $size['file'];
            if (is_file($size_path)) {
                $paths[] = $size_path;
            }
        }
    }

    $settings = wp_parse_args($settings, compressfast_default_settings());
    $total_before = 0;
    $total_after  = 0;

    foreach ($paths as $index => $path) {
        $before = filesize($path);
        if (false === $before) {
            continue;
        }

        $file_settings = $settings;
        if ($index > 0) {
            // Do not resize generated sizes; only compress them.
            $file_settings['max_width']  = 0;
            $file_settings['max_height'] = 0;
        }

        $result = compressfast_compress_image($path, $file_settings);
        if (is_wp_error($result)) {
            error_log('[CompressFast] ' . $result->get_error_message()); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
            continue;
        }

        clearstatcache(true, $path);
        $after = filesize($path);
        if (false === $after) {
            continue;
        }

        $total_before += $before;
        $total_after  += $after;
    }

    if ($total_before <= 0) {
        return new WP_Error('compressfast_no_files', 'No image files were compressed');
    }

    compressfast_update_stats($total_before, $total_after);

    $saved_percent = round((1 - ($total_after / $total_before)) * 100, 1);
    update_post_meta($attachment_id, COMPRESSFAST_META_ORIGINAL, $total_before);
    update_post_meta($attachment_id, COMPRESSFAST_META_COMPRESSED, $total_after);
    update_post_meta($attachment_id, COMPRESSFAST_META_SAVED, $saved_percent);

    return true;
}

// ─── Upload hook ─────────────────────────────────────────────────────

/**
 * Compress the uploaded image and its generated sizes.
 *
 * @param array $metadata      Attachment metadata.
 * @param int   $attachment_id Attachment ID.
 * @return array
 */
function compressfast_handle_upload($metadata, $attachment_id) {
    $settings = compressfast_get_settings();
    if (empty($settings['auto_compress']) || !is_array($metadata)) {
        return $metadata;
    }

    $attachment_id = (int) $attachment_id;
    $mime = get_post_mime_type($attachment_id);
    if (!in_array($mime, array('image/jpeg', 'image/png', 'image/webp'), true)) {
        return $metadata;
    }

    // Avoid recompressing an attachment that was already optimized.
    if (get_post_meta($attachment_id, COMPRESSFAST_META_COMPRESSED, true)) {
        return $metadata;
    }

    compressfast_compress_attachment($attachment_id, $metadata, $settings);

    $file = get_attached_file($attachment_id);
    if ($file && is_file($file)) {
        $size = wp_getimagesize($file);
        if ($size) {
            $metadata['width']  = (int) $size[0];
            $metadata['height'] = (int) $size[1];
        }
    }

    return $metadata;
}
add_filter('wp_generate_attachment_metadata', 'compressfast_handle_upload', 99, 2);

// ─── Admin menu and assets ───────────────────────────────────────────

/**
 * Register the admin menu.
 */
function compressfast_admin_menu(): void {
    add_menu_page(
        'CompressFast',
        'CompressFast',
        'manage_options',
        'compressfast',
        'compressfast_render_settings_page',
        'dashicons-images-alt2',
        80
    );

    add_submenu_page(
        'compressfast',
        'Settings',
        'Settings',
        'manage_options',
        'compressfast',
        'compressfast_render_settings_page'
    );

    add_submenu_page(
        'compressfast',
        'Bulk Optimize',
        'Bulk Optimize',
        'manage_options',
        'compressfast-bulk',
        'compressfast_render_bulk_page'
    );
}
add_action('admin_menu', 'compressfast_admin_menu');

/**
 * Enqueue the admin JavaScript on our own screens only.
 */
function compressfast_enqueue_admin_assets(): void {
    $page = isset($_GET['page']) && is_string($_GET['page'])
        ? sanitize_key(wp_unslash($_GET['page']))
        : '';

    if (!in_array($page, array('compressfast', 'compressfast-bulk'), true)) {
        return;
    }

    wp_enqueue_script(
        'compressfast-admin',
        COMPRESSFAST_PLUGIN_URL . 'assets/admin.js',
        array(),
        COMPRESSFAST_VERSION,
        true
    );
}
add_action('admin_enqueue_scripts', 'compressfast_enqueue_admin_assets');

// ─── Settings page ───────────────────────────────────────────────────

/**
 * Render and handle the settings page.
 */
function compressfast_render_settings_page(): void {
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('You do not have permission to access this page.', 'compressfast'));
    }

    if (isset($_POST['compressfast_save_settings'])) {
        check_admin_referer('compressfast_settings');

        $settings = compressfast_get_settings();

        $settings['jpeg_quality']   = max(1, min(100, (int) ($_POST['compressfast_jpeg_quality'] ?? 82)));
        $settings['png_quality']    = max(0, min(9, (int) ($_POST['compressfast_png_quality'] ?? 6)));
        $settings['max_width']      = max(0, (int) ($_POST['compressfast_max_width'] ?? 2560));
        $settings['max_height']     = max(0, (int) ($_POST['compressfast_max_height'] ?? 2560));
        $settings['auto_compress']  = !empty($_POST['compressfast_auto_compress']);
        $settings['strip_metadata'] = !empty($_POST['compressfast_strip_metadata']);

        update_option(COMPRESSFAST_SETTINGS_KEY, $settings);

        echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__('Settings saved.', 'compressfast') . '</p></div>';
    }

    $settings = compressfast_get_settings();
    $stats    = compressfast_get_stats();

    $total_original   = (int) $stats['total_original'];
    $total_compressed = (int) $stats['total_compressed'];
    $reduction        = $total_original > 0 ? round((1 - ($total_compressed / $total_original)) * 100) . '%' : '—';
    ?>
    <div class="wrap">
        <h1>
            <span class="dashicons dashicons-images-alt2" style="font-size:28px;width:28px;height:28px;vertical-align:-6px;"></span>
            <?php echo esc_html__('CompressFast Settings', 'compressfast'); ?>
        </h1>

        <div style="background:#fff;border:1px solid #ccd0d4;border-radius:8px;padding:16px 20px;margin:16px 0;display:flex;gap:40px;flex-wrap:wrap;">
            <div style="text-align:center;">
                <div style="font-size:28px;font-weight:700;color:#1e293b;"><?php echo esc_html(number_format_i18n((int) $stats['images_compressed'])); ?></div>
                <div style="color:#64748b;font-size:12px;"><?php echo esc_html__('Images Compressed', 'compressfast'); ?></div>
            </div>
            <div style="text-align:center;">
                <div style="font-size:28px;font-weight:700;color:#16a34a;"><?php echo esc_html(size_format((int) $stats['bytes_saved'])); ?></div>
                <div style="color:#64748b;font-size:12px;"><?php echo esc_html__('Total Saved', 'compressfast'); ?></div>
            </div>
            <div style="text-align:center;">
                <div style="font-size:28px;font-weight:700;color:#2563eb;"><?php echo esc_html($reduction); ?></div>
                <div style="color:#64748b;font-size:12px;"><?php echo esc_html__('Average Reduction', 'compressfast'); ?></div>
            </div>
        </div>

        <form method="post" style="background:#fff;border:1px solid #ccd0d4;border-radius:8px;padding:20px;max-width:600px;margin-top:16px;">
            <?php wp_nonce_field('compressfast_settings'); ?>
            <table class="form-table">
                <tr>
                    <th><label for="compressfast_auto_compress"><?php echo esc_html__('Auto Compress on Upload', 'compressfast'); ?></label></th>
                    <td>
                        <input type="checkbox" name="compressfast_auto_compress" id="compressfast_auto_compress" <?php checked($settings['auto_compress']); ?>>
                        <p class="description"><?php echo esc_html__('Automatically compress images when uploaded to the Media Library.', 'compressfast'); ?></p>
                    </td>
                </tr>
                <tr>
                    <th><label for="compressfast_jpeg_quality"><?php echo esc_html__('JPEG Quality', 'compressfast'); ?></label></th>
                    <td>
                        <input type="range" name="compressfast_jpeg_quality" id="compressfast_jpeg_quality" min="1" max="100" value="<?php echo esc_attr($settings['jpeg_quality']); ?>" style="width:200px;">
                        <span id="compressfast_jpeg_quality_val"><?php echo esc_html($settings['jpeg_quality']); ?></span>
                        <p class="description"><?php echo esc_html__('Lower = smaller file. Recommended: 75-85.', 'compressfast'); ?></p>
                    </td>
                </tr>
                <tr>
                    <th><label for="compressfast_png_quality"><?php echo esc_html__('PNG Compression', 'compressfast'); ?></label></th>
                    <td>
                        <input type="range" name="compressfast_png_quality" id="compressfast_png_quality" min="0" max="9" value="<?php echo esc_attr($settings['png_quality']); ?>" style="width:200px;">
                        <span id="compressfast_png_quality_val"><?php echo esc_html($settings['png_quality']); ?></span>
                        <p class="description"><?php echo esc_html__('0 = no compression, 9 = maximum. Recommended: 6.', 'compressfast'); ?></p>
                    </td>
                </tr>
                <tr>
                    <th><label for="compressfast_max_width"><?php echo esc_html__('Max Width', 'compressfast'); ?></label></th>
                    <td>
                        <input type="number" name="compressfast_max_width" id="compressfast_max_width" value="<?php echo esc_attr($settings['max_width']); ?>" class="small-text"> px
                        <p class="description"><?php echo esc_html__('Images wider than this will be scaled down. 0 = no limit.', 'compressfast'); ?></p>
                    </td>
                </tr>
                <tr>
                    <th><label for="compressfast_max_height"><?php echo esc_html__('Max Height', 'compressfast'); ?></label></th>
                    <td>
                        <input type="number" name="compressfast_max_height" id="compressfast_max_height" value="<?php echo esc_attr($settings['max_height']); ?>" class="small-text"> px
                        <p class="description"><?php echo esc_html__('Images taller than this will be scaled down. 0 = no limit.', 'compressfast'); ?></p>
                    </td>
                </tr>
                <tr>
                    <th><label for="compressfast_strip_metadata"><?php echo esc_html__('Strip Metadata', 'compressfast'); ?></label></th>
                    <td>
                        <input type="checkbox" name="compressfast_strip_metadata" id="compressfast_strip_metadata" <?php checked($settings['strip_metadata']); ?>>
                        <p class="description"><?php echo esc_html__('Remove EXIF, GPS and camera info — smaller files, better privacy.', 'compressfast'); ?></p>
                    </td>
                </tr>
            </table>
            <p class="submit">
                <button type="submit" name="compressfast_save_settings" class="button button-primary"><?php echo esc_html__('Save Settings', 'compressfast'); ?></button>
            </p>
        </form>

        <p style="margin-top:20px;color:#64748b;font-size:12px;">
            <?php echo esc_html(sprintf(__('CompressFast v%s', 'compressfast'), COMPRESSFAST_VERSION)); ?> ·
            <a href="<?php echo esc_url('https://compressfast.site'); ?>" target="_blank" rel="noopener noreferrer">compressfast.site</a> ·
            <?php echo esc_html__('Powered by your server\'s GD/Imagick — files never leave your server.', 'compressfast'); ?>
        </p>
    </div>
    <?php
}

// ─── Bulk Optimize page ──────────────────────────────────────────────

/**
 * Render and handle the bulk optimization page.
 */
function compressfast_render_bulk_page(): void {
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('You do not have permission to access this page.', 'compressfast'));
    }

    $message = '';

    if (isset($_POST['compressfast_bulk_run'])) {
        check_admin_referer('compressfast_bulk');

        $settings      = compressfast_get_settings();
        $before_stats  = compressfast_get_stats();
        $processed     = 0;
        $skipped       = 0;
        $errors        = 0;

        $attachments = get_posts(array(
            'post_type'      => 'attachment',
            'post_mime_type' => array('image/jpeg', 'image/png', 'image/webp'),
            'posts_per_page' => -1,
            'post_status'    => 'inherit',
            'fields'         => 'ids',
        ));

        foreach ($attachments as $attachment_id) {
            $attachment_id = (int) $attachment_id;

            if (get_post_meta($attachment_id, COMPRESSFAST_META_COMPRESSED, true)) {
                $skipped++;
                continue;
            }

            $metadata = wp_get_attachment_metadata($attachment_id);
            if (!is_array($metadata)) {
                $errors++;
                continue;
            }

            $result = compressfast_compress_attachment($attachment_id, $metadata, $settings);
            if (is_wp_error($result)) {
                $errors++;
                continue;
            }

            $processed++;
        }

        $after_stats = compressfast_get_stats();
        $saved       = max(0, (int) $after_stats['bytes_saved'] - (int) $before_stats['bytes_saved']);

        $message = sprintf(
            '<div class="notice notice-success is-dismissible"><p>%s</p></div>',
            sprintf(
                esc_html__('Done! Processed %1$d images, skipped %2$d already optimized, saved %3$s. Errors: %4$d.', 'compressfast'),
                $processed,
                $skipped,
                esc_html(size_format($saved)),
                $errors
            )
        );
    }

    $stats             = compressfast_get_stats();
    $attachment_counts = wp_count_posts('attachment');
    $total_images      = isset($attachment_counts->inherit) ? (int) $attachment_counts->inherit : 0;
    ?>
    <div class="wrap">
        <h1><?php echo esc_html__('Bulk Image Optimization', 'compressfast'); ?></h1>
        <p><?php echo esc_html__('Compress all existing images in your Media Library.', 'compressfast'); ?></p>

        <?php echo wp_kses_post($message); ?>

        <div style="background:#fff;border:1px solid #ccd0d4;border-radius:8px;padding:20px;max-width:500px;margin:16px 0;">
            <p>📷 <?php echo esc_html__('Total images in library:', 'compressfast'); ?> <strong><?php echo esc_html(number_format_i18n($total_images)); ?></strong></p>
            <p>✅ <?php echo esc_html__('Already compressed:', 'compressfast'); ?> <strong><?php echo esc_html(number_format_i18n((int) $stats['images_compressed'])); ?></strong></p>
            <p>💾 <?php echo esc_html__('Total saved:', 'compressfast'); ?> <strong><?php echo esc_html(size_format((int) $stats['bytes_saved'])); ?></strong></p>

            <form id="compressfast-bulk-form" method="post">
                <?php wp_nonce_field('compressfast_bulk'); ?>
                <p class="submit">
                    <button type="submit" name="compressfast_bulk_run" class="button button-primary">
                        <?php echo esc_html__('Optimize All Images', 'compressfast'); ?>
                    </button>
                </p>
            </form>
        </div>

        <p style="color:#64748b;font-size:12px;">
            ⚠️ <?php echo esc_html__('This modifies original files. Ensure you have a backup before running bulk optimization.', 'compressfast'); ?>
        </p>
    </div>
    <?php
}

// ─── Media Library column ────────────────────────────────────────────

/**
 * Add a compression column to the Media Library.
 */
function compressfast_media_columns(array $columns): array {
    $columns['compressfast_compression'] = __('Compression', 'compressfast');
    return $columns;
}
add_filter('manage_media_columns', 'compressfast_media_columns');

/**
 * Render the compression column.
 */
function compressfast_media_column_content(string $column_name, int $attachment_id): void {
    if ('compressfast_compression' !== $column_name) {
        return;
    }

    $original   = get_post_meta($attachment_id, COMPRESSFAST_META_ORIGINAL, true);
    $compressed = get_post_meta($attachment_id, COMPRESSFAST_META_COMPRESSED, true);
    $saved      = get_post_meta($attachment_id, COMPRESSFAST_META_SAVED, true);

    if ($original && $compressed) {
        echo '<span style="color:#16a34a;font-weight:600;">' . esc_html($saved) . '% ' . esc_html__('saved', 'compressfast') . '</span><br>';
        echo '<small style="color:#64748b;">' . esc_html(size_format((int) $original)) . ' → ' . esc_html(size_format((int) $compressed)) . '</small>';
    } else {
        echo '<span style="color:#94a3b8;">—</span>';
    }
}
add_action('manage_media_custom_column', 'compressfast_media_column_content', 10, 2);

// ─── Plugin action links ─────────────────────────────────────────────

/**
 * Add a Settings link on the Plugins screen.
 */
function compressfast_plugin_action_links(array $links): array {
    $settings_link = '<a href="' . esc_url(admin_url('admin.php?page=compressfast')) . '">' . esc_html__('Settings', 'compressfast') . '</a>';
    array_unshift($links, $settings_link);
    return $links;
}
add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'compressfast_plugin_action_links');

// ─── Activation ──────────────────────────────────────────────────────

/**
 * Set default options on activation.
 */
function compressfast_activate(): void {
    if (!get_option(COMPRESSFAST_SETTINGS_KEY)) {
        add_option(COMPRESSFAST_SETTINGS_KEY, compressfast_default_settings());
    }
    if (!get_option(COMPRESSFAST_STATS_KEY)) {
        add_option(COMPRESSFAST_STATS_KEY, array(
            'images_compressed' => 0,
            'bytes_saved'       => 0,
            'total_original'    => 0,
            'total_compressed'  => 0,
        ));
    }
}
register_activation_hook(__FILE__, 'compressfast_activate');
