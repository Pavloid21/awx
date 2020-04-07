from django.db import models
from rest_framework import serializers
from django.utils.translation import ugettext_lazy as _
from awx.main.models.mixins import ResourceMixin
from awx.main.models.base import CommonModel
from django.contrib.postgres.fields import ArrayField

class DeployTemplate(CommonModel, ResourceMixin):
    class Meta:
        app_label: 'main'
        ordering = ('pk',)

    config = models.CharField(max_length=256)
    deployHistoryIds = ArrayField(models.IntegerField())