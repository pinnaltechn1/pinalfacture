/**
 * PINAL_FACTURE — Assistant d'Onboarding en 3 Étapes (< 2 minutes)
 */

import { auth } from '../auth.js';
import { notifications } from '../services/notification.service.js';

export function renderOnboardingView(container) {
  const user = auth.getUser();
  const business = auth.getBusiness();

  let currentStep = 1;

  function render() {
    container.innerHTML = `
      <div class="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-8">
        <div class="max-w-2xl w-full mx-auto">
          
          <!-- Stepper Header -->
          <div class="mb-8 text-center">
            <div class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-700 text-white font-bold text-lg mb-3 shadow-md">
              P
            </div>
            <h1 class="text-2xl font-extrabold text-slate-900">Bienvenue sur Pinal_Facture</h1>
            <p class="text-sm text-slate-500 mt-1">Configurons votre espace de facturation en moins de 2 minutes</p>

            <!-- Progress Bar -->
            <div class="flex items-center justify-center gap-2 mt-6">
              <div class="flex items-center">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${currentStep >= 1 ? 'bg-primary-700 text-white' : 'bg-slate-200 text-slate-600'}">1</div>
                <span class="ml-2 text-xs font-semibold ${currentStep >= 1 ? 'text-primary-700' : 'text-slate-400'}">Profil</span>
              </div>
              <div class="w-12 h-1 ${currentStep >= 2 ? 'bg-primary-700' : 'bg-slate-200'} mx-2 rounded"></div>
              
              <div class="flex items-center">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${currentStep >= 2 ? 'bg-primary-700 text-white' : 'bg-slate-200 text-slate-600'}">2</div>
                <span class="ml-2 text-xs font-semibold ${currentStep >= 2 ? 'text-primary-700' : 'text-slate-400'}">Entreprise</span>
              </div>
              <div class="w-12 h-1 ${currentStep >= 3 ? 'bg-primary-700' : 'bg-slate-200'} mx-2 rounded"></div>

              <div class="flex items-center">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${currentStep >= 3 ? 'bg-primary-700 text-white' : 'bg-slate-200 text-slate-600'}">3</div>
                <span class="ml-2 text-xs font-semibold ${currentStep >= 3 ? 'text-primary-700' : 'text-slate-400'}">Prêt !</span>
              </div>
            </div>
          </div>

          <!-- Step Cards -->
          <div class="card p-6 sm:p-8 shadow-xl border-slate-200">
            ${currentStep === 1 ? renderStep1() : ''}
            ${currentStep === 2 ? renderStep2() : ''}
            ${currentStep === 3 ? renderStep3() : ''}
          </div>
        </div>
      </div>
    `;

    attachEvents();
  }

  function renderStep1() {
    return `
      <h2 class="text-xl font-bold text-slate-900 mb-2">Étape 1 — Vos informations personnelles</h2>
      <p class="text-xs text-slate-500 mb-6">Ces données permettront de sécuriser votre compte et de signer vos documents.</p>

      <form id="form-step-1" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label" for="ob-firstname">Prénom</label>
            <input type="text" id="ob-firstname" class="form-control" value="${user?.firstName || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="ob-lastname">Nom</label>
            <input type="text" id="ob-lastname" class="form-control" value="${user?.lastName || ''}" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="ob-email">Adresse Email</label>
          <input type="email" id="ob-email" class="form-control" value="${user?.email || ''}" required readonly style="background: #F1F5F9;">
        </div>

        <div class="form-group">
          <label class="form-label" for="ob-phone">Téléphone direct / WhatsApp</label>
          <input type="tel" id="ob-phone" class="form-control" placeholder="+221 77 123 45 67" value="${user?.phone || ''}">
        </div>

        <div class="flex justify-end pt-4">
          <button type="submit" class="btn btn-primary">
            Continuer <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </form>
    `;
  }

  function renderStep2() {
    return `
      <h2 class="text-xl font-bold text-slate-900 mb-2">Étape 2 — Votre Entreprise & Facturation</h2>
      <p class="text-xs text-slate-500 mb-6">Ces informations apparaîtront sur l'en-tête de vos factures et devis professionnels.</p>

      <form id="form-step-2" class="space-y-4">
        <div class="form-group">
          <label class="form-label" for="ob-bizname">Nom commercial de l'entreprise *</label>
          <input type="text" id="ob-bizname" class="form-control" placeholder="Ex: Dakar Digital Agency" value="${business?.name || ''}" required>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label" for="ob-bizphone">Téléphone commercial</label>
            <input type="tel" id="ob-bizphone" class="form-control" placeholder="+221 33 800 00 00" value="${business?.phone || ''}">
          </div>
          <div class="form-group">
            <label class="form-label" for="ob-bizemail">Email commercial</label>
            <input type="email" id="ob-bizemail" class="form-control" placeholder="facturation@monentreprise.sn" value="${business?.email || user?.email || ''}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="ob-address">Adresse physique / Siège social</label>
          <input type="text" id="ob-address" class="form-control" placeholder="Avenue Cheikh Anta Diop, Dakar, Sénégal" value="${business?.address || ''}">
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="form-group">
            <label class="form-label" for="ob-nif">NIF / RCCM (Fiscal)</label>
            <input type="text" id="ob-nif" class="form-control" placeholder="SN-DKR-..." value="${business?.nif || ''}">
          </div>
          <div class="form-group">
            <label class="form-label" for="ob-currency">Devise</label>
            <select id="ob-currency" class="form-select">
              <option value="FCFA" ${business?.currency === 'FCFA' ? 'selected' : ''}>FCFA (XOF / XAF)</option>
              <option value="GNF" ${business?.currency === 'GNF' ? 'selected' : ''}>Franc Guinéen (GNF)</option>
              <option value="EUR" ${business?.currency === 'EUR' ? 'selected' : ''}>Euro (€)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="ob-vat">Taux TVA (%)</label>
            <input type="number" id="ob-vat" class="form-control" value="${business?.defaultVatRate || 18}" min="0" max="100">
          </div>
        </div>

        <div class="flex justify-between pt-4">
          <button type="button" id="btn-prev-1" class="btn btn-secondary">
            <i class="fa-solid fa-arrow-left"></i> Retour
          </button>
          <button type="submit" class="btn btn-primary">
            Valider et Terminer <i class="fa-solid fa-check"></i>
          </button>
        </div>
      </form>
    `;
  }

  function renderStep3() {
    return `
      <div class="text-center py-6">
        <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-4">
          <i class="fa-solid fa-check"></i>
        </div>
        <h2 class="text-2xl font-extrabold text-slate-900 mb-2">Félicitations ! Votre compte est prêt.</h2>
        <p class="text-sm text-slate-600 max-w-md mx-auto mb-8">
          Vous êtes prêt à facturer vos clients en FCFA, calculer la TVA et recevoir vos règlements Wave et Orange Money.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#/invoices/new" class="btn btn-primary btn-lg shadow-glow">
            <i class="fa-solid fa-file-circle-plus"></i> Créer ma première facture
          </a>
          <a href="#/dashboard" class="btn btn-secondary btn-lg">
            <i class="fa-solid fa-gauge-high"></i> Aller au tableau de bord
          </a>
        </div>
      </div>
    `;
  }

  function attachEvents() {
    if (currentStep === 1) {
      const f1 = container.querySelector('#form-step-1');
      if (f1) {
        f1.addEventListener('submit', (e) => {
          e.preventDefault();
          const firstName = f1.querySelector('#ob-firstname').value;
          const lastName = f1.querySelector('#ob-lastname').value;
          const phone = f1.querySelector('#ob-phone').value;

          auth.updateProfile({ firstName, lastName, phone });
          currentStep = 2;
          render();
        });
      }
    } else if (currentStep === 2) {
      const f2 = container.querySelector('#form-step-2');
      const prevBtn = container.querySelector('#btn-prev-1');

      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          currentStep = 1;
          render();
        });
      }

      if (f2) {
        f2.addEventListener('submit', (e) => {
          e.preventDefault();
          const name = f2.querySelector('#ob-bizname').value;
          const phone = f2.querySelector('#ob-bizphone').value;
          const email = f2.querySelector('#ob-bizemail').value;
          const address = f2.querySelector('#ob-address').value;
          const nif = f2.querySelector('#ob-nif').value;
          const currency = f2.querySelector('#ob-currency').value;
          const defaultVatRate = Number(f2.querySelector('#ob-vat').value) || 18;

          auth.updateBusiness({ name, phone, email, address, nif, currency, defaultVatRate });
          notifications.success('Entreprise configurée avec succès !');
          currentStep = 3;
          render();
        });
      }
    }
  }

  render();
}
