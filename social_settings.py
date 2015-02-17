#google maps api
SOCIAL_LOCAL = True
GOOGLE_MAPS_API_KEY = 'ABQIAAAAMRdj9lILtQvXkiEUNZPsEBTVYn4XUlNVbaXmPTyyPkab5qqNZRQXIeTJetmIkh3Bi3s3lm0489i9hg'

#facebook settings
if SOCIAL_LOCAL:
    FACEBOOK_APP_ID = "238417312930434"
    FACEBOOK_APP_SECRET = "ed30953e52e55db8227f0d7e23d37d6d"
    FACEBOOK_REDIRECT_URI = "http://localhost:8000/communities/loginUser/"
else:
    FACEBOOK_APP_ID = "540480642657288"
    FACEBOOK_APP_SECRET = "8b78af3f834230b2a40ad7dd6e981a14"
    FACEBOOK_REDIRECT_URI = "http://detourmaps.com/communities/loginUser/"

#settings Twitter oAuth
CONSUMER_KEY = 'FgpSGwxZL1eapBqUNMmg'
CONSUMER_SECRET = 'bUFhudjFJaXhWYvhOA6Q2PpYqB5FSrXFxJ4yiXDyw'
REQUEST_TOKEN_URL = 'https://api.twitter.com/oauth/request_token'
AUTHENTICATE_URL = "https://api.twitter.com/oauth/authenticate?oauth_token="
ACCESS_TOKEN_URL = "https://api.twitter.com/oauth/access_token"

TWITTER_REDIRECT_URL = 'http://detourmaps.com/communities/loginUser/'
ACCESS_TOKEN = '102799398-NxV01tbTqfx8nXJbGTmBgSThyaRG0asAtZzYX2yj'
ACCESS_TOKEN_SECRET = 'VkdzWaq37X9a73Qs3MmwkOC84Uf8HlGD5uaj1zfGT8'

AUTHORIZE_URL = 'https://api.twitter.com/oauth/authorize'
OAUTH_TOKEN = '1301570935-EyodbGPYng21DIJTVRe5uIfX92IH5DwMCnaltRj'
OAUTH_SIGNATURE = 'H3RjEtsBaV8J30tvr2G0CbWoac8%3D'


#settings Google oauth
GOOGLE_CLIENT_ID = "532813113917-t1fpu1n46412c7bves9ompkgbucsejtm.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET = "MqwIM6VHlkYGwIOpLlkbiCYI"
