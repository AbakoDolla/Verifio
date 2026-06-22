from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Transaction


@receiver(post_save, sender=Transaction)
def update_vendor_gmv(sender, instance, created, **kwargs):
    """
    Met à jour le GMV total du vendeur après chaque transaction complétée.
    """
    if instance.status != Transaction.Status.COMPLETED:
        return

    vendor = instance.seller
    from django.db.models import Sum

    total_gmv = Transaction.objects.filter(
        seller=vendor,
        status=Transaction.Status.COMPLETED
    ).aggregate(total=Sum('amount_fcfa'))['total'] or 0

    vendor.total_secured_gmv = total_gmv
    vendor.save(update_fields=['total_secured_gmv'])


@receiver(post_save, sender=Transaction)
def update_trust_score(sender, instance, **kwargs):
    """
    Recalcule le TrustScore du vendeur après chaque transaction
    complétée ou remboursée.
    """
    FINAL_STATUSES = [Transaction.Status.COMPLETED, Transaction.Status.REFUNDED]

    if instance.status not in FINAL_STATUSES:
        return

    try:
        trust_score = instance.seller.trust_score
    except Exception:
        return

    total      = Transaction.objects.filter(
                    seller=instance.seller,
                    status__in=FINAL_STATUSES
                 ).count()
    successful = Transaction.objects.filter(
                    seller=instance.seller,
                    status=Transaction.Status.COMPLETED
                 ).count()
    refunded   = Transaction.objects.filter(
                    seller=instance.seller,
                    status=Transaction.Status.REFUNDED
                 ).count()

    trust_score.total_transactions    = total
    trust_score.successful_deliveries = successful
    trust_score.dispute_rate_pct      = round((refunded / total) * 100, 2) if total > 0 else 0

    trust_score.recalculate()
