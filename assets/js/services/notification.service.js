/**
 * PINAL_FACTURE — Service Toasts & Notifications
 */

import { db } from '../db.js';
import { auth } from '../auth.js';

export class NotificationService {
  constructor() {
    this.toastContainer = null;
  }

  getContainer() {
    if (!this.toastContainer) {
      this.toastContainer = document.getElementById('toast-container');
    }
    return this.toastContainer;
  }

  showToast(message, type = 'info', duration = 3500) {
    const container = this.getContainer();
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

    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('click', () => {
      toast.remove();
    });

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

  // Notifications persistantes de la base de données
  getNotifications() {
    const business = auth.getBusiness();
    if (!business) return [];

    return db.find('notifications', n => n.businessId === business.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getUnreadCount() {
    const notifications = this.getNotifications();
    return notifications.filter(n => !n.isRead).length;
  }

  markAsRead(id) {
    db.update('notifications', id, { isRead: true });
  }

  markAllAsRead() {
    const business = auth.getBusiness();
    if (!business) return;
    const list = db.find('notifications', n => n.businessId === business.id && !n.isRead);
    list.forEach(n => db.update('notifications', n.id, { isRead: true }));
  }
}

export const notifications = new NotificationService();
