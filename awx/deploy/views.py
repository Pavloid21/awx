from django.views import View
from django.core.files.storage import FileSystemStorage
from django.http import Http404, JsonResponse
import datetime
# Python
import collections
import sys
import requests
import time
import json
import logging
import random
import string
from requests.auth import HTTPBasicAuth

# AWX_API_PATH = 'http://172.19.19.231'
AWX_API_PATH = 'http://127.0.0.1:8052'

class UploadFile(View):
    def post(self, request, *args, **kwargs):
        if request.method == "POST":
            print(request)
            file = request.FILES['file']
            fs = FileSystemStorage()
            filename = fs.save(file.name, file)
            uploaded_file_url = fs.url(filename)
            return JsonResponse({'status': 'success', 'url': uploaded_file_url})
        return JsonResponse({'status': 'failed'})

class RunDeploy(View):
    def getJob(self, obj):
        getResponse = requests.get(AWX_API_PATH + '/api/v2/jobs/' + str(obj['job']), auth=('admin', 'password'))
        temp = json.dumps(getResponse.json())
        result = json.loads(temp)
        return result

    def get(self, request, *args, **kwargs):
        response = requests.get(AWX_API_PATH + '/api/v2/inventories/', auth=('admin', 'password'))
        inventories = json.loads(response.text)
        prevStep = None
        if request.GET['prevstep'].isnumeric():
            prevStep = request.GET['prevstep']

        for inventory in inventories['results']:
            if inventory['name'] == request.GET['inventory']:
                launch = requests.post(AWX_API_PATH + '/api/v2/job_templates/11/launch/', json={
                    'extra_vars': {
                        'deploy_file': request.GET['file'],
                    },
                    'inventory': inventory['id'],
                },
                auth=('admin', 'password'))
                test = requests.post(AWX_API_PATH + '/api/v2/deploy_history/', json={
                    'status': 'pending',
                    'name': ''.join(random.choice(string.ascii_letters) for _ in range(12)),
                    "description": "",
                    'config': request.GET['file'],
                    'domain': request.GET['domain'],
                    'prev_step_id': prevStep
                }, 
                auth=('admin', 'password'),
                verify=False)
                testJson = json.loads(json.dumps(test.json()))
                jsonObj = launch.json()
                jsonDump = json.dumps(jsonObj)
                obj = json.loads(jsonDump)
                job = self.getJob(obj)
                print(str(testJson))
                return JsonResponse({'job': job, 'prevStep': testJson['id']})
        return JsonResponse({'status': 'failed', 'description': 'inventory not exists'})

class DeployHistoryRows(View):
    def get(self, request, *args, **kwargs):
        response = requests.get(AWX_API_PATH + '/api/v2/deploy_history/?prev_step_id__isnull=true&not__status=start', auth=('admin', 'password'), verify=False)
        rows = json.loads(response.text)
        return JsonResponse(rows)

class DeployHistoryNextStep(View):
    def get(self, request, *args, **kwargs):
        response = requests.get(AWX_API_PATH + '/api/v2/deploy_history/?prev_step_id=' + request.GET['id'], auth=('admin', 'password'), verify=False)
        rows = json.loads(response.text)
        return JsonResponse(rows)