from django.urls import path
from . import views
from .webhooks import PSPWebhookView

urlpatterns = [
    # Liste et création
    path('',                              views.TransactionListView.as_view(),   name='transaction-list'),
    path('create/',                       views.TransactionCreateView.as_view(), name='transaction-create'),

    # Page publique via token (lien partagé à l'acheteur)
    path('<str:token>/',                  views.TransactionPublicView.as_view(), name='transaction-public'),

    # Détail complet (vendeur/admin)
    path('<str:token>/detail/',           views.TransactionDetailView.as_view(), name='transaction-detail'),

    # Actions sur la transaction
    path('<str:token>/deposit/',          views.TransactionDepositView.as_view(),  name='transaction-deposit'),
    path('<str:token>/ship/',             views.TransactionShipView.as_view(),     name='transaction-ship'),
    path('<str:token>/confirm/',          views.TransactionConfirmView.as_view(),  name='transaction-confirm'),
    path('<str:token>/cancel/',           views.TransactionCancelView.as_view(),   name='transaction-cancel'),

    # Webhook PSP
    path('webhook/psp/',                  PSPWebhookView.as_view(),               name='webhook-psp'),
]
