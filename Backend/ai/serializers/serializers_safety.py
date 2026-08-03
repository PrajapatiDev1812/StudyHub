# pyrefly: ignore [missing-import]
from rest_framework import serializers
from ai.models_safety import (
    AIGovernanceConfig, AISafetyPolicy, AIPromptVersion, 
    AIContentPolicy, AIFeaturePolicy, AISafetyViolationCounter, AIGovernanceLog
)

class AIGovernanceConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIGovernanceConfig
        fields = '__all__'


class AISafetyPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = AISafetyPolicy
        fields = '__all__'


class AIPromptVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIPromptVersion
        fields = '__all__'


class AIContentPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = AIContentPolicy
        fields = '__all__'


class AIFeaturePolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = AIFeaturePolicy
        fields = '__all__'


class AISafetyViolationCounterSerializer(serializers.ModelSerializer):
    class Meta:
        model = AISafetyViolationCounter
        fields = '__all__'


class AIGovernanceLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIGovernanceLog
        fields = '__all__'
