from django.contrib.auth.models import User

def get_unique_username(base_username):
    counter = 1
    username = base_username
    while User.objects.filter(username=username).exists():
        username = f"{base_username}{counter}"
        counter += 1
    return username
