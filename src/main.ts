/**
 * main.ts - App bootstrap for Fotografiske Signaler – Desktop Studio (Fase 1)
 */

import './shared/styles/variables.css';
import './shared/styles/base.css';
import './shared/styles/components.css';
import './modules/dof/dof.css';
import './shared/styles/desktop-shell.css';

import { DesktopShell } from './app/DesktopShell.ts';
import { registerSW } from 'virtual:pwa-register';

const appRoot = document.getElementById('app');
if (appRoot) {
  DesktopShell.init(appRoot);
}

const updateSW = registerSW({
  onNeedRefresh() {
    window.dispatchEvent(
      new CustomEvent('pwa-update-available', {
        detail: {
          update: () => updateSW(true)
        }
      })
    );
  },
  onOfflineReady() {
    console.log('Fotografiske Signaler Desktop Studio er klar til offline brug.');
  }
});
