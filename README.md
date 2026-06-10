```markdown
# VERIFIO 🛡️

> L'infrastructure de confiance pour le commerce local et le social commerce par Mobile Money.

**Verifio** est une plateforme de tiers de confiance (Escrow) conçue pour sécuriser les transactions de gré à gré sur les réseaux sociaux (WhatsApp, Instagram, Facebook). En agissant comme un coffre-fort temporaire, l'application protège les acheteurs contre les arnaques au paiement de manière simple, rapide et accessible.

---

## 💡 Le Problème & Notre Solution

Dans le commerce en ligne local, l'asymétrie de confiance bloque des milliers de ventes : l'acheteur a peur de payer avant d'être livré, et le vendeur a peur d'expédier sans garantie de paiement. 

**Verifio résout cette impasse** en gelant les fonds de l'acheteur via Mobile Money. L'argent n'est transféré au vendeur que lorsque l'acheteur confirme la réception et la conformité de son colis.

---

## 🔄 Fonctionnement de la Plateforme

Le parcours utilisateur a été optimisé pour être fluide, rapide et *mobile-first* :

1. **L'Initiation :** Le vendeur ou l'acheteur crée une intention de transaction sécurisée et génère un lien de paiement unique Verifio.
2. **La Sécurisation (Le Dépôt) :** L'acheteur clique sur le lien, accède à l'interface sécurisée et dépose les fonds via son opérateur Mobile Money (MTN, Orange, Wave). Les fonds sont alors gelés par Verifio.
3. **Le Feu Vert :** Dès la réception des fonds, le vendeur reçoit une notification automatique lui confirmant que l'argent est sécurisé et qu'il peut procéder à l'expédition en toute sérénité.
4. **La Livraison & Libération :** Une fois le colis entre les mains de l'acheteur et vérifié, ce dernier valide la réception sur l'application. Verifio débloque instantanément l'argent vers le compte Mobile Money du vendeur.

---

## ✨ Fonctionnalités Majeures

* **Profils Marchands Certifiés :** Pages vitrines pour les vendeurs affichant leur historique de ventes réussies et leur indice de confiance global.
* **Générateur de QR Code :** Un badge de confiance unique téléchargeable pour les stories Instagram ou les boutiques physiques.
* **Gestion des Litiges Intégrée :** Un protocole clair de médiation en cas de produit non conforme ou de retard de livraison.
* **Interface Multi-Opérateurs :** Prise en charge des principaux moyens de paiement Mobile Money locaux en une seule interface épurée.

---

## 🚀 Lancement en Mode Développement

### Prérequis
* Node.js & un gestionnaire de paquets (`pnpm` ou `npm`)
* Python 3.10+

### Composant Frontend (Interface Utilisateur)
1. Accédez au dossier de l'interface :
```bash
   cd frontend

```
 2. Installez les modules requis :
```bash
   pnpm install

```
 3. Lancez l'application en local :
```bash
   pnpm run dev

```
### Composant Backend (Moteur Logique)
 1. Accédez au dossier du serveur :
```bash
   cd backend

```
 2. Activez votre environnement virtuel et installez les dépendances :
```bash
   pip install -r requirements.txt

```
 3. Lancez le serveur d'API :
```bash
   python manage.py runserver

```
## 👥 Équipe
 * **Product & UI Developer :** Evans Abah
 * **Core & Infrastructure Developer :** Emanuel Epesse**
© 2026 Verifio. Tous droits réservés.
```

```

