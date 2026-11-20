"""Serve the static site and forward the booking POST to the live CRM.

Stock http.server cannot do this: the CRM rejects every browser Origin except
http://localhost:3000, and that port is the CRM itself. This process keeps the
page and the callback on one origin, then calls the CRM with no Origin header.
The CRM URL must stay in sync with js/config.js.
"""

import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib import error, request

CRM_CALLBACK = "https://crm-new-year.vercel.app/api/public/website-callback"
CALLBACK_PATH = "/api/public/website-callback"
MAX_BODY = 16 * 1024


class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        path = self.path.split("?", 1)[0]
        if path != CALLBACK_PATH:
            self.send_error(404)
            return

        length = int(self.headers.get("Content-Length", "0") or "0")
        if length > MAX_BODY:
            body = '{"error":"Слишком длинная заявка"}'.encode("utf-8")
            self._send(400, "application/json; charset=utf-8", body)
            return

        raw = self.rfile.read(length)
        upstream = request.Request(
            CRM_CALLBACK,
            data=raw,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        )
        try:
            with request.urlopen(upstream) as response:
                body = response.read()
                status = response.status
                content_type = response.headers.get("Content-Type", "application/json")
        except error.HTTPError as response:
            body = response.read()
            status = response.code
            content_type = response.headers.get("Content-Type", "application/json")
        print(f"CRM {status} {body.decode('utf-8', 'replace')}", flush=True)
        self._send(status, content_type, body)

    def _send(self, status, content_type, body):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"http://127.0.0.1:{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
