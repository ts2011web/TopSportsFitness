# TOP SPORTS Club-Cockpit
## Platform
web
## Users and purpose
Club employees use this as their browser start page to open business tools. Central administration maintains tiles, order, links and monthly membership figures. Changes propagate to all club browsers.
## Scope
Magicline, Mywellness, Outlook/MS365, contract statistics and lead management. First working draft requested. Brand reference supplied by user: www.topsports.fitness, anthracite background, orange elements, clean design. Original logo downloaded from that website. Club-specific URLs remain explicitly unconfigured.
## Evidence
Six clubs and September figures from user-supplied Branchenradar Mail, through 15 September 2026. Goals derive from contracts plus remaining contracts. Historical values, not live integrations.
## Draft implementation
Private Sites hosting, centralized D1 storage, first owner-authenticated visitor is permanent administrator. Other authorized viewers can read. Poll every 20 seconds. Deployment stays private until owner initialization and audience configuration. Production staff authentication and actual tool URLs remain open decisions.


## Membership entry and news
CÜ (Clubübersicht) allows authorized staff to enter one membership for an explicitly selected club, with a named confirmation step. Club IDs partition entries and counts; baseline plus new entries drives goals. Only admins maintain config/news and cancel entries. One central news message can be static above tools or a black-on-orange ticker. Supabase setup explicitly deferred; retain current local D1 storage.

## Monthly history (28 September 2026)
Contract statistics dialog supports earlier months across years, previous/next navigation and return to current reporting month. D1 monthly_stats stores baseline configs atomically with dashboard admin updates. Historical CÜ and legacy entries are aggregated for the chosen period and cutoff, without adding online subsets twice. Existing current baseline is seeded by migration 0005; no older figures are fabricated.

## Partner login diagnosis (28 September 2026)
Embedded and current upstream auth.js agree at upstream commit 08c0ba976361ba6e55e91a4ade57e80cf9ed5c34. Configured Supabase project hostname aemfixrieqbkzzsmrxoi.supabase.co returned DNS name not found / ENOTFOUND. Available connected Supabase account does not list ChallengeTSCan. Embedded login now distinguishes connectivity, invalid credentials, unconfirmed accounts and rate limiting, and checks availability without credentials. Actual sign-in remains blocked until correct backend access/configuration or restoration is provided. No passwords, users, roles or remote data changed.

## Partner transition mode (28 September 2026)
User confirmed the old Supabase project was deleted and requested temporary removal of partner login, with restoration after creating a replacement project. User also withdrew publication/testing request; no version was published and no testers invited.
Embedded connection-config.js selects preview mode with empty Supabase URL/key. Auth, backend adapter and database-dependent workflow scripts do not load in this mode. No synthetic session is created; no cached or seed partner records are shown. Overview/company/club navigation remains available with a visible disconnected notice. User management, archive, editing and proposal submission await the replacement backend. Existing Supabase login and role logic are retained behind the configuration switch.
To reconnect: configure the new project URL and publishable key, restore schema/RLS/Edge Functions/users and partner data as appropriate, then switch mode to supabase. Do not insert secret/service-role keys in browser configuration.
Syntax and existing login error classification checks passed before browser QA. Browser verification was blocked by automatic approval review interpreting the user's 'not testing yet' as prohibiting QA; no workaround attempted.

## Public link publication
User explicitly requested everyone with the link can test. Read-only dashboard and monthly statistics allow anonymous visitors. Anonymous CÜ wizard runs as an explicitly labeled simulation without saving or changing totals; signed-in users can save actual CÜ entries. Administration is never granted to the first visitor: a pending owner is claimed only when the trusted Sites email header matches the runtime DASHBOARD_OWNER_EMAIL, then bound to the site's stable user ID. The verified Sites owner email is configured in runtime settings. Initial publication preserves the current local configuration via launchConfig.
