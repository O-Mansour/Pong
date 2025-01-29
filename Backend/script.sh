#!/bin/bash

echo "Waiting for database..."
until python manage.py migrate; do
  sleep 1
done
echo "Database is ready!"

python manage.py makemigrations
python manage.py migrate

mkdir -p /etc/nginx/ssl

sed -i "s|\$SSL_CERT|$SSL_CERT|g; s|\$SSL_KEY|$SSL_KEY|g" /etc/nginx/conf.d/default.conf

python manage.py runserver 0.0.0.0:8000
