# Python
import collections
import sys
import requests
import time
import json
import logging
from requests.auth import HTTPBasicAuth

# Django
from django.conf import settings
from django.http import Http404, JsonResponse
from django.utils.translation import ugettext_lazy as _
from django.views import View
from django.core.exceptions import PermissionDenied

REPO_PATH = 'http://172.19.19.31/api/v4/projects'
AWX_API_PATH = 'https://127.0.0.1:8043'
# AWX_API_PATH = 'http://172.19.19.231'

class SaveTemplate(View):
    def saveData(self, item, prevStep):
        step = item
        if prevStep != None:
            itemJSON = item
            itemJSON['prev_step_id'] = prevStep
            step = itemJSON
        savedData = requests.post(AWX_API_PATH + '/api/v2/deploy_history/', json=step,
        auth=('admin', 'password'),
        verify=False)
        print('saved: ' + savedData.text)
        return savedData.text
    def post(self, request, *args, **kwargs):
        print(request.body)
        prevStep = None
        ids = []
        dataList = json.loads(request.body)
        for item in dataList['list']:
            prevStep = json.loads(self.saveData(item, prevStep))['id']
            ids.append(prevStep)
        requests.post(AWX_API_PATH + '/api/v2/deploy_template/', json={
            'name': dataList['name'],
            'config': dataList['config'],
            'deployHistoryIds': ids
        },
        auth=('admin', 'password'),
        verify=False)
        return JsonResponse({'data': json.loads(request.body)})