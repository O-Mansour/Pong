#!/bin/bash

mkdir -p /etc/nginx/ssl

# openssl req -x509 -nodes -newkey rsa:2048 -keyout /etc/nginx/ssl/nginx_k.key \
# 		-out /etc/nginx/ssl/nginx_c.crt -subj "/CN=localhost"

exec nginx -g "daemon off;"
