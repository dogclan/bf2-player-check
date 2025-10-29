FROM node:22.21.1

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

ADD . /usr/src/app

RUN npm run build-ts

RUN npm prune --omit=dev

CMD ["node", "dist/index.js"]
