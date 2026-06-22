from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404

from .models import Transaction
from .serializers import (
    TransactionCreateSerializer,
    TransactionPublicSerializer,
    TransactionDetailSerializer,
    TransactionListSerializer,
)
from .services import (
    create_transaction,
    initiate_payment,
    mark_delivery_in_progress,
    confirm_delivery,
    cancel_transaction,
)


class TransactionCreateView(APIView):
    """
    POST /api/transactions/
    Le vendeur crée une nouvelle transaction escrow.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Vérifier que l'user est un vendeur
        if not hasattr(request.user, 'vendor'):
            return Response(
                {"detail": "Seuls les vendeurs peuvent créer des transactions."},
                status=status.HTTP_403_FORBIDDEN
            )

        vendor = request.user.vendor

        # Vérifier que le compte n'est pas gelé
        if vendor.is_frozen:
            return Response(
                {"detail": "Votre compte est gelé. Contactez le support Verifio."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = TransactionCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        txn = create_transaction(vendor, serializer.validated_data)

        return Response(
            TransactionDetailSerializer(txn).data,
            status=status.HTTP_201_CREATED
        )


class TransactionPublicView(APIView):
    """
    GET /api/transactions/<token>/
    Page publique de la transaction — accessible à l'acheteur via le lien partagé.
    Pas besoin d'être connecté.
    """
    permission_classes = [AllowAny]

    def get(self, request, token):
        txn = get_object_or_404(Transaction, token=token)

        # Ne pas exposer les transactions annulées
        if txn.status == Transaction.Status.CANCELLED:
            return Response(
                {"detail": "Cette transaction n'est plus disponible."},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(TransactionPublicSerializer(txn).data)


class TransactionDepositView(APIView):
    """
    POST /api/transactions/<token>/deposit/
    L'acheteur initie le dépôt des fonds.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, token):
        txn = get_object_or_404(Transaction, token=token)

        # Vérifier que la transaction est bien en attente de paiement
        if txn.status != Transaction.Status.INITIATED:
            return Response(
                {"detail": f"Cette transaction est déjà en statut '{txn.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # L'acheteur ne peut pas être le vendeur
        if txn.seller.user == request.user:
            return Response(
                {"detail": "Vous ne pouvez pas acheter votre propre produit."},
                status=status.HTTP_400_BAD_REQUEST
            )

        txn = initiate_payment(txn, buyer=request.user)

        return Response({
            "detail": "Dépôt initié. Procédez au paiement Mobile Money.",
            "token":  txn.token,
            "amount": txn.amount_fcfa,
            "fee":    txn.fee_fcfa,
            "status": txn.status,
        })


class TransactionShipView(APIView):
    """
    POST /api/transactions/<token>/ship/
    Le vendeur confirme l'expédition.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, token):
        txn = get_object_or_404(Transaction, token=token)

        # Vérifier que c'est bien le vendeur de cette transaction
        if txn.seller.user != request.user:
            return Response(
                {"detail": "Action non autorisée."},
                status=status.HTTP_403_FORBIDDEN
            )

        if txn.status != Transaction.Status.FUNDS_SECURED:
            return Response(
                {"detail": "Les fonds doivent être sécurisés avant l'expédition."},
                status=status.HTTP_400_BAD_REQUEST
            )

        txn = mark_delivery_in_progress(txn)

        return Response({
            "detail": "Expédition confirmée. En attente de validation acheteur.",
            "status": txn.status,
        })


class TransactionConfirmView(APIView):
    """
    POST /api/transactions/<token>/confirm/
    L'acheteur confirme la réception conforme → déclenche le payout.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, token):
        txn = get_object_or_404(Transaction, token=token)

        # Vérifier que c'est bien l'acheteur
        if txn.buyer != request.user:
            return Response(
                {"detail": "Action non autorisée."},
                status=status.HTTP_403_FORBIDDEN
            )

        if txn.status != Transaction.Status.DELIVERY_IN_PROGRESS:
            return Response(
                {"detail": "La livraison doit être en cours pour confirmer."},
                status=status.HTTP_400_BAD_REQUEST
            )

        txn = confirm_delivery(txn)

        return Response({
            "detail": "Réception confirmée. Paiement libéré au vendeur.",
            "status": txn.status,
        })


class TransactionCancelView(APIView):
    """
    POST /api/transactions/<token>/cancel/
    Annule une transaction (avant sécurisation uniquement).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, token):
        txn = get_object_or_404(Transaction, token=token)

        # Seul le vendeur peut annuler
        if txn.seller.user != request.user:
            return Response(
                {"detail": "Action non autorisée."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            txn = cancel_transaction(txn)
        except ValueError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            "detail": "Transaction annulée.",
            "status": txn.status,
        })


class TransactionListView(APIView):
    """
    GET /api/transactions/
    Liste des transactions du vendeur connecté.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'vendor'):
            return Response(
                {"detail": "Accès réservé aux vendeurs."},
                status=status.HTTP_403_FORBIDDEN
            )

        txns = Transaction.objects.filter(
            seller=request.user.vendor
        ).order_by('-created_at')

        # Filtrer par statut si fourni
        status_filter = request.query_params.get('status')
        if status_filter:
            txns = txns.filter(status=status_filter)

        serializer = TransactionListSerializer(txns, many=True)
        return Response(serializer.data)


class TransactionDetailView(APIView):
    """
    GET /api/transactions/<token>/detail/
    Détail complet — vendeur ou admin uniquement.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, token):
        txn = get_object_or_404(Transaction, token=token)

        # Seul le vendeur ou un admin peut voir le détail complet
        is_seller = hasattr(request.user, 'vendor') and txn.seller == request.user.vendor
        is_admin  = request.user.role == 'admin'

        if not (is_seller or is_admin):
            return Response(
                {"detail": "Accès non autorisé."},
                status=status.HTTP_403_FORBIDDEN
            )

        return Response(TransactionDetailSerializer(txn).data)
