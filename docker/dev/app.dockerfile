FROM node:16-alpine

WORKDIR /app

COPY ../../app/package.json ./
COPY ../../app/yarn.lock ./

CMD yarn; npx zenstack generate && npx prisma db push; npx prisma generate; npx prisma studio & yarn dev
