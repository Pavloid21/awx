from awx.main.models import (
    DeployTemplate,
    Inventory,
    Team
)
from django.db.models import Count
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

    def get_serializer_context(self, *args, **kwargs):
        full_context = super(DeployTemplateDetail, self).get_serializer_context(*args, **kwargs)

        if not hasattr(self, 'kwargs') or 'pk' not in self.kwargs:
            return full_context
        org_id = int(self.kwargs['pk'])

        org_counts = {}
        access_kwargs = {'accessor': self.request.user, 'role_field': 'read_role'}
        direct_counts = DeployTemplate.objects.filter(id=org_id).annotate(
            users=Count('member_role__members', distinct=True),
            admins=Count('admin_role__members', distinct=True)
        ).values('users', 'admins')

        if not direct_counts:
            return full_context

        org_counts = direct_counts[0]
        # org_counts['inventories'] = Inventory.accessible_objects(**access_kwargs).filter(
        #     organization__id=org_id).count()
        # org_counts['teams'] = Team.accessible_objects(**access_kwargs).filter(
        #     organization__id=org_id).count()
        org_counts['templates'] = DeployTemplate.accessible_objects(**access_kwargs).filter(
            id=org_id).count()
        # org_counts['projects'] = Project.accessible_objects(**access_kwargs).filter(
        #     organization__id=org_id).count()
        # org_counts['job_templates'] = JobTemplate.accessible_objects(**access_kwargs).filter(
        #     project__organization__id=org_id).count()

        full_context['related_field_counts'] = {}
        full_context['related_field_counts'][org_id] = org_counts

        return full_context
