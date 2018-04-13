# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin

from models import Location, MuseumObject, Artist
import json

# Register your models here.

class ReadOnlyAdmin(admin.ModelAdmin):
  superuser_can_edit = False
  def get_readonly_fields(self, request, obj=None):
    if self.superuser_can_edit and request.user.is_superuser:
      return self.readonly_fields
    x = dir(self)
    if self.fieldsets:
      return flatten_fieldsets(self.fieldsets)
    return [x for x in list(set(
      [field.name for field in self.opts.local_fields] +
      [field.name for field in self.opts.local_many_to_many] +
      list(self.readonly_fields)
    )) if not x in self.exclude]

class JsonModelAdmin(ReadOnlyAdmin):
  exclude = ("data",)
  readonly_fields = ('_data',)
  def _data(self,obj):
    return "<pre>"+json.dumps(obj.data,indent=4,sort_keys=True)+"</pre>"
  _data.allow_tags = True

@admin.register(Location)
class LocationAdmin(JsonModelAdmin):
  list_display = ['__unicode__','_object_count']
  search_fields = ['name']
  def _object_count(self,obj):
    return obj.museumobject_set.count()


@admin.register(MuseumObject)
class MuseumObjectAdmin(JsonModelAdmin):
  pass

@admin.register(Artist)
class ArtistAdmin(JsonModelAdmin):
  list_display = ['__unicode__','_object_count']
  search_fields = ['name']
  def _object_count(self,obj):
    return obj.museumobject_set.count()
