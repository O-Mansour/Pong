from django.db import models
from django.conf import settings
# from django.contrib.auth import get_user_model

# User = get_user_model()

class Profile(models.Model):
	user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
	profileimg = models.ImageField(upload_to='profile_images', default='default_pfp.jpg')
	wins = models.PositiveIntegerField(default=0)
	losses = models.PositiveIntegerField(default=0)
	is_online = models.BooleanField(default=False)
	level = models.PositiveIntegerField(default=1)
	rank = models.PositiveIntegerField(null=True, blank=True)

	def __str__(self):
		return f"{self.user.username}'s Profile"
