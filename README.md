# 🛡️ VERIFIO

> L'infrastructure de confiance pour le commerce local et le social commerce via Mobile Money.

**Verifio** est une plateforme de tiers de confiance (Escrow) conçue pour sécuriser les transactions entre particuliers sur les réseaux sociaux (WhatsApp, Instagram, Facebook).

Elle agit comme un **coffre-fort temporaire digital** : l’application protège les acheteurs contre les arnaques au paiement en rendant chaque transaction plus simple, rapide et sécurisée.

---

## 💡 Le Problème & Notre Solution

Dans le commerce en ligne local, un déséquilibre de confiance bloque de nombreuses ventes :

- L’acheteur hésite à payer sans garantie de réception ❌  
- Le vendeur hésite à expédier sans garantie de paiement ❌  

**Verifio résout ce problème** grâce à un système d’**Escrow Mobile Money** :

👉 Les fonds de l’acheteur sont gelés temporairement  
👉 Le paiement n’est libéré qu’après confirmation de réception et de conformité du produit  

---

## 🔄 Fonctionnement de la Plateforme

Le parcours utilisateur est conçu pour être simple, rapide et *mobile-first* :

1. **Initiation**
   - Le vendeur ou l’acheteur crée une transaction sécurisée
   - Un lien de paiement unique Verifio est généré

2. **Sécurisation (Dépôt des fonds)**
   - L’acheteur paie via Mobile Money (MTN, Orange, Wave)
   - Les fonds sont automatiquement bloqués par Verifio

3. **Confirmation vendeur**
   - Le vendeur reçoit une notification confirmant la sécurité des fonds
   - Il peut expédier le produit en toute confiance

4. **Livraison & libération**
   - L’acheteur confirme la réception du colis
   - Verifio libère automatiquement les fonds vers le vendeur

---

## ✨ Fonctionnalités Majeures

- 🧑‍💼 Profils marchands certifiés avec historique de ventes  
- 📊 Système de réputation et indice de confiance  
- 📸 Générateur de QR Code de confiance partageable  
- ⚖️ Gestion des litiges intégrée  
- 📱 Support multi-opérateurs Mobile Money  
- ⚡ Expérience fluide, rapide et mobile-first  

---

## 🚀 Lancement en mode développement

### 📌 Prérequis
- Node.js + npm ou pnpm  
- Python 3.10+  

---

### 🖥️ Frontend (Interface utilisateur)

```bash
cd frontend
pnpm install
pnpm run dev

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

