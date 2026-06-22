from rest_framework import serializers
from django.utils import timezone
from .models import Transaction


class TransactionCreateSerializer(serializers.ModelSerializer):
    """Création d'une transaction par le vendeur."""

    class Meta:
        model  = Transaction
        fields = [
            'amount_fcfa',
            'product_description',
            'delivery_zone',
            'delivery_deadline',
        ]

    def validate_amount_fcfa(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le montant doit être supérieur à 0.")
        if value < 500:
            raise serializers.ValidationError("Montant minimum : 500 FCFA.")
        return value

    def validate_delivery_deadline(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError(
                "La date de livraison doit être dans le futur."
            )
        return value


class TransactionPublicSerializer(serializers.ModelSerializer):
    """
    Vue publique d'une transaction — accessible via le token URL.
    Affichée à l'acheteur avant le dépôt.
    """
    net_fcfa     = serializers.IntegerField(read_only=True)
    seller_name  = serializers.CharField(source='seller.shop_name', read_only=True)
    seller_slug  = serializers.CharField(source='seller.shop_slug', read_only=True)
    trust_level  = serializers.CharField(source='seller.trust_score.level', read_only=True)

    class Meta:
        model  = Transaction
        fields = [
            'token',
            'seller_name',
            'seller_slug',
            'trust_level',
            'status',
            'amount_fcfa',
            'fee_fcfa',
            'net_fcfa',
            'product_description',
            'delivery_zone',
            'delivery_deadline',
            'created_at',
        ]
        read_only_fields = fields


class TransactionDetailSerializer(serializers.ModelSerializer):
    """Vue complète — pour le vendeur ou l'admin."""
    net_fcfa    = serializers.IntegerField(read_only=True)
    seller_name = serializers.CharField(source='seller.shop_name', read_only=True)
    buyer_phone = serializers.SerializerMethodField()

    class Meta:
        model  = Transaction
        fields = [
            'id',
            'token',
            'seller_name',
            'buyer_phone',
            'status',
            'amount_fcfa',
            'fee_fcfa',
            'net_fcfa',
            'product_description',
            'delivery_zone',
            'delivery_deadline',
            'psp_reference',
            'payout_reference',
            'confirmed_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

    def get_buyer_phone(self, obj):
        return obj.buyer.phone if obj.buyer else None


class TransactionListSerializer(serializers.ModelSerializer):
    """Vue résumée pour les listes."""
    net_fcfa    = serializers.IntegerField(read_only=True)
    seller_name = serializers.CharField(source='seller.shop_name', read_only=True)

    class Meta:
        model  = Transaction
        fields = [
            'id',
            'token',
            'seller_name',
            'status',
            'amount_fcfa',
            'net_fcfa',
            'product_description',
            'delivery_deadline',
            'created_at',
        ]
