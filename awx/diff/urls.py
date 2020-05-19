# Copyright (c) 2016 Ansible, Inc.
# All Rights Reserved.


from django.conf.urls import url
from awx.diff.views import (
    EnvironmentList,
    VersionList,
    DiffView,
    DiffResultView,
    DiffFinalView,
    JobsList,
    CommitsList,
    BranchesList,
    FilesList,
    ConvertView,
    ConvertFinalView,
    Download,
    DSLFinalView,
    DownloadDSL,
    DownloadDSLArchive
)

app_name = 'diff'
urlpatterns = [
    url(r'^environments/$', EnvironmentList.as_view(), name='environment_list'),
    url(r'^environments/(?P<environment_name>[0-9_-]+)/$', VersionList.as_view(), name='version_list'),
    url(r'^compare/(?P<left_version_id>[a-z0-9-]+)/(?P<right_version_id>[a-z0-9-]+)/$', DiffView.as_view(), name='diff'),
    url(r'^results/$', DiffResultView.as_view(), name='res'),
    url(r'^final/$', DiffFinalView.as_view(), name='fin'),
    url(r'^jobs/$', JobsList.as_view(), name='jobs'),
    url(r'^commits/(?P<env>[0-9_-]+)/$', CommitsList.as_view(), name='commits_list'),
    url(r'^branches/', BranchesList.as_view(), name='branches_list'),
    url(r'^files/', FilesList.as_view(), name='files_list'),
    url(r'^convert/', ConvertView.as_view(), name='convert'),
    url(r'^cnvfinal/$', DiffFinalView.as_view(), name='cnvfin'),
    url(r'^download/$', Download.as_view(), name='dwnload'),
    url(r'^getDSLfinal/$', DSLFinalView.as_view(), name='dslfin'),
    url(r'^downloaddsl/$', DownloadDSL.as_view(), name='dwnloaddsl'),
    url(r'^downloaddslarc/$', DownloadDSLArchive.as_view(), name='dwnloaddslarch'),
]

