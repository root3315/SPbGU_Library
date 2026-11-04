"""Локальный сервер прототипа без кеша: правки видны сразу после обновления страницы."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PORT = 8765
ROOT = Path(__file__).resolve().parent.parent / "prototype"


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


ThreadingHTTPServer(("127.0.0.1", PORT), partial(NoCacheHandler, directory=str(ROOT))).serve_forever()
