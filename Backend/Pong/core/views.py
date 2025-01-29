from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework.serializers import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .serializers import ProfileSerializer, FriendshipSerializer, MatchSerializer, UserSerializer, PasswordSerializer, FriendshipRequestsReceivedSerializer, FriendshipRequestsSentSerializer
from .models import Profile, Friendship, Match
from .helpers import get_unique_username
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
import requests
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as ValidationErrorException
from django.utils.timezone import now, localtime


class ProfileViewSet(ModelViewSet):
	queryset = Profile.objects.order_by('-level', '-xps')
	serializer_class = ProfileSerializer
	permission_classes = [IsAuthenticated]

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
		try:
			validate_password(request.data['new_password'])
		except ValidationErrorException:
			return Response(
				{"message": "New password is not valid"}, status=status.HTTP_400_BAD_REQUEST)

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
	@action(detail=False, methods=['GET'])
	def online_users(self, request):
		online_users = Profile.objects.filter(is_online=True).count()
		return Response({"online_users": online_users})

class FriendshipViewSet(ModelViewSet):
	serializer_class = FriendshipSerializer
	permission_classes = [IsAuthenticated]

	def get_queryset(self):
		return Friendship.objects.filter(
			Q(sender=self.request.user) | Q(receiver=self.request.user)
		)

	def perform_create(self, serializer):
		receiver = serializer.validated_data['receiver']
		
		if receiver == self.request.user:
			raise ValidationError({"message": "You cannot send a friendship request to yourself"})

		# Check for existing non-accepted friendship requests
		existing_friendship = Friendship.objects.filter(
			(Q(sender=self.request.user) & Q(receiver=receiver)) |
			(Q(sender=receiver) & Q(receiver=self.request.user))
		).exclude(status='A')

		if existing_friendship.exists():
			if all(friendship.status == 'R' for friendship in existing_friendship):
				serializer.save(sender=self.request.user)
			else:
				raise ValidationError({"message": "Friendship request already exists"})
		else:
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

		friends_data = []
		for friendship in accepted_friendships:
			if friendship.sender == request.user:
				friend = friendship.receiver
			else:
				friend = friendship.sender
			friend_profile = ProfileSerializer(friend.profile).data
			friends_data.append(friend_profile)

		return Response(friends_data)

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
		return Match.objects.filter(player=self.request.user.profile).order_by('-date_played')

	def perform_create(self, serializer):
		opponent = serializer.validated_data['opponent']
		
		if opponent == self.request.user.profile:
			raise ValidationError({"message": "You cannot play a match with yourself"})

		serializer.save(player=self.request.user.profile)

	@action(detail=False, methods=['GET'])
	def total_matches(self, request):
		total_matches = Match.objects.count() // 2
		return Response({"total_matches": total_matches})

	@action(detail=False, methods=['GET'])
	def total_today_matches(self, request):
		today = localtime(now()).date()
		total_today = Match.objects.filter(date_played__date=today).count() // 2
		return Response({"total_today_matches": total_today})

class RegistrationView(APIView):
	def post(self, request):
		if User.objects.filter(username=request.data['username']).exists():
			return Response(
				{"message": "The username is already taken"}, status=status.HTTP_400_BAD_REQUEST)
		if User.objects.filter(email=request.data['email']).exists():
			return Response(
				{"message": "The email is already in use"}, status=status.HTTP_400_BAD_REQUEST)
		try:
			validate_password(request.data['password'])
		except ValidationErrorException:
			return Response(
				{"message": "The password is not valid"}, status=status.HTTP_400_BAD_REQUEST)
		serializer = UserSerializer(data=request.data)
		if serializer.is_valid():
			user = serializer.save()
			refresh = RefreshToken.for_user(user)
			response = Response({"message": "Welcome, Enjoy Your Time!"})

			response.set_cookie(
				key='access_token',
				value=str(refresh.access_token),
				httponly=False,
				secure=True,
				max_age=60 * 30,
				samesite='None'
			)
			response.set_cookie(
				key='refresh_token',
				value=str(refresh),
				httponly=True,
				secure=True,
				max_age=24 * 60 * 60,
				samesite='None'
			)
			return response
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
	def post(self, request):
		username = request.data.get('username')
		password = request.data.get('password')
		user = authenticate(username=username, password=password)
		
		if user:
			refresh = RefreshToken.for_user(user)
			response = Response({"message": "Welcome, Enjoy Your Time!"})

			response.set_cookie(
				key='access_token',
				value=str(refresh.access_token),
				httponly=False,
				secure=True,
				max_age=60 * 30,
				samesite='None'
			)
			response.set_cookie(
				key='refresh_token',
				value=str(refresh),
				httponly=True,
				secure=True,
				max_age=24 * 60 * 60,
				samesite='None'
			)

			return response
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
		
		# Fetch user information from 42 API
		user_response = requests.get(
			'https://api.intra.42.fr/v2/me',
			headers={'Authorization': f'Bearer {access_token}'}
		)
		if user_response.status_code != 200:
			return Response({'error': 'Failed to get user info'}, status=400)
			
		user_data = user_response.json()
		ft_id = user_data['id']  # id for 42 users

		# Find the user based on ft_id, not username
		profile = Profile.objects.filter(ft_id=ft_id).first()

		if profile:
			# Update user details
			user = profile.user
			user.first_name = user_data.get('first_name', user.first_name)
			user.last_name = user_data.get('last_name', user.last_name)
			user.email = user_data.get('email', user.email)
			user.save()
		else:
			# Create a new user
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
					image_response = requests.get(profile_picture_url)
					if image_response.status_code == 200:
						from django.core.files.base import ContentFile
						profile.profileimg.save(
							f'{user.username}.jpg',
							ContentFile(image_response.content),
							save=True
						)
				except Exception as e:
					return Response({'error': 'Failed to save profile picture'}, status=400)
		
		refresh = RefreshToken.for_user(user)
		response = Response({"message": "Welcome, Enjoy Your Time!"})

		response.set_cookie(
			key='access_token',
			value=str(refresh.access_token),
			httponly=False,
			secure=True,
			max_age=60 * 30,
			samesite='None'
		)
		response.set_cookie(
			key='refresh_token',
			value=str(refresh),
			httponly=True,
			secure=True,
			max_age=24 * 60 * 60,
			samesite='None'
		)

		return response

class LogoutView(APIView):
	def post(self, request):
		response = Response({"message": "Logged out successfully!"})
		response.delete_cookie('access_token')
		response.delete_cookie('refresh_token')
		return response


class RefreshTokenView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')

        if not refresh_token:
            return Response({"error": "Refresh token not found"}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            refresh = RefreshToken(refresh_token)
            new_access_token = str(refresh.access_token)
            new_refresh_token = str(refresh)

            response = Response({"message": "Tokens refreshed successfully"})
            response.set_cookie(
                key='access_token',
                value=new_access_token,
                httponly=False,
				secure=True,
				max_age=60 * 30,
				samesite='None'
			)
            response.set_cookie(
                key='refresh_token',
                value=new_refresh_token,
                httponly=True,
				secure=True,
				max_age=24 * 60 * 60,
				samesite='None'
            )

            return response

        except Exception:
            return Response({"error": "Invalid refresh token"}, status=status.HTTP_403_FORBIDDEN)
