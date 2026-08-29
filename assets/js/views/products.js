/**
 * PINAL_FACTURE — Vue Catalogue Produits & Prestations de Services
 */

import { db } from '../db.js';
import { auth } from '../auth.js';
import { productService } from '../services/product.service.js';
import { notifications } from '../services/notification.service.js';

export function renderProductsView(container) {
  const business = auth.getBusiness();
  const currency = business?.currency || 'FCFA';
  let searchQuery = '';

  function render() {
    const products = productService.getProducts(searchQuery);

    container.innerHTML = `
      <div class="p-4 sm:p-6 lg:p-8 max-w-7xl">
        
        <!-- Top Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Produits & Services</h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">Gérez votre catalogue de prestations et produits pour accélérer la facturation</p>
          </div>
          <button id="btn-add-product" class="btn btn-primary shadow-md">
            <i class="fa-solid fa-plus"></i> Nouveau produit / service
          </button>
        </div>

        <!-- Search Bar -->
        <div class="card p-4 mb-6">
          <div class="relative w-full max-w-md">
            <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-400 text-sm"></i>
            <input type="text" id="product-search-input" class="form-control text-sm" style="padding-left: 2rem;" placeholder="Rechercher par nom, SKU ou description..." value="${searchQuery}">
          </div>
        </div>

        <!-- Products Table -->
        <div class="table-container shadow-sm">
          <table class="table">
            <thead>
              <tr>
                <th>Réf. / SKU</th>
                <th>Désignation & Description</th>
                <th>Unité</th>
                <th>TVA (%)</th>
                <th class="text-right">Prix Unitaire HT</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td class="font-mono text-xs font-bold text-slate-500">${p.sku || '-'}</td>
                  <td>
                    <div class="font-bold text-slate-900">${p.name}</div>
                    ${p.description ? `<div class="text-xs text-slate-500 mt-0.5">${p.description}</div>` : ''}
                  </td>
                  <td class="text-xs text-slate-600 capitalize">${p.unit || 'unité'}</td>
                  <td class="text-xs text-slate-600 font-semibold">${p.vatRate || 18}%</td>
                  <td class="text-right font-bold text-slate-900">${db.formatCurrency(p.unitPrice, currency)}</td>
                  <td class="text-right">
                    <div class="inline-flex items-center gap-1">
                      <button class="btn btn-secondary btn-sm btn-edit-product" data-id="${p.id}" title="Modifier">
                        <i class="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button class="btn btn-secondary btn-sm btn-delete-product text-red-500 hover:text-red-700" data-id="${p.id}" title="Supprimer">
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
              ${products.length === 0 ? `
                <tr>
                  <td colspan="6" class="text-center py-12 text-slate-400">
                    <i class="fa-solid fa-boxes-stacked text-4xl mb-2"></i>
                    <div class="text-sm font-semibold text-slate-600">Aucun produit ou service enregistré</div>
                    <button id="btn-empty-add-product" class="btn btn-primary btn-sm mt-4">+ Ajouter une prestation</button>
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>

      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    const searchInput = container.querySelector('#product-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        render();
      });
    }

    const addBtn = container.querySelector('#btn-add-product');
    if (addBtn) addBtn.addEventListener('click', () => openProductModal(null, render));

    const emptyAddBtn = container.querySelector('#btn-empty-add-product');
    if (emptyAddBtn) emptyAddBtn.addEventListener('click', () => openProductModal(null, render));

    container.querySelectorAll('.btn-edit-product').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openProductModal(id, render);
      });
    });

    container.querySelectorAll('.btn-delete-product').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Voulez-vous supprimer ce produit / service du catalogue ?')) {
          productService.deleteProduct(id);
          notifications.info('Produit supprimé.');
          render();
        }
      });
    });
  }

  render();
}

/**
 * Modal d'ajout / modification de produit
 */
export function openProductModal(productId = null, onSuccess) {
  const existing = productId ? productService.getProductById(productId) : null;
  const isEdit = !!existing;
  const business = auth.getBusiness();

  const modalContainer = document.getElementById('modal-container');
  modalContainer.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="text-lg font-bold text-slate-900">${isEdit ? 'Modifier le Produit / Service' : 'Ajouter au Catalogue'}</h3>
        <button type="button" id="modal-close-p" class="text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer text-lg">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <form id="form-product-modal">
        <div class="modal-body space-y-4">
          <div class="form-group">
            <label class="form-label" for="pr-name">Désignation du produit ou prestation *</label>
            <input type="text" id="pr-name" class="form-control" placeholder="Ex: Maintenance Mensuelle Serveurs" value="${existing?.name || ''}" required>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label" for="pr-price">Prix Unitaire HT (${business.currency || 'FCFA'}) *</label>
              <input type="number" id="pr-price" class="form-control font-bold" value="${existing?.unitPrice || ''}" min="0" required>
            </div>

            <div class="form-group">
              <label class="form-label" for="pr-unit">Unité</label>
              <input type="text" id="pr-unit" class="form-control" placeholder="Ex: projet, mois, heure, unité" value="${existing?.unit || 'projet'}">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label" for="pr-vat">Taux TVA (%)</label>
              <input type="number" id="pr-vat" class="form-control" value="${existing?.vatRate !== undefined ? existing.vatRate : (business.defaultVatRate || 18)}" min="0" max="100">
            </div>

            <div class="form-group">
              <label class="form-label" for="pr-sku">Référence / SKU (Optionnel)</label>
              <input type="text" id="pr-sku" class="form-control font-mono uppercase" placeholder="DEV-01" value="${existing?.sku || ''}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="pr-desc">Description détaillée</label>
            <textarea id="pr-desc" class="form-textarea" rows="2" placeholder="Détails des livrables inclus dans ce tarif...">${existing?.description || ''}</textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" id="btn-cancel-p" class="btn btn-secondary">Annuler</button>
          <button type="submit" class="btn btn-primary">
            ${isEdit ? 'Mettre à jour' : 'Ajouter au catalogue'}
          </button>
        </div>
      </form>
    </div>
  `;

  modalContainer.classList.remove('hidden');

  function closeModal() {
    modalContainer.classList.add('hidden');
    modalContainer.innerHTML = '';
  }

  modalContainer.querySelector('#modal-close-p').addEventListener('click', closeModal);
  modalContainer.querySelector('#btn-cancel-p').addEventListener('click', closeModal);

  const form = modalContainer.querySelector('#form-product-modal');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('#pr-name').value;
    const unitPrice = Number(form.querySelector('#pr-price').value);
    const unit = form.querySelector('#pr-unit').value;
    const vatRate = Number(form.querySelector('#pr-vat').value);
    const sku = form.querySelector('#pr-sku').value;
    const description = form.querySelector('#pr-desc').value;

    try {
      if (isEdit) {
        productService.updateProduct(productId, { name, unitPrice, unit, vatRate, sku, description });
        notifications.success(`Produit ${name} mis à jour !`);
      } else {
        productService.createProduct({ name, unitPrice, unit, vatRate, sku, description });
        notifications.success(`Produit ${name} ajouté au catalogue !`);
      }
      closeModal();
      if (onSuccess) onSuccess();
    } catch (err) {
      notifications.error(err.message);
    }
  });
}
