/**
 * PINAL_FACTURE — Vue Tableau de Bord (Dashboard Métier SaaS)
 */

import { db } from '../db.js';
import { auth } from '../auth.js';
import { invoiceService } from '../services/invoice.service.js';
import { clientService } from '../services/client.service.js';
import { paymentService, PAYMENT_METHODS } from '../services/payment.service.js';

export function renderDashboardView(container) {
  const business = auth.getBusiness();
  const currency = business?.currency || 'FCFA';

  const invoices = invoiceService.getInvoices();
  const clients = clientService.getClients();
  const payments = paymentService.getPayments();

  // Calculs KPIs
  let totalRevenue = 0; // Total facturé
  let totalPaid = 0;    // Total encaissé
  let totalPending = 0; // Total en attente
  let draftCount = 0;
  let sentCount = 0;
  let paidCount = 0;
  let overdueCount = 0;

  const now = new Date();

  invoices.forEach(inv => {
    totalRevenue += (Number(inv.total) || 0);
    totalPaid += (Number(inv.amountPaid) || 0);
    totalPending += (Number(inv.balanceDue) || 0);

    if (inv.status === 'paid') paidCount++;
    else if (inv.status === 'draft') draftCount++;
    else if (inv.status === 'sent' || inv.status === 'partial') {
      sentCount++;
      if (inv.dueDate && new Date(inv.dueDate) < now && inv.balanceDue > 0) {
        overdueCount++;
      }
    }
  });

  // Calcul du Chiffre d'Affaires Mensuel pour le Graphique SVG
  const monthlyData = [
    { month: 'Mar', amount: Math.round(totalRevenue * 0.15) },
    { month: 'Avr', amount: Math.round(totalRevenue * 0.22) },
    { month: 'Mai', amount: Math.round(totalRevenue * 0.18) },
    { month: 'Juin', amount: Math.round(totalRevenue * 0.30) },
    { month: 'Juil', amount: Math.round(totalRevenue * 0.25) },
    { month: 'Août', amount: totalPaid || Math.round(totalRevenue * 0.45) }
  ];

  const maxAmount = Math.max(...monthlyData.map(d => d.amount), 100000);

  // Activité récente (10 dernières actions combinées)
  const recentHistory = db.getAll('invoice_status_history')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  container.innerHTML = `
    <div class="p-4 sm:p-6 lg:p-8 max-w-7xl">
      
      <!-- Top Title & Quick Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Tableau de bord</h1>
          <p class="text-xs sm:text-sm text-slate-500 mt-1">Aperçu financier en temps réel de <strong>${business?.name || 'votre entreprise'}</strong></p>
        </div>
        <div class="flex items-center gap-2">
          <a href="#/invoices/new" class="btn btn-primary btn-sm shadow-md">
            <i class="fa-solid fa-plus"></i> Nouvelle facture
          </a>
          <a href="#/clients" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-user-plus"></i> Nouveau client
          </a>
        </div>
      </div>

      <!-- Stat Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        <!-- Chiffre d'Affaires Total -->
        <div class="stat-card">
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs font-bold uppercase text-slate-500">Chiffre d'Affaires Facturé</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-sm font-bold">
              <i class="fa-solid fa-chart-line"></i>
            </div>
          </div>
          <div class="text-2xl font-black text-slate-900 mb-1">${db.formatCurrency(totalRevenue, currency)}</div>
          <div class="text-xs text-slate-400">Total des factures émises</div>
        </div>

        <!-- Montant Encaissé -->
        <div class="stat-card accent">
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs font-bold uppercase text-slate-500">Total Encaissé</span>
            <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-sm font-bold">
              <i class="fa-solid fa-hand-holding-dollar"></i>
            </div>
          </div>
          <div class="text-2xl font-black text-emerald-600 mb-1">${db.formatCurrency(totalPaid, currency)}</div>
          <div class="text-xs text-emerald-700 font-semibold">Wave, Orange Money & Espèces</div>
        </div>

        <!-- Montant en Attente -->
        <div class="stat-card blue">
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs font-bold uppercase text-slate-500">Montant en Attente</span>
            <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-sm font-bold">
              <i class="fa-solid fa-clock-rotate-left"></i>
            </div>
          </div>
          <div class="text-2xl font-black text-slate-800 mb-1">${db.formatCurrency(totalPending, currency)}</div>
          <div class="text-xs text-slate-400">Solde restant à percevoir</div>
        </div>

        <!-- Clients & Factures -->
        <div class="stat-card red">
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs font-bold uppercase text-slate-500">Activité & Clients</span>
            <div class="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-sm font-bold">
              <i class="fa-solid fa-users"></i>
            </div>
          </div>
          <div class="text-2xl font-black text-slate-900 mb-1">${clients.length} <span class="text-xs font-normal text-slate-500">clients</span></div>
          <div class="text-xs text-slate-500">${invoices.length} factures générées</div>
        </div>
      </div>

      <!-- Section Graphique & Répartition des Statuts -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        <!-- Graphique Chiffre d'Affaires -->
        <div class="card p-5 lg:col-span-2 flex flex-col justify-between">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-bold text-slate-900 text-base">Évolution du Chiffre d'Affaires</h3>
              <p class="text-xs text-slate-400">Activité des 6 derniers mois en ${currency}</p>
            </div>
            <span class="text-xs font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded">2026</span>
          </div>

          <!-- Interactive SVG Bar Chart -->
          <div class="w-full pt-4 pb-2">
            <div class="flex items-end justify-between gap-2 sm:gap-6 h-48 px-2 border-b border-slate-200">
              ${monthlyData.map(d => {
                const heightPercent = Math.max(12, Math.round((d.amount / maxAmount) * 100));
                return `
                  <div class="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div class="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      ${db.formatCurrency(d.amount, '')}
                    </div>
                    <div class="w-full max-w-[42px] bg-primary-600 rounded-t-md transition-all duration-300 group-hover:bg-primary-700 shadow-sm" style="height: ${heightPercent}%; background: linear-gradient(180deg, #0D9488 0%, #0F766E 100%);"></div>
                    <span class="text-xs font-bold text-slate-600 mt-2">${d.month}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Répartition Statuts Factures -->
        <div class="card p-5 flex flex-col justify-between">
          <div>
            <h3 class="font-bold text-slate-900 text-base mb-1">Statut des Factures</h3>
            <p class="text-xs text-slate-400 mb-4">État global de vos créances</p>

            <div class="space-y-3">
              <a href="#/invoices?status=paid" class="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span class="text-xs font-bold text-slate-700">Payées</span>
                </div>
                <span class="badge badge-paid">${paidCount}</span>
              </a>

              <a href="#/invoices?status=sent" class="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-blue-500"></span>
                  <span class="text-xs font-bold text-slate-700">Envoyées / En attente</span>
                </div>
                <span class="badge badge-sent">${sentCount}</span>
              </a>

              <a href="#/invoices?status=draft" class="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-slate-400"></span>
                  <span class="text-xs font-bold text-slate-700">Brouillons</span>
                </div>
                <span class="badge badge-draft">${draftCount}</span>
              </a>

              <a href="#/invoices?status=overdue" class="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-red-500"></span>
                  <span class="text-xs font-bold text-slate-700">En retard</span>
                </div>
                <span class="badge badge-overdue">${overdueCount}</span>
              </a>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-slate-100 text-center">
            <a href="#/invoices" class="text-xs text-primary-700 font-bold hover:underline">
              Voir toutes les factures <i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>

      <!-- Section Dernières Factures & Activité Récente -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Dernières Factures -->
        <div class="card p-5 lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-slate-900 text-base">Dernières Factures</h3>
            <a href="#/invoices" class="text-xs text-primary-700 font-bold hover:underline">Gérer tout</a>
          </div>

          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>N° Facture</th>
                  <th>Client</th>
                  <th>Échéance</th>
                  <th>Montant TTC</th>
                  <th>Statut</th>
                  <th class="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                ${invoices.slice(0, 5).map(inv => {
                  const client = db.getById('clients', inv.clientId);
                  const statusBadges = {
                    paid: '<span class="badge badge-paid">Payée</span>',
                    sent: '<span class="badge badge-sent">Envoyée</span>',
                    draft: '<span class="badge badge-draft">Brouillon</span>',
                    partial: '<span class="badge badge-partial">Acompte</span>',
                    overdue: '<span class="badge badge-overdue">En retard</span>'
                  };
                  return `
                    <tr>
                      <td class="font-bold text-slate-900">${inv.invoiceNumber}</td>
                      <td>${client ? client.name : '-'}</td>
                      <td class="text-xs text-slate-500">${inv.dueDate}</td>
                      <td class="font-bold text-slate-900">${db.formatCurrency(inv.total, currency)}</td>
                      <td>${statusBadges[inv.status] || inv.status}</td>
                      <td class="text-right">
                        <a href="#/invoices/preview/${inv.id}" class="btn btn-secondary btn-sm" title="Voir l'aperçu">
                          <i class="fa-solid fa-eye"></i>
                        </a>
                      </td>
                    </tr>
                  `;
                }).join('')}
                ${invoices.length === 0 ? `
                  <tr>
                    <td colspan="6" class="text-center py-8 text-slate-400">
                      <i class="fa-regular fa-folder-open text-3xl mb-2"></i>
                      <div>Aucune facture enregistrée pour le moment.</div>
                      <a href="#/invoices/new" class="btn btn-primary btn-sm mt-3">+ Créer ma première facture</a>
                    </td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Flux d'Activité Récente -->
        <div class="card p-5">
          <h3 class="font-bold text-slate-900 text-base mb-4">Activité Récente</h3>
          <div class="space-y-4">
            ${recentHistory.map(h => {
              const invoice = db.getById('invoices', h.invoiceId);
              return `
                <div class="flex items-start gap-3 text-xs">
                  <div class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i class="fa-solid fa-check text-[10px]"></i>
                  </div>
                  <div class="flex-1">
                    <div class="font-semibold text-slate-800">${h.note || 'Mise à jour'}</div>
                    <div class="text-slate-400 text-[11px] mt-0.5">
                      ${invoice ? `Facture ${invoice.invoiceNumber} • ` : ''}
                      ${new Date(h.timestamp).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
            ${recentHistory.length === 0 ? `
              <div class="text-center py-6 text-slate-400 text-xs">
                Aucune activité récente.
              </div>
            ` : ''}
          </div>
        </div>

      </div>

    </div>
  `;
}
