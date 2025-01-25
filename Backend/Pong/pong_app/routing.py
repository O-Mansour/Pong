from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'pong/1vs1-remote/$', consumers.PongGameRemoteConsumer.as_asgi()),
    re_path(r'pong/1vs1-local/$', consumers.PongGameLocalConsumer.as_asgi()),
    re_path(r'pong/tournament/$', consumers.PongGameTournamentConsumer.as_asgi()),
]