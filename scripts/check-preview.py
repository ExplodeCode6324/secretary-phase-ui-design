"""Check standalone asset links and absence of accidental local-only references."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re

root = Path(__file__).resolve().parents[1]
errors = []
class Links(HTMLParser):
    def __init__(self, source):
        super().__init__(); self.source = source
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key not in ('href', 'src') or not value:
                continue
            parsed = urlsplit(value)
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            target = self.source.parent / unquote(parsed.path)
            if not target.exists():
                errors.append(f'{self.source.relative_to(root)}: missing {value}')
for path in root.rglob('*.html'):
    Links(path).feed(path.read_text())
for path in [root/'prototype.js', root/'signal-motion.js', root/'style.css', root/'index.html']:
    text = path.read_text()
    if re.search(r'/Users/|/home/|[A-Z]:\\\\', text):
        errors.append(f'{path.name}: machine-specific path')
    if path.suffix == '.js' and re.search(r'\b(fetch|XMLHttpRequest|WebSocket)\s*\(', text):
        errors.append(f'{path.name}: network operation in static preview')
    if path.suffix == '.js':
        for ref in re.findall(r'(?:href|src)="([^"$]+)"', text):
            parsed = urlsplit(ref)
            if not parsed.scheme and parsed.path and not (root/unquote(parsed.path)).exists():
                errors.append(f'{path.name}: missing {ref}')
if errors:
    raise SystemExit('\n'.join(errors))
print('PASS: standalone HTML/assets, portable entry files, no application network calls')
