from django.db import models
from django.conf import settings
from .validators import validate_size
from .helpers import profileimg_path

class Profile(models.Model):
	LANGUAGE_CHOICES = (
		('en', 'English'),
		('fr', 'French'),
		('es', 'Spanish')
	)

	user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
	profileimg = models.ImageField(upload_to=profileimg_path,
								default='default_pfp.jpg',
								validators=[validate_size])
	wins = models.PositiveIntegerField(default=0)
	losses = models.PositiveIntegerField(default=0)
	is_online = models.BooleanField(default=False)
	level = models.PositiveIntegerField(default=1)
	xps = models.PositiveIntegerField(default=0)
	rank = models.PositiveIntegerField(null=True, blank=True)
	tour_played = models.PositiveIntegerField(default=0)
	tour_won = models.PositiveIntegerField(default=0)
	ft_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
	language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default='en')

	def __str__(self):
		return f"{self.user.username}'s Profile"

class Match(models.Model):
	player = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='played_match')
	opponent = models.ForeignKey(Profile, on_delete=models.CASCADE)
	won = models.BooleanField()
	date_played = models.DateTimeField()

	def __str__(self):
		return f"{self.player} VS {self.opponent}"

class Friendship(models.Model):
	STATUS_CHOICES = (
		('A', 'Accepted'),
		('P', 'Pending'),
		('R', 'Rejected')
	)

	sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='requested_friendships', on_delete=models.CASCADE)
	receiver = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='received_friendships', on_delete=models.CASCADE)
	status = models.CharField(max_length=1, choices=STATUS_CHOICES, default='P')

	def __str__(self):
		return f"Friendship from {self.sender} to {self.receiver} : {self.get_status_display()}"
