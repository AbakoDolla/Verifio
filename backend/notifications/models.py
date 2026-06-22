import uuid
from django.db import models
from django.conf import settings


class Notification(models.Model):

    class Channel(models.TextChoices):
        WHATSAPP = 'whatsapp', 'WhatsApp'
        SMS      = 'sms',      'SMS'
        PUSH     = 'push',     'Push'
        EMAIL    = 'email',    'Email'

    class NotifType(models.TextChoices):
        FUNDS_SECURED      = 'funds_secured',      'Fonds sécurisés'
        DELIVERY_CONFIRMED = 'delivery_confirmed',  'Livraison confirmée'
        DISPUTE_OPENED     = 'dispute_opened',      'Litige ouvert'
        DISPUTE_RESOLVED   = 'dispute_resolved',    'Litige résolu'
        PAYMENT_RELEASED   = 'payment_released',    'Paiement libéré'
        OTP_CODE           = 'otp_code',            'Code OTP'
        ACCOUNT_FROZEN     = 'account_frozen',      'Compte gelé'

    class Status(models.TextChoices):
        QUEUED    = 'queued',    'En attente'
        SENT      = 'sent',      'Envoyé'
        DELIVERED = 'delivered', 'Remis'
        FAILED    = 'failed',    'Échoué'

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient      = models.ForeignKey(
                       settings.AUTH_USER_MODEL,
                       on_delete=models.CASCADE,
                       related_name='notifications'
                     )
    transaction    = models.ForeignKey(
                       'transactions.Transaction',
                       on_delete=models.CASCADE,
                       related_name='notifications',
                       blank=True,
                       null=True
                     )
    channel        = models.CharField(max_length=10, choices=Channel.choices)
    notif_type     = models.CharField(max_length=25, choices=NotifType.choices)
    status         = models.CharField(
                       max_length=10,
                       choices=Status.choices,
                       default=Status.QUEUED
                     )
    message        = models.TextField()
    external_id    = models.CharField(
                       max_length=100,
                       blank=True,
                       null=True,
                       help_text="ID Twilio ou opérateur SMS"
                     )
    sent_at        = models.DateTimeField(blank=True, null=True)
    delivered_at   = models.DateTimeField(blank=True, null=True)
    retry_count    = models.SmallIntegerField(default=0)
    error_message  = models.TextField(blank=True, null=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.channel}] {self.notif_type} → {self.recipient.phone} ({self.status})"

    @property
    def can_retry(self):
        return self.status == self.Status.FAILED and self.retry_count < 3
