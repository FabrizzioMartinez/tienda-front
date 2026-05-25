import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  // 🔄 Controla si la cascada de Logística está abierta o cerrada (PC/Móvil)
  menuLogisticaAbierto: boolean = false;
  menuAdministrativoAbierto: boolean = false;

  // 📱 Controla la apertura del panel flotante en celulares
  sidebarMobileAbierto: boolean = false;

  // Alterna el submenú de Logística
  toggleLogistica(): void {
    this.menuLogisticaAbierto = !this.menuLogisticaAbierto;
  }
  toggleAdministrativo(): void {
    this.menuAdministrativoAbierto = !this.menuAdministrativoAbierto;
  }

  // 🍔 Abre o cierra la barra lateral completa en pantallas de teléfonos
  toggleSidebarMobile(): void {
    this.sidebarMobileAbierto = !this.sidebarMobileAbierto;
  }

  // 🔒 Cierra el menú móvil de golpe cuando el usuario hace clic en una opción (ej: Productos)
  cerrarSidebarMobile(): void {
    this.sidebarMobileAbierto = false;
  }
}