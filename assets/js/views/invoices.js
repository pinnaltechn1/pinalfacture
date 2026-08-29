/**
 * PINAL_FACTURE — Vues Gestion & Édition des Factures (Calculs FCFA, TVA 18%, Items dynamiques)
 */

import { db } from '../db.js';
import { auth } from '../auth.js';
import { invoiceService } from '../services/invoice.service.js';
import { clientService } from '../services/client.service.js';
import { productService } from '../services/product.service.js';
import { paymentService, PAYMENT_METHODS } from '../services/payment.service.js';
import { notifications } from '../services/notification.service.js';

export function renderInvoicesListView(container, initialStatus = 'all') {
  const business = auth.getBusiness();
  const currency = business?.currency || 'FCFA';
  let activeFilter = initialStatus;
  let searchQuery = '';

  function render() {
    const invoices = invoiceService.getInvoices({ status: activeFilter, search: searchQuery });

    container.innerHTML = `
      <div class="p-4 sm:p-6 lg:p-8 max-w-7xl">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Factures</h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">Gérez, envoyez et suivez l'ensemble de vos factures professionnelles</p>
          </div>
          <a href="#/invoices/new" class="btn btn-primary shadow-md">
            <i class="fa-solid fa-plus"></i> Nouvelle facture
          </a>
        </div>

        <!-- Filter Chips & Search Bar -->
        <div class="card p-4 mb-6">
          <div class="flex flex-col md:flex-row items-center justify-between gap-4">
            
            <!-- Filter Tabs -->
            <div class="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 sm:pb-0">
              <button class="btn btn-sm ${activeFilter === 'all' ? 'btn-primary' : 'btn-ghost'}" data-filter="all">Toutes</button>
              <button class="btn btn-sm ${activeFilter === 'draft' ? 'btn-primary' : 'btn-ghost'}" data-filter="draft">Brouillons</button>
              <button class="btn btn-sm ${activeFilter === 'sent' ? 'btn-primary' : 'btn-ghost'}" data-filter="sent">Envoyées</button>
              <button class="btn btn-sm ${activeFilter === 'partial' ? 'btn-primary' : 'btn-ghost'}" data-filter="partial">Acomptes</button>
              <button class="btn btn-sm ${activeFilter === 'paid' ? 'btn-primary' : 'btn-ghost'}" data-filter="paid">Payées</button>
            </div>

            <!-- Search input -->
            <div class="w-full md:w-72 relative">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-400 text-sm"></i>
              <input type="text" id="invoice-search-input" class="form-control text-sm" style="padding-left: 2rem;" placeholder="N° facture ou client..." value="${searchQuery}">
            </div>

          </div>
        </div>

        <!-- Invoices Table -->
        <div class="table-container shadow-sm">
          <table class="table">
            <thead>
              <tr>
                <th>N° Facture</th>
                <th>Client</th>
                <th>Émission</th>
                <th>Échéance</th>
                <th>Total TTC</th>
                <th>Solde Restant</th>
                <th>Statut</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${invoices.map(inv => {
                const client = db.getById('clients', inv.clientId);
                const statusBadges = {
                  paid: '<span class="badge badge-paid">Payée</span>',
                  sent: '<span class="badge badge-sent">Envoyée</span>',
                  draft: '<span class="badge badge-draft">Brouillon</span>',
                  partial: '<span class="badge badge-partial">Acompte</span>',
                  overdue: '<span class="badge badge-overdue">En retard</span>',
                  cancelled: '<span class="badge badge-cancelled">Annulée</span>'
                };

                return `
                  <tr>
                    <td class="font-bold text-slate-900">
                      <a href="#/invoices/preview/${inv.id}" class="text-primary-700 hover:underline">
                        ${inv.invoiceNumber}
                      </a>
                    </td>
                    <td>
                      <div class="font-semibold text-slate-800">${client ? client.name : '-'}</div>
                      <div class="text-[11px] text-slate-400">${client?.phone || ''}</div>
                    </td>
                    <td class="text-xs text-slate-600">${inv.issueDate}</td>
                    <td class="text-xs ${inv.status !== 'paid' && new Date(inv.dueDate) < new Date() ? 'text-red-600 font-bold' : 'text-slate-600'}">
                      ${inv.dueDate}
                    </td>
                    <td class="font-bold text-slate-900">${db.formatCurrency(inv.total, currency)}</td>
                    <td class="font-semibold ${inv.balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'}">
                      ${db.formatCurrency(inv.balanceDue, currency)}
                    </td>
                    <td>${statusBadges[inv.status] || inv.status}</td>
                    <td class="text-right">
                      <div class="inline-flex items-center gap-1">
                        <a href="#/invoices/preview/${inv.id}" class="btn btn-secondary btn-sm" title="Aperçu & PDF">
                          <i class="fa-solid fa-eye text-slate-600"></i>
                        </a>

                        ${inv.status !== 'paid' ? `
                          <button class="btn btn-sm btn-accent btn-pay" data-id="${inv.id}" title="Enregistrer paiement Wave/OM">
                            <i class="fa-solid fa-hand-holding-dollar"></i>
                          </button>
                        ` : ''}

                        <div class="relative inline-block dropdown">
                          <button class="btn btn-secondary btn-sm btn-more" data-id="${inv.id}">
                            <i class="fa-solid fa-ellipsis-vertical"></i>
                          </button>
                          <div id="dropdown-${inv.id}" class="hidden absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-xl border border-slate-200 z-20 py-1 text-left text-xs">
                            <a href="#/invoices/edit/${inv.id}" class="block px-3 py-2 text-slate-700 hover:bg-slate-50">
                              <i class="fa-solid fa-pen-to-square mr-2"></i> Modifier
                            </a>
                            <button class="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 btn-duplicate" data-id="${inv.id}">
                              <i class="fa-solid fa-copy mr-2"></i> Dupliquer
                            </button>
                            <button class="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 btn-share-link" data-token="${inv.publicToken}">
                              <i class="fa-solid fa-share-nodes mr-2"></i> Copier lien public
                            </button>
                            <div class="border-t border-slate-100 my-1"></div>
                            <button class="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 btn-delete" data-id="${inv.id}">
                              <i class="fa-solid fa-trash mr-2"></i> Supprimer
                            </button>
                          </div>
                        </div>

                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
              ${invoices.length === 0 ? `
                <tr>
                  <td colspan="8" class="text-center py-12 text-slate-400">
                    <i class="fa-solid fa-file-circle-xmark text-4xl mb-2"></i>
                    <div class="text-sm font-semibold text-slate-600">Aucune facture trouvée</div>
                    <div class="text-xs text-slate-400 mt-1">Créez votre première facture en quelques secondes.</div>
                    <a href="#/invoices/new" class="btn btn-primary btn-sm mt-4">+ Nouvelle facture</a>
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>

      </div>
    `;

    attachListEvents();
  }

  function attachListEvents() {
    // Filtres
    container.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeFilter = btn.getAttribute('data-filter');
        render();
      });
    });

    // Recherche
    const searchInput = container.querySelector('#invoice-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        render();
      });
    }

    // Menus dropdown
    container.querySelectorAll('.btn-more').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const menu = container.querySelector(`#dropdown-${id}`);
        // Fermer les autres
        container.querySelectorAll('[id^="dropdown-"]').forEach(m => {
          if (m !== menu) m.classList.add('hidden');
        });
        menu.classList.toggle('hidden');
      });
    });

    document.addEventListener('click', () => {
      container.querySelectorAll('[id^="dropdown-"]').forEach(m => m.classList.add('hidden'));
    });

    // Bouton de paiement rapide
    container.querySelectorAll('.btn-pay').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openPaymentModal(id);
      });
    });

    // Dupliquer
    container.querySelectorAll('.btn-duplicate').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        try {
          const dup = invoiceService.duplicateInvoice(id);
          notifications.success(`Facture dupliquée avec succès : ${dup.invoiceNumber}`);
          window.location.hash = `#/invoices/edit/${dup.id}`;
        } catch (e) {
          notifications.error(e.message);
        }
      });
    });

    // Copier lien public
    container.querySelectorAll('.btn-share-link').forEach(btn => {
      btn.addEventListener('click', () => {
        const token = btn.getAttribute('data-token');
        const url = `${window.location.origin}${window.location.pathname}#/public-invoice/${token}`;
        navigator.clipboard.writeText(url).then(() => {
          notifications.success('Lien public de la facture copié dans le presse-papier !');
        });
      });
    });

    // Supprimer
    container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Êtes-vous sûr de vouloir supprimer définitivement cette facture ?')) {
          invoiceService.deleteInvoice(id);
          notifications.info('Facture supprimée.');
          render();
        }
      });
    });
  }

  render();
}

/**
 * Modal d'enregistrement de paiement (Wave, Orange Money, etc.)
 */
export function openPaymentModal(invoiceId, onSuccess) {
  const invoice = db.getById('invoices', invoiceId);
  if (!invoice) return;

  const business = auth.getBusiness();
  const client = db.getById('clients', invoice.clientId);
  const currency = business?.currency || 'FCFA';

  const modalContainer = document.getElementById('modal-container');
  modalContainer.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <h3 class="text-lg font-bold text-slate-900">Enregistrer un Paiement</h3>
          <p class="text-xs text-slate-500">Facture <strong>${invoice.invoiceNumber}</strong> — Client : ${client?.name || '-'}</p>
        </div>
        <button type="button" id="modal-close" class="text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer text-lg">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <form id="form-record-payment">
        <div class="modal-body space-y-4">
          
          <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
            <div>
              <span class="text-slate-500">Total Facture :</span> <strong>${db.formatCurrency(invoice.total, currency)}</strong>
            </div>
            <div>
              <span class="text-slate-500">Solde restant :</span> <strong class="text-red-600">${db.formatCurrency(invoice.balanceDue, currency)}</strong>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="pay-amount">Montant à encaisser (${currency}) *</label>
            <input type="number" id="pay-amount" class="form-control font-bold text-lg text-emerald-700" value="${invoice.balanceDue}" max="${invoice.balanceDue}" min="1" required>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label" for="pay-method">Mode de règlement *</label>
              <select id="pay-method" class="form-select">
                <option value="wave">Wave</option>
                <option value="orange_money">Orange Money</option>
                <option value="cash">Espèces</option>
                <option value="bank_transfer">Virement bancaire</option>
                <option value="card">Carte bancaire</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="pay-date">Date de paiement</label>
              <input type="date" id="pay-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="pay-ref">Référence transaction (ex: ID Wave / OM)</label>
            <input type="text" id="pay-ref" class="form-control" placeholder="WV-SN-XXXX ou OM-XXXX">
          </div>

          <div class="form-group">
            <label class="form-label" for="pay-notes">Note interne (optionnel)</label>
            <input type="text" id="pay-notes" class="form-control" placeholder="Acompte 50% ou règlement total...">
          </div>

        </div>

        <div class="modal-footer">
          <button type="button" id="btn-cancel-pay" class="btn btn-secondary">Annuler</button>
          <button type="submit" class="btn btn-primary">
            <i class="fa-solid fa-check"></i> Valider l'encaissement
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

  modalContainer.querySelector('#modal-close').addEventListener('click', closeModal);
  modalContainer.querySelector('#btn-cancel-pay').addEventListener('click', closeModal);

  const form = modalContainer.querySelector('#form-record-payment');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = Number(form.querySelector('#pay-amount').value);
    const method = form.querySelector('#pay-method').value;
    const date = form.querySelector('#pay-date').value;
    const reference = form.querySelector('#pay-ref').value;
    const notes = form.querySelector('#pay-notes').value;

    try {
      paymentService.recordPayment({
        invoiceId: invoice.id,
        amount: amount,
        paymentMethod: method,
        date: date,
        reference: reference,
        notes: notes
      });

      notifications.success(`Paiement de ${db.formatCurrency(amount, currency)} enregistré avec succès !`);
      closeModal();
      if (onSuccess) onSuccess();
      else window.location.reload();
    } catch (err) {
      notifications.error(err.message);
    }
  });
}

/**
 * Vue Éditeur / Créateur de Facture
 */
export function renderInvoiceEditorView(container, invoiceId = null) {
  const business = auth.getBusiness();
  const clients = clientService.getClients();
  const products = productService.getProducts();
  const currency = business?.currency || 'FCFA';

  const isEdit = !!invoiceId;
  const existing = isEdit ? invoiceService.getInvoiceDetails(invoiceId) : null;

  let items = existing ? existing.items.map(i => ({ ...i })) : [
    { name: '', description: '', quantity: 1, unitPrice: 0, discount: 0, vatRate: business.defaultVatRate || 18 }
  ];

  let discountPercent = existing ? (existing.discount / (existing.subtotal || 1)) * 100 : 0;

  function calculateAndRenderTotals() {
    const totals = invoiceService.calculateTotals(items, discountPercent, business.defaultVatRate || 18);
    const subtotalEl = container.querySelector('#calc-subtotal');
    const vatEl = container.querySelector('#calc-vat');
    const totalEl = container.querySelector('#calc-total');

    if (subtotalEl) subtotalEl.textContent = db.formatCurrency(totals.subtotal, currency);
    if (vatEl) vatEl.textContent = db.formatCurrency(totals.vatAmount, currency);
    if (totalEl) totalEl.textContent = db.formatCurrency(totals.total, currency);
  }

  function render() {
    const invoiceNumber = existing ? existing.invoiceNumber : db.getNextInvoiceNumber(business.id);
    const issueDate = existing ? existing.issueDate : new Date().toISOString().split('T')[0];
    const dueDate = existing ? existing.dueDate : new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

    container.innerHTML = `
      <div class="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        
        <!-- Top bar -->
        <div class="flex items-center justify-between gap-4 mb-6">
          <div class="flex items-center gap-3">
            <a href="#/invoices" class="btn btn-secondary btn-sm"><i class="fa-solid fa-arrow-left"></i> Factures</a>
            <h1 class="text-2xl font-extrabold text-slate-900">${isEdit ? 'Modifier la Facture' : 'Nouvelle Facture'}</h1>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" id="btn-save-draft" class="btn btn-secondary btn-sm">
              <i class="fa-solid fa-floppy-disk"></i> Enregistrer Brouillon
            </button>
            <button type="button" id="btn-save-view" class="btn btn-primary btn-sm shadow-md">
              <i class="fa-solid fa-eye"></i> Valider & Aperçu
            </button>
          </div>
        </div>

        <form id="form-invoice-editor" class="space-y-6">
          
          <!-- Bloc En-tête : Vendeur & Client & Infos Document -->
          <div class="card p-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <!-- Émetteur -->
              <div class="space-y-1">
                <div class="text-xs font-bold uppercase text-slate-400 tracking-wider">ÉMETTEUR (Vendeur)</div>
                <div class="font-bold text-slate-900 text-base">${business.name}</div>
                <div class="text-xs text-slate-500">${business.address || 'Dakar, Sénégal'}</div>
                <div class="text-xs text-slate-500">Tél: ${business.phone || '-'} | Email: ${business.email || '-'}</div>
                ${business.nif ? `<div class="text-xs text-slate-600 font-semibold mt-1">NIF: ${business.nif}</div>` : ''}
              </div>

              <!-- Client -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="form-label mb-0" for="inv-client">Client *</label>
                  <button type="button" id="btn-quick-new-client" class="text-xs text-primary-700 font-bold hover:underline bg-transparent border-0 cursor-pointer">
                    + Nouveau client
                  </button>
                </div>
                <select id="inv-client" class="form-select" required>
                  <option value="">-- Choisir un client --</option>
                  ${clients.map(c => `
                    <option value="${c.id}" ${existing?.clientId === c.id ? 'selected' : ''}>${c.name} (${c.phone || c.email || 'Client'})</option>
                  `).join('')}
                </select>
                <div class="form-hint">Le client sera automatiquement notifié</div>
              </div>

              <!-- Métadonnées Document -->
              <div class="space-y-3">
                <div class="form-group mb-2">
                  <label class="form-label" for="inv-number">Numéro de Facture</label>
                  <input type="text" id="inv-number" class="form-control font-bold text-primary-700" value="${invoiceNumber}" required>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="form-label text-xs" for="inv-date">Date d'émission</label>
                    <input type="date" id="inv-date" class="form-control text-xs" value="${issueDate}" required>
                  </div>
                  <div>
                    <label class="form-label text-xs" for="inv-due">Date d'échéance</label>
                    <input type="date" id="inv-due" class="form-control text-xs" value="${dueDate}" required>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Bloc Lignes de Facture (Items) -->
          <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-slate-900 text-lg">Prestations & Produits</h3>
              <button type="button" id="btn-add-line" class="btn btn-secondary btn-sm">
                <i class="fa-solid fa-plus text-primary-700"></i> Ajouter une ligne
              </button>
            </div>

            <!-- Items Table -->
            <div class="table-container mb-4">
              <table class="table" id="table-items">
                <thead>
                  <tr>
                    <th style="width: 32%;">Désignation & Description</th>
                    <th style="width: 12%;" class="text-center">Quantité</th>
                    <th style="width: 20%;" class="text-right">Prix Unitaire (${currency})</th>
                    <th style="width: 14%;" class="text-center">TVA (%)</th>
                    <th style="width: 18%;" class="text-right">Total HT</th>
                    <th style="width: 4%;"></th>
                  </tr>
                </thead>
                <tbody id="items-tbody">
                  <!-- Rendered dynamically -->
                </tbody>
              </table>
            </div>

            <!-- Pre-filled product helper -->
            ${products.length > 0 ? `
              <div class="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-md border border-slate-200">
                <i class="fa-solid fa-lightbulb text-amber-500"></i>
                <span>Astuce : Vous pouvez sélectionner rapidement vos prestations depuis le catalogue pré-enregistré.</span>
              </div>
            ` : ''}
          </div>

          <!-- Bloc Totaux & Notes -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- Conditions & Notes -->
            <div class="card p-6 space-y-4">
              <div class="form-group">
                <label class="form-label" for="inv-terms">Conditions de règlement</label>
                <input type="text" id="inv-terms" class="form-control text-xs" value="${existing?.paymentTerms || 'Paiement sous 15 jours par Wave, Orange Money ou virement'}" placeholder="Modalités de paiement...">
              </div>
              <div class="form-group">
                <label class="form-label" for="inv-notes">Notes / Mentions légales</label>
                <textarea id="inv-notes" class="form-textarea text-xs" rows="3" placeholder="Ex: Merci pour votre confiance !">${existing?.notes || ''}</textarea>
              </div>
            </div>

            <!-- Boîte de calculs des Totaux -->
            <div class="card p-6 bg-slate-50 flex flex-col justify-between">
              <div class="space-y-3">
                <div class="flex justify-between items-center text-sm text-slate-600">
                  <span>Sous-total HT :</span>
                  <span id="calc-subtotal" class="font-bold text-slate-900">0 ${currency}</span>
                </div>

                <div class="flex justify-between items-center text-xs text-slate-600">
                  <div class="flex items-center gap-2">
                    <span>Remise globale (%) :</span>
                    <input type="number" id="inv-discount" class="form-control py-1 px-2 w-16 text-center text-xs" value="${Math.round(discountPercent)}" min="0" max="100">
                  </div>
                  <span class="text-slate-400">Déduite du HT</span>
                </div>

                <div class="flex justify-between items-center text-sm text-slate-600 pb-3 border-b border-slate-200">
                  <span>TVA Standard (${business.defaultVatRate || 18}%) :</span>
                  <span id="calc-vat" class="font-bold text-slate-900">0 ${currency}</span>
                </div>

                <div class="flex justify-between items-center text-xl font-extrabold text-primary-700 pt-1">
                  <span>Total TTC :</span>
                  <span id="calc-total">0 ${currency}</span>
                </div>
              </div>

              <div class="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-3">
                <a href="#/invoices" class="btn btn-secondary">Annuler</a>
                <button type="submit" class="btn btn-primary shadow-md">
                  <i class="fa-solid fa-check"></i> Enregistrer la facture
                </button>
              </div>
            </div>

          </div>

        </form>

      </div>
    `;

    renderItemRows();
    calculateAndRenderTotals();
    attachEditorEvents();
  }

  function renderItemRows() {
    const tbody = container.querySelector('#items-tbody');
    if (!tbody) return;

    tbody.innerHTML = items.map((item, index) => {
      const lineTotal = (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);

      return `
        <tr data-index="${index}">
          <td>
            <div class="space-y-1">
              <!-- Select Catalog Product Shortcut -->
              ${products.length > 0 ? `
                <select class="form-select text-xs py-1 px-2 mb-1 item-catalog-select" data-index="${index}">
                  <option value="">-- Remplir depuis le catalogue --</option>
                  ${products.map(p => `
                    <option value="${p.id}">${p.name} (${db.formatCurrency(p.unitPrice, currency)})</option>
                  `).join('')}
                </select>
              ` : ''}
              <input type="text" class="form-control text-sm item-name font-semibold" placeholder="Nom de la prestation ou du produit" value="${item.name || ''}" required>
              <input type="text" class="form-control text-xs item-desc text-slate-500" placeholder="Description complémentaire..." value="${item.description || ''}">
            </div>
          </td>
          <td class="text-center">
            <input type="number" class="form-control text-center text-sm item-qty font-bold" value="${item.quantity || 1}" min="1" step="any" required>
          </td>
          <td class="text-right">
            <input type="number" class="form-control text-right text-sm item-price font-bold" value="${item.unitPrice || 0}" min="0" step="any" required>
          </td>
          <td class="text-center">
            <input type="number" class="form-control text-center text-sm item-vat" value="${item.vatRate !== undefined ? item.vatRate : (business.defaultVatRate || 18)}" min="0" max="100">
          </td>
          <td class="text-right font-bold text-slate-900 text-sm line-total-cell">
            ${db.formatCurrency(lineTotal, '')}
          </td>
          <td class="text-center">
            <button type="button" class="btn-ghost text-red-500 hover:text-red-700 cursor-pointer p-1 rounded btn-remove-line" data-index="${index}" title="Supprimer la ligne">
              <i class="fa-solid fa-trash text-sm"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    attachRowEvents();
  }

  function attachRowEvents() {
    const tbody = container.querySelector('#items-tbody');
    if (!tbody) return;

    tbody.querySelectorAll('tr').forEach(row => {
      const index = Number(row.getAttribute('data-index'));

      // Saisie nom
      row.querySelector('.item-name').addEventListener('input', (e) => {
        items[index].name = e.target.value;
      });

      // Saisie description
      row.querySelector('.item-desc').addEventListener('input', (e) => {
        items[index].description = e.target.value;
      });

      // Saisie quantité
      row.querySelector('.item-qty').addEventListener('input', (e) => {
        items[index].quantity = Number(e.target.value) || 0;
        const lineTotal = items[index].quantity * (items[index].unitPrice || 0);
        row.querySelector('.line-total-cell').textContent = db.formatCurrency(lineTotal, '');
        calculateAndRenderTotals();
      });

      // Saisie prix
      row.querySelector('.item-price').addEventListener('input', (e) => {
        items[index].unitPrice = Number(e.target.value) || 0;
        const lineTotal = (items[index].quantity || 1) * items[index].unitPrice;
        row.querySelector('.line-total-cell').textContent = db.formatCurrency(lineTotal, '');
        calculateAndRenderTotals();
      });

      // Saisie TVA
      row.querySelector('.item-vat').addEventListener('input', (e) => {
        items[index].vatRate = Number(e.target.value) || 0;
        calculateAndRenderTotals();
      });

      // Remplir depuis le catalogue
      const catalogSelect = row.querySelector('.item-catalog-select');
      if (catalogSelect) {
        catalogSelect.addEventListener('change', (e) => {
          const prodId = e.target.value;
          if (prodId) {
            const prod = productService.getProductById(prodId);
            if (prod) {
              items[index].name = prod.name;
              items[index].description = prod.description || '';
              items[index].unitPrice = prod.unitPrice || 0;
              items[index].vatRate = prod.vatRate || (business.defaultVatRate || 18);
              renderItemRows();
              calculateAndRenderTotals();
            }
          }
        });
      }

      // Supprimer ligne
      row.querySelector('.btn-remove-line').addEventListener('click', () => {
        if (items.length <= 1) {
          notifications.warning('La facture doit contenir au moins une ligne.');
          return;
        }
        items.splice(index, 1);
        renderItemRows();
        calculateAndRenderTotals();
      });
    });
  }

  function attachEditorEvents() {
    // Ajouter ligne
    container.querySelector('#btn-add-line').addEventListener('click', () => {
      items.push({
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        vatRate: business.defaultVatRate || 18
      });
      renderItemRows();
      calculateAndRenderTotals();
    });

    // Remise globale
    const discountInput = container.querySelector('#inv-discount');
    if (discountInput) {
      discountInput.addEventListener('input', (e) => {
        discountPercent = Number(e.target.value) || 0;
        calculateAndRenderTotals();
      });
    }

    // Modal d'ajout rapide de client
    const newClientBtn = container.querySelector('#btn-quick-new-client');
    if (newClientBtn) {
      newClientBtn.addEventListener('click', () => {
        openQuickClientModal((newClient) => {
          const clientSelect = container.querySelector('#inv-client');
          const opt = document.createElement('option');
          opt.value = newClient.id;
          opt.textContent = `${newClient.name} (${newClient.phone || 'Nouveau'})`;
          opt.selected = true;
          clientSelect.appendChild(opt);
        });
      });
    }

    // Sauvegarder
    function saveInvoice(status = 'sent', redirectToPreview = true) {
      const clientId = container.querySelector('#inv-client').value;
      const invoiceNumber = container.querySelector('#inv-number').value;
      const issueDate = container.querySelector('#inv-date').value;
      const dueDate = container.querySelector('#inv-due').value;
      const paymentTerms = container.querySelector('#inv-terms').value;
      const notes = container.querySelector('#inv-notes').value;

      if (!clientId) {
        notifications.error('Veuillez sélectionner un client.');
        return;
      }

      // Valider les items
      const validItems = items.filter(i => i.name && i.name.trim());
      if (validItems.length === 0) {
        notifications.error('Veuillez renseigner au moins une ligne de facture avec un nom.');
        return;
      }

      const payload = {
        clientId,
        invoiceNumber,
        issueDate,
        dueDate,
        paymentTerms,
        notes,
        discount: discountPercent,
        status: status,
        items: validItems
      };

      try {
        let inv;
        if (isEdit) {
          inv = invoiceService.updateInvoice(invoiceId, payload);
          notifications.success(`Facture ${inv.invoiceNumber} mise à jour avec succès !`);
        } else {
          inv = invoiceService.createInvoice(payload);
          notifications.success(`Facture ${inv.invoiceNumber} créée avec succès !`);
        }

        if (redirectToPreview) {
          window.location.hash = `#/invoices/preview/${inv.id}`;
        } else {
          window.location.hash = `#/invoices`;
        }
      } catch (err) {
        notifications.error(err.message);
      }
    }

    // Soumission Formulaire
    const form = container.querySelector('#form-invoice-editor');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveInvoice('sent', true);
    });

    container.querySelector('#btn-save-draft').addEventListener('click', () => {
      saveInvoice('draft', false);
    });

    container.querySelector('#btn-save-view').addEventListener('click', () => {
      saveInvoice('sent', true);
    });
  }

  render();
}

/**
 * Modal rapide de création de client depuis l'éditeur de facture
 */
export function openQuickClientModal(onCreated) {
  const modalContainer = document.getElementById('modal-container');
  modalContainer.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="text-lg font-bold text-slate-900">Nouveau Client</h3>
        <button type="button" id="modal-close-client" class="text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer text-lg">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <form id="form-quick-client">
        <div class="modal-body space-y-4">
          <div class="form-group">
            <label class="form-label" for="qc-name">Nom complet ou Raison Sociale *</label>
            <input type="text" id="qc-name" class="form-control" placeholder="Ex: Dakar Logistique SARL" required>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="form-group">
              <label class="form-label" for="qc-type">Type</label>
              <select id="qc-type" class="form-select">
                <option value="entreprise">Entreprise</option>
                <option value="particulier">Particulier</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="qc-phone">Téléphone / WhatsApp</label>
              <input type="tel" id="qc-phone" class="form-control" placeholder="+221 77 000 00 00">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="qc-email">Email</label>
            <input type="email" id="qc-email" class="form-control" placeholder="contact@client.sn">
          </div>

          <div class="form-group">
            <label class="form-label" for="qc-address">Adresse physique</label>
            <input type="text" id="qc-address" class="form-control" placeholder="Dakar, Point E">
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" id="btn-cancel-qc" class="btn btn-secondary">Annuler</button>
          <button type="submit" class="btn btn-primary">Ajouter le client</button>
        </div>
      </form>
    </div>
  `;

  modalContainer.classList.remove('hidden');

  function closeModal() {
    modalContainer.classList.add('hidden');
    modalContainer.innerHTML = '';
  }

  modalContainer.querySelector('#modal-close-client').addEventListener('click', closeModal);
  modalContainer.querySelector('#btn-cancel-qc').addEventListener('click', closeModal);

  const form = modalContainer.querySelector('#form-quick-client');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('#qc-name').value;
    const type = form.querySelector('#qc-type').value;
    const phone = form.querySelector('#qc-phone').value;
    const email = form.querySelector('#qc-email').value;
    const address = form.querySelector('#qc-address').value;

    try {
      const client = clientService.createClient({ name, type, phone, email, address });
      notifications.success(`Client ${client.name} créé avec succès !`);
      closeModal();
      if (onCreated) onCreated(client);
    } catch (err) {
      notifications.error(err.message);
    }
  });
}
