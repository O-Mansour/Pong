from allauth.socialaccount import app_settings
from allauth.socialaccount.adapter import get_adapter
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter, OAuth2CallbackView, OAuth2LoginView


class OAuth2Adapter42(OAuth2Adapter):
	provider_id = '42'
	oauth2_base_url_42 = 'https://api.intra.42.fr/v2'

	access_token_url = "{0}/oauth/token".format(oauth2_base_url_42)
	authorize_url = "{0}/oauth/authorize".format(oauth2_base_url_42)
	profile_url = "{0}/me".format(oauth2_base_url_42)

	def complete_login(self, request, app, token, **kwargs):
		headers = {
			'Authorization': 'Bearer {0}'.format(token.token)
		}
		response = (
			get_adapter().get_requests_session().get(self.profile_url, headers=headers)
		)
		extra_data = response.json()

		return self.get_provider().sociallogin_from_response(request, extra_data)


oauth2_login = OAuth2LoginView.adapter_view(OAuth2Adapter42)
oauth2_callback = OAuth2CallbackView.adapter_view(OAuth2Adapter42)
