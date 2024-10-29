from .models import Profile
from rest_framework import serializers

class ProfileSerializer(serializers.ModelSerializer):
	user_id = serializers.IntegerField(read_only=True)

	class Meta:
		model = Profile
		fields = ['id', 'user_id', 'profileimg']
