import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from pong_app.routing import websocket_urlpatterns  # Adjust this import path
from channels.security.websocket import AllowedHostsOriginValidator

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pong.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AllowedHostsOriginValidator(  # Add your custom middleware here
            AuthMiddlewareStack(
                URLRouter(
                    websocket_urlpatterns  # Your WebSocket URL routing
                )
            )
    ),
})

