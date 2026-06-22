import os
import logging
from django.utils import timezone
from .models import Notification

logger = logging.getLogger(__name__)


# ─── Messages par type de notification ───────────────────────────────────────

MESSAGES = {
    Notification.NotifType.FUNDS_SECURED: (
        "Verifio : Les fonds de {amount} FCFA sont sécurisés. "
        "Vous pouvez expédier la commande : {description}. "
        "Ref : {token}"
    ),
    Notification.NotifType.DELIVERY_CONFIRMED: (
        "Verifio : L'acheteur a confirmé la réception. "
        "{net} FCFA ont été libérés sur votre compte. "
        "Ref : {token}"
    ),
    Notification.NotifType.DISPUTE_OPENED: (
        "Verifio : Un litige a été ouvert sur la transaction {token}. "
        "Les fonds sont gelés. Connectez-vous pour soumettre vos preuves."
    ),
    Notification.NotifType.DISPUTE_RESOLVED: (
        "Verifio : Le litige sur la transaction {token} a été résolu. "
        "Décision : {decision}. Connectez-vous pour les détails."
    ),
    Notification.NotifType.PAYMENT_RELEASED: (
        "Verifio : Paiement de {net} FCFA libéré sur votre compte. "
        "Ref : {token}"
    ),
    Notification.NotifType.ACCOUNT_FROZEN: (
        "Verifio : Votre compte vendeur a été gelé suite à un historique "
        "de transactions défavorable. Contactez le support."
    ),
}


def build_message(notif_type, transaction=None, extra=None):
    """Construit le message selon le type de notification."""
    template = MESSAGES.get(notif_type, "Verifio : Nouvelle notification.")

    context = extra or {}
    if transaction:
        context.update({
            'token':       transaction.token[:12],
            'amount':      transaction.amount_fcfa,
            'net':         transaction.net_fcfa,
            'description': transaction.product_description[:40],
            'decision':    getattr(
                getattr(transaction, 'dispute', None), 'decision', ''
            ) or '',
        })

    try:
        return template.format(**context)
    except KeyError:
        return template


def send_notification(user, notif_type, channel=None, transaction=None, extra=None):
    """
    Crée et envoie une notification.
    Tente WhatsApp en premier, SMS en fallback automatique.
    """
    if channel is None:
        channel = Notification.Channel.WHATSAPP

    message = build_message(notif_type, transaction, extra)

    # Créer l'enregistrement en base
    notif = Notification.objects.create(
        recipient=user,
        transaction=transaction,
        channel=channel,
        notif_type=notif_type,
        message=message,
        status=Notification.Status.QUEUED,
    )

    # Envoyer
    success = _dispatch(notif)

    # Fallback SMS si WhatsApp échoue
    if not success and channel == Notification.Channel.WHATSAPP:
        logger.info(f"Fallback SMS pour {user.phone} — notif {notif.id}")
        sms_notif = Notification.objects.create(
            recipient=user,
            transaction=transaction,
            channel=Notification.Channel.SMS,
            notif_type=notif_type,
            message=message,
            status=Notification.Status.QUEUED,
        )
        _dispatch(sms_notif)

    return notif


def retry_failed_notifications():
    """
    Rejoue les notifications échouées (max 3 tentatives).
    Appelée par la commande de management.
    """
    failed = Notification.objects.filter(
        status=Notification.Status.FAILED,
        retry_count__lt=3,
    )

    count = 0
    for notif in failed:
        notif.retry_count += 1
        notif.save(update_fields=['retry_count'])
        success = _dispatch(notif)
        if success:
            count += 1

    return count


# ─── Dispatch par canal ───────────────────────────────────────────────────────

def _dispatch(notif):
    """Route la notification vers le bon canal."""
    try:
        if notif.channel == Notification.Channel.WHATSAPP:
            return _send_whatsapp(notif)
        elif notif.channel == Notification.Channel.SMS:
            return _send_sms(notif)
        else:
            logger.warning(f"Canal non supporté : {notif.channel}")
            return False
    except Exception as e:
        _mark_failed(notif, str(e))
        return False


def _send_whatsapp(notif):
    """Envoie via Twilio WhatsApp."""
    if os.getenv('DJANGO_ENV') == 'production':
        from twilio.rest import Client
        client = Client(
            os.getenv('TWILIO_ACCOUNT_SID'),
            os.getenv('TWILIO_AUTH_TOKEN'),
        )
        message = client.messages.create(
            from_=f"whatsapp:{os.getenv('TWILIO_WHATSAPP_NUMBER')}",
            to=f"whatsapp:{notif.recipient.phone}",
            body=notif.message,
        )
        _mark_sent(notif, external_id=message.sid)
        logger.info(f"WhatsApp envoyé → {notif.recipient.phone} | sid {message.sid}")
    else:
        # Dev — afficher dans la console
        print(f"\n{'='*50}")
        print(f"  [WHATSAPP DEV] → {notif.recipient.phone}")
        print(f"  Type    : {notif.notif_type}")
        print(f"  Message : {notif.message}")
        print(f"{'='*50}\n")
        _mark_sent(notif, external_id=f"DEV-WA-{notif.id}")

    return True


def _send_sms(notif):
    """Envoie via Twilio SMS."""
    if os.getenv('DJANGO_ENV') == 'production':
        from twilio.rest import Client
        client = Client(
            os.getenv('TWILIO_ACCOUNT_SID'),
            os.getenv('TWILIO_AUTH_TOKEN'),
        )
        message = client.messages.create(
            from_=os.getenv('TWILIO_SMS_NUMBER'),
            to=notif.recipient.phone,
            body=notif.message,
        )
        _mark_sent(notif, external_id=message.sid)
        logger.info(f"SMS envoyé → {notif.recipient.phone} | sid {message.sid}")
    else:
        print(f"\n{'='*50}")
        print(f"  [SMS DEV] → {notif.recipient.phone}")
        print(f"  Message : {notif.message}")
        print(f"{'='*50}\n")
        _mark_sent(notif, external_id=f"DEV-SMS-{notif.id}")

    return True


# ─── Helpers de statut ────────────────────────────────────────────────────────

def _mark_sent(notif, external_id=None):
    notif.status      = Notification.Status.SENT
    notif.sent_at     = timezone.now()
    notif.external_id = external_id
    notif.save(update_fields=['status', 'sent_at', 'external_id'])


def _mark_failed(notif, error_message=""):
    notif.status        = Notification.Status.FAILED
    notif.error_message = error_message
    notif.save(update_fields=['status', 'error_message'])
    logger.error(f"Notification échouée [{notif.channel}] → {notif.recipient.phone} : {error_message}")
