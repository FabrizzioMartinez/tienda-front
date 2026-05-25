import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AutoCompleteModule } from 'primeng/autocomplete';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox'; // <-- Import necesario

import { ProductoService } from '../../../../services/producto.service';
import { VentaService } from '../../../../services/venta.service'; // <-- Import necesario
import { Producto, ProductoBusquedaDto } from '../../../../models/producto.model';
// Asegúrate de que la ruta sea correcta según tu estructura de carpetas
import { DetalleVentaDto, VentaCreateDto } from '../../../../models/venta.model';
import { MessageService } from 'primeng/api'; // Importar servicio
import { ToastModule } from 'primeng/toast'; // Importar módulo

@Component({
  selector: 'app-nueva-venta',
  providers: [MessageService],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    AutoCompleteModule,
    TableModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    CardModule,
    CheckboxModule,
    ToastModule,
    RouterModule
  ],
  templateUrl: './nueva-venta.component.html'
})
export class NuevaVentaComponent implements OnInit {

  productoSeleccionado: Producto | null = null;
  sugerenciasProductos: ProductoBusquedaDto[] = [];
  cantidadSeleccionada: number = 1;

  // Modelo con tipado fuerte (VentaCreateDto)
  nuevaVenta!: VentaCreateDto;

  tiposComprobante = [
    { label: 'Boleta', value: 'BOLETA' },
    { label: 'Factura', value: 'FACTURA' }
  ];

  tiposDocumento = [
    { label: 'DNI', value: 'DNI' },
    { label: 'RUC', value: 'RUC' }
  ];

  constructor(
    private messageService: MessageService,
    private productoService: ProductoService,
    private ventaService: VentaService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {    
    this.limpiarFormulario();
    this.nuevaVenta.tipoComprobante = this.tiposComprobante[0].value;
    this.nuevaVenta.tipoDocumento = this.tiposDocumento[0].value;
    
  }

  limpiarFormulario(): void {
    this.productoSeleccionado = null;
    this.sugerenciasProductos = [];
    this.cantidadSeleccionada = 1;

    // Inicialización siguiendo VentaCreateDto
    this.nuevaVenta = {
      clienteID:0, 
      clienteNombre:'', 
      tipoComprobante: '',
      numeroComprobante: '',
      tipoDocumento: '',
      esCredito: false,
      fechaRegistro:new Date(),
      total: 0,
      detalles: []
    };

    this.cdr.markForCheck();
  }

  buscarProductos(event: any): void {
  const query = (event.query ?? '').trim();
  
  // 1. Validación de longitud
  if (query.length < 3) {
    this.sugerenciasProductos = [];
    return;
  }
  this.productoService.buscarProductos(query).subscribe({
    next: (res: any) => {
      // 3. Extracción segura de datos
      const datos: ProductoBusquedaDto[] = res?.$values ?? res?.data ?? res ?? [];
      this.sugerenciasProductos = datos.slice(0, 5).map(p => ({
        ...p,
        nombreMostrar: p.stock === 0 ? `${p.nombre} (Sin Stock)` : p.nombre
      }));
      this.cdr.markForCheck();
    },
    error: (err) => {
      console.error('Error al buscar productos:', err);
      this.sugerenciasProductos = [];
    }
  });
}
onProductoSeleccionado(event: any): void {
  // PrimeNG suele enviar el objeto seleccionado en event.value
  // pero si fallara, intentamos capturar el evento directo
  const producto = event.value || event; 

  console.log('Producto recibido en onSelect:', producto); // Verifica esto en F12
  
  if (producto && producto.stock === 0) {
    this.messageService.add({ 
      severity: 'error', 
      summary: 'Producto Agotado',
      life: 2500 
    });
    
    // Limpiamos la selección
    this.productoSeleccionado = null; 
  }
}

  agregarAlCarrito(): void {
  // 1. Validaciones básicas
  if (!this.productoSeleccionado || this.cantidadSeleccionada <= 0) {
    return;
  }

  // 2. Creación del objeto siguiendo estrictamente la interfaz DetalleVentaDto
  const nuevoDetalle: DetalleVentaDto = {
    productoID: this.productoSeleccionado.productoID,
    nombreProducto: this.productoSeleccionado.nombre, // Ahora coincide con el modelo
    cantidad: this.cantidadSeleccionada,
    precioUnitario: this.productoSeleccionado.precio,
    subtotal: this.productoSeleccionado.precio * this.cantidadSeleccionada
  };

  // 3. Agregar al array de detalles
  this.nuevaVenta.detalles.push(nuevoDetalle);

  // 4. Actualizar totales y limpiar
  this.calcularTotal();
  
  // Resetear estado del formulario para el siguiente producto
  this.productoSeleccionado = null;
  this.cantidadSeleccionada = 1;

  // 5. Notificar a Angular sobre el cambio (necesario por el OnPush)
  this.cdr.markForCheck();
}
  quitarDelCarrito(index: number) {
    this.nuevaVenta.detalles.splice(index, 1);
    this.calcularTotal();
    this.cdr.markForCheck();
  }

  calcularTotal(): void {
    this.nuevaVenta.total = this.nuevaVenta.detalles.reduce(
      (acc, item) => acc + item.subtotal, 0
    );
  }

  registrarVenta(): void {
    if (this.nuevaVenta.detalles.length === 0) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Atención', 
        detail: 'Debe agregar al menos un producto.' 
      });
      return;
    }

    this.ventaService.registrar(this.nuevaVenta).subscribe({
      next: () => {
        // Pop-up de éxito
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Éxito', 
          detail: 'Venta registrada correctamente.' 
        });

        // Esperar un poco para que el usuario vea el mensaje antes de navegar
        setTimeout(() => {
          this.router.navigate(['/dashboard']); 
        }, 1500);

        this.limpiarFormulario();
      },
      error: (err) => {
        console.error('Error al registrar:', err);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'No se pudo registrar la venta.' 
        });
      }
    });
  }
}