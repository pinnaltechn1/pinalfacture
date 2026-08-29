/**
 * PINAL_FACTURE — Vues Aperçu de Facture, Génération PDF & Vue Publique Client
 */

import { invoiceService } from '../services/invoice.service.js';
import { pdfService } from '../services/pdf.service.js';
import { openPaymentModal } from './invoices.js';
import { notifications } from '../services/notification.service.js';

export function renderInvoicePreviewView(container, invoiceId) {
  const inv = invoiceService.getInvoiceDetails(invoiceId);

  if (!inv) {
    container.innerHTML = `
      <div class="p-8 text-center">
        <h2 class="text-xl font-bold text-slate-800">Facture introuvable</h2>
        <a href="#/invoices" class="btn btn-primary btn-sm mt-4">Retour aux factures</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      
      <!-- Top Action Bar -->
      <div class="card p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        <div class="flex items-center gap-3">
          <a href="#/invoices" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-arrow-left"></i> Factures
          </a>
          <div>
            <span class="font-extrabold text-slate-900 text-lg">Facture ${inv.invoiceNumber}</span>
            <span class="text-xs text-slate-500 ml-2">Client : ${inv.client?.name || '-'}</span>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <a href="#/invoices/edit/${inv.id}" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-pen-to-square"></i> Modifier
          </a>

          ${inv.status !== 'paid' ? `
            <button id="btn-preview-pay" class="btn btn-accent btn-sm shadow-sm">
              <i class="fa-solid fa-hand-holding-dollar"></i> Encaisser
            </button>
          ` : ''}

          <button id="btn-download-pdf" class="btn btn-primary btn-sm shadow-md">
            <i class="fa-solid fa-file-arrow-down"></i> Télécharger PDF
          </button>

          <button id="btn-print" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-print"></i> Imprimer
          </button>

          <button id="btn-send-modal" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-paper-plane text-primary-700"></i> Envoyer
          </button>
        </div>
      </div>

      <!-- High-Fidelity Printable Invoice Sheet -->
      <div id="invoice-render-target">
        ${pdfService.renderInvoiceHTML(inv)}
      </div>

    </div>
  `;

  // Événements
  const payBtn = container.querySelector('#btn-preview-pay');
  if (payBtn) {
    payBtn.addEventListener('click', () => {
      openPaymentModal(inv.id, () => {
        renderInvoicePreviewView(container, invoiceId);
      });
    });
  }

  container.querySelector('#btn-download-pdf').addEventListener('click', async () => {
    const el = container.querySelector('#invoice-pdf-document');
    notifications.info('Génération du document PDF en cours...');
    await pdfService.downloadPDF(inv, el);
    notifications.success('Facture PDF téléchargée avec succès !');
  });

  container.querySelector('#btn-print').addEventListener('click', () => {
    pdfService.printInvoice();
  });

  container.querySelector('#btn-send-modal').addEventListener('click', () => {
    openSendInvoiceModal(inv);
  });
}

/**
 * Modal d'envoi de facture (WhatsApp, Email & Lien public)
 */
export function openSendInvoiceModal(inv) {
  const modalContainer = document.getElementById('modal-container');
  const publicUrl = `${window.location.origin}${window.location.pathname}#/public-invoice/${inv.publicToken}`;
  const clientPhone = inv.client?.phone ? inv.client.phone.replace(/[^0-9]/g, '') : '';
  const messageText = encodeURIComponent(`Bonjour ${inv.client?.name || ''}, voici votre facture N° ${inv.invoiceNumber} de ${inv.total} FCFA émise par ${inv.business?.name || 'notre entreprise'}. Vous pouvez la consulter et la télécharger ici : ${publicUrl}`);
  const whatsappUrl = `https://wa.me/${clientPhone}?text=${messageText}`;

  modalContainer.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="text-lg font-bold text-slate-900">Transmettre la Facture</h3>
        <button type="button" id="modal-close-send" class="text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer text-lg">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="modal-body space-y-4">
        <p class="text-xs text-slate-600">Choisissez le canal d'envoi adapté à votre client :</p>

        <!-- Option WhatsApp -->
        <a href="${whatsappUrl}" target="_blank" class="flex items-center justify-between p-4 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl">
              <i class="fa-brands fa-whatsapp"></i>
            </div>
            <div>
              <div class="font-bold text-slate-900 text-sm">Envoyer via WhatsApp</div>
              <div class="text-xs text-slate-500">${inv.client?.phone || 'Numéro WhatsApp du client'}</div>
            </div>
          </div>
          <i class="fa-solid fa-arrow-up-right-from-square text-emerald-700"></i>
        </a>

        <!-- Option Email -->
        <a href="mailto:${inv.client?.email || ''}?subject=${encodeURIComponent(`Facture ${inv.invoiceNumber} - ${inv.business?.name || ''}`)}&body=${messageText}" class="flex items-center justify-between p-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl">
              <i class="fa-solid fa-envelope"></i>
            </div>
            <div>
              <div class="font-bold text-slate-900 text-sm">Envoyer par Email</div>
              <div class="text-xs text-slate-500">${inv.client?.email || 'Email du client'}</div>
            </div>
          </div>
          <i class="fa-solid fa-arrow-up-right-from-square text-blue-700"></i>
        </a>

        <!-- Option Lien Public Sécurisé -->
        <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
          <div class="font-bold text-slate-900 text-sm flex items-center gap-2">
            <i class="fa-solid fa-link text-primary-700"></i> Lien public sécurisé
          </div>
          <div class="flex gap-2">
            <input type="text" readonly class="form-control text-xs font-mono" value="${publicUrl}" id="public-link-input">
            <button type="button" id="btn-copy-public-link" class="btn btn-primary btn-sm">
              <i class="fa-solid fa-copy"></i>
            </button>
          </div>
          <p class="text-[11px] text-slate-400">Ce lien permet au client de consulter sa facture sans avoir accès à vos autres données.</p>
        </div>

      </div>

      <div class="modal-footer">
        <button type="button" id="btn-close-send" class="btn btn-secondary">Fermer</button>
      </div>
    </div>
  `;

  modalContainer.classList.remove('hidden');

  function closeModal() {
    modalContainer.classList.add('hidden');
    modalContainer.innerHTML = '';
  }

  modalContainer.querySelector('#modal-close-send').addEventListener('click', closeModal);
  modalContainer.querySelector('#btn-close-send').addEventListener('click', closeModal);

  modalContainer.querySelector('#btn-copy-public-link').addEventListener('click', () => {
    navigator.clipboard.writeText(publicUrl).then(() => {
      notifications.success('Lien copié dans le presse-papier !');
    });
  });
}

/**
 * Vue Publique Sécurisée pour le Client Final (sans barre d'administration)
 */
export function renderPublicInvoiceView(container, token) {
  const inv = invoiceService.getPublicInvoice(token);

  if (!inv) {
    container.innerHTML = `
      <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div class="card max-w-md w-full p-8 text-center">
          <i class="fa-solid fa-file-circle-xmark text-4xl text-slate-300 mb-3"></i>
          <h1 class="text-xl font-bold text-slate-800">Facture introuvable ou lien expiré</h1>
          <p class="text-xs text-slate-500 mt-2">Veuillez contacter votre émetteur pour obtenir un lien valide.</p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="min-h-screen bg-slate-100 py-8 px-4">
      <div class="max-w-4xl mx-auto">
        
        <!-- Public Top Banner -->
        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-primary-700 text-white flex items-center justify-center font-bold text-lg">
              P
            </div>
            <div>
              <div class="font-extrabold text-slate-900">Portail Client — Facture ${inv.invoiceNumber}</div>
              <div class="text-xs text-slate-500">Émise par <strong>${inv.business?.name || 'Entreprise'}</strong></div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button id="btn-public-download" class="btn btn-primary btn-sm shadow-md">
              <i class="fa-solid fa-download"></i> Télécharger PDF
            </button>
            <button id="btn-public-print" class="btn btn-secondary btn-sm">
              <i class="fa-solid fa-print"></i> Imprimer
            </button>
          </div>
        </div>

        <!-- Rendered Sheet -->
        <div id="invoice-render-target">
          ${pdfService.renderInvoiceHTML(inv)}
        </div>

      </div>
    </div>
  `;

  container.querySelector('#btn-public-download').addEventListener('click', async () => {
    const el = container.querySelector('#invoice-pdf-document');
    notifications.info('Téléchargement du PDF en cours...');
    await pdfService.downloadPDF(inv, el);
  });

  container.querySelector('#btn-public-print').addEventListener('click', () => {
    pdfService.printInvoice();
  });
}
