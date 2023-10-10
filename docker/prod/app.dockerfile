FROM node:16-alpine

WORKDIR /app

RUN apk add --no-cache git
RUN git config --global --add safe.directory /app

COPY ../../app /app

CMD yarn; npx zenstack generate && npx prisma db push; npx prisma generate; yarn build; yarn start:prod;
