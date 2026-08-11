<?php
/**
 * Router for PHP's built-in server (local development only).
 *
 *     php -S localhost:8088 -t /path/to/wordpress demo/router.php
 *
 * Static files are served directly; everything else goes to WordPress.
 *
 * @package KeepKeep_Decorated
 */

$root = getenv( 'KKD_WP_ROOT' ) ? getenv( 'KKD_WP_ROOT' ) : $_SERVER['DOCUMENT_ROOT'];
$uri  = urldecode( (string) parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH ) );
$path = $root . $uri;

// is_file() follows symlinks, so a symlinked theme still serves its assets.
if ( '/' !== $uri && is_file( $path ) ) {
	return false;
}

$_SERVER['SCRIPT_NAME'] = '/index.php';
require $root . '/index.php';
