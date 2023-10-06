FROM node:16-alpine

WORKDIR /app

COPY ../../app ./

CMD yarn; npx zenstack generate && npx prisma db push; npx prisma generate; yarn build; yarn start:prod;
