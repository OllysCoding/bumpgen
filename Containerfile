FROM node:22

RUN apt-get update
RUN apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev -y

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY ./apps ./apps
COPY ./packages ./packages

RUN ["npm", "install"]

# Build
RUN ["npm", "run", "build", "--workspaces"]
 
# Run
WORKDIR /usr/src/app/apps/backend
ENV CONFIG_FILE_PATH=/config/bumpgen.config.json
CMD ["node", "../../dist/backend/src/index.js"]
