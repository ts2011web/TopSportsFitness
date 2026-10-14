# TOP SPORTS Club-Cockpit

Club-Startseite mit Tools, News, Vertragszahlen, CÜ und integriertem Design-Editor.

Supabase-Anbindung mit persönlicher Anmeldung, Adminverwaltung und festen Standortrechten. Tagesmeldungen sind eindeutig je Standort und Tag. Online-Abschlüsse zählen als Teil der Gesamtsumme. Admins können Meldungen mit Korrekturgrund und Änderungsverlauf berichtigen.

Einrichtung, Prüfungen und noch offene Betriebsentscheidungen: [LIVE-SETUP.md](LIVE-SETUP.md).

Lokaler Build: `npm ci`, anschließend `VITE_COCKPIT_MODE=live npm run build:pages`. Ohne Live-Modus wird eine statische Vorschau erstellt. Geheime Schlüssel gehören nicht in das Repository.
