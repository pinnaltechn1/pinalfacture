/**
 * PINAL_FACTURE — Service Gestion des Paiements (Wave, Orange Money, Espèces, Virement)
 */

import { db } from '../db.js';
import { auth } from '../auth.js';

export const PAYMENT_METHODS = [
  { id: 'wave', label: 'Wave', icon: 'fa-solid fa-water', class: 'method-wave' },
  { id: 'orange_money', label: 'Orange Money', icon: 'fa-solid fa-mobile-screen', class: 'method-om' },
  { id: 'cash', label: 'Espèces', icon: 'fa-solid fa-money-bill-wave', class: 'method-cash' },
  { id: 'bank_transfer', label: 'Virement bancaire', icon: 'fa-solid fa-building-columns', class: 'method-bank' },
  { id: 'card', label: 'Carte bancaire', icon: 'fa-solid fa-credit-card', class: 'method-card' },
  { id: 'other', label: 'Autre moyen', icon: 'fa-solid fa-receipt', class: 'method-card' }
];

export class PaymentService {
  // Récupérer tous les paiements de l'entreprise
  getPayments(filters = {}) {
    const business = auth.getBusiness();
    if (!business) return [];

    let payments = db.find('payments', p => p.businessId === business.id);

    if (filters.method && filters.method !== 'all') {
      payments = payments.filter(p => p.paymentMethod === filters.method);
    }

    if (filters.invoiceId) {
      payments = payments.filter(p => p.invoiceId === filters.invoiceId);
    }

    return payments.map(p => {
      const invoice = db.getById('invoices', p.invoiceId);
      const client = invoice ? db.getById('clients', invoice.clientId) : null;
      const methodInfo = PAYMENT_METHODS.find(m => m.id === p.paymentMethod) || PAYMENT_METHODS[0];

      return {
        ...p,
        invoice,
        client,
        methodInfo
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // Enregistrer un paiement pour une facture
  recordPayment({ invoiceId, amount, date, paymentMethod, reference, notes }) {
    const business = auth.getBusiness();
    if (!business) throw new Error("Aucune entreprise connectée.");

    const invoice = db.getById('invoices', invoiceId);
    if (!invoice) throw new Error("Facture introuvable.");

    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new Error("Le montant du paiement doit être supérieur à zéro.");
    }

    const currentPaid = Number(invoice.amountPaid) || 0;
    const invoiceTotal = Number(invoice.total) || 0;
    const newTotalPaid = currentPaid + paymentAmount;
    const newBalanceDue = Math.max(0, invoiceTotal - newTotalPaid);

    // Déterminer le nouveau statut
    let newStatus = invoice.status;
    if (newTotalPaid >= invoiceTotal) {
      newStatus = 'paid';
    } else if (newTotalPaid > 0) {
      newStatus = 'partial';
    }

    // Créer l'enregistrement de paiement
    const payment = db.insert('payments', {
      invoiceId: invoice.id,
      businessId: business.id,
      amount: paymentAmount,
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'wave',
      reference: reference ? reference.trim() : `PAY-${Date.now().toString().slice(-6)}`,
      notes: notes || ''
    });

    // Mettre à jour la facture
    db.update('invoices', invoice.id, {
      amountPaid: newTotalPaid,
      balanceDue: newBalanceDue,
      status: newStatus
    });

    // Journaliser le changement de statut
    const methodObj = PAYMENT_METHODS.find(m => m.id === paymentMethod);
    const methodLabel = methodObj ? methodObj.label : paymentMethod;
    
    db.insert('invoice_status_history', {
      invoiceId: invoice.id,
      oldStatus: invoice.status,
      newStatus: newStatus,
      note: `Paiement de ${db.formatCurrency(paymentAmount, business.currency)} reçu via ${methodLabel}`,
      timestamp: new Date().toISOString()
    });

    // Notification système
    db.insert('notifications', {
      businessId: business.id,
      title: 'Paiement enregistré',
      message: `Paiement de ${db.formatCurrency(paymentAmount, business.currency)} reçu pour la facture ${invoice.invoiceNumber}.`,
      type: 'success',
      isRead: false
    });

    return payment;
  }

  // Supprimer un paiement et recalculer le solde de la facture
  deletePayment(paymentId) {
    const payment = db.getById('payments', paymentId);
    if (!payment) return false;

    const invoice = db.getById('invoices', payment.invoiceId);
    if (invoice) {
      const remainingPayments = db.find('payments', p => p.invoiceId === invoice.id && p.id !== paymentId);
      const totalPaid = remainingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const total = Number(invoice.total) || 0;
      const balanceDue = Math.max(0, total - totalPaid);

      let status = 'draft';
      if (totalPaid >= total && total > 0) status = 'paid';
      else if (totalPaid > 0) status = 'partial';
      else if (invoice.status === 'paid' || invoice.status === 'partial') status = 'sent';

      db.update('invoices', invoice.id, {
        amountPaid: totalPaid,
        balanceDue: balanceDue,
        status: status
      });
    }

    return db.delete('payments', paymentId);
  }
}

export const paymentService = new PaymentService();
