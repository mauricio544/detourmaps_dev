# -*- coding: utf-8 -*-
# Create your views here.
import simplejson
from django.contrib.auth.decorators import login_required

from django.utils.encoding import force_unicode
from django.http import HttpRequest, HttpResponse, HttpResponseBadRequest, HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.shortcuts import get_object_or_404
#from django.utils import simplejson

from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.core.mail import EmailMessage
from django.core import mail
from django.core.urlresolvers import reverse
from django.conf import settings
from django.contrib.sites.models import Site
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User

from newsletter.models import Body, Footer, Header, Area, Map, Imagen, ImagenMap
#forms
from newsletter.forms import FormArea, FormBody, FormImagen, FormMap, FormLogin


def example(request):
    return render_to_response('newsletter/example.html', RequestContext(request))


@csrf_exempt
def setArea(request):
    if request.method == "POST":
        user = User.objects.get(username=request.session["user"])
        name_value = request.POST['nombre']
        shape_value = request.POST['shape']
        coords_value = request.POST['coords']
        link_value = request.POST['link']
        area_object = Area(
            nombre=name_value,
            shape=shape_value,
            coords=coords_value,
            link=link_value,
            user=user
        )
        area_object.save()
        return HttpResponse("Area Save, Continue!")


@csrf_exempt
def setMap(request):
    if request.method == "POST":
        name_value = request.POST['nombre']
        area_value = simplejson.loads(request.POST['area'])
        image_object = Imagen.objects.get(pk=request.POST['valorImg'])
        list = []
        list = area_value
        user = User.objects.get(username=request.session["user"])
        map_object = Map(
            nombre=name_value,
            user=user
        )
        map_object.save()
        lista_areas = []
        for area_object in list:
            area_in = Area.objects.get(pk=area_object)
            lista_areas.append(area_in)
        for i in lista_areas:
            map_object.area.add(i)
            map_object.save()
        lista_areas_response = []
        imagen_map_object = ImagenMap(
            map=map_object,
            image=image_object,
            user=user
        )
        imagen_map_object.save()
        dictionary_map = {
            'nombre': map_object.nombre,
            'response': 'Save and Continue'
        }
        for area in lista_areas:
            dictionary_area = {
                'shape': area.shape,
                'coords': area.coords,
                'link': force_unicode(area.link)
            }
            lista_areas_response.append(dictionary_area)
        dictionary_map['areas'] = lista_areas_response
        lista_complete = [dictionary_map]
        return HttpResponse(simplejson.dumps(lista_complete))


@csrf_exempt
def setImage(request):
    if request.method == "POST":
        name = request.POST['nombre']
        img = request.FILES['imagen']
        user = User.objects.get(username=request.session["user"])
        imagen_object = Imagen(
            nombre=name,
            imagen=img,
            user=user
        )
        imagen_object.save()
        return HttpResponseRedirect(reverse('home'))


def getAreas(request):
    pass


@csrf_protect
def loginStart(request):
    if 'user' in request.session:
        return HttpResponseRedirect(reverse('home'))
    else:
        if request.method == "POST":
            username = request.POST['username']
            password = request.POST['password']
            user = authenticate(username=username, password=password)
            if user is not None:
                if user.is_active:
                    login(request, user)
                    request.session['user'] = user.username
                    return HttpResponseRedirect(reverse('home'))
                else:
                    return HttpResponse("Error data incorrect")
            else:
                return HttpResponse("User is not exist")
        else:
            request.session['name_biz'] = request.GET.get("name")
            request.session['logo_biz'] = request.GET.get("logo")
            request.session['back_logo'] = request.GET.get("back")
            request.session['font_color'] = request.GET.get("color")
            form_login = FormLogin()
            return render_to_response('login.html',
                                      {'form': form_login,
                                       'name_biz': request.session['name_biz'],
                                       'logo_biz': request.session['logo_biz'],
                                       'back_logo': request.session['back_logo'],
                                       'font_color': request.session['font_color']},
                                      context_instance=RequestContext(request))


@login_required
def logoutEnd(request):
    if request.session.get('user'):
        del request.session['user']
    logout(request)
    return HttpResponseRedirect(reverse('login'))


@csrf_exempt
@login_required
def inicio(request):
    body_object = Body.objects.all()
    imagen_object = Imagen.objects.all()
    map_object = Map.objects.all()
    form_area = FormArea()
    form_body = FormBody()
    form_imagen = FormImagen()
    form_map = FormMap()
    form_imagen = FormImagen()
    if request.method == "POST":
        user = User.objects.get(username=request.session["user"])
        if "saveArea" in request.POST:
            area_object = Area(
                shape=request.POST['shape'],
                coords=request.POST['coords'],
                svg=request.POST['svg'],
                link=request.POST['link'],
                user=user
            )
            area_object.save()
            return HttpResponse('Area was save!!')
        else:
            form_body = FormBody(request.POST)
            if form_body.is_valid():
                mapHide = request.POST["mapHide"]
                mapSplit = str(mapHide).split(",")
                if mapHide == "0":
                    name_template = request.POST["name"]
                    text_template = request.POST["text"]
                    body_object = Body(
                        name=name_template,
                        text=text_template,
                        user=user
                    )
                    body_object.save()
                    return HttpResponseRedirect(reverse('home'))
                elif len(mapSplit) == 2:
                    image_map = ImagenMap.objects.get(map__pk=mapSplit[0])
                    map_object = Map.objects.get(pk=mapSplit[0])
                    map = '<map id="%s" name="%s">' % (map_object.nombre, map_object.nombre)
                    for i in map_object.area.all():
                        map += '<area shape="rect" coords="%s" href="%s" target="_blank" />' % (i.coords, i.link)
                    map += '</map>'
                    name_template = request.POST["name"]
                    text_template = request.POST["text"] + map
                    body_object = Body(
                        name=name_template,
                        text=text_template,
                        user=user
                    )
                    body_object.save()
                    return HttpResponseRedirect(reverse('home'))
                else:
                    map = ""
                    for i in range(len(mapSplit) - 1):
                        image_map = ImagenMap.objects.get(map__pk=mapSplit[i])
                        map_object = Map.objects.get(pk=mapSplit[i])
                        map += '<map id="%s" name="%s">' % (map_object.nombre, map_object.nombre)
                        for j in map_object.area.all():
                            map += '<area shape="rect" coords="%s" href="%s" target="_blank" />' % (j.coords, j.link)
                        map += '</map>'
                        name_template = request.POST["name"]
                        text_template = request.POST["text"] + map
                    body_object = Body(
                        name=name_template,
                        text=text_template,
                        user=user
                    )
                    body_object.save()
                    return HttpResponseRedirect(reverse('home'))
    else:
        name_biz = request.session['name_biz']
        logo_biz = request.session['logo_biz']
        body_object = Body.objects.all()
        if body_object:
            return render_to_response('newsletter/index.html',
                                      {'area': form_area,
                                       'body': form_body,
                                       'map': form_map,
                                       'imagen': form_imagen,
                                       'images': imagen_object,
                                       'msg': "",
                                       'name_biz': name_biz,
                                       'logo_biz': logo_biz,
                                       'back_logo': request.session['back_logo'],
                                       'font_color': request.session['font_color']},
                                      RequestContext(request))
        else:
            return render_to_response('newsletter/index.html',
                                      {'area': form_area,
                                       'body': form_body,
                                       'map': form_map,
                                       'imagen': form_imagen,
                                       'images': imagen_object,
                                       'msg': "",
                                       'name_biz': name_biz,
                                       'logo_biz': logo_biz,
                                       'back_logo': request.session['back_logo'],
                                       'font_color': request.session['font_color']},
                                      RequestContext(request))


def canvas(request):
    return render_to_response('newsletter/canvas.html', RequestContext(request))


def getMap(request):
    map_object = Map.objects.filter(user__username=request.session['user'])[0]
    lista = []
    dict = {
        'nombre': map_object.nombre
    }
    lista_area = []
    for i in map_object.area.all():
        dict_area = {
            'nombre_area': i.nombre,
            'shape': i.shape,
            'coords': i.coords,
            'link': i.link
        }
        lista_area.append(dict_area)
    dict['areas'] = lista_area
    return HttpResponse(simplejson.dumps(dict))


def getMapOnly(request):
    map_object = Map.objects.filter(user__username=request.session['user'])
    dict = {
        'total': map_object.count()
    }
    lista = []
    for i in map_object:
        dict_map = {
            'id': i.id,
            'nombre': i.nombre
        }
        lista.append(dict_map)
    dict['maps'] = lista
    return HttpResponse(simplejson.dumps(dict))


@csrf_exempt
def saver(request):
    body_object = ""
    if request.method == "POST":
        if "body" in request.POST:
            body = request.POST["body"]
            _body = Body.objects.all()
            _body.delete()
            body_object = Body(
                text=body
            )
            body_object.save()
    return HttpResponseRedirect('/')


@csrf_exempt
def saveImage(request):
    if request.method == "POST":
        form = FormImagen(request.POST, request.FILES)
        user = User.objects.get(username=request.session["user"])
        if form.is_valid():
            newImage = Imagen(
                nombre=request.POST['nombre'],
                imagen=request.FILES['imagen'],
                user=user
            )
            newImage.save()
            from easy_thumbnails.files import get_thumbnailer

            site_object = Site.objects.get(pk=settings.SITE_ID)
            thumbnailer = get_thumbnailer(newImage.imagen)
            thumb = thumbnailer.get_thumbnail({'size': (620, 620)})
            thumb = thumbnailer.get_thumbnail_name({'size': (620, 620)})
            thumbStr = thumb.replace("\\", "/")
            return HttpResponse(
                "<script type='text/javascript' src='http://code.jquery.com/jquery-1.7.1.min.js'></script><script type='text/javascript' language='javascript'>$(document).ready(function(){$('#text').click(function(){$(this).select();})});var opcion = '/media/%s';window.opener.document.getElementById('src').value = opcion;window.close();</script><table><tr><td><input id='text' type='text' value='http://%s/media/%s' maxlength='360' style='width: 350px; padding:5px;'/><p style='color: #979797;font-size: 12px;'>Click over the text and CTRL + V and paste in 'Image URL'</p></td></tr></table>" % (
                    newImage.imagen, site_object.domain, thumbStr))
        else:
            return HttpResponse('Error in Save')
    else:
        form = FormImagen()
        return render_to_response('newsletter/form_save.html', {'content': {'form': form}}, RequestContext(request))


def listImages(request):
    image_object = Imagen.objects.filter(user__username=request.session['user'])
    if not image_object:
        image_object_list = ""
    else:
        image_object_list = image_object
    #return render_to_response('list_images.js',{'images':image_object_list},RequestContext(request))
    lista = ""
    from easy_thumbnails.files import get_thumbnailer

    site_object = Site.objects.get(pk=settings.SITE_ID)
    for i in range(image_object_list.count()):
        thumbnailer = get_thumbnailer(image_object_list[i].imagen)
        thumb = thumbnailer.get_thumbnail({'size': (620, 620)})
        thumb = thumbnailer.get_thumbnail_name({'size': (620, 620)})
        thumbStr = thumb.replace("\\", "/")
        if i == image_object_list.count() - 1:
            lista += "['%s','http://%s/media/%s']" % (image_object_list[i].nombre, site_object.domain, thumbStr)
        else:
            lista += "['%s','http://%s/media/%s']," % (image_object_list[i].nombre, site_object.domain, thumbStr)
    template = "var tinyMCEImageList = new Array(%s);" % lista
    return HttpResponse(template)


def listTemplates(request):
    body_object = Body.objects.filter(user__username=request.session['user'])
    if not body_object:
        body_object_list = ""
    else:
        body_object_list = body_object
    #return render_to_response('list_images.js',{'images':image_object_list},RequestContext(request))
    lista = ""
    for i in range(body_object_list.count()):
        if i == body_object_list.count() - 1:
            lista += "['%s','/news/template/%s','Template for %s']" % (
            body_object_list[i].name, body_object_list[i].name, body_object_list[i].name)
        else:
            lista += "['%s','/news/template/%s','Template for %s']," % (
            body_object_list[i].name, body_object_list[i].name, body_object_list[i].name)
    template = "var tinyMCETemplateList = new Array(%s);" % lista
    return HttpResponse(template)


def templates(request, template):
    return render_to_response(template, {}, RequestContext(request))


def getTemplate(request, nameTemplate):
    if nameTemplate:
        body_object = Body.objects.get(name=nameTemplate)
        return render_to_response('newsletter/templates.html', {'body': body_object}, RequestContext(request))


@csrf_exempt
def getArea(request):
    area_objects = Area.objects.filter(user__username=request.session['user'])
    lista = []
    for area in area_objects:
        dictionary_area = {
            'id': area.id,
            'url': force_unicode(area.link),
            'coords': area.coords,
            'shape': area.shape,
            'svg': area.svg
        }
        lista.append(dictionary_area)
    return HttpResponse(simplejson.dumps(lista))


@csrf_exempt
def getImages(request):
    images_objects = Imagen.objects.filter(user__username=request.session['user'])
    import Image
    from easy_thumbnails.files import get_thumbnailer

    lista = []
    for image in images_objects:
        file_image = Image.open(image.imagen)
        size_image = file_image.size
        thumbnailer = get_thumbnailer(image.imagen)
        thumb = thumbnailer.get_thumbnail({'size': (620, 620)})
        thumb = thumbnailer.get_thumbnail_name({'size': (620, 620)})
        thumbStr = thumb.replace("\\", "/")
        dictionary_images = {
            'name': image.nombre,
            'url': force_unicode(thumbStr),
            'height': size_image[1],
            'id': image.id
        }
        lista.append(dictionary_images)
    return HttpResponse(simplejson.dumps(lista))


@csrf_exempt
def dashboard(request):
	return render_to_response(
		'newsletter/dashboard.html',
		{},
		context_instance=RequestContext(request)
	)	
