/**
 * PINAL_FACTURE — Service d'Authentification & Gestion de Session
 */

import { db } from './db.js';

const SESSION_KEY = 'pinal_facture_session';

export class AuthService {
  constructor() {
    this.currentUser = null;
    this.currentBusiness = null;
    this.listeners = [];
    this.restoreSession();
  }

  // Restaurer la session existante
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
          this.logout();
        }
      } catch (e) {
        this.logout();
      }
    } else {
      // Connecter par défaut au compte démo pour un test immédiat
      const demoUser = db.getById('users', 'usr_demo_pinal');
      const demoBiz = db.getById('businesses', 'biz_demo_pinal');
      if (demoUser && demoBiz) {
        this.setSession(demoUser, demoBiz);
      }
    }
  }

  // Sauvegarder la session active
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

  getUser() {
    return this.currentUser;
  }

  getBusiness() {
    return this.currentBusiness;
  }

  // Inscription d'un nouvel utilisateur
  signup({ firstName, lastName, email, phone, password }) {
    // Vérifier si l'email existe déjà
    const existing = db.find('users', { email: email.trim().toLowerCase() });
    if (existing.length > 0) {
      throw new Error('Un compte existe déjà avec cette adresse email.');
    }

    const newUser = db.insert('users', {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      passwordHash: password, // Dans une app réelle: bcrypt côté backend
      role: 'owner'
    });

    // Créer une entreprise par défaut rattachée
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
    return { user: newUser, business: defaultBusiness, needsOnboarding: true };
  }

  // Connexion
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

    // Récupérer l'entreprise de l'utilisateur
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

  // Déconnexion
  logout() {
    this.currentUser = null;
    this.currentBusiness = null;
    localStorage.removeItem(SESSION_KEY);
    this.notify();
  }

  // Mettre à jour le profil utilisateur
  updateProfile(data) {
    if (!this.currentUser) return null;
    const updated = db.update('users', this.currentUser.id, data);
    this.currentUser = updated;
    this.notify();
    return updated;
  }

  // Mettre à jour l'entreprise
  updateBusiness(data) {
    if (!this.currentBusiness) return null;
    const updated = db.update('businesses', this.currentBusiness.id, data);
    this.currentBusiness = updated;
    this.notify();
    return updated;
  }

  // Réinitialiser le mot de passe
  resetPassword(email) {
    const cleanEmail = email.trim().toLowerCase();
    const users = db.find('users', { email: cleanEmail });
    if (users.length === 0) {
      throw new Error('Adresse email inconnue.');
    }
    // Simulation d'envoi d'email de réinitialisation
    return { success: true, message: 'Un lien de réinitialisation sécurisé a été envoyé par email.' };
  }

  // Basculer sur le compte démo Pinal Tech
  loadDemoAccount() {
    const demoUser = db.getById('users', 'usr_demo_pinal');
    const demoBiz = db.getById('businesses', 'biz_demo_pinal');
    if (demoUser && demoBiz) {
      this.setSession(demoUser, demoBiz);
      return true;
    }
    db.seedDemoData();
    this.restoreSession();
    return true;
  }

  // Abonnement aux changements d'état
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

export const auth = new AuthService();
