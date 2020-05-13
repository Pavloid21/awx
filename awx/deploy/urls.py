# Copyright (c) 2016 Ansible, Inc.
# All Rights Reserved.


from django.conf.urls import url
from awx.deploy.views import (
    UploadFile,
    RunDeploy,
    DeployHistoryRows,
    DeployHistoryNextStep,
    GetCard,
    SaveConvert,
    UploadFileHash,
    ConvertDiff,
    SaveDSL,
    getDSL
)

app_name = 'deploy_cnf'
urlpatterns = [
    url(r'^uploads/$', UploadFile.as_view(), name='uploads'),
    url(r'^uphash/$', UploadFileHash.as_view(), name='uphash'),
    url(r'^launch/$', RunDeploy.as_view(), name='run-deploy'),
    url(r'^rows/$', DeployHistoryRows.as_view(), name='deploy-history-rows'),
    url(r'^next_step/$', DeployHistoryNextStep.as_view(), name='deploy-next-step'),
    url(r'^step/$', GetCard.as_view(), name="deploy-card"),
    url(r'^saveconvert/$', SaveConvert.as_view(), name="save-convert"),
    url(r'^savedsl/$', SaveDSL.as_view(), name="save-dsl"),
    url(r'^convertdiff/$', ConvertDiff.as_view(), name="convert-diff"),
    url(r'^getdsl/$', getDSL.as_view(), name="get-dsl"),
]

