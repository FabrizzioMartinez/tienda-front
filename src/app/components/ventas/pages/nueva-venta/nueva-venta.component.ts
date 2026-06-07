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
import { CheckboxModule } from 'primeng/checkbox';

import { ProductoService } from '../../../../services/producto.service';
import { VentaService } from '../../../../services/venta.service';
import { MaestroService } from '../../../../services/maestro.service';
import { Producto, ProductoBusquedaDto } from '../../../../models/producto.model';
import { DetalleVentaDto, VentaCreateDto } from '../../../../models/venta.model';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';

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
    RouterModule,
    DialogModule,
    TableModule
  ],
  templateUrl: './nueva-venta.component.html'
})
export class NuevaVentaComponent implements OnInit {

  productoSeleccionado: Producto | null = null;
  sugerenciasProductos: ProductoBusquedaDto[] = [];
  cantidadSeleccionada: number = 1;

  nuevaVenta!: VentaCreateDto;

  tiposComprobante: any[] = [];
  tiposDocumento: any[] = [];

  // 🚀 Variables de estado exclusivas para el comportamiento de la interfaz
  esBoletaSimple: boolean = true;
  esMixto: boolean = false;
  dineroRecibido: number | null = null;
  
  // 🔒 Bandera de control para prevenir el doble clic accidental
  cargando: boolean = false;

  constructor(
    private messageService: MessageService,
    private productoService: ProductoService,
    private ventaService: VentaService,
    private maestroService: MaestroService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {    
    this.limpiarFormulario();
    this.cargarTiposDocumento();
    this.cargarTiposComprobante();
  }

  limpiarFormulario(): void {
    this.productoSeleccionado = null;
    this.sugerenciasProductos = [];
    this.cantidadSeleccionada = 1;
    this.esBoletaSimple = true;
    this.esMixto = false;
    this.dineroRecibido = null;
    this.cargando = false; // Se asegura de desbloquear la interfaz al limpiar

    this.nuevaVenta = {
      clienteID: 0, 
      clienteNombre: '', 
      tipoComprobante: '',
      numeroComprobante: '',
      tipoDocumento: '',
      esCredito: false,
      fechaRegistro: new Date(),
      total: 0,
      esEfectivo: false,
      montoEfectivo: null,
      esDigital: false,
      montoDigital: null,
      detalles: []
    };

    if (this.tiposDocumento.length > 0) {
      this.nuevaVenta.tipoDocumento = this.tiposDocumento[0].value;
    }
    if (this.tiposComprobante.length > 0) {
      this.nuevaVenta.tipoComprobante = this.tiposComprobante[0].value;
    }

    this.cdr.markForCheck();
  }

  // 🧮 Cálculo automático del vuelto basado en el desglose real de efectivo (Simple o Mixto)
  get vuelto(): number {
    if (!this.dineroRecibido || !this.nuevaVenta.montoEfectivo) return 0;
    const cambio = this.dineroRecibido - this.nuevaVenta.montoEfectivo;
    return cambio > 0 ? cambio : 0;
  }

  cargarTiposDocumento(): void {
    this.maestroService.obtenerDetallesPorCodigo('TIPO_DOC').subscribe({
      next: (data) => {
        setTimeout(() => {
          this.tiposDocumento = data.map(d => ({
            label: d.code,
            value: d.valor 
          }));
          
          if (this.nuevaVenta.clienteID === 0 && this.tiposDocumento.length > 0) {
            this.nuevaVenta.tipoDocumento = this.tiposDocumento[0].value;
          }
          
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error(err)
    });
  }

  cargarTiposComprobante(): void {
    this.maestroService.obtenerDetallesPorCodigo('TIPO_COMP').subscribe({
      next: (data) => {
        setTimeout(() => {
          this.tiposComprobante = data.map(d => ({
            label: d.texto,
            value: d.valor 
          }));
          
          if (this.tiposComprobante.length > 0) {
            this.nuevaVenta.tipoComprobante = this.tiposComprobante[0].value;
          }
          
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error(err)
    });
  }

  buscarProductos(event: any): void {
    const query = (event.query ?? '').trim();
    
    if (query.length < 3) {
      this.sugerenciasProductos = [];
      return;
    }

    this.productoService.buscarProductos(query).subscribe({
      next: (res: any) => {
        const datos: ProductoBusquedaDto[] = res?.$values ?? res?.data ?? res ?? [];
        this.sugerenciasProductos = datos.slice(0, 5).map(p => {
          const tamanoTexto = p.tamaño ? ` - ${p.tamaño}` : '';
          const baseNombre = `${p.nombre}${tamanoTexto}`;

          return {
            ...p,
            nombreMostrar: p.stock === 0 ? `${baseNombre} (Sin Stock)` : baseNombre
          };
        });
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al buscar productos:', err);
        this.sugerenciasProductos = [];
      }
    });
  }

  obtenerLabelComprobante(): string {
    const comprobante = this.tiposComprobante.find(t => t.value === this.nuevaVenta.tipoComprobante);
    return comprobante ? comprobante.label.toUpperCase() : '-';
  }

  onProductoSeleccionado(event: any): void {
    const producto = event.value || event; 
    
    if (producto && producto.stock === 0) {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Producto Agotado',
        life: 2500 
      });
      
      this.productoSeleccionado = null; 
    }
  }

  agregarAlCarrito(): void {
    if (!this.productoSeleccionado || this.cantidadSeleccionada <= 0) {
      return;
    }

    const nuevoDetalle: DetalleVentaDto = {
      productoID: this.productoSeleccionado.productoID,
      nombreProducto: this.productoSeleccionado.nombre, 
      cantidad: this.cantidadSeleccionada,
      precioUnitario: this.productoSeleccionado.precio,
      subtotal: this.productoSeleccionado.precio * this.cantidadSeleccionada
    };

    this.nuevaVenta.detalles.push(nuevoDetalle);

    this.calcularTotal();
    
    this.productoSeleccionado = null;
    this.cantidadSeleccionada = 1;

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

    this.actualizarCamposPago();
  }

  actualizarCamposPago(tipo?: string): void {
    if (this.nuevaVenta.esCredito) {
      this.esMixto = false;
      this.nuevaVenta.esEfectivo = false;
      this.nuevaVenta.montoEfectivo = null;
      this.nuevaVenta.esDigital = false;
      this.nuevaVenta.montoDigital = null;
      this.dineroRecibido = null;
      this.cdr.markForCheck();
      return;
    }

    if (tipo === 'mixto') {
      if (this.esMixto) {
        this.nuevaVenta.esEfectivo = true;
        this.nuevaVenta.esDigital = true;
        this.nuevaVenta.montoEfectivo = this.nuevaVenta.total;
        this.nuevaVenta.montoDigital = 0;
      } else {
        this.nuevaVenta.esEfectivo = false;
        this.nuevaVenta.esDigital = false;
        this.nuevaVenta.montoEfectivo = null;
        this.nuevaVenta.montoDigital = null;
        this.dineroRecibido = null;
      }
      this.cdr.markForCheck();
      return;
    }

    if (tipo === 'efectivo') {
      this.esMixto = false;
      if (this.nuevaVenta.esEfectivo) {
        this.nuevaVenta.esDigital = false;
        this.nuevaVenta.montoDigital = null;
        this.nuevaVenta.montoEfectivo = this.nuevaVenta.total;
      } else {
        this.nuevaVenta.montoEfectivo = null;
        this.dineroRecibido = null;
      }
      this.cdr.markForCheck();
      return;
    }

    if (tipo === 'digital') {
      this.esMixto = false;
      this.dineroRecibido = null;
      if (this.nuevaVenta.esDigital) {
        this.nuevaVenta.esEfectivo = false;
        this.nuevaVenta.montoEfectivo = null;
        this.nuevaVenta.montoDigital = this.nuevaVenta.total;
      } else {
        this.nuevaVenta.montoDigital = null;
      }
      this.cdr.markForCheck();
      return;
    }

    if (this.esMixto) {
      if (tipo === 'montoEfectivo') {
        const efectivo = this.nuevaVenta.montoEfectivo ?? 0;
        this.nuevaVenta.montoDigital = Math.max(0, this.nuevaVenta.total - efectivo);
      } else if (tipo === 'montoDigital') {
        const digital = this.nuevaVenta.montoDigital ?? 0;
        this.nuevaVenta.montoEfectivo = Math.max(0, this.nuevaVenta.total - digital);
      }
    } else {
      if (this.nuevaVenta.esEfectivo) {
        this.nuevaVenta.montoEfectivo = this.nuevaVenta.total;
      } else if (this.nuevaVenta.esDigital) {
        this.nuevaVenta.montoDigital = this.nuevaVenta.total;
      }
    }
    this.cdr.markForCheck();
  }

  registrarVenta(): void {
    // 1. Detener ejecución inmediata si ya se encuentra procesando la petición
    if (this.cargando) return;

    if (this.nuevaVenta.detalles.length === 0) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Atención', 
        detail: 'Debe agregar al menos un producto.' 
      });
      return;
    }

    if (this.esBoletaSimple) {
      this.nuevaVenta.numeroComprobante = '00000000';
    }

    if (!this.nuevaVenta.esCredito) {
      const efectivo = this.nuevaVenta.montoEfectivo ?? 0;
      const digital = this.nuevaVenta.montoDigital ?? 0;

      if ((efectivo + digital) !== this.nuevaVenta.total) {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error de Pago', 
          detail: 'Los montos ingresados (Efectivo + Digital) deben sumar exactamente el total.' 
        });
        return;
      }
    }

    // 2. Bloquear controlador e indicar a OnPush que actualice la vista (Button disabled/loading)
    this.cargando = true;
    this.cdr.markForCheck();

    this.ventaService.registrar(this.nuevaVenta).subscribe({
      next: () => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Éxito', 
          detail: 'Venta registrada correctamente.' 
        });

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
        
        // 3. Desbloquear estado para permitir corregir o reintentar en caso de fallo del servidor
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }
}