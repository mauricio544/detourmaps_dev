# -*- coding: utf-8 -*-
import re
import random
import datetime
from datetime import timedelta
import base64
import urllib
import hashlib
import urlparse
import string
import simplejson
import qrcode
import requests
import settings
# pdf
import ho.pisa as pisa
import os
import cStringIO as StringIO
import cgi
from django.shortcuts import render_to_response, redirect
from django.http import HttpResponse, HttpResponseBadRequest, \
    Http404, HttpResponseRedirect
from django.template import RequestContext
from django.core.urlresolvers import reverse
from django.utils.encoding import force_unicode
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.contrib.gis.geos import GEOSGeometry
from django.contrib.auth import authenticate, login
from django.db.models import Count
from easy_thumbnails.files import get_thumbnailer
from django.template.defaultfilters import slugify
from django.core.mail import EmailMessage
from localflavor.us.us_states import US_STATES
from os import path
# models
from community.models import Community, Category, Business, ImageBusiness, Service, Review, \
    Subscription, BusinessEvent, ImageBusinessEvents, BusinessMenu, BusinessSchedule, \
    CouponOwner, Coupon, NewsletterSuscription, CuponBusiness, Usuario, Partner, LandingPartner, PhoneNumber as PNumber, \
    CommunitySocial, CommunityText, HeaderCommunity, Video, TipoUsuario, FeedbackBusiness, Bookmark, TenVisitsRecord, TenVisitsManage, ReferFriendsRecord, \
    ReferFriendsManage, TenVisitsBusiness, StatisticsBusiness, CouponHistory
from web.models import PrintMaps, ImagesPrintMaps, LandingPage, PhoneNumber, LandingSocial, HeaderPage, LandingText, \
    Video as WVideo, Newsletter
from community.twitter import Twitter
from django.contrib.auth.models import User
from django.contrib.sites.models import Site
from web.forms import FormCouponsRequest
from django.template.loader import render_to_string
# draw card
from PIL import Image, ImageDraw, ImageFont
from django.template.loader import get_template
from django.template import Context, loader
from web.short_url import encode_url, decode_url
# facebook auth
from community.facebook import Facebook
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import Q


class Randomizer:

    def __init__(self):
        pass

    def id_generator(self, size=6, chars=string.ascii_uppercase + string.digits):
        return ''.join(random.choice(chars) for _ in range(size))


class MyPagination:
    def mySelfPagination(self, objeto, offset, pager):
        objects_list = objeto
        paginator = Paginator(objects_list, offset)
        page = pager
        try:
            objetos = paginator.page(page)
        except PageNotAnInteger:
            objetos = paginator.page(1)
        except EmptyPage:
            objetos = paginator.page(paginator.num_pages)
        return objetos


def setUrlNameBusiness(request):
    business_objects = Business.objects.all()
    for biz in business_objects:
        biz.url_name = slugify(biz.name)
        biz.save()
    return HttpResponse('Businesses Updated')


def setCodeNameBusiness(request):
    business_objects = Business.objects.all()
    for biz in business_objects:
        biz.auth_code = encode_url(biz.id, 8)
        biz.save()
    return HttpResponse('Businesses Updated')


def getReview(request):
    if request.method == "GET":
        business_object = Business.objects.get(id=int(decode_url(request.GET["tag"])))
        review_objects = Review.objects.filter(business=business_object).order_by("-date")
        votes = qualify(business_object)
        dict_votes = {
            'votes': votes,
            'qReviews': review_objects.count()
        }
        lista_reviews = []
        for i in review_objects:
            dict_review = {
                'posted': i.user.username,
                'date': force_unicode(i.date.strftime('%b %d - %Y')),
                'comment': i.comment,
                'rate': i.stars
            }
            lista_reviews.append(dict_review)
        dict_votes['reviews'] = lista_reviews
        return HttpResponse(simplejson.dumps(dict_votes))


def getMenu(request):
    if request.method == "GET":
        business_object = Business.objects.get(id=int(decode_url(request.GET["tag"])))
        menu_object = BusinessMenu.objects.filter(business=business_object)
        dict_votes = {
            'menu': menu_object[0].menu
        }
        return HttpResponse(simplejson.dumps(dict_votes))


def generateCard(community, name, code):
    basedir = path.dirname(__file__)
    try:
        font = ImageFont.truetype(basedir + '/resources/VERDANAB.TTF', 12)
        img = Image.open("%s/resources/orange-deals.png" % basedir)
        txt = '%s - %s' % (name, code)
        x, y = (55, 160)
        draw_img = ImageDraw.Draw(img)
        draw_img.text((x - 1, y - 1), txt, font=font, fill='#ffffff')
        draw_img.text((x - 1, y + 1), txt, font=font, fill='#ffffff')
        draw_img.text((x + 1, y + 1), txt, font=font, fill='#ffffff')
        draw_img.text((x + 1, y - 1), txt, font=font, fill='#ffffff')
        draw_img.text((x + 1, y), txt, font=font, fill='#ffffff')
        draw_img.text((x - 1, y), txt, font=font, fill='#ffffff')
        draw_img.text((x, y - 1), txt, font=font, fill='#ffffff')
        draw_img.text((x, y + 1), txt, font=font, fill='#ffffff')
        draw_img.text((x, y), txt, font=font, fill='#000000')
    except IOError:
        return 'Error 0 No image'
    try:
        img.save('%scards/%s.jpg' % (settings.MEDIA_ROOT, code), "JPEG", quality=90)
        return '%scards/%s.jpg' % (settings.MEDIA_URL, code)
    except IOError:
        return 'Error 1 Could not save'


def generateCoupon(image, name, code):
    basedir = path.dirname(__file__)
    try:
        font = ImageFont.truetype(basedir+'/resources/RobotoCondensed-Light.ttf', 30)
        img = Image.open(image)
        img.load()
        background = Image.new("RGB", img.size, (255, 255, 255))
        background.paste(img)
        txt = 'Name: %s - Voucher: %s' % (name, code)
        x, y = (10, 10)
        draw_img = ImageDraw.Draw(background)
        # thin border
        draw_img.text((x-1, y), txt, (0, 0, 0), font=font)
        draw_img.text((x+1, y), txt, (0, 0, 0), font=font)
        draw_img.text((x, y-1), txt, (0, 0, 0), font=font)
        draw_img.text((x, y+1), txt, (0, 0, 0), font=font)

        # thicker border
        draw_img.text((x-1, y-1), txt, (0, 0, 0), font=font)
        draw_img.text((x+1, y-1), txt, (0, 0, 0), font=font)
        draw_img.text((x-1, y+1), txt, (0, 0, 0), font=font)
        draw_img.text((x+1, y+1), txt, (0, 0, 0), font=font)
        draw_img.text((x, y), txt, (255, 255, 255), font=font)
    except IOError:
        return 'Error 0 No image'
    try:
        background.save('%scoupon/%s.jpg' % (settings.MEDIA_ROOT, code), "JPEG", quality=90)
        return '%scoupon/%s.jpg' % (settings.MEDIA_URL, code)
    except IOError:
        return 'Error 1 Could not save'


def generateQR(url, code, host):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.ERROR_CORRECT_L,
        box_size=10,
        border=4
    )
    data = 'http://%s/community/%s' % (host, url)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image()
    try:
        img.save('%sqr/%s.jpg' % (settings.MEDIA_ROOT, code), "JPEG")
        return '%sqr/%s.jpg' % (settings.MEDIA_URL, code)
    except IOError:
        return 'Error 1 Could not save'


@csrf_exempt
def getDealCard(request):
    if request.method == "GET":
        business_object = Business.objects.get(id=int(decode_url(request.GET["tag"])))
        user_object = User.objects.get(username=request.session.get("user"))
        usuario_object = Usuario.objects.get(user=user_object)
        contact_object = None
        try:
            contact_object = ContactCard.objects.get(user__user__username=request.session.get("user"), business=business_object)
            card_object = Card.objects.filter(contact_card=contact_object)
            if card_object.count() > 0:
                card_last = card_object[card_object.count() - 1]
                if card_last.used:
                    card_object = Card(
                        contact_card=contact_object,
                        name=user_object.first_name + " " + user_object.last_name,
                        email=user_object.email,
                        mode='D'
                    )
                    card_object.save()
                    card = generateCard(business_object.community, user_object.first_name + " " + user_object.last_name, encode_url(card_object.id))
                    qr_code = generateQR('%s/map/business/panel?auth_code=%s' % (
                        business_object.community.url_name, encode_url(card_object.id)),
                                         encode_url(card_object.id), request.META["HTTP_HOST"])
                    html = render_to_string(
                        'pdf_deals.html',
                        {
                            'pagesize': 'A4',
                            'card': card,
                            'qr_code': qr_code
                        },
                        context_instance=RequestContext(request)
                    )
                    result = StringIO.StringIO()
                    pdf = pisa.pisaDocument(StringIO.StringIO(html.encode("UTF-8")), dest=result,
                                            link_callback=fetch_resources,
                                            encoding='UTF-8')
                    if not pdf.err:
                        resp = HttpResponse(result.getvalue(), mimetype='application/pdf')
                        resp['Content-Disposition'] = 'attachment; filename=%s.pdf' % request.GET["name"]
                        return resp
                    return HttpResponse('Gremlins ate your pdf! %s' % cgi.escape(html))
                else:
                    card = generateCard(business_object.community, user_object.first_name + " " + user_object.last_name, encode_url(card_last.id))
                    qr_code = generateQR('%s/map/business/panel?auth_code=%s' % (
                        business_object.community.url_name, encode_url(card_last.id)),
                                         encode_url(card_last.id), request.META["HTTP_HOST"])
                    html = render_to_string(
                        'pdf_deals.html',
                        {
                            'pagesize': 'A4',
                            'card': card,
                            'qr_code': qr_code
                        },
                        context_instance=RequestContext(request)
                    )
                    result = StringIO.StringIO()
                    pdf = pisa.pisaDocument(StringIO.StringIO(html.encode("UTF-8")), dest=result,
                                            link_callback=fetch_resources,
                                            encoding='UTF-8')
                    if not pdf.err:
                        resp = HttpResponse(result.getvalue(), mimetype='application/pdf')
                        resp['Content-Disposition'] = 'attachment; filename=%s-%s.pdf' % (user_object.first_name ,user_object.last_name)
                        return resp
                    return HttpResponse('Gremlins ate your pdf! %s' % cgi.escape(html))
            else:
                card = generateCard(business_object.community, user_object.first_name + " " + user_object.last_name, encode_url(card_object.id))
                qr_code = generateQR('%s/map/business/panel?auth_code=%s' % (
                    business_object.community.url_name, encode_url(card_object.id)),
                                     encode_url(card_object.id), request.META["HTTP_HOST"])
                html = render_to_string(
                    'pdf_deals.html',
                    {
                        'pagesize': 'A4',
                        'card': card,
                        'qr_code': qr_code
                    },
                    context_instance=RequestContext(request)
                )
                result = StringIO.StringIO()
                pdf = pisa.pisaDocument(StringIO.StringIO(html.encode("UTF-8")), dest=result,
                                        link_callback=fetch_resources,
                                        encoding='UTF-8')
                if not pdf.err:
                    resp = HttpResponse(result.getvalue(), mimetype='application/pdf')
                    resp['Content-Disposition'] = 'attachment; filename=%s-%s.pdf' % (user_object.first_name ,user_object.last_name)
                    return resp
                return HttpResponse('Gremlins ate your pdf! %s' % cgi.escape(html))
        except ContactCard.DoesNotExist:
            contact_card_object = ContactCard(
                user=usuario_object,
                business=business_object
            )
            contact_card_object.save()
            card_object = Card(
                contact_card=contact_card_object,
                name=user_object.first_name + " " + user_object.last_name,
                email=user_object.email,
                mode='D'
            )
            card_object.save()
            card = generateCard(business_object.community, user_object.first_name + " " + user_object.last_name, encode_url(card_object.id))
            qr_code = generateQR('%s/map/business/panel?auth_code=%s' % (
                business_object.community.url_name, encode_url(card_object.id)),
                                 encode_url(card_object.id), request.META["HTTP_HOST"])
            html = render_to_string(
                'pdf_deals.html',
                {
                    'pagesize': 'A4',
                    'card': card,
                    'qr_code': qr_code
                },
                context_instance=RequestContext(request)
            )
            result = StringIO.StringIO()
            pdf = pisa.pisaDocument(StringIO.StringIO(html.encode("UTF-8")), dest=result, link_callback=fetch_resources,
                                    encoding='UTF-8')
            if not pdf.err:
                resp = HttpResponse(result.getvalue(), mimetype='application/pdf')
                resp['Content-Disposition'] = 'attachment; filename=%s-%s.pdf' % (user_object.first_name ,user_object.last_name)
                return resp
            return HttpResponse('Gremlins ate your pdf! %s' % cgi.escape(html))
            #return html


@csrf_exempt
def getEmailDealCard(request):
    if request.method == "GET":
        business_object = Business.objects.get(id=int(decode_url(request.GET["tag"])))
        user_object = User.objects.get(username=request.session.get("user"))
        usuario_object = Usuario.objects.get(user=user_object)
        contact_object = None
        try:
            contact_object = ContactCard.objects.get(user__user__username=request.session.get("user"), business=business_object)
            card_object = Card.objects.filter(contact_card=contact_object)
            if card_object.count() > 0:
                card_last = card_object[card_object.count() - 1]
                if card_last.used:
                    card_object = Card(
                        contact_card=contact_object,
                        name=user_object.first_name + " " + user_object.last_name,
                        email=user_object.email,
                        mode='E'
                    )
                    card_object.save()
                    card = generateCard(business_object.community, user_object.first_name + " " + user_object.last_name, encode_url(card_object.id))
                    qr_code = generateQR('%s/map/business/panel?auth_code=%s' % (
                        business_object.community.url_name, encode_url(card_object.id)),
                                         encode_url(card_object.id), request.META["HTTP_HOST"])
                    html = render_to_string(
                        'pdf_deals.html',
                        {
                            'pagesize': 'A4',
                            'card': card,
                            'qr_code': qr_code
                        },
                        context_instance=RequestContext(request)
                    )
                    result = StringIO.StringIO()
                    pdf = pisa.pisaDocument(StringIO.StringIO(html.encode("UTF-8")), dest=result,
                                            link_callback=fetch_resources,
                                            encoding='UTF-8')
                    if not pdf.err:
                        resp = HttpResponse(result.getvalue(), mimetype='application/pdf')
                        resp['Content-Disposition'] = 'attachment; filename=%s.pdf' % request.GET["name"]
                        return resp
                    return HttpResponse('Gremlins ate your pdf! %s' % cgi.escape(html))
                else:
                    card = generateCard(business_object.community, user_object.first_name + " " + user_object.last_name, encode_url(card_last.id))
                    qr_code = generateQR('%s/map/business/panel?auth_code=%s' % (
                        business_object.community.url_name, encode_url(card_last.id)),
                                         encode_url(card_last.id), request.META["HTTP_HOST"])
                    html = render_to_string(
                        'pdf_deals.html',
                        {
                            'pagesize': 'A4',
                            'card': card,
                            'qr_code': qr_code
                        },
                        context_instance=RequestContext(request)
                    )
                    result = StringIO.StringIO()
                    pdf = pisa.pisaDocument(StringIO.StringIO(html.encode("UTF-8")), dest=result,
                                            link_callback=fetch_resources,
                                            encoding='UTF-8')
                    if not pdf.err:
                        resp = HttpResponse(result.getvalue(), mimetype='application/pdf')
                        resp['Content-Disposition'] = 'attachment; filename=%s-%s.pdf' % (user_object.first_name ,user_object.last_name)
                        return resp
                    return HttpResponse('Gremlins ate your pdf! %s' % cgi.escape(html))
            else:
                card = generateCard(business_object.community, user_object.first_name + " " + user_object.last_name, encode_url(card_object.id))
                qr_code = generateQR('%s/map/business/panel?auth_code=%s' % (
                    business_object.community.url_name, encode_url(card_object.id)),
                                     encode_url(card_object.id), request.META["HTTP_HOST"])
                html = render_to_string(
                    'pdf_deals.html',
                    {
                        'pagesize': 'A4',
                        'card': card,
                        'qr_code': qr_code
                    },
                    context_instance=RequestContext(request)
                )
                result = StringIO.StringIO()
                pdf = pisa.pisaDocument(StringIO.StringIO(html.encode("UTF-8")), dest=result,
                                        link_callback=fetch_resources,
                                        encoding='UTF-8')
                if not pdf.err:
                    resp = HttpResponse(result.getvalue(), mimetype='application/pdf')
                    resp['Content-Disposition'] = 'attachment; filename=%s-%s.pdf' % (user_object.first_name ,user_object.last_name)
                    return resp
                return HttpResponse('Gremlins ate your pdf! %s' % cgi.escape(html))
        except ContactCard.DoesNotExist:
            contact_card_object = ContactCard(
                user=usuario_object,
                business=business_object
            )
            contact_card_object.save()
            card_object = Card(
                contact_card=contact_card_object,
                name=user_object.first_name + " " + user_object.last_name,
                email=user_object.email,
                mode='D'
            )
            card_object.save()
            card = generateCard(business_object.community, user_object.first_name + " " + user_object.last_name, encode_url(card_object.id))
            qr_code = generateQR('%s/map/business/panel?auth_code=%s' % (
                business_object.community.url_name, encode_url(card_object.id)),
                                 encode_url(card_object.id), request.META["HTTP_HOST"])
            html = render_to_string(
                'pdf_deals.html',
                {
                    'pagesize': 'A4',
                    'card': card,
                    'qr_code': qr_code
                },
                context_instance=RequestContext(request)
            )
            result = StringIO.StringIO()
            pdf = pisa.pisaDocument(StringIO.StringIO(html.encode("UTF-8")), dest=result, link_callback=fetch_resources,
                                    encoding='UTF-8')
            if not pdf.err:
                resp = HttpResponse(result.getvalue(), mimetype='application/pdf')
                resp['Content-Disposition'] = 'attachment; filename=%s-%s.pdf' % (user_object.first_name ,user_object.last_name)
                return resp
            return HttpResponse('Gremlins ate your pdf! %s' % cgi.escape(html))
            #return html


@csrf_exempt
def printCoupon(request):
    if request.method == "GET":
        if "source" in request.GET:
            business_object = Business.objects.get(id=int(decode_url(request.GET["source"])))
            coupon_object = CuponBusiness.objects.get(pk=request.GET["coupon"])
            html = render_to_response(
                'coupon.html',
                {
                    'pagesize': 'A4',
                    'source': coupon_object,
                    'user': request.session.get("user")
                },
                context_instance=RequestContext(request)
            )
            return html


def emailCoupon(request):
    if "source" in request.GET:
        business_object = Business.objects.get(id=int(decode_url(request.GET["source"])))
        coupon_object = CuponBusiness.objects.get(pk=request.GET["coupon"])
        html_user = loader.get_template("/home/detourmaps/community/templates/ten_visits.html")
        context_user = Context({'link': '/communities/print/coupon?source=%s&coupon=%s' % (request.GET["source"], request.GET["coupon"]), 'message': 'Your Download coupon link!!', 'program': 'Smart Buys'})
        subject_user, from_user, to_user = 'Download your Coupon - %s' % business_object.name, 'Detour Maps <info@detourmaps.com>', request.session.get("user")
        user_context_html = html_user.render(context_user)
        message_user = EmailMessage(subject_user, user_context_html, from_user, [to_user])
        message_user.content_subtype = "html"
        message_user.send()
        dict_response = {
            'state': True,
            'message': 'Please check your inbox email account!!'
        }
        return HttpResponse(simplejson.dumps(dict_response))


@csrf_exempt
def generateShareMenu(request):
    if request.method == "GET":
        business_object = Business.objects.get(id=int(decode_url(request.GET["tag"])))
        menu_object = BusinessMenu.objects.filter(business=business_object)
        html = render_to_string(
            'pdfMenu.html',
            {
                'menu': menu_object[0].menu,
                'biz': business_object
            },
            context_instance=RequestContext(request)
        )
        result = open('%s/%s-menu.pdf' % (settings.MEDIA_ROOT, business_object.url_name), "wb")
        pdf = pisa.pisaDocument(StringIO.StringIO(html.encode("UTF-8")), dest=result, link_callback=fetch_resources,
                                encoding='UTF-8')
        # if not pdf.err:
        #     pdf = HttpResponse(result.getvalue(), mimetype='application/pdf')
        #     pdf['Content-Disposition'] = 'attachment; filename=%s-menu.pdf' % business_object.url_name
        #     return pdf
        result.close()
        dict_response = {
            'url': 'http://www.detourmaps.com/media/%s-menu.pdf' % business_object.url_name,
            'name': "%s's Menu" % business_object.name,
            'description': business_object.description,
            'redirect': 'http://detourmaps.com/community/%s/map/business/?name=%s&auth_code%s' % (
                business_object.community.url_name, business_object.url_name, business_object.getUniqueCode())
        }
        return HttpResponse(simplejson.dumps(dict_response))


@csrf_exempt
def sendCardEmail(request):
    if request.method == "GET":
        business_object = Business.objects.get(id=int(decode_url(request.GET["tag"])))
        user_object = User.objects.get(username=request.session.get("user"))
        usuario_object = Usuario.objects.get(user=user_object)
        user_template_html = '/home/detourmaps/community/templates/savings-template.html'
        html_user = get_template(user_template_html)
        context_user = Context(
            {
                'name': user_object.first_name,
                'biz': business_object.getUniqueCode(),
                'email': user_object.email,
                'business': business_object,
                'tag': request.GET["tag"]
            }
        )
        subject_user, from_user, to_user = 'Detour Maps - Get your deal card', 'Detour Maps <info@detourmaps.com>', user_object.email
        user_context_html = html_user.render(context_user)
        message_user = EmailMessage(subject_user, user_context_html, from_user, [to_user])
        message_user.content_subtype = "html"
        message_user.send()
        dict_response = {
            'msg': 'Congratulations. Check your email and follow the instructions!'
        }
        return HttpResponse(simplejson.dumps(dict_response))


@csrf_exempt
def panelBusiness(request, name):
    if request.method == "GET":
        if "auth_code" in request.GET:
            code = decode_url(request.GET["auth_code"])
            card_object = Card.objects.get(pk=code)
            return render_to_response(
                'panel_card.html',
                {
                    'card': card_object
                },
                context_instance=RequestContext(request)
            )
    if request.method == "POST":
        if "check" in request.POST and "card" in request.POST:
            card_object = Card.objects.get(pk=decode_url(request.POST["card"]))
            card_object.used = request.POST["check"]
            card_object.save()
            return HttpResponse("Card Used")


@csrf_exempt
def printDealCard(request):
    if request.method == "GET":
        business_object = Business.objects.get(id=int(decode_url(request.GET["tag"])))
        contact_object = None
        try:
            contact_object = ContactCard.objects.get(email=request.GET["email"])
            card_object = Card.objects.filter(contact_card=contact_object).filter(business=business_object).filter(
                used=False)
            if card_object.count() > 0:
                card_last = card_object[card_object.count() - 1]
                if card_last.used:
                    card_object = Card(
                        contact_card=contact_object,
                        business=business_object,
                        mode='P'
                    )
                    card_object.save()
                    card = generateCard(business_object.community, request.GET["name"], encode_url(card_object.id))
                    qr_code = generateQR('%s/map/business/panel?auth_code=%s' % (
                        business_object.community.url_name, encode_url(card_object.id)),
                                         encode_url(card_object.id), request.META["HTTP_HOST"])
                    html = render_to_response(
                        'print_deals.html',
                        {
                            'card': card,
                            'qr_code': qr_code
                        },
                        context_instance=RequestContext(request)
                    )
                    return HttpResponse(html)
                else:
                    card = generateCard(business_object.community, request.GET["name"], encode_url(card_last.id))
                    qr_code = generateQR('%s/map/business/panel?auth_code=%s' % (
                        business_object.community.url_name, encode_url(card_last.id)),
                                         encode_url(card_last.id), request.META["HTTP_HOST"])
                    html = render_to_response(
                        'print_deals.html',
                        {
                            'card': card,
                            'qr_code': qr_code
                        },
                        context_instance=RequestContext(request)
                    )
                    return HttpResponse(html)
            else:
                card_object = Card(
                    contact_card=contact_object,
                    business=business_object,
                    mode='P'
                )
                card_object.save()
                card = generateCard(business_object.community, request.GET["name"], encode_url(card_object.id))
                qr_code = generateQR('%s/map/business/panel?auth_code=%s' % (
                    business_object.community.url_name, encode_url(card_object.id)),
                                     encode_url(card_object.id), request.META["HTTP_HOST"])
                html = render_to_response(
                    'print_deals.html',
                    {
                        'card': card,
                        'qr_code': qr_code
                    },
                    context_instance=RequestContext(request)
                )
                #result = StringIO.StringIO()
                #pdf = pisa.pisaDocument(StringIO.StringIO(html.encode("UTF-8")), dest=result, link_callback=fetch_resources, encoding='UTF-8')
                #if not pdf.err:
                #    resp = HttpResponse(result.getvalue(), mimetype='application/pdf')
                #    resp['Content-Disposition'] = 'attachment; filename=%s.pdf' % request.GET["name"]
                #    return resp
                #return HttpResponse('Gremlins ate your pdf! %s' % cgi.escape(html))
                return HttpResponse(html)
        except ContactCard.DoesNotExist:
            contact_object = ContactCard(
                name=request.GET["name"],
                email=request.GET["email"],
                phone=request.GET["phone"]
            )
            contact_object.save()
            card_object = Card(
                contact_card=contact_object,
                business=business_object,
                mode='P'
            )
            card_object.save()
            card = generateCard(business_object.community, request.GET["name"], encode_url(card_object.id))
            qr_code = generateQR('%s/map/business/panel?auth_code=%s' % (
                business_object.community.url_name, encode_url(card_object.id)),
                                 encode_url(card_object.id), request.META["HTTP_HOST"])
            html = render_to_response(
                'print_deals.html',
                {
                    'card': card,
                    'qr_code': qr_code
                },
                context_instance=RequestContext(request)
            )
            #result = StringIO.StringIO()
            #pdf = pisa.pisaDocument(StringIO.StringIO(html.encode("UTF-8")), dest=result, link_callback=fetch_resources, encoding='UTF-8')
            #if not pdf.err:
            #    resp = HttpResponse(result.getvalue(), mimetype='application/pdf')
            #    resp['Content-Disposition'] = 'attachment; filename=%s.pdf' % request.GET["name"]
            #    return resp
            #return HttpResponse('Gremlins ate your pdf! %s' % cgi.escape(html))
            return HttpResponse(html)


class UnsupportedMediaPathException(Exception):
    pass


def fetch_resources(uri, rel):
    """
    Callback to allow xhtml2pdf/reportlab to retrieve Images,Stylesheets, etc.
    `uri` is the href attribute from the html link element.
    `rel` gives a relative path, but it's not used here.

    """
    if uri.startswith(settings.MEDIA_URL):
        path = os.path.join(settings.MEDIA_ROOT,
                            uri.replace(settings.MEDIA_URL, ""))
    elif uri.startswith(settings.STATIC_URL):
        path = os.path.join(settings.STATIC_ROOT,
                            uri.replace(settings.STATIC_URL, ""))
    else:
        path = os.path.join(settings.STATIC_ROOT,
                            uri.replace(settings.STATIC_URL, ""))

        if not os.path.isfile(path):
            path = os.path.join(settings.MEDIA_ROOT,
                                uri.replace(settings.MEDIA_URL, ""))

            if not os.path.isfile(path):
                raise UnsupportedMediaPathException(
                    'media urls must start with %s or %s' % (
                        settings.MEDIA_ROOT, settings.STATIC_ROOT))

    return path


def getSchedule(request):
    if request.method == "GET":
        business_object = Business.objects.get(id=int(decode_url(request.GET["tag"])))
        schedule_object = BusinessSchedule.objects.filter(business=business_object)
        dict_votes = {
            'schedule': schedule_object[0].schedule
        }
        return HttpResponse(simplejson.dumps(dict_votes))


def communitySelection(request):
    if request.META.has_key('HTTP_USER_AGENT'):
        user_agent = request.META['HTTP_USER_AGENT']
        pattern = "(up.browser|up.link|mmp|symbian|smartphone|midp|wap|phone|windows ce|pda|mobile|mini|palm|netfront)"
        prog = re.compile(pattern, re.IGNORECASE)
        match = prog.search(user_agent)
        if match:
            return render_to_response(
                'index.html',
                {
                    'community': Community.objects.filter(active=True),
                },
                context_instance=RequestContext(request)
            )
        else:
            print_maps = PrintMaps.objects.all()[0]
            img_print_maps = ImagesPrintMaps.objects.filter(print_maps=print_maps)
            img_list = []
            for i in img_print_maps:
                thumbnailer = get_thumbnailer(i.img)
                thumb = thumbnailer.get_thumbnail({'size': (600, 400), 'crop': True})
                thumb = thumbnailer.get_thumbnail_name({'size': (600, 400), 'crop': True})
                img_list.append(thumb)

            new_user = False
            if request.session.has_key('sing_up'):
                if request.session['sing_up']:
                    new_user = request.session['sing_up']
            context = {
                'new_user': new_user,
                'community': Community.objects.filter(active=True),
                'coupons_form': FormCouponsRequest(),
                'categories': Category.objects.all().order_by('name'),
                'print_maps': {
                    'type_img_src': print_maps.type_img_src,
                    'maps_standard': img_list,
                    'maps_customize': print_maps.maps_customize
                }
            }
            return render_to_response('homeDetourMaps.html', context, RequestContext(request))


def communityEvolution(request):
    if request.META.has_key('HTTP_USER_AGENT'):
        user_agent = request.META['HTTP_USER_AGENT']
        pattern = "(up.browser|up.link|mmp|symbian|smartphone|midp|wap|phone|windows ce|pda|mobile|mini|palm|netfront)"
        prog = re.compile(pattern, re.IGNORECASE)
        match = prog.search(user_agent)
        if match:
            return render_to_response(
                'index.html',
                {
                    'community': Community.objects.filter(active=True),
                },
                context_instance=RequestContext(request)
            )
        else:
            print_maps = PrintMaps.objects.all()[0]
            img_print_maps = ImagesPrintMaps.objects.filter(print_maps=print_maps)
            img_list = []
            for i in img_print_maps:
                thumbnailer = get_thumbnailer(i.img)
                thumb = thumbnailer.get_thumbnail({'size': (600, 400), 'crop': True})
                thumb = thumbnailer.get_thumbnail_name({'size': (600, 400), 'crop': True})
                img_list.append(thumb)

            new_user = False
            if request.session.has_key('sing_up'):
                if request.session['sing_up']:
                    new_user = request.session['sing_up']
            context = {
                'new_user': new_user,
                'community': Community.objects.filter(active=True),
                'coupons_form': FormCouponsRequest(),
                'categories': Category.objects.all().order_by('id'),
                'print_maps': {
                    'type_img_src': print_maps.type_img_src,
                    'maps_standard': img_list,
                    'maps_customize': print_maps.maps_customize
                }
            }
            print context
            return render_to_response('home-evolution.html', context, RequestContext(request))


@csrf_protect
def search_page(request):
    paginator_objects = MyPagination()
    if request.method == "POST":
        request.session["q"] = request.POST["q"]
        if "cat" in request.POST:
            request.session["cat"] = request.POST["cat"]
            if request.POST["cat"] == "c":
                resultset = Business.objects.filter(name__icontains=request.POST["q"]).order_by('community__name')
            elif request.POST["cat"] == "d":
                resultset = Business.objects.filter(name__icontains=request.POST["q"]).order_by('local_deals')
            else:
                resultset = Business.objects.filter(name__icontains=request.POST["q"]).order_by()
        else:
            resultset = Business.objects.filter(name__icontains=request.POST["q"])
        return render_to_response(
            'search/search.html',
            {
                'resultset': paginator_objects.mySelfPagination(resultset, 6, request.GET.get('page', 1)),
                'search': request.POST["q"]
            },
            context_instance=RequestContext(request)
        )
    else:
        q = request.session["q"]
        if "cat" in request.session:
            cat = request.session["cat"]
            if cat == "c":
                resultset = Business.objects.filter(name__icontains = q).order_by('community__name')
            elif cat == "d":
                resultset = Business.objects.filter(name__icontains = q).order_by('local_deals')
            else:
                resultset = Business.objects.filter(name__icontains = q).order_by()
        else:
            resultset = Business.objects.filter(name__icontains = q)
        return render_to_response(
            'search/search.html',
            {
                'resultset': paginator_objects.mySelfPagination(resultset, 6, request.GET.get('page', 1)),
                'search': q
            },
            context_instance=RequestContext(request)
        )

@csrf_exempt
def get_business_by_letter(request):
    response = False
    dict_response = {}
    x = 0
    if request.method == "GET":
        if 'letter' in request.GET:
            letter = request.GET["letter"]
            business_objects = Business.objects.filter(Q(name__icontains=str(letter))|Q(category__name__icontains=str(letter))|Q(community__name__icontains=str(letter))|Q(tag_service__name__icontains=str(letter)))
            if business_objects.count() > 0: response = True
            lista_biz = []
            return_cat_id = lambda cat_id: cat_id or ''
            for biz in business_objects:
                dict_biz = {
                    'name': biz.name,
                    'url_name': biz.url_name,
                    'auth_code': encode_url(biz.pk, 8),
                    'community': biz.community.url_name
                }
                lista_biz.append(dict_biz)
            dict_response['business'] = lista_biz
            dict_response['response'] = response
            return HttpResponse(simplejson.dumps(dict_response))


def listCommunities(request):
    return render_to_response(
        'menu-community.html',
        {},
        context_instance=RequestContext(request)
    )


def getSavings(request):
    return render_to_response(
        'savings.html',
        {},
        context_instance=RequestContext(request)
    )


def getQRPage(request):
    return render_to_response(
        'qr-page.html',
        {},
        context_instance=RequestContext(request)
    )


def getAboutPage(request):
    return render_to_response(
        'about-mobile.html',
        {},
        context_instance=RequestContext(request)
    )


def getSignInPage(request):
    return render_to_response(
        'sign-in.html',
        {},
        context_instance=RequestContext(request)
    )


def getRegisterBusinessPage(request):
    return render_to_response(
        'register-business.html',
        {},
        context_instance=RequestContext(request)
    )


def getJoinUs(request):
    return render_to_response(
        'join-us-mobile.html',
        {
            'states': US_STATES
        },
        context_instance=RequestContext(request)
    )


def get_events_by_mobile(request):
    events_objects_today = BusinessEvent.objects.filter(date_begin=datetime.datetime.now().date()).order_by("date_begin")
    events_objects_community = BusinessEvent.objects.values('business__community').annotate(cCount=Count('business__community'))
    community_events = Community.objects.filter(
        business__businessevent__date_begin__gte=datetime.datetime.now().date()
    ).annotate(
        num_events=Count('business__businessevent')
    ).order_by('-num_events')
    return render_to_response(
        'events_mobile.html',
        {
            'events_today': events_objects_today,
            'community': community_events
        },
        context_instance=RequestContext(request)
    )


def get_landing_event(request):
    if request.method == "GET":
        event = BusinessEvent.objects.get(pk=decode_url(request.GET["auth_code"]))
        return render_to_response(
            'landing-event.html',
            {
                'event': event
            },
            context_instance=RequestContext(request)
        )


def contact_mobile(request):
    if request.method == "POST":
        pass
    else:
        return render_to_response(
            'contact-mobile.html',
            {
                'states': US_STATES
            },
            context_instance=RequestContext(request)
        )


def testDesign(request):
    return render_to_response(
        'test-design.html',
        {},
        context_instance=RequestContext(request)
    )


@csrf_exempt
def saveSuscriptionNewsletter(request):
    if request.method == "GET":
        business_object = Business.objects.get(id=int(decode_url(request.GET["tag"])))
        suscription_news_object = NewsletterSuscription(
            email=request.GET["emailRSS"],
            business=business_object
        )
        suscription_news_object.save()
        dict_response = {
            'msg': 'Thanks for your suscription to %s' % business_object.name
        }
        return HttpResponse(simplejson.dumps(dict_response))


def mapConstructor(request, name=None):
    if name:
        if request.GET:
            if 'code' in request.GET:
                args = {
                    'client_id': settings.FACEBOOK_APP_ID,
                    'redirect_uri': request.META["HTTP_REFERER"],
                    'client_secret': settings.FACEBOOK_APP_SECRET,
                    'code': request.GET.get('code')
                }
                url = 'https://graph.facebook.com/oauth/access_token?' + \
                      urllib.urlencode(args)
                response = urlparse.parse_qs(urllib.urlopen(url).read())
                access_token = response['access_token'][0]
                expires = response['expires'][0]
                face = Facebook()
                user_face = face.authenticate(access_token, None, expires)
                request.session['user'] = user_face
                request.session.set_expiry(3600)
                request.session.modified = True
                return HttpResponseRedirect(reverse('map'))
        else:
            url_name = name
            communities = Community.objects.filter(active=True)
            community_object = communities.get(url_name=url_name)
            category_object = Category.objects.all().order_by('name')
            service_object = Service.objects.all().order_by('name')
            partner_objects = Partner.objects.filter(community=community_object)
            popup = False
            if request.META.has_key('HTTP_USER_AGENT'):
                user_agent = request.META['HTTP_USER_AGENT']
                pattern = "(up.browser|up.link|mmp|symbian|smartphone|midp|wap|phone|windows ce|pda|mobile|mini|palm|netfront)"
                prog = re.compile(pattern, re.IGNORECASE)
                match = prog.search(user_agent)
                if match:
                    return render_to_response(
                        'community-mobile.html',
                        {
                            'community': communities,
                            'community': community_object,
                            'categories': category_object,
                            'services': service_object
                        },
                        context_instance=RequestContext(request)
                    )
                else:
                    if "pop" in request.session and "community" in request.session:
                        if name == request.session["community"]:
                            popup = request.session["pop"]
                        else:
                            popup = False
                            request.session["community"] = name
                    else:
                        request.session["pop"] = True
                        request.session["community"] = name
                        popup = False
                    try:
                        basedir = settings.MEDIA_ROOT
                        if community_object.has_css_file:
                            with open('%s/%s' % (basedir, str(community_object.css_file)), 'r') as f:
                                text_css = ""
                                for i in f:
                                    text_css += i
                        else:
                            text_css = community_object.discover_css
                    except Community.DoesNotExist:
                        text_css = community_object.discover_css
                    form = FormCouponsRequest()
                    return render_to_response('cBaseB.html', {
                        'communities': communities,
                        'community': community_object,
                        'categories': category_object,
                        'services': service_object,
                        'coupons_form': form,
                        'css': text_css,
                        'business': False,
                        'partners': partner_objects,
                        'pop': popup
                    }, RequestContext(request))
    else:
        return Http404()


def deals_by_community(request, name=None):
    if name:
        community_object = Community.objects.get(url_name=name)
        biz_objects = Business.objects.filter(community=community_object)
        lista_biz = []
        for i in biz_objects:
            deals = get_deals(i)
            if deals:
                if deals != 'N':
                    lista_biz.append(i)
        if request.META.has_key('HTTP_USER_AGENT'):
            user_agent = request.META['HTTP_USER_AGENT']
            pattern = "(up.browser|up.link|mmp|symbian|smartphone|midp|wap|phone|windows ce|pda|mobile|mini|palm|netfront)"
            prog = re.compile(pattern, re.IGNORECASE)
            match = prog.search(user_agent)
            if match:
                return render_to_response(
                    'deals_by_community.html',
                    {
                        'businesses': lista_biz,
                        'community': community_object,
                        'communities': Community.objects.all(),
                    },
                    context_instance=RequestContext(request)
                )
            else:
                return render_to_response(
                    'deals-community.html',
                    {
                        'businesses': lista_biz,
                        'community': community_object,
                        'communities': Community.objects.all(),
                    },
                    context_instance=RequestContext(request)
                )


def events_by_community(request, name=None):
    paginator_objects = MyPagination()
    community_object = None
    if name:
        community_object = Community.objects.get(url_name=name)
        events_biz_objects = BusinessEvent.objects.filter(business__community=community_object).filter(
            date_begin__gte=datetime.datetime.now().date()).order_by('date_begin')
        lista_biz_events = paginator_objects.mySelfPagination(events_biz_objects, 2, request.GET.get('page', 1))
    else:
        events_biz_objects = BusinessEvent.objects.filter(
            date_begin__gte=datetime.datetime.now().date()
        ).order_by('date_begin')
        lista_biz_events = paginator_objects.mySelfPagination(events_biz_objects, 2, request.GET.get('page', 1))
        community_object = False
    return render_to_response(
        'events_by_community.html',
        {
            'events': lista_biz_events,
            'community': community_object,
            'communities': Community.objects.all()
        },
        context_instance=RequestContext(request)
    )


def discover_by_community(request, name=None):
    if name:
        community_object = Community.objects.get(url_name=name)
        categories_objects = Category.objects.all()
        events_objects = BusinessEvent.objects.filter(business__community__url_name=community_object.url_name).filter(
            date_begin__gte=datetime.datetime.now().date()).order_by('date_begin')
        return render_to_response(
            'discover.html',
            {
                'community': community_object,
                'communities': Community.objects.all(),
                'partners': Partner.objects.filter(community=community_object),
                'categories': categories_objects,
                'businesses': Business.objects.filter(community=community_object).order_by('category')
            },
            context_instance=RequestContext(request)
        )


@csrf_exempt
def api_communities(request):
    if request.method == "GET":
        if 'community' in request.GET:
            lista_business = []
            communities_var = request.GET['community']
            communities_split = communities_var.split("|")
            if communities_var.find("|") != -1:
                for i in communities_split:
                    community_object = Community.objects.get(url_name=i)
                    business_objects = Business.objects.filter(community=community_object)
                    for j in business_objects:
                        dict_biz = {
                            'name': j.name,
                            'url_name': j.url_name,
                            'auth_code': j.getUniqueCode()
                        }
                        lista_business.append(dict_biz)
            else:
                community_object = Community.objects.get(url_name=communities_var)
                business_objects = Business.objects.filter(community=community_object)
                for j in business_objects:
                    dict_biz = {
                        'name': j.name,
                        'url_name': j.url_name,
                        'auth_code': j.getUniqueCode()
                    }
                    lista_business.append(dict_biz)
            return HttpResponse(simplejson.dumps(lista_business))


def landing_partner(request, name=None):
    if name:
        community_object = Community.objects.get(url_name=name)
        partner_object = Partner.objects.get(url_name=request.GET['name'])
        landing_partner_object = LandingPartner.objects.get(partner_parent=partner_object)
        business_objects = landing_partner_object.partner_parent.business.all()
        events_objects = BusinessEvent.objects.filter(business__community__url_name=name).filter(
            date_begin__gte=datetime.datetime.now().date()).order_by('date_begin').order_by('date_begin').reverse()
        category_object = Category.objects.all()
        if request.META.has_key('HTTP_USER_AGENT'):
            user_agent = request.META['HTTP_USER_AGENT']
            pattern = "(up.browser|up.link|mmp|symbian|smartphone|midp|wap|phone|windows ce|pda|mobile|mini|palm|netfront)"
            prog = re.compile(pattern, re.IGNORECASE)
            match = prog.search(user_agent)
            if match:
                return render_to_response(
                    'landing-partner-m.html',
                    {
                        'landing_info': landing_partner_object,
                        'q': business_objects.count() / 8,
                        'categories': category_object,
                        'communities': Community.objects.all(),
                        'community': community_object,
                        'events': randomizer(events_objects, 2),
                        'partner': partner_object
                    },
                    context_instance=RequestContext(request)
                )
            else:
                return render_to_response(
                    'landing-partner.html',
                    {
                        'landing_info': landing_partner_object,
                        'q': business_objects.count() / 8,
                        'categories': category_object,
                        'communities': Community.objects.all(),
                        'community': community_object,
                        'events': randomizer(events_objects, 2),
                        'partner': partner_object
                    },
                    context_instance=RequestContext(request)
                )


def randomizer(pool_objects, number_views):
    if len(pool_objects) > 0:
        pool = list(pool_objects)
        random.shuffle(pool)
        if number_views == 0:
            list_objects = pool[number_views]
            return list_objects
        else:
            list_objects = pool[:number_views]
            return list_objects
    else:
        return False


def landing_page(request, name=None):
    if name:
        community_object = Community.objects.get(url_name=name)
        if request.META.has_key('HTTP_USER_AGENT'):
            user_agent = request.META['HTTP_USER_AGENT']
            pattern = "(up.browser|up.link|mmp|symbian|smartphone|midp|wap|phone|windows ce|pda|mobile|mini|palm|netfront)"
            prog = re.compile(pattern, re.IGNORECASE)
            match = prog.search(user_agent)
            if match:
                landing_page_object = LandingPage.objects.get(community=community_object)
                category_object = Category.objects.all()
                business_objects = Business.objects.filter(community=community_object).order_by('category')
                reviews_from_day = Review.objects.filter(business__community__url_name=name).filter(
                    date=datetime.datetime.now().date())
                rates = None
                if reviews_from_day.count() > 0:
                    rates = [i + 1 for i in range(randomizer(reviews_from_day, 0).stars)],
                else:
                    rates = ''
                events_objects = BusinessEvent.objects.filter(business__community__url_name=name).filter(
                    date_begin__gte=datetime.datetime.now().date()).order_by('date_begin')
                return render_to_response(
                    'landing-mobile.html',
                    {
                        'community': community_object,
                        'landing_info': landing_page_object,
                        'categories': category_object,
                        'businesses': business_objects,
                        'q': business_objects.count() / 8,
                        'review': randomizer(reviews_from_day, 0),
                        'stars': rates,
                        'events': randomizer(events_objects, 2),
                        'communities': Community.objects.all()
                    },
                    context_instance=RequestContext(request)
                )
            else:
                landing_page_object = LandingPage.objects.get(community=community_object)
                category_object = Category.objects.all()
                business_objects = Business.objects.filter(community=community_object).order_by('category')
                reviews_from_day = Review.objects.filter(business__community__url_name=name).filter(
                    date=datetime.datetime.now().date())
                rates = None
                if reviews_from_day.count() > 0:
                    rates = [i + 1 for i in range(randomizer(reviews_from_day, 0).stars)],
                else:
                    rates = ''
                events_objects = BusinessEvent.objects.filter(business__community__url_name=name).filter(
                    date_begin__gte=datetime.datetime.now().date()).order_by('date_begin')
                return render_to_response(
                    'landing.html',
                    {
                        'landing_info': landing_page_object,
                        'categories': category_object,
                        'businesses': business_objects,
                        'q': business_objects.count() / 8,
                        'review': randomizer(reviews_from_day, 0),
                        'stars': rates,
                        'events': randomizer(events_objects, 2),
                        'communities': Community.objects.all(),
                        'community': community_object,
                    },
                    context_instance=RequestContext(request)
                )


def getVideoDialog(request, videoId):
    if videoId:
        return render_to_response(
            'video-landing.html',
            {
                'videoId': videoId
            },
            context_instance=RequestContext(request)
        )


def qr_landing_page(request, name):
    if request.method == "GET":
        if 'code' in request.GET:
            args = {
                'client_id': settings.FACEBOOK_APP_ID,
                'redirect_uri': "http://" + request.META['HTTP_HOST'] + request.META['PATH_INFO'] + "?name=" +
                                request.GET["name"] + "&auth_code=" + request.GET["auth_code"],
                'client_secret': settings.FACEBOOK_APP_SECRET,
                'code': request.GET.get('code')
            }
            url = 'https://graph.facebook.com/oauth/access_token?' + \
                  urllib.urlencode(args)
            response = urlparse.parse_qs(urllib.urlopen(url).read())
            access_token = response['access_token'][0]
            expires = response['expires'][0]
            face = Facebook()
            user_face = face.authenticate(access_token, None, expires)
            request.session['user'] = user_face
            request.session.set_expiry(3600)
            request.session.modified = True
            return HttpResponseRedirect(
                "http://" + request.META['HTTP_HOST'] + request.META['PATH_INFO'] + "?name=" + request.GET[
                    "name"] + "&auth_code=" + request.GET["auth_code"])
        if request.META.has_key('HTTP_USER_AGENT'):
            user_agent = request.META['HTTP_USER_AGENT']
            pattern = "(up.browser|up.link|mmp|symbian|smartphone|midp|wap|phone|windows ce|pda|mobile|mini|palm|netfront|gecko)"
            prog = re.compile(pattern, re.IGNORECASE)
            match = prog.search(user_agent)
            community_object = Community.objects.get(url_name=name)
            ten_visits = False
            user = False
            coupons = False
            try:
                business_object = Business.objects.get(id=int(decode_url(request.GET["auth_code"])),
                                                       url_name=request.GET["name"])
                events_biz_objects = BusinessEvent.objects.filter(business=business_object).filter(
                    date_begin__gte=datetime.datetime.now().date()).order_by('date_begin')
            except Business.DoesNotExist:
                raise Http404
            visits= TenVisitsBusiness.objects.filter(business=business_object).filter(active=True)
            if request.session.get("user"):
                user = request.session.get("user")
                coupons = list_coupons = CouponOwner.objects.filter(user__username=user, coupon_business__business=business_object)
            else:
                user = False
            if visits.count() > 0:
                ten_visits = visits.reverse()[0]
            else:
                ten_visits = False
            if match:
                return render_to_response(
                    'landing-qr.html',
                    {
                        'business': business_object,
                        'events': events_biz_objects,
                        'communities': Community.objects.all().order_by('name'),
                        'ten_visits': ten_visits,
                        'user': user,
                        'coupons': coupons
                    },
                    context_instance=RequestContext(request)
                )
            else:
                return HttpResponseRedirect(business_object.get_absolute_url())


def getBusiness(request, name):
    """
    get business from unique url
    :param request:
    :param name:
    :return:
    """
    #TODO:GET IP from visits
    if request.session.get("user"):
        statistics = StatisticsBusiness(
            user=User.objects.get(username=request.session["user"]),
            business=Business.objects.get(id=int(decode_url(request.GET["auth_code"])),
                                                       url_name=request.GET["name"])
        )
        statistics.save()
    if request.method == "GET":
        tab = False
        if 'code' in request.GET:
            args = {
                'client_id': settings.FACEBOOK_APP_ID,
                'redirect_uri': "http://" + request.META['HTTP_HOST'] + request.META['PATH_INFO'] + "?name=" +
                                request.GET["name"] + "&auth_code=" + rFequest.GET["auth_code"],
                'client_secret': settings.FACEBOOK_APP_SECRET,
                'code': request.GET.get('code')
            }
            url = 'https://graph.facebook.com/oauth/access_token?' + \
                  urllib.urlencode(args)
            response = urlparse.parse_qs(urllib.urlopen(url).read())
            access_token = response['access_token'][0]
            expires = response['expires'][0]
            face = Facebook()
            user_face = face.authenticate(access_token, None, expires)
            request.session['user'] = user_face
            request.session.set_expiry(3600)
            request.session.modified = True
            return HttpResponseRedirect(
                "http://" + request.META['HTTP_HOST'] + request.META['PATH_INFO'] + "?name=" + request.GET[
                    "name"] + "&auth_code=" + request.GET["auth_code"])
        if request.META.has_key('HTTP_USER_AGENT'):
            user_agent = request.META['HTTP_USER_AGENT']
            pattern = "(up.browser|up.link|mmp|symbian|smartphone|midp|wap|phone|windows ce|pda|mobile|mini|palm|netfront)"
            prog = re.compile(pattern, re.IGNORECASE)
            match = prog.search(user_agent)
            community_object = Community.objects.get(url_name=name)
            popup = False
            user = False
            coupons = False
            ten_visits = False
            if "pop" in request.session and "community" in request.session:
                if name == request.session["community"]:
                    popup = request.session["pop"]
                else:
                    popup = False
                    request.session["community"] = name
            else:
                request.session["pop"] = True
                request.session["community"] = name
                popup = False
            try:
                business_object = Business.objects.get(id=int(decode_url(request.GET["auth_code"])),
                                                       url_name=request.GET["name"])
            except Business.DoesNotExist:
                raise Http404
            if request.session.get("user"):
                user = request.session.get("user")
                coupons = list_coupons = CouponOwner.objects.filter(user__username=user, coupon_business__business=business_object)
            else:
                user = False
            if "tab" in request.GET:
                tab_split = request.GET["tab"].split("|")
                if len(tab_split) > 1:
                    tab = {
                        'tab': tab_split[0],
                        'subtab': tab_split[1]
                    }
                else:
                    tab = {
                        'tab': tab_split[0]
                    }
            else:
                tab = {
                    'tab': 'info'
                }
            visits= TenVisitsBusiness.objects.filter(business=business_object).filter(active=True)
            if visits.count() > 0:
                ten_visits = visits.reverse()[0]
            else:
                ten_visits = False
            if match:
                if 'type' in request.GET:
                    return render_to_response(
                        'landing-qr.html',
                        {
                            'business': business_object,
                            'communities': Community.objects.all().order_by('name'),
                            'ten_visits': ten_visits,
                            'user': user,
                            'coupons': coupons
                        },
                        context_instance=RequestContext(request)
                    )
                else:
                    return render_to_response(
                        'landing-qr.html',
                        {
                            'business': business_object,
                            'communities': Community.objects.all().order_by('name'),
                            'ten_visits': ten_visits,
                            'user': user,
                            'coupons': coupons
                        },
                        context_instance=RequestContext(request)
                    )
            else:
                url_name = name
                communities = Community.objects.filter(active=True)
                community_object = communities.get(url_name=url_name)
                category_object = Category.objects.all().order_by('name')
                service_object = Service.objects.all().order_by('name')
                try:
                    basedir = settings.MEDIA_ROOT
                    if community_object.has_css_file:
                        with open('%s/%s' % (basedir, str(community_object.css_file)), 'r') as f:
                            text_css = ""
                            for i in f:
                                text_css += i
                    else:
                        text_css = community_object.discover_css
                except Community.DoesNotExist:
                    text_css = community_object.discover_css
                form = FormCouponsRequest()
                return render_to_response('cBaseB.html', {
                    'communities': communities,
                    'community': community_object,
                    'categories': category_object,
                    'services': service_object,
                    'coupons_form': form,
                    'css': text_css,
                    'business': business_object,
                    'pop': popup,
                    'tab': tab
                }, context_instance=RequestContext(request))
    else:
        return Http404()


def testJson(request):
    return render_to_response('savings-template.html', RequestContext(request))


def qualify(bis):
    """
    cantidad de votos del negocio
    """
    review_object = Review.objects.filter(business=bis)
    cantidad = review_object.count()
    if not cantidad:
        return 0
    else:
        subTotal = 0
        for i in review_object:
            subTotal += i.stars
        total = float(subTotal) / float(cantidad)
        return round(total, 1)


def getIfVotes(primary, ipAddress):
    try:
        review_object = Review.objects.get(business__pk=primary, ip=ipAddress)
        return 1
    except Review.DoesNotExist:
        return 0


def getSuscription(item):
    subscription_object = Subscription.objects.filter(business=item)
    if subscription_object:
        if subscription_object.count() > 0:
            renew_subscription = subscription_object[subscription_object.count() - 1].auto_renew
            if renew_subscription:
                return 1
            else:
                date_subscription = subscription_object.filter(date_start__lte=datetime.datetime.today()).filter(
                    date_end__gte=datetime.datetime.today())
                if date_subscription:
                    return 1
                else:
                    return 0
    else:
        return 0


@csrf_exempt
def toCSV(request, name):
    if name:
        import csv

        response = HttpResponse(mimetype="text/csv")
        response['Content-Disposition'] = 'attachment; filename=%s-urls.csv' % name
        writer = csv.writer(response)
        category_objects = Category.objects.order_by('id')
        for i in category_objects:
            business_object = Business.objects.filter(category=i).filter(
                community__url_name=name).order_by("name")
            for j in business_object:
                writer.writerow(['%s' % j.name.encode("ascii", "ignore"),
                                 'http://www.detourmaps.com/communities/%s/map/business/?name=%s&auth_code=%s' % (
                                     name, j.url_name, encode_url(j.id))])
        return response


@csrf_exempt
def toAllCSV(request):
    import csv

    response = HttpResponse(mimetype="text/csv")
    response['Content-Disposition'] = 'attachment; filename=%s-urls.csv' % 'all'
    writer = csv.writer(response)
    business_object = Business.objects.all().order_by("community")
    writer.writerow([
        'Business Name',
        'Community',
        'Address',
        'Phones',
        'Email',
        'Facebbok',
        'Twitter',
        'Logo',
        'Images',
        'Url'
    ])
    for j in business_object:
        logo = 'False'
        images = 'False'
        phones = ""
        email = ""
        facebook = ""
        twitter = ""
        if j.imagebusiness_set.all().count() > 0: images = 'True'
        if j.logo: logo = 'True'
        if j.phones: phones = j.phones
        if j.email: email = j.email
        if j.facebook: facebook = j.facebook
        if j.twitter: twitter = j.twitter
        url_community = ""
        name_community = ""
        if j.community:
            url_community = j.community.url_name
            name_community = j.community.name
        writer.writerow([
            '%s' % j.name.encode("ascii", "ignore"),
            '%s' % name_community,
            '%s' % j.address.encode("ascii", "ignore"),
            '%s' % phones.encode("ascii", "ignore"),
            '%s' % email.encode("ascii", "ignore"),
            '%s' % facebook.encode("ascii", "ignore"),
            '%s' % twitter.encode("ascii", "ignore"),
            logo,
            images,
            'http://www.detourmaps.com/communities/%s/map/business/?name=%s&auth_code=%s' % (url_community, j.url_name.encode("ascii", "ignore"), encode_url(j.id, 8))
        ])
    return response


@csrf_exempt
def toCSVSuscription(request, name):
    if name:
        import csv
        response = HttpResponse(mimetype="text/csv")
        response['Content-Disposition'] = 'attachment; filename=%s-urls.csv' % name
        writer = csv.writer(response)
        category_objects = Category.objects.order_by('id')
        for i in category_objects:
            business_object = Business.objects.filter(category=i).filter(
                community__url_name=name).order_by("name")
            for j in business_object:
                writer.writerow(['%s' % j.name.encode("ascii", "ignore"),
                                 'http://www.detourmaps.com/community/%s/map/business/?name=%s&auth_code=%s' % (
                                     name, j.url_name, encode_url(j.id))])
        return response


@csrf_exempt
def getCodesBusiness(request):
    if request.method == "GET":
        import csv

        response = HttpResponse(mimetype="text/csv")
        response['Content-Disposition'] = 'attachment; filename=%s-urls.csv' % 'codes'
        writer = csv.writer(response)
        if 'community' in request.GET:
            lista_business = []
            communities_var = request.GET['community']
            communities_split = communities_var.split("|")
            if communities_var.find("|") != -1:
                for i in communities_split:
                    community_object = Community.objects.get(url_name=i)
                    business_objects = Business.objects.filter(community=community_object)
                    for j in business_objects:
                        writer.writerow(['%s' % j.name.encode("ascii", "ignore"),
                                         j.getUniqueCode()
                        ])
            else:
                community_object = Community.objects.get(url_name=communities_var)
                business_objects = Business.objects.filter(community=community_object)
                for j in business_objects:
                    writer.writerow(['%s' % j.name.encode("ascii", "ignore"),
                                     j.getUniqueCode()
                    ])
            return response


def parseSpecialChar(value):
    value_lower = value.lower()
    special = ['@', '#', '$', '%', '&', ' ', '/', "'"]
    special1 = [u'ñ', u'á', u'é', u'í', u'ó', u'ú']
    lista = ""
    for i in value_lower:
        if i in special:
            lista += "-"
        elif i in special1:
            if i == u"ñ":
                lista += "n"
            elif i == u"á":
                lista += "a"
            elif i == u"é":
                lista += "e"
            elif i == u"í":
                lista += "i"
            elif i == u"ó":
                lista += "o"
            else:
                lista += "u"
        else:
            lista += i
    return lista


def get_deals(biz):
    """
    get deals if exist return the value of the field if not exist return false or field is None return False
    """
    if biz.local_deals:
        if biz.local_deals == "N":
            return "N"
        else:
            return biz.local_deals
    else:
        return "N"


def get_partner(biz):
    """
    get partner, if business belongs to partner
    """
    if biz.partner_set.all():
        return "%s Member" % biz.partner_set.all()[0].name
    else:
        return ""


def get_thumbnail_vists(image):
    thumbnailer = get_thumbnailer(image)
    thumb = thumbnailer.get_thumbnail({'size': (346, 231), 'crop': True})
    thumb = thumbnailer.get_thumbnail_name({'size': (346, 231), 'crop': True})
    return thumb


@csrf_exempt
def data(request, name):
    """
    """
    if name:
        categoria_object = Category.objects.all().order_by('name')
        service_object = Service.objects.all().order_by('id')
        community_object = Community.objects.get(url_name=name)
        dictionary_category = {}
        lista = []
        list_business_event = []
        dictionary_community = {
            'border': force_unicode(GEOSGeometry(community_object.borders).json)
        }
        for i in categoria_object:
            dictionary_detalle_categoria = {
                'name': i.name,
                'desc': force_unicode(i.description),
                'img': force_unicode(i.icon),
                'color': force_unicode(i.color)
            }
            business_object = Business.objects.filter(category=i).filter(
                community__url_name=name).order_by("name")
            lista_business = []

            for j in business_object:
                avg = qualify(j)
                #hasVote = getIfVotes(j.pk,request.META.get('REMOTE_ADDR', ''))
                ten_visits = False
                if j.tenvisitsbusiness_set.all().count() > 0:
                    ten_visits = get_thumbnail_vists(j.tenvisitsbusiness_set.all()[0].image)
                hasSubscription = getSuscription(j)
                if not j.EntryDetails():
                    dictionary_detalle_business = {
                        'id': j.id,
                        'name': j.name,
                        'desc': j.description,
                        'b2c': j.belongs2community,
                        'chamber_member': j.chamber_member,
                        'geo': force_unicode(j.geo),
                        'address': j.address,
                        'phones': j.phones,
                        'site': force_unicode(j.site),
                        'fb': force_unicode(j.facebook),
                        'tt': force_unicode(j.twitter),
                        'enable_comments': j.enable_comments,
                        'avg': avg,
                        #'vote':hasVote,
                        'logo': force_unicode(j.logo),
                        'video': '',
                        'video_title': '',
                        'ten_visit': ten_visits,
                        'video_description': j.video_description,
                        'subscription': hasSubscription,
                        'url': j.url_name + "/" + encode_url(j.id, 8),
                        'deals': get_deals(j),
                        'community': j.community.url_name,
                        'auth_code': j.getUniqueCode(),
                        'url_name': j.url_name,
                        'partner': get_partner(j),
                        'refer_friends': j.refer_friends
                    }
                else:
                    entryDetails = j.EntryDetails()
                    dictionary_detalle_business = {
                        'id': j.id,
                        'name': j.name,
                        'desc': j.description,
                        'b2c': j.belongs2community,
                        'chamber_member': j.chamber_member,
                        'geo': force_unicode(j.geo),
                        'address': j.address,
                        'phones': j.phones,
                        'site': force_unicode(j.site),
                        'fb': force_unicode(j.facebook),
                        'tt': force_unicode(j.twitter),
                        'enable_comments': j.enable_comments,
                        'avg': avg,
                        #'vote':hasVote,
                        'logo': force_unicode(j.logo),
                        'video': j.parseId(),
                        'video_title': entryDetails.title.text,
                        'ten_visit': ten_visits,
                        'video_img_0': entryDetails.media.thumbnail[1].url,
                        'video_img_1': entryDetails.media.thumbnail[2].url,
                        'video_img_2': entryDetails.media.thumbnail[3].url,
                        'video_description': j.video_description,
                        'subscription': hasSubscription,
                        'url': j.url_name + "/" + encode_url(j.id, 8),
                        'deals': get_deals(j),
                        'community': j.community.url_name,
                        'auth_code': j.getUniqueCode(),
                        'url_name': j.url_name,
                        'partner': get_partner(j),
                        'refer_friends': j.refer_friends
                    }
                lista_tag_services = []
                for tag in j.tag_service.all():
                    lista_tag_services.append(str(tag.id))
                lista_images_business = []
                lista_cupon_business = []
                image_business_object = ImageBusiness.objects.filter(business=j)
                for img in image_business_object:
                    thumbnailer = get_thumbnailer(img.img)
                    thumb = thumbnailer.get_thumbnail({'size': (215, 198), 'crop': True})
                    thumb = thumbnailer.get_thumbnail_name({'size': (215, 198), 'crop': True})
                    dictionary_image_business = {
                        'name': img.name,
                        'img': thumb
                    }
                    lista_images_business.append(dictionary_image_business)

                cupon_business_object = CuponBusiness.objects.filter(business=j, active=1)
                for img in cupon_business_object:
                    thumbnailer = get_thumbnailer(img.coupon)
                    thumb = thumbnailer.get_thumbnail({'size': (420, 200), 'crop': True})
                    thumb = thumbnailer.get_thumbnail_name({'size': (420, 200), 'crop': True})
                    medium_thumb = thumbnailer.get_thumbnail({'size': (720, 400), 'crop': True})
                    medium_thumb = thumbnailer.get_thumbnail_name({'size': (720, 400), 'crop': True})
                    small_thumb = thumbnailer.get_thumbnail({'size': (280, 120), 'crop': True})
                    small_thumb = thumbnailer.get_thumbnail_name({'size': (280, 120), 'crop': True})
                    dictionary_cupon_business = {
                        'id': img.id,
                        'name': img.name,
                        'img': thumb,
                        'medium': medium_thumb,
                        'small': small_thumb,
                        'start_date': img.start_date.strftime('%m/%d/%Y'),
                        'end_date': img.end_date.strftime('%m/%d/%Y')
                    }
                    lista_cupon_business.append(dictionary_cupon_business)

                dictionary_detalle_business['img'] = lista_images_business
                dictionary_detalle_business['cupon'] = lista_cupon_business
                dictionary_detalle_business['tags'] = lista_tag_services
                lista_business.append(dictionary_detalle_business)

                #begin = datetime.datetime.now().strftime('%Y-%m-%d')
                #end = (datetime.datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
                business_events = BusinessEvent.objects.filter(business__id=j.id, active=True).filter(date_end__gte=datetime.datetime.now().date())
                for evt in business_events:
                    img_business_event = ImageBusinessEvents.objects.filter(business_event=evt)
                    list_img_business_event = []
                    for img_evt in img_business_event:
                        thumbn = get_thumbnailer(img_evt.img)
                        thumb = thumbn.get_thumbnail({'size': (215, 215), 'crop': True})
                        thumb = thumbn.get_thumbnail_name({'size': (215, 215), 'crop': True})
                        dictionary_image_business_event = {
                            'name': img_evt.name,
                            'img': settings.MEDIA_URL + thumb
                        }
                        list_img_business_event.append(dictionary_image_business_event)
                    return_date = lambda date_evt: date_evt or ''
                    if evt.date_end:
                        list_business_event.append({
                            'id': j.id,
                            'name': j.name,
                            'title': evt.title,
                            'description': evt.description,
                            'facebook': evt.facebook,
                            'twitter': evt.twitter,
                            'google_plus': evt.google_plus,
                            'images': list_img_business_event,
                            'date': {
                                'str': force_unicode(return_date(evt.date_begin.strftime('%b %d'))),
                                'end': force_unicode(return_date(evt.date_end.strftime('%b %d'))),
                                'day': force_unicode(return_date(evt.date_begin.strftime('%d'))),
                                'month': force_unicode(return_date(evt.date_begin.strftime('%m'))),
                                'year': force_unicode(return_date(evt.date_begin.strftime('%Y'))),
                            },
                            'geo': force_unicode(evt.geo),
                            'address': evt.address,
                            'url': "event/" + base64.urlsafe_b64encode(str(evt.id))
                        })
                    else:
                        list_business_event.append({
                            'id': j.id,
                            'name': j.name,
                            'title': evt.title,
                            'description': evt.description,
                            'facebook': evt.facebook,
                            'twitter': evt.twitter,
                            'google_plus': evt.google_plus,
                            'images': list_img_business_event,
                            'date': {
                                'str': force_unicode(return_date(evt.date_begin.strftime('%b %d'))),
                                'end': '',
                                'day': force_unicode(return_date(evt.date_begin.strftime('%d'))),
                                'month': force_unicode(return_date(evt.date_begin.strftime('%m'))),
                                'year': force_unicode(return_date(evt.date_begin.strftime('%Y'))),
                            },
                            'geo': force_unicode(evt.geo),
                            'address': evt.address,
                            'url': "event/" + base64.urlsafe_b64encode(str(evt.id))
                        })
                del business_events

            dictionary_detalle_categoria['bis'] = lista_business
            lista.append(dictionary_detalle_categoria)
        lista_tag_id = []
        dictionary_tag = {}
        for tag in service_object:
            dictionary_detalle_tag = {
                'name': tag.name,
                'icon': force_unicode(tag.icon),
                'color': tag.color,
                'desc': tag.description
            }
            dictionary_tag[tag.id] = dictionary_detalle_tag
            lista_tag_id.append(dictionary_tag)

        dictionary_category['cat'] = lista
        dictionary_category['tags'] = dictionary_tag
        dictionary_category['community'] = dictionary_community
        dictionary_category['events'] = list_business_event
        return HttpResponse(simplejson.dumps(dictionary_category), mimetype='application/json')


def getUrlCommunity(biz):
    if biz.community:
        return biz.community.url_name
    else:
        return ''


@csrf_exempt
def alldata(request):
    """
    """
    categoria_object = Category.objects.all().order_by('id')
    service_object = Service.objects.all().order_by('id')
    dictionary_category = {}
    lista = []
    list_business_event = []
    for i in categoria_object:
        dictionary_detalle_categoria = {
            'name': i.name,
            'desc': force_unicode(i.description),
            'img': force_unicode(i.icon),
            'color': force_unicode(i.color)
        }
        business_object = Business.objects.filter(category=i).order_by("name")
        lista_business = []

        for j in business_object:
            avg = qualify(j)
            #hasVote = getIfVotes(j.pk,request.META.get('REMOTE_ADDR', ''))
            hasSubscription = getSuscription(j)
            dictionary_detalle_business = {
                'id': j.id,
                'url': j.get_absolute_url(),
                'name': j.name,
                'address': j.address
            }
            lista_tag_services = []
            for tag in j.tag_service.all():
                lista_tag_services.append(str(tag.id))
            lista_images_business = []
            lista_cupon_business = []
            image_business_object = ImageBusiness.objects.filter(business=j)
            for img in image_business_object:
                thumbnailer = get_thumbnailer(img.img)
                thumb = thumbnailer.get_thumbnail({'size': (215, 198), 'crop': True})
                thumb = thumbnailer.get_thumbnail_name({'size': (215, 198), 'crop': True})
                dictionary_image_business = {
                    'name': img.name,
                    'img': thumb
                }
                lista_images_business.append(dictionary_image_business)

            cupon_business_object = CuponBusiness.objects.filter(business=j)
            for img in cupon_business_object:
                thumbnailer = get_thumbnailer(img.img)
                thumb = thumbnailer.get_thumbnail({'size': (420, 200), 'crop': True})
                thumb = thumbnailer.get_thumbnail_name({'size': (420, 200), 'crop': True})
                medium_thumb = thumbnailer.get_thumbnail({'size': (720, 400), 'crop': True})
                medium_thumb = thumbnailer.get_thumbnail_name({'size': (720, 400), 'crop': True})
                dictionary_cupon_business = {
                    'name': img.name,
                    'img': thumb,
                    'medium': medium_thumb
                }
                lista_cupon_business.append(dictionary_cupon_business)

            dictionary_detalle_business['img'] = lista_images_business
            dictionary_detalle_business['cupon'] = lista_cupon_business
            dictionary_detalle_business['tags'] = lista_tag_services
            lista_business.append(dictionary_detalle_business)

            begin = datetime.datetime.now().strftime('%Y-%m-%d')
            end = (datetime.datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
            business_events = BusinessEvent.objects.raw(
                '''SELECT * FROM community_businessevent cb
                WHERE cb.business_id=%s and cb.active=true
                and (cb.date_begin between '%s' and '%s'
                OR cb.date_end between '%s' and '%s'
                OR '%s' between cb.date_begin and cb.date_end
                OR '%s' between cb.date_begin and cb.date_end)''' % (j.id, begin, end, begin, end, begin, end))
            #if len(business_events) > 0:
            for evt in business_events:
                img_business_event = ImageBusinessEvents.objects.filter(business_event=evt)
                list_img_business_event = []
                for img_evt in img_business_event:
                    thumbn = get_thumbnailer(img_evt.img)
                    thumb = thumbn.get_thumbnail({'size': (215, 215), 'crop': True})
                    thumb = thumbn.get_thumbnail_name({'size': (215, 215), 'crop': True})
                    dictionary_image_business_event = {
                        'name': img_evt.name,
                        'img': settings.MEDIA_URL + thumb
                    }
                    list_img_business_event.append(dictionary_image_business_event)
                return_date = lambda date_evt: date_evt or ''
                if evt.date_end:
                    list_business_event.append({
                        'id': j.id,
                        'name': j.name,
                        'title': evt.title,
                        'description': evt.description,
                        'facebook': evt.facebook,
                        'twitter': evt.twitter,
                        'google_plus': evt.google_plus,
                        'images': list_img_business_event,
                        'date': {
                            'str': force_unicode(return_date(evt.date_begin.strftime('%b %d'))), #%m-%d-%Y
                            'end': force_unicode(return_date(evt.date_end.strftime('%b %d'))),
                            'day': force_unicode(return_date(evt.date_begin.strftime('%d'))),
                            'month': force_unicode(return_date(evt.date_begin.strftime('%m'))),
                            'year': force_unicode(return_date(evt.date_begin.strftime('%Y'))),
                        },
                        'geo': force_unicode(evt.geo),
                        'address': evt.address,
                        'url': "event/" + base64.urlsafe_b64encode(str(evt.id))
                    })
                else:
                    list_business_event.append({
                        'id': j.id,
                        'name': j.name,
                        'title': evt.title,
                        'description': evt.description,
                        'facebook': evt.facebook,
                        'twitter': evt.twitter,
                        'google_plus': evt.google_plus,
                        'images': list_img_business_event,
                        'date': {
                            'str': force_unicode(return_date(evt.date_begin.strftime('%b %d'))), #%m-%d-%Y
                            'end': '',
                            'day': force_unicode(return_date(evt.date_begin.strftime('%d'))),
                            'month': force_unicode(return_date(evt.date_begin.strftime('%m'))),
                            'year': force_unicode(return_date(evt.date_begin.strftime('%Y'))),
                        },
                        'geo': force_unicode(evt.geo),
                        'address': evt.address,
                        'url': "event/" + base64.urlsafe_b64encode(str(evt.id))
                    })
            del business_events

        dictionary_detalle_categoria['bis'] = lista_business
        lista.append(dictionary_detalle_categoria)
    lista_tag_id = []
    dictionary_tag = {}
    for tag in service_object:
        dictionary_detalle_tag = {
            'name': tag.name,
            'icon': force_unicode(tag.icon),
            'color': tag.color,
            'desc': tag.description
        }
        dictionary_tag[tag.id] = dictionary_detalle_tag
        lista_tag_id.append(dictionary_tag)

    dictionary_category['cat'] = lista
    dictionary_category['tags'] = dictionary_tag
    dictionary_category['events'] = list_business_event
    return HttpResponse(simplejson.dumps(dictionary_category), mimetype='application/json')


@csrf_exempt
def dataIndividual(request):
    """
        function for unique url for a business
    """
    if "name" in request.GET:
        business_object = Business.objects.filter(name=request.GET['name'])
        dictionary_business = {
            'bi': business_object[0].pk,
            'ci': "0"
        }
        return HttpResponse(simplejson.dumps(dictionary_business))


@csrf_exempt
def rate_business(request):
    if request.method == "POST":
        business_object = Business.objects.get(id=int(request.POST['bis']))
        try:
            last_review = Review.objects.order_by('-date').filter(business=business_object, user=request.user)[0].date
        except Exception:
            last_review = datetime.date.today() - timedelta(days=30)
        diff = datetime.date.today() - datetime.date(last_review.year, last_review.month, last_review.day)
        if business_object.enable_comments and int(diff.days) >= business_object.rate_interval:
            comment = request.POST['comment'] or None
            stars = int(request.POST['stars'])
            review = Review.objects.create(user=request.user, business=business_object, stars=stars, comment=comment)
            obj = {
                'id': review.id,
                'username': review.user.username,
                'comment': review.comment,
                'stars': review.stars
            }
            return HttpResponse(simplejson.dumps(obj), mimetype='application/json')
        else:
            return HttpResponseBadRequest(content='This Business does not allow comments.')


@csrf_exempt
def getRattingBusiness(request):
    if request.method == 'POST':
        business_object = Business.objects.get(name__contains=request.POST['bis'])
        cantidad_votos = qualify(business_object)
        return HttpResponse(cantidad_votos)
    else:
        return 0


def getBusinessReview(request):
    if request.method == "GET":
        business_object = Business.objects.get(id=int(request.GET['bis']))
        reviews = Review.objects.order_by('-date').filter(business=business_object, enable=True)[0:50]

        reviews_list = []
        for obj in reviews:
            reviews_list.append({
                'id': obj.id,
                'username': obj.user.username,
                'comment': obj.comment,
                'stars': obj.stars,
                'date': obj.date.strftime("%m-%d-%Y")
            })

        return HttpResponse(simplejson.dumps(reviews_list), mimetype='application/json')


def getitem(request):
    if request.method == "GET":
        business_object = Business.objects.get(id=int(request.GET['bis']))
        obj = {
            'id': business_object.id,
            'name': business_object.name,
            'geo': str(business_object.geo)
        }
    return HttpResponse(simplejson.dumps(obj), mimetype='application/json')


def mobile(request):
    community_object = Community.objects.all()
    return render_to_response('mobile.html', {'communities': community_object},
                              context_instance=RequestContext(request))


@csrf_exempt
def get_session(request):
    dict_response = {}
    uid = None
    if request.method == "GET":
        if request.session.get("user"):
            try:
                user_objects = User.objects.get(username=request.session["user"])
                dict_response["session"] = True
                dict_response["id"] = user_objects.id
                dict_response["username"] = user_objects.username
                dict_response["email"] = user_objects.email
                dict_response["names"] = '%s %s' % (user_objects.first_name, user_objects.last_name)
                img_default = "http://www.detourmaps.com/static/web/img/detourIcon.png"
                size = 40
                gravatar_url = "http://www.gravatar.com/avatar/" + hashlib.md5(
                    user_objects.email.lower()).hexdigest() + "?"
                gravatar_url += urllib.urlencode({'d': img_default, 's': str(size)})
                dict_response["gravatar"] = gravatar_url
            except User.DoesNotExist:
                dict_response["session"] = False
        else:
            dict_response["session"] = False
        return HttpResponse(simplejson.dumps(dict_response))


@csrf_exempt
def set_review(request):
    uid = None
    if request.method == "GET":
        biz_object = Business.objects.get(id=int(decode_url(request.GET["tag"])))
        if not request.session.get("user"):
            review_object = Review(
                business=biz_object,
                comment=request.GET["commentBiz"],
                stars=request.GET["rateBiz"],
            )
            review_object.save()
        else:
            review_object = Review(
                user=User.objects.get(username=request.session["user"]),
                business=biz_object,
                comment=request.GET["commentBiz"],
                stars=request.GET["rateBiz"],
            )
            review_object.save()
        dict_response = {
            'msg': 'Congratulations. Your rate was saved!'
        }
        return HttpResponse(simplejson.dumps(dict_response))


@csrf_exempt
def share_by_email(request):
    if request.method == "GET":
        biz_object = Business.objects.get(id=int(decode_url(request.GET["tag"])))
        html = """\
        <html>
        <head></head>
        <body>
        <div style="position: relative; width: 600px; margin: auto;">
        <h1><img src="http://www.detourmaps.com/static/community/img/detourOrange.png"/></h1>
        <p>
        <h2>See %s</h2>
        <a href="http://www.detourmaps.com%s">View more information about this business here</a>
        </p>
        </div>
        </body>
        </html>
        """ % (biz_object.name, biz_object.get_absolute_url())
        requests.post(
            "https://api.mailgun.net/v2/detourmaps.mailgun.org/messages",
            auth=("api", "key-2dracu8lzgq16-4r8jugoslhe8r9q3a3"),
            data={"from": "Detour Maps <events@detourmaps.mailgun.org>",
                  "to": [request.GET["emailShared"], ],
                  "subject": "Detour Maps - %s" % biz_object.name,
                  "text": "Testing some Mailgun awesomness!",
                  "html": html}
        )
        dict_response = {
            'msg': 'Congratulations. Your shared is complete!'
        }
        return HttpResponse(simplejson.dumps(dict_response))


@csrf_exempt
def share_by_email_event(request):
    if request.method == "GET":
        event_object = BusinessEvent.objects.get(id=int(request.GET["tag"]))
        html = """\
        <html>
        <head></head>
        <body>
        <div style="position: relative; width: 600px; margin: auto;">
        <h1><img src="http://www.detourmaps.com/static/community/img/detourOrange.png"/></h1>
        <p>
        <h2>See %s</h2>
        <a href="http://www.detourmaps.com%s">View more information about this business here</a>
        </p>
        </div>
        </body>
        </html>
        """ % (event_object.title, event_object.get_absolute_url())
        requests.post(
            "https://api.mailgun.net/v2/detourmaps.mailgun.org/messages",
            auth=("api", "key-2dracu8lzgq16-4r8jugoslhe8r9q3a3"),
            data={"from": "Detour Maps <events@detourmaps.mailgun.org>",
                  "to": [request.GET["emailShared"], ],
                  "subject": "Detour Maps - %s" % event_object.title,
                  "text": "Testing some Mailgun awesomness!",
                  "html": html}
        )
        dict_response = {
            'msg': 'Congratulations. Your shared is complete!'
        }
        return HttpResponse(simplejson.dumps(dict_response))


@csrf_exempt
def share_direction_by_email(request):
    if request.method == "GET":
        biz_object = Business.objects.get(id=int(decode_url(request.GET["tag"])))
        html = """\
        <html>
        <head></head>
        <body>
        <div style="position: relative; width: 600px; margin: auto;">
        <h1><img src="http://www.detourmaps.com/static/community/img/detourOrange.png"/></h1>
        <p>
        <h2>How to get to %s</h2>
        <a href="https://maps.google.com/maps?saddr=%s&daddr=%s">Get the direction</a>
        </p>
        </div>
        </body>
        </html>
        """ % (biz_object.name, request.GET["saddr"], request.GET["daddr"])
        requests.post(
            "https://api.mailgun.net/v2/detourmaps.mailgun.org/messages",
            auth=("api", "key-2dracu8lzgq16-4r8jugoslhe8r9q3a3"),
            data={"from": "Detour Maps <directions@detourmaps.mailgun.org>",
                  "to": [request.GET["emailShared"], ],
                  "subject": "Detour Maps - %s - Get Direction" % biz_object.name,
                  "text": "Sending directions by email",
                  "html": html}
        )
        dict_response = {
            'msg': 'Congratulations. Your shared is complete!'
        }
        return HttpResponse(simplejson.dumps(dict_response))


@csrf_exempt
def share_direction_by_email_event(request):
    if request.method == "GET":
        event_object = BusinessEvent.objects.get(id=int(request.GET["tag"]))
        html = """\
        <html>
        <head></head>
        <body>
        <div style="position: relative; width: 600px; margin: auto;">
        <h1><img src="http://www.detourmaps.com/static/community/img/detourOrange.png"/></h1>
        <p>
        <h2>How to get to %s</h2>
        <a href="https://maps.google.com/maps?saddr=%s&daddr=%s">Get the direction</a>
        </p>
        </div>
        </body>
        </html>
        """ % (event_object.title, request.GET["saddr"], request.GET["daddr"])
        requests.post(
            "https://api.mailgun.net/v2/detourmaps.mailgun.org/messages",
            auth=("api", "key-2dracu8lzgq16-4r8jugoslhe8r9q3a3"),
            data={"from": "Detour Maps <directions@detourmaps.mailgun.org>",
                  "to": [request.GET["emailShared"], ],
                  "subject": "Detour Maps - %s - Get Direction" % event_object.title,
                  "text": "Sending directions by email",
                  "html": html}
        )
        dict_response = {
            'msg': 'Congratulations. Your shared is complete!'
        }
        return HttpResponse(simplejson.dumps(dict_response))


@csrf_exempt
def get_events_by_biz_or_by_date(request):
    if request.method == "GET":
        return_phone = lambda event_date: event_date or ''
        if "date" in request.GET:
            biz_object = Business.objects.get(id=int(decode_url(request.GET["tag"])))
            events_objects = BusinessEvent.objects.filter(business=biz_object).filter(date_begin=request.GET["date"]).order_by("date_begin")
            list_events = []
            dict_events = None
            if events_objects.count() > 0:
                dict_events = {
                    'msg': True,
                    'Q': events_objects.count()
                }
                for i in events_objects:
                    dict_event = {
                        'title': i.title,
                        'description': i.description,
                        'address': i.address,
                        'date': i.date_begin.strftime('%B %d'),
                        'phone': force_unicode(return_phone(i.phone))
                    }
                    list_events.append(dict_event)
                dict_events['lists'] = list_events
            else:
                dict_events = {
                    'msg': False,
                    'Q': 0,
                    'biz': biz_object.name
                }
            return HttpResponse(simplejson.dumps(dict_events))
        else:
            biz_object = Business.objects.get(id=int(decode_url(request.GET["tag"])))
            events_objects = BusinessEvent.objects.filter(business=biz_object).filter(
                date_begin__gte=datetime.datetime.now().date()).order_by("date_begin")
            list_events = []
            dict_events = None
            if events_objects.count() > 0:
                dict_events = {
                    'msg': True,
                    'Q': events_objects.count()
                }
                for i in events_objects:
                    dict_event = {
                        'title': i.title,
                        'description': i.description,
                        'address': i.address,
                        'date': i.date_begin.strftime('%B %d'),
                        'phone': force_unicode(return_phone(i.phone))
                    }
                    list_events.append(dict_event)
                dict_events['lists'] = list_events
            else:
                dict_events = {
                    'msg': False,
                    'Q': 0,
                    'biz': biz_object.name
                }
            return HttpResponse(simplejson.dumps(dict_events))


Sesion = {}


@csrf_exempt
def LoginAccount(request):
    #Logeo con Google+
    if request.POST and request.POST.get('user_type') == 'G':
        try:
            user = TipoUsuario.objects.get(usuario__user__username=request.POST.get('username'))
            request.session['user'] = user.usuario.user
            print request.session["user"]
            Sesion['estado'] = True

        except TipoUsuario.DoesNotExist:
            name = request.POST.get('first_name')
            last_name = request.POST.get('last_name')
            email = request.POST.get('username')
            accessToken = request.POST.get('access_token')
            expires = request.POST.get('expires')
            user_id = request.POST.get('user_id')
            user_type = request.POST.get('user_type')
            try:
                user = User.objects.get(username=email)
                request.session['user'] = user
                usuario_object = Usuario(
                    user=user
                )
                usuario_object.save()
                userGoogle = TipoUsuario(
                    usuario=usuario_object,
                    access_token=accessToken,
                    expires=expires,
                    userid=user_id,
                )
                userGoogle.save()
                usuario_object.tipo_usuario = userGoogle.id
                usuario_object.save()
                Sesion['estado'] = True
            except User.DoesNotExist:
                user = User()
                user.first_name = name
                user.username = email
                user.last_name = last_name
                user.email = email
                user.is_active = True
                user.set_unusable_password()
                user.save()
                request.session['user'] = user
                usuario_object = Usuario(
                    user=user
                )
                usuario_object.save()
                userGoogle = TipoUsuario(
                    usuario=usuario_object,
                    access_token=accessToken,
                    expires=expires,
                    userid=user_id,
                )
                userGoogle.save()
                usuario_object.tipo_usuario = userGoogle.id
                usuario_object.save()
                request.session['user'] = user
                Sesion['estado'] = True
    #Logeo con Twitter
    elif 'oauth_token' in request.GET:
        twitter = Twitter()
        twitter.verify(request)
        user = twitter.get_user_data(request)
        request.session['user'] = user
        request.session.set_expiry(3600)
        request.session.modified = True
        Sesion['estado'] = True
        return HttpResponse('<script>window.history.go(-3)</script>')

    #Logeo con Facebook
    elif 'code' in request.GET:
        args = {
            'client_id': settings.FACEBOOK_APP_ID,
            #'redirect_uri': "http://" + request.META['HTTP_HOST'] + request.META['PATH_INFO'] + "?name=" +
            #                request.GET["name"] + "&auth_code=" + request.GET["auth_code"],
            'redirect_uri': settings.FACEBOOK_REDIRECT_URI,
            'client_secret': settings.FACEBOOK_APP_SECRET,
            'code': request.GET.get('code')
        }
        url = 'https://graph.facebook.com/oauth/access_token?' + \
              urllib.urlencode(args)
        response = urlparse.parse_qs(urllib.urlopen(url).read())
        access_token = response['access_token'][0]
        expires = response['expires'][0]
        face = Facebook()
        user_face = face.authenticate(access_token, None, expires)
        Sesion['estado'] = True
        request.session['user'] = user_face
        request.session.set_expiry(3600)
        request.session.modified = True
        return HttpResponse('<script>window.history.go(-3)</script>')
    #Logeo nativo
    elif request.POST:
        username = request.POST.get('user_email')
        password = request.POST.get('user_password')
        user = authenticate(username=username, password=password)
        dict_response = {}
        if user is not None:
            if user.is_active:
                login(request, user)
                request.session["user"] = user.username
                Sesion['estado'] = True
                dict_response['state'] = True
                return HttpResponse(simplejson.dumps(dict_response))
            else:
                dict_response['msg'] = "User is not active, you need to activate your account"
                dict_response['state'] = False
                return HttpResponse(simplejson.dumps(dict_response))
                # Return a 'disabled account' error message
        else:
            #No hay concordancia entre user y password
            dict_response['msg'] = "The email and/or the password were incorrect"
            dict_response['state'] = False
            return HttpResponse(simplejson.dumps(dict_response))

    return render_to_response(
        "login-user.html",
        {
            'communities': Community.objects.all(),
        },
        context_instance=RequestContext(request)
    )


def getSessionTwitter(request):
    twitter = Twitter()
    response = twitter.get_authorization_url()
    cad = response.split("=")
    dato = cad[len(cad) - 1]
    dictionary = {}
    dictionary['datos'] = dato
    return HttpResponse(simplejson.dumps(dictionary))


def getSessionFacebook(request):
    facebook = Facebook()
    response = facebook.refresh_token()
    dictionary = {}
    dictionary['datos'] = response
    return HttpResponse(simplejson.dumps(dictionary))


def endSession(request):
    try:
        del request.session['user']
    except KeyError:
        pass
    return HttpResponseRedirect(reverse('/'))


@csrf_exempt
def RegisterUser(request):
    if request.POST:
        dictionary = {}
        try:
            user = Usuario.objects.get(user__username=request.POST.get('user_email'))
            dictionary['state'] = False
            dictionary['msg'] = "This email is already been used, try with other"
            return HttpResponse(simplejson.dumps(dictionary))
        except Usuario.DoesNotExist:
            email = request.POST.get('user_email')
            user = User.objects.create_user(email, email, request.POST.get("user_password"))
            user.is_active = False
            user.save()
            userNativo = Usuario()
            userNativo.user = user
            userNativo.save()
            usertipo = TipoUsuario(
                usuario = userNativo,
                access_token=email,
                expires=3600,
                userid=email,
                session_key=hashlib.md5(email)
            )
            usertipo.save()
            html_user = loader.get_template("/home/detourmaps/community/templates/registration.html")
            context_user = Context({'link': 'www.facebook.com'})
            subject_user, from_user, to_user = 'Registration DetourMaps', 'Detour Maps <info@detourmaps.com>', user.email
            user_context_html = html_user.render(context_user)
            message_user = EmailMessage(subject_user, user_context_html, from_user, [to_user])
            message_user.content_subtype = "html"
            message_user.send()
            dictionary['state'] = True
            dictionary['msg'] = "Now activate your account, and you're ready to go!!!"
            return HttpResponse(simplejson.dumps(dictionary))

    return render_to_response(
        "register-user.html",
        {
            'communities': Community.objects.all(),
        },
        context_instance=RequestContext(request)
    )


@csrf_exempt
#@login_required(login_url='/community/loginUser/')
def profile_user(request):
    if request.session.get("user"):
        username = request.session['user']
        userAccount = User.objects.get(username=username)
        email = userAccount.username
        password = userAccount.password

        dictionary = {}

        if request.POST:
            oldpassword = request.POST.get('oldPassword')
            newpassword = request.POST.get('newPassword')
            newemail = request.POST.get('newEmail')

            user = User.objects.get(username=email)

            if newpassword == "":
                user.email = newemail
                user.username = newemail
            else:
                if user.check_password(oldpassword):
                    if newemail == "":
                        user.set_password(newpassword)
                    elif newemail != "" and newpassword != "":
                        user.set_password(newpassword)
                        user.username = newemail
                        user.email = newemail
                else:
                    dictionary['state'] = False
                    dictionary['msg'] = 'The original password is wrong'
                    return HttpResponse(simplejson.dumps(dictionary))
            user.save()
            dictionary['state'] = True
            return HttpResponse(simplejson.dumps(dictionary))
        return render_to_response("account-settings.html", {'user': userAccount, 'community': Community.objects.all()},
                                  context_instance=RequestContext(request))
    else:
        return Http404


@csrf_exempt
#@login_required(login_url='/community/loginUser/')
def AccountSettings(request):
    if request.session.get("user"):
        username = request.session['user']
        userAccount = User.objects.get(username=username)
        email = userAccount.username
        password = userAccount.password

        dictionary = {}

        if request.POST:
            oldpassword = request.POST.get('oldPassword')
            newpassword = request.POST.get('newPassword')
            newemail = request.POST.get('newEmail')

            user = User.objects.get(username=email)

            if newpassword == "":
                user.email = newemail
                user.username = newemail
            else:
                if user.check_password(oldpassword):
                    if newemail == "":
                        user.set_password(newpassword)
                    elif newemail != "" and newpassword != "":
                        user.set_password(newpassword)
                        user.username = newemail
                        user.email = newemail
                else:
                    dictionary['state'] = False
                    dictionary['msg'] = 'The original password is wrong'
                    return HttpResponse(simplejson.dumps(dictionary))
            user.save()
            dictionary['state'] = True
            return HttpResponse(simplejson.dumps(dictionary))
        return render_to_response("dashboard/home.html", {'user': userAccount, 'community': Community.objects.all()},
                                  context_instance=RequestContext(request))
    else:
        return Http404


def settings_deals(request):
    if request.session.get("user"):
        username = request.session['user']
        userAccount = User.objects.get(username=username)
        return render_to_response(
            "dashboard/mydeals.html",
            {
                'user': userAccount,
                'community': Community.objects.all()
            },
            context_instance=RequestContext(request))
    else:
        return Http404


def settings_visits(request):
    if request.session.get("user"):
        username = request.session['user']
        userAccount = User.objects.get(username=username)
        return render_to_response(
            "dashboard/visits_list.html",
            {
                'user': userAccount,
                'community': Community.objects.all()
            },
            context_instance=RequestContext(request))
    else:
        return Http404


def settings_favorites(request):
    if request.session.get("user"):
        username = request.session['user']
        userAccount = User.objects.get(username=username)
        return render_to_response(
            "dashboard/favorites.html",
            {
                'user': userAccount,
                'community': Community.objects.all()
            },
            context_instance=RequestContext(request))
    else:
        return Http404


def settings_feedback(request):
    if request.session.get("user"):
        username = request.session['user']
        userAccount = User.objects.get(username=username)
        return render_to_response(
            "dashboard/feedback_form.html",
            {
                'user': userAccount,
                'community': Community.objects.all()
            },
            context_instance=RequestContext(request))
    else:
        return Http404


def join_us(request):
    return render_to_response(
        'join_us.html',
        {
            'communities': Community.objects.all(),
        },
        context_instance=RequestContext(request)
    )


def printed_maps(request):
    return render_to_response(
        'printed_maps.html',
        {
            'communities': Community.objects.all(),
        },
        context_instance=RequestContext(request)
    )


def printed_maps_new(request):
    return render_to_response(
        'printed-map.html',
        {},
        context_instance=RequestContext(request)
    )


def savings_card(request):
    return render_to_response(
        'savings-card.html',
        {},
        context_instance=RequestContext(request)
    )


def business_card(request, name=None):
    return render_to_response(
        'business-card.html',
        {
            'name': name
        },
        context_instance=RequestContext(request)
    )


def offline(request):
    return render_to_response(
        'offline.html',
        {
            'categories': Category.objects.all()
        },
        context_instance=RequestContext(request)
    )


def number_landing_to_community(request):
    phone_landing = PhoneNumber.objects.all()
    for i in phone_landing:
        new_phone = PNumber(
            text=i.text,
            landing_page=i.landing_page.community
        )
        new_phone.save()
    return HttpResponse("OK, The change was made!")


def inline_landing_to_community(request):
    social_objects = LandingSocial.objects.all()
    header_objects = HeaderPage.objects.all()
    text_objects = LandingText.objects.all()
    video_objects = WVideo.objects.all()
    for i in social_objects:
        new_social = CommunitySocial(
            type_social=i.type_social,
            url=i.url,
            community=i.landing_page.community
        )
        new_social.save()
    for j in header_objects:
        new_header = HeaderCommunity(
            caption=j.caption,
            image=j.image,
            community=j.landing_page.community
        )
        new_header.save()
    for k in text_objects:
        new_text = CommunityText(
            image=k.image,
            title=k.title,
            text=k.text,
            community=k.landing_page.community
        )
        new_text.save()
    for l in video_objects:
        new_video = Video(
            url_video=l.url_video,
            text=l.text,
            community=l.landing_page.community
        )
        new_video.save()
    return HttpResponse("Back Up was made!")


def handler404(request):
    response = render_to_response('404.html', {},
                                  context_instance=RequestContext(request))
    response.status_code = 404
    return response


def handler500(request):
    response = render_to_response('500.html', {},
                                  context_instance=RequestContext(request))
    response.status_code = 500
    return response


def category_json(request):
    categories_object = Category.objects.all().order_by('name')
    lista_categories = []
    for i in categories_object:
        dict_cat = {
            'id': i.id,
            'name': i.name
        }
        lista_categories.append(dict_cat)
    return HttpResponse(simplejson.dumps(lista_categories))


def community_json(request):
    community_object = Community.objects.filter(active=True).order_by('name')
    lista_communities = []
    for i in community_object:
        dict_community = {
            'id': i.id,
            'name': i.name
        }
        lista_communities.append(dict_community)
    return HttpResponse(simplejson.dumps(lista_communities))


def business_json(request, page, slice):
    business_objects = Business.objects.all()[int(page):int(slice)]
    lista_business = []
    return_community = lambda biz_community: biz_community or ''
    return_category = lambda biz_category: biz_category or ''
    comm_id = ""
    cat_id = ""
    for i in business_objects:
        if i.community:
            comm_id = i.community.id
        if i.category:
            cat_id = i.category.id
        dict_business = {
            'id': i.id,
            'name': i.name,
            'url_name': i.get_absolute_url(),
            'local_deals': i.local_deals,
            'ten_off': i.ten_off,
            'smart_buys': i.smart_buys,
            'ten_visits': i.ten_visits,
            'refer_friends': i.refer_friends,
            'community': comm_id,
            'category': cat_id,
            'description': force_unicode(i.description)
        }
        lista_business.append(dict_business)
    return HttpResponse(simplejson.dumps(lista_business))


@csrf_exempt
def business_one_json(request):
    if request.method == "GET":
        dict_business = None
        menu = None
        coupon = None
        dict_coupon = {}
        user = False
        if "biz_code" in request.GET:
            business_object = Business.objects.get(pk=decode_url(request.GET["biz_code"]))
            avg = qualify(business_object)
            ten_visits = False
            smart_buys = False
            if request.session.get("user"):
                user = True
            if business_object.tenvisitsbusiness_set.all().count() > 0:
                ten_visits = get_thumbnail_vists(business_object.tenvisitsbusiness_set.all()[0].image)
            if business_object.businessmenu_set.all().count() > 0:
                menu = business_object.businessmenu_set.all()[0].menu
            if business_object.cuponbusiness_set.filter(active=1).count() > 0:
                coupon = business_object.cuponbusiness_set.filter(active=True)[0]
                return_date_coupon = lambda date_coupon: date_coupon or ''
                dict_coupon['img'] = force_unicode(coupon.coupon)
                dict_coupon['start'] = force_unicode(return_date_coupon(coupon.start_date.strftime('%Y-%m-%d')))
                dict_coupon['end'] = force_unicode(return_date_coupon(coupon.end_date.strftime('%Y-%m-%d')))
                dict_coupon['until'] = force_unicode(return_date_coupon(coupon.end_date.strftime('%m-%d-%Y')))
                dict_coupon['id'] = coupon.id
                dict_coupon['name'] = coupon.name
                smart_buys = True
            hasSubscription = getSuscription(business_object)
            if not business_object.EntryDetails():
                dict_business = {
                    'id': business_object.id,
                    'name': business_object.name,
                    'url_name': business_object.get_absolute_url(),
                    'slug': business_object.url_name,
                    'code': business_object.getUniqueCode(),
                    'description': force_unicode(business_object.description),
                    'url': force_unicode(business_object.get_absolute_url()),
                    'geo': force_unicode(business_object.geo), # paso del geo a la vista en json
                    'address': business_object.address,
                    'phones': business_object.phones,
                    'site': business_object.site,
                    'email': business_object.email,
                    'facebook': business_object.facebook,
                    'twitter': business_object.twitter,
                    'enable_comments': business_object.enable_comments,
                    'avg': avg,
                    #'vote':hasVote,
                    'logo': force_unicode(business_object.logo),
                    'video': '',
                    'video_title': '',
                    'ten_visit': business_object.ten_visits,
                    'video_description': business_object.video_description,
                    'subscription': hasSubscription,
                    'deals': get_deals(business_object),
                    'community': business_object.community.url_name,
                    'partner': get_partner(business_object),
                    'refer_friends': business_object.refer_friends,
                    'menu': force_unicode(menu),
                    'coupon': dict_coupon,
                    'smart_buys': smart_buys,
                    'refer_friends': business_object.refer_friends,
                    'user': user
                }
                lista_tag_services = []
                lista_images_business = []
                lista_cupon_business = []
                list_business_event = []
                for tag in business_object.tag_service.all():
                    lista_tag_services.append(str(tag.name))
                image_business_object = ImageBusiness.objects.filter(business=business_object)
                for img in image_business_object:
                    thumbnailer = get_thumbnailer(img.img)
                    thumb = thumbnailer.get_thumbnail({'size': (617, 319), 'crop': True})
                    thumb = thumbnailer.get_thumbnail_name({'size': (617, 319), 'crop': True})
                    dictionary_image_business = {
                        'name': img.name,
                        'img': thumb
                    }
                    lista_images_business.append(dictionary_image_business)

                cupon_business_object = CuponBusiness.objects.filter(business=business_object, active=1)
                for img in cupon_business_object:
                    thumbnailer = get_thumbnailer(img.coupon)
                    thumb = thumbnailer.get_thumbnail({'size': (420, 200), 'crop': True})
                    thumb = thumbnailer.get_thumbnail_name({'size': (420, 200), 'crop': True})
                    medium_thumb = thumbnailer.get_thumbnail({'size': (720, 400), 'crop': True})
                    medium_thumb = thumbnailer.get_thumbnail_name({'size': (720, 400), 'crop': True})
                    small_thumb = thumbnailer.get_thumbnail({'size': (280, 120), 'crop': True})
                    small_thumb = thumbnailer.get_thumbnail_name({'size': (280, 120), 'crop': True})
                    dictionary_cupon_business = {
                        'id': img.id,
                        'name': img.name,
                        'img': thumb,
                        'medium': medium_thumb,
                        'small': small_thumb,
                        'start_date': img.start_date.strftime('%m/%d/%Y'),
                        'end_date': img.end_date.strftime('%m/%d/%Y')
                    }
                    lista_cupon_business.append(dictionary_cupon_business)
                business_events = BusinessEvent.objects.filter(business__id=business_object.id, active=True).filter(date_end__gte=datetime.datetime.now().date())
                for evt in business_events:
                    img_business_event = ImageBusinessEvents.objects.filter(business_event=evt)
                    list_img_business_event = []
                    return_date = lambda date_evt: date_evt or ''
                    for img_evt in img_business_event:
                        thumbn = get_thumbnailer(img_evt.img)
                        thumb = thumbn.get_thumbnail({'size': (215, 215), 'crop': True})
                        thumb = thumbn.get_thumbnail_name({'size': (215, 215), 'crop': True})
                        dictionary_image_business_event = {
                            'name': img_evt.name,
                            'img': settings.MEDIA_URL + thumb
                        }
                        list_img_business_event.append(dictionary_image_business_event)
                    if evt.date_end:
                        list_business_event.append({
                            'id': business_object.id,
                            'unique': base64.urlsafe_b64encode(str(evt.id)),
                            'name': business_object.name,
                            'title': evt.title,
                            'description': evt.description,
                            'facebook': evt.facebook,
                            'twitter': evt.twitter,
                            'google_plus': evt.google_plus,
                            'images': list_img_business_event,
                            'date': {
                                'str': force_unicode(return_date(evt.date_begin.strftime('%B %d'))),
                                'start': force_unicode(return_date(evt.date_begin.strftime('%Y-%m-%d'))),
                                'end': force_unicode(return_date(evt.date_end.strftime('%Y-%m-%d'))),
                                'day': force_unicode(return_date(evt.date_begin.strftime('%d'))),
                                'month': force_unicode(return_date(evt.date_begin.strftime('%m'))),
                                'year': force_unicode(return_date(evt.date_begin.strftime('%Y'))),
                            },
                            'geo': force_unicode(evt.geo),
                            'address': evt.address,
                            'url': "event/" + base64.urlsafe_b64encode(str(evt.id)),
                            'images': list_img_business_event
                        })
                    else:
                        list_business_event.append({
                            'id': business_object.id,
                            'unique': base64.urlsafe_b64encode(str(evt.id)),
                            'name': business_object.name,
                            'title': evt.title,
                            'description': evt.description,
                            'facebook': evt.facebook,
                            'twitter': evt.twitter,
                            'google_plus': evt.google_plus,
                            'images': list_img_business_event,
                            'date': {
                                'str': force_unicode(return_date(evt.date_begin.strftime('%B %d'))),
                                'start': force_unicode(return_date(evt.date_begin.strftime('%Y-%m-%d'))),
                                'end': '',
                                'day': force_unicode(return_date(evt.date_begin.strftime('%d'))),
                                'month': force_unicode(return_date(evt.date_begin.strftime('%m'))),
                                'year': force_unicode(return_date(evt.date_begin.strftime('%Y'))),
                            },
                            'geo': force_unicode(evt.geo),
                            'address': evt.address,
                            'url': "event/" + base64.urlsafe_b64encode(str(evt.id)),
                            'images': list_img_business_event
                        })
                dict_business['img'] = lista_images_business
                dict_business['cupon'] = lista_cupon_business
                dict_business['tags'] = lista_tag_services
                dict_business['events'] = list_business_event
            else:
                entryDetails = business_object.EntryDetails()
                dict_business = {
                    'id': business_object.id,
                    'name': business_object.name,
                    'url_name': business_object.get_absolute_url(),
                    'slug': business_object.url_name,
                    'code': business_object.getUniqueCode(),
                    'description': force_unicode(business_object.description),
                    'url': force_unicode(business_object.get_absolute_url()),
                    'geo': force_unicode(business_object.geo), # paso del geo a la vista en json
                    'address': business_object.address,
                    'phones': business_object.phones,
                    'site': business_object.site,
                    'email': business_object.email,
                    'facebook': business_object.facebook,
                    'twitter': business_object.twitter,
                    'video': business_object.parseId(),
                    'video_title': entryDetails.title.text,
                    'ten_visit': business_object.ten_visits,
                    'video_img_0': entryDetails.media.thumbnail[1].url,
                    'video_img_1': entryDetails.media.thumbnail[2].url,
                    'video_img_2': entryDetails.media.thumbnail[3].url,
                    'video_description': business_object.video_description,
                    'subscription': hasSubscription,
                    'deals': get_deals(business_object),
                    'community': business_object.community.url_name,
                    'partner': get_partner(business_object),
                    'refer_friends': business_object.refer_friends,
                    'menu': force_unicode(menu),
                    'coupon': dict_coupon,
                    'smart_buys': smart_buys,
                    'refer_friends': business_object.refer_friends,
                    'user': user
                }
                lista_tag_services = []
                lista_images_business = []
                lista_cupon_business = []
                list_business_event = []
                for tag in business_object.tag_service.all():
                    lista_tag_services.append(str(tag.name))
                image_business_object = ImageBusiness.objects.filter(business=business_object)
                for img in image_business_object:
                    thumbnailer = get_thumbnailer(img.img)
                    thumb = thumbnailer.get_thumbnail({'size': (617, 319), 'crop': True})
                    thumb = thumbnailer.get_thumbnail_name({'size': (617, 319), 'crop': True})
                    dictionary_image_business = {
                        'name': img.name,
                        'img': thumb
                    }
                    lista_images_business.append(dictionary_image_business)

                cupon_business_object = CuponBusiness.objects.filter(business=business_object, active=1)
                for img in cupon_business_object:
                    thumbnailer = get_thumbnailer(img.coupon)
                    thumb = thumbnailer.get_thumbnail({'size': (420, 200), 'crop': True})
                    thumb = thumbnailer.get_thumbnail_name({'size': (420, 200), 'crop': True})
                    medium_thumb = thumbnailer.get_thumbnail({'size': (720, 400), 'crop': True})
                    medium_thumb = thumbnailer.get_thumbnail_name({'size': (720, 400), 'crop': True})
                    small_thumb = thumbnailer.get_thumbnail({'size': (280, 120), 'crop': True})
                    small_thumb = thumbnailer.get_thumbnail_name({'size': (280, 120), 'crop': True})
                    dictionary_cupon_business = {
                        'id': img.id,
                        'name': img.name,
                        'img': thumb,
                        'medium': medium_thumb,
                        'small': small_thumb,
                        'start_date': img.start_date.strftime('%m/%d/%Y'),
                        'end_date': img.end_date.strftime('%m/%d/%Y')
                    }
                    lista_cupon_business.append(dictionary_cupon_business)
                business_events = BusinessEvent.objects.filter(business__id=business_object.id, active=True).filter(date_end__gte=datetime.datetime.now().date())
                for evt in business_events:
                    img_business_event = ImageBusinessEvents.objects.filter(business_event=evt)
                    list_img_business_event = []
                    return_date = lambda date_evt: date_evt or ''
                    for img_evt in img_business_event:
                        thumbn = get_thumbnailer(img_evt.img)
                        thumb = thumbn.get_thumbnail({'size': (215, 215), 'crop': True})
                        thumb = thumbn.get_thumbnail_name({'size': (215, 215), 'crop': True})
                        dictionary_image_business_event = {
                            'name': img_evt.name,
                            'img': settings.MEDIA_URL + thumb
                        }
                        list_img_business_event.append(dictionary_image_business_event)
                    if evt.date_end:
                        list_business_event.append({
                            'id': business_object.id,
                            'unique': base64.urlsafe_b64encode(str(evt.id)),
                            'name': business_object.name,
                            'title': evt.title,
                            'description': evt.description,
                            'facebook': evt.facebook,
                            'twitter': evt.twitter,
                            'google_plus': evt.google_plus,
                            'images': list_img_business_event,
                            'date': {
                                'str': force_unicode(return_date(evt.date_begin.strftime('%B %d'))),
                                'start': force_unicode(return_date(evt.date_begin.strftime('%Y-%m-%d'))),
                                'end': force_unicode(return_date(evt.date_end.strftime('%Y-%m-%d'))),
                                'day': force_unicode(return_date(evt.date_begin.strftime('%d'))),
                                'month': force_unicode(return_date(evt.date_begin.strftime('%m'))),
                                'year': force_unicode(return_date(evt.date_begin.strftime('%Y'))),
                            },
                            'geo': force_unicode(evt.geo),
                            'address': evt.address,
                            'url': "event/" + base64.urlsafe_b64encode(str(evt.id)),
                            'images': list_img_business_event
                        })
                    else:
                        list_business_event.append({
                            'id': business_object.id,
                            'unique': base64.urlsafe_b64encode(str(evt.id)),
                            'name': business_object.name,
                            'title': evt.title,
                            'description': evt.description,
                            'facebook': evt.facebook,
                            'twitter': evt.twitter,
                            'google_plus': evt.google_plus,
                            'images': list_img_business_event,
                            'date': {
                                'str': force_unicode(return_date(evt.date_begin.strftime('%B %d'))),
                                'start': force_unicode(return_date(evt.date_begin.strftime('%Y-%m-%d'))),
                                'end': '',
                                'day': force_unicode(return_date(evt.date_begin.strftime('%d'))),
                                'month': force_unicode(return_date(evt.date_begin.strftime('%m'))),
                                'year': force_unicode(return_date(evt.date_begin.strftime('%Y'))),
                            },
                            'geo': force_unicode(evt.geo),
                            'address': evt.address,
                            'url': "event/" + base64.urlsafe_b64encode(str(evt.id)),
                            'images': list_img_business_event
                        })
                dict_business['img'] = lista_images_business
                dict_business['cupon'] = lista_cupon_business
                dict_business['tags'] = lista_tag_services
                dict_business['events'] = list_business_event
        return HttpResponse(simplejson.dumps(dict_business))


@csrf_exempt
def all_business_json(request):
    community_object = Community.objects.filter(active=True).order_by('name')
    lista_communities = []
    for i in community_object:
        dict_community = {
            'id': i.id,
            'name': i.name
        }
        lista_communities.append(dict_community)#communities
    categories_object = Category.objects.all().order_by('name')
    lista_categories = []
    for i in categories_object:
        dict_cat = {
            'id': i.id,
            'name': i.name
        }
        lista_categories.append(dict_cat)#categories
    business_objects = Business.objects.all().order_by('local_deals', 'ten_visits', 'refer_friends')
    lista_business = []
    return_community = lambda biz_community: biz_community or ''
    return_category = lambda biz_category: biz_category or ''
    comm_id = ""
    cat = ""
    comm_name = ""
    image = ""
    for i in business_objects:
        ten_off = False
        smart_buys = False
        if i.community:
            comm_id = i.community.id
            comm_name = i.community.name
        if i.category: cat = i.category.name
        if i.imagebusiness_set.all().count() > 0:
            thumbnailer = get_thumbnailer(i.imagebusiness_set.all()[0].img)
            image = thumbnailer.get_thumbnail({'size': (300, 150), 'crop': True})
            image = thumbnailer.get_thumbnail_name({'size': (300, 150), 'crop': True})
        else:
            thumbnailer = get_thumbnailer("newOrange.png")
            image = thumbnailer.get_thumbnail({'size': (300, 150), 'crop': True})
            image = thumbnailer.get_thumbnail_name({'size': (300, 150), 'crop': True})
        local_deals = {}
        if i.cuponbusiness_set.filter(active=1).count() > 0:
            smart_buys = True
        if i.local_deals == "T":
            local_deals["msg"] = "$10 Savings Card"
            local_deals["icon"] = "icon-yellow.png"
            local_deals["none"] = False
            ten_off = True
        elif i.local_deals == "F":
            local_deals["msg"] = "$10 Savings Card"
            local_deals["icon"] = "icon-red.png"
            local_deals["none"] = False
            ten_off = True
        elif i.local_deals == "Q":
            local_deals["msg"] = "$10 Savings Card"
            local_deals["icon"] = "icon-sky.png"
            local_deals["none"] = False
            ten_off = True
        else:
            local_deals["none"] = True
            ten_off = False
        dict_business = {
            'id': i.id,
            'name': i.name,
            'url_name': i.get_absolute_url(),
            'slug': i.url_name,
            'code': i.getUniqueCode(),
            'local_deals': local_deals,
            'ten_off': ten_off,
            'smart_buys': smart_buys,
            'ten_visits': i.ten_visits,
            'refer_friends': i.refer_friends,
            'community': comm_id,
            'community_name': comm_name,
            'category': cat,
            'description': force_unicode(i.description),
            'image': force_unicode(image),
            'url': force_unicode(i.get_absolute_url()),
            'geo': force_unicode(i.geo), # paso del geo a la vista en json
            'address': i.address
        }
        lista_business.append(dict_business)
    biz = Business.objects.filter(Q(local_deals='T') | Q(local_deals="Q") | Q(local_deals='F') | Q(ten_visits=1)| Q(refer_friends=1)).order_by("?")[0]
    comm_biz_id = ""
    comm_biz_name = ""
    cat_biz_id = ""
    image_biz = ""
    smart_biz = False
    if biz.cuponbusiness_set.filter(active=1).count() > 0:
        smart_biz = True
    if biz.community:
        comm_biz_id = biz.community.id
        comm_biz_name = biz.community.name
        if biz.category: cat_biz_id = biz.category.id
        if biz.imagebusiness_set.all().count() > 0:
            thumbnailer = get_thumbnailer(biz.imagebusiness_set.all()[0].img)
            image_biz = thumbnailer.get_thumbnail({'size': (800, 180), 'crop': True})
            image_biz = thumbnailer.get_thumbnail_name({'size': (800, 180), 'crop': True})
        else:
            image_biz = ""
        local_deals_biz = {}
        if biz.local_deals == "T":
            local_deals_biz["msg"] = "$10 Savings Card"
            local_deals_biz["icon"] = "icon-yellow.png"
            local_deals_biz["none"] = False
        elif biz.local_deals == "F":
            local_deals_biz["msg"] = "$10 Savings Card"
            local_deals_biz["icon"] = "icon-red.png"
            local_deals_biz["none"] = False
        elif biz.local_deals == "Q":
            local_deals_biz["msg"] = "$10 Savings Card"
            local_deals_biz["icon"] = "icon-sky.png"
            local_deals_biz["none"] = False
        else:
            local_deals_biz["none"] = True
        dict_biz = {
            'id': biz.id,
            'name': biz.name,
            'url_name': biz.get_absolute_url(),
            'local_deals': local_deals_biz,
            'ten_off': True,
            'smart_buys': smart_biz,
            'ten_visits': biz.ten_visits,
            'refer_friends': biz.refer_friends,
            'community': comm_biz_id,
            'community_name': comm_biz_name,
            'category': cat_biz_id,
            'description': force_unicode(biz.description),
            'image': force_unicode(image_biz),
            'url': force_unicode(biz.get_absolute_url())
        }
    dict_super_dupper = {
        'communities': lista_communities,
        'categories': lista_categories,
        'businesses': lista_business,
        'business': dict_biz
    }
    return HttpResponse(simplejson.dumps(dict_super_dupper))


def business_community_json(request):
    categories_object = Category.objects.all().order_by('name')
    lista_categories = []
    for i in categories_object:
        dict_cat = {
            'id': i.id,
            'name': i.name
        }
        lista_categories.append(dict_cat)#categories
    business_objects = Business.objects.filter(community__url_name=request.GET["name"]).order_by('name')
    lista_business = []
    return_community = lambda biz_community: biz_community or ''
    return_category = lambda biz_category: biz_category or ''
    comm_id = ""
    cat_id = ""
    comm_name = ""
    image = ""
    ten_off = False
    smart_buys = False
    for i in business_objects:
        if i.community:
            comm_id = i.community.id
            comm_name = i.community.name
        if i.category: cat_id = i.category.id
        if i.imagebusiness_set.all().count() > 0:
            thumbnailer = get_thumbnailer(i.imagebusiness_set.all()[0].img)
            image = thumbnailer.get_thumbnail({'size': (300, 150), 'crop': True})
            image = thumbnailer.get_thumbnail_name({'size': (300, 150), 'crop': True})
        else:
            thumbnailer = get_thumbnailer("Detour_placement_logo.jpg")
            image = thumbnailer.get_thumbnail({'size': (300, 150), 'crop': True})
            image = thumbnailer.get_thumbnail_name({'size': (300, 150), 'crop': True})
        local_deals = {}
        if i.cuponbusiness_set.filter(active=1).count() > 0:
            smart_buys = True
        if i.local_deals == "T":
            local_deals["msg"] = "$10 Savings Card"
            local_deals["icon"] = "icon-yellow.png"
            local_deals["none"] = False
            ten_off = True
        elif i.local_deals == "F":
            local_deals["msg"] = "$10 Savings Card"
            local_deals["icon"] = "icon-red.png"
            local_deals["none"] = False
            ten_off = True
        elif i.local_deals == "Q":
            local_deals["msg"] = "$10 Savings Card"
            local_deals["icon"] = "icon-sky.png"
            local_deals["none"] = False
            ten_off = True
        else:
            local_deals["none"] = True
            ten_off = False
        dict_business = {
            'id': i.id,
            'name': i.name,
            'url_name': i.get_absolute_url(),
            'local_deals': local_deals,
            'ten_off': ten_off,
            'smart_buys': smart_buys,
            'ten_visits': i.ten_visits,
            'refer_friends': i.refer_friends,
            'community': comm_id,
            'community_name': comm_name,
            'category': cat_id,
            'description': force_unicode(i.description),
            'image': force_unicode(image),
            'url': force_unicode(i.get_absolute_url())
        }
        lista_business.append(dict_business)
    #biz = business_objects.filter(Q(local_deals='T') | Q(local_deals="Q") | Q(local_deals='F') | Q(ten_visits=1)| Q(refer_friends=1)).order_by("?")[0]
    biz = business_objects.filter(community__url_name=request.GET["name"]).order_by("?")[0]
    comm_biz_id = ""
    comm_biz_name = ""
    cat_biz_id = ""
    image_biz = ""
    smart_biz = False
    if biz.cuponbusiness_set.filter(active=1).count() > 0:
        smart_biz = True
    if biz.community:
        comm_biz_id = biz.community.id
        comm_biz_name = biz.community.name
        if biz.category: cat_biz_id = biz.category.id
        if biz.imagebusiness_set.all().count() > 0:
            thumbnailer = get_thumbnailer(biz.imagebusiness_set.all()[0].img)
            image_biz = thumbnailer.get_thumbnail({'size': (800, 180), 'crop': True})
            image_biz = thumbnailer.get_thumbnail_name({'size': (800, 180), 'crop': True})
        else:
            image_biz = ""
        local_deals_biz = {}
        if biz.local_deals == "T":
            local_deals_biz["msg"] = "$10 Savings Card"
            local_deals_biz["icon"] = "icon-yellow.png"
            local_deals_biz["none"] = False
        elif biz.local_deals == "F":
            local_deals_biz["msg"] = "$10 Savings Card"
            local_deals_biz["icon"] = "icon-red.png"
            local_deals_biz["none"] = False
        elif biz.local_deals == "Q":
            local_deals_biz["msg"] = "$10 Savings Card"
            local_deals_biz["icon"] = "icon-sky.png"
            local_deals_biz["none"] = False
        else:
            local_deals_biz["none"] = True
        dict_biz = {
            'id': biz.id,
            'name': biz.name,
            'url_name': biz.get_absolute_url(),
            'local_deals': local_deals_biz,
            'ten_off': True,
            'smart_buys': smart_biz,
            'ten_visits': biz.ten_visits,
            'refer_friends': biz.refer_friends,
            'community': comm_biz_id,
            'community_name': comm_biz_name,
            'category': cat_biz_id,
            'description': force_unicode(biz.description),
            'image': force_unicode(image_biz),
            'url': force_unicode(biz.get_absolute_url())
        }
    dict_super_dupper = {
        'categories': lista_categories,
        'businesses': lista_business,
        'business': dict_biz
    }
    return HttpResponse(simplejson.dumps(dict_super_dupper))


def all_business_community_json(request, url_name):
    categories_object = Category.objects.all().order_by('name')
    lista_categories = []
    for i in categories_object:
        dict_cat = {
            'id': i.id,
            'name': i.name
        }
        lista_categories.append(dict_cat)#categories
    business_objects = Business.objects.filter(community__url_name=url_name).order_by('name')
    lista_business = []
    return_community = lambda biz_community: biz_community or ''
    return_category = lambda biz_category: biz_category or ''
    comm_id = ""
    cat_id = ""
    comm_name = ""
    image = ""
    ten_off = False
    smart_buys = False
    for i in business_objects:
        if i.community:
            comm_id = i.community.id
            comm_name = i.community.name
        if i.category: cat_id = i.category.id
        if i.imagebusiness_set.all().count() > 0:
            thumbnailer = get_thumbnailer(i.imagebusiness_set.all()[0].img)
            image = thumbnailer.get_thumbnail({'size': (300, 150), 'crop': True})
            image = thumbnailer.get_thumbnail_name({'size': (300, 150), 'crop': True})
        else:
            thumbnailer = get_thumbnailer("Detour_placement_logo.jpg")
            image = thumbnailer.get_thumbnail({'size': (300, 150), 'crop': True})
            image = thumbnailer.get_thumbnail_name({'size': (300, 150), 'crop': True})
        local_deals = {}
        if i.cuponbusiness_set.filter(active=1).count() > 0:
            smart_buys = True
        if i.local_deals == "T":
            local_deals["msg"] = "$10 Savings Card"
            local_deals["icon"] = "icon-yellow.png"
            local_deals["none"] = False
            ten_off = True
        elif i.local_deals == "F":
            local_deals["msg"] = "$10 Savings Card"
            local_deals["icon"] = "icon-red.png"
            local_deals["none"] = False
            ten_off = True
        elif i.local_deals == "Q":
            local_deals["msg"] = "$10 Savings Card"
            local_deals["icon"] = "icon-sky.png"
            local_deals["none"] = False
            ten_off = True
        else:
            local_deals["none"] = True
            ten_off = False
        dict_business = {
            'id': i.id,
            'name': i.name,
            'url_name': i.get_absolute_url(),
            'local_deals': local_deals,
            'ten_off': ten_off,
            'smart_buys': smart_buys,
            'ten_visits': i.ten_visits,
            'refer_friends': i.refer_friends,
            'community': comm_id,
            'community_name': comm_name,
            'category': cat_id,
            'description': force_unicode(i.description),
            'image': force_unicode(image),
            'url': force_unicode(i.get_absolute_url())
        }
        lista_business.append(dict_business)
    dict_super_dupper = {
        'categories': lista_categories,
        'businesses': lista_business,
    }
    return HttpResponse(simplejson.dumps(dict_super_dupper))


def all_business_deals_json(request):
    community_object = Community.objects.filter(active=True).order_by('name')
    lista_communities = []
    for i in community_object:
        dict_community = {
            'id': i.id,
            'name': i.name
        }
        lista_communities.append(dict_community)#communities
    categories_object = Category.objects.all().order_by('name')
    lista_categories = []
    for i in categories_object:
        dict_cat = {
            'id': i.id,
            'name': i.name
        }
        lista_categories.append(dict_cat)#categories
    business_objects = Business.objects.filter(Q(local_deals='T') | Q(local_deals="Q") | Q(local_deals='F') | Q(ten_visits=1)| Q(refer_friends=1))
    lista_business = []
    return_community = lambda biz_community: biz_community or ''
    return_category = lambda biz_category: biz_category or ''
    comm_id = ""
    cat_id = ""
    comm_name = ""
    image = ""
    smart = False
    for i in business_objects:
        if i.cuponbusiness_set.filter(active=1).count() > 0:
            smart = True
        if i.community:
            comm_id = i.community.id
            comm_name = i.community.name
        if i.category: cat_id = i.category.id
        if i.imagebusiness_set.all().count() > 0:
            thumbnailer = get_thumbnailer(i.imagebusiness_set.all()[0].img)
            image = thumbnailer.get_thumbnail({'size': (300, 150), 'crop': True})
            image = thumbnailer.get_thumbnail_name({'size': (300, 150), 'crop': True})
        else:
            thumbnailer = get_thumbnailer("Detour_placement_logo.jpg")
            image = thumbnailer.get_thumbnail({'size': (300, 150), 'crop': True})
            image = thumbnailer.get_thumbnail_name({'size': (300, 150), 'crop': True})
        local_deals = {}
        if i.local_deals == "T":
            local_deals["msg"] = "$10 Savings Card"
            local_deals["icon"] = "icon-yellow.png"
            local_deals["color"] = "FFF100"
            local_deals["none"] = False
        elif i.local_deals == "F":
            local_deals["msg"] = "$10 Savings Card"
            local_deals["icon"] = "icon-red.png"
            local_deals["color"] = "D71F26"
            local_deals["none"] = False
        elif i.local_deals == "Q":
            local_deals["msg"] = "$10 Savings Card"
            local_deals["icon"] = "icon-sky.png"
            local_deals["color"] = "00ADEE"
            local_deals["none"] = False
        else:
            local_deals["none"] = True
        dict_business = {
            'id': i.id,
            'name': i.name,
            'url_name': i.get_absolute_url(),
            'local_deals': local_deals,
            'ten_off': True,
            'smart_buys': smart,
            'ten_visits': i.ten_visits,
            'refer_friends': i.refer_friends,
            'community': comm_id,
            'community_name': comm_name,
            'category': cat_id,
            'description': force_unicode(i.description),
            'image': force_unicode(image),
            'url': force_unicode(i.get_absolute_url())
        }
        lista_business.append(dict_business)
    biz = Business.objects.filter(Q(local_deals='T') | Q(local_deals="Q") | Q(local_deals='F') | Q(ten_visits=1)| Q(refer_friends=1)).order_by("?")[0]
    comm_biz_id = ""
    comm_biz_name = ""
    cat_biz_id = ""
    image_biz = ""
    smart_biz = False
    if biz.cuponbusiness_set.filter(active=1).count() > 0:
        smart_biz = True
    if biz.community:
        comm_biz_id = biz.community.id
        comm_biz_name = biz.community.name
        if biz.category: cat_biz_id = biz.category.id
        if biz.imagebusiness_set.all().count() > 0:
            thumbnailer = get_thumbnailer(biz.imagebusiness_set.all()[0].img)
            image_biz = thumbnailer.get_thumbnail({'size': (800, 180), 'crop': 'smart'})
            image_biz = thumbnailer.get_thumbnail_name({'size': (800, 180), 'crop': 'smart'})
        else:
            image_biz = ""
        local_deals_biz = {}
        if biz.local_deals == "T":
            local_deals_biz["msg"] = "$10 Savings Card"
            local_deals_biz["icon"] = "icon-yellow.png"
            local_deals_biz["none"] = False
        elif biz.local_deals == "F":
            local_deals_biz["msg"] = "$10 Savings Card"
            local_deals_biz["icon"] = "icon-red.png"
            local_deals_biz["none"] = False
        elif biz.local_deals == "Q":
            local_deals_biz["msg"] = "$10 Savings Card"
            local_deals_biz["icon"] = "icon -sky.png"
            local_deals_biz["none"] = False
        else:
            local_deals_biz["none"] = True
        dict_biz = {
            'id': biz.id,
            'name': biz.name,
            'url_name': biz.get_absolute_url(),
            'local_deals': local_deals_biz,
            'ten_off': True,
            'smart_buys': smart_biz,
            'ten_visits': biz.ten_visits,
            'refer_friends': biz.refer_friends,
            'community': comm_biz_id,
            'community_name': comm_biz_name,
            'category': cat_biz_id,
            'description': force_unicode(biz.description),
            'image': force_unicode(image_biz),
            'url': force_unicode(biz.get_absolute_url())
        }
    dict_super_dupper = {
        'communities': lista_communities,
        'categories': lista_categories,
        'businesses': lista_business,
        'business': dict_biz
    }
    return HttpResponse(simplejson.dumps(dict_super_dupper))


def all_business_savings_json(request):
    community_object = Community.objects.filter(active=True).order_by('name')
    lista_communities = []
    for i in community_object:
        dict_community = {
            'id': i.id,
            'name': i.name
        }
        lista_communities.append(dict_community)#communities
    categories_object = Category.objects.all().order_by('name')
    lista_categories = []
    for i in categories_object:
        dict_cat = {
            'id': i.id,
            'name': i.name
        }
        lista_categories.append(dict_cat)#categories
    business_objects = Business.objects.filter(Q(local_deals='T') | Q(local_deals="Q") | Q(local_deals='F') | Q(ten_visits=1)| Q(refer_friends=1))
    lista_business = []
    return_community = lambda biz_community: biz_community or ''
    return_category = lambda biz_category: biz_category or ''
    comm_id = ""
    cat_id = ""
    cat_name = ""
    comm_name = ""
    image = ""
    smart = False
    for i in business_objects:
        if i.cuponbusiness_set.filter(active=1).count() > 0:
            smart = True
        if i.community:
            comm_id = i.community.id
            comm_name = i.community.name
        if i.category:
            cat_id = i.category.id
            cat_name = i.category.name
        if i.imagebusiness_set.all().count() > 0:
            thumbnailer = get_thumbnailer(i.imagebusiness_set.all()[0].img)
            image = thumbnailer.get_thumbnail({'size': (300, 150), 'crop': True})
            image = thumbnailer.get_thumbnail_name({'size': (300, 150), 'crop': True})
        else:
            thumbnailer = get_thumbnailer("Detour_placement_logo.jpg")
            image = thumbnailer.get_thumbnail({'size': (300, 150), 'crop': True})
            image = thumbnailer.get_thumbnail_name({'size': (300, 150), 'crop': True})
        local_deals = {}
        if i.local_deals == "T":
            local_deals["msg"] = "$10 Savings Card"
            local_deals["icon"] = "icon-yellow.png"
            local_deals["color"] = "FFF100"
            local_deals["none"] = False
        elif i.local_deals == "F":
            local_deals["msg"] = "$10 Savings Card"
            local_deals["icon"] = "icon-red.png"
            local_deals["color"] = "D71F26"
            local_deals["none"] = False
        elif i.local_deals == "Q":
            local_deals["msg"] = "$10 Savings Card"
            local_deals["icon"] = "icon-sky.png"
            local_deals["color"] = "00ADEE"
            local_deals["none"] = False
        else:
            local_deals["none"] = True
        dict_business = {
            'id': i.id,
            'name': i.name,
            'url_name': i.get_savings_url(),
            'local_deals': local_deals,
            'ten_off': True,
            'smart_buys': smart,
            'ten_visits': i.ten_visits,
            'refer_friends': i.refer_friends,
            'community': comm_id,
            'community_name': comm_name,
            'category': cat_id,
            'category_name': cat_name,
            'description': force_unicode(i.description),
            'image': force_unicode(image),
            'url': force_unicode(i.get_absolute_url())
        }
        lista_business.append(dict_business)
    biz = business_objects.all().order_by("?")[0]
    comm_biz_id = ""
    comm_biz_name = ""
    cat_biz_id = ""
    image_biz = ""
    smart_biz = False
    if biz.cuponbusiness_set.filter(active=1).count() > 0:
        smart_biz = True
    if biz.community:
        comm_biz_id = biz.community.id
        comm_biz_name = biz.community.name
        if biz.category: cat_biz_id = biz.category.id
        if biz.imagebusiness_set.all().count() > 0:
            thumbnailer = get_thumbnailer(biz.imagebusiness_set.all()[0].img)
            image_biz = thumbnailer.get_thumbnail({'size': (800, 180), 'crop': True})
            image_biz = thumbnailer.get_thumbnail_name({'size': (800, 180), 'crop': True})
        else:
            image_biz = ""
        local_deals_biz = {}
        if biz.local_deals == "T":
            local_deals_biz["msg"] = "$10 Savings Card"
            local_deals_biz["icon"] = "icon-yellow.png"
            local_deals_biz["none"] = False
        elif biz.local_deals == "F":
            local_deals_biz["msg"] = "$10 Savings Card"
            local_deals_biz["icon"] = "icon-red.png"
            local_deals_biz["none"] = False
        elif biz.local_deals == "Q":
            local_deals_biz["msg"] = "$10 Savings Card"
            local_deals_biz["icon"] = "icon-sky.png"
            local_deals_biz["none"] = False
        else:
            local_deals_biz["none"] = True
        dict_biz = {
            'id': biz.id,
            'name': biz.name,
            'url_name': biz.get_absolute_url(),
            'local_deals': local_deals_biz,
            'ten_off': True,
            'smart_buys': smart_biz,
            'ten_visits': biz.ten_visits,
            'refer_friends': biz.refer_friends,
            'community': comm_biz_id,
            'community_name': comm_biz_name,
            'category': cat_biz_id,
            'description': force_unicode(biz.description),
            'image': force_unicode(image_biz),
            'url': force_unicode(biz.get_absolute_url())
        }
    dict_super_dupper = {
        'communities': lista_communities,
        'categories': lista_categories,
        'businesses': lista_business,
        'business': dict_biz
    }
    return HttpResponse(simplejson.dumps(dict_super_dupper))


def get_community_json(request):
    community_objects = Community.objects.all().order_by('name')
    list_community = []
    for i in community_objects:
        list_partner = []
        dict_community = {
            'name': i.name,
            'img_map': force_unicode(i.img_printed_map),
            'print_map': force_unicode(i.printed_map),
        }
        for j in i.partner_set.all():
            dict_partner = {
                'name': j.name,
                'url_name': force_unicode(j.get_absolute_url())
            }
            list_partner.append(dict_partner)
        dict_community['partners'] = list_partner
        list_community.append(dict_community)
    return HttpResponse(simplejson.dumps(list_community))


@csrf_protect
def save_newsletter_suscription(request):
    if request.method == "POST":
        if "suscribe" in request.POST:
            dict_response = {}
            try:
                news_object = Newsletter.objects.get(email=request.POST["suscribe"])
                dict_response['msg'] = 'Newsletter suscription exists!!!'
            except:
                news_object = Newsletter(
                    email=request.POST["suscribe"]
                )
                news_object.save()
                dict_response['msg'] = 'Newsletter suscription saved!!!'
        return HttpResponse(simplejson.dumps(dict_response))


@csrf_exempt
def uploadImage(request):
    if request.method == "POST":
        #file =  request.META["HTTP_X_FILENAME"]
        image_object = ImagenEditor(
            imagen=request.FILES['file']
        )
        image_object.save()
        thumbnailer = get_thumbnailer(image_object.imagen)
        thumb = thumbnailer.get_thumbnail({'size': (800, 800)})
        thumb = thumbnailer.get_thumbnail_name({'size': (800, 800)})
        thumbStr = thumb.replace("\\", "/")
        thumbnail = "/media/" + thumbStr
        return HttpResponse(thumbnail)
    else:
        return HttpResponse("not save")


@csrf_exempt
def saveFeedBack(request):
    if request.method == "POST":
        msg = {}
        if "biz" in request.POST and "listValues[]" in request.POST and request.session.get("user"):
            listvalues = request.POST.getlist("listValues[]")
            biz_info = request.POST["biz"]
            biz = biz_info.split("/")
            biz_object = Business.objects.get(url_name=biz[0], pk=decode_url(biz[1]));
            user = Usuario.objects.get(user__username=request.session["user"])
            if len(listvalues) > 0:
                for a in listvalues:
                    feedback = FeedbackBusiness(
                        business=biz_object,
                        user=user,
                        deal=a
                    )
                    feedback.save()
            else:
                feedback = FeedbackBusiness(
                    business=biz_object,
                    user=user,
                    deal=listvalues[0]
                )
                feedback.save()
            msg["response"] = True
        elif "biz" in request.POST and "listValues" in request.POST and request.session.get("user"):
            listvalues = request.POST["listValues"].split(",")
            biz_info = request.POST["biz"]
            biz = biz_info.split("/")
            biz_object = Business.objects.get(url_name=biz[0], pk=decode_url(biz[1]))
            user = Usuario.objects.get(user__username=request.session["user"])
            if len(listvalues) > 0:
                for a in listvalues:
                    feedback = FeedbackBusiness(
                        business=biz_object,
                        user=user,
                        deal=a
                    )
                    feedback.save()
            else:
                feedback = FeedbackBusiness(
                    business=biz_object,
                    user=user,
                    deal=listvalues[0]
                )
                feedback.save()
            msg["response"] = True
        else:
            print "out"
            msg["response"] = False
        return HttpResponse(simplejson.dumps(msg))


@csrf_exempt
def fakelogin(request):
    if request.method == "POST":
        try:
            dict_response = {}
            user = User.objects.get(username=request.POST["emailuserdeal"])
            dict_response['state'] = True
            dict_response['session'] = True,
            dict_response['message'] = 'Please log in, this user is already exists!!!'
            return HttpResponse(simplejson.dumps(dict_response))
        except:
            if "nameuserdeal" in request.POST or "firstname" in request.POST:
                dict_response = {}
                names = None
                if "nameuserdeal" in request.POST:
                    names = request.POST["nameuserdeal"].split(" ")
                else:
                    names = [request.POST["firstname"], request.POST["lastname"]]
                    gen_password = Randomizer()
                password_left = gen_password.id_generator()
                user = User.objects.create_user(
                    username=request.POST["emailuserdeal"],
                    password=password_left
                )
                user.first_name = names[0]
                user.last_name = names[1]
                user.email = request.POST["emailuserdeal"]
                user.is_active = True
                user.is_staff = False
                user.is_superuser = False
                user.save()

                usuario = Usuario(
                    user=user
                )
                usuario.save()
                usertipo = TipoUsuario(
                    usuario=usuario,
                    access_token=request.POST["emailuserdeal"],
                    expires=3600,
                    userid=request.POST["emailuserdeal"],
                    session_key=hashlib.md5(request.POST["emailuserdeal"])
                )
                usertipo.save()
                usuario.tipo_usuario=usertipo.id
                usuario.save()
                username = user.username
                password = user.password
                request.session["user"] = user.username
                dict_response['state'] = True
                dict_response['session'] = True,
                dict_response['message'] = 'Your user and password were sent to your email account, please check it.'
                html_user = loader.get_template("format-mail/registration-password.html")
                context_user = Context({'link': '%s/communities/register/confirm/%s' % (Site.objects.all()[0], encode_url(user.id, 6)), 'password': password_left})
                subject_user, from_user, to_user = 'Registration DetourMaps', 'Detour Maps <info@detourmaps.com>', request.POST["emailuserdeal"]
                user_context_html = html_user.render(context_user)
                message_user = EmailMessage(subject_user, user_context_html, from_user, [to_user])
                message_user.content_subtype = "html"
                message_user.send()
                return HttpResponse(simplejson.dumps(dict_response))
            else:
                dict_response = {}
                gen_password = Randomizer()
                password_left = gen_password.id_generator()
                user = User.objects.create_user(
                    username=request.POST["emailuserdeal"],
                    password=password_left
                )
                user.email = request.POST["emailuserdeal"]
                user.is_active = True
                user.is_staff = False
                user.is_superuser = False
                user.save()
                usuario = Usuario(
                    user=user
                )
                usuario.save()
                usertipo = TipoUsuario(
                    usuario=usuario,
                    access_token=request.POST["emailuserdeal"],
                    expires=3600,
                    userid=request.POST["emailuserdeal"],
                    session_key=hashlib.md5(request.POST["emailuserdeal"])
                )
                usertipo.save()
                usuario.tipo_usuario = usertipo.id
                usuario.save()
                request.session["user"] = user.username
                dict_response['state'] = True
                dict_response['session'] = True,
                dict_response['message'] = 'Your user and password were sent \
                    to your email account, please check it.'
                html_user = loader.get_template(
                    "format-mail/registration-password.html"
                )
                context_user = Context(
                    {'link': '%s/communities/register/confirm/%s' % (
                        Site.objects.all()[0],
                        encode_url(user.id, 6)
                        ),
                    'password': password_left}
                )
                subject_user, from_user, to_user = 'Registration DetourMaps', 'Detour Maps <info@detourmaps.com>', request.POST["emailuserdeal"]
                user_context_html = html_user.render(context_user)
                message_user = EmailMessage(subject_user, user_context_html, from_user, [to_user])
                message_user.content_subtype = "html"
                message_user.send()
                dict_response['code'] = encode_url(user.id, 6)
                return HttpResponse(simplejson.dumps(dict_response))

@csrf_protect
def register_confirm_password(request, user_id):
    if user_id:
        id_user = decode_url(user_id)
        if request.POST:
            user_object = User.objects.get(id=id_user)
            user = authenticate(username=user_object.username, password=request.POST['old_password'])
            if user.is_active:
                user.set_password(request.POST['new_password'])
                user.save()
                request.session['user'] = user.username
                return redirect('/')
        else:
            return render_to_response(
                'confirm-user-new-password.html',
                {},
                context_instance=RequestContext(request)
            )


@csrf_exempt
def register_confirm_password_ajax(request, user_id):
    dict_response = {}
    if user_id:
        id_user = decode_url(user_id)
        if request.POST:
            user_object = User.objects.get(id=id_user)
            user = authenticate(username=user_object.username, password=request.POST['old_password'])
            if user.is_active:
                user.set_password(request.POST['new_password'])
                user.save()
                request.session['user'] = user.username
                dict_response['message'] = 'Your new password was saved!!!'
        return HttpResponse(simplejson.dumps(dict_response))


@csrf_exempt
def save_bookmark(request):
    if request.method == "POST":
        dict_response = {}
        if "biz_url" in request.POST:
            biz = request.POST.get("biz_url").split("/")
            biz_object = Business.objects.get(url_name=biz[0], pk=decode_url(biz[1]))
            user_object = Usuario.objects.get(user__username=request.session["user"])
            try:
                bookmark_object = Bookmark.objects.get(biz=biz_object, user=user_object)
                dict_response["state"] = False
                dict_response["message"] = "Your bookmark was created!!!"
            except:
                bookmark_object = Bookmark(
                    biz=biz_object,
                    user=user_object
                )
                bookmark_object.save()
                dict_response["state"] = True
                dict_response["message"] = "Success, your saved bookmark!!!"
        return HttpResponse(simplejson.dumps(dict_response))


@csrf_exempt
def save_coupon(request):
    if request.method == "POST":
        dict_response = {}
        if "id_coupon" in request.POST:
            coupon_object = CuponBusiness.objects.get(id=request.POST["id_coupon"])
            user_object = Usuario.objects.get(user__username=request.session["user"])
            try:
                coupon_object = Bookmark.objects.get(user=user_object, coupon=coupon_object)
                dict_response["state"] = False
                dict_response["message"] = "Your bookmark was created!!!"
            except:
                coupon_object = Bookmark(
                    user=user_object,
                    coupon=coupon_object
                )
                coupon_object.save()
                dict_response["state"] = True
                dict_response["message"] = "Success, your saved bookmark!!!"
        return HttpResponse(simplejson.dumps(dict_response))


@csrf_exempt
def save_ten_visits(request):
    if "receipt" in request.POST and "date" in request.POST:
        dict_response = {}
        biz = request.POST.get("biz_url").split("/")
        biz_object = Business.objects.get(url_name=biz[0], pk=decode_url(biz[1]))
        user_object = User.objects.get(username=request.session["user"])
        if "name" in request.POST:
            try:
                ten_visits_objects = TenVisitsRecord.objects.filter(user__username=request.session.get("user")).filter(business=biz_object)
                last = ten_visits_objects.count() - 1
                if ten_visits_objects[last].state:
                    ten_visits_new = TenVisitsRecord(
                        user=user_object,
                        business=biz_object
                    )
                    ten_visits_new.save()
                    ten_manage = TenVisitsManage(
                        ten=ten_visits_new,
                        receipt_number=request.POST["receipt"],
                        date=request.POST["date"],
                        employee=request.POST["name"],
                        number=1
                    )
                    ten_manage.save()
                    dict_response["state"] = True
                    dict_response["message"] = 'Start new Ten Visits Program!!'
                else:
                    ten_manager = TenVisitsManage.objects.filter(ten=ten_visits_objects[last])
                    ten_manage = TenVisitsManage(
                        ten=ten_visits_objects[last],
                        receipt_number=request.POST["receipt"],
                        date=request.POST["date"],
                        employee=request.POST["name"],
                        number=ten_manager.count() + 1
                    )
                    ten_manage.save()
                    ten_manager = TenVisitsManage.objects.filter(ten=ten_visits_objects[last])
                    if ten_manager.count() == 10:
                        ten_object = TenVisitsRecord.objects.get(pk=ten_visits_objects[last].pk)
                        ten_object.state = 1
                        ten_object.save()
                        html_user = loader.get_template("/home/detourmaps/community/templates/ten_visits.html")
                        context_user = Context({'link': '', 'message': 'Your Ten Visits is complete!!', 'program': 'Ten Visits'})
                        subject_user, from_user, to_user = 'Ten Visits Complete %s' % biz_object.name, 'Detour Maps <info@detourmaps.com>', user_object.email
                        user_context_html = html_user.render(context_user)
                        message_user = EmailMessage(subject_user, user_context_html, from_user, [to_user])
                        message_user.content_subtype = "html"
                        message_user.send()
                    dict_response["state"] = True
                    dict_response["message"] = 'This is your %s visit' % ten_manager.count()
            except:
                ten_visits_new = TenVisitsRecord(
                    user=user_object,
                    business=biz_object
                )
                ten_visits_new.save()
                ten_manage = TenVisitsManage(
                    ten=ten_visits_new,
                    receipt_number=request.POST["receipt"],
                    date=request.POST["date"],
                    employee=request.POST["name"],
                    number=1
                )
                ten_manage.save()
                dict_response["state"] = True
                dict_response["message"] = 'This is your first visit'
        else:
            try:
                ten_visits_objects = TenVisitsRecord.objects.filter(user__username=request.session.get("user")).filter(business=biz_object)
                last = ten_visits_objects.count() - 1
                if ten_visits_objects[last].state:
                    ten_visits_new = TenVisitsRecord(
                        user=user_object,
                        business=biz_object
                    )
                    ten_visits_new.save()
                    ten_manage = TenVisitsManage(
                        ten=ten_visits_new,
                        receipt_number=request.POST["receipt"],
                        date=request.POST["date"],
                        number=1
                    )
                    ten_manage.save()
                    dict_response["state"] = True
                    dict_response["message"] = 'This is your %s visit' % ten_manage.count()
                else:
                    ten_manager = TenVisitsManage.objects.filter(ten=ten_visits_objects[last])
                    ten_manage = TenVisitsManage(
                        ten=ten_visits_objects[last],
                        receipt_number=request.POST["receipt"],
                        date=request.POST["date"],
                        number=ten_manager.count() + 1
                    )
                    ten_manage.save()
                    ten_manager = TenVisitsManage.objects.filter(ten=ten_visits_objects[last])
                    if ten_manager.count() == 10:
                        ten_object = TenVisitsRecord.objects.get(pk=ten_visits_objects[last].pk)
                        ten_object.state = 1
                        ten_object.save()
                        html_user = loader.get_template("/home/detourmaps/community/templates/ten_visits.html")
                        context_user = Context({'link': '', 'message': 'Your Ten Visits is complete!!', 'program': 'Ten Visits'})
                        subject_user, from_user, to_user = 'Ten Visits Complete %s' % biz_object.name, 'Detour Maps <info@detourmaps.com>', user_object.email
                        user_context_html = html_user.render(context_user)
                        message_user = EmailMessage(subject_user, user_context_html, from_user, [to_user])
                        message_user.content_subtype = "html"
                        message_user.send()
                    dict_response["state"] = True
                    dict_response["message"] = 'This is your %s visit' % ten_manager.count()
            except:
                ten_visits_new = TenVisitsRecord(
                    user=user_object,
                    business=biz_object
                )
                ten_visits_new.save()
                ten_manage = TenVisitsManage(
                    ten=ten_visits_new,
                    receipt_number=request.POST["receipt"],
                    date=request.POST["date"],
                    number=1
                )
                ten_manage.save()
                dict_response["state"] = True
                dict_response["message"] = 'This is your first visit'
        return HttpResponse(simplejson.dumps(dict_response))


@csrf_exempt
def save_refer_friends(request):
    if "biz_url" in request.POST:
        dict_response = {}
        biz = request.POST.get("biz_url").split("/")
        biz_object = Business.objects.get(url_name=biz[0], pk=decode_url(biz[1]))
        user_object = User.objects.get(username=request.session["user"])
        try:
            refer_objects = ReferFriendsRecord.objects.filter(user__username=request.session.get("user")).filter(business=biz_object)
            last = refer_objects.count() - 1
            if refer_objects[last].state:
                refer_new = ReferFriendsRecord(
                    user=user_object,
                    business=biz_object
                )
                refer_new.save()
                refer_manage = ReferFriendsManage(
                    refer=refer_new,
                    email_friend=request.POST["email"],
                    date=datetime.datetime.now().strftime("%Y-%m-%d"),
                    message=request.POST["quickmessage"],
                    number=1
                )
                refer_manage.save()
                dict_response["state"] = True
                dict_response["message"] = 'Start new Refer Friends Program!!'
            else:
                refer_manager = ReferFriendsManage.objects.filter(refer=refer_objects[last])
                refer_manage = ReferFriendsManage(
                    refer=refer_objects[last],
                    email_friend=request.POST["email"],
                    date=datetime.datetime.now().strftime("%Y-%m-%d"),
                    message=request.POST["quickmessage"],
                    number=refer_manager.count() + 1
                )
                refer_manage.save()
                refer_manager = ReferFriendsManage.objects.filter(refer=refer_objects[last])
                if refer_manager.count() == 5:
                    refer_object = ReferFriendsRecord.objects.get(pk=refer_objects[last].pk)
                    refer_object.state = 1
                    refer_object.save()
                    html_user = loader.get_template("ten_visits.html")
                    context_user = Context({'link': '', 'message': 'Your Refer Friends is complete!!', 'program': 'Refer Friends'})
                    subject_user, from_user, to_user = 'Refer Friends Complete %s' % biz_object.name, 'Detour Maps <info@detourmaps.com>', user_object.email
                    user_context_html = html_user.render(context_user)
                    message_user = EmailMessage(subject_user, user_context_html, from_user, [to_user])
                    message_user.content_subtype = "html"
                    message_user.send()
                dict_response["state"] = True
                dict_response["message"] = 'This is your %s refer friend' % refer_manager.count()
        except:
            refer_new = ReferFriendsRecord(
                user=user_object,
                business=biz_object
            )
            refer_new.save()
            refer_manage = ReferFriendsManage(
                refer=refer_new,
                email_friend=request.POST["email"],
                date=datetime.datetime.now().strftime("%Y-%m-%d"),
                message=request.POST["quickmessage"],
                number=1
            )
            refer_manage.save()
            dict_response["state"] = True
            dict_response["message"] = 'This is your first refer friend'
        return HttpResponse(simplejson.dumps(dict_response))


def how_it_works(request):
    return render_to_response(
        'how-to.html',
        {},
        context_instance=RequestContext(request)
    )


@csrf_exempt
def get_promotion(request):
    dict_response = {}
    user = User.objects.get(username=request.session.get("user"))
    coupon_business = CuponBusiness.objects.get(pk=request.POST["cpid"])
    new_owner, created = CouponOwner.objects.get_or_create(
        user=user,
        coupon_business=coupon_business
    )
    try:
        old_coupon = Coupon.objects.get(owner=new_owner)
        if old_coupon.used:
            dict_response['username'] = user.username
            dict_response['image'] = '/media/coupon/%s.jpg' % old_coupon.getCode()
            dict_response['voucher'] = old_coupon.getCode()
            dict_response['message'] = 'This coupon was used already !!'
            dict_response['new_coupon'] = True
            dict_response['old_coupon'] = False
            dict_response['redeemed'] = True

        elif old_coupon.saved:
            if old_coupon.valid_date == datetime.datetime.now():
                dict_response['username'] = user.username
                dict_response['image'] = '/media/coupon/%s.jpg' % old_coupon.getCode()
                dict_response['voucher'] = old_coupon.getCode()
                dict_response['message'] = 'This coupon was used already !!'
                dict_response['new_coupon'] = True
                dict_response['old_coupon'] = False
                dict_response['redeemed'] = True

            elif old_coupon.until_date == datetime.datetime.now():
                history = old_coupon
                history.save()
                old_coupon.delete()
                new_coupon = Coupon(
                    owner=new_owner,
                    saved=True,
                    mode='E'
                )
                new_coupon.save()
                image = generateCoupon('%s%s' % (settings.MEDIA_ROOT, coupon_business.coupon), user.username, new_coupon.getCode())
                dict_response['username'] = user.username
                dict_response['image'] = image
                dict_response['voucher'] = new_coupon.getCode()
                dict_response['message'] = 'Redeem now'
                dict_response['new_coupon'] = True
                dict_response['old_coupon'] = False
                dict_response['redeemed'] = False

            else:
                dict_response['username'] = user.username
                dict_response['image'] = '/media/coupon/%s.jpg' % old_coupon.getCode()
                dict_response['voucher'] = old_coupon.getCode()
                dict_response['message'] = 'Please redeemed this coupon'
                dict_response['new_coupon'] = True
                dict_response['old_coupon'] = False
                dict_response['redeemed'] = False

        else:
            dict_response['username'] = user.username
            dict_response['image'] = '/media/coupon/%s.jpg' % old_coupon.getCode()
            dict_response['voucher'] = old_coupon.getCode()
            dict_response['message'] = 'This coupon was created already, check your inbox or your dashboard!'
            dict_response['new_coupon'] = True
            dict_response['old_coupon'] = False
            dict_response['redeemed'] = False
    except Coupon.DoesNotExist:
        new_coupon = Coupon(
            owner=new_owner,
            saved=True,
            mode='E'
        )
        new_coupon.save()
        image = generateCoupon('%s%s' % (settings.MEDIA_ROOT, coupon_business.coupon), user.username, new_coupon.getCode())
        dict_response['username'] = user.username
        dict_response['image'] = image
        dict_response['voucher'] = new_coupon.getCode()
        dict_response['message'] = 'Redeem now'
        dict_response['new_coupon'] = True
        dict_response['old_coupon'] = False
        dict_response['redeemed'] = False
    return HttpResponse(simplejson.dumps(dict_response))


class MergeImage:

    def __init__(self):
        pass

    def redeem_card(self, card, mask, voucher):
        frame = Image.open(card)
        frame_mask = Image.open(mask)
        frame.paste(frame_mask, (0, 0), mask=frame_mask)
        frame.save('%scoupon/%s.jpg' % (settings.MEDIA_ROOT, voucher), "JPEG", quality=90)
        return '%scoupon/%s.jpg' % (settings.MEDIA_URL, voucher)

    def generateQR(self, url, code, host):
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.ERROR_CORRECT_L,
            box_size=10,
            border=4
        )
        data = 'http://%s/community/%s' % (host, url)
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image()
        try:
            img.save('%sqr/%s.jpg' % (settings.MEDIA_ROOT, code), "JPEG")
            return '%sqr/%s.jpg' % (settings.MEDIA_ROOT, code)
        except IOError:
            return 'Error 1 Could not save'

    def generateCoupon(self, image, name, code):
        basedir = path.dirname(__file__)
        try:
            font = ImageFont.truetype(basedir+'/resources/RobotoCondensed-Light.ttf', 30)
            img = Image.open(image)
            img.load()
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img)
            txt = 'Name: %s - Voucher: %s' % (name, code)
            x, y = (10, 10)
            draw_img = ImageDraw.Draw(background)
            # thin border
            draw_img.text((x-1, y), txt, (0, 0, 0), font=font)
            draw_img.text((x+1, y), txt, (0, 0, 0), font=font)
            draw_img.text((x, y-1), txt, (0, 0, 0), font=font)
            draw_img.text((x, y+1), txt, (0, 0, 0), font=font)

            # thicker border
            draw_img.text((x-1, y-1), txt, (0, 0, 0), font=font)
            draw_img.text((x+1, y-1), txt, (0, 0, 0), font=font)
            draw_img.text((x-1, y+1), txt, (0, 0, 0), font=font)
            draw_img.text((x+1, y+1), txt, (0, 0, 0), font=font)
            draw_img.text((x, y), txt, (255, 255, 255), font=font)
        except IOError:
            return 'Error 0 No image'
        try:
            background.save('%scoupon/%s.jpg' % (settings.MEDIA_ROOT, code), "JPEG", quality=90)
            return '%scoupon/%s.jpg' % (settings.MEDIA_ROOT, code)
        except IOError:
            return 'Error 1 Could not save'

    def build_coupon_mail(self, coupon, qr, voucher):
        frame = Image.open(coupon)
        frame_mask = Image.open(qr)
        new_back = Image.new("RGB", (frame.size[0], frame.size[1]+frame_mask.size[1]))
        new_back.paste(frame, (0, 0))
        new_back.paste(frame_mask, ((frame.size[0]-frame_mask.size[0])/2, frame.size[1]))
        new_back.save('%scoupon-qr/%s-qr.jpg' % (settings.MEDIA_ROOT, voucher), "JPEG", quality=90)
        return '%scoupon-qr/%s-qr.jpg' % (settings.MEDIA_URL, voucher)


@csrf_exempt
def redeemed(request):
    """
    function to redeemed a coupon with voucher number
    """
    if request.method == "POST":
        dict_response = {}
        if "voucher" in request.POST:
            id_coupon = decode_url(request.POST["voucher"])
            coupon_redeem = Coupon.objects.get(pk=id_coupon)
            coupon_redeem.used = True
            coupon_redeem.used_date = datetime.datetime.now()
            coupon_redeem.save()
            card = '%scoupon/%s.jpg' % (settings.MEDIA_ROOT,
                request.POST["voucher"])
            mask = '%scommunity/mobile-evolution/redeemed-image.png' % \
                settings.STATIC_ROOT
            image = MergeImage()
            dict_response['redeemed'] = True
            dict_response['message'] = 'Your coupon was redeemed successfully'
            dict_response['image'] = image.redeem_card(card, mask, request.POST["voucher"])
        return HttpResponse(simplejson.dumps(dict_response))


@csrf_exempt
def save_promo(request):
    if request.method == "POST":
        dict_response = {}
        if "id" in request.POST:
            user = User.objects.get(username=request.session.get("user"))
            coupon_business = CuponBusiness.objects.get(pk=request.POST["id"])
            new_owner, created = CouponOwner.objects.get_or_create(
                user=user,
                coupon_business=coupon_business
            )
            try:
                old_coupon = Coupon.objects.get(owner=new_owner)
                if old_coupon.used:
                    dict_response['username'] = user.username
                    dict_response['image'] = '/media/coupon/%s.jpg' % \
                        old_coupon.getCode()
                    dict_response['voucher'] = old_coupon.getCode()
                    dict_response['message'] = 'This coupon was used already !!'
                    dict_response['new_coupon'] = True
                    dict_response['old_coupon'] = False
                    dict_response['redeemed'] = True
                elif old_coupon.saved:
                    if old_coupon.valid_date == datetime.datetime.now():
                        dict_response['username'] = user.username
                        dict_response['image'] = '/media/coupon/%s.jpg' % \
                            old_coupon.getCode()
                        dict_response['voucher'] = old_coupon.getCode()
                        dict_response['message'] = 'This coupon was used already !!'
                        dict_response['new_coupon'] = True
                        dict_response['old_coupon'] = False
                        dict_response['redeemed'] = True
                    elif old_coupon.until_date == datetime.datetime.now():
                        history = old_coupon
                        history.save()
                        old_coupon.delete()
                        new_coupon = Coupon(
                            owner=new_owner,
                            saved=True,
                            mode='E'
                        )
                        new_coupon.save()
                        image = generateCoupon(
                            '%s%s' % (
                                settings.MEDIA_ROOT,
                                coupon_business.coupon),
                            user.username,
                            new_coupon.getCode()
                        )
                        dict_response['username'] = user.username
                        dict_response['image'] = image
                        dict_response['voucher'] = new_coupon.getCode()
                        dict_response['message'] = 'Redeem now'
                        dict_response['new_coupon'] = True
                        dict_response['old_coupon'] = False
                        dict_response['redeemed'] = False
                    else:
                        dict_response['username'] = user.username
                        dict_response['image'] = '/media/coupon/%s.jpg' % \
                            old_coupon.getCode()
                        dict_response['voucher'] = old_coupon.getCode()
                        dict_response['message'] = 'Please redeemed this coupon'
                        dict_response['new_coupon'] = True
                        dict_response['old_coupon'] = False
                        dict_response['redeemed'] = False
                else:
                    dict_response['username'] = user.username
                    dict_response['image'] = '/media/coupon/%s.jpg' % \
                        old_coupon.getCode()
                    dict_response['voucher'] = old_coupon.getCode()
                    dict_response['message'] = 'This coupon was created already, \
                        check your inbox or your dashboard!'
                    dict_response['new_coupon'] = True
                    dict_response['old_coupon'] = False
                    dict_response['redeemed'] = False
            except Coupon.DoesNotExist:
                new_coupon = Coupon(
                    owner=new_owner,
                    saved=True,
                    mode='E'
                )
                new_coupon.save()
                qrdecoder = MergeImage()
                image = qrdecoder.generateCoupon(
                    '%s%s' % (
                        settings.MEDIA_ROOT,
                        coupon_business.coupon
                        ),
                    user.username,
                    new_coupon.getCode()
                )
                qrcoder = qrdecoder.generateQR(
                    'view/coupon/%s' % new_coupon.getCode(),
                    '%s' % new_coupon.getCode(),
                    Site.objects.all()[0]
                )
                new_coupon_qr = qrdecoder.build_coupon_mail(
                    image,
                    qrcoder,
                    new_coupon.getCode()
                )
                html_user = loader.get_template(
                    "format-mail/smartBuyCustomer.html"
                )
                context_user = Context(
                    {
                        'name': coupon_business.business.name,
                        'image': 'http://%s%s' % (Site.objects.all()[0], new_coupon_qr)
                    }
                )
                subject_user, from_user, to_user = 'Smart Buys DetourMaps', 'Detour Maps <info@detourmaps.com>', user.email
                user_context_html = html_user.render(context_user)
                message_user = EmailMessage(subject_user, user_context_html, from_user, [to_user])
                message_user.content_subtype = "html"
                message_user.send()
                dict_response['username'] = user.username
                dict_response['image'] = image
                dict_response['voucher'] = new_coupon.getCode()
                dict_response['message'] = 'Redeem now'
                dict_response['new_coupon'] = True
                dict_response['old_coupon'] = False
                dict_response['redeemed'] = False
        return HttpResponse(simplejson.dumps(dict_response))


@csrf_exempt
def forgot_password(request):
    dict_response = {}
    if "user_email" in request.POST:
        gen_password = Randomizer()
        password_left = gen_password.id_generator()
        user = User.objects.get(
            username=request.POST["user_email"],
        )
        user.set_password(password_left)
        user.save()
        dict_response['state'] = True
        dict_response['session'] = True,
        dict_response['message'] = 'Your user and password were sent \
            to your email account, please check it.'
        html_user = loader.get_template(
            "format-mail/registration-password.html"
        )
        context_user = Context(
            {'link': '%s/communities/register/confirm/%s' % (
                Site.objects.all()[0],
                encode_url(user.id, 6)
                ),
            'password': password_left}
        )
        subject_user, from_user, to_user = 'Registration DetourMaps', 'Detour Maps <info@detourmaps.com>', request.POST["user_email"]
        user_context_html = html_user.render(context_user)
        message_user = EmailMessage(subject_user, user_context_html, from_user, [to_user])
        message_user.content_subtype = "html"
        message_user.send()
        dict_response['code'] = encode_url(user.id, 6)
    return HttpResponse(simplejson.dumps(dict_response))


@csrf_exempt
def share_emails_buys(request):
    dict_response = {}
    if request.method == "POST":
        if "email" in request.POST:
            business_object = Business.objects.get(pk=decode_url(request.POST["codebiz"]));
            email_split = request.POST["email"].split(",")
            for e in email_split:
                html_user = loader.get_template(
                    "format-mail/smartBuyShare.html"
                )
                context_user = Context(
                    {
                        'link': request.META['HTTP_REFERER'],
                        'name': business_object.name
                    }
                )
                subject_user, from_user, to_user = 'Share Smart Buys DetourMaps', 'Detour Maps <info@detourmaps.com>', e
                user_context_html = html_user.render(context_user)
                message_user = EmailMessage(subject_user, user_context_html, from_user, [to_user])
                message_user.content_subtype = "html"
                message_user.send()
        dict_response['message'] = 'Share Complete.'
    return HttpResponse(simplejson.dumps(dict_response))



@csrf_exempt
def print_promo(request, id):
    image_coupon = None
    image_qr = None
    user = User.objects.get(username=request.session.get("user"))
    coupon_business = CuponBusiness.objects.get(pk=id)
    new_owner, created = CouponOwner.objects.get_or_create(
        user=user,
        coupon_business=coupon_business
    )
    try:
        old_coupon = Coupon.objects.get(owner=new_owner)
        if old_coupon.used:
            image_coupon = '/media/coupon/%s.jpg' % old_coupon.getCode()
            image_qr = '/media/qr/%s.jpg' % old_coupon.getCode()
        elif old_coupon.saved:
            if old_coupon.valid_date == datetime.datetime.now():
                image_coupon = '/media/coupon/%s.jpg' % old_coupon.getCode()
                image_qr = '/media/qr/%s.jpg' % old_coupon.getCode()
            elif old_coupon.until_date == datetime.datetime.now():
                history = old_coupon
                history.save()
                old_coupon.delete()
                new_coupon = Coupon(
                    owner=new_owner,
                    saved=True,
                    mode='E'
                )
                new_coupon.save()
                qrdecoder = MergeImage()
                image = qrdecoder.generateCoupon(
                    '%s%s' % (
                        settings.MEDIA_ROOT,
                        coupon_business.coupon
                        ),
                    user.username,
                    new_coupon.getCode()
                )
                image_coupon = '/media/coupon/%s.jpg' % new_coupon.getCode()
                qrcoder = qrdecoder.generateQR(
                    'view/coupon/%s' % new_coupon.getCode(),
                    '%s' % new_coupon.getCode(),
                    Site.objects.all()[0]
                )
                image_qr = '/media/qr/%s.jpg' % new_coupon.getCode()
            else:
                image_coupon = '/media/coupon/%s.jpg' % old_coupon.getCode()
                image_qr = '/media/qr/%s.jpg' % old_coupon.getCode()
        else:
            image_coupon = '/media/coupon/%s.jpg' % old_coupon.getCode()
            image_qr = '/media/qr/%s.jpg' % old_coupon.getCode()
    except Coupon.DoesNotExist:
        new_coupon = Coupon(
            owner=new_owner,
            saved=True,
            mode='E'
        )
        new_coupon.save()
        qrdecoder = MergeImage()
        image = qrdecoder.generateCoupon(
            '%s%s' % (
                settings.MEDIA_ROOT,
                coupon_business.coupon
                ),
            user.username,
            new_coupon.getCode()
        )
        image_coupon = '/media/coupon/%s.jpg' % new_coupon.getCode()
        qrcoder = qrdecoder.generateQR(
            'view/coupon/%s' % new_coupon.getCode(),
            '%s' % new_coupon.getCode(),
            Site.objects.all()[0]
        )
        image_qr = '/media/qr/%s.jpg' % new_coupon.getCode()
    return render_to_response(
        'print_promo.html',
        {
            'coupon': image_coupon,
            'qr': image_qr
        }
        ,
        context_instance=RequestContext(request)
    )


