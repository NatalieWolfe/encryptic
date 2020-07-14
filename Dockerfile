FROM node:14

RUN apt-get update && apt-get install -y gcc

WORKDIR /app

COPY *.json ./
RUN npm install --production

COPY config/default.json ./config/default.json
COPY config/docker-dev.json ./config/local.json
COPY lib ./lib
COPY routes ./routes
COPY *.ts ./

EXPOSE 8080
CMD ["npm", "run", "start-parsed"]
