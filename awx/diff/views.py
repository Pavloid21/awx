
# Copyright (c) 2016 Ansible, Inc.
# All Rights Reserved.

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

# from .diff_repository import DiffRepository


REPO_PATH = 'http://172.19.19.31/api/v4/projects'
AWX_API_PATH = 'http://127.0.0.1:8052'
# AWX_API_PATH = 'http://172.19.19.231'


class EnvironmentList(View):

    def get(self, request, *args, **kwargs):
        response = requests.get(REPO_PATH, headers={'Private-Token': 'znhhCk-fnMpdBZB-snuy'})
        return JsonResponse({'versions': response.json()})


class VersionList(View):

    def get(self, request, *args, **kwargs):
        response = requests.get(REPO_PATH + '/' + kwargs['environment_name'] + '/repository/tags', headers={'Private-Token': 'znhhCk-fnMpdBZB-snuy'})
        master = requests.get(REPO_PATH + '/' + kwargs['environment_name'] + '/repository/branches/master', headers={'Private-Token': 'znhhCk-fnMpdBZB-snuy'})
        masterJSON = json.loads(master.text)
        masterJSON['target'] = masterJSON['commit']['id']
        envJSON = json.loads(response.text)
        envJSON.insert(0, masterJSON)
        # result = json.dumps(envJSON)
        return JsonResponse({'versions': envJSON})


class DiffView(View):
    def getJob(self, obj):
        getResponse = requests.get(AWX_API_PATH + '/api/v2/jobs/' + str(obj['job']), auth=('admin', 'password'))
        temp = json.dumps(getResponse.json())
        result = json.loads(temp)
        global JOB_LAUNCHED
        JOB_LAUNCHED = str(result['id'])
        print('GET JOB FUNC: ' + JOB_LAUNCHED)
        return result

    def get(self, request, *args, **kwargs):
        path = AWX_API_PATH
        invId = 3
        # inventoryList = requests.get(AWX_API_PATH + '/api/v2/inventories', auth=('admin', 'password'))
        # if request.GET['env1'] == request.GET['env2']:
        #     inventories = json.loads(inventoryList.text)
        #     for inventory in inventories['results']:
        #         if inventory['name'] == request.GET['env1']:
        #             invId = inventory['id']
        if request.GET['isnode'] == 'production':
            path = 'http://localhost'
        
        jobLaunchResponse = requests.post(path + '/api/v2/job_templates/13/launch/', json={
            'extra_vars': {
                'compare_domain_one': request.GET['env1'],
                'compare_domain_two': request.GET['env2'],
                'compare_version_one': request.GET['v1'],
                'compare_version_two': request.GET['v2'],
                'composite': request.GET['composite']
            },
            'inventory': invId
        },
        auth=('admin', 'password'))
        jsonObj = jobLaunchResponse.json()
        jsonDump = json.dumps(jsonObj)
        obj = json.loads(jsonDump)
        job = self.getJob(obj)
        status = str(job['status'])
        response = ''
        return JsonResponse(job)
        # while status != 'failed' and status != 'successful':
        #     time.sleep(10)
        #     logging.info(str(job['status']))
        #     job = self.getJob(obj)
        #     status = str(job['status'])
        # else:
        #     if str(job['status']) == 'failed':
        #         response = { 'status': 'failed', 'job': str(job['id'])}
        #         return JsonResponse(response)
        #     else:
        #         response = requests.get(path + '/api/v2/jobs/' + str(obj['job']) + '/job_events/?page=2', auth=('admin', 'password'))
        #         return JsonResponse({'compare': response.json(), 'status': str(job['status']), 'job': str(obj['job'])})
        
class DiffResultView(View):
    def get(self, request, *args, **kwargs):
        getResponse = requests.get(AWX_API_PATH + '/api/v2/jobs/' + request.GET['job'], auth=('admin', 'password'))
        temp = json.dumps(getResponse.json())
        result = json.loads(temp)
        return JsonResponse(result)

class DiffFinalView(View):
    def get(self, request, *args, **kwargs):
        response = requests.get(AWX_API_PATH + '/api/v2/jobs/' + request.GET['job'] + '/job_events/?page=2', auth=('admin', 'password'))
        return JsonResponse({'compare': response.json(), 'status': request.GET['status'], 'job': request.GET['job']})
# Create view functions for all of the class-based views to simplify inclusion
# in URL patterns and reverse URL lookups, converting CamelCase names to
# lowercase_with_underscore (e.g. MyView.as_view() becomes my_view).

#this_module = sys.modules[__name__]
#for attr, value in list(locals().items()):
    #if isinstance(value, type) and issubclass(value, APIView):
        #name = camelcase_to_underscore(attr)
        #view = value.as_view()
        #setattr(this_module, name, view)

