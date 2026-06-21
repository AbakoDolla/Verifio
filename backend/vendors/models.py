import uuid
from django.db import models
from django.conf import settings


class Vendor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,  # impossible de supprimer un user avec une boutique
        related_name='vendor'
    )
    shop_slug = models.SlugField(max_length=80, unique=True)
    shop_name = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    is_pro = models.BooleanField(default=False)
    pro_expires_at = models.DateTimeField(blank=True, null=True)
    total_secured_gmv = models.BigIntegerField(default=0)  # en FCFA
    verified_at = models.DateTimeField(blank=True, null=True)
    qr_code_url = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vendors'

    def __str__(self):
        return f"{self.shop_name} (@{self.shop_slug})"

    @property
    def is_pro_active(self):
        """Vérifie si l'abonnement Pro est réellement actif."""
        from django.utils import timezone
        if not self.is_pro:
            return False
        if self.pro_expires_at and self.pro_expires_at < timezone.now():
            return False
        return True

    @property
    def trust_level(self):
        """Retourne le niveau de confiance depuis trust_scores."""
        try:
            return self.trust_score.level
        except TrustScore.DoesNotExist:
            return TrustScore.Level.GREY


class TrustScore(models.Model):

    class Level(models.TextChoices):
        GREEN  = 'green',  'Vert Certifié'
        GREY   = 'grey',   'Gris Inconnu'
        ORANGE = 'orange', 'Orange Suspect'
        RED    = 'red',    'Rouge Bloqué'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor = models.OneToOneField(
        Vendor,
        on_delete=models.CASCADE,
        related_name='trust_score'
    )
    level = models.CharField(
        max_length=10,
        choices=Level.choices,
        default=Level.GREY
    )
    score_value = models.SmallIntegerField(default=50)  # 0 à 100
    total_transactions = models.IntegerField(default=0)
    dispute_rate_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    successful_deliveries = models.IntegerField(default=0)
    last_fraud_flag_at = models.DateTimeField(blank=True, null=True)
    recalculated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'trust_scores'

    def __str__(self):
        return f"TrustScore [{self.level}] — {self.vendor.shop_name}"

    def recalculate(self):
        """Recalcule le score et le niveau après chaque transaction."""
        from django.utils import timezone

        total = self.total_transactions
        disputes = int(self.dispute_rate_pct * total / 100) if total > 0 else 0

        # Calcul du score numérique
        if total == 0:
            self.score_value = 50
        else:
            base = (self.successful_deliveries / total) * 100
            penalty = float(self.dispute_rate_pct) * 2
            self.score_value = max(0, min(100, int(base - penalty)))

        # Fraude récente = rouge immédiat
        if self.last_fraud_flag_at:
            from datetime import timedelta
            if self.last_fraud_flag_at > timezone.now() - timedelta(days=30):
                self.level = self.Level.RED
                self.save()
                return

        # Transition selon score
        if self.score_value >= 70 and total >= 10:
            self.level = self.Level.GREEN
        elif self.score_value >= 40:
            self.level = self.Level.GREY
        elif self.score_value >= 20:
            self.level = self.Level.ORANGE
        else:
            self.level = self.Level.RED

        self.save()


class Subscription(models.Model):

    class Plan(models.TextChoices):
        FREE = 'free', 'Gratuit'
        PRO  = 'pro',  'Vendeur Pro'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.SET_NULL,
        null=True,
        related_name='subscriptions'
    )
    plan = models.CharField(max_length=10, choices=Plan.choices, default=Plan.PRO)
    started_at = models.DateTimeField()
    expires_at = models.DateTimeField()
    payment_ref = models.CharField(max_length=100)
    amount_fcfa = models.IntegerField(default=5000)
    auto_renew = models.BooleanField(default=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'subscriptions'
        ordering = ['-started_at']

    def __str__(self):
        return f"Subscription {self.plan} — {self.vendor.shop_name}"

    @property
    def is_active(self):
        from django.utils import timezone
        return (
            self.expires_at > timezone.now()
            and self.cancelled_at is None
        )
