__author__ = 'mauricio'

from django import template
from django.template.defaultfilters import stringfilter
#from django.contrib.sites.models import Site
from django.conf import settings
register = template.Library()

from PIL import Image
#models
from newsletter.models import Imagen
import urllib
import ImageFile
from os.path import dirname
basedir = dirname(__file__)

@register.filter(name = 'imageHeight')
@stringfilter
def imagenHeight(id):
    #site_object = Site.objects.get(pk=settings.SITE_ID)
    imagen_object = Imagen.objects.get(pk=id)
    from easy_thumbnails.files import get_thumbnailer
    thumbnailer = get_thumbnailer(imagen_object.imagen)
    thumb = thumbnailer.get_thumbnail({'size': (620, 620)})
    thumb = thumbnailer.get_thumbnail_name({'size': (620, 620)})
    thumbStr = thumb.replace("\\", "/")
    imageFinaly = '/var/www/detour/detour_news/media/%s' % (thumbStr)
    a = Image.open(imageFinaly)
    imagenNewHeight = a.size
    return imagenNewHeight[1]



