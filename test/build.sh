#!/bin/sh
# Builds test/preview.html: the real website (web/) wired to apps-script/Code.gs
# running on an in-memory mock Google Sheet. Admin password in the preview: secret123
cd "$(dirname "$0")/.."
python3 - <<'PY'
html = open('web/index.html').read()
mock = open('test/mock-gas.js').read() + open('apps-script/Code.gs').read()
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>' + open('web/styles.css').read() + '</style>')
html = html.replace('<script src="config.js"></script>', '<script>' + mock + '\nwindow.APP_CONFIG={API_URL:"mock://api"};</script>')
html = html.replace('<script src="app.js"></script>', '<script>' + open('web/app.js').read() + '</script>')
open('test/preview.html', 'w').write(html)
PY
echo built test/preview.html
