/**
 * PINAL_FACTURE — Vues d'Authentification (Connexion, Inscription, Réinitialisation)
 */

import { auth } from '../auth.js';
import { notifications } from '../services/notification.service.js';

export function renderLoginView(container) {
  container.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div class="card max-w-md w-full p-8 shadow-xl border-slate-200">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-700 to-primary-900 text-white font-black text-2xl mb-3 shadow-md" style="background: linear-gradient(135deg, #0F766E 0%, #134E4A 100%);">
            P
          </div>
          <h1 class="text-2xl font-extrabold text-slate-900">Connexion à Pinal_Facture</h1>
          <p class="text-xs text-slate-500 mt-1">Accédez à votre espace de facturation professionnelle</p>
        </div>

        <!-- Formulaire -->
        <form id="form-login" class="space-y-4">
          <div class="form-group">
            <label class="form-label" for="login-email">Adresse Email</label>
            <div class="relative">
              <input type="email" id="login-email" class="form-control" placeholder="exemple@entreprise.sn" required value="contact@pinaltech.sn">
            </div>
          </div>

          <div class="form-group">
            <div class="flex justify-between items-center mb-1">
              <label class="form-label mb-0" for="login-password">Mot de passe</label>
              <a href="#/forgot-password" class="text-xs text-primary-700 font-semibold hover:underline">Mot de passe oublié ?</a>
            </div>
            <input type="password" id="login-password" class="form-control" placeholder="••••••••" required value="demo1234">
          </div>

          <button type="submit" class="btn btn-primary w-full btn-lg shadow-md mt-6">
            <i class="fa-solid fa-right-to-bracket"></i> Se connecter
          </button>
        </form>

        <!-- Séparateur -->
        <div class="flex items-center my-6">
          <div class="flex-1 border-t border-slate-200"></div>
          <span class="px-3 text-xs text-slate-400 font-medium uppercase">ou</span>
          <div class="flex-1 border-t border-slate-200"></div>
        </div>

        <!-- Bouton Démo Instantané -->
        <button id="btn-quick-demo" class="btn btn-secondary w-full">
          <i class="fa-solid fa-bolt text-amber-500"></i> Accéder au compte démo (Pinal Tech)
        </button>

        <div class="text-center mt-6 text-sm text-slate-600">
          Pas encore de compte ? 
          <a href="#/register" class="text-primary-700 font-bold hover:underline">Inscrivez-vous gratuitement</a>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#form-login');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.querySelector('#login-email').value;
    const password = form.querySelector('#login-password').value;

    try {
      auth.login(email, password);
      notifications.success('Connexion réussie ! Bienvenue sur votre espace.');
      window.location.hash = '#/dashboard';
    } catch (err) {
      notifications.error(err.message || 'Erreur lors de la connexion.');
    }
  });

  const demoBtn = container.querySelector('#btn-quick-demo');
  demoBtn.addEventListener('click', () => {
    auth.loadDemoAccount();
    notifications.success('Connecté avec le compte de démonstration Pinal Tech !');
    window.location.hash = '#/dashboard';
  });
}

export function renderRegisterView(container) {
  container.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div class="card max-w-md w-full p-8 shadow-xl border-slate-200">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-700 to-primary-900 text-white font-black text-2xl mb-3 shadow-md" style="background: linear-gradient(135deg, #0F766E 0%, #134E4A 100%);">
            P
          </div>
          <h1 class="text-2xl font-extrabold text-slate-900">Créer mon compte</h1>
          <p class="text-xs text-slate-500 mt-1">Rejoignez des centaines d'entrepreneurs africains</p>
        </div>

        <form id="form-register" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="form-group">
              <label class="form-label" for="reg-firstname">Prénom</label>
              <input type="text" id="reg-firstname" class="form-control" placeholder="Moussa" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-lastname">Nom</label>
              <input type="text" id="reg-lastname" class="form-control" placeholder="Ndiaye" required>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-email">Adresse Email professionnelle</label>
            <input type="email" id="reg-email" class="form-control" placeholder="moussa@monentreprise.sn" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-phone">Téléphone / WhatsApp</label>
            <input type="tel" id="reg-phone" class="form-control" placeholder="+221 77 000 00 00">
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-password">Mot de passe</label>
            <input type="password" id="reg-password" class="form-control" placeholder="Minimum 6 caractères" minlength="6" required>
          </div>

          <button type="submit" class="btn btn-primary w-full btn-lg shadow-md mt-6">
            <i class="fa-solid fa-arrow-right"></i> Démarrer la configuration
          </button>
        </form>

        <div class="text-center mt-6 text-sm text-slate-600">
          Vous avez déjà un compte ? 
          <a href="#/login" class="text-primary-700 font-bold hover:underline">Connectez-vous</a>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#form-register');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const firstName = form.querySelector('#reg-firstname').value;
    const lastName = form.querySelector('#reg-lastname').value;
    const email = form.querySelector('#reg-email').value;
    const phone = form.querySelector('#reg-phone').value;
    const password = form.querySelector('#reg-password').value;

    try {
      auth.signup({ firstName, lastName, email, phone, password });
      notifications.success('Compte créé avec succès ! Configurons votre entreprise.');
      window.location.hash = '#/onboarding';
    } catch (err) {
      notifications.error(err.message || "Erreur lors de l'inscription.");
    }
  });
}

export function renderForgotPasswordView(container) {
  container.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div class="card max-w-md w-full p-8 shadow-xl border-slate-200">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-extrabold text-slate-900">Mot de passe oublié</h1>
          <p class="text-xs text-slate-500 mt-1">Saisissez votre email pour recevoir les instructions</p>
        </div>

        <form id="form-forgot" class="space-y-4">
          <div class="form-group">
            <label class="form-label" for="forgot-email">Adresse Email</label>
            <input type="email" id="forgot-email" class="form-control" placeholder="contact@entreprise.sn" required>
          </div>

          <button type="submit" class="btn btn-primary w-full btn-lg">
            Envoyer le lien de réinitialisation
          </button>
        </form>

        <div class="text-center mt-6 text-sm">
          <a href="#/login" class="text-slate-600 hover:text-slate-900 font-semibold"><i class="fa-solid fa-arrow-left"></i> Retour à la connexion</a>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#form-forgot');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.querySelector('#forgot-email').value;
    try {
      const res = auth.resetPassword(email);
      notifications.success(res.message);
      window.location.hash = '#/login';
    } catch (err) {
      notifications.error(err.message);
    }
  });
}
