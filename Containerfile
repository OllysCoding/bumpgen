FROM node:alpine

ENV PYTHONUNBUFFERED=1
RUN apk update
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN apk add --update --no-cache \
    make \
    g++ \
    jpeg-dev \
    cairo-dev \
    giflib-dev \
    pango-dev \
    libtool \
    autoconf \
    automake

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY ./apps ./apps
COPY ./packages ./packages

RUN ["npm", "install"]

# Build
RUN ["npm", "run", "build", "--workspaces"]
 
# Run
WORKDIR usr/src/app/apps/backend
ENV CONFIG_FILE_PATH=/config/bumpgen.config.json
CMD ["node", "../../dist/backend/src/index.js"]
