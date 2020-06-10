
# Copyright (c) 2016 Ansible, Inc.
# All Rights Reserved.

# Python
import collections
import sys
import requests
import time
import json
import logging
import os
import shutil
from requests.auth import HTTPBasicAuth

# Django
from django.conf import settings
from django.http import Http404, JsonResponse, HttpResponse
from django.utils.translation import ugettext_lazy as _
from django.views import View
from django.core.exceptions import PermissionDenied

# from .diff_repository import DiffRepository


REPO_PATH = 'http://172.19.19.31/api/v4/projects'
AWX_API_PATH = 'http://127.0.0.1:8052'
# AWX_API_PATH = 'http://172.19.19.231'
LOGIN = os.environ.get('LOGIN')
PASS = os.environ.get('PASS')


class EnvironmentList(View):

    def get(self, request, *args, **kwargs):
        response = requests.get(REPO_PATH, headers={'Private-Token': '8s7Ryzi621Yhzf8hvRhP'})
        return JsonResponse({'versions': response.json()})

class JobsList(View):

    def get(self, request, *args, **kwargs):
        response = None
        response = requests.get(AWX_API_PATH + '/api/v2/jobs/?search=Compare&page_size=20&order_by=-finished&page=' + request.GET.get('page', '1'), auth=(LOGIN, PASS))
            
        return JsonResponse(response.json())

class CommitsList(View):
    def get(self, request, *args, **kwargs):
        response = requests.get(REPO_PATH + '/' + kwargs['env'] + '/repository/commits?ref_name=master', headers={'Private-Token': '8s7Ryzi621Yhzf8hvRhP'})
        return JsonResponse({'commits': response.json()})

class BranchesList(View):
    def get(self, request, *args, **kwargs):
        response = requests.get(REPO_PATH + '/' + request.GET['env'] + '/repository/branches', headers={'Private-Token': '8s7Ryzi621Yhzf8hvRhP'})
        return JsonResponse({'branches': response.json()})

class FilesList(View):
    def get(self, request, *args, **kwargs):
        ref = request.GET['ref']
        index = ref.find('?')
        reff = ref[:index]
        print(reff, index)
        if index > 0:
            response = requests.get(REPO_PATH + '/' + request.GET['env'] + '/repository/tree/?ref=' + reff + '&page=' + request.GET['page'], headers={'Private-Token': '8s7Ryzi621Yhzf8hvRhP'})
        else:
            response = requests.get(REPO_PATH + '/' + request.GET['env'] + '/repository/tree/?ref=' + request.GET['ref'] + '&page=' + request.GET['page'], headers={'Private-Token': '8s7Ryzi621Yhzf8hvRhP'})
        return JsonResponse({'files': response.json(), 'count': response.headers['X-Total']})


class VersionList(View):

    def get(self, request, *args, **kwargs):
        response = requests.get(REPO_PATH + '/' + kwargs['environment_name'] + '/repository/tags', headers={'Private-Token': '8s7Ryzi621Yhzf8hvRhP'})
        master = requests.get(REPO_PATH + '/' + kwargs['environment_name'] + '/repository/branches/master', headers={'Private-Token': '8s7Ryzi621Yhzf8hvRhP'})
        masterJSON = json.loads(master.text)
        masterJSON['target'] = masterJSON['commit']['id']
        envJSON = json.loads(response.text)
        envJSON.insert(0, masterJSON)
        return JsonResponse({'versions': envJSON})


class DiffView(View):
    def getJob(self, obj):
        getResponse = requests.get(AWX_API_PATH + '/api/v2/jobs/' + str(obj['job']) + '/', auth=(LOGIN, PASS), verify=False)
        temp = json.dumps(getResponse.json())
        result = json.loads(temp)
        global JOB_LAUNCHED
        JOB_LAUNCHED = str(result['id'])
        print('GET JOB FUNC: ' + JOB_LAUNCHED)
        return result

    def get(self, request, *args, **kwargs):
        path = AWX_API_PATH
        invId = 2
        if request.GET['isnode'] == 'production':
            path = 'http://localhost'

        print(path + '/api/v2/job_templates/'+ os.environ.get('DIFF_JOB_ID') +'/launch/')
        
        jobLaunchResponse = requests.post(path + '/api/v2/job_templates/'+ os.environ.get('DIFF_JOB_ID') +'/launch/', json={
            'extra_vars': {
                'compare_domain_one': request.GET['env1'],
                'compare_domain_two': request.GET['env2'],
                'compare_version_one': request.GET['v1'],
                'compare_version_two': request.GET['v2'],
                'composite': request.GET['composite']
            },
            'inventory': invId
        },
        auth=(LOGIN, PASS),
        verify=False)
        jsonObj = jobLaunchResponse.json()
        jsonDump = json.dumps(jsonObj)
        obj = json.loads(jsonDump)
        job = self.getJob(obj)
        status = str(job['status'])
        response = ''
        return JsonResponse(job)
        
class DiffResultView(View):
    def get(self, request, *args, **kwargs):
        getResponse = requests.get(AWX_API_PATH + '/api/v2/jobs/' + request.GET['job'] + '/', auth=(LOGIN, PASS), verify=False)
        temp = json.dumps(getResponse.json())
        result = json.loads(temp)
        return JsonResponse(result)

class DiffFinalView(View):
    def get(self, request, *args, **kwargs):
        page = 1
        if 'page' in request.GET.keys():
            page = request.GET['page']
        else:
            page = '2'
        response = requests.get(AWX_API_PATH + '/api/v2/jobs/' + request.GET['job'] + '/job_events/?page=' + page, auth=(LOGIN, PASS))
        return JsonResponse({'compare': response.json(), 'status': request.GET['status'], 'job': request.GET['job']})
class ConvertFinalView(View):
    def get(self, request, *args, **kwargs):
        response = requests.get(AWX_API_PATH + '/api/v2/jobs/' + request.GET['job'] + '/job_events/?page=1', auth=(LOGIN, PASS))
        return JsonResponse({'convert': response.json(), 'status': request.GET['status'], 'job': request.GET['job']})
class DSLFinalView(View):
    def get(self, request, *args, **kwargs):
        response = requests.get(AWX_API_PATH + '/api/v2/jobs/' + request.GET['job'] + '/job_events/?page=2', auth=(LOGIN, PASS))
        return JsonResponse({'convert': response.json(), 'status': request.GET['status'], 'job': request.GET['job']})
class ConvertView(View):
    def getJob(self, obj):
        print(obj)
        getResponse = requests.get(AWX_API_PATH + '/api/v2/jobs/' + str(obj['job']), auth=(LOGIN, PASS))
        temp = json.dumps(getResponse.json())
        result = json.loads(temp)
        global JOB_LAUNCHED
        JOB_LAUNCHED = str(result['id'])
        print('GET JOB FUNC: ' + JOB_LAUNCHED)
        return result

    def post(self, request, *args, **kwargs):
        # data = json.loads(request.body)
        # with open(settings.MEDIA_ROOT + '/' + request.GET['hash'] +'/data.json', 'w', encoding='utf-8') as f:
        #     json.dump(data, f, ensure_ascii=False, indent=4)
        jobLaunchResponse = requests.post(AWX_API_PATH + '/api/v2/job_templates/'+ os.environ['CONVERT_XLSX_JOB_ID'] +'/launch/', json={
            'extra_vars': {
                'git_vars': {
                    'repo_name': request.GET['repo'],
                    'branch': request.GET['branch']
                },
                'hash_dir': request.GET['hash']
            }
        }, auth=(LOGIN, PASS))
        jsonObj = jobLaunchResponse.json()
        jsonDump = json.dumps(jsonObj)
        obj = json.loads(jsonDump)
        job = self.getJob(obj)
        status = str(job['status'])
        response = ''
        return JsonResponse(job)

class Download(View):
    def get(self, request, *args, **kwargs):
        file_path = os.path.join(settings.MEDIA_ROOT + '/' + request.GET['hash'] + '/', request.GET['file'])
        if os.path.exists(file_path):
                fh = open(file_path, 'rb')
                file_data = fh.read()
                response = HttpResponse(file_data, content_type='application/octet-stream')
                response['Content-Disposition'] = 'attachment; filename=' + request.GET['file']
                return response
        raise Http404

class DownloadPDF(View):
    def get(self, request, *args, **kwargs):
        file_path = os.path.join(settings.MEDIA_ROOT + '/' + request.GET['job'] + '/', 'changes.pdf')
        if os.path.exists(file_path):
                fh = open(file_path, 'rb')
                file_data = fh.read()
                response = HttpResponse(file_data, content_type='application/octet-stream')
                response['Content-Disposition'] = 'attachment; filename=changes.pdf'
                return response
        raise Http404

class ReadDiffJSON(View):
    def get(self, request, *args, **kwargs):
        file_path = os.path.join(settings.MEDIA_ROOT + '/' + request.GET['job'] + '/', request.GET['file'])
        if os.path.exists(file_path):
                fh = open(file_path, 'rb')
                file_data = fh.read()
                print(file_data)
                return JsonResponse({'results': json.loads(file_data)})
        raise Http404

class DownloadDSL(View):
    def post(self, request, *args, **kwargs):
        data = json.loads(request.body)
        file_path = os.path.join(settings.MEDIA_ROOT + '/' + request.GET['hash'] + '/', data['dsl']['name']+'_jenkins.dsl')
        if os.path.exists(file_path):
                fh = open(file_path, 'rb')
                file_data = fh.read()
                response = HttpResponse(file_data, content_type='application/octet-stream')
                response['Content-Disposition'] = 'attachment; filename=' + data['dsl']['name']+'_jenkins.dsl'
                # response['Content-Disposition'] = 'inline; filename=' + os.path.basename(file_path)
                return response
        raise Http404

class DownloadDSLArchive(View):
    def get(self, request, *args, **kwargs):
        shutil.make_archive(os.path.join(settings.MEDIA_ROOT + '/' + request.GET['hash'] + '/', 'archive'), 'zip', os.path.join(settings.MEDIA_ROOT + '/' + request.GET['hash']))
        return JsonResponse({'path' : os.path.join(settings.MEDIA_ROOT + '/' + request.GET['hash'] + '/', 'archive')})
# Create view functions for all of the class-based views to simplify inclusion
# in URL patterns and reverse URL lookups, converting CamelCase names to
# lowercase_with_underscore (e.g. MyView.as_view() becomes my_view).

#this_module = sys.modules[__name__]
#for attr, value in list(locals().items()):
    #if isinstance(value, type) and issubclass(value, APIView):
        #name = camelcase_to_underscore(attr)
        #view = value.as_view()
        #setattr(this_module, name, view)

