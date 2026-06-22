from django.contrib import admin
from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display  = [
        'token_short', 'seller', 'buyer', 'status',
        'amount_fcfa', 'net_fcfa', 'created_at'
    ]
    list_filter   = ['status']
    search_fields = ['token', 'seller__shop_name', 'buyer__phone']
    readonly_fields = [
        'id', 'token', 'net_fcfa', 'psp_reference',
        'payout_reference', 'confirmed_at', 'created_at', 'updated_at'
    ]
    ordering = ['-created_at']

    fieldsets = (
        ('Identifiants', {
            'fields': ('id', 'token')
        }),
        ('Parties', {
            'fields': ('seller', 'buyer')
        }),
        ('Montants', {
            'fields': ('amount_fcfa', 'fee_fcfa', 'net_fcfa')
        }),
        ('Commande', {
            'fields': ('product_description', 'delivery_zone', 'delivery_deadline')
        }),
        ('Statut & Paiement', {
            'fields': ('status', 'psp_reference', 'payout_reference', 'confirmed_at')
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    def token_short(self, obj):
        return obj.token[:12] + '...'
    token_short.short_description = 'Token'

    def net_fcfa(self, obj):
        return f"{obj.net_fcfa} FCFA"
    net_fcfa.short_description = 'Net vendeur'
