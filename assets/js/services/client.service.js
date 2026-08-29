/**
 * PINAL_FACTURE — Service CRM & Gestion des Clients
 */

import { db } from '../db.js';
import { auth } from '../auth.js';

export class ClientService {
  // Obtenir tous les clients de l'entreprise
  getClients(search = '') {
    const business = auth.getBusiness();
    if (!business) return [];

    let clients = db.find('clients', c => c.businessId === business.id);

    if (search) {
      const q = search.toLowerCase();
      clients = clients.filter(c => 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q))
      );
    }

    // Calculer les métriques financières pour chaque client
    return clients.map(client => {
      const stats = this.getClientStats(client.id);
      return {
        ...client,
        ...stats
      };
    }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  // Calculer les statistiques financières d'un client
  getClientStats(clientId) {
    const invoices = db.find('invoices', inv => inv.clientId === clientId);
    const invoiceCount = invoices.length;
    
    let totalInvoiced = 0;
    let totalPaid = 0;
    let balanceDue = 0;

    invoices.forEach(inv => {
      totalInvoiced += (Number(inv.total) || 0);
      totalPaid += (Number(inv.amountPaid) || 0);
      balanceDue += (Number(inv.balanceDue) || 0);
    });

    return {
      invoiceCount,
      totalInvoiced,
      totalPaid,
      balanceDue
    };
  }

  // Récupérer la fiche 360° d'un client
  getClientDetails(clientId) {
    const client = db.getById('clients', clientId);
    if (!client) return null;

    const stats = this.getClientStats(clientId);
    const invoices = db.find('invoices', inv => inv.clientId === clientId)
      .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

    return {
      ...client,
      ...stats,
      invoices
    };
  }

  // Créer un client
  createClient(data) {
    const business = auth.getBusiness();
    if (!business) throw new Error("Aucune entreprise connectée.");

    if (!data.name || !data.name.trim()) {
      throw new Error("Le nom du client est obligatoire.");
    }

    const client = db.insert('clients', {
      businessId: business.id,
      name: data.name.trim(),
      type: data.type || 'entreprise', // 'particulier' ou 'entreprise'
      email: data.email ? data.email.trim().toLowerCase() : '',
      phone: data.phone ? data.phone.trim() : '',
      address: data.address ? data.address.trim() : '',
      taxNumber: data.taxNumber ? data.taxNumber.trim() : '',
      notes: data.notes || ''
    });

    // Notification
    db.insert('notifications', {
      businessId: business.id,
      title: 'Nouveau client ajouté',
      message: `Le client ${client.name} a été enregistré avec succès.`,
      type: 'info',
      isRead: false
    });

    return client;
  }

  // Mettre à jour un client
  updateClient(clientId, data) {
    const client = db.getById('clients', clientId);
    if (!client) throw new Error("Client introuvable.");

    return db.update('clients', clientId, {
      name: data.name !== undefined ? data.name.trim() : client.name,
      type: data.type || client.type,
      email: data.email !== undefined ? data.email.trim().toLowerCase() : client.email,
      phone: data.phone !== undefined ? data.phone.trim() : client.phone,
      address: data.address !== undefined ? data.address.trim() : client.address,
      taxNumber: data.taxNumber !== undefined ? data.taxNumber.trim() : client.taxNumber,
      notes: data.notes !== undefined ? data.notes : client.notes
    });
  }

  // Supprimer un client
  deleteClient(clientId) {
    // Vérifier si des factures sont rattachées
    const invoices = db.find('invoices', { clientId });
    if (invoices.length > 0) {
      throw new Error(`Impossible de supprimer ce client : il est rattaché à ${invoices.length} facture(s).`);
    }
    return db.delete('clients', clientId);
  }
}

export const clientService = new ClientService();
