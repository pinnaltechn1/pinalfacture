/**
 * PINAL_FACTURE — Vue Landing Page Haute Conversion
 */

import { auth } from '../auth.js';

export function renderLandingView(container) {
  const isAuth = auth.isAuthenticated();

  container.innerHTML = `
    <!-- Top Navigation -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div class="max-w-7xl px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center text-white font-black text-xl shadow-md" style="background: linear-gradient(135deg, #0F766E 0%, #134E4A 100%);">
            P
          </div>
          <div>
            <span class="font-extrabold text-xl tracking-tight text-slate-900">Pinal<span class="text-primary-700">_Facture</span></span>
            <span class="hidden sm:inline-block ml-2 text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">SaaS Afrique</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          ${isAuth ? `
            <a href="#/dashboard" class="btn btn-primary btn-sm">
              <i class="fa-solid fa-gauge-high"></i> Mon Espace
            </a>
          ` : `
            <a href="#/login" class="btn btn-secondary btn-sm">Connexion</a>
            <a href="#/register" class="btn btn-primary btn-sm">
              <i class="fa-solid fa-arrow-right"></i> Démarrer Gratuitement
            </a>
          `}
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero-gradient pt-12 pb-20 px-4">
      <div class="max-w-5xl text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-6">
          <i class="fa-solid fa-bolt text-amber-500"></i> Le logiciel SaaS de facturation n°1 pour l'Afrique francophone
        </div>
        <h1 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
          Facturez simplement. <br class="hidden sm:block">
          <span style="color: #0F766E;">Gérez votre activité</span> intelligemment.
        </h1>
        <p class="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mb-8 leading-relaxed">
          Pinal_Facture permet aux entrepreneurs, freelances, commerçants et PME africaines de créer des factures professionnelles en <strong>FCFA</strong>, appliquer la <strong>TVA 18%</strong>, et suivre leurs encaissements <strong>Wave & Orange Money</strong>.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <a href="#/register" class="btn btn-primary btn-lg w-full sm:w-auto shadow-glow">
            <i class="fa-solid fa-file-invoice"></i> Créer ma première facture
          </a>
          <button id="btn-demo-mode" class="btn btn-secondary btn-lg w-full sm:w-auto">
            <i class="fa-solid fa-play text-primary-700"></i> Tester la démonstration
          </button>
        </div>

        <!-- Trust Badges -->
        <div class="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-semibold">
          <span class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-600"></i> 100% Conforme UEMOA / OHADA</span>
          <span class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-600"></i> Adapté Mobile First</span>
          <span class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-600"></i> Compatible Wave & Orange Money</span>
          <span class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-600"></i> Génération PDF A4 immédiate</span>
        </div>
      </div>
    </section>

    <!-- Interactive Live Preview Card -->
    <section class="px-4 -mt-10 mb-20">
      <div class="max-w-5xl">
        <div class="card shadow-xl p-4 sm:p-6 border-slate-200" style="background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);">
          <div class="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-red-400"></div>
              <div class="w-3 h-3 rounded-full bg-amber-400"></div>
              <div class="w-3 h-3 rounded-full bg-emerald-400"></div>
              <span class="text-xs font-bold text-slate-500 ml-2">Aperçu en direct — Pinal_Facture v2026</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge badge-paid">Facture Payée</span>
              <span class="method-pill method-wave"><i class="fa-solid fa-water"></i> Wave</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div class="space-y-3">
              <div class="text-xs font-bold uppercase text-slate-400">Émetteur</div>
              <div class="font-bold text-slate-900 text-lg">Pinal Tech Solutions</div>
              <p class="text-xs text-slate-500">Dakar, Sénégal • NIF: SN-DKR-2026-B-12345</p>
              <div class="pt-2">
                <span class="text-xs text-slate-400">Client :</span>
                <div class="font-semibold text-slate-800 text-sm">Alpha Digital SARL</div>
              </div>
            </div>

            <div class="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div class="flex justify-between text-xs text-slate-600">
                <span>Désignation</span>
                <span>Développement Web</span>
              </div>
              <div class="flex justify-between text-xs text-slate-600">
                <span>Sous-total HT</span>
                <span class="font-semibold">500 000 FCFA</span>
              </div>
              <div class="flex justify-between text-xs text-slate-600">
                <span>TVA (18%)</span>
                <span class="font-semibold">90 000 FCFA</span>
              </div>
              <div class="flex justify-between text-sm font-extrabold text-primary-700 border-t border-slate-200 pt-2">
                <span>Total TTC</span>
                <span>590 000 FCFA</span>
              </div>
            </div>

            <div class="text-center md:text-right space-y-3">
              <div class="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                <i class="fa-solid fa-circle-check text-emerald-600"></i> Paiement de <strong>590 000 FCFA</strong> reçu via Wave.
              </div>
              <a href="#/register" class="btn btn-primary btn-sm w-full">
                Tester cette interface <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Why Pinal_Facture -->
    <section class="py-16 bg-white border-y border-slate-200 px-4">
      <div class="max-w-5xl">
        <div class="text-center max-w-2xl mb-12">
          <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">Pourquoi choisir Pinal_Facture ?</h2>
          <p class="text-slate-600 text-sm sm:text-base">Les logiciels occidentaux ne sont ni pensés pour le FCFA, ni adaptés à nos modes de paiement locaux comme Wave ou Orange Money. Pinal_Facture change la donne.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="card p-6 card-hover">
            <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl mb-4 font-bold">
              <i class="fa-solid fa-coins"></i>
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-2">100% FCFA & TVA 18%</h3>
            <p class="text-slate-600 text-sm">Calculs exacts du Hors Taxe (HT), de la TVA et du TTC. Formatage naturel sans symboles de devises inadaptés.</p>
          </div>

          <div class="card p-6 card-hover">
            <div class="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-xl mb-4 font-bold">
              <i class="fa-solid fa-mobile-screen-button"></i>
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-2">Mobile First & Ultra Rapide</h3>
            <p class="text-slate-600 text-sm">Créez et envoyez vos factures directement depuis votre smartphone sur le terrain en moins de 60 secondes.</p>
          </div>

          <div class="card p-6 card-hover">
            <div class="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl mb-4 font-bold">
              <i class="fa-solid fa-hand-holding-dollar"></i>
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-2">Suivi Wave & Orange Money</h3>
            <p class="text-slate-600 text-sm">Enregistrez les acomptes partiels ou les règlements complets et visualisez instantanément le solde restant dû.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-16 px-4">
      <div class="max-w-5xl">
        <div class="text-center max-w-2xl mb-12">
          <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">Toutes les fonctionnalités dont vous avez besoin</h2>
          <p class="text-slate-600 text-sm sm:text-base">Un ensemble complet d'outils simples pour professionnaliser la gestion financière de votre entreprise.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="card p-5">
            <i class="fa-solid fa-file-pdf text-primary-700 text-2xl mb-3"></i>
            <h4 class="font-bold text-slate-900 text-base mb-1">Génération PDF Pro A4</h4>
            <p class="text-xs text-slate-600">Factures élégantes avec logo, NIF/RCCM, mentions légales et tableau prêt pour impression.</p>
          </div>

          <div class="card p-5">
            <i class="fa-solid fa-users text-primary-700 text-2xl mb-3"></i>
            <h4 class="font-bold text-slate-900 text-base mb-1">Gestion CRM Clients</h4>
            <p class="text-xs text-slate-600">Fiches clients détaillées avec historique des factures, montants payés et relances.</p>
          </div>

          <div class="card p-5">
            <i class="fa-solid fa-boxes-stacked text-primary-700 text-2xl mb-3"></i>
            <h4 class="font-bold text-slate-900 text-base mb-1">Catalogue Produits & Services</h4>
            <p class="text-xs text-slate-600">Enregistrez vos prestations régulières pour remplir une facture en 2 clics.</p>
          </div>

          <div class="card p-5">
            <i class="fa-solid fa-chart-line text-primary-700 text-2xl mb-3"></i>
            <h4 class="font-bold text-slate-900 text-base mb-1">Tableau de bord Chiffre d'Affaires</h4>
            <p class="text-xs text-slate-600">Suivez vos encaissements mensuels, factures en attente et retards de paiement.</p>
          </div>

          <div class="card p-5">
            <i class="fa-solid fa-share-nodes text-primary-700 text-2xl mb-3"></i>
            <h4 class="font-bold text-slate-900 text-base mb-1">Lien Public Sécurisé</h4>
            <p class="text-xs text-slate-600">Partagez un lien direct via WhatsApp ou Email pour que votre client consulte sa facture.</p>
          </div>

          <div class="card p-5">
            <i class="fa-solid fa-shield-halved text-primary-700 text-2xl mb-3"></i>
            <h4 class="font-bold text-slate-900 text-base mb-1">Données Sécurisées & Export</h4>
            <p class="text-xs text-slate-600">Exportez et sauvegardez vos données comptables en un clic pour votre expert-comptable.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section class="py-16 bg-slate-100 border-t border-slate-200 px-4">
      <div class="max-w-5xl">
        <div class="text-center max-w-2xl mb-12">
          <span class="text-xs font-bold text-primary-700 uppercase tracking-widest">Tarification Transparente</span>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 mb-4">Des forfaits adaptés aux réalités africaines</h2>
          <p class="text-slate-600 text-sm sm:text-base">Commencez gratuitement, puis passez à la vitesse supérieure quand votre entreprise grandit.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl">
          <!-- Plan Gratuit -->
          <div class="card p-8 bg-white border-slate-200 flex flex-col justify-between">
            <div>
              <div class="font-bold text-slate-900 text-lg mb-1">Formule Découverte</div>
              <p class="text-xs text-slate-500 mb-6">Pour les freelances et créateurs débutants</p>
              <div class="text-3xl font-black text-slate-900 mb-6">
                0 FCFA <span class="text-xs text-slate-400 font-normal">/ pour toujours</span>
              </div>
              <ul class="space-y-3 text-sm text-slate-600 mb-8">
                <li class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-600"></i> Jusqu'à 5 factures / mois</li>
                <li class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-600"></i> Jusqu'à 3 clients</li>
                <li class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-600"></i> Téléchargement PDF A4</li>
                <li class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-600"></i> TVA 18% & FCFA</li>
              </ul>
            </div>
            <a href="#/register" class="btn btn-secondary w-full">Démarrer Gratuitement</a>
          </div>

          <!-- Plan Pro -->
          <div class="card p-8 bg-white border-2 border-primary-600 shadow-lg relative flex flex-col justify-between" style="border-color: #0F766E;">
            <div class="absolute -top-3.5 right-6 bg-primary-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              RECOMMANDÉ
            </div>
            <div>
              <div class="font-bold text-slate-900 text-lg mb-1">Formule Pro Illimitée</div>
              <p class="text-xs text-slate-500 mb-6">Pour les PME, commerçants & prestataires actifs</p>
              <div class="text-3xl font-black text-primary-700 mb-6">
                9 900 FCFA <span class="text-xs text-slate-400 font-normal">/ mois</span>
              </div>
              <ul class="space-y-3 text-sm text-slate-700 mb-8">
                <li class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-600 font-bold"></i> <strong>Factures & Devis illimités</strong></li>
                <li class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-600 font-bold"></i> <strong>Clients illimités</strong></li>
                <li class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-600 font-bold"></i> Personnalisation Logo & NIF</li>
                <li class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-600 font-bold"></i> Suivi multi-paiements Wave & OM</li>
                <li class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-600 font-bold"></i> Rapports de chiffre d'affaires</li>
                <li class="flex items-center gap-2"><i class="fa-solid fa-check text-emerald-600 font-bold"></i> Support prioritaire WhatsApp</li>
              </ul>
            </div>
            <a href="#/register" class="btn btn-primary w-full shadow-md">Passer au niveau Pro</a>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="py-16 px-4 bg-white border-t border-slate-200">
      <div class="max-w-3xl">
        <h2 class="text-2xl font-extrabold text-slate-900 text-center mb-8">Questions Fréquemment Posées</h2>
        
        <div class="space-y-4">
          <div class="card p-4">
            <h4 class="font-bold text-slate-900 text-sm mb-1">Est-ce que Pinal_Facture est conforme aux règles fiscales UEMOA ?</h4>
            <p class="text-xs text-slate-600">Oui. L'application intègre par défaut la TVA standard à 18%, la numérotation séquentielle anti-fraude, ainsi que les mentions NIF/RCCM obligatoires.</p>
          </div>

          <div class="card p-4">
            <h4 class="font-bold text-slate-900 text-sm mb-1">Puis-je l'utiliser sur mon téléphone sans installer d'application lourde ?</h4>
            <p class="text-xs text-slate-600">Absolument ! Pinal_Facture est conçue en Mobile First et fonctionne instantanément sur tous les navigateurs mobiles Android et iPhone.</p>
          </div>

          <div class="card p-4">
            <h4 class="font-bold text-slate-900 text-sm mb-1">Comment mes clients peuvent-ils me payer via Wave ou Orange Money ?</h4>
            <p class="text-xs text-slate-600">Vous pouvez inclure vos numéros de compte et instructions de paiement sur vos factures. Lorsqu'un client vous transfère l'argent, vous l'enregistrez d'un clic pour mettre à jour le solde restant.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-slate-900 text-white py-12 px-4">
      <div class="max-w-5xl flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-8 mb-6">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center font-bold text-white">
            P
          </div>
          <span class="font-extrabold text-lg">Pinal_Facture</span>
        </div>
        <p class="text-xs text-slate-400 text-center md:text-left">
          La solution de facturation professionnelle pour les entrepreneurs d'Afrique francophone.
        </p>
        <div class="flex items-center gap-4 text-sm text-slate-400">
          <a href="#/login" class="hover:text-white">Connexion</a>
          <a href="#/register" class="hover:text-white">Créer un compte</a>
        </div>
      </div>
      <div class="max-w-5xl text-center text-xs text-slate-500">
        © 2026 Pinal_Facture. Tous droits réservés.
      </div>
    </footer>
  `;

  // Événement pour le mode démo direct
  const demoBtn = container.querySelector('#btn-demo-mode');
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      auth.loadDemoAccount();
      window.location.hash = '#/dashboard';
    });
  }
}
