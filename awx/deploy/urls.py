# Copyright (c) 2016 Ansible, Inc.
# All Rights Reserved.


from django.conf.urls import url
from awx.deploy.views import (
    UploadFile,
    RunDeploy,
    DeployHistoryRows,
    DeployHistoryNextStep
)

app_name = 'deploy_cnf'
urlpatterns = [
    url(r'^uploads/$', UploadFile.as_view(), name='uploads'),
    url(r'^launch/$', RunDeploy.as_view(), name='run-deploy'),
    url(r'^rows/$', DeployHistoryRows.as_view(), name='deploy-history-rows'),
    url(r'^next_step/$', DeployHistoryNextStep.as_view(), name='deploy-next-step'),
]

