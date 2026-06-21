from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from datetime import timedelta
from django.shortcuts import get_object_or_404

from .models import Vendor, Subscription

from .serializers import(

    VendorPublicSerializer,
    VendorDashboardSerializer,
    VendorCreateSerializer,
    SubscriptionSerializer

)


class VendorSahboardView(APIView):
    """
    GET /api/vendors/me/
    PUT /api/vendors/me/
    POST /api/vendors/create/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        vendor = get_object_or_404(Vendor, user=request.user)
        serializer = VendorDashboardSerializer(vendor)
        return Response(serializer.data)
    
    def put(self, request):
        vendor = get_object_or_404(Vendor, user=request.user)
        serializer = VendorDashboardSerializer(vendor,
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
    relation user-vendor: 1 :: 1
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        #Vérifions si le user posséde une boutique

        if hasattr(request.user, 'vendor_profile'):
            return Response(
                {"detail":"Vous avez deja une boutique."},
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
    
    GET /api/vendors/me/subscription/
    POST /api/vendors/me/subscription/
    PUT /api/vendors/me/subscription
    
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
    
    def post(self,request):
        """
        Souscrire au plan Pro apres paiement PSP.

        """

        vendor = get_object_or_404(Vendor, user=request.user)

        payment_ref = request.data.get('payment_ref')

        if not payment_ref:
            return Response(
                {"detail": "Référece de paiement manquante."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        #Vérifier que la référence n'est pas déja utiliser

        if Subscription.objects.filter(payment_ref=payment_ref).exists():
            return Response(
                {"detail": "Reference de paiement deja utilisee."},
                status=status.HTTP_400_BAD_REQUEST
            )

        subscription = Subscription.objects.create(
            vendor=vendor,
            plan=Subscription.Plan.PRO,
            started_at=timezone.now(),
            expires_at=timezone.now() + timedelta(days=30),
            payment_ref=payment_ref,
            amount_fcfa=request.data.get('amount_fcfa', 0),
            auto_renew=bool(request.data.get('auto_renew', True)),
        )

        vendor.is_pro = True
        vendor.pro_expire_at = subscription.expires_at
        vendor.save(update_fields=['is_pro', 'pro_expire_at'])

        return Response(SubscriptionSerializer(subscription).data, status=status.HTTP_201_CREATED)


# Create your views here.
