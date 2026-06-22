import os
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from transactions.models import Transaction
from .models import Dispute, Evidence
from .serializers import (
    DisputeOpenSerializer,
    DisputeResolveSerializer,
    DisputeDetailSerializer,
    DisputeListSerializer,
    EvidenceUploadSerializer,
    EvidenceSerializer,
)
from .services import (
    open_dispute,
    add_evidence,
    resolve_dispute,
    escalate_dispute,
)


class DisputeOpenView(APIView):
    """
    POST /api/disputes/<transaction_token>/open/
    L'acheteur ou le vendeur ouvre un litige sur une transaction.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, transaction_token):
        txn = get_object_or_404(Transaction, token=transaction_token)

        # Seuls l'acheteur ou le vendeur peuvent ouvrir un litige
        is_buyer  = txn.buyer == request.user
        is_seller = hasattr(request.user, 'vendor') and txn.seller == request.user.vendor

        if not (is_buyer or is_seller):
            return Response(
                {"detail": "Vous n'êtes pas partie de cette transaction."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = DisputeOpenSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            dispute = open_dispute(
                transaction=txn,
                opened_by=request.user,
                reason=serializer.validated_data['reason'],
                description=serializer.validated_data['description'],
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            DisputeDetailSerializer(dispute).data,
            status=status.HTTP_201_CREATED
        )


class DisputeDetailView(APIView):
    """
    GET /api/disputes/<dispute_id>/
    Détail complet d'un litige.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, dispute_id):
        dispute = get_object_or_404(Dispute, id=dispute_id)

        # Vérifier que l'user est partie au litige ou admin
        is_buyer  = dispute.transaction.buyer == request.user
        is_seller = (
            hasattr(request.user, 'vendor') and
            dispute.transaction.seller == request.user.vendor
        )
        is_admin  = request.user.role == 'admin'

        if not (is_buyer or is_seller or is_admin):
            return Response(
                {"detail": "Accès non autorisé."},
                status=status.HTTP_403_FORBIDDEN
            )

        return Response(DisputeDetailSerializer(dispute).data)


class DisputeListView(APIView):
    """
    GET /api/disputes/
    - Vendeur : litiges de ses transactions
    - Admin   : tous les litiges (avec filtre par statut)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        is_admin = request.user.role == 'admin'

        if is_admin:
            disputes = Dispute.objects.select_related(
                'transaction', 'opened_by'
            ).all()
        elif hasattr(request.user, 'vendor'):
            disputes = Dispute.objects.filter(
                transaction__seller=request.user.vendor
            ).select_related('transaction', 'opened_by')
        else:
            disputes = Dispute.objects.filter(
                transaction__buyer=request.user
            ).select_related('transaction', 'opened_by')

        # Filtre par statut
        status_filter = request.query_params.get('status')
        if status_filter:
            disputes = disputes.filter(status=status_filter)

        return Response(DisputeListSerializer(disputes, many=True).data)


class EvidenceUploadView(APIView):
    """
    POST /api/disputes/<dispute_id>/evidences/
    Upload d'une pièce justificative.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, dispute_id):
        dispute = get_object_or_404(Dispute, id=dispute_id)

        # Vérifier que l'user est partie au litige
        is_buyer  = dispute.transaction.buyer == request.user
        is_seller = (
            hasattr(request.user, 'vendor') and
            dispute.transaction.seller == request.user.vendor
        )

        if not (is_buyer or is_seller):
            return Response(
                {"detail": "Accès non autorisé."},
                status=status.HTTP_403_FORBIDDEN
            )

        if not dispute.is_open:
            return Response(
                {"detail": "Ce litige est déjà résolu."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = EvidenceUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        file     = serializer.validated_data['file']
        metadata = serializer.validated_data.get('metadata', {})

        # Lire le contenu pour le hash
        file_content = file.read()

        # Stocker le fichier (Supabase Storage ou local en dev)
        storage_url = _store_file(file, dispute_id)

        try:
            evidence = add_evidence(
                dispute=dispute,
                uploaded_by=request.user,
                evidence_type=serializer.validated_data['type'],
                file_content=file_content,
                storage_url=storage_url,
                metadata=metadata,
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            EvidenceSerializer(evidence).data,
            status=status.HTTP_201_CREATED
        )

    def get(self, request, dispute_id):
        """Liste des preuves d'un litige."""
        dispute = get_object_or_404(Dispute, id=dispute_id)
        evidences = dispute.evidences.all()
        return Response(EvidenceSerializer(evidences, many=True).data)


class DisputeResolveView(APIView):
    """
    POST /api/disputes/<dispute_id>/resolve/
    Résolution du litige — admin uniquement.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, dispute_id):
        if request.user.role != 'admin':
            return Response(
                {"detail": "Réservé aux administrateurs Verifio."},
                status=status.HTTP_403_FORBIDDEN
            )

        dispute = get_object_or_404(Dispute, id=dispute_id)

        serializer = DisputeResolveSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            dispute = resolve_dispute(
                dispute=dispute,
                decision=serializer.validated_data['decision'],
                decided_by=request.user,
                notes=serializer.validated_data.get('notes', ''),
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(DisputeDetailSerializer(dispute).data)


class DisputeEscalateView(APIView):
    """
    POST /api/disputes/<dispute_id>/escalate/
    Escalade un litige complexe — admin uniquement.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, dispute_id):
        if request.user.role != 'admin':
            return Response(
                {"detail": "Réservé aux administrateurs Verifio."},
                status=status.HTTP_403_FORBIDDEN
            )

        dispute = get_object_or_404(Dispute, id=dispute_id)

        try:
            dispute = escalate_dispute(dispute, escalated_by=request.user)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Litige escaladé.", "status": dispute.status})


# ─── Stockage fichier ─────────────────────────────────────────────────────────

def _store_file(file, dispute_id):
    """
    Stocke le fichier dans Supabase Storage (prod) ou localement (dev).
    Retourne l'URL de stockage.
    """
    if os.getenv('DJANGO_ENV') == 'production':
        # Intégration Supabase Storage
        # À implémenter avec le client Supabase Python
        raise NotImplementedError("Supabase Storage à configurer en production.")
    else:
        # Dev — sauvegarder localement dans media/
        import os as _os
        from django.conf import settings as django_settings

        upload_dir = _os.path.join(django_settings.MEDIA_ROOT, 'disputes', str(dispute_id))
        _os.makedirs(upload_dir, exist_ok=True)

        file_path = _os.path.join(upload_dir, file.name)
        with open(file_path, 'wb') as f:
            for chunk in file.chunks():
                f.write(chunk)

        return f"/media/disputes/{dispute_id}/{file.name}"
