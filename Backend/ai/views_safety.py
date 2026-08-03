# pyrefly: ignore [missing-import]
from rest_framework import viewsets
# pyrefly: ignore [missing-import]
from rest_framework.permissions import IsAdminUser
from ai.models_safety import (
    AIGovernanceConfig, AISafetyPolicy, AIPromptVersion, 
    AIContentPolicy, AIFeaturePolicy, AIGovernanceLog
)
from ai.serializers.serializers_safety import (
    AIGovernanceConfigSerializer, AISafetyPolicySerializer, AIPromptVersionSerializer, 
    AIContentPolicySerializer, AIFeaturePolicySerializer, AIGovernanceLogSerializer
)

class AIGovernanceConfigViewSet(viewsets.ModelViewSet):
    queryset = AIGovernanceConfig.objects.all()
    serializer_class = AIGovernanceConfigSerializer
    permission_classes = [IsAdminUser]


class AISafetyPolicyViewSet(viewsets.ModelViewSet):
    queryset = AISafetyPolicy.objects.all()
    serializer_class = AISafetyPolicySerializer
    permission_classes = [IsAdminUser]


class AIPromptVersionViewSet(viewsets.ModelViewSet):
    queryset = AIPromptVersion.objects.all()
    serializer_class = AIPromptVersionSerializer
    permission_classes = [IsAdminUser]


class AIContentPolicyViewSet(viewsets.ModelViewSet):
    queryset = AIContentPolicy.objects.all()
    serializer_class = AIContentPolicySerializer
    permission_classes = [IsAdminUser]


class AIFeaturePolicyViewSet(viewsets.ModelViewSet):
    queryset = AIFeaturePolicy.objects.all()
    serializer_class = AIFeaturePolicySerializer
    permission_classes = [IsAdminUser]


class AIGovernanceLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AIGovernanceLog.objects.all()
    serializer_class = AIGovernanceLogSerializer
    permission_classes = [IsAdminUser]
