import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class Transaction(models.Model):

    class Status(models.TextChoices):
        INITIATED           = 'initiated',            'Initié'
        PAYMENT_PENDING     = 'payment_pending',      'Paiement en attente'
        FUNDS_SECURED       = 'funds_secured',        'Fonds sécurisés'
        DELIVERY_IN_PROGRESS = 'delivery_in_progress', 'Livraison en cours'
        COMPLETED           = 'completed',            'Complété'
        DISPUTED            = 'disputed',             'En litige'
        REFUNDED            = 'refunded',             'Remboursé'
        CANCELLED           = 'cancelled',            'Annulé'

    # Transitions valides de la FSM
    VALID_TRANSITIONS = {
        Status.INITIATED:            [Status.PAYMENT_PENDING, Status.CANCELLED],
        Status.PAYMENT_PENDING:      [Status.FUNDS_SECURED,   Status.CANCELLED],
        Status.FUNDS_SECURED:        [Status.DELIVERY_IN_PROGRESS, Status.DISPUTED],
        Status.DELIVERY_IN_PROGRESS: [Status.COMPLETED,       Status.DISPUTED],
        Status.COMPLETED:            [],
        Status.DISPUTED:             [Status.COMPLETED,       Status.REFUNDED],
        Status.REFUNDED:             [],
        Status.CANCELLED:            [],
    }

    id                  = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    token               = models.CharField(max_length=64, unique=True, editable=False)
    seller              = models.ForeignKey(
                            'vendors.Vendor',
                            on_delete=models.RESTRICT,
                            related_name='transactions'
                          )
    buyer               = models.ForeignKey(
                            settings.AUTH_USER_MODEL,
                            on_delete=models.RESTRICT,
                            related_name='buyer_transactions',
                            blank=True,
                            null=True
                          )
    status              = models.CharField(
                            max_length=25,
                            choices=Status.choices,
                            default=Status.INITIATED
                          )
    amount_fcfa         = models.IntegerField(validators=[MinValueValidator(1)])
    fee_fcfa            = models.IntegerField(default=200)
    product_description = models.TextField()
    delivery_zone       = models.CharField(max_length=200)
    delivery_deadline   = models.DateTimeField()
    psp_reference       = models.CharField(max_length=100, unique=True, blank=True, null=True)
    payout_reference    = models.CharField(max_length=100, unique=True, blank=True, null=True)
    confirmed_at        = models.DateTimeField(blank=True, null=True)
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f"Transaction {self.token[:8]}... — {self.status}"

    def save(self, *args, **kwargs):
        # Générer le token à la création
        if not self.token:
            import secrets
            self.token = secrets.token_urlsafe(48)
        super().save(*args, **kwargs)

    @property
    def net_fcfa(self):
        """Montant net reçu par le vendeur après commission."""
        return self.amount_fcfa - self.fee_fcfa

    def can_transition_to(self, new_status):
        """Vérifie si la transition de statut est valide."""
        return new_status in self.VALID_TRANSITIONS.get(self.status, [])

    def transition_to(self, new_status):
        """
        Effectue une transition de statut.
        Lève une exception si la transition est invalide.
        """
        if not self.can_transition_to(new_status):
            raise ValueError(
                f"Transition invalide : {self.status} → {new_status}"
            )
        self.status = new_status
        self.save(update_fields=['status', 'updated_at'])
