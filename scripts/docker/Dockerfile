FROM keymetrics/pm2:12-alpine
WORKDIR /code

COPY package.json .
COPY tsconfig.json .
COPY ecosystem.config.js .
COPY src src/

RUN mkdir -p dist
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install
RUN npm run build

RUN ls -la dist

EXPOSE 80

CMD [ "pm2-runtime", "start", "ecosystem.config.js", "--env", "production"] 