from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from disputes.models import Dispute


class Command(BaseCommand):
    help = "Vérifie les litiges qui dépassent le SLA de 24h et les escalade"

    def handle(self, *args, **kwargs):
        deadline = timezone.now() - timedelta(hours=24)

        # Litiges ouverts depuis plus de 24h sans décision
        litiges = Dispute.objects.filter(
            status__in=[Dispute.Status.OPEN, Dispute.Status.UNDER_REVIEW],
            created_at__lte=deadline,
        )

        count = litiges.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS("Tous les litiges sont dans les délais."))
            return

        self.stdout.write(
            self.style.WARNING(f"{count} litige(s) ont dépassé le SLA de 24h :")
        )

        for dispute in litiges:
            hours_overdue = (timezone.now() - dispute.created_at).total_seconds() / 3600 - 24

            # Escalader automatiquement
            dispute.status = Dispute.Status.ESCALATED
            dispute.save(update_fields=['status', 'updated_at'])

            self.stdout.write(
                f"  ⚠️  Litige {str(dispute.id)[:8]} escaladé "
                f"— {hours_overdue:.1f}h de retard "
                f"— Transaction {dispute.transaction.token[:8]}"
            )

        self.stdout.write(
            self.style.SUCCESS(f"\n{count} litige(s) escaladé(s).")
        )
