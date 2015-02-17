import os
#from django.conf.urls import patterns, include, url
from django.conf.urls import patterns, url, include
#from django.contrib.staticfiles.urls import staticfiles_urlpatterns #static files
# Uncomment the next two lines to enable the admin:
from django.contrib.gis import admin
admin.autodiscover()
#static files
from django.conf import settings #import settings 
from django.conf.urls.static import static #import url static
from os.path import dirname
basedir = dirname(__file__)
from django.http import HttpResponse
from community.feed import LatestEntriesFeed
#from community.views import *
#from django.conf.urls import handler404, handler500


staticFiles = os.path.join(basedir, "static")
webStaticFiles = '%s/web/static/' % basedir
media = '%s/media/' % basedir

urlpatterns = patterns('',
    #static files
    (r'^static/(?P<path>.*)$','django.views.static.serve',{'document_root': staticFiles,'show_indexes': True}),  #static community app
    #(r'^static/web/(?P<path>.*)$','django.views.static.serve',{'document_root': webStaticFiles,'show_indexes': True}),
    (r'^media/(?P<path>.*)$','django.views.static.serve',{'document_root': media,'show_indexes': True}),
    #end static files
    # Uncomment the admin/doc line below to enable admin documentation:
    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
    url(r'^$', 'community.views.communityEvolution'),
    url(r'^', include('web.urls')),
    url(r'^marius/', include('mariustest.urls')),
    url(r'^communities/', include('community.urls')),
    url(r'^admin_tools/', include('admin_tools.urls')),
    (r'^robots\.txt$', lambda r: HttpResponse("User-agent: *\nDisallow: /media/\nDisallow: /static/\nDisallow: /admin/", mimetype="text/plain")),
    (r'^business/events/(?P<business_id>\d+)/rss/$', LatestEntriesFeed()),

) #+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) #url for static files django docs

#urlpatterns += staticfiles_urlpatterns() #for static files

handler404 = 'community.views.handler404'
handler500 = 'community.views.handler500'
