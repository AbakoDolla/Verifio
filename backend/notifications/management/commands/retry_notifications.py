from django.core.management.base import BaseCommand
from notifications.services import retry_failed_notifications
from notifications.models import Notification


class Command(BaseCommand):
    help = "Rejoue les notifications échouées (max 3 tentatives)"

    def handle(self, *args, **kwargs):
        # Afficher les stats avant
        total_failed = Notification.objects.filter(
            status='failed', retry_count__lt=3
        ).count()

        if total_failed == 0:
            self.stdout.write(self.style.SUCCESS("Aucune notification à rejouer."))
            return

        self.stdout.write(f"{total_failed} notification(s) échouée(s) trouvée(s)...")

        count = retry_failed_notifications()

        self.stdout.write(
            self.style.SUCCESS(f"{count}/{total_failed} notification(s) renvoyée(s) avec succès.")
        )

        # Afficher les notifications définitivement échouées (3 tentatives)
        definitive_failures = Notification.objects.filter(
            status='failed', retry_count__gte=3
        ).count()

        if definitive_failures > 0:
            self.stdout.write(
                self.style.ERROR(
                    f"{definitive_failures} notification(s) définitivement échouée(s) "
                    f"(3 tentatives épuisées) — vérifiez l'admin Verifio."
                )
            )
