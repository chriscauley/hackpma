# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib.gis.geos import MultiPolygon, Polygon
from django.contrib.gis.db import models

import logging, jsonfield, json, requests

logger = logging.getLogger(__name__)

def get_or_none(model,**kwargs):
  try:
    return model.objects.get(**kwargs)
  except model.DoesNotExist:
    return None
  except model.MultipleObjectsReturned:
    return model.objects.filter(**kwargs)[0]

class APIModel(models.Model):
  json_fields = []
  json_filter_fields = {}
  from_json_fields = []
  from_json_fks = []
  from_json_pk_field = None
  data = jsonfield.JSONField(default=dict)
  _get_defaults = classmethod(lambda cls,data: { 'data': data })
  class Meta:
    abstract = True
  def refresh_from_data(self):
    for key in self.from_json_fields:
      setattr(self,key,self.data[key.strip("_").title()])
    self.save()
  @property
  def as_json(self):
    fields = self.json_fields + ['id']
    return { k: getattr(self,k) for k in fields }
  @classmethod
  def from_json(cls,data):
    reserved = ["open","type"]
    kwargs = {'defaults': cls._get_defaults(data)}
    for field, getter in cls.from_json_fks:
      kwargs[field] = getter(data)
    for key in cls.from_json_fields:
      title = key.strip("_").title()
      if title in data:
        kwargs[key] = data[title]
    if cls.from_json_pk_field:
      kwargs['id'] = data[cls.from_json_pk_field]
    obj,new = cls.objects.get_or_create(**kwargs)
    obj.data = data
    obj.save()

    if new:
      logger.debug("Location Created: %s"%obj)
    return obj

class Artist(APIModel):
  class Meta:
    ordering = ('name',)
  __unicode__ = lambda self: self.name
  name = models.CharField(max_length=256)

class MuseumObject(APIModel):
  __unicode__ = lambda self:"%s by %s"%(self.title,self.data['Artist'])
  artists = models.ManyToManyField(Artist)
  image = models.FileField(upload_to="_pma/images/",null=True,blank=True)
  thumbnail = models.FileField(upload_to="_pma/thumbnails/",null=True,blank=True)
  title = models.CharField(max_length=256)
  location = models.ForeignKey("Location",null=True,blank=True)

  from_json_fields = ['title']
  json_fields = ['image_url','thumbnail_url','artist','title']
  json_filter_fields = {'location_id':'location_id'}
  from_json_fks = [
    ('location', lambda data: get_or_none(
      Location,name=data.pop('Location')['GalleryShort'].replace("Gallery ","")))
  ]
  from_json_pk_field = 'ObjectID'

  image_url = property(lambda self: self.image.url if self.image else None)
  thumbnail_url = property(lambda self: self.thumbnail.url if self.image else None)
  artist = property(lambda self: self.data['Artist'])
  def make_artists(self):
    for data in self.data['Artists']:
      artist,new = Artist.objects.get_or_create(name=data['Artist'],defaults={'data': data})
      if new:
        print "Artist created: ",artist
      self.artists.add(artist)
  def get_images(self):
    for _type in ["Thumbnail","Image"]:
      field = getattr(self,_type.lower())
      if field or not self.data[_type]:
        continue
      r = requests.get(self.data[_type],stream=True)
      if r.status_code == 200:
        name = self.data[_type].split("/")[-1]
        field.save(name,r.raw)
      self.save()

class Location(APIModel):
  json_fields = ['name','coordinates','floor']
  json_filter_fields = {
    'name': 'name__icontains',
    'floor': 'floor',
    'coordinates__isnull': 'coordinates__isnull'
  }
  __unicode__ = lambda self: self.name
  from_json_fields = ['name','floor','_open','title','_type']
  name = models.CharField(max_length=256)
  floor = models.CharField(max_length=16)
  _open = models.BooleanField()
  title = models.CharField(max_length=256,null=True,blank=True)
  coordinates = models.MultiPolygonField(null=True)
  _type = models.CharField(max_length=32,null=True,blank=True)
  @property
  def as_json(self):
    data = super(Location,self).as_json
    data['coordinates'] = self.coordinates.coords[0][0] if self.coordinates else None
    return data
  def save(self,*args,**kwargs):
    if self.data['Coordinates']:
      coords = [Polygon(c['coordinates']) for c in self.data['Coordinates']]
      self.coordinates = MultiPolygon(coords)
    super(Location,self).save(*args,**kwargs)
