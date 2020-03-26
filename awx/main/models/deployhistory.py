from django.db import models
from rest_framework import serializers
from django.utils.translation import ugettext_lazy as _
from awx.main.models.mixins import ResourceMixin
from awx.main.models.base import CommonModel

class DeployHistory(CommonModel, ResourceMixin):
    class Meta:
        app_label: 'main'
        ordering = ('pk',)

    status = models.CharField(
        max_length=256,
        blank=True,
        help_text=_('Job task status')
    )
    # user = models.ForeignKey('auth.User', related_name='+', blank=False, null=False, on_delete=models.CASCADE)
    config = models.CharField(max_length=256)
    domain = models.CharField(max_length=256)
    prev_step_id = models.IntegerField(blank=True, null=True)