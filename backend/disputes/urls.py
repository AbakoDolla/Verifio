from django.urls import path
from . import views

urlpatterns = [
    # Liste des litiges
    path('',
         views.DisputeListView.as_view(),
         name='dispute-list'),

    # Ouvrir un litige sur une transaction
    path('open/<str:transaction_token>/',
         views.DisputeOpenView.as_view(),
         name='dispute-open'),

    # Détail d'un litige
    path('<uuid:dispute_id>/',
         views.DisputeDetailView.as_view(),
         name='dispute-detail'),

    # Preuves
    path('<uuid:dispute_id>/evidences/',
         views.EvidenceUploadView.as_view(),
         name='dispute-evidences'),

    # Résolution — admin uniquement
    path('<uuid:dispute_id>/resolve/',
         views.DisputeResolveView.as_view(),
         name='dispute-resolve'),

    # Escalade — admin uniquement
    path('<uuid:dispute_id>/escalate/',
         views.DisputeEscalateView.as_view(),
         name='dispute-escalate'),
]
