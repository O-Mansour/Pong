from django.contrib.auth.models import User

def get_unique_username(base_username):
    counter = 1
    username = base_username
    while User.objects.filter(username=username).exists():
        username = f"{base_username}{counter}"
        counter += 1
    return username

def profileimg_path(instance, filename):
    return f"profile_images/{instance.user.username}.jpg"

from rest_framework_simplejwt.authentication import JWTAuthentication

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        access_token = request.COOKIES.get('access_token')
        if access_token:
            validated_token = self.get_validated_token(access_token)
            return self.get_user(validated_token), validated_token
        return None
