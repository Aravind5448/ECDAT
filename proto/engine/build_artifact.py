"""
Build a single self-contained HTML file of the dashboard, for hosting.

The local prototype (ui/index.html) is the real deliverable and runs air-gapped
off the filesystem. This produces a shareable copy of exactly the same UI, with
two differences forced by the hosting viewer:

  * download controls are hidden (ECDAT_NO_DOWNLOAD), because the viewer never
    grants a page permission to hand a file to the reader;
  * the file-saving helper is stripped entirely, so the hosted copy carries no
    unreachable download code.
"""

import io
import os
import re

UI = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ui")

SCOPE_CSS = """
/* Hosted copy owns its neutral enterprise surface so a host page cannot alter it. */
:root, :root[data-theme="light"], :root[data-theme="dark"] { color-scheme: light; }
html, body { background: #f5f7fa !important; color: #172033; }
"""

FORBIDDEN = (r"<!DOCTYPE", r"<html\b", r"<head\s*[>\s]", r"<body\b")


def build():
    read = lambda f: io.open(os.path.join(UI, f), encoding="utf-8").read()
    html, css, app, data = read("index.html"), read("styles.css"), read("app.js"), read("data.js")

    # The host supplies doctype/html/head/body, so emit body content only.
    body = html.split("<body>", 1)[1].split("</body>", 1)[0]
    body = re.sub(r'<script src="[^"]+"></script>\s*', "", body)

    app_hosted = re.sub(
        r"function download\(name, text\) \{.*?\n\}",
        "function download() { /* file saving is unavailable in the hosted copy */ }",
        app, flags=re.S)
    assert "URL.createObjectURL" not in app_hosted, "download helper was not stripped"

    out = ("<title>ECDAT Analyst Console</title>\n"
           "<style>\n" + css + SCOPE_CSS + "</style>\n"
           + body + "\n"
           "<script>window.ECDAT_NO_DOWNLOAD = true;</script>\n"
           "<script>\n" + data + "</script>\n"
           "<script>\n" + app_hosted + "</script>\n")

    for pat in FORBIDDEN:
        assert not re.search(pat, out, re.I), f"wrapper tag {pat} must not appear"

    path = os.path.join(UI, "ecdat-console.artifact.html")
    io.open(path, "w", encoding="utf-8").write(out)
    print(f"wrote {path}  {os.path.getsize(path) / 1e6:.2f} MB")
    return path


if __name__ == "__main__":
    build()
