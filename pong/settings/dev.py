from .common import *

DEBUG = True

SECRET_KEY = 'django-insecure-0kuvujmviyb^l0n$b_n=o)syf3*n5ul1#7&#b1jqs5i4nwc1s+'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'pong_db',
        'USER': 'postgres',
        'PASSWORD': '12345678',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
