from django.conf.urls import url
from awx.api.views.deployhistory import (DeployList, DeployDetail)

urls = [
    url(r'^$', DeployList.as_view(), name='deploy_list'),
    url(r'^(?P<pk>[0-9]+)/$', DeployDetail.as_view(), name='deploy_detail'),
]

__all__ = ['urls']