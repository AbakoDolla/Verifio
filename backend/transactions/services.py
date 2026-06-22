from django.utils import timezone
from django.db import transaction as db_transaction
from .models import Transaction


def create_transaction(seller, data):
    """
    Crée une nouvelle transaction escrow.
    Retourne la transaction créée.
    """
    txn = Transaction.objects.create(
        seller=seller,
        amount_fcfa=data['amount_fcfa'],
        product_description=data['product_description'],
        delivery_zone=data['delivery_zone'],
        delivery_deadline=data['delivery_deadline'],
    )
    return txn


def initiate_payment(transaction, buyer):
    """
    L'acheteur initie le dépôt.
    Passe la transaction en 'payment_pending'.
    """
    with db_transaction.atomic():
        transaction.buyer = buyer
        transaction.save(update_fields=['buyer', 'updated_at'])
        transaction.transition_to(Transaction.Status.PAYMENT_PENDING)
    return transaction


def confirm_payment_from_webhook(psp_reference, transaction_token):
    """
    Appelé par le webhook PSP quand le paiement est confirmé.
    Passe la transaction en 'funds_secured'.
    Idempotent : si déjà sécurisé, ne fait rien.
    """
    try:
        txn = Transaction.objects.get(token=transaction_token)
    except Transaction.DoesNotExist:
        raise ValueError(f"Transaction introuvable : {transaction_token}")

    # Idempotence — ignorer si déjà traité
    if txn.status == Transaction.Status.FUNDS_SECURED:
        return txn

    # Vérifier qu'on n'utilise pas une référence PSP déjà existante
    if Transaction.objects.filter(psp_reference=psp_reference).exists():
        raise ValueError(f"Référence PSP déjà utilisée : {psp_reference}")

    with db_transaction.atomic():
        txn.psp_reference = psp_reference
        txn.save(update_fields=['psp_reference', 'updated_at'])
        txn.transition_to(Transaction.Status.FUNDS_SECURED)

    # Envoyer la notification au vendeur
    _notify_seller_funds_secured(txn)

    return txn


def mark_delivery_in_progress(transaction):
    """
    Le vendeur confirme l'expédition.
    Passe la transaction en 'delivery_in_progress'.
    """
    transaction.transition_to(Transaction.Status.DELIVERY_IN_PROGRESS)
    return transaction


def confirm_delivery(transaction):
    """
    L'acheteur confirme la réception conforme.
    Passe la transaction en 'completed' et déclenche le payout.
    """
    with db_transaction.atomic():
        transaction.confirmed_at = timezone.now()
        transaction.save(update_fields=['confirmed_at', 'updated_at'])
        transaction.transition_to(Transaction.Status.COMPLETED)

    # Déclencher le payout vers le vendeur
    _trigger_payout(transaction)

    return transaction


def cancel_transaction(transaction):
    """
    Annule une transaction (avant sécurisation uniquement).
    """
    if transaction.status not in [
        Transaction.Status.INITIATED,
        Transaction.Status.PAYMENT_PENDING
    ]:
        raise ValueError(
            "Impossible d'annuler une transaction déjà sécurisée."
        )
    transaction.transition_to(Transaction.Status.CANCELLED)
    return transaction


def _notify_seller_funds_secured(transaction):
    """
    Notifie le vendeur que les fonds sont sécurisés.
    La commande peut être expédiée.
    """
    try:
        from notifications.services import send_notification
        send_notification(
            user=transaction.seller.user,
            transaction=transaction,
            notif_type='funds_secured',
            channel='whatsapp',
        )
    except Exception as e:
        # Ne pas bloquer la transaction si la notif échoue
        import logging
        logging.getLogger(__name__).error(f"Erreur notification : {e}")


def _trigger_payout(transaction):
    """
    Déclenche le reversement du montant net au vendeur via PSP.
    En dev, simule juste le payout.
    """
    import os
    import logging
    logger = logging.getLogger(__name__)

    net = transaction.net_fcfa
    vendor_phone = transaction.seller.user.phone

    if os.getenv('DJANGO_ENV') == 'production':
        # Appel réel à l'API PSP (FedaPay / CinetPay / Notch Pay)
        # À implémenter selon le PSP choisi
        logger.info(f"PAYOUT {net} FCFA → {vendor_phone} | txn {transaction.token[:8]}")
    else:
        # Mode dev — simuler
        import uuid
        payout_ref = f"PAY-DEV-{uuid.uuid4().hex[:12].upper()}"
        transaction.payout_reference = payout_ref
        transaction.save(update_fields=['payout_reference'])
        logger.info(f"[DEV] Payout simulé {net} FCFA → {vendor_phone} | ref {payout_ref}")
