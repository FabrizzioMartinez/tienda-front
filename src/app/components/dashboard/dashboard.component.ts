import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

// Servicios y Modelos
import { ProductoService } from '../../services/producto.service';
import { MarcaService } from '../../services/marca.service';
import { ProductoDto } from '../../models/producto.model';
import { VentaService } from '../../services/venta.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  /* ================= KPIs ================= */
  totalProductos = 0;
  totalAlertas = 0;
  totalMarcas = 0;
  ventasDia = 0;

  // Filtramos sobre el DTO. 
  // Nota: Si necesitas stock para alertas, el DTO debe incluirlo.
  productosCriticos: ProductoDto[] = [];

  constructor(
    private productoService: ProductoService,
    private marcaService: MarcaService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private ventaService: VentaService
  ) {}

  ngOnInit(): void {
    this.cargarResumen();
  }

  irANuevaVenta(): void {
    this.router.navigate(['/ventas/nueva']);
  }

  cargarResumen(): void {
  // 1. Cargar productos detallados
  this.productoService.getProductos().subscribe({
    next: (lista) => {
      this.totalProductos = lista.length;
      this.productosCriticos = lista.filter(p => p.stock <= 5);
      this.totalAlertas = this.productosCriticos.length;
      this.cdr.markForCheck();
    },
    error: (err) => console.error('Error al cargar productos:', err)
  });

  // 2. Cargar marcas
  this.marcaService.getActivas().subscribe({
    next: (marcas) => {
      this.totalMarcas = marcas.length;
      this.cdr.markForCheck();
    },
    error: (err) => console.error('Error al cargar marcas:', err)
  });

  // 3. Cargar ventas del día (Integrado)
  this.cargarVentasDelDia();
}

  cargarVentasDelDia(): void {
  const hoy = new Date();
  
  this.ventaService.getPorFecha(hoy).subscribe({
    next: (ventas) => {
      console.log('Ventas recibidas del backend:', ventas); // <-- MIRA LA CONSOLA
      this.ventasDia = ventas.reduce((acumulado, venta) => acumulado + venta.total, 0);
      this.cdr.markForCheck();
    },
    error: (err) => console.error('Error al cargar ventas del día:', err)
  });
}
}