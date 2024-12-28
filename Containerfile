# Use 'builder' to install node_modules as we need a lot of native dependencies to
# run yarn install.
FROM node:alpine AS builder

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

COPY package*.json ./

RUN npm install

FROM node:alpine AS app

WORKDIR /usr/src/app

COPY --from=BUILDER node_modules ./node_modules

COPY . .

# Build
RUN npm run build
 
# Run
ENV CONFIG_FILE_PATH=/config/bumpgen.config.json
CMD ["npm", "run", "start"]
