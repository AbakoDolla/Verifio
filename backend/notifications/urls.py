from django.urls import path
from . import views

urlpatterns = [
    # Notifications de l'utilisateur connecté
    path('',
         views.NotificationListView.as_view(),
         name='notification-list'),

    # Vue admin
    path('admin/',
         views.NotificationAdminListView.as_view(),
         name='notification-admin'),

    # Webhook Twilio delivery receipts
    path('webhook/twilio/',
         views.TwilioWebhookView.as_view(),
         name='webhook-twilio'),
]
