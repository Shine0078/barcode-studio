# Privacy model

Barcode Studio is designed so that barcode data cannot leak, because it never
leaves the page.

## Guarantees

- **No uploads.** Values are encoded with `bwip-js` compiled into the client
  bundle. There is no API call to generate a barcode, and no `fetch`/`XHR` is
  used anywhere in the app.
- **No persistence.** Values live in React state for the lifetime of the tab.
  Nothing is written to `localStorage`, cookies, IndexedDB or the service
  worker cache.
- **No accounts.** There is no sign-in, no user identifier and no server-side
  session.
- **No analytics, ads or watermarks.** No third-party scripts are loaded.
- **No tracking headers.** The deployed site sends
  `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY` and a restrictive `Permissions-Policy`
  (`public/_headers`).

## What a host can still see

Any website you load reveals ordinary request metadata to its host — IP
address, user agent, the page requested. Cloudflare Pages sees that for this
site, as any web server would. It does **not** see the values you type, because
those are never transmitted.

## Verifying it

1. Open DevTools → **Network**, clear the log, then type values, print and
   download a barcode. No request carries your data; the only requests are the
   HTML/JS/CSS assets.
2. Search the source for network calls:
   `rg -n "fetch\\(|XMLHttpRequest|navigator\\.sendBeacon" src`
3. Disconnect from the network after loading once; the generator keeps working.

## Offline use

Because everything is client-side, the app works offline once the assets are
loaded. To make it installable, add a web app manifest and a service worker;
this is intentionally left out to keep the privacy story simple and the
footprint small.
