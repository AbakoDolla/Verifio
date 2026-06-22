from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Vue d'une notification pour l'utilisateur."""

    class Meta:
        model  = Notification
        fields = [
            'id',
            'channel',
            'notif_type',
            'status',
            'message',
            'sent_at',
            'delivered_at',
            'created_at',
        ]
        read_only_fields = fields


class NotificationAdminSerializer(serializers.ModelSerializer):
    """Vue complète pour l'admin — inclut les détails techniques."""
    recipient_phone = serializers.CharField(source='recipient.phone', read_only=True)
    transaction_token = serializers.SerializerMethodField()

    class Meta:
        model  = Notification
        fields = [
            'id',
            'recipient_phone',
            'transaction_token',
            'channel',
            'notif_type',
            'status',
            'message',
            'external_id',
            'sent_at',
            'delivered_at',
            'retry_count',
            'error_message',
            'created_at',
        ]
        read_only_fields = fields

    def get_transaction_token(self, obj):
        if obj.transaction:
            return obj.transaction.token[:12] + '...'
        return None


class WebhookDeliverySerializer(serializers.Serializer):
    """
    Payload reçu de Twilio pour confirmer la remise d'un message.
    """
    MessageSid    = serializers.CharField()
    MessageStatus = serializers.CharField()
