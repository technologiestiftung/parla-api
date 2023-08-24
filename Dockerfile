
FROM node:20.5.1-bookworm-slim AS build
WORKDIR /usr/src/app
RUN apt-get update && apt-get install -y python3 build-essential
COPY . .
RUN npm ci && npm run build

FROM node:20.5.1-bookworm-slim

ARG PORT=8080
ENV PORT $PORT

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/dist /usr/src/app/package.json /usr/src/app/package-lock.json ./
RUN apt-get update && apt-get install -y python3 build-essential && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
RUN
RUN npm ci --production


ENV TINI_VERSION v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
RUN chown -R node /usr/src/app
USER node

EXPOSE 8080
ENTRYPOINT ["/tini", "--"]
CMD ["node", "index.js"]
