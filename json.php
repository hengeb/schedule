<?php

include 'browser-cache.php';
include 'read.php';

header("Content-Type: application/json");

$classes = [];
$teachers = [];
$rooms = [];

foreach ($schedule as $entry) {
    $classes[] = $entry['class'];
    $teachers[] = $entry['teacher'];
    $rooms[] = $entry['room'];
}

$classes = array_values(array_unique($classes));
sort($classes, SORT_NATURAL | SORT_FLAG_CASE);
$teachers = array_values(array_unique($teachers));
sort($teachers, SORT_NATURAL | SORT_FLAG_CASE);
$rooms = array_values(array_unique($rooms));
sort($rooms, SORT_NATURAL | SORT_FLAG_CASE);

foreach ($schedule as &$entry) {
    $entry['class'] = array_search($entry['class'], $classes);
    $entry['teacher'] = array_search($entry['teacher'], $teachers);
    $entry['room'] = array_search($entry['room'], $rooms);
    $entry = array_values($entry);
}

foreach ($monitors as &$entry) {
    $entry['teacher'] = array_search($entry['teacher'], $teachers);
    $entry = array_values($entry);
}

echo json_encode([
    'time' => date('c', $mtime),
    'classes' => $classes,
    'teachers' => $teachers,
    'rooms' => $rooms,
    'schedule' => $schedule,
    'monitors' => $monitors,
]);
