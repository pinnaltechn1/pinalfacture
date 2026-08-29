/**
 * PINAL_FACTURE — Standalone Bundle (Compatible direct double-clic file:// et serveur HTTP)
 */

(function() {
  'use strict';

  // ==========================================
  // 1. BASE DE DONNÉES RELATIONNELLE & DEMO
  // ==========================================
  const DB_PREFIX = 'pinal_facture_db_';

  class Database {
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

      if (this.getAll('users').length === 0) {
        this.seedDemoData();
      }
    }

    getAll(tableName) {
      try {
        const data = localStorage.getItem(DB_PREFIX + tableName);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        console.error(`Erreur de lecture sur la table ${tableName}`, e);
        return [];
      }
    }

    getById(tableName, id) {
      const records = this.getAll(tableName);
      return records.find(r => r.id === id) || null;
    }

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

    delete(tableName, id) {
      const records = this.getAll(tableName);
      const filtered = records.filter(r => r.id !== id);
      this.saveTable(tableName, filtered);
      return true;
    }

    saveTable(tableName, records) {
      localStorage.setItem(DB_PREFIX + tableName, JSON.stringify(records));
    }

    generateId(prefix = 'id') {
      return `${prefix.substring(0, 3)}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    getNextInvoiceNumber(businessId) {
      const business = this.getById('businesses', businessId);
      const prefix = business?.invoicePrefix || 'PF';
      const year = new Date().getFullYear();
      const invoices = this.find('invoices', inv => inv.businessId === businessId);
      const count = invoices.length + 1;
      const padded = String(count).padStart(5, '0');
      return `${prefix}-${year}-${padded}`;
    }

    formatCurrency(amount, currency = 'FCFA') {
      const num = Number(amount) || 0;
      const formatted = new Intl.NumberFormat('fr-FR', {
        maximumFractionDigits: 0
      }).format(num);
      return currency ? `${formatted} ${currency}` : formatted;
    }

    resetToDemo() {
      this.tables.forEach(table => {
        localStorage.removeItem(DB_PREFIX + table);
      });
      this.init();
    }

    exportJSON() {
      const backup = {};
      this.tables.forEach(table => {
        backup[table] = this.getAll(table);
      });
      return JSON.stringify(backup, null, 2);
    }

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

    seedDemoData() {
      const demoUser = this.insert('users', {
        id: 'usr_demo_pinal',
        email: 'contact@pinaltech.sn',
        passwordHash: 'demo1234',
        firstName: 'Amadou',
        lastName: 'Diallo',
        phone: '+221 77 123 45 67',
        role: 'owner'
      });

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

  const db = new Database();

  // ==========================================
  // 2. AUTHENTIFICATION & SESSIONS
  // ==========================================
  const SESSION_KEY = 'pinal_facture_session';

  class AuthService {
    constructor() {
      this.currentUser = null;
      this.currentBusiness = null;
      this.listeners = [];
      this.restoreSession();
    }

    restoreSession() {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (sessionData) {
        try {
          const { userId, businessId } = JSON.parse(sessionData);
          const user = db.getById('users', userId);
          const business = db.getById('businesses', businessId);
          if (user && business) {
            this.currentUser = user;
            this.currentBusiness = business;
          } else {
            this.loadDemoAccount();
          }
        } catch (e) {
          this.loadDemoAccount();
        }
      } else {
        this.loadDemoAccount();
      }
    }

    setSession(user, business) {
      this.currentUser = user;
      this.currentBusiness = business;
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        userId: user.id,
        businessId: business.id
      }));
      this.notify();
    }

    isAuthenticated() {
      return !!this.currentUser && !!this.currentBusiness;
    }

    getUser() { return this.currentUser; }
    getBusiness() { return this.currentBusiness; }

    signup({ firstName, lastName, email, phone, password }) {
      const existing = db.find('users', { email: email.trim().toLowerCase() });
      if (existing.length > 0) {
        throw new Error('Un compte existe déjà avec cette adresse email.');
      }

      const newUser = db.insert('users', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : '',
        passwordHash: password,
        role: 'owner'
      });

      const defaultBusiness = db.insert('businesses', {
        userId: newUser.id,
        name: `${newUser.firstName} ${newUser.lastName} Entreprise`,
        logoUrl: '',
        address: 'Dakar, Sénégal',
        phone: newUser.phone || '+221',
        email: newUser.email,
        website: '',
        nif: '',
        currency: 'FCFA',
        defaultVatRate: 18,
        invoicePrefix: 'PF'
      });

      this.setSession(newUser, defaultBusiness);
      return { user: newUser, business: defaultBusiness };
    }

    login(email, password) {
      const cleanEmail = email.trim().toLowerCase();
      const users = db.find('users', { email: cleanEmail });
      if (users.length === 0) {
        throw new Error('Aucun compte trouvé avec cette adresse email.');
      }

      const user = users[0];
      if (user.passwordHash !== password) {
        throw new Error('Mot de passe incorrect.');
      }

      const businesses = db.find('businesses', { userId: user.id });
      const business = businesses[0] || db.insert('businesses', {
        userId: user.id,
        name: `${user.firstName} Entreprise`,
        currency: 'FCFA',
        defaultVatRate: 18,
        invoicePrefix: 'PF'
      });

      this.setSession(user, business);
      return { user, business };
    }

    logout() {
      this.currentUser = null;
      this.currentBusiness = null;
      localStorage.removeItem(SESSION_KEY);
      this.notify();
    }

    updateProfile(data) {
      if (!this.currentUser) return null;
      const updated = db.update('users', this.currentUser.id, data);
      this.currentUser = updated;
      this.notify();
      return updated;
    }

    updateBusiness(data) {
      if (!this.currentBusiness) return null;
      const updated = db.update('businesses', this.currentBusiness.id, data);
      this.currentBusiness = updated;
      this.notify();
      return updated;
    }

    resetPassword(email) {
      const cleanEmail = email.trim().toLowerCase();
      const users = db.find('users', { email: cleanEmail });
      if (users.length === 0) throw new Error('Adresse email inconnue.');
      return { success: true, message: 'Un lien de réinitialisation sécurisé a été envoyé.' };
    }

    loadDemoAccount() {
      let demoUser = db.getById('users', 'usr_demo_pinal');
      let demoBiz = db.getById('businesses', 'biz_demo_pinal');
      if (!demoUser || !demoBiz) {
        db.seedDemoData();
        demoUser = db.getById('users', 'usr_demo_pinal');
        demoBiz = db.getById('businesses', 'biz_demo_pinal');
      }
      if (demoUser && demoBiz) {
        this.setSession(demoUser, demoBiz);
      }
    }

    subscribe(callback) {
      this.listeners.push(callback);
      return () => {
        this.listeners = this.listeners.filter(cb => cb !== callback);
      };
    }

    notify() {
      this.listeners.forEach(cb => cb({ user: this.currentUser, business: this.currentBusiness }));
    }
  }

  const auth = new AuthService();

  // ==========================================
  // 3. TOASTS & NOTIFICATIONS
  // ==========================================
  class NotificationService {
    showToast(message, type = 'info', duration = 3500) {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast ${type}`;

      let iconClass = 'fa-solid fa-circle-info text-blue-500';
      if (type === 'success') iconClass = 'fa-solid fa-circle-check text-emerald-500';
      if (type === 'error') iconClass = 'fa-solid fa-circle-exclamation text-red-500';
      if (type === 'warning') iconClass = 'fa-solid fa-triangle-exclamation text-amber-500';

      toast.innerHTML = `
        <i class="${iconClass}" style="margin-top: 2px;"></i>
        <div class="flex-1 font-medium">${message}</div>
        <button type="button" class="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer" style="padding: 0 4px;" aria-label="Fermer">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;

      toast.querySelector('button').addEventListener('click', () => toast.remove());
      container.appendChild(toast);

      setTimeout(() => {
        if (toast.parentElement) {
          toast.style.opacity = '0';
          toast.style.transform = 'translateX(100%)';
          toast.style.transition = 'all 0.25s ease';
          setTimeout(() => toast.remove(), 250);
        }
      }, duration);
    }

    success(msg) { this.showToast(msg, 'success'); }
    error(msg) { this.showToast(msg, 'error'); }
    warning(msg) { this.showToast(msg, 'warning'); }
    info(msg) { this.showToast(msg, 'info'); }

    getNotifications() {
      const business = auth.getBusiness();
      if (!business) return [];
      return db.find('notifications', n => n.businessId === business.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    getUnreadCount() {
      return this.getNotifications().filter(n => !n.isRead).length;
    }

    markAllAsRead() {
      const business = auth.getBusiness();
      if (!business) return;
      const list = db.find('notifications', n => n.businessId === business.id && !n.isRead);
      list.forEach(n => db.update('notifications', n.id, { isRead: true }));
    }
  }

  const notifications = new NotificationService();

  // ==========================================
  // 4. SERVICES MÉTIERS (FACTURES, CRM, PAIEMENTS)
  // ==========================================
  const PAYMENT_METHODS = [
    { id: 'wave', label: 'Wave', icon: 'fa-solid fa-water', class: 'method-wave' },
    { id: 'orange_money', label: 'Orange Money', icon: 'fa-solid fa-mobile-screen', class: 'method-om' },
    { id: 'cash', label: 'Espèces', icon: 'fa-solid fa-money-bill-wave', class: 'method-cash' },
    { id: 'bank_transfer', label: 'Virement bancaire', icon: 'fa-solid fa-building-columns', class: 'method-bank' },
    { id: 'card', label: 'Carte bancaire', icon: 'fa-solid fa-credit-card', class: 'method-card' },
    { id: 'other', label: 'Autre moyen', icon: 'fa-solid fa-receipt', class: 'method-card' }
  ];

  class InvoiceService {
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
      const adjustedVat = discountPercent > 0 ? discountedSubtotal * (defaultVatRate / 100) : totalVat;
      const total = Math.round(discountedSubtotal + adjustedVat);

      return {
        subtotal: Math.round(subtotal),
        discount: Math.round(globalDiscountAmount),
        vatAmount: Math.round(adjustedVat),
        total: total
      };
    }

    getInvoices(filters = {}) {
      const business = auth.getBusiness();
      if (!business) return [];
      let invoices = db.find('invoices', inv => inv.businessId === business.id);

      if (filters.status && filters.status !== 'all') {
        invoices = invoices.filter(inv => inv.status === filters.status);
      }

      if (filters.search) {
        const q = filters.search.toLowerCase();
        invoices = invoices.filter(inv => {
          const client = db.getById('clients', inv.clientId);
          return inv.invoiceNumber.toLowerCase().includes(q) ||
                 (client && client.name.toLowerCase().includes(q));
        });
      }

      return invoices.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
    }

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

    getPublicInvoice(publicToken) {
      const invoices = db.find('invoices', { publicToken });
      if (invoices.length === 0) return null;
      return this.getInvoiceDetails(invoices[0].id);
    }

    createInvoice(data) {
      const business = auth.getBusiness();
      if (!business) throw new Error("Aucune entreprise active.");

      const items = data.items || [];
      if (items.length === 0) throw new Error("Veuillez ajouter au moins un produit ou service.");
      if (!data.clientId) throw new Error("Veuillez sélectionner ou créer un client.");

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
        status: data.status || 'sent',
        publicToken: publicToken
      });

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

      db.insert('invoice_status_history', {
        invoiceId: invoice.id,
        oldStatus: null,
        newStatus: invoice.status,
        note: 'Facture créée avec succès',
        timestamp: new Date().toISOString()
      });

      return invoice;
    }

    updateInvoice(invoiceId, data) {
      const business = auth.getBusiness();
      const existing = db.getById('invoices', invoiceId);
      if (!existing) throw new Error("Facture introuvable.");

      const items = data.items || [];
      const totals = this.calculateTotals(items, data.discount, business.defaultVatRate || 18);
      const balanceDue = Math.max(0, totals.total - (existing.amountPaid || 0));

      let status = existing.status;
      if (existing.amountPaid >= totals.total && totals.total > 0) status = 'paid';
      else if (existing.amountPaid > 0 && existing.amountPaid < totals.total) status = 'partial';
      else if (data.status) status = data.status;

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

    deleteInvoice(invoiceId) {
      const items = db.find('invoice_items', { invoiceId });
      items.forEach(i => db.delete('invoice_items', i.id));
      const payments = db.find('payments', { invoiceId });
      payments.forEach(p => db.delete('payments', p.id));
      const history = db.find('invoice_status_history', { invoiceId });
      history.forEach(h => db.delete('invoice_status_history', h.id));
      return db.delete('invoices', invoiceId);
    }
  }

  const invoiceService = new InvoiceService();

  class ClientService {
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

      return clients.map(client => {
        const invoices = db.find('invoices', inv => inv.clientId === client.id);
        let totalInvoiced = 0;
        let totalPaid = 0;
        let balanceDue = 0;

        invoices.forEach(inv => {
          totalInvoiced += (Number(inv.total) || 0);
          totalPaid += (Number(inv.amountPaid) || 0);
          balanceDue += (Number(inv.balanceDue) || 0);
        });

        return {
          ...client,
          invoiceCount: invoices.length,
          totalInvoiced,
          totalPaid,
          balanceDue
        };
      }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    getClientDetails(clientId) {
      const client = db.getById('clients', clientId);
      if (!client) return null;
      const clientsList = this.getClients();
      const stats = clientsList.find(c => c.id === clientId) || {};
      const invoices = db.find('invoices', inv => inv.clientId === clientId)
        .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

      return {
        ...client,
        ...stats,
        invoices
      };
    }

    createClient(data) {
      const business = auth.getBusiness();
      if (!business) throw new Error("Aucune entreprise connectée.");
      if (!data.name || !data.name.trim()) throw new Error("Le nom du client est obligatoire.");

      return db.insert('clients', {
        businessId: business.id,
        name: data.name.trim(),
        type: data.type || 'entreprise',
        email: data.email ? data.email.trim().toLowerCase() : '',
        phone: data.phone ? data.phone.trim() : '',
        address: data.address ? data.address.trim() : '',
        taxNumber: data.taxNumber ? data.taxNumber.trim() : '',
        notes: data.notes || ''
      });
    }

    updateClient(clientId, data) {
      const client = db.getById('clients', clientId);
      if (!client) throw new Error("Client introuvable.");
      return db.update('clients', clientId, data);
    }

    deleteClient(clientId) {
      const invoices = db.find('invoices', { clientId });
      if (invoices.length > 0) {
        throw new Error(`Impossible de supprimer : ${invoices.length} facture(s) rattachée(s).`);
      }
      return db.delete('clients', clientId);
    }
  }

  const clientService = new ClientService();

  class ProductService {
    getProducts(search = '') {
      const business = auth.getBusiness();
      if (!business) return [];
      let products = db.find('products', p => p.businessId === business.id);

      if (search) {
        const q = search.toLowerCase();
        products = products.filter(p => 
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q))
        );
      }

      return products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    getProductById(productId) {
      return db.getById('products', productId);
    }

    createProduct(data) {
      const business = auth.getBusiness();
      if (!business) throw new Error("Aucune entreprise connectée.");
      if (!data.name || !data.name.trim()) throw new Error("Le nom est obligatoire.");

      return db.insert('products', {
        businessId: business.id,
        name: data.name.trim(),
        description: data.description || '',
        unitPrice: Number(data.unitPrice) || 0,
        unit: data.unit || 'projet',
        vatRate: data.vatRate !== undefined ? Number(data.vatRate) : (business.defaultVatRate || 18),
        sku: data.sku ? data.sku.trim().toUpperCase() : ''
      });
    }

    updateProduct(productId, data) {
      return db.update('products', productId, data);
    }

    deleteProduct(productId) {
      return db.delete('products', productId);
    }
  }

  const productService = new ProductService();

  class PaymentService {
    getPayments(filters = {}) {
      const business = auth.getBusiness();
      if (!business) return [];
      let payments = db.find('payments', p => p.businessId === business.id);

      if (filters.method && filters.method !== 'all') {
        payments = payments.filter(p => p.paymentMethod === filters.method);
      }

      return payments.map(p => {
        const invoice = db.getById('invoices', p.invoiceId);
        const client = invoice ? db.getById('clients', invoice.clientId) : null;
        const methodInfo = PAYMENT_METHODS.find(m => m.id === p.paymentMethod) || PAYMENT_METHODS[0];

        return { ...p, invoice, client, methodInfo };
      }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    recordPayment({ invoiceId, amount, date, paymentMethod, reference, notes }) {
      const business = auth.getBusiness();
      if (!business) throw new Error("Aucune entreprise connectée.");

      const invoice = db.getById('invoices', invoiceId);
      if (!invoice) throw new Error("Facture introuvable.");

      const paymentAmount = Number(amount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) throw new Error("Montant invalide.");

      const currentPaid = Number(invoice.amountPaid) || 0;
      const invoiceTotal = Number(invoice.total) || 0;
      const newTotalPaid = currentPaid + paymentAmount;
      const newBalanceDue = Math.max(0, invoiceTotal - newTotalPaid);

      let newStatus = invoice.status;
      if (newTotalPaid >= invoiceTotal) newStatus = 'paid';
      else if (newTotalPaid > 0) newStatus = 'partial';

      const payment = db.insert('payments', {
        invoiceId: invoice.id,
        businessId: business.id,
        amount: paymentAmount,
        date: date || new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethod || 'wave',
        reference: reference ? reference.trim() : `PAY-${Date.now().toString().slice(-6)}`,
        notes: notes || ''
      });

      db.update('invoices', invoice.id, {
        amountPaid: newTotalPaid,
        balanceDue: newBalanceDue,
        status: newStatus
      });

      db.insert('invoice_status_history', {
        invoiceId: invoice.id,
        oldStatus: invoice.status,
        newStatus: newStatus,
        note: `Paiement de ${db.formatCurrency(paymentAmount, business.currency)} reçu via ${paymentMethod}`,
        timestamp: new Date().toISOString()
      });

      return payment;
    }

    deletePayment(paymentId) {
      const payment = db.getById('payments', paymentId);
      if (!payment) return false;

      const invoice = db.getById('invoices', payment.invoiceId);
      if (invoice) {
        const remaining = db.find('payments', p => p.invoiceId === invoice.id && p.id !== paymentId);
        const totalPaid = remaining.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const balanceDue = Math.max(0, (Number(invoice.total) || 0) - totalPaid);

        let status = 'draft';
        if (totalPaid >= invoice.total && invoice.total > 0) status = 'paid';
        else if (totalPaid > 0) status = 'partial';
        else if (invoice.status === 'paid' || invoice.status === 'partial') status = 'sent';

        db.update('invoices', invoice.id, { amountPaid: totalPaid, balanceDue, status });
      }

      return db.delete('payments', paymentId);
    }
  }

  const paymentService = new PaymentService();

  // ==========================================
  // 5. MOTEUR DE RENDU PDF & IMPRESSION
  // ==========================================
  class PDFService {
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
              <div style="font-weight: 600; color: #0F172A; font-size: 14px;">${item.name || 'Prestation'}</div>
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
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; border-bottom: 2px solid #F1F5F9; padding-bottom: 20px;">
            <div>
              <h1 style="font-size: 22px; font-weight: 800; color: #0F766E; margin: 0; text-transform: uppercase;">${business.name || 'Entreprise'}</h1>
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
              <div style="font-size: 12px; color: #64748B; margin-top: 4px;">Émission : <strong>${inv.issueDate}</strong></div>
              <div style="font-size: 12px; color: #DC2626; margin-top: 2px;">Échéance : <strong>${inv.dueDate}</strong></div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; background: #F8FAFC; padding: 16px 20px; border-radius: 8px; border: 1px solid #E2E8F0;">
            <div>
              <div style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; margin-bottom: 6px;">ÉMETTEUR :</div>
              <div style="font-size: 14px; font-weight: 700; color: #0F172A;">${business.name || 'Entreprise'}</div>
              <div style="font-size: 13px; color: #475569;">${business.address || ''}</div>
              <div style="font-size: 13px; color: #475569;">${business.phone || ''}</div>
              <div style="font-size: 13px; color: #475569;">${business.email || ''}</div>
            </div>

            <div>
              <div style="font-size: 11px; font-weight: 800; color: #0F766E; text-transform: uppercase; margin-bottom: 6px;">FACTURÉ À :</div>
              <div style="font-size: 14px; font-weight: 700; color: #0F172A;">${client.name || 'Client'}</div>
              <div style="font-size: 13px; color: #475569;">${client.address || ''}</div>
              <div style="font-size: 13px; color: #475569;">${client.phone || ''}</div>
              <div style="font-size: 13px; color: #475569;">${client.email || ''}</div>
              ${client.taxNumber ? `<div style="font-size: 12px; color: #64748B; margin-top: 2px;">NIF: ${client.taxNumber}</div>` : ''}
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background: #0F766E; color: #FFFFFF;">
                <th style="padding: 10px; font-size: 12px; font-weight: 700; text-align: center; width: 40px;">#</th>
                <th style="padding: 10px; font-size: 12px; font-weight: 700; text-align: left;">Désignation</th>
                <th style="padding: 10px; font-size: 12px; font-weight: 700; text-align: center; width: 60px;">Qté</th>
                <th style="padding: 10px; font-size: 12px; font-weight: 700; text-align: right; width: 110px;">Prix Unit. HT</th>
                <th style="padding: 10px; font-size: 12px; font-weight: 700; text-align: center; width: 60px;">TVA</th>
                <th style="padding: 10px; font-size: 12px; font-weight: 700; text-align: right; width: 120px;">Total HT</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px;">
            <div style="max-width: 50%;">
              ${inv.paymentTerms ? `
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 2px;">Modalités :</div>
                  <div style="font-size: 12px; color: #64748B;">${inv.paymentTerms}</div>
                </div>
              ` : ''}
              
              ${payments.length > 0 ? `
                <div style="margin-top: 10px; padding: 10px; background: #F0FDF4; border-radius: 6px; border: 1px solid #BBF7D0;">
                  <div style="font-size: 11px; font-weight: 800; color: #065F46; text-transform: uppercase; margin-bottom: 4px;">Règlements reçus :</div>
                  ${paymentsRows}
                </div>
              ` : ''}

              ${inv.notes ? `
                <div style="margin-top: 12px;">
                  <div style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 2px;">Remarques :</div>
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
                  <span>Remise :</span>
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

          <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; text-align: center; font-size: 11px; color: #94A3B8; margin-top: 24px;">
            <p style="margin: 0;">${business.name || 'Entreprise'} — Facture générée via <strong>Pinal_Facture</strong></p>
          </div>
        </div>
      `;
    }

    async downloadPDF(inv, el) {
      if (window.html2pdf) {
        try {
          await window.html2pdf().set({
            margin: 8,
            filename: `Facture_${inv.invoiceNumber || 'PF'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          }).from(el).save();
          return;
        } catch (e) {
          console.warn("html2pdf failed, fallback print", e);
        }
      }
      window.print();
    }
  }

  const pdfService = new PDFService();

  // ==========================================
  // 6. ROUTEUR ET RENDU DES VUES
  // ==========================================
  const mainContent = document.getElementById('main-content');

  function navigateTo(hash) {
    window.location.hash = hash;
  }

  function renderLanding() {
    mainContent.innerHTML = `
      <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div class="max-w-7xl px-4 py-3 flex items-center justify-between mx-auto">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center text-white font-black text-xl shadow-md" style="background: linear-gradient(135deg, #0F766E 0%, #134E4A 100%);">
              P
            </div>
            <div>
              <span class="font-extrabold text-xl tracking-tight text-slate-900">Pinal<span class="text-primary-700">_Facture</span></span>
              <span class="hidden sm:inline-block ml-2 text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">SaaS Afrique</span>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <a href="#/dashboard" class="btn btn-primary btn-sm">
              <i class="fa-solid fa-gauge-high"></i> Mon Espace
            </a>
          </div>
        </div>
      </header>

      <section class="hero-gradient pt-12 pb-16 px-4">
        <div class="max-w-5xl text-center mx-auto">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-6">
            <i class="fa-solid fa-bolt text-amber-500"></i> Le logiciel SaaS de facturation n°1 pour l'Afrique francophone
          </div>
          <h1 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
            Facturez simplement. <br class="hidden sm:block">
            <span style="color: #0F766E;">Gérez votre activité</span> intelligemment.
          </h1>
          <p class="text-base sm:text-lg text-slate-600 max-w-3xl mb-8 mx-auto leading-relaxed">
            Créez des factures professionnelles en <strong>FCFA</strong>, appliquez la <strong>TVA 18%</strong>, et suivez vos encaissements <strong>Wave & Orange Money</strong>.
          </p>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <a href="#/invoices/new" class="btn btn-primary btn-lg w-full sm:w-auto shadow-glow">
              <i class="fa-solid fa-file-invoice"></i> Créer ma première facture
            </a>
            <a href="#/dashboard" class="btn btn-secondary btn-lg w-full sm:w-auto">
              <i class="fa-solid fa-play text-primary-700"></i> Accéder au Dashboard
            </a>
          </div>
        </div>
      </section>

      <section class="py-12 bg-white border-y border-slate-200 px-4">
        <div class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="card p-6 card-hover">
            <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl mb-4 font-bold">
              <i class="fa-solid fa-coins"></i>
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-2">100% FCFA & TVA 18%</h3>
            <p class="text-slate-600 text-sm">Calculs exacts du Hors Taxe (HT), de la TVA et du TTC. Formatage naturel sans symboles inadaptés.</p>
          </div>

          <div class="card p-6 card-hover">
            <div class="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-xl mb-4 font-bold">
              <i class="fa-solid fa-mobile-screen-button"></i>
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-2">Mobile First & Rapide</h3>
            <p class="text-slate-600 text-sm">Créez et envoyez vos factures directement depuis votre smartphone sur le terrain.</p>
          </div>

          <div class="card p-6 card-hover">
            <div class="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl mb-4 font-bold">
              <i class="fa-solid fa-hand-holding-dollar"></i>
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-2">Suivi Wave & Orange Money</h3>
            <p class="text-slate-600 text-sm">Enregistrez les acomptes partiels ou règlements et visualisez immédiatement le solde restant dû.</p>
          </div>
        </div>
      </section>
    `;
  }

  function renderShell(currentPath, renderViewFn) {
    const business = auth.getBusiness();
    const user = auth.getUser();
    const isCurrent = (route) => currentPath.startsWith(route) ? 'active' : '';

    mainContent.innerHTML = `
      <div class="flex h-screen overflow-hidden bg-slate-50">
        <aside class="desktop-sidebar hidden md:flex flex-col justify-between">
          <div>
            <div class="p-6 border-b border-slate-200 flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-primary-700 text-white flex items-center justify-center font-black text-lg shadow-md" style="background: linear-gradient(135deg, #0F766E 0%, #134E4A 100%);">
                P
              </div>
              <div>
                <span class="font-extrabold text-lg text-slate-900 tracking-tight">Pinal<span class="text-primary-700">_Facture</span></span>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SaaS Facturation</div>
              </div>
            </div>

            <nav class="p-4 space-y-1">
              <a href="#/dashboard" class="nav-link ${isCurrent('/dashboard')}">
                <i class="fa-solid fa-gauge-high w-5 text-center"></i> Dashboard
              </a>
              <a href="#/invoices" class="nav-link ${isCurrent('/invoices')}">
                <i class="fa-solid fa-file-invoice w-5 text-center"></i> Factures
              </a>
              <a href="#/clients" class="nav-link ${isCurrent('/clients')}">
                <i class="fa-solid fa-users w-5 text-center"></i> Clients
              </a>
              <a href="#/products" class="nav-link ${isCurrent('/products')}">
                <i class="fa-solid fa-boxes-stacked w-5 text-center"></i> Produits & Services
              </a>
              <a href="#/payments" class="nav-link ${isCurrent('/payments')}">
                <i class="fa-solid fa-receipt w-5 text-center"></i> Paiements
              </a>
              <a href="#/settings" class="nav-link ${isCurrent('/settings')}">
                <i class="fa-solid fa-gear w-5 text-center"></i> Paramètres
              </a>
            </nav>
          </div>

          <div class="p-4 border-t border-slate-200">
            <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-3 flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-800 font-bold flex items-center justify-center text-xs">
                ${(business?.name || 'P').charAt(0).toUpperCase()}
              </div>
              <div class="flex-1 overflow-hidden">
                <div class="font-bold text-xs text-slate-900 truncate">${business?.name || 'Entreprise'}</div>
                <div class="text-[11px] text-slate-400 truncate">${business?.currency || 'FCFA'} • NIF: ${business?.nif || '-'}</div>
              </div>
            </div>
          </div>
        </aside>

        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header class="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between no-print shadow-sm z-20">
            <div class="flex items-center gap-2 md:hidden">
              <div class="w-8 h-8 rounded-lg bg-primary-700 text-white flex items-center justify-center font-bold text-sm">P</div>
              <span class="font-bold text-base text-slate-900">Pinal<span class="text-primary-700">_Facture</span></span>
            </div>

            <div class="hidden md:flex items-center gap-2">
              <span class="brand-badge text-xs">
                <i class="fa-solid fa-circle-check text-emerald-600"></i> ${business?.name || 'Entreprise'}
              </span>
              <span class="text-xs text-slate-400 font-semibold">• Devise: ${business?.currency || 'FCFA'} • TVA: ${business?.defaultVatRate || 18}%</span>
            </div>

            <div class="flex items-center gap-3">
              <a href="#/invoices/new" class="btn btn-primary btn-sm shadow-sm">
                <i class="fa-solid fa-plus"></i> Nouvelle facture
              </a>
            </div>
          </header>

          <main class="flex-1 overflow-y-auto pb-20 md:pb-8" id="view-content"></main>
        </div>

        <nav class="mobile-nav md:hidden no-print">
          <a href="#/dashboard" class="mobile-nav-item ${isCurrent('/dashboard')}">
            <i class="fa-solid fa-gauge-high"></i>
            <span>Accueil</span>
          </a>
          <a href="#/invoices" class="mobile-nav-item ${isCurrent('/invoices')}">
            <i class="fa-solid fa-file-invoice"></i>
            <span>Factures</span>
          </a>
          <a href="#/invoices/new" class="mobile-nav-fab" aria-label="Nouvelle facture">
            <i class="fa-solid fa-plus"></i>
          </a>
          <a href="#/clients" class="mobile-nav-item ${isCurrent('/clients')}">
            <i class="fa-solid fa-users"></i>
            <span>Clients</span>
          </a>
          <a href="#/settings" class="mobile-nav-item ${isCurrent('/settings')}">
            <i class="fa-solid fa-gear"></i>
            <span>Options</span>
          </a>
        </nav>
      </div>
    `;

    renderViewFn(document.getElementById('view-content'));
  }

  function renderDashboard(container) {
    const business = auth.getBusiness();
    const currency = business?.currency || 'FCFA';
    const invoices = invoiceService.getInvoices();
    const clients = clientService.getClients();

    let totalRevenue = 0, totalPaid = 0, totalPending = 0;
    let draftCount = 0, sentCount = 0, paidCount = 0;

    invoices.forEach(inv => {
      totalRevenue += (Number(inv.total) || 0);
      totalPaid += (Number(inv.amountPaid) || 0);
      totalPending += (Number(inv.balanceDue) || 0);
      if (inv.status === 'paid') paidCount++;
      else if (inv.status === 'draft') draftCount++;
      else sentCount++;
    });

    container.innerHTML = `
      <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Tableau de bord</h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">Aperçu financier en temps réel de <strong>${business?.name || 'votre entreprise'}</strong></p>
          </div>
          <div class="flex items-center gap-2">
            <a href="#/invoices/new" class="btn btn-primary btn-sm shadow-md">
              <i class="fa-solid fa-plus"></i> Nouvelle facture
            </a>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="stat-card">
            <span class="text-xs font-bold uppercase text-slate-500">Chiffre d'Affaires Facturé</span>
            <div class="text-2xl font-black text-slate-900 mt-2">${db.formatCurrency(totalRevenue, currency)}</div>
          </div>
          <div class="stat-card accent">
            <span class="text-xs font-bold uppercase text-slate-500">Total Encaissé</span>
            <div class="text-2xl font-black text-emerald-600 mt-2">${db.formatCurrency(totalPaid, currency)}</div>
          </div>
          <div class="stat-card blue">
            <span class="text-xs font-bold uppercase text-slate-500">Montant en Attente</span>
            <div class="text-2xl font-black text-slate-800 mt-2">${db.formatCurrency(totalPending, currency)}</div>
          </div>
          <div class="stat-card red">
            <span class="text-xs font-bold uppercase text-slate-500">Clients & Factures</span>
            <div class="text-2xl font-black text-slate-900 mt-2">${clients.length} <span class="text-xs font-normal text-slate-500">clients (${invoices.length} factures)</span></div>
          </div>
        </div>

        <div class="card p-5 mb-8">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-slate-900 text-base">Dernières Factures</h3>
            <a href="#/invoices" class="text-xs text-primary-700 font-bold hover:underline">Voir tout</a>
          </div>

          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>N° Facture</th>
                  <th>Client</th>
                  <th>Échéance</th>
                  <th>Total TTC</th>
                  <th>Statut</th>
                  <th class="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                ${invoices.slice(0, 5).map(inv => {
                  const client = db.getById('clients', inv.clientId);
                  return `
                    <tr>
                      <td class="font-bold text-slate-900">${inv.invoiceNumber}</td>
                      <td>${client ? client.name : '-'}</td>
                      <td class="text-xs text-slate-500">${inv.dueDate}</td>
                      <td class="font-bold text-slate-900">${db.formatCurrency(inv.total, currency)}</td>
                      <td><span class="badge badge-${inv.status}">${inv.status}</span></td>
                      <td class="text-right">
                        <a href="#/invoices/preview/${inv.id}" class="btn btn-secondary btn-sm"><i class="fa-solid fa-eye"></i></a>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function renderInvoicesList(container) {
    const business = auth.getBusiness();
    const currency = business?.currency || 'FCFA';
    const invoices = invoiceService.getInvoices();

    container.innerHTML = `
      <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div class="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900">Factures</h1>
            <p class="text-xs text-slate-500 mt-1">Gérez et téléchargez vos factures en FCFA</p>
          </div>
          <a href="#/invoices/new" class="btn btn-primary shadow-md"><i class="fa-solid fa-plus"></i> Nouvelle facture</a>
        </div>

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
                return `
                  <tr>
                    <td class="font-bold text-primary-700">
                      <a href="#/invoices/preview/${inv.id}" class="hover:underline">${inv.invoiceNumber}</a>
                    </td>
                    <td>${client ? client.name : '-'}</td>
                    <td class="text-xs text-slate-600">${inv.issueDate}</td>
                    <td class="text-xs text-slate-600">${inv.dueDate}</td>
                    <td class="font-bold text-slate-900">${db.formatCurrency(inv.total, currency)}</td>
                    <td class="font-semibold ${inv.balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'}">${db.formatCurrency(inv.balanceDue, currency)}</td>
                    <td><span class="badge badge-${inv.status}">${inv.status}</span></td>
                    <td class="text-right">
                      <div class="inline-flex items-center gap-1">
                        <a href="#/invoices/preview/${inv.id}" class="btn btn-secondary btn-sm" title="Aperçu & PDF"><i class="fa-solid fa-eye"></i></a>
                        <button class="btn btn-secondary btn-sm btn-del" data-id="${inv.id}" title="Supprimer"><i class="fa-solid fa-trash text-red-500"></i></button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.querySelectorAll('.btn-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Voulez-vous supprimer cette facture ?')) {
          invoiceService.deleteInvoice(id);
          notifications.info('Facture supprimée.');
          renderInvoicesList(container);
        }
      });
    });
  }

  function renderInvoiceEditor(container, editId = null) {
    const business = auth.getBusiness();
    const clients = clientService.getClients();
    const products = productService.getProducts();
    const currency = business?.currency || 'FCFA';

    const existing = editId ? invoiceService.getInvoiceDetails(editId) : null;
    let items = existing ? existing.items.map(i => ({ ...i })) : [
      { name: '', description: '', quantity: 1, unitPrice: 0, discount: 0, vatRate: business.defaultVatRate || 18 }
    ];

    container.innerHTML = `
      <div class="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <div class="flex items-center justify-between gap-4 mb-6">
          <div class="flex items-center gap-3">
            <a href="#/invoices" class="btn btn-secondary btn-sm"><i class="fa-solid fa-arrow-left"></i> Retour</a>
            <h1 class="text-2xl font-extrabold text-slate-900">${editId ? 'Modifier la facture' : 'Nouvelle facture'}</h1>
          </div>
          <button id="btn-save-inv" class="btn btn-primary shadow-md"><i class="fa-solid fa-check"></i> Enregistrer & Aperçu</button>
        </div>

        <form id="form-inv" class="space-y-6">
          <div class="card p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-bold uppercase text-slate-400">ÉMETTEUR</div>
              <div class="font-bold text-slate-900">${business.name}</div>
              <div class="text-xs text-slate-500">${business.address}</div>
            </div>

            <div>
              <label class="form-label" for="sel-client">Client *</label>
              <select id="sel-client" class="form-select" required>
                <option value="">-- Choisir un client --</option>
                ${clients.map(c => `<option value="${c.id}" ${existing?.clientId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="form-label" for="inp-num">Numéro de facture</label>
              <input type="text" id="inp-num" class="form-control font-bold text-primary-700" value="${existing?.invoiceNumber || db.getNextInvoiceNumber(business.id)}" required>
            </div>
          </div>

          <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-slate-900">Prestations & Produits</h3>
              <button type="button" id="btn-add-row" class="btn btn-secondary btn-sm">+ Ajouter une ligne</button>
            </div>

            <div class="table-container mb-4">
              <table class="table">
                <thead>
                  <tr>
                    <th>Désignation</th>
                    <th class="text-center" style="width: 100px;">Quantité</th>
                    <th class="text-right" style="width: 160px;">Prix Unit. HT (${currency})</th>
                    <th class="text-center" style="width: 100px;">TVA (%)</th>
                  </tr>
                </thead>
                <tbody id="rows-body">
                  ${items.map((it, idx) => `
                    <tr data-idx="${idx}">
                      <td>
                        <input type="text" class="form-control text-sm r-name font-semibold" placeholder="Ex: Développement Web..." value="${it.name || ''}" required>
                      </td>
                      <td>
                        <input type="number" class="form-control text-center text-sm r-qty" value="${it.quantity || 1}" min="1" required>
                      </td>
                      <td>
                        <input type="number" class="form-control text-right text-sm r-price" value="${it.unitPrice || 0}" min="0" required>
                      </td>
                      <td>
                        <input type="number" class="form-control text-center text-sm r-vat" value="${it.vatRate || 18}" min="0" max="100">
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="card p-6 flex justify-end">
            <button type="submit" class="btn btn-primary btn-lg shadow-md"><i class="fa-solid fa-check"></i> Valider la facture</button>
          </div>
        </form>
      </div>
    `;

    const form = container.querySelector('#form-inv');
    const rowsBody = container.querySelector('#rows-body');

    container.querySelector('#btn-add-row').addEventListener('click', () => {
      items.push({ name: '', description: '', quantity: 1, unitPrice: 0, vatRate: 18 });
      const newRow = document.createElement('tr');
      const idx = items.length - 1;
      newRow.setAttribute('data-idx', idx);
      newRow.innerHTML = `
        <td><input type="text" class="form-control text-sm r-name font-semibold" placeholder="Ex: Prestation..." required></td>
        <td><input type="number" class="form-control text-center text-sm r-qty" value="1" min="1" required></td>
        <td><input type="number" class="form-control text-right text-sm r-price" value="0" min="0" required></td>
        <td><input type="number" class="form-control text-center text-sm r-vat" value="18" min="0" max="100"></td>
      `;
      rowsBody.appendChild(newRow);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const clientId = form.querySelector('#sel-client').value;
      const invoiceNumber = form.querySelector('#inp-num').value;

      const rowEls = rowsBody.querySelectorAll('tr');
      const validItems = [];
      rowEls.forEach(r => {
        const name = r.querySelector('.r-name').value;
        const qty = Number(r.querySelector('.r-qty').value) || 1;
        const price = Number(r.querySelector('.r-price').value) || 0;
        const vat = Number(r.querySelector('.r-vat').value) || 18;
        if (name && name.trim()) {
          validItems.push({ name, quantity: qty, unitPrice: price, vatRate: vat });
        }
      });

      if (validItems.length === 0) {
        notifications.error('Veuillez ajouter au moins une ligne avec un nom.');
        return;
      }

      try {
        const inv = invoiceService.createInvoice({
          clientId,
          invoiceNumber,
          items: validItems
        });
        notifications.success(`Facture ${inv.invoiceNumber} enregistrée !`);
        window.location.hash = `#/invoices/preview/${inv.id}`;
      } catch (err) {
        notifications.error(err.message);
      }
    });
  }

  function renderInvoicePreview(container, invId) {
    const inv = invoiceService.getInvoiceDetails(invId);
    if (!inv) {
      container.innerHTML = `<div class="p-8 text-center"><p>Facture introuvable.</p><a href="#/invoices" class="btn btn-primary mt-4">Retour</a></div>`;
      return;
    }

    container.innerHTML = `
      <div class="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <div class="card p-4 mb-6 flex items-center justify-between no-print">
          <a href="#/invoices" class="btn btn-secondary btn-sm"><i class="fa-solid fa-arrow-left"></i> Factures</a>
          <div class="flex items-center gap-2">
            <button id="btn-dl-pdf" class="btn btn-primary btn-sm"><i class="fa-solid fa-file-arrow-down"></i> Télécharger PDF</button>
            <button id="btn-prt" class="btn btn-secondary btn-sm"><i class="fa-solid fa-print"></i> Imprimer</button>
          </div>
        </div>

        <div id="target-pdf">${pdfService.renderInvoiceHTML(inv)}</div>
      </div>
    `;

    container.querySelector('#btn-dl-pdf').addEventListener('click', () => {
      pdfService.downloadPDF(inv, container.querySelector('#invoice-pdf-document'));
    });

    container.querySelector('#btn-prt').addEventListener('click', () => {
      window.print();
    });
  }

  function renderClients(container) {
    const clients = clientService.getClients();
    const currency = auth.getBusiness()?.currency || 'FCFA';

    container.innerHTML = `
      <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-extrabold text-slate-900">Clients</h1>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${clients.map(c => `
            <div class="card p-5">
              <h3 class="font-bold text-slate-900">${c.name}</h3>
              <p class="text-xs text-slate-500 mt-1">${c.phone || c.email || 'Contact'}</p>
              <div class="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs">
                <span>Total facturé:</span>
                <span class="font-bold">${db.formatCurrency(c.totalInvoiced, currency)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderProducts(container) {
    const products = productService.getProducts();
    const currency = auth.getBusiness()?.currency || 'FCFA';

    container.innerHTML = `
      <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <h1 class="text-2xl font-extrabold text-slate-900 mb-6">Produits & Services</h1>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Désignation</th>
                <th>Unité</th>
                <th>TVA</th>
                <th class="text-right">Prix HT</th>
              </tr>
            </thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td class="font-bold text-slate-900">${p.name}</td>
                  <td class="text-xs text-slate-600">${p.unit}</td>
                  <td class="text-xs text-slate-600">${p.vatRate}%</td>
                  <td class="text-right font-bold">${db.formatCurrency(p.unitPrice, currency)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderPayments(container) {
    const payments = paymentService.getPayments();
    const currency = auth.getBusiness()?.currency || 'FCFA';

    container.innerHTML = `
      <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <h1 class="text-2xl font-extrabold text-slate-900 mb-6">Journal des Paiements</h1>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Facture</th>
                <th>Moyen</th>
                <th class="text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map(p => `
                <tr>
                  <td class="text-xs">${p.date}</td>
                  <td class="font-bold">${p.invoice?.invoiceNumber || '-'}</td>
                  <td><span class="method-pill ${p.methodInfo?.class || ''}">${p.methodInfo?.label || p.paymentMethod}</span></td>
                  <td class="text-right font-bold text-emerald-700">+ ${db.formatCurrency(p.amount, currency)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderSettings(container) {
    const business = auth.getBusiness();
    container.innerHTML = `
      <div class="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <h1 class="text-2xl font-extrabold text-slate-900 mb-6">Paramètres</h1>
        <div class="card p-6 space-y-4 max-w-xl">
          <div>
            <label class="form-label">Nom de l'entreprise</label>
            <input type="text" class="form-control" value="${business.name}" id="set-biz-name">
          </div>
          <div>
            <label class="form-label">Numéro Fiscal (NIF / RCCM)</label>
            <input type="text" class="form-control" value="${business.nif || ''}" id="set-biz-nif">
          </div>
          <button id="btn-save-settings" class="btn btn-primary">Enregistrer</button>
        </div>
      </div>
    `;

    container.querySelector('#btn-save-settings').addEventListener('click', () => {
      const name = container.querySelector('#set-biz-name').value;
      const nif = container.querySelector('#set-biz-nif').value;
      auth.updateBusiness({ name, nif });
      notifications.success('Paramètres enregistrés !');
    });
  }

  // Routeur principal
  function handleRoute() {
    const rawHash = window.location.hash || '#/';
    const path = rawHash.replace(/^#\/?/, '/');

    if (path === '/' || path === '') {
      renderLanding();
      return;
    }

    if (path === '/dashboard') {
      renderShell('/dashboard', renderDashboard);
    } else if (path === '/invoices') {
      renderShell('/invoices', renderInvoicesList);
    } else if (path === '/invoices/new') {
      renderShell('/invoices/new', (el) => renderInvoiceEditor(el, null));
    } else if (path.startsWith('/invoices/preview/')) {
      const id = path.replace('/invoices/preview/', '');
      renderShell('/invoices', (el) => renderInvoicePreview(el, id));
    } else if (path === '/clients') {
      renderShell('/clients', renderClients);
    } else if (path === '/products') {
      renderShell('/products', renderProducts);
    } else if (path === '/payments') {
      renderShell('/payments', renderPayments);
    } else if (path === '/settings') {
      renderShell('/settings', renderSettings);
    } else {
      window.location.hash = '#/dashboard';
    }
  }

  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('load', handleRoute);

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    handleRoute();
  }
})();
