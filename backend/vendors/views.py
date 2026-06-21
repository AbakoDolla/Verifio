from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404

from .models import Vendor, Subscription
from .serializers import (
    VendorPublicSerializer,
    VendorDashboardSerializer,
    VendorCreateSerializer,
    SubscriptionSerializer,
)


class VendorPublicProfileView(APIView):
    """
    GET /api/vendors/<slug>/
    Profil public d'une boutique — accessible sans authentification.
    """
    permission_classes = [AllowAny]

    def get(self, request, slug):
        vendor = get_object_or_404(Vendor, shop_slug=slug)
        serializer = VendorPublicSerializer(vendor)
        return Response(serializer.data)


class VendorDashboardView(APIView):
    """
    GET  /api/vendors/me/         → profil complet du vendeur connecté
    PUT  /api/vendors/me/         → modifier shop_name ou description
    POST /api/vendors/me/create/  → créer sa boutique
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        vendor = get_object_or_404(Vendor, user=request.user)
        serializer = VendorDashboardSerializer(vendor)
        return Response(serializer.data)

    def put(self, request):
        vendor = get_object_or_404(Vendor, user=request.user)
        serializer = VendorDashboardSerializer(
            vendor,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VendorCreateView(APIView):
    """
    POST /api/vendors/create/
    Crée une boutique pour l'utilisateur connecté.
    Un user ne peut avoir qu'une seule boutique (OneToOne).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Vérifier que l'user n'a pas déjà une boutique
        if hasattr(request.user, 'vendor'):
            return Response(
                {"detail": "Vous avez déjà une boutique."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = VendorCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            vendor = serializer.save()
            return Response(
                VendorDashboardSerializer(vendor).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SubscriptionView(APIView):
    """
    GET  /api/vendors/me/subscription/  → abonnement actif
    POST /api/vendors/me/subscription/  → souscrire au plan Pro
    PUT  /api/vendors/me/subscription/  → annuler le renouvellement
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        vendor = get_object_or_404(Vendor, user=request.user)
        sub = vendor.subscriptions.filter(
            cancelled_at__isnull=True
        ).order_by('-expires_at').first()

        if not sub or not sub.is_active:
            return Response({"detail": "Aucun abonnement actif."})

        return Response(SubscriptionSerializer(sub).data)

    def post(self, request):
        """Souscrire au plan Pro après paiement PSP."""
        from django.utils import timezone
        from datetime import timedelta

        vendor = get_object_or_404(Vendor, user=request.user)

        payment_ref = request.data.get('payment_ref')
        if not payment_ref:
            return Response(
                {"detail": "Référence de paiement manquante."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier que la référence n'est pas déjà utilisée
        if Subscription.objects.filter(payment_ref=payment_ref).exists():
            return Response(
                {"detail": "Référence de paiement déjà utilisée."},
                status=status.HTTP_400_BAD_REQUEST
            )

        now = timezone.now()
        sub = Subscription.objects.create(
            vendor=vendor,
            plan=Subscription.Plan.PRO,
            started_at=now,
            expires_at=now + timedelta(days=30),
            payment_ref=payment_ref,
            amount_fcfa=5000,
        )

        # Mettre à jour le vendor
        vendor.is_pro = True
        vendor.pro_expires_at = sub.expires_at
        vendor.save(update_fields=['is_pro', 'pro_expires_at'])

        return Response(
            SubscriptionSerializer(sub).data,
            status=status.HTTP_201_CREATED
        )

    def put(self, request):
        """Annuler le renouvellement automatique."""
        from django.utils import timezone

        vendor = get_object_or_404(Vendor, user=request.user)
        sub = vendor.subscriptions.filter(
            cancelled_at__isnull=True
        ).order_by('-expires_at').first()

        if not sub or not sub.is_active:
            return Response(
                {"detail": "Aucun abonnement actif à annuler."},
                status=status.HTTP_400_BAD_REQUEST
            )

        sub.auto_renew = False
        sub.cancelled_at = timezone.now()
        sub.save(update_fields=['auto_renew', 'cancelled_at'])

        return Response({"detail": "Renouvellement annulé."})
