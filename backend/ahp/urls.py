from django.urls import path
from . import views

urlpatterns = [
    path('ahp/compute/', views.compute_ahp, name='compute_ahp'),
]