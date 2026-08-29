/**
 * PINAL_FACTURE — Moteur de Base de Données Relationnelle
 * Gestion de la persistance, intégrité référentielle, multi-tenant et données de démonstration.
 */

const DB_PREFIX = 'pinal_facture_db_';

export class Database {
  constructor() {
    this.tables = [
      'users',
      'businesses',
      'clients',
      'products',
      'invoices',
      'invoice_items',
      'payments',
      'invoice_status_history',
      'notifications',
      'settings'
    ];
    this.init();
  }

  init() {
    this.tables.forEach(table => {
      if (!localStorage.getItem(DB_PREFIX + table)) {
        localStorage.setItem(DB_PREFIX + table, JSON.stringify([]));
      }
    });

    // Initialiser les données de démonstration si premier lancement
    if (this.getAll('users').length === 0) {
      this.seedDemoData();
    }
  }

  // Obtenir tous les enregistrements d'une table
  getAll(tableName) {
    try {
      const data = localStorage.getItem(DB_PREFIX + tableName);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Erreur de lecture sur la table ${tableName}`, e);
      return [];
    }
  }

  // Obtenir un enregistrement par son ID
  getById(tableName, id) {
    const records = this.getAll(tableName);
    return records.find(r => r.id === id) || null;
  }

  // Filtrer les enregistrements avec un prédicat ou par businessId
  find(tableName, predicate) {
    const records = this.getAll(tableName);
    if (typeof predicate === 'function') {
      return records.filter(predicate);
    }
    if (typeof predicate === 'object') {
      return records.filter(record => {
        return Object.entries(predicate).every(([key, value]) => record[key] === value);
      });
    }
    return records;
  }

  // Insérer un enregistrement
  insert(tableName, item) {
    const records = this.getAll(tableName);
    const newItem = {
      ...item,
      id: item.id || this.generateId(tableName),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    records.push(newItem);
    this.saveTable(tableName, records);
    return newItem;
  }

  // Mettre à jour un enregistrement
  update(tableName, id, updates) {
    const records = this.getAll(tableName);
    const index = records.findIndex(r => r.id === id);
    if (index === -1) return null;

    records[index] = {
      ...records[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveTable(tableName, records);
    return records[index];
  }

  // Supprimer un enregistrement
  delete(tableName, id) {
    const records = this.getAll(tableName);
    const filtered = records.filter(r => r.id !== id);
    this.saveTable(tableName, filtered);
    return true;
  }

  // Sauvegarder la table
  saveTable(tableName, records) {
    localStorage.setItem(DB_PREFIX + tableName, JSON.stringify(records));
  }

  // Générer un ID unique
  generateId(prefix = 'id') {
    return `${prefix.substring(0, 3)}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  // Générateur sécurisé de numéros de facture séquentiels (ex: PF-2026-00001)
  getNextInvoiceNumber(businessId) {
    const business = this.getById('businesses', businessId);
    const prefix = business?.invoicePrefix || 'PF';
    const year = new Date().getFullYear();

    // Compter les factures existantes pour cette entreprise cette année
    const invoices = this.find('invoices', inv => inv.businessId === businessId);
    const count = invoices.length + 1;
    const padded = String(count).padStart(5, '0');

    return `${prefix}-${year}-${padded}`;
  }

  // Formatage FCFA standard : 125 000 FCFA
  formatCurrency(amount, currency = 'FCFA') {
    const num = Number(amount) || 0;
    const formatted = new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0
    }).format(num);
    return `${formatted} ${currency}`;
  }

  // Réinitialiser les données avec le jeu de démo
  resetToDemo() {
    this.tables.forEach(table => {
      localStorage.removeItem(DB_PREFIX + table);
    });
    this.init();
  }

  // Effacer tout le stockage
  clearAll() {
    this.tables.forEach(table => {
      localStorage.setItem(DB_PREFIX + table, JSON.stringify([]));
    });
  }

  // Exporter la base en JSON
  exportJSON() {
    const backup = {};
    this.tables.forEach(table => {
      backup[table] = this.getAll(table);
    });
    return JSON.stringify(backup, null, 2);
  }

  // Importer la base depuis un JSON
  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      this.tables.forEach(table => {
        if (Array.isArray(parsed[table])) {
          this.saveTable(table, parsed[table]);
        }
      });
      return true;
    } catch (e) {
      console.error("Erreur d'importation JSON:", e);
      return false;
    }
  }

  // Semer les données de démonstration réalistes africaines (Pinal Tech Dakar)
  seedDemoData() {
    // 1. Utilisateur démo
    const demoUser = this.insert('users', {
      id: 'usr_demo_pinal',
      email: 'contact@pinaltech.sn',
      passwordHash: 'demo1234',
      firstName: 'Amadou',
      lastName: 'Diallo',
      phone: '+221 77 123 45 67',
      role: 'owner'
    });

    // 2. Entreprise démo
    const demoBusiness = this.insert('businesses', {
      id: 'biz_demo_pinal',
      userId: demoUser.id,
      name: 'Pinal Tech Solutions',
      logoUrl: '',
      address: 'Avenue Cheikh Anta Diop, Dakar, Sénégal',
      phone: '+221 33 824 10 20',
      email: 'contact@pinaltech.sn',
      website: 'www.pinaltech.sn',
      nif: 'SN-DKR-2026-B-12345',
      currency: 'FCFA',
      defaultVatRate: 18,
      invoicePrefix: 'PF'
    });

    // 3. Clients de démonstration
    const clientAlpha = this.insert('clients', {
      id: 'cli_alpha_digital',
      businessId: demoBusiness.id,
      name: 'Alpha Digital SARL',
      type: 'entreprise',
      email: 'direction@alphadigital.sn',
      phone: '+221 78 456 78 90',
      address: 'Point E, Dakar',
      taxNumber: 'SN-DKR-2025-A-09876',
      notes: 'Client récurrent — Contrats de développement web'
    });

    const clientDakar = this.insert('clients', {
      id: 'cli_dakar_services',
      businessId: demoBusiness.id,
      name: 'Dakar Services & Logistique',
      type: 'entreprise',
      email: 'compta@dakarservices.com',
      phone: '+221 76 345 67 89',
      address: 'Zone Industrielle de Yoff, Dakar',
      taxNumber: 'SN-DKR-2024-C-54321',
      notes: 'Paiement régulier par Wave ou virement bancaire'
    });

    const clientSentech = this.insert('clients', {
      id: 'cli_sentech',
      businessId: demoBusiness.id,
      name: 'SenTech Solutions',
      type: 'entreprise',
      email: 'contact@sentech.sn',
      phone: '+221 77 654 32 10',
      address: 'Les Almadies, Dakar',
      taxNumber: 'SN-DKR-2026-S-77889',
      notes: 'Facturation mensuelle pour maintenance cloud'
    });

    const clientBaobab = this.insert('clients', {
      id: 'cli_baobab',
      businessId: demoBusiness.id,
      name: 'Baobab Consulting',
      type: 'particulier',
      email: 'moussa.ba@baobab.sn',
      phone: '+221 70 999 88 77',
      address: 'Mermoz, Dakar',
      taxNumber: '',
      notes: 'Client freelance stratégique'
    });

    // 4. Produits / Services au catalogue
    const prodDev = this.insert('products', {
      id: 'prd_dev_web',
      businessId: demoBusiness.id,
      name: 'Développement Site Web & Application',
      description: 'Conception sur mesure, architecture moderne et responsive design',
      unitPrice: 500000,
      unit: 'projet',
      vatRate: 18,
      sku: 'DEV-WEB-01'
    });

    const prodMaint = this.insert('products', {
      id: 'prd_maintenance',
      businessId: demoBusiness.id,
      name: 'Maintenance Informatique & Support',
      description: 'Support technique 24/7, mises à jour de sécurité et sauvegardes',
      unitPrice: 150000,
      unit: 'mois',
      vatRate: 18,
      sku: 'MAINT-01'
    });

    const prodMkt = this.insert('products', {
      id: 'prd_marketing',
      businessId: demoBusiness.id,
      name: 'Marketing Digital & Gestion Réseaux Sociaux',
      description: 'Stratégie de contenu, campagnes sponsorisées et reporting mensuel',
      unitPrice: 250000,
      unit: 'campagne',
      vatRate: 18,
      sku: 'MKT-01'
    });

    const prodConsult = this.insert('products', {
      id: 'prd_consulting',
      businessId: demoBusiness.id,
      name: 'Consultation & Audit Systèmes d’Information',
      description: 'Analyse d’architecture logicielle et recommandations de sécurité',
      unitPrice: 350000,
      unit: 'jour',
      vatRate: 18,
      sku: 'AUDIT-01'
    });

    // 5. Factures de démonstration
    // Facture 1 : Payée (Wave & Orange Money)
    const inv1 = this.insert('invoices', {
      id: 'inv_demo_001',
      businessId: demoBusiness.id,
      clientId: clientAlpha.id,
      invoiceNumber: 'PF-2026-00001',
      issueDate: '2026-08-01',
      dueDate: '2026-08-15',
      paymentTerms: 'Paiement à réception ou sous 15 jours par Wave ou virement',
      notes: 'Merci pour votre confiance continue !',
      subtotal: 500000,
      discount: 0,
      vatAmount: 90000,
      total: 590000,
      amountPaid: 590000,
      balanceDue: 0,
      status: 'paid',
      publicToken: 'tok_alpha_001_pinal'
    });

    this.insert('invoice_items', {
      invoiceId: inv1.id,
      productId: prodDev.id,
      name: 'Développement Site Web & Application',
      description: 'Portail client et passerelle de paiement Wave',
      quantity: 1,
      unitPrice: 500000,
      discount: 0,
      vatRate: 18,
      lineTotal: 500000
    });

    this.insert('payments', {
      id: 'pay_demo_001',
      invoiceId: inv1.id,
      businessId: demoBusiness.id,
      amount: 590000,
      date: '2026-08-05',
      paymentMethod: 'wave',
      reference: 'WV-SN-9988234',
      notes: 'Paiement intégral via Wave Business'
    });

    this.insert('invoice_status_history', {
      invoiceId: inv1.id,
      oldStatus: 'sent',
      newStatus: 'paid',
      note: 'Facture intégralement réglée par Wave',
      timestamp: '2026-08-05T14:30:00.000Z'
    });

    // Facture 2 : Envoyée (En attente de paiement)
    const inv2 = this.insert('invoices', {
      id: 'inv_demo_002',
      businessId: demoBusiness.id,
      clientId: clientDakar.id,
      invoiceNumber: 'PF-2026-00002',
      issueDate: '2026-08-18',
      dueDate: '2026-09-02',
      paymentTerms: 'Règlement par Orange Money ou Virement bancaire',
      notes: 'Prestation de maintenance mensuelle pour le parc informatique',
      subtotal: 300000,
      discount: 0,
      vatAmount: 54000,
      total: 354000,
      amountPaid: 0,
      balanceDue: 354000,
      status: 'sent',
      publicToken: 'tok_dakar_002_pinal'
    });

    this.insert('invoice_items', {
      invoiceId: inv2.id,
      productId: prodMaint.id,
      name: 'Maintenance Informatique & Support',
      description: 'Support mensuel d’août et infogérance serveurs',
      quantity: 2,
      unitPrice: 150000,
      discount: 0,
      vatRate: 18,
      lineTotal: 300000
    });

    // Facture 3 : Partiellement payée
    const inv3 = this.insert('invoices', {
      id: 'inv_demo_003',
      businessId: demoBusiness.id,
      clientId: clientSentech.id,
      invoiceNumber: 'PF-2026-00003',
      issueDate: '2026-08-10',
      dueDate: '2026-08-25',
      paymentTerms: 'Acompte 50% à la commande, solde à la livraison',
      notes: 'Mission d’audit de sécurité et stratégie marketing',
      subtotal: 600000,
      discount: 0,
      vatAmount: 108000,
      total: 708000,
      amountPaid: 354000,
      balanceDue: 354000,
      status: 'partial',
      publicToken: 'tok_sentech_003_pinal'
    });

    this.insert('invoice_items', {
      invoiceId: inv3.id,
      productId: prodConsult.id,
      name: 'Consultation & Audit Systèmes d’Information',
      description: 'Audit préliminaire d’infrastructure',
      quantity: 1,
      unitPrice: 350000,
      discount: 0,
      vatRate: 18,
      lineTotal: 350000
    });

    this.insert('invoice_items', {
      invoiceId: inv3.id,
      productId: prodMkt.id,
      name: 'Marketing Digital & Gestion Réseaux Sociaux',
      description: 'Campagne de lancement Q3',
      quantity: 1,
      unitPrice: 250000,
      discount: 0,
      vatRate: 18,
      lineTotal: 250000
    });

    this.insert('payments', {
      id: 'pay_demo_002',
      invoiceId: inv3.id,
      businessId: demoBusiness.id,
      amount: 354000,
      date: '2026-08-12',
      paymentMethod: 'orange_money',
      reference: 'OM-SN-441199',
      notes: 'Premier acompte de 50% reçu par Orange Money'
    });

    // Facture 4 : Brouillon
    const inv4 = this.insert('invoices', {
      id: 'inv_demo_004',
      businessId: demoBusiness.id,
      clientId: clientBaobab.id,
      invoiceNumber: 'PF-2026-00004',
      issueDate: '2026-08-25',
      dueDate: '2026-09-10',
      paymentTerms: 'Paiement en espèces ou Wave',
      notes: 'Facture en cours de finalisation',
      subtotal: 150000,
      discount: 0,
      vatAmount: 27000,
      total: 177000,
      amountPaid: 0,
      balanceDue: 177000,
      status: 'draft',
      publicToken: 'tok_baobab_004_pinal'
    });

    this.insert('invoice_items', {
      invoiceId: inv4.id,
      productId: prodMaint.id,
      name: 'Maintenance Informatique & Support',
      description: 'Assistance mensuelle équipement',
      quantity: 1,
      unitPrice: 150000,
      discount: 0,
      vatRate: 18,
      lineTotal: 150000
    });

    // 6. Notifications initiales
    this.insert('notifications', {
      businessId: demoBusiness.id,
      title: 'Bienvenue sur Pinal_Facture',
      message: 'Votre espace de facturation pour Pinal Tech Solutions est configuré.',
      type: 'info',
      isRead: false
    });

    this.insert('notifications', {
      businessId: demoBusiness.id,
      title: 'Paiement Wave reçu',
      message: 'Un paiement de 590 000 FCFA a été enregistré pour la facture PF-2026-00001.',
      type: 'success',
      isRead: false
    });
  }
}

export const db = new Database();
