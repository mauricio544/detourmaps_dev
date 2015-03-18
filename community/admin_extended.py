# -*- coding: utf-8 -*-
__author__ = 'mauricio'
from django.db.models import get_models, get_app
from django.contrib import admin as adm
#from django.contrib.admin.sites import AlreadyRegistered

def autoregister(*app_list):
    for app_name in app_list:
        app_models = get_app(app_name)
        for model in get_models(app_models):
            try:
                adm.site.register(model)
            except:
                pass
