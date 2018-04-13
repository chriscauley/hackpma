# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from rest_framework.response import Response
from rest_framework.decorators import api_view

from pma.models import Location, MuseumObject, Artist

MODELS = {
  'location': Location,
  'object': MuseumObject,
  'artist': Artist,
}

def paginate(request,results):
  per_page = int(request.GET.get("per_page",10))
  pagination = {
    'per_page': per_page,
    'total': len(results),
  }
  pagination['pages'] = len(results)/pagination['per_page']
  page = pagination['page'] = min(int(request.GET.get("page",1)),pagination['pages']) or 1
  if pagination['pages'] == page:
    results = results[(page-1)*per_page:]
  else:
    results = results[(page-1)*per_page:page*per_page]
  return results,pagination

@api_view(['GET'])
def get(request,model_slug):
  model = MODELS[model_slug]
  f = { v: request.GET[k] for k,v in model.json_filter_fields.items() if k in request.GET }
  results, pagination = paginate(request,model.objects.filter(**f))
  return Response({
    'results': [r.as_json for r in results],
    'pagination': pagination,
  })

# Create your views here.
