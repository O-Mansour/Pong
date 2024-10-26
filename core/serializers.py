from .models import Profile
from rest_framework import serializers

class ProfileSerializer(serializers.ModelSerializer):
	user_id = serializers.IntegerField()

	class Meta:
		model = Profile
		fields = ['id', 'user_id']
