/**
 * PINAL_FACTURE — Service Catalogue Produits & Services
 */

import { db } from '../db.js';
import { auth } from '../auth.js';

export class ProductService {
  getProducts(search = '') {
    const business = auth.getBusiness();
    if (!business) return [];

    let products = db.find('products', p => p.businessId === business.id);

    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
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

    if (!data.name || !data.name.trim()) {
      throw new Error("Le nom du produit ou service est obligatoire.");
    }

    return db.insert('products', {
      businessId: business.id,
      name: data.name.trim(),
      description: data.description ? data.description.trim() : '',
      unitPrice: Number(data.unitPrice) || 0,
      unit: data.unit || 'unité',
      vatRate: data.vatRate !== undefined ? Number(data.vatRate) : (business.defaultVatRate || 18),
      sku: data.sku ? data.sku.trim().toUpperCase() : ''
    });
  }

  updateProduct(productId, data) {
    const product = db.getById('products', productId);
    if (!product) throw new Error("Produit introuvable.");

    return db.update('products', productId, {
      name: data.name !== undefined ? data.name.trim() : product.name,
      description: data.description !== undefined ? data.description.trim() : product.description,
      unitPrice: data.unitPrice !== undefined ? Number(data.unitPrice) : product.unitPrice,
      unit: data.unit !== undefined ? data.unit : product.unit,
      vatRate: data.vatRate !== undefined ? Number(data.vatRate) : product.vatRate,
      sku: data.sku !== undefined ? data.sku.trim().toUpperCase() : product.sku
    });
  }

  deleteProduct(productId) {
    return db.delete('products', productId);
  }
}

export const productService = new ProductService();
