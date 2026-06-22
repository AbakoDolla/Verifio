from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from vendors.models import Vendor, TrustScore
from .models import Transaction
from .services import (
    create_transaction,
    initiate_payment,
    confirm_delivery,
    cancel_transaction,
)

User = get_user_model()


def make_seller():
    user = User.objects.create_user(
        phone='+22670000010', name='Vendeur Test', role='seller'
    )
    vendor = Vendor.objects.create(
        user=user, shop_slug='test-shop', shop_name='Test Shop'
    )
    TrustScore.objects.create(vendor=vendor)
    return user, vendor


def make_buyer():
    return User.objects.create_user(
        phone='+22670000011', name='Acheteur Test', role='buyer'
    )


def make_txn(vendor):
    return create_transaction(vendor, {
        'amount_fcfa':         25000,
        'product_description': 'Robe wax taille M',
        'delivery_zone':       'Secteur 12',
        'delivery_deadline':   timezone.now() + timedelta(days=3),
    })


class TransactionModelTest(TestCase):

    def setUp(self):
        self.seller_user, self.vendor = make_seller()
        self.buyer = make_buyer()
        self.txn = make_txn(self.vendor)

    def test_token_generated(self):
        self.assertIsNotNone(self.txn.token)
        self.assertGreater(len(self.txn.token), 20)

    def test_net_fcfa(self):
        self.assertEqual(self.txn.net_fcfa, 25000 - 200)

    def test_default_status_initiated(self):
        self.assertEqual(self.txn.status, Transaction.Status.INITIATED)

    def test_valid_transition(self):
        self.assertTrue(
            self.txn.can_transition_to(Transaction.Status.PAYMENT_PENDING)
        )

    def test_invalid_transition(self):
        self.assertFalse(
            self.txn.can_transition_to(Transaction.Status.COMPLETED)
        )

    def test_transition_raises_on_invalid(self):
        with self.assertRaises(ValueError):
            self.txn.transition_to(Transaction.Status.COMPLETED)


class TransactionServiceTest(TestCase):

    def setUp(self):
        self.seller_user, self.vendor = make_seller()
        self.buyer = make_buyer()

    def test_initiate_payment(self):
        txn = make_txn(self.vendor)
        txn = initiate_payment(txn, self.buyer)
        self.assertEqual(txn.status, Transaction.Status.PAYMENT_PENDING)
        self.assertEqual(txn.buyer, self.buyer)

    def test_cancel_before_payment(self):
        txn = make_txn(self.vendor)
        txn = cancel_transaction(txn)
        self.assertEqual(txn.status, Transaction.Status.CANCELLED)

    def test_cannot_cancel_after_funds_secured(self):
        txn = make_txn(self.vendor)
        txn.status = Transaction.Status.FUNDS_SECURED
        txn.save()
        with self.assertRaises(ValueError):
            cancel_transaction(txn)


class TransactionAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.seller_user, self.vendor = make_seller()
        self.buyer = make_buyer()

    def test_create_transaction_as_seller(self):
        self.client.force_authenticate(user=self.seller_user)
        response = self.client.post('/api/transactions/create/', {
            'amount_fcfa':         15000,
            'product_description': 'Chaussures',
            'delivery_zone':       'Bobo-Dioulasso',
            'delivery_deadline':   (timezone.now() + timedelta(days=2)).isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)

    def test_buyer_cannot_create_transaction(self):
        self.client.force_authenticate(user=self.buyer)
        response = self.client.post('/api/transactions/create/', {
            'amount_fcfa': 10000,
            'product_description': 'Test',
            'delivery_zone': 'Zone A',
            'delivery_deadline': (timezone.now() + timedelta(days=1)).isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_public_view_accessible_without_auth(self):
        txn = make_txn(self.vendor)
        response = self.client.get(f'/api/transactions/{txn.token}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['amount_fcfa'], 25000)

    def test_deposit_by_buyer(self):
        txn = make_txn(self.vendor)
        self.client.force_authenticate(user=self.buyer)
        response = self.client.post(f'/api/transactions/{txn.token}/deposit/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        txn.refresh_from_db()
        self.assertEqual(txn.status, Transaction.Status.PAYMENT_PENDING)

    def test_seller_cannot_buy_own_product(self):
        txn = make_txn(self.vendor)
        self.client.force_authenticate(user=self.seller_user)
        response = self.client.post(f'/api/transactions/{txn.token}/deposit/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filter_by_status(self):
        make_txn(self.vendor)
        make_txn(self.vendor)
        self.client.force_authenticate(user=self.seller_user)
        response = self.client.get('/api/transactions/?status=initiated')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
