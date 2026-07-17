<?php
/**
 * Builds:
 *   1. Individual paste-ready HTML files (content/posts/*.html, content/pages/*.html)
 *   2. A Blogger import file (beauty-glow-hub-content.xml) that creates every
 *      post and page in one go via Blogger -> Settings -> Import content.
 *
 * Run:  php content/build.php   (from the beauty-glow-hub-blogger folder)
 */

$data  = include __DIR__ . '/data.php';
$posts = $data['posts'];
$pages = $data['pages'];

@mkdir(__DIR__ . '/posts', 0777, true);
@mkdir(__DIR__ . '/pages', 0777, true);

/* ---- 1. Individual HTML files ---- */
foreach ($posts as $p) {
	file_put_contents(__DIR__ . '/posts/' . $p['slug'] . '.html', $p['html']);
}
foreach ($pages as $p) {
	file_put_contents(__DIR__ . '/pages/' . $p['slug'] . '.html', $p['html']);
}

/* ---- 2. Blogger import (Atom) ---- */
$blogid = '8140094500000000001';
$idn    = 1000000000000000001;

function atom_date($d) {
	return date('Y-m-d\TH:i:s.000P', strtotime($d . ' 09:00:00 UTC'));
}

$entries = '';
$build_entry = function ($item, $kind) use (&$idn, $blogid) {
	$id   = 'tag:blogger.com,1999:blog-' . $blogid . '.post-' . $idn;
	$idn++;
	$date = atom_date($item['date']);
	$e  = "  <entry>\n";
	$e .= "    <id>$id</id>\n";
	$e .= "    <published>$date</published>\n";
	$e .= "    <updated>$date</updated>\n";
	$e .= "    <title type='text'>" . htmlspecialchars(html_entity_decode($item['title'], ENT_QUOTES), ENT_QUOTES) . "</title>\n";
	$e .= "    <content type='html'><![CDATA[" . $item['html'] . "]]></content>\n";
	$e .= "    <category scheme='http://schemas.google.com/g/2005#kind' term='http://schemas.google.com/blogger/2008/kind#$kind'/>\n";
	if (!empty($item['labels'])) {
		foreach ($item['labels'] as $label) {
			$e .= "    <category scheme='http://www.blogger.com/atom/ns#' term='" . htmlspecialchars($label, ENT_QUOTES) . "'/>\n";
		}
	}
	$author = isset($item['author']) ? $item['author'] : 'Beauty Glow Hub';
	$e .= "    <author><name>" . htmlspecialchars($author, ENT_QUOTES) . "</name><email>noreply@blogger.com</email></author>\n";
	$e .= "    <app:control><app:draft>no</app:draft></app:control>\n";
	$e .= "  </entry>\n";
	return $e;
};

foreach ($pages as $pg) { $entries .= $build_entry($pg, 'page'); }
foreach ($posts as $ps) { $entries .= $build_entry($ps, 'post'); }

$feed  = "<?xml version='1.0' encoding='UTF-8'?>\n";
$feed .= "<feed xmlns='http://www.w3.org/2005/Atom' xmlns:app='http://www.w3.org/2007/app'>\n";
$feed .= "  <id>tag:blogger.com,1999:blog-$blogid</id>\n";
$feed .= "  <updated>" . date('Y-m-d\TH:i:s.000P') . "</updated>\n";
$feed .= "  <title type='text'>Beauty Glow Hub</title>\n";
$feed .= "  <generator version='7.00' uri='http://www.blogger.com'>Blogger</generator>\n";
$feed .= $entries;
$feed .= "</feed>\n";

file_put_contents(dirname(__DIR__) . '/beauty-glow-hub-content.xml', $feed);

echo "Built " . count($posts) . " posts + " . count($pages) . " pages.\n";
echo "Import file: beauty-glow-hub-content.xml (" . round(strlen($feed) / 1024) . " KB)\n";
