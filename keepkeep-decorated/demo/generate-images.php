<?php
/**
 * Generates the preview imagery shipped with the theme.
 *
 * Every image is drawn here from scratch with GD — flat, abstract interior
 * compositions in the theme palette. Nothing is downloaded and nothing is
 * traced from a photograph, so the files carry no third-party rights and can be
 * distributed with the theme under the same licence.
 *
 * They are illustrations, not photographs, and they are meant to be replaced
 * with your own photography.
 *
 * Run with:  php demo/generate-images.php
 *
 * @package KeepKeep_Decorated
 */

if ( PHP_SAPI !== 'cli' ) {
	exit( "Run this script from the command line.\n" );
}

if ( ! extension_loaded( 'gd' ) ) {
	exit( "The gd extension is required.\n" );
}

const SUPERSAMPLE = 3; // Draw large, downscale for smooth edges.

/**
 * Palettes: [background, mid tone, deep tone, accent].
 */
function kkd_palettes() {
	return array(
		array( '#f4ece1', '#e2d3c0', '#b9a48c', '#9c5b39' ),
		array( '#efe9df', '#d9d2c4', '#a89c8b', '#7f6a52' ),
		array( '#f7f1e7', '#e6dccb', '#c0aa92', '#8d5f45' ),
		array( '#eee7dc', '#dbcdb8', '#ab9880', '#6f7a63' ),
		array( '#f5efe6', '#e3d6c4', '#b5a58e', '#a4653f' ),
		array( '#f0eae1', '#ddd3c3', '#a49685', '#8a6b4f' ),
	);
}

/**
 * Allocate a colour from a hex string.
 *
 * @param GdImage $im  Image handle.
 * @param string  $hex Hex colour.
 * @return int
 */
function kkd_color( $im, $hex ) {
	$hex = ltrim( $hex, '#' );
	return imagecolorallocate(
		$im,
		hexdec( substr( $hex, 0, 2 ) ),
		hexdec( substr( $hex, 2, 2 ) ),
		hexdec( substr( $hex, 4, 2 ) )
	);
}

/**
 * Mix two hex colours.
 *
 * @param string $a      First colour.
 * @param string $b      Second colour.
 * @param float  $amount Weight of the second colour.
 * @return string
 */
function kkd_mix( $a, $b, $amount ) {
	$a = ltrim( $a, '#' );
	$b = ltrim( $b, '#' );
	$out = '#';
	for ( $i = 0; $i < 3; $i++ ) {
		$ca = hexdec( substr( $a, $i * 2, 2 ) );
		$cb = hexdec( substr( $b, $i * 2, 2 ) );
		$out .= str_pad( dechex( (int) round( $ca + ( $cb - $ca ) * $amount ) ), 2, '0', STR_PAD_LEFT );
	}
	return $out;
}

/**
 * Draw a rounded-top arch.
 *
 * @param GdImage $im     Image.
 * @param int     $x      Left edge.
 * @param int     $y      Top edge.
 * @param int     $w      Width.
 * @param int     $h      Height.
 * @param int     $colour Fill colour.
 */
function kkd_arch( $im, $x, $y, $w, $h, $colour ) {
	$radius = (int) ( $w / 2 );
	imagefilledellipse( $im, (int) ( $x + $radius ), (int) ( $y + $radius ), $w, $w, $colour );
	imagefilledrectangle( $im, $x, (int) ( $y + $radius ), (int) ( $x + $w ), (int) ( $y + $h ), $colour );
}

/**
 * Draw a simple potted plant.
 *
 * @param GdImage $im     Image.
 * @param int     $x      Centre x.
 * @param int     $base   Baseline y.
 * @param int     $scale  Overall size.
 * @param int     $leaf   Leaf colour.
 * @param int     $pot    Pot colour.
 */
function kkd_plant( $im, $x, $base, $scale, $leaf, $pot ) {
	$pot_w = (int) ( $scale * 0.62 );
	$pot_h = (int) ( $scale * 0.52 );

	// Stems and leaves.
	for ( $i = -2; $i <= 2; $i++ ) {
		$tip_x = (int) ( $x + $i * $scale * 0.26 );
		$tip_y = (int) ( $base - $pot_h - $scale * ( 1.15 - abs( $i ) * 0.2 ) );
		imagefilledpolygon(
			$im,
			array(
				$x,
				$base - $pot_h,
				(int) ( $tip_x - $scale * 0.09 ),
				(int) ( ( $tip_y + $base - $pot_h ) / 2 ),
				$tip_x,
				$tip_y,
				(int) ( $tip_x + $scale * 0.09 ),
				(int) ( ( $tip_y + $base - $pot_h ) / 2 ),
			),
			$leaf
		);
	}

	imagefilledpolygon(
		$im,
		array(
			(int) ( $x - $pot_w / 2 ),
			$base - $pot_h,
			(int) ( $x + $pot_w / 2 ),
			$base - $pot_h,
			(int) ( $x + $pot_w * 0.38 ),
			$base,
			(int) ( $x - $pot_w * 0.38 ),
			$base,
		),
		$pot
	);
}

/**
 * Compose one image.
 *
 * @param string $composition Composition key.
 * @param array  $palette     Palette.
 * @param int    $width       Output width.
 * @param int    $height      Output height.
 * @return GdImage
 */
function kkd_compose( $composition, $palette, $width, $height ) {
	$w = $width * SUPERSAMPLE;
	$h = $height * SUPERSAMPLE;

	$im = imagecreatetruecolor( $w, $h );

	$bg     = kkd_color( $im, $palette[0] );
	$mid    = kkd_color( $im, $palette[1] );
	$deep   = kkd_color( $im, $palette[2] );
	$accent = kkd_color( $im, $palette[3] );
	$soft   = kkd_color( $im, kkd_mix( $palette[0], $palette[1], 0.45 ) );
	$leaf   = kkd_color( $im, kkd_mix( $palette[2], '#5c6b52', 0.55 ) );
	$light  = kkd_color( $im, kkd_mix( $palette[0], '#ffffff', 0.55 ) );

	imagefilledrectangle( $im, 0, 0, $w, $h, $bg );

	$floor = (int) ( $h * 0.78 );

	switch ( $composition ) {
		case 'arch':
			imagefilledrectangle( $im, 0, $floor, $w, $h, $mid );
			kkd_arch( $im, (int) ( $w * 0.3 ), (int) ( $h * 0.14 ), (int) ( $w * 0.4 ), (int) ( $h * 0.64 ), $soft );
			kkd_arch( $im, (int) ( $w * 0.36 ), (int) ( $h * 0.2 ), (int) ( $w * 0.28 ), (int) ( $h * 0.58 ), $light );
			kkd_plant( $im, (int) ( $w * 0.16 ), $floor, (int) ( $h * 0.2 ), $leaf, $deep );
			imagefilledrectangle( $im, (int) ( $w * 0.76 ), (int) ( $h * 0.52 ), (int) ( $w * 0.9 ), $floor, $deep );
			break;

		case 'frames':
			imagefilledrectangle( $im, 0, $floor, $w, $h, $mid );
			// Console table.
			imagefilledrectangle( $im, (int) ( $w * 0.24 ), (int) ( $floor - $h * 0.03 ), (int) ( $w * 0.76 ), $floor, $deep );
			// Gallery wall.
			$frames = array(
				array( 0.28, 0.2, 0.18, 0.26 ),
				array( 0.5, 0.16, 0.12, 0.18 ),
				array( 0.5, 0.38, 0.12, 0.12 ),
				array( 0.66, 0.22, 0.1, 0.3 ),
			);
			foreach ( $frames as $index => $frame ) {
				$fx = (int) ( $w * $frame[0] );
				$fy = (int) ( $h * $frame[1] );
				$fw = (int) ( $w * $frame[2] );
				$fh = (int) ( $h * $frame[3] );
				imagefilledrectangle( $im, $fx, $fy, $fx + $fw, $fy + $fh, 0 === $index % 3 ? $accent : $soft );
				$inset = (int) ( $w * 0.008 );
				imagefilledrectangle( $im, $fx + $inset, $fy + $inset, $fx + $fw - $inset, $fy + $fh - $inset, $light );
			}
			kkd_plant( $im, (int) ( $w * 0.85 ), $floor, (int) ( $h * 0.22 ), $leaf, $deep );
			break;

		case 'window':
			imagefilledrectangle( $im, 0, $floor, $w, $h, $mid );
			$wx = (int) ( $w * 0.32 );
			$wy = (int) ( $h * 0.12 );
			$ww = (int) ( $w * 0.36 );
			$wh = (int) ( $h * 0.52 );
			imagefilledrectangle( $im, $wx, $wy, $wx + $ww, $wy + $wh, $soft );
			imagefilledrectangle( $im, (int) ( $wx + $w * 0.012 ), (int) ( $wy + $h * 0.02 ), (int) ( $wx + $ww - $w * 0.012 ), (int) ( $wy + $wh - $h * 0.02 ), $light );
			// Mullions.
			imagefilledrectangle( $im, (int) ( $wx + $ww / 2 - $w * 0.005 ), $wy, (int) ( $wx + $ww / 2 + $w * 0.005 ), $wy + $wh, $soft );
			imagefilledrectangle( $im, $wx, (int) ( $wy + $wh / 2 - $h * 0.008 ), $wx + $ww, (int) ( $wy + $wh / 2 + $h * 0.008 ), $soft );
			// Curtain.
			imagefilledrectangle( $im, (int) ( $w * 0.24 ), (int) ( $h * 0.08 ), (int) ( $w * 0.32 ), $floor, $mid );
			imagefilledrectangle( $im, (int) ( $w * 0.68 ), (int) ( $h * 0.08 ), (int) ( $w * 0.76 ), $floor, $mid );
			imagefilledellipse( $im, (int) ( $w * 0.5 ), (int) ( $h * 0.72 ), (int) ( $w * 0.3 ), (int) ( $h * 0.06 ), $soft );
			break;

		case 'seating':
			// Arched alcove behind the sofa gives the composition depth.
			kkd_arch( $im, (int) ( $w * 0.16 ), (int) ( $h * 0.08 ), (int) ( $w * 0.5 ), (int) ( $h * 0.7 ), kkd_color( $im, kkd_mix( $palette[0], $palette[1], 0.7 ) ) );
			imagefilledrectangle( $im, 0, $floor, $w, $h, $mid );

			// Rug.
			imagefilledellipse( $im, (int) ( $w * 0.44 ), (int) ( $floor + $h * 0.06 ), (int) ( $w * 0.62 ), (int) ( $h * 0.17 ), $soft );

			$sx  = (int) ( $w * 0.19 );
			$sw  = (int) ( $w * 0.44 );
			$sy  = (int) ( $h * 0.46 );
			$arm = (int) ( $w * 0.045 );

			// Seat and back.
			imagefilledrectangle( $im, $sx, $sy, $sx + $sw, (int) ( $floor - $h * 0.04 ), $deep );
			// Rounded arms.
			imagefilledellipse( $im, $sx + $arm, (int) ( $sy - $h * 0.06 ), $arm * 2, $arm * 2, $deep );
			imagefilledellipse( $im, $sx + $sw - $arm, (int) ( $sy - $h * 0.06 ), $arm * 2, $arm * 2, $deep );
			imagefilledrectangle( $im, $sx, (int) ( $sy - $h * 0.06 ), $sx + $arm * 2, $floor - (int) ( $h * 0.04 ), $deep );
			imagefilledrectangle( $im, $sx + $sw - $arm * 2, (int) ( $sy - $h * 0.06 ), $sx + $sw, $floor - (int) ( $h * 0.04 ), $deep );
			// Legs.
			imagefilledrectangle( $im, (int) ( $sx + $w * 0.02 ), (int) ( $floor - $h * 0.04 ), (int) ( $sx + $w * 0.035 ), $floor, $accent );
			imagefilledrectangle( $im, (int) ( $sx + $sw - $w * 0.035 ), (int) ( $floor - $h * 0.04 ), (int) ( $sx + $sw - $w * 0.02 ), $floor, $accent );
			// Cushions.
			imagefilledrectangle( $im, (int) ( $sx + $w * 0.105 ), (int) ( $sy - $h * 0.07 ), (int) ( $sx + $w * 0.2 ), (int) ( $sy + $h * 0.04 ), $accent );
			imagefilledrectangle( $im, (int) ( $sx + $w * 0.23 ), (int) ( $sy - $h * 0.07 ), (int) ( $sx + $w * 0.325 ), (int) ( $sy + $h * 0.04 ), $light );

			// Coffee table.
			imagefilledrectangle( $im, (int) ( $w * 0.3 ), (int) ( $floor + $h * 0.03 ), (int) ( $w * 0.55 ), (int) ( $floor + $h * 0.05 ), $deep );
			imagefilledrectangle( $im, (int) ( $w * 0.33 ), (int) ( $floor + $h * 0.05 ), (int) ( $w * 0.345 ), (int) ( $floor + $h * 0.12 ), $deep );
			imagefilledrectangle( $im, (int) ( $w * 0.535 ), (int) ( $floor + $h * 0.05 ), (int) ( $w * 0.55 ), (int) ( $floor + $h * 0.12 ), $deep );

			// Floor lamp.
			imagefilledrectangle( $im, (int) ( $w * 0.755 ), (int) ( $h * 0.28 ), (int) ( $w * 0.767 ), $floor, $deep );
			imagefilledellipse( $im, (int) ( $w * 0.761 ), $floor, (int) ( $w * 0.07 ), (int) ( $h * 0.02 ), $deep );
			imagefilledpolygon(
				$im,
				array(
					(int) ( $w * 0.705 ),
					(int) ( $h * 0.28 ),
					(int) ( $w * 0.817 ),
					(int) ( $h * 0.28 ),
					(int) ( $w * 0.793 ),
					(int) ( $h * 0.15 ),
					(int) ( $w * 0.729 ),
					(int) ( $h * 0.15 ),
				),
				$light
			);

			kkd_plant( $im, (int) ( $w * 0.9 ), $floor, (int) ( $h * 0.17 ), $leaf, $soft );
			break;

		case 'shelves':
			imagefilledrectangle( $im, 0, $floor, $w, $h, $mid );
			for ( $row = 0; $row < 3; $row++ ) {
				$sy = (int) ( $h * ( 0.2 + $row * 0.18 ) );
				imagefilledrectangle( $im, (int) ( $w * 0.24 ), $sy, (int) ( $w * 0.76 ), (int) ( $sy + $h * 0.014 ), $deep );
				$x = (int) ( $w * 0.27 );
				$objects = 4 + $row;
				for ( $i = 0; $i < $objects; $i++ ) {
					$bw = (int) ( $w * ( 0.018 + ( ( $i + $row ) % 3 ) * 0.012 ) );
					$bh = (int) ( $h * ( 0.07 + ( ( $i * 2 + $row ) % 3 ) * 0.018 ) );
					$colour = ( 0 === ( $i + $row ) % 4 ) ? $accent : ( 0 === $i % 2 ? $soft : $light );
					imagefilledrectangle( $im, $x, $sy - $bh, $x + $bw, $sy, $colour );
					$x += $bw + (int) ( $w * 0.014 );
				}
			}
			kkd_plant( $im, (int) ( $w * 0.85 ), $floor, (int) ( $h * 0.2 ), $leaf, $deep );
			break;

		case 'textiles':
		default:
			// Soft layered bands, like folded fabric.
			$bands = array( $soft, $mid, $deep, $accent );
			$count = count( $bands );
			for ( $i = 0; $i < $count; $i++ ) {
				$top = (int) ( $h * ( 0.28 + $i * 0.13 ) );
				$points = array();
				$steps  = 24;
				for ( $s = 0; $s <= $steps; $s++ ) {
					$px = (int) ( $w * $s / $steps );
					$py = (int) ( $top + sin( $s / $steps * M_PI * 1.6 + $i ) * $h * 0.045 );
					$points[] = $px;
					$points[] = $py;
				}
				$points[] = $w;
				$points[] = $h;
				$points[] = 0;
				$points[] = $h;
				imagefilledpolygon( $im, $points, $bands[ $i ] );
			}
			imagefilledellipse( $im, (int) ( $w * 0.78 ), (int) ( $h * 0.2 ), (int) ( $w * 0.14 ), (int) ( $w * 0.14 ), $soft );
			break;
	}

	// Downscale for antialiasing.
	$out = imagecreatetruecolor( $width, $height );
	imagecopyresampled( $out, $im, 0, 0, 0, 0, $width, $height, $w, $h );
	imagedestroy( $im );

	return $out;
}

/* --------------------------------------------------------------- Manifest */

$targets = array(
	// Article imagery.
	array( 'demo/images/kkd-living-room.jpg', 'seating', 0, 1600, 1000 ),
	array( 'demo/images/kkd-small-bedroom.jpg', 'window', 1, 1600, 1000 ),
	array( 'demo/images/kkd-colour-scheme.jpg', 'textiles', 2, 1600, 1000 ),
	array( 'demo/images/kkd-entryway.jpg', 'arch', 3, 1600, 1000 ),
	array( 'demo/images/kkd-shelf-styling.jpg', 'shelves', 4, 1600, 1000 ),
	array( 'demo/images/kkd-gallery-wall.jpg', 'frames', 5, 1600, 1000 ),
	array( 'demo/images/kkd-kitchen.jpg', 'shelves', 2, 1600, 1000 ),
	array( 'demo/images/kkd-sofa-guide.jpg', 'seating', 3, 1600, 1000 ),
	array( 'demo/images/kkd-lighting.jpg', 'window', 4, 1600, 1000 ),
	array( 'demo/images/kkd-storage.jpg', 'shelves', 5, 1600, 1000 ),
	array( 'demo/images/kkd-paint-project.jpg', 'arch', 1, 1600, 1000 ),
	array( 'demo/images/kkd-seasonal.jpg', 'textiles', 0, 1600, 1000 ),
	array( 'demo/images/kkd-bathroom.jpg', 'arch', 2, 1600, 1000 ),
	array( 'demo/images/kkd-dining.jpg', 'seating', 5, 1600, 1000 ),
	array( 'demo/images/kkd-about.jpg', 'frames', 3, 1600, 1200 ),
	// Default social sharing image.
	array( 'assets/images/og-default.jpg', 'arch', 0, 1200, 630 ),
);

$root     = dirname( __DIR__ );
$palettes = kkd_palettes();

foreach ( $targets as $target ) {
	list( $path, $composition, $palette_index, $width, $height ) = $target;

	$image = kkd_compose( $composition, $palettes[ $palette_index % count( $palettes ) ], $width, $height );
	$full  = $root . '/' . $path;

	if ( ! is_dir( dirname( $full ) ) ) {
		mkdir( dirname( $full ), 0755, true );
	}

	imagejpeg( $image, $full, 82 );
	imagedestroy( $image );

	printf( "  + %s (%dx%d)\n", $path, $width, $height );
}

echo "Done.\n";
