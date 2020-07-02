from django.db import models
from rest_framework import serializers
from django.utils.translation import ugettext_lazy as _
from awx.main.models.mixins import ResourceMixin
from awx.main.models.base import CommonModel


__all__ = ['DeployHistory']

class DeployHistory(CommonModel, ResourceMixin):
    class Meta:
        app_label: 'main'
        ordering = ('pk',)

    tree = models.TextField(blank = True, default = None)