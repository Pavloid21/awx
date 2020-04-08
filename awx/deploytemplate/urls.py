# Copyright (c) 2016 Ansible, Inc.
# All Rights Reserved.


from django.conf.urls import url
from awx.deploy.views import (
    UploadFile,
)
from awx.deploytemplate.views import (
    SaveTemplate,
    GetTemplates
)

app_name = 'deploytemplate_cnf'
urlpatterns = [
    url(r'^uploads/$', UploadFile.as_view(), name='uploads'),
    url(r'^save/$', SaveTemplate.as_view(), name='save-template'),
    url(r'^rows/$', GetTemplates.as_view(), name='deploy-history-rows'),
    # url(r'^next_step/$', DeployHistoryNextStep.as_view(), name='deploy-next-step'),
]

