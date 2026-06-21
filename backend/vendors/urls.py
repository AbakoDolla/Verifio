from django.urls import path
from . import views

urlpatterns = [
    # Profil public — pas besoin d'être connecté
    path('<slug:slug>/', views.VendorPublicProfileView.as_view(), name='vendor-public'),

    # Création de boutique
    path('create/', views.VendorCreateView.as_view(), name='vendor-create'),

    # Dashboard vendeur connecté
    path('me/', views.VendorDashboardView.as_view(), name='vendor-dashboard'),

    # Abonnement Pro
    path('me/subscription/', views.SubscriptionView.as_view(), name='vendor-subscription'),
]
