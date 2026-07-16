<?php
/**
 * Minimal router for serving WordPress via PHP's built-in server (dev only).
 *
 * Serves existing static files directly; routes everything else to WordPress.
 *
 * @package Beauty_Glow_Hub
 */

$root = '/home/ubuntu/wp-test';
$uri  = urldecode( parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH ) );
$path = $root . $uri;

// Serve real static files (assets, uploads, images, etc.). is_file() follows
// symlinks, so a symlinked theme directory still serves its CSS/JS/images.
if ( '/' !== $uri && is_file( $path ) ) {
	return false;
}

// Route to WordPress front controller.
$_SERVER['SCRIPT_NAME'] = '/index.php';
require $root . '/index.php';
