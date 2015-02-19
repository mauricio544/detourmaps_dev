from django.conf.urls import patterns, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

urlpatterns = patterns('mariustest.views',
	url(r'^$', 'single'),
    url(r'^deals/$', 'deals', name='deals'),
    url(r'^business/$', 'business', name='business'),
)

urlpatterns += staticfiles_urlpatterns()
