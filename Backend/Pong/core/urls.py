from django.urls import path
from django.urls.conf import include
from . import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register('profiles', views.ProfileViewSet)
router.register('friendships', views.FriendshipViewSet, basename='friendship')
router.register('matches', views.MatchViewSet, basename='match')

urlpatterns = [
	path('api/', include(router.urls)),
	path('auth/login/', views.LoginView.as_view()),
	path('auth/register/', views.RegistrationView.as_view()),
	path('auth/42login/', views.FT_LoginView.as_view()),
	path('auth/42callback/', views.FT_CallbackView.as_view()),
	path('auth/logout/', views.LogoutView.as_view()),
]
