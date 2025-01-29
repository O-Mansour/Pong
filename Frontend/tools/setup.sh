#!/bin/bash

mkdir -p /etc/nginx/ssl

sed -i "s|\$SSL_CERT|$SSL_CERT|g; s|\$SSL_KEY|$SSL_KEY|g" /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"
