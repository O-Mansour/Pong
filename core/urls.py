from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
	path('', views.dashboard, name='dashboard'),
	path('login', views.login, name='login'),
	path('signup', views.signup, name='signup'),
	path('logout', views.logout, name='logout'),
	# path('profile/<str:pk>', views.profile, name='profile'),
	path('settings', views.settings, name='settings'),
	path('profiles/', views.profile_list),
	path('profiles/<int:id>/', views.profile_detail),

	path('forgotpassword', auth_views.PasswordResetView.as_view(template_name='forgetpassword.html'), name='forgotpassword'),
	path('password_reset_done', auth_views.PasswordResetDoneView.as_view(), name='password_reset_done'),
	path('password_reset_confirm/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
	path('password_reset_complete', auth_views.PasswordResetCompleteView.as_view(), name='password_reset_complete'),
]
