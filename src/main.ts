import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

// 1. Importamos LOCALE_ID y el registrador de datos regionales
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';

// 2. Importamos los datos específicos de Perú
import localeEsPe from '@angular/common/locales/es-PE';

// 3. Registramos la cultura de Perú en el motor de Angular
registerLocaleData(localeEsPe);

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(routes),
    provideAnimations(),
    
    // 4. Forzamos a que Angular use 'es-PE' como el Locale predeterminado para todo el proyecto
    { provide: LOCALE_ID, useValue: 'es-PE' },

    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          // Esto evita que PrimeNG detecte el modo oscuro de tu sistema
          // y fuerce el diseño claro por defecto.
          darkModeSelector: false 
        }
      }
    })
  ]
}).catch(err => console.error(err));