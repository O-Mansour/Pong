FROM node:18 AS build

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN npx vite build --config vite.config.js


FROM nginx:alpine

WORKDIR /usr/share/nginx/html

COPY tools/nginx.conf /etc/nginx/conf.d/default.conf


COPY --from=build /app/dist .

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
