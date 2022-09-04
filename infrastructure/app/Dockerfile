FROM node:16-alpine

WORKDIR /usr/src/scorekeeper

COPY .env .
COPY package.json .
COPY app ./app
COPY remix.config.js .
COPY pnpm-*.yaml .

RUN npm install -g pnpm
RUN pnpm install --unsafe-perm
RUN pnpm run build

CMD ["pnpm", "start"]
