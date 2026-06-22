import hashlib
from django.utils import timezone
from django.db import transaction as db_transaction
from transactions.models import Transaction
from .models import Dispute, Evidence


def open_dispute(transaction, opened_by, reason, description):
    """
    Ouvre un litige sur une transaction.
    Gèle les fonds en passant la transaction en 'disputed'.
    """
    # Vérifier qu'il n'y a pas déjà un litige actif
    if hasattr(transaction, 'dispute') and transaction.dispute.is_open:
        raise ValueError("Un litige est déjà ouvert pour cette transaction.")

    # Vérifier que la transaction est dans un état litigeable
    allowed = [
        Transaction.Status.FUNDS_SECURED,
        Transaction.Status.DELIVERY_IN_PROGRESS,
    ]
    if transaction.status not in allowed:
        raise ValueError(
            "Un litige ne peut être ouvert que si les fonds sont sécurisés "
            "ou la livraison en cours."
        )

    with db_transaction.atomic():
        dispute = Dispute.objects.create(
            transaction=transaction,
            opened_by=opened_by,
            reason=reason,
            description=description,
        )
        transaction.transition_to(Transaction.Status.DISPUTED)

    # Notifier les deux parties
    _notify_dispute_opened(dispute)

    return dispute


def add_evidence(dispute, uploaded_by, evidence_type, file_content, storage_url, metadata=None):
    """
    Ajoute une pièce justificative à un litige.
    Calcule le hash SHA-256 du fichier pour garantir l'intégrité.
    """
    if not dispute.is_open:
        raise ValueError("Impossible d'ajouter une preuve à un litige résolu.")

    # Calculer le hash SHA-256
    sha256 = hashlib.sha256(file_content).hexdigest()

    evidence = Evidence.objects.create(
        dispute=dispute,
        uploaded_by=uploaded_by,
        type=evidence_type,
        storage_url=storage_url,
        hash_sha256=sha256,
        metadata=metadata or {},
    )
    return evidence


def resolve_dispute(dispute, decision, decided_by, notes=""):
    """
    Résout un litige avec une décision d'arbitrage.
    Exécute le payout ou le remboursement selon la décision.
    SLA : doit être appelé dans les 24h.
    """
    if not dispute.is_open:
        raise ValueError("Ce litige est déjà résolu.")

    with db_transaction.atomic():
        dispute.decision    = decision
        dispute.decision_by = decided_by
        dispute.decision_at = timezone.now()
        dispute.notes       = notes
        dispute.status      = Dispute.Status.RESOLVED
        dispute.save()

        # Exécuter la décision sur la transaction
        txn = dispute.transaction

        if decision == Dispute.Decision.REFUND_BUYER:
            txn.transition_to(Transaction.Status.REFUNDED)
            _trigger_refund(txn)

        elif decision == Dispute.Decision.RELEASE_SELLER:
            txn.transition_to(Transaction.Status.COMPLETED)
            _trigger_payout(txn)

        elif decision == Dispute.Decision.PARTIAL:
            # Remboursement partiel — logique à affiner selon le PSP
            txn.transition_to(Transaction.Status.REFUNDED)
            _trigger_partial_refund(txn)

        elif decision == Dispute.Decision.VOID:
            txn.transition_to(Transaction.Status.CANCELLED)

    # Notifier les deux parties de la décision
    _notify_dispute_resolved(dispute)

    return dispute


def escalate_dispute(dispute, escalated_by):
    """
    Escalade un litige vers un niveau supérieur (cas complexes).
    """
    if not dispute.is_open:
        raise ValueError("Ce litige est déjà résolu.")

    dispute.status = Dispute.Status.ESCALATED
    dispute.save(update_fields=['status', 'updated_at'])
    return dispute


# ─── Fonctions internes ───────────────────────────────────────────────────────

def _notify_dispute_opened(dispute):
    try:
        from notifications.services import send_notification
        # Notifier l'acheteur
        send_notification(
            user=dispute.transaction.buyer,
            transaction=dispute.transaction,
            notif_type='dispute_opened',
            channel='whatsapp',
        )
        # Notifier le vendeur
        send_notification(
            user=dispute.transaction.seller.user,
            transaction=dispute.transaction,
            notif_type='dispute_opened',
            channel='whatsapp',
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Erreur notification litige : {e}")


def _notify_dispute_resolved(dispute):
    try:
        from notifications.services import send_notification
        for user in [dispute.transaction.buyer, dispute.transaction.seller.user]:
            if user:
                send_notification(
                    user=user,
                    transaction=dispute.transaction,
                    notif_type='dispute_resolved',
                    channel='whatsapp',
                )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Erreur notification résolution : {e}")


def _trigger_refund(transaction):
    import logging
    logging.getLogger(__name__).info(
        f"[REFUND] {transaction.amount_fcfa} FCFA → {transaction.buyer.phone}"
    )


def _trigger_payout(transaction):
    import logging
    logging.getLogger(__name__).info(
        f"[PAYOUT] {transaction.net_fcfa} FCFA → {transaction.seller.user.phone}"
    )


def _trigger_partial_refund(transaction):
    import logging
    logging.getLogger(__name__).info(
        f"[PARTIAL REFUND] transaction {transaction.token[:8]}"
    )
