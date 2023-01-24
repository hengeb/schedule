<?php

$mtime = max(filemtime('data/GPU001.TXT'), filemtime('data/GPU002.TXT'));

$courses = [];
$f02 = fopen('data/GPU002.TXT', 'r');
while ($cells = fgetcsv($f02, separator: ";")) {
    if (count($cells) < 12) {
        continue;
    }
    $id = intval($cells[0]);
    $courses[$id] = [
        'id' => $id,
        'class' => $cells[4],
        'teacher' => $cells[5],
        'subject' => $cells[6],
        'week' => match ($cells[11]) {
            'WA' => 'A', 'WB' => 'B', '' => '',
        },
    ];
}

$schedule = [];
$f01 = fopen('data/GPU001.TXT', 'r');
while ($cells = fgetcsv($f01, separator: ";")) {
    if (count($cells) < 6) {
        continue;
    }
    $id = intval($cells[0]);
    $subject = $cells[3];
    if (str_contains($subject, '_')) {
        $sub = rtrim(substr($subject, 2, -3), '_');
        $type = strtoupper(substr($subject, -3));
        $subject = "$sub $type";
    }
    $entry = [
        'class' => $cells[1],
        'teacher' => $cells[2],
        'subject' => $subject,
        'room' => $cells[4],
        'day' => intval($cells[5]),
        'hour' => intval($cells[6]),
        'week' => $courses[$id]['week'],
    ];
    if (in_array($entry['teacher'], ['gen', 'fila'], true)) {
        continue;
    }
    $schedule[] = $entry;
}

$monitors = [];
if (is_file('data/GPU009.TXT')) {
    $fMonitor = fopen('data/GPU009.TXT', 'r');
    while ($cells = fgetcsv($fMonitor, separator: ";")) {
        if (count($cells) < 6) {
            continue;
        }
        $entry = [
            'place' => $cells[0],
            'teacher' => $cells[1],
            'week' => '',
            'day' => $cells[2],
            'beforeHour' => $cells[3],
        ];
        if ($entry['teacher'] === '') {
            continue;
        }
        $entry['week'] = intval(substr($cells[5], -2)) % 2 === 1 ? "B" : "A"; // seems wrong (A<->B), but works?
        $monitors[] = $entry;
    }
}
