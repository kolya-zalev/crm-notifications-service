
set -e
npx typeorm migration:run -d dist/data-source.js
exec node dist/main
