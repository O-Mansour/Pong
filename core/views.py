from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.models import User, auth
# to send msgs for the user in the frontend
from django.contrib import messages

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from .models import Profile, Friendship

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

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.serializers import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from .serializers import ProfileSerializer, FriendshipSerializer
from django.db.models import Q

# from .pagination import DefaultPagination

class ProfileViewSet(ModelViewSet):
	queryset = Profile.objects.all()
	serializer_class = ProfileSerializer
	permission_classes = [IsAdminUser]

	# filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
	# filterset_fields = ['is_online']
	# search_fields = ['user__username']
	# ordering_fields = ['user__date_joined', 'wins']
	# pagination_class = DefaultPagination

	@action(detail=False, methods=['GET', 'PUT'], permission_classes=[IsAuthenticated])
	def me(self, request):
		(profile, created) = Profile.objects.get_or_create(user_id=request.user.id)
		if request.method == 'GET':
			serializer = ProfileSerializer(profile)
		elif request.method == 'PUT':
			serializer = ProfileSerializer(profile, data=request.data)
			serializer.is_valid(raise_exception=True)
			serializer.save()
		return Response(serializer.data)

class FriendshipViewSet(ModelViewSet):
	serializer_class = FriendshipSerializer
	permission_classes = [IsAuthenticated]

	def get_queryset(self):
		return Friendship.objects.filter(
			Q(sender=self.request.user) | Q(receiver=self.request.user)
		)

	def perform_create(self, serializer):
		receiver = serializer.validated_data['receiver']
		
		# Prevent self-friendship
		if receiver == self.request.user:
			raise ValidationError("You cannot send a friendship request to yourself.")

		# Check if friendship already exists
		if Friendship.objects.filter(
			(Q(sender=self.request.user) & Q(receiver=receiver)) |
			(Q(sender=receiver) & Q(receiver=self.request.user))
		).exists():
			raise ValidationError("Friendship request already exists.")
			
		serializer.save(sender=self.request.user)

	@action(detail=True, methods=['GET', 'PUT'])
	def accept(self, request, pk=None):
		friendship = self.get_object()
		if friendship.receiver != request.user:
			return Response(
				{'error': 'You can only accept requests sent to you'},
				status=status.HTTP_403_FORBIDDEN
			)
		if friendship.status != 'P':
			return Response(
				{'error': 'Can only accept pending requests'},
				status=status.HTTP_400_BAD_REQUEST
			)

		friendship.status = 'A'
		friendship.save()
		return Response(FriendshipSerializer(friendship).data)

	@action(detail=True, methods=['GET', 'PUT'])
	def reject(self, request, pk=None):
		friendship = self.get_object()
		if friendship.receiver != request.user:
			return Response(
				{'error': 'You can only reject requests sent to you'},
				status=status.HTTP_403_FORBIDDEN
			)
		if friendship.status != 'P':
			return Response(
				{'error': 'Can only reject pending requests'},
				status=status.HTTP_400_BAD_REQUEST
			)

		friendship.status = 'R'
		friendship.save()
		return Response(FriendshipSerializer(friendship).data)

	@action(detail=False, methods=['GET'])
	def friends(self, request):
		accepted_friendships = Friendship.objects.filter(
			(Q(sender=request.user) | Q(receiver=request.user)),
			status='A'
		)
		# return Response(FriendshipSerializer(accepted_friendships, many=True).data)
		friends_data = []
		for friendship in accepted_friendships:
			if friendship.sender == request.user:
				friend = friendship.receiver
			else:
				friend = friendship.sender
			# Serialize the friend's profile
			friend_profile = ProfileSerializer(friend.profile).data
			friends_data.append(friend_profile)

		return Response(friends_data)
