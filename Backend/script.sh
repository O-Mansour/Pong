#!/bin/bash

# Wait for the database to be ready
echo "Waiting for database..."
until python manage.py migrate; do
  sleep 1
done
echo "Database is ready!"

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser if it doesn't exist
python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', '123')
"
python manage.py runserver 0.0.0.0:8000
