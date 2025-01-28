FROM nginx:alpine

RUN apk update && apk add --no-cache openssl bash

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html

COPY tools/setup.sh /tmp/setup.sh

RUN chmod +x /tmp/setup.sh

ENTRYPOINT ["bash"]

CMD ["-c", "/tmp/setup.sh"]
