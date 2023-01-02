FROM node:18.12.1

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

ADD . /usr/src/app

RUN npm run build-ts

CMD ["node", "dist/index.js"]
