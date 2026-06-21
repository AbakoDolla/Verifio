import re
from rest_framework import serializers
from .models import Vendor, TrustScore, Subscription

class TrustScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrustScore
        fields = [
                  'level', 
                  'score_value', 
                  'total_transactions', 
                  'disputes_rate_pct', 
                  'successful_delivery', 
                  'recalculated_at'
                ]
        read_only_fields = fields  #Tous les champs sont en lecture seule, le score est recalculé automatiquement


class SubscriptionSerializer(serializers.ModelSerializer):

    is_active = serializers.BooleanField(read_only=True)  #Le statut d'activation est calculé automatiquement en fonction des dates

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
            'cancelled_at'
            ]
        read_only_fields = ['id', 'started_at', 'amount_fcfa', 'is_active']  #Le vendeur et les dates sont gérés automatiquement


class VendorPublicSerializer(serializers.ModelSerializer):
    trust_score = TrustScoreSerializer(read_only=True)  #Inclut les informations de trust score dans la sérialisation du vendeur

    class Meta:
        model = Vendor
        fields = [
            'shop_slug', 
            'shop_name', 
            'description', 
            'is_pro_active',
            'logo_url',
            'total_secured_gmv',
            'verified_at', 
            'qr_code_url', 
            'trust_score'
        ]

class VendorDashboardSerializer(serializers.ModelSerializer):

    trust_score = TrustScoreSerializer(read_only=True)  #Inclut les informations de trust score dans la sérialisation du vendeur
    is_pro_active = serializers.BooleanField(read_only=True)  #Indique si le vendeur a un abonnement pro actif
    active_subscription = serializers.SerializerMethodField(read_only=True)  #Inclut les informations de l'abonnement actif du vendeur

    class Meta:
        model = Vendor
        fields = [
            'id',
            'shop_slug', 
            'shop_name', 
            'description',
            'is_pro', 
            'is_pro_active',
            'pro_expire_at',
            'logo_url',
            'total_secured_gmv',
            'verified_at', 
            'qr_code_url', 
            'trust_score',
            'active_subscription',
            'created_at',
            'updated_at'
        ]

        read_only_fields = [
            'id',
            'is_pro',
            'pro_expire_at',
            'total_secured_gmv',
            'verified_at',
            'created_at',
            'updated_at'
        ]

    def get_active_subscription(self, obj):
        sub = obj.subscriptions.filter(
            cancelled_at__isnull=True
        ).order_by('-expires_at').first()

        if sub and sub.is_active:
            return SubscriptionSerializer(sub).data
        return None
    
class VendorCreateSerializer(serializers.ModelSerializer):


    class Meta:
        model = Vendor

        fields = [
            'shop_slug',
            'shop_name',
            'description'
        ]

    def validate_shop_slug(self, value):
        if Vendor.objects.filter(shop_slug=value).exists():
            raise serializers.ValidationError("Ce slug est deja pris")
        if not re.match(r'^[a-z0-9-]+$', value):
            raise serializers.ValidationError(
                "Le slug ne peut contenir que des minuscules, chiffres et tirets"
            )

        return value

    def create(self, validated_data):
        user = self.context['request'].user
        vendor = Vendor.objects.create(user=user, **validated_data)

        TrustScore.objects.create(vendor=vendor)
        return vendor
