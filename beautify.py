import bs4
import jsbeautifier
import json
import os
import re
from pathlib import Path


def beautifyJs(content):
    return jsbeautifier.beautify(content)


def beautifyJson(content):
    return json.dumps(json.loads(content), indent=2)


def beautifyHtml(content):
    soup = bs4.BeautifulSoup(content, "html.parser")
    html = soup.prettify()
    html = re.sub(r"^(\s+)", r"\1\1", html, flags=re.MULTILINE)
    return html


BEAUTIFIERS = {"js": beautifyJs, "json": beautifyJson, "html": beautifyHtml}

for root, dirs, files in os.walk("."):
    for name in files:
        if name != "jquery-3.6.0.min.js":
            ext = os.path.splitext(name)[1][1:]
            beautifier = BEAUTIFIERS.get(ext)
            if beautifier:
                path = Path(os.path.join(root, name))
                print(f"Beautifying {path}...")
                content = beautifier(path.read_text())
                path.write_text(content)
