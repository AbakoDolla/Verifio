from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from vendors.models import Vendor, TrustScore
from transactions.models import Transaction
from .models import Dispute, Evidence
from .services import open_dispute, resolve_dispute

User = get_user_model()


def make_seller():
    user = User.objects.create_user(
        phone='+22670000020', name='Vendeur Dispute', role='seller'
    )
    vendor = Vendor.objects.create(
        user=user, shop_slug='shop-dispute', shop_name='Shop Dispute'
    )
    TrustScore.objects.create(vendor=vendor)
    return user, vendor


def make_buyer():
    return User.objects.create_user(
        phone='+22670000021', name='Acheteur Dispute', role='buyer'
    )


def make_admin():
    return User.objects.create_user(
        phone='+22670000022', name='Admin Verifio', role='admin'
    )


def make_secured_txn(vendor, buyer):
    txn = Transaction.objects.create(
        seller=vendor,
        buyer=buyer,
        status=Transaction.Status.FUNDS_SECURED,
        amount_fcfa=30000,
        product_description='Téléphone reconditionné',
        delivery_zone='Ouagadougou',
        delivery_deadline=timezone.now() + timedelta(days=3),
    )
    return txn


class DisputeModelTest(TestCase):

    def setUp(self):
        self.seller_user, self.vendor = make_seller()
        self.buyer = make_buyer()
        self.txn   = make_secured_txn(self.vendor, self.buyer)

    def test_open_dispute(self):
        dispute = open_dispute(
            transaction=self.txn,
            opened_by=self.buyer,
            reason=Dispute.Reason.NON_DELIVERY,
            description='Le colis nest pas arrive apres 5 jours.',
        )
        self.assertEqual(dispute.status, Dispute.Status.OPEN)
        self.txn.refresh_from_db()
        self.assertEqual(self.txn.status, Transaction.Status.DISPUTED)

    def test_cannot_open_duplicate_dispute(self):
        open_dispute(
            transaction=self.txn,
            opened_by=self.buyer,
            reason=Dispute.Reason.NON_DELIVERY,
            description='Premier litige ouvert correctement.',
        )
        with self.assertRaises(ValueError):
            open_dispute(
                transaction=self.txn,
                opened_by=self.buyer,
                reason=Dispute.Reason.FRAUD,
                description='Tentative de doublon de litige.',
            )

    def test_sla_hours_remaining(self):
        dispute = open_dispute(
            transaction=self.txn,
            opened_by=self.buyer,
            reason=Dispute.Reason.NON_CONFORMITY,
            description='Produit non conforme a la description.',
        )
        self.assertAlmostEqual(dispute.sla_hours_remaining, 24.0, delta=0.1)

    def test_resolve_refund_buyer(self):
        admin = make_admin()
        dispute = open_dispute(
            transaction=self.txn,
            opened_by=self.buyer,
            reason=Dispute.Reason.NON_DELIVERY,
            description='Produit jamais recu malgre relances.',
        )
        resolve_dispute(
            dispute=dispute,
            decision=Dispute.Decision.REFUND_BUYER,
            decided_by=admin,
            notes='Aucune preuve de livraison fournie par le vendeur.',
        )
        self.txn.refresh_from_db()
        self.assertEqual(self.txn.status, Transaction.Status.REFUNDED)
        self.assertEqual(dispute.decision, Dispute.Decision.REFUND_BUYER)


class DisputeAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.seller_user, self.vendor = make_seller()
        self.buyer = make_buyer()
        self.admin = make_admin()
        self.txn   = make_secured_txn(self.vendor, self.buyer)

    def test_buyer_can_open_dispute(self):
        self.client.force_authenticate(user=self.buyer)
        response = self.client.post(
            f'/api/disputes/open/{self.txn.token}/',
            {
                'reason':      'non_delivery',
                'description': 'Le colis nest jamais arrive a destination.',
            }
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['reason'], 'non_delivery')

    def test_stranger_cannot_open_dispute(self):
        stranger = User.objects.create_user(
            phone='+22670000099', name='Inconnu', role='buyer'
        )
        self.client.force_authenticate(user=stranger)
        response = self.client.post(
            f'/api/disputes/open/{self.txn.token}/',
            {
                'reason':      'fraud',
                'description': 'Tentative ouverture litige par inconnu.',
            }
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_resolve(self):
        # Ouvrir le litige
        dispute = open_dispute(
            transaction=self.txn,
            opened_by=self.buyer,
            reason=Dispute.Reason.NON_DELIVERY,
            description='Description suffisamment longue pour le test.',
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f'/api/disputes/{dispute.id}/resolve/',
            {
                'decision': 'refund_buyer',
                'notes':    'Remboursement accordé après examen des preuves.',
            }
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['decision'], 'refund_buyer')

    def test_non_admin_cannot_resolve(self):
        dispute = open_dispute(
            transaction=self.txn,
            opened_by=self.buyer,
            reason=Dispute.Reason.FRAUD,
            description='Description suffisamment longue pour le test.',
        )
        self.client.force_authenticate(user=self.buyer)
        response = self.client.post(
            f'/api/disputes/{dispute.id}/resolve/',
            {'decision': 'refund_buyer'}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_short_description_rejected(self):
        self.client.force_authenticate(user=self.buyer)
        response = self.client.post(
            f'/api/disputes/open/{self.txn.token}/',
            {'reason': 'fraud', 'description': 'Trop court'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
