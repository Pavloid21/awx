# Copyright (c) 2016 Ansible, Inc.
# All Rights Reserved.


from django.conf.urls import url
from awx.deploy.views import (
    UploadFile,
)
from awx.deploytemplate.views import (
    SaveTemplate,
    GetTemplates,
    DeleteTemplate,
    GetJobTemplates,
    SaveAction,
    GetActions,
    DeleteAction
)

app_name = 'deploytemplate_cnf'
urlpatterns = [
    url(r'^uploads/$', UploadFile.as_view(), name='uploads'),
    url(r'^save/$', SaveTemplate.as_view(), name='save-template'),
    url(r'^rows/$', GetTemplates.as_view(), name='deploy-history-rows'),
    url(r'^delete/$', DeleteTemplate.as_view(), name='deploy-history-delete'),
    url(r'^job_templates/$', GetJobTemplates.as_view(), name='get-job-templates'),
    url(r'^actionsave/$', SaveAction.as_view(), name='save-action'),
    url(r'^actions/$', GetActions.as_view(), name='get-action'),
    url(r'^deleteaction/$', DeleteAction.as_view(), name='action-delete'),
]

