from django.db import models
from rest_framework import serializers
from django.utils.translation import ugettext_lazy as _
from awx.main.models.mixins import ResourceMixin
from awx.main.models.base import CommonModel
from django.contrib.postgres.fields import ArrayField
from awx.main.fields import (
    AutoOneToOneField, ImplicitRoleField, OrderedManyToManyField
)
from awx.main.models.rbac import (
    ROLE_SINGLETON_SYSTEM_ADMINISTRATOR,
    ROLE_SINGLETON_SYSTEM_AUDITOR,
)

__all__ = ['Action']

class Action(CommonModel, ResourceMixin):
    class Meta:
        app_label: 'main'
        ordering = ('pk',)

    job_templates = models.ManyToManyField("JobTemplate", blank=True)
    extra_vars = models.TextField(blank=True)
    admin_role = ImplicitRoleField(
        parent_role='singleton:' + ROLE_SINGLETON_SYSTEM_ADMINISTRATOR,
    )
    member_role = ImplicitRoleField(
        parent_role=['admin_role']
    )