#!/bin/sh
# Builds test/preview.html: the real UI wired to Code.gs running on an in-memory mock sheet.
cd "$(dirname "$0")/.."
{ echo '<script>'; cat test/mock-gas.js; cat Code.gs; echo '</script>'; } > test/.inject.html
python3 -c "
s=open('Index.html').read(); inj=open('test/.inject.html').read()
open('test/preview.html','w').write(s.replace('<script>', inj+'<script>',1))"
rm test/.inject.html
echo built test/preview.html
