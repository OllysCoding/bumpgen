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

RUN npm install

FROM node:alpine AS app

COPY . .

# Build
RUN npm run build --workspaces
 
# Run
ENV CONFIG_FILE_PATH=/config/bumpgen.config.json
CMD ["npm", "run", "start" "--workspace=apps/backend"]
