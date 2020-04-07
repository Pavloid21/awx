from awx.main.models import DeployTemplate
from rest_framework.response import Response
from awx.api.generics import (
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
    SubListAPIView,
    SubListCreateAttachDetachAPIView,
    SubListAttachDetachAPIView,
    ResourceAccessList,
    BaseUsersList,
)
from awx.api.serializers import DeployTemplateSerializer

class DeployTemplateList(ListCreateAPIView):
    model = DeployTemplate
    serializer_class = DeployTemplateSerializer

    def get_queryset(self):
        qs = DeployTemplate.objects.all()
        # qs = qs.select_related('admin_role', 'auditor_role', 'member_role', 'read_role')
        # qs = qs.prefetch_related('created_by', 'modified_by')
        return qs
        # qs = DeployHistory.objects.all()
        # serializer = DeployHistorySerializer(qs, many=True)
        # return Response({'history': serializer.data})

class DeployTemplateDetail(RetrieveUpdateDestroyAPIView):
    model = DeployTemplate
    serializer_class = DeployTemplateSerializer
