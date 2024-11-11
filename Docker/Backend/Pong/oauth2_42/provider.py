from allauth.socialaccount import providers
from allauth.socialaccount.providers.base import ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider

from .views import OAuth2Adapter42


class Account42(ProviderAccount):
	pass


class Provider42(OAuth2Provider):
	id = '42'
	name = '42 OAuth2'
	account_class = Account42
	oauth2_adapter_class = OAuth2Adapter42


	def extract_uid(self, data):
		# print(f"\textract_uid: {data}") # DEBUG # to see the data that is being extracted
		return str(data['id'])


	def extract_common_fields(self, data):
		return dict(
			email=data.get('email'),
			username=data.get('login'),
			name=data.get('name'),
			user_id=data.get('user_id')
    	)

	# This is not necessary since the default scope is 'public'. Can be customized though.
	# def get_default_scope(self):
	# 	return ['public']

provider_classes = [Provider42]
