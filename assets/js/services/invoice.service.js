/**
 * PINAL_FACTURE — Service Métier Facturation & Calculs Fiscaux
 */

import { db } from '../db.js';
import { auth } from '../auth.js';

export class InvoiceService {
  // Calculer précisément les totaux d'une facture
  calculateTotals(items = [], discountPercent = 0, defaultVatRate = 18) {
    let subtotal = 0;
    let totalVat = 0;

    items.forEach(item => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const itemDiscount = Number(item.discount) || 0;
      const vatRate = item.vatRate !== undefined ? Number(item.vatRate) : defaultVatRate;

      const itemRawTotal = qty * price;
      const itemNetTotal = itemRawTotal * (1 - itemDiscount / 100);
      const itemVat = itemNetTotal * (vatRate / 100);

      subtotal += itemNetTotal;
      totalVat += itemVat;
    });

    const globalDiscountAmount = subtotal * (Number(discountPercent || 0) / 100);
    const discountedSubtotal = subtotal - globalDiscountAmount;
    
    // Si remise globale, ajuster la TVA proportionnellement
    const adjustedVat = discountPercent > 0 ? discountedSubtotal * (defaultVatRate / 100) : totalVat;
    const total = Math.round(discountedSubtotal + adjustedVat);

    return {
      subtotal: Math.round(subtotal),
      discount: Math.round(globalDiscountAmount),
      vatAmount: Math.round(adjustedVat),
      total: total
    };
  }

  // Récupérer toutes les factures de l'entreprise connectée
  getInvoices(filters = {}) {
    const business = auth.getBusiness();
    if (!business) return [];

    let invoices = db.find('invoices', inv => inv.businessId === business.id);

    // Filtre par statut
    if (filters.status && filters.status !== 'all') {
      invoices = invoices.filter(inv => inv.status === filters.status);
    }

    // Filtre par client
    if (filters.clientId) {
      invoices = invoices.filter(inv => inv.clientId === filters.clientId);
    }

    // Recherche par texte (numéro ou nom du client)
    if (filters.search) {
      const q = filters.search.toLowerCase();
      invoices = invoices.filter(inv => {
        const client = db.getById('clients', inv.clientId);
        return inv.invoiceNumber.toLowerCase().includes(q) ||
               (client && client.name.toLowerCase().includes(q));
      });
    }

    // Tri par date décroissante
    return invoices.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
  }

  // Récupérer une facture avec ses lignes, client et paiements
  getInvoiceDetails(invoiceId) {
    const invoice = db.getById('invoices', invoiceId);
    if (!invoice) return null;

    const items = db.find('invoice_items', item => item.invoiceId === invoiceId);
    const client = db.getById('clients', invoice.clientId);
    const business = db.getById('businesses', invoice.businessId);
    const payments = db.find('payments', p => p.invoiceId === invoiceId);
    const history = db.find('invoice_status_history', h => h.invoiceId === invoiceId);

    return {
      ...invoice,
      items,
      client,
      business,
      payments,
      history: history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    };
  }

  // Récupérer une facture publique via son token sécurisé
  getPublicInvoice(publicToken) {
    const invoices = db.find('invoices', { publicToken });
    if (invoices.length === 0) return null;
    return this.getInvoiceDetails(invoices[0].id);
  }

  // Créer une nouvelle facture
  createInvoice(data) {
    const business = auth.getBusiness();
    if (!business) throw new Error("Aucune entreprise active.");

    const items = data.items || [];
    if (items.length === 0) {
      throw new Error("Veuillez ajouter au moins un produit ou service.");
    }
    if (!data.clientId) {
      throw new Error("Veuillez sélectionner ou créer un client.");
    }

    const totals = this.calculateTotals(items, data.discount, business.defaultVatRate || 18);
    const invoiceNumber = data.invoiceNumber || db.getNextInvoiceNumber(business.id);
    const publicToken = 'tok_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

    const invoice = db.insert('invoices', {
      businessId: business.id,
      clientId: data.clientId,
      invoiceNumber: invoiceNumber,
      issueDate: data.issueDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      paymentTerms: data.paymentTerms || 'Règlement sous 15 jours par Wave, Orange Money ou virement',
      notes: data.notes || '',
      subtotal: totals.subtotal,
      discount: totals.discount,
      vatAmount: totals.vatAmount,
      total: totals.total,
      amountPaid: 0,
      balanceDue: totals.total,
      status: data.status || 'draft',
      publicToken: publicToken
    });

    // Enregistrer chaque ligne de facture
    items.forEach(item => {
      const lineTotal = (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
      db.insert('invoice_items', {
        invoiceId: invoice.id,
        productId: item.productId || null,
        name: item.name,
        description: item.description || '',
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        discount: Number(item.discount) || 0,
        vatRate: item.vatRate !== undefined ? Number(item.vatRate) : (business.defaultVatRate || 18),
        lineTotal: lineTotal
      });
    });

    // Journal d'historique
    db.insert('invoice_status_history', {
      invoiceId: invoice.id,
      oldStatus: null,
      newStatus: invoice.status,
      note: 'Facture créée avec succès',
      timestamp: new Date().toISOString()
    });

    // Notification interne
    db.insert('notifications', {
      businessId: business.id,
      title: 'Nouvelle facture créée',
      message: `La facture ${invoice.invoiceNumber} d'un montant de ${db.formatCurrency(invoice.total, business.currency)} a été créée.`,
      type: 'info',
      isRead: false
    });

    return invoice;
  }

  // Mettre à jour une facture
  updateInvoice(invoiceId, data) {
    const business = auth.getBusiness();
    const existing = db.getById('invoices', invoiceId);
    if (!existing) throw new Error("Facture introuvable.");

    const items = data.items || [];
    const totals = this.calculateTotals(items, data.discount, business.defaultVatRate || 18);
    const balanceDue = Math.max(0, totals.total - (existing.amountPaid || 0));

    // Déterminer le statut
    let status = existing.status;
    if (existing.amountPaid >= totals.total && totals.total > 0) {
      status = 'paid';
    } else if (existing.amountPaid > 0 && existing.amountPaid < totals.total) {
      status = 'partial';
    } else if (data.status) {
      status = data.status;
    }

    const updated = db.update('invoices', invoiceId, {
      clientId: data.clientId || existing.clientId,
      issueDate: data.issueDate || existing.issueDate,
      dueDate: data.dueDate || existing.dueDate,
      paymentTerms: data.paymentTerms !== undefined ? data.paymentTerms : existing.paymentTerms,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      subtotal: totals.subtotal,
      discount: totals.discount,
      vatAmount: totals.vatAmount,
      total: totals.total,
      balanceDue: balanceDue,
      status: status
    });

    // Remplacer les lignes de facture
    if (data.items) {
      const oldItems = db.find('invoice_items', { invoiceId });
      oldItems.forEach(oldItem => db.delete('invoice_items', oldItem.id));

      data.items.forEach(item => {
        const lineTotal = (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
        db.insert('invoice_items', {
          invoiceId: invoiceId,
          productId: item.productId || null,
          name: item.name,
          description: item.description || '',
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          discount: Number(item.discount) || 0,
          vatRate: item.vatRate !== undefined ? Number(item.vatRate) : (business.defaultVatRate || 18),
          lineTotal: lineTotal
        });
      });
    }

    return updated;
  }

  // Changer le statut d'une facture
  updateStatus(invoiceId, newStatus, note = '') {
    const invoice = db.getById('invoices', invoiceId);
    if (!invoice) throw new Error("Facture introuvable.");

    const oldStatus = invoice.status;
    if (oldStatus === newStatus) return invoice;

    const updated = db.update('invoices', invoiceId, { status: newStatus });

    db.insert('invoice_status_history', {
      invoiceId: invoice.id,
      oldStatus: oldStatus,
      newStatus: newStatus,
      note: note || `Statut modifié de ${oldStatus} à ${newStatus}`,
      timestamp: new Date().toISOString()
    });

    return updated;
  }

  // Dupliquer une facture
  duplicateInvoice(invoiceId) {
    const details = this.getInvoiceDetails(invoiceId);
    if (!details) throw new Error("Facture introuvable.");

    const business = auth.getBusiness();
    const newInvoiceNumber = db.getNextInvoiceNumber(business.id);

    return this.createInvoice({
      clientId: details.clientId,
      invoiceNumber: newInvoiceNumber,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      paymentTerms: details.paymentTerms,
      notes: details.notes,
      discount: details.discount,
      status: 'draft',
      items: details.items.map(i => ({
        productId: i.productId,
        name: i.name,
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
        vatRate: i.vatRate
      }))
    });
  }

  // Supprimer une facture
  deleteInvoice(invoiceId) {
    const invoice = db.getById('invoices', invoiceId);
    if (!invoice) return false;

    // Supprimer les lignes associées, paiements et historique
    const items = db.find('invoice_items', { invoiceId });
    items.forEach(i => db.delete('invoice_items', i.id));

    const payments = db.find('payments', { invoiceId });
    payments.forEach(p => db.delete('payments', p.id));

    const history = db.find('invoice_status_history', { invoiceId });
    history.forEach(h => db.delete('invoice_status_history', h.id));

    return db.delete('invoices', invoiceId);
  }
}

export const invoiceService = new InvoiceService();
