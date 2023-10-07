FROM node:16-alpine

WORKDIR /app

RUN apk add --no-cache git
RUN git config --global --add safe.directory /app

COPY ../../app/package.json ./
COPY ../../app/yarn.lock ./

CMD yarn; npx zenstack generate && npx prisma db push; npx prisma generate; npx prisma studio & yarn dev
