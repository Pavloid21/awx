# Copyright (c) 2016 Ansible, Inc.
# All Rights Reserved.


from django.conf.urls import url
from awx.deploy.views import (
    UploadFile
)

app_name = 'deploy_cnf'
urlpatterns = [
    url(r'^uploads/$', UploadFile.as_view(), name='uploads')
]

