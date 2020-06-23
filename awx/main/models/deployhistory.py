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

    status = models.CharField(
        max_length=256,
        blank=True,
        help_text=_('Job task status')
    )
    config = models.CharField(max_length=256, blank=True)
    domain = models.CharField(max_length=256)
    setuper = models.BooleanField(default=None)
    picker = models.BooleanField(default=None)
    job = models.ForeignKey(
        'Job',
        related_name='%(class)ss',
        blank=True,
        null=True,
        default=None,
        on_delete=models.SET_NULL,
    )
    action = models.ManyToManyField("Action", blank=True)
    prev_step_id = models.IntegerField(blank=True, null=True)
    on_success = models.IntegerField(blank=True, null=True)
    on_failed = models.IntegerField(blank=True, null=True)