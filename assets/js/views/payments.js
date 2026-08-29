/**
 * PINAL_FACTURE — Vue Journal des Paiements & Encaissements
 */

import { db } from '../db.js';
import { auth } from '../auth.js';
import { paymentService, PAYMENT_METHODS } from '../services/payment.service.js';
import { invoiceService } from '../services/invoice.service.js';
import { openPaymentModal } from './invoices.js';
import { notifications } from '../services/notification.service.js';

export function renderPaymentsView(container) {
  const business = auth.getBusiness();
  const currency = business?.currency || 'FCFA';
  let activeMethod = 'all';

  function render() {
    const payments = paymentService.getPayments({ method: activeMethod });
    const unpaidInvoices = invoiceService.getInvoices().filter(inv => inv.status !== 'paid' && inv.balanceDue > 0);

    const totalCollected = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    container.innerHTML = `
      <div class="p-4 sm:p-6 lg:p-8 max-w-7xl">
        
        <!-- Top Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Journal des Paiements</h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">Historique des encaissements Wave, Orange Money, Espèces et Virements</p>
          </div>
          ${unpaidInvoices.length > 0 ? `
            <button id="btn-new-payment" class="btn btn-primary shadow-md">
              <i class="fa-solid fa-plus"></i> Enregistrer un encaissement
            </button>
          ` : ''}
        </div>

        <!-- Summary & Filters Card -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          
          <div class="card p-4 bg-emerald-50 border-emerald-200 md:col-span-1">
            <div class="text-xs font-bold uppercase text-emerald-800">Total des Encaissements</div>
            <div class="text-2xl font-black text-emerald-900 mt-1">${db.formatCurrency(totalCollected, currency)}</div>
            <div class="text-xs text-emerald-700 mt-0.5">${payments.length} transactions enregistrées</div>
          </div>

          <div class="card p-4 md:col-span-3 flex items-center">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-bold text-slate-500 mr-2">Filtrer par moyen :</span>
              <button class="btn btn-sm ${activeMethod === 'all' ? 'btn-primary' : 'btn-ghost'}" data-method="all">Tous</button>
              <button class="btn btn-sm ${activeMethod === 'wave' ? 'btn-primary' : 'btn-ghost'}" data-method="wave">
                <i class="fa-solid fa-water text-cyan-500 mr-1"></i> Wave
              </button>
              <button class="btn btn-sm ${activeMethod === 'orange_money' ? 'btn-primary' : 'btn-ghost'}" data-method="orange_money">
                <i class="fa-solid fa-mobile-screen text-orange-500 mr-1"></i> Orange Money
              </button>
              <button class="btn btn-sm ${activeMethod === 'cash' ? 'btn-primary' : 'btn-ghost'}" data-method="cash">
                <i class="fa-solid fa-money-bill-wave text-emerald-500 mr-1"></i> Espèces
              </button>
              <button class="btn btn-sm ${activeMethod === 'bank_transfer' ? 'btn-primary' : 'btn-ghost'}" data-method="bank_transfer">
                <i class="fa-solid fa-building-columns text-purple-500 mr-1"></i> Virement
              </button>
            </div>
          </div>

        </div>

        <!-- Payments Table -->
        <div class="table-container shadow-sm">
          <table class="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>N° Facture</th>
                <th>Client</th>
                <th>Moyen de Paiement</th>
                <th>Référence Transaction</th>
                <th class="text-right">Montant Encaissé</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map(p => `
                <tr>
                  <td class="text-xs font-semibold text-slate-700">${p.date}</td>
                  <td class="font-bold text-slate-900">
                    <a href="#/invoices/preview/${p.invoice?.id}" class="text-primary-700 hover:underline">
                      ${p.invoice?.invoiceNumber || '-'}
                    </a>
                  </td>
                  <td class="text-sm font-medium text-slate-800">${p.client?.name || '-'}</td>
                  <td>
                    <span class="method-pill ${p.methodInfo?.class || 'method-wave'}">
                      <i class="${p.methodInfo?.icon || 'fa-solid fa-receipt'}"></i>
                      ${p.methodInfo?.label || p.paymentMethod}
                    </span>
                  </td>
                  <td class="font-mono text-xs text-slate-500">${p.reference || '-'}</td>
                  <td class="text-right font-extrabold text-emerald-700 text-sm">
                    + ${db.formatCurrency(p.amount, currency)}
                  </td>
                  <td class="text-right">
                    <button class="btn btn-ghost btn-sm text-red-500 hover:text-red-700 btn-delete-payment" data-id="${p.id}" title="Annuler ce paiement">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}

              ${payments.length === 0 ? `
                <tr>
                  <td colspan="7" class="text-center py-12 text-slate-400">
                    <i class="fa-solid fa-receipt text-4xl mb-2"></i>
                    <div class="text-sm font-semibold text-slate-600">Aucun encaissement trouvé</div>
                    <div class="text-xs text-slate-400 mt-1">Enregistrez vos paiements Wave ou Orange Money depuis vos factures.</div>
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>

      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    container.querySelectorAll('[data-method]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeMethod = btn.getAttribute('data-method');
        render();
      });
    });

    const newPayBtn = container.querySelector('#btn-new-payment');
    if (newPayBtn) {
      newPayBtn.addEventListener('click', () => {
        openSelectInvoiceForPaymentModal(render);
      });
    }

    container.querySelectorAll('.btn-delete-payment').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Voulez-vous annuler ce paiement ? Le solde de la facture sera automatiquement recalculé.')) {
          paymentService.deletePayment(id);
          notifications.info('Paiement annulé.');
          render();
        }
      });
    });
  }

  render();
}

/**
 * Modal pour choisir une facture en attente de règlement
 */
function openSelectInvoiceForPaymentModal(onSuccess) {
  const unpaidInvoices = invoiceService.getInvoices().filter(inv => inv.status !== 'paid' && inv.balanceDue > 0);
  const business = auth.getBusiness();
  const currency = business?.currency || 'FCFA';

  const modalContainer = document.getElementById('modal-container');
  modalContainer.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="text-lg font-bold text-slate-900">Sélectionner une facture à encaisser</h3>
        <button type="button" id="modal-close-sel" class="text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer text-lg">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="modal-body space-y-3">
        ${unpaidInvoices.map(inv => {
          const client = db.getById('clients', inv.clientId);
          return `
            <div class="p-3 rounded-lg border border-slate-200 hover:border-primary-600 hover:bg-slate-50 transition-all flex items-center justify-between cursor-pointer invoice-select-item" data-id="${inv.id}">
              <div>
                <div class="font-bold text-slate-900">${inv.invoiceNumber} — ${client?.name || '-'}</div>
                <div class="text-xs text-slate-500">Échéance : ${inv.dueDate}</div>
              </div>
              <div class="text-right">
                <div class="text-xs text-slate-400">Solde dû</div>
                <div class="font-bold text-red-600">${db.formatCurrency(inv.balanceDue, currency)}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="modal-footer">
        <button type="button" id="btn-cancel-sel" class="btn btn-secondary">Fermer</button>
      </div>
    </div>
  `;

  modalContainer.classList.remove('hidden');

  function closeModal() {
    modalContainer.classList.add('hidden');
    modalContainer.innerHTML = '';
  }

  modalContainer.querySelector('#modal-close-sel').addEventListener('click', closeModal);
  modalContainer.querySelector('#btn-cancel-sel').addEventListener('click', closeModal);

  modalContainer.querySelectorAll('.invoice-select-item').forEach(item => {
    item.addEventListener('click', () => {
      const invoiceId = item.getAttribute('data-id');
      closeModal();
      openPaymentModal(invoiceId, onSuccess);
    });
  });
}
