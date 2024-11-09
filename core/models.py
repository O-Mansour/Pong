from django.db import models
from django.conf import settings
from .validators import validate_size

class Profile(models.Model):
	user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
	profileimg = models.ImageField(upload_to='profile_images/',
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

	def __str__(self):
		return f"{self.user.username}'s Profile"

class Friendship(models.Model):
	STATUS_CHOICES = (
		('A', 'Accepted'),
		('P', 'Pending'),
		('R', 'Rejected')
	)

	sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='requested_friendships', on_delete=models.CASCADE)
	receiver = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='received_friendships', on_delete=models.CASCADE)
	status = models.CharField(max_length=1, choices=STATUS_CHOICES, default='P')

	# class Meta:
	# 	constraints = [
	# 		# Prevents both duplicate friendships and reverse friendships
	# 		models.UniqueConstraint(
	# 			fields=['sender', 'receiver'],
	# 			name='unique_friendship'
	# 		),
	# 		models.UniqueConstraint(
	# 			fields=['receiver', 'sender'],
	# 			name='unique_reverse_friendship'
	# 		),
	# 		# Prevents self-friendships
	# 		models.CheckConstraint(
	# 			check=~models.Q(sender=models.F('receiver')),
	# 			name='no_self_friendship'
	# 		)
	# 	]

	def __str__(self):
		return f"Friendship from {self.sender} to {self.receiver} : {self.get_status_display()}"
