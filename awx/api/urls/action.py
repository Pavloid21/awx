from django.conf.urls import url
from awx.api.views.action import (ActionList, ActionDetail)

urls = [
    url(r'^$', ActionList.as_view(), name='action_list'),
    url(r'^(?P<pk>[0-9]+)/$', ActionDetail.as_view(), name='action_detail'),
]

__all__ = ['urls']