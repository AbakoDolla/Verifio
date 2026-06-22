from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Notification
from .serializers import (
    NotificationSerializer,
    NotificationAdminSerializer,
    WebhookDeliverySerializer,
)


class NotificationListView(APIView):
    """
    GET /api/notifications/
    Liste des notifications de l'utilisateur connecté.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifs = Notification.objects.filter(
            recipient=request.user
        ).order_by('-created_at')[:50]

        # Filtre optionnel par statut
        status_filter = request.query_params.get('status')
        if status_filter:
            notifs = notifs.filter(status=status_filter)

        return Response(NotificationSerializer(notifs, many=True).data)


class NotificationAdminListView(APIView):
    """
    GET /api/notifications/admin/
    Vue admin — toutes les notifications avec détails techniques.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response(
                {"detail": "Accès réservé aux administrateurs."},
                status=status.HTTP_403_FORBIDDEN
            )

        notifs = Notification.objects.select_related(
            'recipient', 'transaction'
        ).all().order_by('-created_at')

        # Filtres
        channel_filter = request.query_params.get('channel')
        status_filter  = request.query_params.get('status')

        if channel_filter:
            notifs = notifs.filter(channel=channel_filter)
        if status_filter:
            notifs = notifs.filter(status=status_filter)

        return Response(NotificationAdminSerializer(notifs, many=True).data)


class TwilioWebhookView(APIView):
    """
    POST /api/notifications/webhook/twilio/
    Reçoit les confirmations de remise Twilio (delivery receipts).
    Accessible sans authentification — vérifié par signature Twilio.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        # Vérification signature Twilio en production
        if not _verify_twilio_signature(request):
            return Response(
                {"detail": "Signature invalide."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        serializer = WebhookDeliverySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        message_sid    = serializer.validated_data['MessageSid']
        message_status = serializer.validated_data['MessageStatus']

        # Mettre à jour le statut de la notification
        try:
            notif = Notification.objects.get(external_id=message_sid)

            if message_status == 'delivered':
                from django.utils import timezone
                notif.status       = Notification.Status.DELIVERED
                notif.delivered_at = timezone.now()
                notif.save(update_fields=['status', 'delivered_at'])

            elif message_status in ['failed', 'undelivered']:
                notif.status = Notification.Status.FAILED
                notif.save(update_fields=['status'])

        except Notification.DoesNotExist:
            pass  # Ignorer silencieusement les SIDs inconnus

        return Response({"detail": "OK"})


def _verify_twilio_signature(request):
    """Vérifie la signature Twilio du webhook."""
    import os
    if os.getenv('DJANGO_ENV') != 'production':
        return True  # Pas de vérification en dev

    try:
        from twilio.request_validator import RequestValidator
        validator = RequestValidator(os.getenv('TWILIO_AUTH_TOKEN'))
        url       = request.build_absolute_uri()
        signature = request.headers.get('X-Twilio-Signature', '')
        return validator.validate(url, request.POST, signature)
    except Exception:
        return False
