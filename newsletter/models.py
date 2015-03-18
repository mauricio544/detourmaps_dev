# -*- coding: utf-8 -*-
from django.db import models
from django.contrib.auth.models import User
# Create your models here.

class Area(models.Model):
    CHOICES_SHAPE = (
        ('rect','rect'),
        ('circle','circle'),
        ('poly','poly')
    )
    shape = models.CharField(max_length=6,choices=CHOICES_SHAPE)
    coords = models.CharField(max_length=360)
    svg = models.CharField(max_length=360)
    link = models.URLField()
    user = models.ForeignKey(User)

    def __unicode__(self):
        return u'%s' % self.link

    class Meta:
        verbose_name_plural = u'Áreas'

class Map(models.Model):
    nombre = models.CharField(max_length=24)
    area = models.ManyToManyField(Area,blank=True,null=True)
    user = models.ForeignKey(User)

    def __unicode__(self):
        return u'%s' % self.nombre

    class Meta:
        verbose_name_plural = 'Maps'

class Imagen(models.Model):
    nombre = models.CharField(max_length=120)
    imagen = models.ImageField(upload_to='news')
    user = models.ForeignKey(User)

    def __unicode__(self):
        return u'%s' % self.nombre

class ImagenMap(models.Model):
    map = models.ForeignKey(Map)
    image = models.ForeignKey(Imagen)
    user = models.ForeignKey(User)


class Text(models.Model):
    name = models.CharField(max_length=120)
    text = models.TextField()
    user = models.ForeignKey(User,blank=True,null=True)

    def __unicode__(self):
        return u'%s' % self.text

    class Meta:
        abstract = True

class Header(Text):

    class Meta:
        verbose_name_plural = u'Header'

class Body(Text):

    class Meta:
        verbose_name_plural = u'Bodies'

class ImageBody(models.Model):
    image = models.ForeignKey(Imagen)
    body = models.ForeignKey(Body)
    maps = models.OneToOneField(Map,blank=True,null=True)

class Footer(Text):

    class Meta:
        verbose_name_plural = u'Footers'

        

