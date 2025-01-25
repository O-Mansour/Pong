import os
from .common import *

DEBUG = False

SECRET_KEY = os.environ['SECRET_KEY']

ALLOWED_HOSTS = []

CSRF_COOKIE_SECURE = True  # Ensures that the CSRF cookie is only sent over HTTPS connections
SESSION_COOKIE_SECURE = True  # Session cookies are only sent over HTTPS connections.