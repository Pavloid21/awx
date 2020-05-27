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
import os
import binascii
from requests.auth import HTTPBasicAuth
from django.conf import settings
import shutil

# AWX_API_PATH = 'http://172.19.19.231'
AWX_API_PATH = 'http://127.0.0.1:8052'
LOGIN = os.environ.get('LOGIN')
PASS = os.environ.get('PASS')

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

class UploadFileHash(View):
    def post(self, request, *args, **kwargs):
        if request.method == "POST":
            hashFolder = request.GET['hash']
            file = request.FILES['file']
            fs = FileSystemStorage()
            filename = fs.save(hashFolder + '/edited_xlsx/' + file.name, file)
            uploaded_file_url = fs.url(filename)
            os.chmod(settings.MEDIA_ROOT + '/' + hashFolder, 0o0777)
            return JsonResponse({'status': 'success', 'url': uploaded_file_url})
        return JsonResponse({'status': 'failed'})

class RunDeploy(View):
    def getJob(self, obj):
        getResponse = requests.get(AWX_API_PATH + '/api/v2/jobs/' + str(obj['job']), auth=(LOGIN, PASS), verify=False)
        temp = json.dumps(getResponse.json())
        result = json.loads(temp)
        return result

    def get(self, request, *args, **kwargs):
        response = requests.get(AWX_API_PATH + '/api/v2/inventories/', auth=(LOGIN, PASS), verify=False)
        inventories = json.loads(response.text)
        prevStep = None
        actionsResponse = requests.get(AWX_API_PATH + '/api/v2/action/' + str(request.GET['action'][0]) + '/', auth=(LOGIN, PASS), verify=False)
        action = json.loads(actionsResponse.text)
        if request.GET['prevstep'].isnumeric():
            prevStep = request.GET['prevstep']

        for inventory in inventories['results']:
            if inventory['name'] == request.GET['inventory']:
                extraVars = json.loads(action['extra_vars'])
                extraVars["deploy_file"] = request.GET["file"]
                print(extraVars)
                launch = requests.post(AWX_API_PATH + '/api/v2/job_templates/' + str(action['job_templates'][0]) + '/launch/', json={
                    'extra_vars': extraVars,
                    'inventory': inventory['id'],
                },
                auth=(LOGIN, PASS),
                verify=False)
                test = requests.post(AWX_API_PATH + '/api/v2/deploy_history/', json={
                    'status': 'pending',
                    'name': ''.join(random.choice(string.ascii_letters) for _ in range(12)),
                    "description": "",
                    'config': request.GET['file'],
                    'domain': request.GET['domain'],
                    'action': [action['id']],
                    'prev_step_id': prevStep
                }, 
                auth=(LOGIN, PASS),
                verify=False)
                testJson = json.loads(json.dumps(test.json()))
                jsonObj = launch.json()
                jsonDump = json.dumps(jsonObj)
                obj = json.loads(jsonDump)
                job = self.getJob(obj)
                return JsonResponse({'job': job, 'prevStep': testJson['id']})
        return JsonResponse({'status': 'failed', 'description': 'inventory not exists'})

class DeployHistoryRows(View):
    def get(self, request, *args, **kwargs):
        response = requests.get(AWX_API_PATH + '/api/v2/deploy_history/?prev_step_id__isnull=true&not__status=start', auth=(LOGIN, PASS), verify=False)
        rows = json.loads(response.text)
        return JsonResponse(rows)

class SQL2ExcelJobHistory(View):
    def get(self, request, *args, **kwargs):
        url = AWX_API_PATH + '/api/v2/jobs/?unified_job_template=' + os.environ['CONVERT_XLSX_JOB_ID'] + '&status=successful&order_by=-created'
        if 'page_size' in request.GET.keys():
            url = url + '&page_size=' + request.GET['page_size']
        if 'page' in request.GET.keys():
            url = url + '&page=' + request.GET['page']
        response = requests.get(url, auth=(LOGIN, PASS), verify=False)
        rows = json.loads(response.text)
        return JsonResponse(rows)

class EXCEL2SQlJobHistory(View):
    def get(self, request, *args, **kwargs):
        url = AWX_API_PATH + '/api/v2/jobs/?unified_job_template=' + os.environ['CONVERT_DICT_JOB_ID'] + '&status=successful&order_by=-created'
        if 'page_size' in request.GET.keys():
            url = url + '&page_size=' + request.GET['page_size']
        if 'page' in request.GET.keys():
            url = url + '&page=' + request.GET['page']
        response = requests.get(url, auth=(LOGIN, PASS), verify=False)
        rows = json.loads(response.text)
        return JsonResponse(rows)

class DeployHistoryNextStep(View):
    def get(self, request, *args, **kwargs):
        response = requests.get(AWX_API_PATH + '/api/v2/deploy_history/?prev_step_id=' + request.GET['id'], auth=(LOGIN, PASS), verify=False)
        rows = json.loads(response.text)
        return JsonResponse(rows)

class GetCard(View):
    def get(self, request, *args, **kwargs):
        response = requests.get(AWX_API_PATH + '/api/v2/deploy_history/' + request.GET['id'] + '/', auth=(LOGIN, PASS), verify=False)
        card = json.loads(response.text)
        return JsonResponse(card)

class SaveConvert(View):
    def post(self, request, *args, **kwargs):
        data = json.loads(request.body)
        filename = "data.json"
        dirname = os.path.dirname(filename)
        if not os.path.exists(os.path.join(settings.MEDIA_ROOT, request.GET['hash'], dirname)):
            os.makedirs(os.path.join(settings.MEDIA_ROOT, request.GET['hash'], dirname))
        with open(settings.MEDIA_ROOT + '/' + request.GET['hash'] + '/data.json', 'w+', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        os.chmod(os.path.join(settings.MEDIA_ROOT, request.GET['hash']), 0o0777)
        return JsonResponse({'hash': request.GET['hash']})

# class SaveDSL(View):
#     def randomString(arg):
#         return binascii.hexlify(os.urandom(10))
#     def post(self, request, *args, **kwargs):
#         data = json.loads(request.body)
#         hash = self.randomString().decode('utf-8')
#         filename = "data2.json"
#         dirname = os.path.dirname(filename)
#         with open(settings.MEDIA_ROOT + '/' + request.GET['hash'] + '/data2.json', 'w', encoding='utf-8') as f:
#             f.write(str(data))
#         shutil.copyfile(settings.MEDIA_ROOT + '/' + request.GET['hash'] + '/data2.json', settings.MEDIA_ROOT + '/' + request.GET['hash'] + '/data.json')
#         os.remove(settings.MEDIA_ROOT + '/' + request.GET['hash'] + '/data2.json')
#         return JsonResponse({'hash': hash})

class SaveDSL(View):
    def randomString(arg):
        return binascii.hexlify(os.urandom(10))
    def post(self, request, *args, **kwargs):
        data = json.loads(request.body).replace('\'', '"')
        hash = self.randomString().decode('utf-8')
        os.remove(settings.MEDIA_ROOT + '/' + request.GET['hash'] + '/data.json')
        with open(settings.MEDIA_ROOT + '/' + request.GET['hash'] + '/data.json', 'w+', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        return JsonResponse({'hash': hash})

class ConvertDiff(View):
    def getJob(self, obj):
        getResponse = requests.get(AWX_API_PATH + '/api/v2/jobs/' + str(obj['job']), auth=(LOGIN, PASS), verify=False)
        temp = json.dumps(getResponse.json())
        result = json.loads(temp)
        return result

    def post(self, request, *args, **kwargs):
        var = json.loads(request.body)
        launch = requests.post(AWX_API_PATH + '/api/v2/job_templates/' + os.environ['CONVERT_DICT_JOB_ID'] + '/launch/', json={
                    'extra_vars': {
                        'git_vars': {
                            'repo_name': var['reponame'],
                            'branch': var['branch'],
                        },
                        'hash_dir': var['hash']
                    },
                },
                auth=(LOGIN, PASS),
                verify=False)
        jsonObj = launch.json()
        jsonDump = json.dumps(jsonObj)
        obj = json.loads(jsonDump)
        job = self.getJob(obj)
        return JsonResponse(job)
        
class getDSL(View):
    def getJob(self, obj):
        getResponse = requests.get(AWX_API_PATH + '/api/v2/jobs/' + str(obj['job']), auth=(LOGIN, PASS), verify=False)
        temp = json.dumps(getResponse.json())
        result = json.loads(temp)
        return result

    def post(self, request, *args, **kwargs):
        var = json.loads(request.body)
        launch = requests.post(AWX_API_PATH + '/api/v2/job_templates/' + os.environ['COMMIT_DSL'] + '/launch/', json={
                    'extra_vars': {
                        'git_vars': {
                            'repo_name': var['reponame'],
                            'branch': var['branch'],
                        },
                        'hash_dir': var['hash']
                    },
                },
                auth=(LOGIN, PASS),
                verify=False)
        jsonObj = launch.json()
        jsonDump = json.dumps(jsonObj)
        obj = json.loads(jsonDump)
        job = self.getJob(obj)
        return JsonResponse(job)
        