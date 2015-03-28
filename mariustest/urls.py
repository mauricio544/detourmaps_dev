from django.conf.urls import patterns, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

urlpatterns = patterns('mariustest.views',
	url(r'^$', 'single'),
    url(r'^about/$', 'aboutN', name='aboutN'),
	url(r'^howItWorks/$', 'howItWorksN', name='howItWorksN'),
    url(r'^deals/$', 'deals', name='deals'),
    url(r'^business/$', 'business', name='business'),
    url(r'^community/$', 'community', name='community'),
    url(r'^category/$', 'community', name='community'),
    url(r'^orange-deals/$', 'orange', name='orange'),
    url(r'^test/$', 'test', name='test'),
)

urlpatterns += staticfiles_urlpatterns()
