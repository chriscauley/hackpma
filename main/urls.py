from django.conf import settings
from django.conf.urls import include, url

from django.contrib import admin
from django.contrib.auth import urls as auth_urls

import lablackey.urls
import pma.urls as pma_urls

urlpatterns = [
  #url(r'^admin/', include(admin.site.urls)),
  url(r'^auth/',include(auth_urls)),
  url(r'',include(lablackey.urls)),
  url(r'',include(pma_urls)),
]
