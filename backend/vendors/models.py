from django.utils import timezone
import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


#Creation des modeles de la tables vendeurs 


class Vendor(models.Model):

    id = models.UUIDField(primary_key=True, 
                        default=uuid.uuid4, 
                        editable=False)     #Identifiant unique du vendeur

    user = models.OneToOneField(settings.AUTH_USER_MODEL,
                                on_delete=models.RESTRICT,  #impossible de supprimer un user s'il est lié à un vendeur actif
                                related_name='vendor_profile')
    
    shop_name = models.CharField(max_length=80)
    shop_slug = models.SlugField(max_length=80, unique=True)
    shop_logo = models.ImageField(upload_to='shop_logos/', null=True, blank=True)
    description = models.TextField(null = True, blank=True)
    is_pro = models.BooleanField(default=False)     #Abonnement pro ou pas
    pro_expire_at = models.DateTimeField(null=True, blank=True)     #Date d'expiration de l'abonnement pro
    total_secured_gmv = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)     #Total du GMV sécurisé
    qr_code_url = models.TextField(null=True, blank=True)     #URL du QR code de confiance du vendeur


    class Meta:
        db_table = 'vendors'

    def __str__(self):
        return f"{self.shop_name} (@{self.shop_slug})"
    

    @property
    def is_pro_active(self):
        #vérifie si l'abonnement pro est actif en vérifiant si is_pro est True et si la date d'expiration n'est pas encore passée
        if self.is_pro and self.pro_expire_at and self.pro_expire_at > timezone.now():
            return True
        return False

    @property
    def logo_url(self):
        if self.shop_logo:
            return self.shop_logo.url
        return None

    @property
    def trust_score(self):
        #Retourne le niveau de confiance du vendeur basé sur son score de confiance actuel
        try:
            return self.trustscores.level
        except TrustScore.DoesNotExist:
            return TrustScore.Level.GREY  #Si aucun score de confiance n'existe, retourne 'grey' par défaut




#Table sur le score de confiance du vendeur


class TrustScore(models.Model):

    class Level(models.TextChoices):
        GREEN = 'green', 'Vert certifié'
        GREY = 'grey', 'Gris inconnu'
        RED = 'red', 'Rouge bloqué'
        ORANGE = 'orange', 'Orange Suspect'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)     #Identifiant unique du score de confiance
    
    vendor = models.OneToOneField(Vendor,
                                on_delete=models.CASCADE, 
                                related_name='trustscores')    #Relation OneToOne avec le vendeur
    
    level = models.CharField(choices=Level.choices,
                            null=False,
                            blank=False,
                            default=Level.GREY)      #montre le dégré de confiance du vendeur
    
    score_value = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)], default=50)   #Score numérique de confiance du vendeur
    total_transactions = models.IntegerField(default=0)     #Nombre total de transactions effectuées par le vendeur
    disputes_rate_pct = models.FloatField(validators=[MinValueValidator(0.00), MaxValueValidator(100.00)])      #Taux de litiges par rapport au nombre total de transactions
    successful_delivery = models.IntegerField(default=0)     #Nombre total de livraisons réussies sans litiges par le vendeur
    last_fraud_flag = models.DateTimeField(null=True, blank=True)     #Date du dernier signalement de fraude pour le vendeur
    recalculated_at = models.DateTimeField(auto_now=True)     #Date de la dernière recalcul du score de confiance du vendeur

    
    class Meta:
        db_table = 'trustscores'


    def __str__(self):
        return f"Trustscore [{self.level} - {self.vendor.shop_name}]"
    
    #Calcul du score de confiance du vendeur basé sur les critères définis

    def recalculate(self):

        total = self.total_transactions
        disputes = (self.disputes_rate_pct * total) / 100

        #Calcul du score numérique
        if total == 0:
            self.score_value = 50  #Score neutre si aucune transaction n'a été effectuée
        else:
            base = (self.successful_delivery / total) * 100  #Score de base basé sur le taux de livraisons réussies

            penalty = float(self.disputes_rate_pct)*2  #Pénalité doublés par litige

            self.score_value = max(0, min(100, int(base - penalty)))    #Assure que le score est compris entre 0 et 100

        
        #Fraude récente = rouge

        if self.last_fraud_flag:
            if self.last_fraud_flag > timezone.now() - timezone.timedelta(days=30):
                self.level = self.Level.RED
                self.save()
                return

        #Couleur en fonction du score numérique
        if self.score_value >= 70 and total >= 10:
            self.level = self.Level.GREEN
        elif self.score_value >= 40 :
            self.level = self.Level.GREY
        elif self.score_value >= 20:
            self.level = self.Level.ORANGE
        else:
            self.level = self.Level.RED
        self.save()



#models pour la souscription à l'abonnement pro du vendeur

class Subscription(models.Model):

    class Plan(models.TextChoices):
        PRO = 'pro', 'Abonnement Pro'
        FREE = 'free', 'Abonnement Gratuit'

    id = models.UUIDField(primary_key=True, 
                        default=uuid.uuid4, 
                        editable=False)     #Identifiant unique de la souscription
    
    vendor = models.ForeignKey(Vendor, 
                               on_delete=models.SET_NULL, 
                               null=True,
                               blank=True,
                               related_name='subscriptions')     #Relation ManyToOne avec le vendeur
    
    plan = models.CharField(choices=Plan.choices, 
                            null=False, 
                            blank=False,
                            default=Plan.FREE)     #Type d'abonnement
    
    started_at = models.DateTimeField()     #Date de début de la souscription
    expires_at = models.DateTimeField()     #Date d'expiration de la souscription
    payment_ref = models.CharField(max_length=100, null=True, blank=True)     #Référence de paiement pour la souscription
    amount_fcfa = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)     #Montant de la souscription en FCFA
    auto_renew = models.BooleanField(default=True)     #Indique si la souscription doit être renouvelée automatiquement
    cancelled_at = models.DateTimeField(null=True, blank=True)     #Date d'annulation de la souscription
    created_at = models.DateTimeField(auto_now_add=True)     #Date de création de la souscription

    class Meta:
        db_table = 'subscriptions'
        ordering = ['-started_at']     #Ordonne les souscriptions par date de début décroissante

    def __str__(self):
        vendor_name = self.vendor.shop_name if self.vendor else 'unknown'
        return f"Subscription [{self.plan} - {vendor_name}]"

    @property
    def is_active(self):
        #Vérifie si la souscription est active en vérifiant si la date d'expiration n'est pas encore passée et si elle n'a pas été annulée
        if self.cancelled_at:
            return False
        return self.expires_at > timezone.now()



    


# Create your models here.
