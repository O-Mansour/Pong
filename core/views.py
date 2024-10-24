from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.models import User, auth
# to send msgs for the user in the frontend
from django.contrib import messages

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from .models import Profile

# Create your views here.

@login_required(login_url='login')
def dashboard(request):
	return render(request, 'homedashboard.html')

@login_required(login_url='login')
def settings(request):
	return render(request, 'settings.html')

def login(request):
	if request.method == 'POST':
		username = request.POST['username']
		password = request.POST['password']

		user = auth.authenticate(username=username, password=password)
		if user is not None:
			auth.login(request, user)
			return redirect('/')
		else:
			messages.info(request, 'Invalid Credentials')
			return redirect('login')
	else:
		return render(request, 'login.html')

def forgotpassword(request):
	# if request.method == 'POST':
	# 	username = request.POST['username']
	# 	password = request.POST['password']

	# 	user = auth.authenticate(username=username, password=password)
	# 	if user is not None:
	# 		auth.login(request, user)
	# 		return redirect('/')
	# 	else:
	# 		messages.info(request, 'Invalid Credentials')
	# 		return redirect('login')
	# else:# if request.method == 'POST':
	# 	username = request.POST['username']
	# 	password = request.POST['password']

	# 	user = auth.authenticate(username=username, password=password)
	# 	if user is not None:
	# 		auth.login(request, user)
	# 		return redirect('/')
	# 	else:
	# 		messages.info(request, 'Invalid Credentials')
	# 		return redirect('login')
	# else:
		return render(request, 'forgetpassword.html')

@login_required(login_url='login')
def logout(request):
	auth.logout(request)
	return redirect('login')

def signup(request):
	if request.method == 'POST':
		username = request.POST['username']
		email = request.POST['email']
		password = request.POST['password']
		confirm_pass = request.POST['confirm_pass']

		if password == confirm_pass:
			if User.objects.filter(email=email).exists():
				messages.info(request, 'Email is already used')
				return redirect('signup')
			elif User.objects.filter(username=username).exists():
				messages.info(request, 'Username is already Taken')
				return redirect('signup')
			else:
				user = User.objects.create_user(username=username, email=email, password=password)
				user.save()

				# log the user in and redirect to dashboard

				#create a profile object
				user_model = User.objects.get(username=username)
				new_profile = Profile.objects.create(user=user_model)
				new_profile.save()
				return redirect('login')
		else:
			messages.info(request, 'Passwords Not Matching')
			return redirect('signup')
	else:
		return render(request, 'signup.html')

@login_required(login_url='login')
def profile(request, pk):
	#will finish it lateeeeer

	# user_object = User.objects.get(username=pk)
	# user_profile = Profile.objects.get(user=user_object)
	return render(request, 'profile.html')

# api

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.viewsets import ModelViewSet
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .serializers import ProfileSerializer
from .pagination import DefaultPagination

class ProfileViewSet(ModelViewSet):
	http_method_names = ['get', 'patch', 'delete']
	queryset = Profile.objects.all()
	serializer_class = ProfileSerializer

	filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
	filterset_fields = ['is_online']
	search_fields = ['user__username']
	ordering_fields = ['user__date_joined', 'wins']
	pagination_class = DefaultPagination

	def get_serializer_context(self):
		return {'request': self.request}
