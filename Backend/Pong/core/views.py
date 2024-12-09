from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.serializers import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .serializers import ProfileSerializer, FriendshipSerializer, MatchSerializer, UserSerializer, PasswordSerializer, FriendshipRequestsReceivedSerializer, FriendshipRequestsSentSerializer
from .models import Profile, Friendship, Match
from .helpers import get_unique_username
# from .pagination import DefaultPagination
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
import requests
from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from django.http import JsonResponse

class ProfileViewSet(ModelViewSet):
	queryset = Profile.objects.order_by('-level', '-xps')
	serializer_class = ProfileSerializer
	permission_classes = [IsAuthenticated]

	# filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
	# filterset_fields = ['is_online']
	# search_fields = ['user__username']
	# ordering_fields = ['level', 'xps']
	# pagination_class = DefaultPagination

	@action(detail=False, methods=['GET', 'PUT'])
	def me(self, request):
		(profile, created) = Profile.objects.get_or_create(user_id=request.user.id)
		if request.method == 'GET':
			serializer = ProfileSerializer(profile)
		elif request.method == 'PUT':
			serializer = ProfileSerializer(profile, data=request.data)
			serializer.is_valid(raise_exception=True)
			serializer.save()
		return Response(serializer.data)
	
	@action(detail=False, methods=['POST'])
	def change_password(self, request):
		serializer = PasswordSerializer(
			data=request.data, 
			context={'request': request}
		)
		
		if serializer.is_valid():
			serializer.save()
			return Response(
				{"message": "Password changed successfully"}, 
				status=status.HTTP_200_OK
			)
		
		return Response(
			serializer.errors, 
			status=status.HTTP_400_BAD_REQUEST
		)

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

		# Check for existing non-accepted friendship requests
		existing_friendship = Friendship.objects.filter(
			(Q(sender=self.request.user) & Q(receiver=receiver)) |
			(Q(sender=receiver) & Q(receiver=self.request.user))
		).exclude(status='A')  # Exclude accepted friendships

		if existing_friendship.exists():
			# Check if all existing requests are rejected
			if all(friendship.status == 'R' for friendship in existing_friendship):
				# Allow new request if all previous were rejected
				serializer.save(sender=self.request.user)
			else:
				raise ValidationError("Friendship request already exists.")
		else:
			# No existing requests, create new
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

	# need some tests on those requests
	@action(detail=False, methods=['GET'])
	def requests_received(self, request):
		pending_friendships = Friendship.objects.filter(
			(Q(receiver=request.user)), status='P')
		return Response(FriendshipRequestsReceivedSerializer(pending_friendships, many=True).data)

	@action(detail=False, methods=['GET'])
	def requests_sent(self, request):
		pending_friendships = Friendship.objects.filter(
			(Q(sender=request.user)), status='P')
		return Response(FriendshipRequestsSentSerializer(pending_friendships, many=True).data)

class MatchViewSet(ModelViewSet):
	serializer_class = MatchSerializer
	permission_classes = [IsAuthenticated]

	def get_queryset(self):
		return Match.objects.filter(player=self.request.user.profile)

	def perform_create(self, serializer):
		opponent = serializer.validated_data['opponent']
		
		if opponent == self.request.user.profile:
			raise ValidationError("You cannot play a match with yourself.")

		serializer.save(player=self.request.user.profile)

class RegistrationView(APIView):
	def post(self, request):
		serializer = UserSerializer(data=request.data)
		if serializer.is_valid():
			user = serializer.save()
			refresh = RefreshToken.for_user(user)
			return Response({
				'refresh': str(refresh),
				'access': str(refresh.access_token),
			})
		return Response(serializer.errors, status=400)

class LoginView(APIView):
	def post(self, request):
		username = request.data.get('username')
		password = request.data.get('password')
		user = authenticate(username=username, password=password)
		
		if user:
			refresh = RefreshToken.for_user(user)
			return Response({
				'refresh': str(refresh),
				'access': str(refresh.access_token),
			})
		return Response({'error': 'Invalid credentials'}, status=401)

class FT_LoginView(APIView):
	def get(self, request):
		redirect_uri = settings.SITE_URL
		return Response({
			'authorization_url': f"https://api.intra.42.fr/oauth/authorize?client_id={settings.FT_CLIENT_ID}&redirect_uri={redirect_uri}&response_type=code"
		})

class FT_CallbackView(APIView):
	def get(self, request):
		code = request.GET.get('code')
		if not code:
			return Response({'error': 'Authorization code not found.'}, status=400)
		
		# Exchange code for token
		token_response = requests.post(
			'https://api.intra.42.fr/oauth/token',
			data={
				'grant_type': 'authorization_code',
				'client_id': settings.FT_CLIENT_ID,
				'client_secret': settings.FT_CLIENT_SECRET,
				'code': code,
				'redirect_uri': settings.SITE_URL
			}
		)

		if token_response.status_code != 200:
			return Response({'error': 'Failed to obtain token'}, status=400)
			
		tokens = token_response.json()
		access_token = tokens.get('access_token')
		refresh_token = tokens.get('refresh_token')
		
		# Fetch user information from 42 API
		user_response = requests.get(
			'https://api.intra.42.fr/v2/me',
			headers={'Authorization': f'Bearer {access_token}'}
		)
		if user_response.status_code != 200:
			return Response({'error': 'Failed to get user info'}, status=400)
			
		user_data = user_response.json()
		ft_id = user_data['id']  # id for 42 users


		# Match the user based on ft_id, not username
		profile = Profile.objects.filter(ft_id=ft_id).first()

		if profile:
			# If profile exists, update user details
			user = profile.user
			user.first_name = user_data.get('first_name', user.first_name)
			user.last_name = user_data.get('last_name', user.last_name)
			user.email = user_data.get('email', user.email)
			user.save()
		else:
			# Create a new user and profile if none exists
			base_username = user_data['login']
			unique_username = get_unique_username(base_username)

			user = User.objects.create_user(
				username=unique_username,
				first_name=user_data['first_name'],
				last_name=user_data['last_name'],
				email=user_data['email']
			)
			profile = Profile.objects.create(user=user, ft_id=ft_id)

			# Download and save profile picture if URL exists
			profile_picture_url = user_data.get('image', {}).get('versions', {}).get('medium')
			if profile_picture_url:
				try:
					# Download image
					image_response = requests.get(profile_picture_url)
					if image_response.status_code == 200:
						from django.core.files.base import ContentFile
						# Save the image to profile
						profile.profileimg.save(
							f'{user.username}_profile.jpg', # filename
							ContentFile(image_response.content),
							save=True
						)
				except Exception as e:
					print(f"Error saving profile picture: {str(e)}")
		
		# Generate JWT
		refresh = RefreshToken.for_user(user)
		return JsonResponse({
			'refresh_token': str(refresh),
			'access_token': str(refresh.access_token),
		})

class LogoutView(APIView):
	def post(self, request):
		try:
			refresh_token = request.data["refresh_token"]
			token = RefreshToken(refresh_token)
			token.blacklist()
			return Response(status=status.HTTP_205_RESET_CONTENT)
		except Exception:
			return Response(status=status.HTTP_400_BAD_REQUEST)
