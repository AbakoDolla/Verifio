from rest_framework import serializers
from .models import Vendor, TrustScore, Subscription


class TrustScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrustScore
        fields = [
            'level',
            'score_value',
            'total_transactions',
            'dispute_rate_pct',
            'successful_deliveries',
            'recalculated_at',
        ]
        read_only_fields = fields


class SubscriptionSerializer(serializers.ModelSerializer):
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id',
            'plan',
            'started_at',
            'expires_at',
            'amount_fcfa',
            'auto_renew',
            'is_active',
            'cancelled_at',
        ]
        read_only_fields = ['id', 'started_at', 'amount_fcfa', 'is_active']


class VendorPublicSerializer(serializers.ModelSerializer):
    """Profil public visible par tout le monde (page /shop/slug)."""
    trust_score = TrustScoreSerializer(read_only=True)
    is_pro_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Vendor
        fields = [
            'shop_slug',
            'shop_name',
            'description',
            'is_pro_active',
            'total_secured_gmv',
            'verified_at',
            'qr_code_url',
            'trust_score',
        ]


class VendorDashboardSerializer(serializers.ModelSerializer):
    """Profil complet visible uniquement par le vendeur connecté."""
    trust_score = TrustScoreSerializer(read_only=True)
    is_pro_active = serializers.BooleanField(read_only=True)
    active_subscription = serializers.SerializerMethodField()

    class Meta:
        model = Vendor
        fields = [
            'id',
            'shop_slug',
            'shop_name',
            'description',
            'is_pro',
            'is_pro_active',
            'pro_expires_at',
            'total_secured_gmv',
            'verified_at',
            'qr_code_url',
            'trust_score',
            'active_subscription',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 'is_pro', 'pro_expires_at',
            'total_secured_gmv', 'verified_at', 'created_at', 'updated_at'
        ]

    def get_active_subscription(self, obj):
        sub = obj.subscriptions.filter(
            cancelled_at__isnull=True
        ).order_by('-expires_at').first()
        if sub and sub.is_active:
            return SubscriptionSerializer(sub).data
        return None


class VendorCreateSerializer(serializers.ModelSerializer):
    """Création d'une nouvelle boutique vendeur."""

    class Meta:
        model = Vendor
        fields = ['shop_slug', 'shop_name', 'description']

    def validate_shop_slug(self, value):
        if Vendor.objects.filter(shop_slug=value).exists():
            raise serializers.ValidationError("Ce slug est déjà pris.")
        # Slug ne doit contenir que lettres, chiffres et tirets
        import re
        if not re.match(r'^[a-z0-9-]+$', value):
            raise serializers.ValidationError(
                "Le slug ne peut contenir que des minuscules, chiffres et tirets."
            )
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        vendor = Vendor.objects.create(user=user, **validated_data)
        # Créer automatiquement un TrustScore vide
        TrustScore.objects.create(vendor=vendor)
        return vendor
