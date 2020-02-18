# Copyright (c) 2016 Ansible, Inc.
# All Rights Reserved.


from django.conf.urls import url
from awx.diff.views import (
    EnvironmentList,
    VersionList,
    DiffView,
)

app_name = 'diff'
urlpatterns = [
    url(r'^environments/$', EnvironmentList.as_view(), name='environment_list'),
    url(r'^environments/(?P<environment_name>[0-9_-]+)/$', VersionList.as_view(), name='version_list'),
    url(r'^compare/(?P<left_version_id>[a-z0-9-]+)/(?P<right_version_id>[a-z0-9-]+)/$', DiffView.as_view(), name='diff'),
]

