// CRM host. The page does not call this directly: the browser Origin is not
// on the CRM allowlist. api/public/website-callback.js and dev-server.py
// forward the booking JSON and must use this same host.
window.MOMENTO_CRM_ORIGIN = "https://crm-new-year.vercel.app";
