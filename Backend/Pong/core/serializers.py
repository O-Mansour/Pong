from .models import Profile, Friendship, Match
from rest_framework import serializers
from django.db.models import Q
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

class ProfileSerializer(serializers.ModelSerializer):
	user_id = serializers.IntegerField(required=False, read_only=True)
	username = serializers.CharField(source='user.username', required=False)
	firstname = serializers.CharField(source='user.first_name', required=False)
	lastname = serializers.CharField(source='user.last_name', required=False)
	email = serializers.EmailField(source='user.email', required=False)
	date_joined = serializers.DateTimeField(source='user.date_joined', format="%Y-%m-%d", read_only=True)
	current_friends = serializers.SerializerMethodField()
	profileimg_url = serializers.SerializerMethodField()

	class Meta:
		model = Profile
		fields = ['id', 'user_id', 'username', 'firstname', 'lastname', 'email',
				 'date_joined', 'profileimg', 'profileimg_url', 'wins', 'losses', 'is_online', 'level',
				 'xps', 'rank', 'tour_played', 'tour_won', 'current_friends', 'language']
	
	def get_current_friends(self, obj):
		current_friends = Friendship.objects.filter(
			(Q(sender=obj.user) | Q(receiver=obj.user)),
			status='A'
		).count()
		return current_friends
	
	def update(self, instance, validated_data):
		user_data = validated_data.pop('user', {})

		if self.instance:
			current_user = self.instance.user
			username = user_data.get('username')
			email = user_data.get('email')

			if username and Profile.objects.exclude(user=current_user).filter(user__username=username).exists():
				raise serializers.ValidationError({"message": "The username is already taken"})

			if email and Profile.objects.exclude(user=current_user).filter(user__email=email).exists():
				raise serializers.ValidationError({"message": "The email is already in use"})
		
		if user_data:
			user = instance.user
			
			if 'username' in user_data:
				user.username = user_data['username']
			if 'first_name' in user_data:
				user.first_name = user_data['first_name']
			if 'last_name' in user_data:
				user.last_name = user_data['last_name']
			if 'email' in user_data:
				user.email = user_data['email']
			
			if 'password' in user_data:
				user.set_password(user_data['password'])
			
			user.save()

		for attr, value in validated_data.items():
			setattr(instance, attr, value)
		instance.save()

		return instance

	def get_profileimg_url(self, obj):
		if obj.profileimg:
			return obj.profileimg.url
		return None

class ProfileSimpleSerializer(serializers.ModelSerializer):
	username = serializers.CharField(source='user.username', read_only=True)
	firstname = serializers.CharField(source='user.first_name', read_only=True)
	lastname = serializers.CharField(source='user.last_name', read_only=True)
	profileimg_url = serializers.SerializerMethodField()

	class Meta:
		model = Profile
		fields = ['username', 'firstname', 'lastname', 'profileimg_url']

	def get_profileimg_url(self, obj):
		if obj.profileimg:
			return obj.profileimg.url
		return None

class MatchSerializer(serializers.ModelSerializer):
	opponent_profile = ProfileSimpleSerializer(source='opponent', read_only=True)
	date_played = serializers.DateTimeField(format="%d/%m/%y")

	class Meta:
		model = Match
		fields = [
			'opponent',
			'opponent_profile',
			'won',
			'date_played'
		]

class FriendshipSerializer(serializers.ModelSerializer):
	sender_profile = ProfileSerializer(source='sender.profile', read_only=True)
	receiver_profile = ProfileSerializer(source='receiver.profile', read_only=True)

	class Meta:
		model = Friendship
		fields = ['id', 'sender', 'receiver', 'status', 'sender_profile', 'receiver_profile']
		read_only_fields = ['sender', 'status']

class FriendshipRequestsReceivedSerializer(serializers.ModelSerializer):
	sender_profile = ProfileSerializer(source='sender.profile', read_only=True)

	class Meta:
		model = Friendship
		fields = ['id', 'sender_profile']

class FriendshipRequestsSentSerializer(serializers.ModelSerializer):
	receiver_profile = ProfileSerializer(source='receiver.profile', read_only=True)

	class Meta:
		model = Friendship
		fields = ['id', 'receiver_profile']

class UserSerializer(serializers.ModelSerializer):
	password = serializers.CharField(write_only=True)

	class Meta:
		model = User
		fields = ['username', 'email', 'password']
		
	def create(self, validated_data):
		user = User.objects.create_user(
			first_name='Anonymous',
			last_name='User',
			username=validated_data['username'],
			email=validated_data['email'],
			password=validated_data['password']
		)
		return user

class PasswordSerializer(serializers.Serializer):
	old_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
	new_password = serializers.CharField(write_only=True, required=True)

	def validate(self, data):
		# Check if old password is correct
		user = self.context['request'].user
		if user.has_usable_password():
			if not user.check_password(data.get('old_password')):
				raise serializers.ValidationError({"message": "Old password is incorrect"})
		return data

	def save(self, **kwargs):
		user = self.context['request'].user
		user.set_password(self.validated_data['new_password'])
		user.save()
		return user
