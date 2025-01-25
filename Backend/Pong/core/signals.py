from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Profile
import os

@receiver(pre_save, sender=Profile)
def delete_old_profile_image(sender, instance, **kwargs):
    if not instance.pk:
        # If the instance is new, there's no old file to delete.
        return

    try:
        # Get the old image from the database
        old_file = Profile.objects.get(pk=instance.pk).profileimg
    except Profile.DoesNotExist:
        return

    # Check if the old file path is different from the new one and is not the default image
    default_image = 'default_pfp.jpg'
    if old_file.name and old_file.name != instance.profileimg.name and default_image not in old_file.name:
        # Delete the old file if it exists and is not the default image
        if os.path.isfile(old_file.path):
            os.remove(old_file.path)
