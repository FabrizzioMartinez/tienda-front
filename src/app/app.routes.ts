import { Routes } from '@angular/router';
import { ProductoListComponent } from './components/producto-list/producto-list.component';
import { MarcaListComponent } from './components/marca-list/marca-list.component';
import { TipoListComponent } from './components/tipo-list/tipo-list.component';
import { UnidadListComponent } from './components/unidad-list/unidad-list.component';
import { DashboardComponent } from './components/dashboard/dashboard.component'; 

// 1. IMPORTA TU NUEVO COMPONENTE AQUÍ
import { NuevaVentaComponent } from './components/ventas/pages/nueva-venta/nueva-venta.component'; 
import { ClienteListComponent } from './components/cliente-list/cliente-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  
  // 2. AGREGA LA RUTA AQUÍ
  { path: 'ventas/nueva', component: NuevaVentaComponent },
  
  { path: 'productos', component: ProductoListComponent },
  { path: 'marcas', component: MarcaListComponent },
  { path: 'tipos', component: TipoListComponent },
  { path: 'unidades', component: UnidadListComponent },
  { path: 'clientes', component: ClienteListComponent },
  { path: '**', redirectTo: 'dashboard' }
];