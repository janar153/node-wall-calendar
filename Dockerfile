FROM node:16.13

WORKDIR /app

COPY . /app

RUN npm ci && \
    npm run build

CMD [ "npm", "run", "start" ]
