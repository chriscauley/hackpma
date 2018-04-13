import django,os;os.environ['DJANGO_SETTINGS_MODULE'] = 'main.settings';django.setup()

from django.conf import settings
from django.template.defaultfilters import slugify

from pma.models import Location, MuseumObject

import requests, urllib, json

class PMAAPI():
  def __init__(self,token):
    self.token = token
  def get(self,end_point,**kwargs):
    url = 'https://hackathon.philamuseum.org/api/v0/collection/{}?api_token={}&'.format(end_point,self.token)
    fname = os.path.join(settings.BASE_DIR,"../.cache",slugify(url))
    if os.path.exists(fname):
      return json.loads(open(fname,'r').read())
    url += urllib.urlencode(kwargs.items())
    response = requests.get(url)
    response.raise_for_status()
    with open(fname,'w') as f:
      f.write(response.text)
      print "WROTE:",fname
    return json.loads(response.text)

if __name__ == "__main__":
  api = PMAAPI('6p9XX1VAxfLxNHjrjC9xF5KYskcmSTwMMrXCjCdR2IoKoeYNLxCSoV3BZDhM')
  locations = api.get("locations")
  for location in locations:
    Location.from_json(location)
  print Location.objects.count(),"Locations"
  offset = 0 #MuseumObject.objects.count()
  count = 1000
  limit = 500
  ids = []
  for i in range(count):
    objects = api.get('objectsOnView',limit=limit,offset=offset)
    print MuseumObject.objects.count(),"/",offset
    if offset >= 1000:
      break
    offset = offset + limit
    for o in objects:
      ids.append(MuseumObject.from_json(o).id)
  print len(set(ids))
  for model in [Location,MuseumObject]:
    print model,model.objects.count()
