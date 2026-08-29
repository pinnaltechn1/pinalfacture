/**
 * PINAL_FACTURE — Vue CRM Clients (Fiches 360°, Statistiques & Historique de Facturation)
 */

import { db } from '../db.js';
import { auth } from '../auth.js';
import { clientService } from '../services/client.service.js';
import { notifications } from '../services/notification.service.js';

export function renderClientsView(container) {
  const business = auth.getBusiness();
  const currency = business?.currency || 'FCFA';
  let searchQuery = '';

  function render() {
    const clients = clientService.getClients(searchQuery);

    container.innerHTML = `
      <div class="p-4 sm:p-6 lg:p-8 max-w-7xl">
        
        <!-- Top Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Clients</h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">Gérez vos clients particuliers et entreprises et suivez leurs encaissements</p>
          </div>
          <button id="btn-add-client" class="btn btn-primary shadow-md">
            <i class="fa-solid fa-user-plus"></i> Nouveau client
          </button>
        </div>

        <!-- Search Bar -->
        <div class="card p-4 mb-6">
          <div class="relative w-full max-w-md">
            <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-400 text-sm"></i>
            <input type="text" id="client-search-input" class="form-control text-sm" style="padding-left: 2rem;" placeholder="Rechercher par nom, email ou téléphone..." value="${searchQuery}">
          </div>
        </div>

        <!-- Clients Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${clients.map(client => `
            <div class="card p-5 card-hover flex flex-col justify-between">
              <div>
                <div class="flex items-start justify-between gap-2 mb-3">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-slate-100 text-primary-800 font-extrabold flex items-center justify-center text-base border border-slate-200">
                      ${(client.name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 class="font-bold text-slate-900 text-base leading-tight">${client.name}</h3>
                      <span class="text-[11px] font-semibold uppercase px-2 py-0.5 rounded ${client.type === 'entreprise' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}">
                        ${client.type || 'entreprise'}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-1">
                    <button class="btn btn-ghost btn-sm btn-edit-client p-1" data-id="${client.id}" title="Modifier">
                      <i class="fa-solid fa-pen-to-square text-slate-400 hover:text-slate-700"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm btn-delete-client p-1 text-red-400 hover:text-red-600" data-id="${client.id}" title="Supprimer">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>

                <div class="space-y-1.5 text-xs text-slate-600 mb-4">
                  ${client.phone ? `<div class="flex items-center gap-2"><i class="fa-solid fa-phone text-slate-400 w-4"></i> <span>${client.phone}</span></div>` : ''}
                  ${client.email ? `<div class="flex items-center gap-2"><i class="fa-solid fa-envelope text-slate-400 w-4"></i> <span>${client.email}</span></div>` : ''}
                  ${client.address ? `<div class="flex items-center gap-2"><i class="fa-solid fa-location-dot text-slate-400 w-4"></i> <span>${client.address}</span></div>` : ''}
                  ${client.taxNumber ? `<div class="flex items-center gap-2"><i class="fa-solid fa-id-card text-slate-400 w-4"></i> <span>NIF : ${client.taxNumber}</span></div>` : ''}
                </div>
              </div>

              <!-- Financial Stats Bar -->
              <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2">
                <div class="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div class="text-[10px] text-slate-400 uppercase font-bold">Factures</div>
                    <div class="font-extrabold text-slate-800">${client.invoiceCount || 0}</div>
                  </div>
                  <div>
                    <div class="text-[10px] text-slate-400 uppercase font-bold">Total Facturé</div>
                    <div class="font-extrabold text-slate-900 text-[11px]">${db.formatCurrency(client.totalInvoiced, '')}</div>
                  </div>
                  <div>
                    <div class="text-[10px] text-slate-400 uppercase font-bold">Solde Dû</div>
                    <div class="font-extrabold ${client.balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'} text-[11px]">${db.formatCurrency(client.balanceDue, '')}</div>
                  </div>
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button class="btn btn-secondary btn-sm w-full btn-view-client" data-id="${client.id}">
                  <i class="fa-solid fa-folder-open"></i> Fiche Client 360°
                </button>
              </div>
            </div>
          `).join('')}

          ${clients.length === 0 ? `
            <div class="col-span-full card p-12 text-center text-slate-400">
              <i class="fa-solid fa-users text-4xl mb-3"></i>
              <div class="text-base font-bold text-slate-700">Aucun client trouvé</div>
              <p class="text-xs text-slate-400 mt-1">Ajoutez votre premier client pour commencer à facturer.</p>
              <button id="btn-empty-add-client" class="btn btn-primary btn-sm mt-4">+ Ajouter un client</button>
            </div>
          ` : ''}
        </div>

      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    const searchInput = container.querySelector('#client-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        render();
      });
    }

    const addBtn = container.querySelector('#btn-add-client');
    if (addBtn) addBtn.addEventListener('click', () => openClientModal(null, render));

    const emptyAddBtn = container.querySelector('#btn-empty-add-client');
    if (emptyAddBtn) emptyAddBtn.addEventListener('click', () => openClientModal(null, render));

    container.querySelectorAll('.btn-edit-client').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openClientModal(id, render);
      });
    });

    container.querySelectorAll('.btn-view-client').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openClient360Modal(id);
      });
    });

    container.querySelectorAll('.btn-delete-client').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Voulez-vous vraiment supprimer ce client ?')) {
          try {
            clientService.deleteClient(id);
            notifications.info('Client supprimé avec succès.');
            render();
          } catch (err) {
            notifications.error(err.message);
          }
        }
      });
    });
  }

  render();
}

/**
 * Modal d'ajout / modification de client
 */
export function openClientModal(clientId = null, onSuccess) {
  const existing = clientId ? clientService.getClientDetails(clientId) : null;
  const isEdit = !!existing;

  const modalContainer = document.getElementById('modal-container');
  modalContainer.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="text-lg font-bold text-slate-900">${isEdit ? 'Modifier le Client' : 'Ajouter un Nouveau Client'}</h3>
        <button type="button" id="modal-close-c" class="text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer text-lg">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <form id="form-client-modal">
        <div class="modal-body space-y-4">
          
          <div class="form-group">
            <label class="form-label" for="cl-name">Nom complet ou Raison sociale *</label>
            <input type="text" id="cl-name" class="form-control" placeholder="Ex: Baobab Consulting SARL" value="${existing?.name || ''}" required>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label" for="cl-type">Type de client</label>
              <select id="cl-type" class="form-select">
                <option value="entreprise" ${existing?.type === 'entreprise' ? 'selected' : ''}>Entreprise / Société</option>
                <option value="particulier" ${existing?.type === 'particulier' ? 'selected' : ''}>Particulier / Freelance</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="cl-phone">Téléphone / WhatsApp</label>
              <input type="tel" id="cl-phone" class="form-control" placeholder="+221 77 123 45 67" value="${existing?.phone || ''}">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label" for="cl-email">Adresse Email</label>
              <input type="email" id="cl-email" class="form-control" placeholder="contact@client.sn" value="${existing?.email || ''}">
            </div>

            <div class="form-group">
              <label class="form-label" for="cl-tax">Numéro Fiscal (NIF/RCCM)</label>
              <input type="text" id="cl-tax" class="form-control" placeholder="SN-DKR-..." value="${existing?.taxNumber || ''}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="cl-address">Adresse physique</label>
            <input type="text" id="cl-address" class="form-control" placeholder="Point E, Dakar" value="${existing?.address || ''}">
          </div>

          <div class="form-group">
            <label class="form-label" for="cl-notes">Notes internes</label>
            <textarea id="cl-notes" class="form-textarea" rows="2" placeholder="Informations complémentaires, préférences de paiement...">${existing?.notes || ''}</textarea>
          </div>

        </div>

        <div class="modal-footer">
          <button type="button" id="btn-cancel-c" class="btn btn-secondary">Annuler</button>
          <button type="submit" class="btn btn-primary">
            ${isEdit ? 'Mettre à jour' : 'Enregistrer le client'}
          </button>
        </div>
      </form>
    </div>
  `;

  modalContainer.classList.remove('hidden');

  function closeModal() {
    modalContainer.classList.add('hidden');
    modalContainer.innerHTML = '';
  }

  modalContainer.querySelector('#modal-close-c').addEventListener('click', closeModal);
  modalContainer.querySelector('#btn-cancel-c').addEventListener('click', closeModal);

  const form = modalContainer.querySelector('#form-client-modal');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('#cl-name').value;
    const type = form.querySelector('#cl-type').value;
    const phone = form.querySelector('#cl-phone').value;
    const email = form.querySelector('#cl-email').value;
    const taxNumber = form.querySelector('#cl-tax').value;
    const address = form.querySelector('#cl-address').value;
    const notes = form.querySelector('#cl-notes').value;

    try {
      if (isEdit) {
        clientService.updateClient(clientId, { name, type, phone, email, taxNumber, address, notes });
        notifications.success(`Client ${name} mis à jour avec succès !`);
      } else {
        clientService.createClient({ name, type, phone, email, taxNumber, address, notes });
        notifications.success(`Client ${name} créé avec succès !`);
      }
      closeModal();
      if (onSuccess) onSuccess();
    } catch (err) {
      notifications.error(err.message);
    }
  });
}

/**
 * Fiche Client 360° (Historique financier et factures rattachées)
 */
export function openClient360Modal(clientId) {
  const client = clientService.getClientDetails(clientId);
  if (!client) return;

  const business = auth.getBusiness();
  const currency = business?.currency || 'FCFA';

  const modalContainer = document.getElementById('modal-container');
  modalContainer.innerHTML = `
    <div class="modal-card" style="max-width: 48rem;">
      <div class="modal-header">
        <div>
          <h3 class="text-xl font-bold text-slate-900">${client.name}</h3>
          <p class="text-xs text-slate-500">Fiche client 360° • ${client.type || 'entreprise'}</p>
        </div>
        <button type="button" id="modal-close-360" class="text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer text-lg">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="modal-body space-y-6">
        
        <!-- Summary Stats -->
        <div class="grid grid-cols-3 gap-4">
          <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
            <div class="text-xs text-slate-500 font-semibold uppercase">Total Facturé</div>
            <div class="text-lg font-black text-slate-900 mt-1">${db.formatCurrency(client.totalInvoiced, currency)}</div>
          </div>
          <div class="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
            <div class="text-xs text-emerald-700 font-semibold uppercase">Total Encaissé</div>
            <div class="text-lg font-black text-emerald-700 mt-1">${db.formatCurrency(client.totalPaid, currency)}</div>
          </div>
          <div class="p-3 bg-amber-50 rounded-lg border border-amber-200 text-center">
            <div class="text-xs text-amber-700 font-semibold uppercase">Solde Dû</div>
            <div class="text-lg font-black ${client.balanceDue > 0 ? 'text-red-600' : 'text-emerald-700'} mt-1">${db.formatCurrency(client.balanceDue, currency)}</div>
          </div>
        </div>

        <!-- Invoices History -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-bold text-slate-900 text-sm">Historique des Factures (${client.invoices.length})</h4>
            <a href="#/invoices/new" class="btn btn-primary btn-sm text-xs">
              <i class="fa-solid fa-plus"></i> Créer une facture pour ce client
            </a>
          </div>

          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>N° Facture</th>
                  <th>Date</th>
                  <th>Total TTC</th>
                  <th>Solde</th>
                  <th>Statut</th>
                  <th class="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                ${client.invoices.map(inv => `
                  <tr>
                    <td class="font-bold text-slate-900">${inv.invoiceNumber}</td>
                    <td class="text-xs text-slate-600">${inv.issueDate}</td>
                    <td class="font-bold text-slate-900">${db.formatCurrency(inv.total, currency)}</td>
                    <td class="font-semibold ${inv.balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}">${db.formatCurrency(inv.balanceDue, currency)}</td>
                    <td><span class="badge badge-${inv.status}">${inv.status}</span></td>
                    <td class="text-right">
                      <a href="#/invoices/preview/${inv.id}" class="btn btn-secondary btn-sm text-xs">
                        <i class="fa-solid fa-eye"></i>
                      </a>
                    </td>
                  </tr>
                `).join('')}
                ${client.invoices.length === 0 ? `
                  <tr>
                    <td colspan="6" class="text-center py-6 text-slate-400 text-xs">
                      Aucune facture émise pour ce client pour le moment.
                    </td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <div class="modal-footer">
        <button type="button" id="btn-close-360" class="btn btn-secondary">Fermer</button>
      </div>
    </div>
  `;

  modalContainer.classList.remove('hidden');

  function closeModal() {
    modalContainer.classList.add('hidden');
    modalContainer.innerHTML = '';
  }

  modalContainer.querySelector('#modal-close-360').addEventListener('click', closeModal);
  modalContainer.querySelector('#btn-close-360').addEventListener('click', closeModal);
}
