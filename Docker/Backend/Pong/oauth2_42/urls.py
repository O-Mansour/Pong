from allauth.socialaccount.providers.oauth2.urls import default_urlpatterns
from .provider import Provider42

urlpatterns = default_urlpatterns(Provider42)
