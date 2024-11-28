from .models import Profile, Friendship, Match
from rest_framework import serializers
from django.db.models import Q
from django.contrib.auth.models import User

class ProfileSerializer(serializers.ModelSerializer):
	user_id = serializers.IntegerField()
	username = serializers.CharField(source='user.username', read_only=True)
	firstname = serializers.CharField(source='user.first_name', read_only=True)
	lastname = serializers.CharField(source='user.last_name', read_only=True)
	email = serializers.EmailField(source='user.email', read_only=True)
	date_joined = serializers.DateTimeField(source='user.date_joined', format="%Y-%m-%d", read_only=True)
	current_friends = serializers.SerializerMethodField()

	class Meta:
		model = Profile
		fields = ['id', 'user_id', 'username', 'firstname', 'lastname', 'email',
				 'date_joined', 'profileimg', 'wins', 'losses', 'is_online',
				 'level', 'xps', 'rank', 'tour_played', 'tour_won', 'current_friends']
	
	def get_current_friends(self, obj):
		current_friends = Friendship.objects.filter(
			(Q(sender=obj.user) | Q(receiver=obj.user)),
			status='A'
		).count()
		return current_friends

class ProfileSimpleSerializer(serializers.ModelSerializer):
	username = serializers.CharField(source='user.username', read_only=True)
	firstname = serializers.CharField(source='user.first_name', read_only=True)
	lastname = serializers.CharField(source='user.last_name', read_only=True)

	class Meta:
		model = Profile
		fields = ['username', 'firstname', 'lastname', 'profileimg']

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
