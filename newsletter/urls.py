__author__ = 'mauricio'

from django.conf.urls import *

urlpatterns = patterns('newsletter.views',
    url(r'^saver/$','saver',name='saver'),
    url(r'^save_area','setArea',name='save_area'),
    url(r'^save_map','setMap',name='save_map'),
    url(r'^get_map','getMap',name='get_map'),
    url(r'^map_only','getMapOnly',name='map_only'),
    url(r'^save_img','setImage',name='save_img'),
    url(r'^canvas','canvas',name='canvas'),
    url(r'^dashboard','dashboard',name='dashboard'),
    url(r' example/$','example',name='example'),
    url(r'^form/$','saveImage',name='save'),
    url(r'^list/$','listImages',name='list'),
    url(r'^templates/$','listTemplates',name='templates'),
    url(r'^template1/$','templates', {'template':'template1.html'},name='template1'),
    url(r'^template/(?P<nameTemplate>[-\w]+)$','getTemplate',name='getTemplate'),
    url(r'^area/$','getArea',name='area'),
    url(r'^get_images/$','getImages',name='getImages'),
    url(r'^settings/$','inicio',name='home'),
    url(r'^logEnd/$','logoutEnd',name='Out'),
)
  
