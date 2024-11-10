from django.urls import path
from django.urls.conf import include
from django.contrib.auth import views as auth_views
from . import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register('profiles', views.ProfileViewSet)
router.register('friendships', views.FriendshipViewSet, basename='friendship')
router.register('matches', views.MatchViewSet, basename='match')

urlpatterns = [
	path('', views.dashboard, name='dashboard'),
	path('login', views.login, name='login'),
	path('signup', views.signup, name='signup'),
	path('logout', views.logout, name='logout'),
	# path('profile/<str:pk>', views.profile, name='profile'),
	path('settings', views.settings, name='settings'),
	path('', include(router.urls)),

	path('forgotpassword', auth_views.PasswordResetView.as_view(template_name='forgetpassword.html'), name='forgotpassword'),
	path('password_reset_done', auth_views.PasswordResetDoneView.as_view(), name='password_reset_done'),
	path('password_reset_confirm/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
	path('password_reset_complete', auth_views.PasswordResetCompleteView.as_view(), name='password_reset_complete'),
]
