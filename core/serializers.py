from .models import Profile
from rest_framework import serializers

class ProfileSerializer(serializers.ModelSerializer):
	class Meta:
		model = Profile
		fields = ['id', 'username', 'firstname', 'lastname', 'email', 'wins']

	username = serializers.CharField(max_length=150, source='user.username')
	firstname = serializers.CharField(max_length=150, allow_blank=True, source='user.first_name')
	lastname = serializers.CharField(max_length=150, allow_blank=True, source='user.last_name')
	email = serializers.EmailField(source='user.email')
