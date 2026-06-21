from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='transactions.Transaction')
def update_trust_score_on_transaction(sender, instance, **kwargs):
    """
    Recalcule le TrustScore du vendeur après chaque transaction
    complétée ou remboursée.
    """
    from .models import TrustScore

    FINAL_STATUSES = ('completed', 'refunded')

    if instance.status not in FINAL_STATUSES:
        return

    try:
        trust_score = instance.seller.trust_score
    except TrustScore.DoesNotExist:
        return

    # Recalculer les métriques depuis la base
    from django.db.models import Count, Q

    txns = instance.seller.transactions.filter(
        status__in=FINAL_STATUSES
    )
    total = txns.count()
    successful = txns.filter(status='completed').count()
    disputed = txns.filter(status='refunded').count()

    trust_score.total_transactions = total
    trust_score.successful_deliveries = successful
    trust_score.dispute_rate_pct = (
        round((disputed / total) * 100, 2) if total > 0 else 0.00
    )
    trust_score.recalculate()
