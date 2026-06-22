from rest_framework import serializers
from .models import Dispute, Evidence


class EvidenceSerializer(serializers.ModelSerializer):
    uploaded_by_phone = serializers.CharField(
        source='uploaded_by.phone', read_only=True
    )

    class Meta:
        model  = Evidence
        fields = [
            'id',
            'type',
            'storage_url',
            'hash_sha256',
            'metadata',
            'uploaded_by_phone',
            'created_at',
        ]
        read_only_fields = [
            'id', 'hash_sha256', 'uploaded_by_phone', 'created_at'
        ]


class EvidenceUploadSerializer(serializers.Serializer):
    """Sérialiseur pour l'upload d'une pièce jointe."""
    type = serializers.ChoiceField(choices=Evidence.EvidenceType.choices)
    file = serializers.FileField()
    metadata = serializers.JSONField(required=False, default=dict)

    def validate_file(self, value):
        # Max 10 MB
        max_size = 10 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("Fichier trop volumineux. Maximum 10 MB.")

        # Types autorisés
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf']
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                "Type de fichier non autorisé. Formats acceptés : JPG, PNG, WEBP, MP4, PDF."
            )
        return value


class DisputeOpenSerializer(serializers.ModelSerializer):
    """Ouverture d'un nouveau litige."""

    class Meta:
        model  = Dispute
        fields = ['reason', 'description']

    def validate_description(self, value):
        if len(value.strip()) < 20:
            raise serializers.ValidationError(
                "La description doit contenir au moins 20 caractères."
            )
        return value


class DisputeResolveSerializer(serializers.Serializer):
    """Résolution d'un litige par un admin."""
    decision = serializers.ChoiceField(choices=Dispute.Decision.choices)
    notes    = serializers.CharField(required=False, allow_blank=True)


class DisputeListSerializer(serializers.ModelSerializer):
    """Vue résumée pour les listes."""
    transaction_token  = serializers.CharField(source='transaction.token', read_only=True)
    opened_by_phone    = serializers.CharField(source='opened_by.phone', read_only=True)
    sla_hours_remaining = serializers.FloatField(read_only=True)

    class Meta:
        model  = Dispute
        fields = [
            'id',
            'transaction_token',
            'opened_by_phone',
            'reason',
            'status',
            'sla_hours_remaining',
            'created_at',
        ]


class DisputeDetailSerializer(serializers.ModelSerializer):
    """Vue complète d'un litige avec ses preuves."""
    evidences           = EvidenceSerializer(many=True, read_only=True)
    transaction_token   = serializers.CharField(source='transaction.token', read_only=True)
    opened_by_phone     = serializers.CharField(source='opened_by.phone', read_only=True)
    decision_by_phone   = serializers.SerializerMethodField()
    sla_hours_remaining = serializers.FloatField(read_only=True)

    class Meta:
        model  = Dispute
        fields = [
            'id',
            'transaction_token',
            'opened_by_phone',
            'reason',
            'status',
            'description',
            'decision',
            'decision_by_phone',
            'decision_at',
            'notes',
            'sla_hours_remaining',
            'evidences',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

    def get_decision_by_phone(self, obj):
        return obj.decision_by.phone if obj.decision_by else None
