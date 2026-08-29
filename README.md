# 🚀 Pinal_Facture — SaaS de Facturation Professionnel pour l'Afrique

**Pinal_Facture** est un logiciel SaaS de facturation moderne, évolutif et pensé **Mobile First**, spécialement conçu pour les entrepreneurs, freelances, commerçants, prestataires de services et PME d'Afrique francophone (Sénégal, Côte d'Ivoire, Bénin, Mali, Cameroun, Togo, etc.).

---

## 🌟 Points Forts & Spécificités Africaines

- **100% FCFA & TVA à 18%** : Calculs précis du Hors Taxe (HT), de la TVA et du TTC, affichage conforme (ex: `125 000 FCFA`).
- **Suivi Multi-Paiements** : Enregistrement des règlements partiels et complets via **Wave**, **Orange Money**, **Espèces**, **Virement bancaire** et **Carte bancaire**.
- **Génération PDF A4 Professionnelle** : Factures et reçus prêts pour l'impression et le téléchargement vectoriel avec Logo, NIF/RCCM et mentions légales.
- **Portail Client & Lien Public Sécurisé** : Partage direct par lien web (ex: `/#/public-invoice/tok_...`) consultable par le client sans exposer le compte de l'entreprise.
- **Envoi Direct WhatsApp & Email** : Message pré-rempli avec lien direct pour un envoi instantané en 1 clic.
- **Tableau de Bord & KPIs Financiers** : Suivi en temps réel du Chiffre d'Affaires, des encaissements, des retards de paiement et graphique d'évolution mensuel.
- **CRM Clients 360°** : Fiche client complète avec historique de facturation et suivi des créances.
- **Catalogue Produits & Services** : Remplissage instantané des lignes de factures en un clic.
- **Numérotation Séquentielle Anti-Doublon** : Format automatique conforme `PF-2026-00001`.

---

## 🏗️ Architecture Technique

```
Pinal facture/
├── index.html                 # Point d'entrée SPA, polices Google, icônes et conteneurs
├── assets/
│   ├── css/
│   │   └── main.css           # Design System complet (Palette African Fintech, A4 print, responsive)
│   └── js/
│       ├── app.js             # Routeur SPA & Contrôleur de coquille
│       ├── db.js              # Moteur relationnel persistant (IndexedDB / LocalStorage)
│       ├── auth.js            # Service d'authentification & multi-tenant
│       ├── services/
│       │   ├── invoice.service.js      # Calculs HT/TVA/TTC, statuts & historique
│       │   ├── client.service.js       # CRM & calcul des métriques clients
│       │   ├── product.service.js      # Catalogue produits / prestations
│       │   ├── payment.service.js      # Multi-encaissements (Wave, OM, Cash)
│       │   ├── pdf.service.js          # Moteur de rendu PDF & impression
│       │   └── notification.service.js # Toasts & notifications métier
│       └── views/
│           ├── landing.js              # Landing page haute conversion & démo
│           ├── auth.js                 # Connexion, inscription & mot de passe oublié
│           ├── onboarding.js           # Assistant de configuration (< 2 min)
│           ├── dashboard.js            # Tableau de bord financier & graphiques SVG
│           ├── invoices.js             # Liste & éditeur dynamique de factures
│           ├── invoice-preview.js      # Aperçu A4, partage & portail public
│           ├── clients.js              # CRM clients & fiches 360°
│           ├── products.js             # Catalogue de prix et prestations
│           ├── payments.js             # Grand livre des encaissements
│           └── settings.js             # Profil, Entreprise, TVA & Sauvegardes
```

---

## ⚡ Démarrage Rapide

Ouvrez simplement le fichier `index.html` dans n'importe quel navigateur moderne (Chrome, Safari, Edge, Firefox, navigateurs mobiles).

### 🔑 Données de Démonstration Incluses :
- **Entreprise** : Pinal Tech Solutions (Dakar, Sénégal - NIF: SN-DKR-2026-B-12345)
- **Email** : `contact@pinaltech.sn`
- **Mot de passe** : `demo1234`
- Vous pouvez également basculer instantanément avec le bouton **"Tester la démonstration"** ou **"Mode Démo"**.

---

## 🛡️ Sécurité & Sauvegardes

- **Isolation stricte des données** entre utilisateurs et entreprises.
- **Exportation / Restauration JSON** dans la rubrique *Paramètres* pour exporter vos données comptables ou transférer votre espace.
