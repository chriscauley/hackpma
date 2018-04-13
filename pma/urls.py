from django.conf.urls import url

import views

urlpatterns = [
  url('api/(location|object|artist)/',views.get)
]
