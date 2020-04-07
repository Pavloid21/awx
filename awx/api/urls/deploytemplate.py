from django.conf.urls import url
from awx.api.views.deploytemplate import (DeployTemplateList, DeployTemplateDetail)

urls = [
    url(r'^$', DeployTemplateList.as_view(), name='deploy_template_list'),
    url(r'^(?P<pk>[0-9]+)/$', DeployTemplateDetail.as_view(), name='deploy_template_detail'),
]

__all__ = ['urls']