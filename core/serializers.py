from .models import Profile, Friendship
from rest_framework import serializers

class ProfileSerializer(serializers.ModelSerializer):
	user_id = serializers.IntegerField()
	username = serializers.CharField(source='user.username', read_only=True)
	firstname = serializers.CharField(source='user.first_name', read_only=True)
	lastname = serializers.CharField(source='user.last_name', read_only=True)
	email = serializers.EmailField(source='user.email', read_only=True)
	date_joined = serializers.DateTimeField(source='user.date_joined', format="%Y-%m-%d", read_only=True)

	class Meta:
		model = Profile
		fields = ['id', 'user_id', 'username', 'firstname', 'lastname', 'email',
				 'date_joined', 'profileimg', 'wins', 'losses', 'is_online',
				 'level', 'rank']

class FriendshipSerializer(serializers.ModelSerializer):
	class Meta:
		model = Friendship
		fields = '__all__'
		read_only_fields = ['sender', 'status']
