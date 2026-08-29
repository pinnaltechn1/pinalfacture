/**
 * PINAL_FACTURE — Application Core, Shell & SPA Router
 */

import { auth } from './auth.js';
import { notifications } from './services/notification.service.js';

// Vues
import { renderLandingView } from './views/landing.js';
import { renderLoginView, renderRegisterView, renderForgotPasswordView } from './views/auth.js';
import { renderOnboardingView } from './views/onboarding.js';
import { renderDashboardView } from './views/dashboard.js';
import { renderInvoicesListView, renderInvoiceEditorView } from './views/invoices.js';
import { renderInvoicePreviewView, renderPublicInvoiceView } from './views/invoice-preview.js';
import { renderClientsView } from './views/clients.js';
import { renderProductsView } from './views/products.js';
import { renderPaymentsView } from './views/payments.js';
import { renderSettingsView } from './views/settings.js';

class App {
  constructor() {
    this.mainContent = document.getElementById('main-content');
    this.init();
  }

  init() {
    // Écouter les changements d'URL
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());

    // Écouter les changements d'authentification
    auth.subscribe(() => {
      this.handleRoute();
    });
  }

  handleRoute() {
    const rawHash = window.location.hash || '#/';
    const [pathPart, queryPart] = rawHash.split('?');
    const path = pathPart.replace(/^#\/?/, '/');
    const params = new URLSearchParams(queryPart || '');

    // 1. Route publique de facture client
    if (path.startsWith('/public-invoice/')) {
      const token = path.replace('/public-invoice/', '');
      this.mainContent.innerHTML = '';
      renderPublicInvoiceView(this.mainContent, token);
      return;
    }

    // 2. Routes publiques
    if (path === '/' || path === '') {
      this.mainContent.innerHTML = '';
      renderLandingView(this.mainContent);
      return;
    }

    if (path === '/login') {
      this.mainContent.innerHTML = '';
      renderLoginView(this.mainContent);
      return;
    }

    if (path === '/register') {
      this.mainContent.innerHTML = '';
      renderRegisterView(this.mainContent);
      return;
    }

    if (path === '/forgot-password') {
      this.mainContent.innerHTML = '';
      renderForgotPasswordView(this.mainContent);
      return;
    }

    // 3. Protection d'authentification pour les routes privées
    if (!auth.isAuthenticated()) {
      window.location.hash = '#/login';
      return;
    }

    // 4. Onboarding si requis
    if (path === '/onboarding') {
      this.mainContent.innerHTML = '';
      renderOnboardingView(this.mainContent);
      return;
    }

    // 5. Rendu de la coquille d'application complète (Sidebar + Topbar + Mobile Nav)
    this.renderAppShell(path, () => {
      const viewContainer = document.getElementById('view-content');

      if (path === '/dashboard') {
        renderDashboardView(viewContainer);
      } else if (path === '/invoices') {
        const statusFilter = params.get('status') || 'all';
        renderInvoicesListView(viewContainer, statusFilter);
      } else if (path === '/invoices/new') {
        renderInvoiceEditorView(viewContainer, null);
      } else if (path.startsWith('/invoices/edit/')) {
        const id = path.replace('/invoices/edit/', '');
        renderInvoiceEditorView(viewContainer, id);
      } else if (path.startsWith('/invoices/preview/')) {
        const id = path.replace('/invoices/preview/', '');
        renderInvoicePreviewView(viewContainer, id);
      } else if (path === '/clients') {
        renderClientsView(viewContainer);
      } else if (path === '/products') {
        renderProductsView(viewContainer);
      } else if (path === '/payments') {
        renderPaymentsView(viewContainer);
      } else if (path === '/settings') {
        renderSettingsView(viewContainer);
      } else {
        window.location.hash = '#/dashboard';
      }
    });
  }

  // Rendu de la Coquille SaaS (Layout Dashboard avec Sidebar & Bottom Bar)
  renderAppShell(currentPath, onViewRender) {
    const user = auth.getUser();
    const business = auth.getBusiness();
    const unreadCount = notifications.getUnreadCount();

    const isCurrent = (route) => currentPath.startsWith(route) ? 'active' : '';

    this.mainContent.innerHTML = `
      <div class="flex h-screen overflow-hidden bg-slate-50">
        
        <!-- Desktop Sidebar (Navigation Principale) -->
        <aside class="desktop-sidebar hidden md:flex flex-col justify-between">
          <div>
            <!-- Brand Logo -->
            <div class="p-6 border-b border-slate-200 flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-primary-700 text-white flex items-center justify-center font-black text-lg shadow-md" style="background: linear-gradient(135deg, #0F766E 0%, #134E4A 100%);">
                P
              </div>
              <div>
                <span class="font-extrabold text-lg text-slate-900 tracking-tight">Pinal<span class="text-primary-700">_Facture</span></span>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SaaS Facturation</div>
              </div>
            </div>

            <!-- Navigation Links -->
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

          <!-- Bottom User & Company Badge -->
          <div class="p-4 border-t border-slate-200">
            <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-3 flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-800 font-bold flex items-center justify-center text-xs">
                ${(business?.name || 'P').charAt(0).toUpperCase()}
              </div>
              <div class="flex-1 overflow-hidden">
                <div class="font-bold text-xs text-slate-900 truncate">${business?.name || 'Entreprise'}</div>
                <div class="text-[11px] text-slate-400 truncate">${user?.email || ''}</div>
              </div>
            </div>

            <button id="btn-logout" class="btn btn-secondary btn-sm w-full text-xs text-red-600 hover:bg-red-50 hover:border-red-200">
              <i class="fa-solid fa-arrow-right-from-bracket mr-1"></i> Déconnexion
            </button>
          </div>
        </aside>

        <!-- Main Content Area -->
        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          <!-- Top Header Bar -->
          <header class="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between no-print shadow-sm z-20">
            
            <!-- Mobile Brand Indicator -->
            <div class="flex items-center gap-2 md:hidden">
              <div class="w-8 h-8 rounded-lg bg-primary-700 text-white flex items-center justify-center font-bold text-sm">
                P
              </div>
              <span class="font-bold text-base text-slate-900">Pinal<span class="text-primary-700">_Facture</span></span>
            </div>

            <!-- Active Company Chip -->
            <div class="hidden md:flex items-center gap-2">
              <span class="brand-badge text-xs">
                <i class="fa-solid fa-circle-check text-emerald-600"></i> ${business?.name || 'Entreprise'}
              </span>
              <span class="text-xs text-slate-400 font-semibold">• Devise: ${business?.currency || 'FCFA'} • TVA: ${business?.defaultVatRate || 18}%</span>
            </div>

            <!-- Top Actions: Notifications, Quick Create & User -->
            <div class="flex items-center gap-3">
              <a href="#/invoices/new" class="btn btn-primary btn-sm hidden sm:inline-flex shadow-sm">
                <i class="fa-solid fa-plus"></i> Nouvelle facture
              </a>

              <!-- Notification Bell -->
              <div class="relative">
                <button id="btn-notif-toggle" class="btn btn-secondary btn-sm p-2 rounded-full relative" aria-label="Notifications">
                  <i class="fa-solid fa-bell text-slate-600"></i>
                  ${unreadCount > 0 ? `
                    <span class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      ${unreadCount}
                    </span>
                  ` : ''}
                </button>

                <!-- Notifications Dropdown -->
                <div id="notif-dropdown" class="hidden absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-30 text-xs">
                  <div class="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <span class="font-bold text-slate-900 text-sm">Notifications</span>
                    <button id="btn-mark-all-read" class="text-primary-700 hover:underline font-semibold bg-transparent border-0 cursor-pointer">Tout marquer comme lu</button>
                  </div>
                  <div class="space-y-2 max-h-60 overflow-y-auto">
                    ${notifications.getNotifications().slice(0, 5).map(n => `
                      <div class="p-2 rounded-lg ${n.isRead ? 'bg-slate-50' : 'bg-primary-50 border border-primary-200'}">
                        <div class="font-bold text-slate-800">${n.title}</div>
                        <div class="text-slate-500 text-[11px] mt-0.5">${n.message}</div>
                      </div>
                    `).join('')}
                    ${notifications.getNotifications().length === 0 ? `
                      <div class="text-center py-4 text-slate-400">Aucune notification.</div>
                    ` : ''}
                  </div>
                </div>
              </div>

              <!-- Quick Demo Loader Button -->
              <button id="btn-top-demo-toggle" class="btn btn-secondary btn-sm text-xs hidden sm:inline-flex" title="Recharger les données démo">
                <i class="fa-solid fa-rotate text-amber-500 mr-1"></i> Mode Démo
              </button>
            </div>
          </header>

          <!-- Scrollable Page Container -->
          <main class="flex-1 overflow-y-auto pb-20 md:pb-8" id="view-content">
            <!-- Dynamic view placed here -->
          </main>

        </div>

        <!-- Mobile Bottom Navigation (Always accessible with center FAB) -->
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

    // Attacher les écouteurs de la coquille
    const logoutBtn = this.mainContent.querySelector('#btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        auth.logout();
        notifications.info('Vous êtes déconnecté.');
        window.location.hash = '#/';
      });
    }

    const notifBtn = this.mainContent.querySelector('#btn-notif-toggle');
    const notifMenu = this.mainContent.querySelector('#notif-dropdown');
    if (notifBtn && notifMenu) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifMenu.classList.toggle('hidden');
      });
      document.addEventListener('click', () => notifMenu.classList.add('hidden'));
    }

    const markAllBtn = this.mainContent.querySelector('#btn-mark-all-read');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => {
        notifications.markAllAsRead();
        this.handleRoute();
      });
    }

    const topDemoBtn = this.mainContent.querySelector('#btn-top-demo-toggle');
    if (topDemoBtn) {
      topDemoBtn.addEventListener('click', () => {
        auth.loadDemoAccount();
        notifications.success('Compte de démonstration Pinal Tech chargé !');
        this.handleRoute();
      });
    }

    if (onViewRender) onViewRender();
  }
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
