from .common import *
import os

DEBUG = True


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

ALLOWED_HOSTS = [
    'localhost',
    ]

SECRET_KEY = 'django-insecure-0kuvujmviyb^l0n$b_n=o)syf3*n5ul1#7&#b1jqs5i4nwc1s+'
FT_CLIENT_SECRET = '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'

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("JWT",),
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}


# CSRF_COOKIE_SECURE = True  # Ensures that the CSRF cookie is only sent over HTTPS connections
# SESSION_COOKIE_SECURE = True  # Session cookies are only sent over HTTPS connections.