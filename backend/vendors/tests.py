from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Vendor, TrustScore, Subscription

User = get_user_model()


class VendorModelTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            phone='+22670000001',
            name='Test Vendeur',
            password='testpass123',
            role='seller'
        )
        self.vendor = Vendor.objects.create(
            user=self.user,
            shop_slug='test-boutique',
            shop_name='Boutique Test',
        )
        TrustScore.objects.create(vendor=self.vendor)

    def test_vendor_created(self):
        self.assertEqual(self.vendor.shop_name, 'Boutique Test')
        self.assertFalse(self.vendor.is_pro)

    def test_is_pro_active_false_by_default(self):
        self.assertFalse(self.vendor.is_pro_active)

    def test_trust_level_grey_by_default(self):
        self.assertEqual(self.vendor.trust_level, TrustScore.Level.GREY)

    def test_trust_score_recalculate(self):
        ts = self.vendor.trust_score
        ts.total_transactions = 20
        ts.successful_deliveries = 18
        ts.dispute_rate_pct = 10.00
        ts.recalculate()
        # score = (18/20 * 100) - (10 * 2) = 90 - 20 = 70 → green
        self.assertEqual(ts.level, TrustScore.Level.GREEN)


class VendorAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            phone='+22670000002',
            name='API Vendeur',
            password='testpass123',
            role='seller'
        )
        self.client.force_authenticate(user=self.user)

    def test_create_vendor(self):
        response = self.client.post('/api/vendors/create/', {
            'shop_slug': 'ma-boutique',
            'shop_name': 'Ma Boutique',
            'description': 'Description test',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Vendor.objects.filter(shop_slug='ma-boutique').exists())
        # TrustScore créé automatiquement
        vendor = Vendor.objects.get(shop_slug='ma-boutique')
        self.assertTrue(hasattr(vendor, 'trust_score'))

    def test_cannot_create_two_vendors(self):
        Vendor.objects.create(
            user=self.user,
            shop_slug='premiere-boutique',
            shop_name='Première Boutique'
        )
        response = self.client.post('/api/vendors/create/', {
            'shop_slug': 'deuxieme-boutique',
            'shop_name': 'Deuxième Boutique',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_public_profile_accessible_without_auth(self):
        Vendor.objects.create(
            user=self.user,
            shop_slug='boutique-publique',
            shop_name='Boutique Publique'
        )
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/vendors/boutique-publique/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['shop_name'], 'Boutique Publique')

    def test_slug_invalid_characters(self):
        response = self.client.post('/api/vendors/create/', {
            'shop_slug': 'Boutique Invalide!',
            'shop_name': 'Test',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
