from django.views import View
from django.core.files.storage import FileSystemStorage
from django.http import Http404, JsonResponse

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

