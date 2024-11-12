from django.core.exceptions import ValidationError

def validate_size(file):
	MAX_KB = 200
	if file.size > MAX_KB * 1024:
		raise ValidationError(f'Files must be smaller than {MAX_KB}KB')
