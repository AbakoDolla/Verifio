from django.contrib import admin
from .models import Vendor, TrustScore, Subscription


class TrustScoreInline(admin.StackedInline):
    model = TrustScore
    readonly_fields = ['score_value', 'total_transactions', 'dispute_rate_pct',
                       'successful_deliveries', 'recalculated_at']
    extra = 0


class SubscriptionInline(admin.TabularInline):
    model = Subscription
    readonly_fields = ['started_at', 'expires_at', 'payment_ref', 'amount_fcfa', 'created_at']
    extra = 0


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display  = ['shop_name', 'shop_slug', 'is_pro', 'total_secured_gmv', 'verified_at']
    list_filter   = ['is_pro']
    search_fields = ['shop_name', 'shop_slug', 'user__phone']
    readonly_fields = ['total_secured_gmv', 'created_at', 'updated_at']
    inlines = [TrustScoreInline, SubscriptionInline]


@admin.register(TrustScore)
class TrustScoreAdmin(admin.ModelAdmin):
    list_display  = ['vendor', 'level', 'score_value', 'total_transactions', 'dispute_rate_pct']
    list_filter   = ['level']
    readonly_fields = ['recalculated_at']
    actions = ['recalculate_scores']

    @admin.action(description="Recalculer les scores sélectionnés")
    def recalculate_scores(self, request, queryset):
        for trust_score in queryset:
            trust_score.recalculate()
        self.message_user(request, f"{queryset.count()} scores recalculés.")


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display  = ['vendor', 'plan', 'started_at', 'expires_at', 'auto_renew', 'cancelled_at']
    list_filter   = ['plan', 'auto_renew']
    readonly_fields = ['created_at']
