# Stundenplan

## Daten

UNTIS-Datenexport durchführen. Dateien speichern in `data`:

- `GPU001.TXT`: Stundenplan
- `GPU002.TXT`: Stundenplan
- `GPU009.TXT`: Aufsichten
- `GPU018.TXT`: Ferien und Feiertage (wird aktuell nicht verwendet, ist auch nicht vollständig)

### Datenformate

- `GPU001.TXT`: `id;Klasse;Lehrer;Fach;Raum;Tag (1=Montag, ...);Stunde;;`
- `GPU002.TXT`: `id;?;?;?;Klasse;Lehrer;Fach;Raum;?;?;?;Woche;?;?;?;?;?;;;;;;;?;;;;?;?;;?;;;?;?;;;;;?;?;;;;;?`
- `GPU009.TXT`: `Ort;Lehrer;Tag;vor welcher Stunde;Dauer (Minuten);Kalenderwochen;`
- `GPU018.TXT`: `Bezeichnung;Termin lesbar;Von (YYYYMMDD);Bis (YYYYMMDD);"F" bei Feiertagen?`

## Verwendung

### Dev

Run

```bash
$ php json.php > data/schedule.json
```

in `schedule.ts`: `DEBUG = true`

Compile TypeScript:

```bash
$ tsc
```

Live Server

### Production

in `schedule.ts`: `DEBUG = false`

Compile TypeScript:

```bash
$ tsc
```

Upload
