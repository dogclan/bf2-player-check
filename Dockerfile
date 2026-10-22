FROM node:24.22.1

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

ADD . /usr/src/app

RUN npm run build-ts

RUN npm prune --omit=dev

CMD ["node", "dist/bin/bot.js"]
