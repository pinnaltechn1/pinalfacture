/**
 * PINAL_FACTURE — Moteur de Rendu PDF & Impression A4
 */

import { db } from '../db.js';
import { PAYMENT_METHODS } from './payment.service.js';

export class PDFService {
  // Générer le HTML pur et stylisé de la facture A4
  renderInvoiceHTML(inv) {
    const business = inv.business || {};
    const client = inv.client || {};
    const items = inv.items || [];
    const payments = inv.payments || [];
    const currency = business.currency || 'FCFA';

    const statusLabels = {
      paid: { text: 'PAYÉE', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
      sent: { text: 'ENVOYÉE', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
      draft: { text: 'BROUILLON', color: '#475569', bg: '#F1F5F9', border: '#CBD5E1' },
      partial: { text: 'PARTIELLEMENT PAYÉE', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
      overdue: { text: 'EN RETARD', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
      cancelled: { text: 'ANNULÉE', color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1' }
    };

    const statusBadge = statusLabels[inv.status] || statusLabels.draft;

    const itemsRows = items.map((item, idx) => {
      const lineTotal = (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
      return `
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 12px 10px; color: #64748B; font-size: 13px; text-align: center;">${idx + 1}</td>
          <td style="padding: 12px 10px;">
            <div style="font-weight: 600; color: #0F172A; font-size: 14px;">${item.name || 'Produit / Service'}</div>
            ${item.description ? `<div style="font-size: 12px; color: #64748B; margin-top: 2px;">${item.description}</div>` : ''}
          </td>
          <td style="padding: 12px 10px; text-align: center; font-size: 14px; font-weight: 600; color: #334155;">${item.quantity}</td>
          <td style="padding: 12px 10px; text-align: right; font-size: 14px; color: #334155;">${db.formatCurrency(item.unitPrice, '')}</td>
          <td style="padding: 12px 10px; text-align: center; font-size: 13px; color: #64748B;">${item.vatRate || 18}%</td>
          <td style="padding: 12px 10px; text-align: right; font-size: 14px; font-weight: 700; color: #0F172A;">${db.formatCurrency(lineTotal, '')}</td>
        </tr>
      `;
    }).join('');

    const paymentsRows = payments.length > 0 ? payments.map(p => {
      const method = PAYMENT_METHODS.find(m => m.id === p.paymentMethod);
      const label = method ? method.label : p.paymentMethod;
      return `
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #059669; padding: 4px 0; border-bottom: 1px dashed #E2E8F0;">
          <span>• ${p.date} via <strong>${label}</strong> (Réf: ${p.reference || '-'})</span>
          <span style="font-weight: 700;">- ${db.formatCurrency(p.amount, currency)}</span>
        </div>
      `;
    }).join('') : '';

    return `
      <div id="invoice-pdf-document" class="invoice-sheet" style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #FFFFFF; color: #0F172A; padding: 36px 40px; box-sizing: border-box;">
        
        <!-- En-tête Facture -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; border-bottom: 2px solid #F1F5F9; padding-bottom: 20px;">
          <div>
            ${business.logoUrl ? `<img src="${business.logoUrl}" alt="Logo" style="max-height: 50px; margin-bottom: 8px;">` : ''}
            <h1 style="font-size: 22px; font-weight: 800; color: #0F766E; margin: 0; text-transform: uppercase; letter-spacing: -0.5px;">${business.name || 'Votre Entreprise'}</h1>
            <p style="font-size: 13px; color: #475569; margin: 4px 0 0 0;">${business.address || 'Dakar, Sénégal'}</p>
            <p style="font-size: 13px; color: #475569; margin: 2px 0 0 0;">Tél: ${business.phone || '-'} | Email: ${business.email || '-'}</p>
            ${business.nif ? `<p style="font-size: 12px; color: #64748B; margin: 2px 0 0 0;"><strong>NIF / RCCM :</strong> ${business.nif}</p>` : ''}
          </div>

          <div style="text-align: right;">
            <div style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 800; background: ${statusBadge.bg}; color: ${statusBadge.color}; border: 1px solid ${statusBadge.border}; margin-bottom: 8px;">
              ${statusBadge.text}
            </div>
            <h2 style="font-size: 20px; font-weight: 800; color: #0F172A; margin: 0;">FACTURE</h2>
            <div style="font-size: 15px; font-weight: 700; color: #0F766E; margin-top: 2px;">N° ${inv.invoiceNumber}</div>
            <div style="font-size: 12px; color: #64748B; margin-top: 4px;">Date d'émission : <strong>${inv.issueDate}</strong></div>
            <div style="font-size: 12px; color: #DC2626; margin-top: 2px;">Date d'échéance : <strong>${inv.dueDate}</strong></div>
          </div>
        </div>

        <!-- Coordonnées Client & Vendeur -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; background: #F8FAFC; padding: 16px 20px; border-radius: 8px; border: 1px solid #E2E8F0;">
          <div>
            <div style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">ÉMETTEUR :</div>
            <div style="font-size: 14px; font-weight: 700; color: #0F172A;">${business.name || 'Entreprise'}</div>
            <div style="font-size: 13px; color: #475569;">${business.address || ''}</div>
            <div style="font-size: 13px; color: #475569;">${business.phone || ''}</div>
            <div style="font-size: 13px; color: #475569;">${business.email || ''}</div>
          </div>

          <div>
            <div style="font-size: 11px; font-weight: 800; color: #0F766E; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">FACTURÉ À :</div>
            <div style="font-size: 14px; font-weight: 700; color: #0F172A;">${client.name || 'Client'}</div>
            ${client.type ? `<div style="font-size: 12px; color: #64748B; text-transform: capitalize;">Type : ${client.type}</div>` : ''}
            <div style="font-size: 13px; color: #475569;">${client.address || ''}</div>
            <div style="font-size: 13px; color: #475569;">${client.phone || ''}</div>
            <div style="font-size: 13px; color: #475569;">${client.email || ''}</div>
            ${client.taxNumber ? `<div style="font-size: 12px; color: #64748B; margin-top: 2px;">NIF Client: ${client.taxNumber}</div>` : ''}
          </div>
        </div>

        <!-- Tableau des Items -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="background: #0F766E; color: #FFFFFF;">
              <th style="padding: 10px; font-size: 12px; font-weight: 700; text-align: center; width: 40px; border-top-left-radius: 6px;">#</th>
              <th style="padding: 10px; font-size: 12px; font-weight: 700; text-align: left;">Désignation</th>
              <th style="padding: 10px; font-size: 12px; font-weight: 700; text-align: center; width: 60px;">Qté</th>
              <th style="padding: 10px; font-size: 12px; font-weight: 700; text-align: right; width: 110px;">Prix Unit. HT</th>
              <th style="padding: 10px; font-size: 12px; font-weight: 700; text-align: center; width: 60px;">TVA</th>
              <th style="padding: 10px; font-size: 12px; font-weight: 700; text-align: right; width: 120px; border-top-right-radius: 6px;">Total HT</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <!-- Totaux & Calculs Fiscaux -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px;">
          <div style="max-width: 50%;">
            ${inv.paymentTerms ? `
              <div style="margin-bottom: 12px;">
                <div style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 2px;">Conditions de règlement :</div>
                <div style="font-size: 12px; color: #64748B;">${inv.paymentTerms}</div>
              </div>
            ` : ''}
            
            ${payments.length > 0 ? `
              <div style="margin-top: 10px; padding: 10px; background: #F0FDF4; border-radius: 6px; border: 1px solid #BBF7D0;">
                <div style="font-size: 11px; font-weight: 800; color: #065F46; text-transform: uppercase; margin-bottom: 4px;">Historique des encaissements :</div>
                ${paymentsRows}
              </div>
            ` : ''}

            ${inv.notes ? `
              <div style="margin-top: 12px;">
                <div style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 2px;">Notes / Remarques :</div>
                <div style="font-size: 12px; color: #64748B; font-style: italic;">${inv.notes}</div>
              </div>
            ` : ''}
          </div>

          <div style="width: 280px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 6px;">
              <span>Sous-total HT :</span>
              <span style="font-weight: 600;">${db.formatCurrency(inv.subtotal, currency)}</span>
            </div>

            ${inv.discount > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #DC2626; margin-bottom: 6px;">
                <span>Remise commerciale :</span>
                <span style="font-weight: 600;">- ${db.formatCurrency(inv.discount, currency)}</span>
              </div>
            ` : ''}

            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed #CBD5E1;">
              <span>TVA (18%) :</span>
              <span style="font-weight: 600;">${db.formatCurrency(inv.vatAmount, currency)}</span>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #0F766E; margin-bottom: 8px;">
              <span>Total TTC :</span>
              <span>${db.formatCurrency(inv.total, currency)}</span>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #059669; margin-bottom: 4px;">
              <span>Montant Encaissé :</span>
              <span style="font-weight: 700;">${db.formatCurrency(inv.amountPaid || 0, currency)}</span>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 800; color: ${inv.balanceDue > 0 ? '#DC2626' : '#059669'}; padding-top: 6px; border-top: 2px solid #E2E8F0;">
              <span>Solde restant :</span>
              <span>${db.formatCurrency(inv.balanceDue || 0, currency)}</span>
            </div>
          </div>
        </div>

        <!-- Pied de page officiel -->
        <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; text-align: center; font-size: 11px; color: #94A3B8; margin-top: 24px;">
          <p style="margin: 0;">${business.name || 'Entreprise'} — Facture générée via <strong>Pinal_Facture</strong> (SaaS de facturation africain)</p>
          <p style="margin: 2px 0 0 0;">Pour toute question, contactez-nous au ${business.phone || '-'} ou par email à ${business.email || '-'}</p>
        </div>
      </div>
    `;
  }

  // Télécharger le document en PDF
  async downloadPDF(invoiceDetails, element) {
    const opt = {
      margin: 8,
      filename: `Facture_${invoiceDetails.invoiceNumber || 'PF'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (window.html2pdf) {
      try {
        await window.html2pdf().set(opt).from(element).save();
        return true;
      } catch (err) {
        console.error("Erreur html2pdf, bascule sur impression navigateur", err);
        window.print();
      }
    } else {
      window.print();
    }
  }

  // Lancer l'impression navigateur
  printInvoice() {
    window.print();
  }
}

export const pdfService = new PDFService();
