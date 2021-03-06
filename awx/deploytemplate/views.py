# Python
import collections
import sys
import requests
import time
import json
import logging
import os
from requests.auth import HTTPBasicAuth

# Django
from django.conf import settings
from django.http import Http404, JsonResponse
from django.utils.translation import ugettext_lazy as _
from django.views import View
from django.core.exceptions import PermissionDenied

REPO_PATH = 'http://172.19.19.31/api/v4/projects'
AWX_API_PATH = 'https://127.0.0.1:8052'
# AWX_API_PATH = 'http://172.19.19.231'
LOGIN = os.environ.get('LOGIN')
PASS = os.environ.get('PASS')

class SaveTemplate(View):
    def saveData(self, item, prevStep):
        step = item
        if prevStep != None:
            itemJSON = item
            itemJSON['prev_step_id'] = prevStep
            step = itemJSON
        savedData = requests.post(AWX_API_PATH + '/api/v2/deploy_history/', json=step,
        auth=(LOGIN, PASS),
        verify=False)
        return savedData.text
    def post(self, request, *args, **kwargs):
        prevStep = None
        ids = []
        dataList = json.loads(request.body)
        for item in dataList['list']:
            prevStep = json.loads(self.saveData(item, prevStep))['id']
            ids.append(prevStep)
        requests.post(AWX_API_PATH + '/api/v2/deploy_template/', json={
            'name': dataList['name'],
            'deployHistoryIds': ids
        },
        auth=(LOGIN, PASS),
        verify=False)
        return JsonResponse({'data': json.loads(request.body)})

class GetTemplates(View):
    def get(self, request, *args, **kwargs):
        templatesList = requests.get(AWX_API_PATH + '/api/v2/deploy_template/?order=-created',
        auth=(LOGIN, PASS),
        verify=False)
        return JsonResponse(json.loads(templatesList.text))

class DeleteTemplate(View):
    def get(self, request, *args, **kwargs):
        result = requests.delete(AWX_API_PATH + '/api/v2/deploy_template/' + request.GET['id'] + '/',
        auth=(LOGIN, PASS),
        verify=False)
        return JsonResponse(json.loads('{}'))

class GetJobTemplates(View):
    def get(self, request, *args, **kwargs):
        result = requests.get(AWX_API_PATH + '/api/v2/job_templates/',
        auth=(LOGIN, PASS),
        verify=False)
        return JsonResponse(json.loads(result.text))

class SaveAction(View):
    def post(self, request, *args, **kwargs):
        dataList = json.loads(request.body)
        result = requests.post(AWX_API_PATH + '/api/v2/action/', json={
            "name": dataList['name'],
            "extra_vars": dataList['extravars'],
            "job_templates": dataList['jobtemplate']
        },
        auth=(LOGIN, PASS),
        verify=False)
        return JsonResponse(json.loads(result.text))

class GetActions(View):
    def get(self, request, *args, **kwargs):
        result = requests.get(AWX_API_PATH + '/api/v2/action/?order_by=-created',
        auth=(LOGIN, PASS),
        verify=False)
        return JsonResponse(json.loads(result.text))

class DeleteAction(View):
    def get(self, request, *args, **kwargs):
        result = requests.delete(AWX_API_PATH + '/api/v2/action/' + request.GET['id'] + '/',
        auth=(LOGIN, PASS),
        verify=False)
        return JsonResponse(json.loads('{}'))