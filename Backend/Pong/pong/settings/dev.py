from .common import *
import os

DEBUG = True

SECRET_KEY = 'django-insecure-0kuvujmviyb^l0n$b_n=o)syf3*n5ul1#7&#b1jqs5i4nwc1s+'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': '5432',
    }
}
