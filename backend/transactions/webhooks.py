import hashlib
import hmac
import json
import os
import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .services import confirm_payment_from_webhook

logger = logging.getLogger(__name__)


def verify_webhook_signature(payload, signature, secret):
    """
    Vérifie la signature HMAC du webhook PSP.
    Protège contre les faux appels webhook.
    """
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


class PSPWebhookView(APIView):
    """
    POST /api/transactions/webhook/psp/
    Reçoit les confirmations de paiement du PSP.
    Accessible sans authentification (vérification par signature HMAC).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        # 1. Vérifier la signature du webhook
        signature = request.headers.get('X-Webhook-Signature', '')
        secret    = os.getenv('PSP_WEBHOOK_SECRET', '')

        if os.getenv('DJANGO_ENV') == 'production':
            if not verify_webhook_signature(request.body, signature, secret):
                logger.warning("Webhook reçu avec signature invalide")
                return Response(
                    {"detail": "Signature invalide."},
                    status=status.HTTP_401_UNAUTHORIZED
                )

        # 2. Parser le payload
        try:
            payload = json.loads(request.body)
        except json.JSONDecodeError:
            return Response(
                {"detail": "Payload invalide."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Extraire les données nécessaires
        event         = payload.get('event')
        psp_reference = payload.get('transaction_id')
        txn_token     = payload.get('metadata', {}).get('verifio_token')

        if not all([event, psp_reference, txn_token]):
            return Response(
                {"detail": "Champs manquants dans le payload."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Traiter uniquement les paiements confirmés
        if event != 'payment.success':
            return Response({"detail": "Événement ignoré."})

        # 5. Confirmer le paiement
        try:
            txn = confirm_payment_from_webhook(psp_reference, txn_token)
            logger.info(f"Paiement confirmé : {txn.token[:8]} | PSP ref {psp_reference}")
            return Response({"detail": "Paiement confirmé.", "status": txn.status})
        except ValueError as e:
            logger.error(f"Erreur webhook : {e}")
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.exception(f"Erreur inattendue webhook : {e}")
            return Response(
                {"detail": "Erreur interne."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
