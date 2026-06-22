import uuid
from django.db import models
from django.conf import settings


class Dispute(models.Model):

    class Reason(models.TextChoices):
        NON_DELIVERY   = 'non_delivery',   'Non livraison'
        NON_CONFORMITY = 'non_conformity', 'Produit non conforme'
        FRAUD          = 'fraud',          'Fraude'
        OTHER          = 'other',          'Autre'

    class Status(models.TextChoices):
        OPEN         = 'open',         'Ouvert'
        UNDER_REVIEW = 'under_review', 'En cours d examen'
        RESOLVED     = 'resolved',     'Résolu'
        ESCALATED    = 'escalated',    'Escaladé'

    class Decision(models.TextChoices):
        REFUND_BUYER   = 'refund_buyer',   'Remboursement acheteur'
        RELEASE_SELLER = 'release_seller', 'Paiement vendeur'
        PARTIAL        = 'partial',        'Partiel'
        VOID           = 'void',           'Annulé sans suite'

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.OneToOneField(
                    'transactions.Transaction',
                    on_delete=models.CASCADE,
                    related_name='dispute'
                  )
    opened_by   = models.ForeignKey(
                    settings.AUTH_USER_MODEL,
                    on_delete=models.RESTRICT,
                    related_name='opened_disputes'
                  )
    reason      = models.CharField(max_length=20, choices=Reason.choices)
    status      = models.CharField(
                    max_length=15,
                    choices=Status.choices,
                    default=Status.OPEN
                  )
    description = models.TextField()
    decision    = models.CharField(
                    max_length=20,
                    choices=Decision.choices,
                    blank=True,
                    null=True
                  )
    decision_by = models.ForeignKey(
                    settings.AUTH_USER_MODEL,
                    on_delete=models.RESTRICT,
                    related_name='decided_disputes',
                    blank=True,
                    null=True
                  )
    decision_at = models.DateTimeField(blank=True, null=True)
    notes       = models.TextField(blank=True, null=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'disputes'
        ordering = ['-created_at']

    def __str__(self):
        return f"Litige {self.id} — {self.reason} — {self.status}"

    @property
    def is_open(self):
        return self.status in [self.Status.OPEN, self.Status.UNDER_REVIEW]

    @property
    def sla_hours_remaining(self):
        """Heures restantes avant dépassement du SLA de 24h."""
        from django.utils import timezone
        from datetime import timedelta
        deadline  = self.created_at + timedelta(hours=24)
        remaining = deadline - timezone.now()
        return max(0, remaining.total_seconds() / 3600)


class Evidence(models.Model):

    class EvidenceType(models.TextChoices):
        PHOTO         = 'photo',         'Photo'
        VIDEO         = 'video',         'Video'
        SCREENSHOT    = 'screenshot',    'Capture ecran'
        DELIVERY_SLIP = 'delivery_slip', 'Bordereau de livraison'
        OTHER         = 'other',         'Autre'

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dispute     = models.ForeignKey(
                    Dispute,
                    on_delete=models.CASCADE,
                    related_name='evidences'
                  )
    uploaded_by = models.ForeignKey(
                    settings.AUTH_USER_MODEL,
                    on_delete=models.RESTRICT,
                    related_name='uploaded_evidences'
                  )
    type        = models.CharField(max_length=20, choices=EvidenceType.choices)
    storage_url = models.TextField()
    hash_sha256 = models.CharField(max_length=64)
    metadata    = models.JSONField(blank=True, null=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'evidences'
        ordering = ['-created_at']

    def __str__(self):
        return f"Preuve {self.type} — Litige {self.dispute_id}"
