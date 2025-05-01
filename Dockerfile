FROM node:22.15.0

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

ADD . /usr/src/app

RUN npm run build-ts

CMD ["node", "dist/index.js"]
