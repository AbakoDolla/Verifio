from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth (OTP, JWT, profil)
    path('api/auth/',     include('accounts.urls')),

    # Vendeurs
    path('api/vendors/',  include('vendors.urls')),

    # Transactions
    path('api/transactions/', include('transactions.urls')),

    # Litiges
    path('api/disputes/', include('disputes.urls')),

    # Notifications
    path('api/notifications/', include('notifications.urls')),
]
