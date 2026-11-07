
set -e
npx prisma migrate deploy
exec node dist/main
