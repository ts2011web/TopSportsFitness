# TOP SPORTS – Live-Einrichtung

Ziel: `ts2011web/TopSportsFitness`, Supabase-Projekt `iwsnablrfbtwrtdvkxsi`.
Startmonat: Oktober 2026, Ausgangsstand 30.09.2026, alle Werte 0. Ziele werden vom Admin gesetzt. Die September-Beispielzahlen werden nicht in die Live-Datenbank übernommen.

## Betrieb

GitHub Pages muss unter Settings → Pages → Source auf GitHub Actions stehen. Zieladresse: https://ts2011web.github.io/TopSportsFitness/

In Supabase Authentication → URL Configuration diese Adresse als Site URL und erlaubte Redirect URL setzen. Die Bestätigung von E-Mail-Adressen aktiviert keine beliebigen Zugänge: Der Datenbankzugriff setzt zusätzlich eine ausdrückliche Freigabe voraus. Der anfängliche Admin ist ausschließlich die bestätigte Adresse `ts2011web@gmail.com`.

Erster Start: Auf der Anmeldeseite „Zugang aktivieren“, ein eigenes Passwort setzen und die E-Mail bestätigen. In Verwalten → Zugänge Mitarbeiter und ihre Standorte freigeben. Ein Startpasswort mit mindestens 16 Zeichen ermöglicht dem Admin die direkte Anlage eines Zugangs ohne Einladungs-E-Mail. Mitarbeiter können nach der Anmeldung ihr Passwort ändern. Für zuverlässige Bestätigungs- und Passwort-vergessen-E-Mails an alle Mitarbeiter muss eigener SMTP-Versand in Supabase eingerichtet werden; der Standardversand ist dafür nicht als Produktionslösung vorgesehen.

## CÜ und Korrekturen

Mitarbeiter erfassen nur an ihren freigegebenen Standorten. Pro Standort und Tag ist eine aktive Meldung erlaubt. Online-Abschlüsse sind Teil der Tarifsumme. Ein wiederholter identischer Speicherversuch zählt nicht erneut.

Admins können im CÜ-Dialog den Tag wählen und „Tagesmeldung korrigieren“ öffnen. Standort und Datum bleiben fest. Ein Korrekturgrund ist Pflicht. Alte und neue Werte werden samt Benutzerkennung protokolliert. Veraltete Bearbeitungen werden abgewiesen. Stornierungen behalten den Datensatz und den Verlauf. Bereits in einem Ausgangsstand enthaltene Tage sind gesperrt; deren aggregierte Baseline kann ein Admin in der Verwaltung anpassen.

## Datenzugriff

Alle Tabellen liegen im nicht exponierten Schema `cockpit_private`, haben RLS aktiviert und keinerlei Tabellenrechte für `anon` oder `authenticated`. Die öffentliche RPC-Funktion ist SECURITY INVOKER und delegiert ausschließlich an die kontrollierte API im privaten Schema. Diese validiert die aktuelle Benutzerfreigabe, Rollen, Club-Zuordnung und Daten serverseitig; sie ist bewusst die einzige Schreibschnittstelle. Der RLS-Hinweis „enabled, no policy“ ist hier erwartetes Deny-by-default, kein fehlendes öffentliches Zugriffsrecht. Rollen stammen nie aus `user_metadata`.

Die Edge Function `cockpit-users` prüft den Token mit Auth getUser und die aktuelle Adminrolle über dieselbe Datenbank-API. Ihre Gateway-JWT-Prüfung ist wegen der eigenen Auth-Prüfung deaktiviert. Der Service-Schlüssel bleibt ausschließlich in der Supabase-Laufzeit. Browser und Repository enthalten nur den publishable Key.

`tests/supabase-security.sql` prüft echte Datenbankrechte und CÜ-Operationen in einer zurückgerollten Transaktion. Keine Testmeldungen bleiben zurück. Vor Freigabe zusätzlich die echte Anmelde- und Mitarbeitererfassung im Browser prüfen.

Prüfstand 14.10.2026: Datenbanktests einschließlich Korrektur, Historie, Rechteentzug, fremdem Standort und doppelten Tagen bestanden. Browserbedienung mit vollständig abgefangenen externen Anfragen geprüft (Desktop/Mobil, Anmeldung, CÜ-Erfassung, Korrektur und Zugangsverwaltung). Keine echten Browser-Testmeldungen angelegt; temporäre Auth-Testkonten vollständig entfernt. TypeScript und Pages-Build erfolgreich. Nach gezielten Paketupdates meldet `npm audit --omit=dev` 0 bekannte Schwachstellen. Das ersetzt keine vollständige Sicherheitsgarantie oder den noch ausstehenden echten Anmeldetest des Eigentümers.

## Erhaltene Module und offene Betriebsentscheidungen

Der Design-Editor einschließlich bearbeitbarem Kursplan wird übernommen. Eigene Editorentwürfe bleiben browserlokal. Firmen-/Vereinsfitness bleibt vorerst im bisherigen, ausdrücklich gekennzeichneten Beispielmodus; dessen eigene Partnerdatenbank, Rollen und Alt-Funktionen sind durch die Cockpit-Anbindung noch nicht wiederhergestellt. Vor realer Partnerpflege separat migrieren und testen.

Backups, Wiederherstellung und SMTP vor dem verbindlichen täglichen Betrieb konfigurieren. Der aktuelle Supabase-Free-Plan zeigte im Projekt-Dashboard keine Backups. Vor einem Planwechsel Kosten mit dem Eigentümer klären.
