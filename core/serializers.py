from .models import Profile
from rest_framework import serializers

class ProfileSerializer(serializers.ModelSerializer):

	username = serializers.CharField(max_length=150, source='user.username')
	firstname = serializers.CharField(max_length=150, allow_blank=True, source='user.first_name')
	lastname = serializers.CharField(max_length=150, allow_blank=True, source='user.last_name')
	email = serializers.EmailField(source='user.email')
	date_joined = serializers.DateTimeField(source='user.date_joined', read_only=True)

	class Meta:
		model = Profile
		fields = ['id', 'username', 'firstname', 'lastname', 'email',
				 'date_joined', 'wins', 'losses', 'is_online', 'level', 'rank']

	def update(self, instance, validated_data):
		for field in ['wins', 'losses', 'is_online', 'level', 'rank']:
			if field in validated_data:
				setattr(instance, field, validated_data[field])
		instance.save()

		# Update user fields
		request_data = self.context['request'].data
		if any(field in request_data for field in ['username', 'firstname', 'lastname', 'email']):
			user = instance.user
			if 'username' in request_data:
				user.username = request_data['username']
			if 'firstname' in request_data:
				user.first_name = request_data['firstname']
			if 'lastname' in request_data:
				user.last_name = request_data['lastname']
			if 'email' in request_data:
				user.email = request_data['email']
			user.save()

		return instance
