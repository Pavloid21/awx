from awx.main.models import DeployHistory
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
from awx.api.serializers import DeployHistorySerializer

class DeployList(ListCreateAPIView):
    model = DeployHistory
    serializer_class = DeployHistorySerializer

    def get_queryset(self):
        qs = DeployHistory.objects.all()
        # qs = qs.select_related('admin_role', 'auditor_role', 'member_role', 'read_role')
        # qs = qs.prefetch_related('created_by', 'modified_by')
        return qs
        # qs = DeployHistory.objects.all()
        # serializer = DeployHistorySerializer(qs, many=True)
        # return Response({'history': serializer.data})

class DeployDetail(RetrieveUpdateDestroyAPIView):
    model = DeployHistory
    serializer_class = DeployHistorySerializer
