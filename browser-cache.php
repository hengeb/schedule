<?php
// https://stackoverflow.com/questions/6816017/cache-control-and-expires-header-for-php

$maxAge = 60*5;

if (isset($_SERVER['HTTP_IF_MODIFIED_SINCE'])) {
    $if_modified_since = preg_replace('/;.*$/', '', $_SERVER['HTTP_IF_MODIFIED_SINCE']);
} else {
    $if_modified_since = '';
}

$mtime = max(filemtime('data/GPU001.TXT'), filemtime('data/GPU002.TXT'));
$gmdate_mod = gmdate('D, d M Y H:i:s', $mtime) . ' GMT';

if ($if_modified_since === $gmdate_mod) {
    header("HTTP/1.0 304 Not Modified");
    exit;
}

header("Last-Modified: $gmdate_mod");
header('Content-type: text/css');

header('Expires: ' . gmdate('D, d M Y H:i:s', time() + $maxAge) . ' GMT');

