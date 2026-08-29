/**
 * PINAL_FACTURE — Vue Paramètres & Configuration de Compte / Entreprise
 */

import { db } from '../db.js';
import { auth } from '../auth.js';
import { notifications } from '../services/notification.service.js';

export function renderSettingsView(container) {
  const user = auth.getUser();
  const business = auth.getBusiness();
  let activeTab = 'profile';

  function render() {
    container.innerHTML = `
      <div class="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        
        <div class="mb-6">
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Paramètres</h1>
          <p class="text-xs sm:text-sm text-slate-500 mt-1">Personnalisez votre compte, votre profil fiscal et vos préférences de facturation</p>
        </div>

        <!-- Settings Nav Tabs -->
        <div class="flex items-center gap-2 overflow-x-auto border-b border-slate-200 mb-6 pb-2">
          <button class="btn btn-sm ${activeTab === 'profile' ? 'btn-primary' : 'btn-ghost'}" data-tab="profile">
            <i class="fa-solid fa-user mr-1"></i> Mon Profil
          </button>
          <button class="btn btn-sm ${activeTab === 'business' ? 'btn-primary' : 'btn-ghost'}" data-tab="business">
            <i class="fa-solid fa-building mr-1"></i> Mon Entreprise
          </button>
          <button class="btn btn-sm ${activeTab === 'billing' ? 'btn-primary' : 'btn-ghost'}" data-tab="billing">
            <i class="fa-solid fa-receipt mr-1"></i> Facturation & TVA
          </button>
          <button class="btn btn-sm ${activeTab === 'backup' ? 'btn-primary' : 'btn-ghost'}" data-tab="backup">
            <i class="fa-solid fa-database mr-1"></i> Sauvegardes & Données
          </button>
        </div>

        <!-- Tab Contents -->
        <div class="card p-6 sm:p-8 shadow-sm">
          ${activeTab === 'profile' ? renderProfileTab() : ''}
          ${activeTab === 'business' ? renderBusinessTab() : ''}
          ${activeTab === 'billing' ? renderBillingTab() : ''}
          ${activeTab === 'backup' ? renderBackupTab() : ''}
        </div>

      </div>
    `;

    attachEvents();
  }

  function renderProfileTab() {
    return `
      <h3 class="text-lg font-bold text-slate-900 mb-4">Informations du Profil</h3>
      <form id="form-profile" class="space-y-4 max-w-xl">
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label" for="prof-fn">Prénom</label>
            <input type="text" id="prof-fn" class="form-control" value="${user?.firstName || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="prof-ln">Nom</label>
            <input type="text" id="prof-ln" class="form-control" value="${user?.lastName || ''}" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="prof-email">Email</label>
          <input type="email" id="prof-email" class="form-control" value="${user?.email || ''}" required>
        </div>

        <div class="form-group">
          <label class="form-label" for="prof-phone">Téléphone / WhatsApp</label>
          <input type="tel" id="prof-phone" class="form-control" value="${user?.phone || ''}">
        </div>

        <button type="submit" class="btn btn-primary mt-4">
          <i class="fa-solid fa-floppy-disk"></i> Enregistrer les modifications
        </button>
      </form>
    `;
  }

  function renderBusinessTab() {
    return `
      <h3 class="text-lg font-bold text-slate-900 mb-4">Identité & Coordonnées de l'Entreprise</h3>
      <form id="form-business" class="space-y-4 max-w-xl">
        <div class="form-group">
          <label class="form-label" for="biz-name">Nom de l'entreprise *</label>
          <input type="text" id="biz-name" class="form-control" value="${business?.name || ''}" required>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label" for="biz-phone">Téléphone commercial</label>
            <input type="tel" id="biz-phone" class="form-control" value="${business?.phone || ''}">
          </div>
          <div class="form-group">
            <label class="form-label" for="biz-email">Email de contact</label>
            <input type="email" id="biz-email" class="form-control" value="${business?.email || ''}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="biz-address">Adresse physique</label>
          <input type="text" id="biz-address" class="form-control" value="${business?.address || ''}">
        </div>

        <div class="form-group">
          <label class="form-label" for="biz-nif">Numéro d'Identification Fiscale (NIF / RCCM)</label>
          <input type="text" id="biz-nif" class="form-control" value="${business?.nif || ''}" placeholder="SN-DKR-...">
        </div>

        <div class="form-group">
          <label class="form-label" for="biz-logo">URL du Logo (Optionnel)</label>
          <input type="url" id="biz-logo" class="form-control" value="${business?.logoUrl || ''}" placeholder="https://...">
        </div>

        <button type="submit" class="btn btn-primary mt-4">
          <i class="fa-solid fa-floppy-disk"></i> Mettre à jour l'entreprise
        </button>
      </form>
    `;
  }

  function renderBillingTab() {
    return `
      <h3 class="text-lg font-bold text-slate-900 mb-4">Paramètres Fiscaux & Numérotation</h3>
      <form id="form-billing-settings" class="space-y-4 max-w-xl">
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label" for="set-currency">Devise Principale</label>
            <select id="set-currency" class="form-select">
              <option value="FCFA" ${business?.currency === 'FCFA' ? 'selected' : ''}>FCFA (XOF / XAF)</option>
              <option value="GNF" ${business?.currency === 'GNF' ? 'selected' : ''}>Franc Guinéen (GNF)</option>
              <option value="EUR" ${business?.currency === 'EUR' ? 'selected' : ''}>Euro (€)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="set-vat">Taux de TVA par défaut (%)</label>
            <input type="number" id="set-vat" class="form-control font-bold" value="${business?.defaultVatRate || 18}" min="0" max="100">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="set-prefix">Préfixe de Facture</label>
          <input type="text" id="set-prefix" class="form-control uppercase" value="${business?.invoicePrefix || 'PF'}" maxlength="6">
          <div class="form-hint">Exemple de format généré : <strong>${business?.invoicePrefix || 'PF'}-2026-00001</strong></div>
        </div>

        <button type="submit" class="btn btn-primary mt-4">
          <i class="fa-solid fa-floppy-disk"></i> Enregistrer les paramètres
        </button>
      </form>
    `;
  }

  function renderBackupTab() {
    return `
      <h3 class="text-lg font-bold text-slate-900 mb-4">Gestion des Données & Sauvegardes</h3>
      <div class="space-y-6 max-w-xl">
        
        <div class="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <div class="font-bold text-slate-800 text-sm">Exporter toutes vos données (JSON)</div>
          <p class="text-xs text-slate-500">Téléchargez une copie intégrale de vos factures, clients, produits et paiements.</p>
          <button type="button" id="btn-export-backup" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-download"></i> Exporter la sauvegarde
          </button>
        </div>

        <div class="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <div class="font-bold text-slate-800 text-sm">Importer une sauvegarde</div>
          <p class="text-xs text-slate-500">Restaurez vos données à partir d'un fichier de sauvegarde JSON.</p>
          <input type="file" id="file-import-backup" accept=".json" class="form-control text-xs">
        </div>

        <div class="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-2">
          <div class="font-bold text-amber-900 text-sm">Réinitialiser les données de Démonstration</div>
          <p class="text-xs text-amber-800">Recharger le jeu de données démo réaliste (Pinal Tech Dakar, Alpha Digital, etc.).</p>
          <button type="button" id="btn-reset-demo" class="btn btn-secondary btn-sm text-amber-800 border-amber-300">
            <i class="fa-solid fa-rotate-right"></i> Réinitialiser au mode Démo
          </button>
        </div>

      </div>
    `;
  }

  function attachEvents() {
    container.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.getAttribute('data-tab');
        render();
      });
    });

    // Form Profile
    const fProf = container.querySelector('#form-profile');
    if (fProf) {
      fProf.addEventListener('submit', (e) => {
        e.preventDefault();
        const firstName = fProf.querySelector('#prof-fn').value;
        const lastName = fProf.querySelector('#prof-ln').value;
        const email = fProf.querySelector('#prof-email').value;
        const phone = fProf.querySelector('#prof-phone').value;

        auth.updateProfile({ firstName, lastName, email, phone });
        notifications.success('Profil mis à jour avec succès !');
      });
    }

    // Form Business
    const fBiz = container.querySelector('#form-business');
    if (fBiz) {
      fBiz.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = fBiz.querySelector('#biz-name').value;
        const phone = fBiz.querySelector('#biz-phone').value;
        const email = fBiz.querySelector('#biz-email').value;
        const address = fBiz.querySelector('#biz-address').value;
        const nif = fBiz.querySelector('#biz-nif').value;
        const logoUrl = fBiz.querySelector('#biz-logo').value;

        auth.updateBusiness({ name, phone, email, address, nif, logoUrl });
        notifications.success('Coordonnées de l’entreprise enregistrées !');
      });
    }

    // Form Billing
    const fBilling = container.querySelector('#form-billing-settings');
    if (fBilling) {
      fBilling.addEventListener('submit', (e) => {
        e.preventDefault();
        const currency = fBilling.querySelector('#set-currency').value;
        const defaultVatRate = Number(fBilling.querySelector('#set-vat').value) || 18;
        const invoicePrefix = fBilling.querySelector('#set-prefix').value || 'PF';

        auth.updateBusiness({ currency, defaultVatRate, invoicePrefix });
        notifications.success('Paramètres de facturation mis à jour !');
      });
    }

    // Export Backup
    const expBtn = container.querySelector('#btn-export-backup');
    if (expBtn) {
      expBtn.addEventListener('click', () => {
        const json = db.exportJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pinal_facture_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        notifications.success('Sauvegarde téléchargée !');
      });
    }

    // Import Backup
    const fileImport = container.querySelector('#file-import-backup');
    if (fileImport) {
      fileImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const success = db.importJSON(event.target.result);
          if (success) {
            auth.restoreSession();
            notifications.success('Sauvegarde restaurée avec succès !');
            window.location.reload();
          } else {
            notifications.error('Format de fichier de sauvegarde invalide.');
          }
        };
        reader.readAsText(file);
      });
    }

    // Reset Demo
    const resetDemoBtn = container.querySelector('#btn-reset-demo');
    if (resetDemoBtn) {
      resetDemoBtn.addEventListener('click', () => {
        if (confirm('Voulez-vous recharger les données de démonstration de Pinal Tech Solutions ?')) {
          db.resetToDemo();
          auth.loadDemoAccount();
          notifications.success('Données de démonstration rechargées !');
          window.location.reload();
        }
      });
    }
  }

  render();
}
