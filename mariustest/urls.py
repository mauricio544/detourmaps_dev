from django.conf.urls import patterns, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

urlpatterns = patterns('mariustest.views',
	url(r'^$', 'single'),
)

urlpatterns += staticfiles_urlpatterns()
