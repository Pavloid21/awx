# Django
from django.apps import AppConfig
# from django.core import checks
from django.utils.translation import ugettext_lazy as _


class DeployTemplateConfig(AppConfig):

    name = 'awx.deploytemplate'
    #verbose_name = _('Configuration')

