import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ProductoService } from '../../services/producto.service';
import { MarcaService } from '../../services/marca.service';
import { VentaService } from '../../services/venta.service';

import { Producto, ProductoBusquedaDto, ProductoDto } from '../../models/producto.model';
import { VentaDto } from '../../models/venta.model';

import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

import { trigger, state, style, transition, animate } from '@angular/animations';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { Toast } from "primeng/toast";
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    FormsModule,
    DialogModule,
    SelectModule,
    DatePickerModule,
    RippleModule,
    ButtonModule,
    AutoCompleteModule,
    InputNumberModule,
    InputTextModule,
    Toast
  ],
  animations: [
    trigger('rowExpansionTrigger', [
      state('collapsed', style({
        height: '0px',
        opacity: 0,
        overflow: 'hidden'
      })),
      state('expanded', style({
        height: '*',
        opacity: 1
      })),
      transition('collapsed <=> expanded', [
        animate('280ms cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ])
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  /* =========================================================
      VIEWCHILD
  ========================================================= */
  @ViewChild('btnCancelar', { static: false })
  btnCancelar!: ElementRef<HTMLButtonElement>;

  /* =========================================================
      KPIs
  ========================================================= */
  totalProductos = 0;
  totalAlertas = 0;
  totalMarcas = 0;
  ventasDia = 0;

  productosCriticos: ProductoDto[] = [];
  sugerenciasProductos: ProductoBusquedaDto[] = [];
  productoSeleccionado: Producto | null = null;

  /* =========================================================
      MODALES Y ENTRADAS DE TRABAJO
  ========================================================= */
  verModalReporte = false;
  stockOriginal: number = 0;
  listaVentasFiltradas: VentaDto[] = [];
  enviarSoloId: boolean = false;
  
  // Controladores para el Modal Pequeño de Actualización de Stock
  verModalStock: boolean = false;
  nuevoProducto: ProductoDto = this.initProducto();
  
  // Propiedad estática para enlazar el valor formateado sin generar bucles en el HTML
  nombreProductoFormateado: string = '';

  /* =========================================================
      EXPANSIÓN DE FILAS
  ========================================================= */
  expandedRows: any = {};

  /* =========================================================
      FILTROS
  ========================================================= */
  filtroReporte = {
    fecha: '',
    fechaHasta: '', // 📅 Sincronizado para el rango de fechas del p-datepicker
    productoId: null as number | null
  };

  // 🔒 Bandera para el control de doble clic concurrente en las acciones del dashboard
  cargando: boolean = false;

  /* =========================================================
      CONSTRUCTOR
  ========================================================= */
  constructor(
    private productoService: ProductoService,
    private marcaService: MarcaService,
    private ventaService: VentaService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private messageService: MessageService
  ) {}

  /* =========================================================
      INIT
  ========================================================= */
  ngOnInit(): void {
    this.cargarResumen();
  }

  /* =========================================================
      MÉTODOS AYUDANTES PARA FECHA PERÚ (EVITA DESFASES)
  ========================================================= */
  private getJavaDatePeru(): Date {
    const stringPeru = new Date().toLocaleString('en-US', { timeZone: 'America/Lima' });
    return new Date(stringPeru);
  }

  private getFechaStringPeru(): string {
    const opciones = { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
    const formateador = new Intl.DateTimeFormat('fr-CA', opciones); 
    return formateador.format(new Date());
  }

  /* =========================================================
      NAVEGACIÓN
  ========================================================= */
  irANuevaVenta(): void {
    this.router.navigate(['/ventas/nueva']);
  }

  /* =========================================================
      TOGGLE ROW
  ========================================================= */
  toggleRow(venta: any): void {
    const key = venta.ventaID;

    if (this.expandedRows[key]) {
      delete this.expandedRows[key];
    } else {
      this.expandedRows = {};
      this.expandedRows[key] = true;
    }

    this.expandedRows = { ...this.expandedRows };
    this.cdr.detectChanges();
  }

  /* =========================================================
      CARGAR RESUMEN
  ========================================================= */
  cargarResumen(): void {
    this.productoService.getProductos().subscribe({
      next: (lista) => {
        this.totalProductos = lista.length;
        this.productosCriticos = lista.filter(p => p.stock <= p.stockMinimo);
        this.totalAlertas = this.productosCriticos.length;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
      }
    });

    this.marcaService.getActivas().subscribe({
      next: (marcas) => {
        this.totalMarcas = marcas.length;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar marcas:', err);
      }
    });

    this.cargarVentasDelDia();
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

  cargarVentasDelDia(): void {
    const hoyPeru = this.getJavaDatePeru();

    this.ventaService
      .getPorFecha(hoyPeru)
      .subscribe({
        next: (ventas: VentaDto[]) => {
          this.ventasDia = ventas.reduce(
            (acumulado, venta) => acumulado + venta.total,
            0
          );
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error al cargar ventas del día:', err);
        }
      });
  }

  /* =========================================================
      MODAL REPORTE
  ========================================================= */
  abrirModalReporte(): void {
    const hoy = this.getFechaStringPeru();
    
    // 1. Inicializamos el filtro con el rango cerrado para el día de hoy
    this.filtroReporte.fecha = hoy;
    this.filtroReporte.fechaHasta = hoy; 
    this.filtroReporte.productoId = null;
    this.listaVentasFiltradas = [];
    
    // 2. Volvemos visible el modal en el DOM
    this.verModalReporte = true;

    // 3. 🌟 SOLUCIÓN: Llamamos inmediatamente a generarReporte()
    // Como las propiedades del filtro ya tienen 'hoy', la función parseará y enviará las dos fechas idénticas al backend
    this.generarReporte();

    // 4. Forzamos la detección de cambios para renderizar la grilla y el foco del botón
    this.cdr.markForCheck();

    setTimeout(() => {
      if (this.btnCancelar && this.btnCancelar.nativeElement) {
        this.btnCancelar.nativeElement.focus();
      }
    }, 250);
  }

  cerrarModalReporte(): void {
    this.verModalReporte = false;
    this.cdr.markForCheck();
    this.sugerenciasProductos = [];
    this.productoSeleccionado = null;
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

  /* =========================================================
      GENERAR REPORTE
  ========================================================= */
  cambiarHistorico(): void {
    if (this.enviarSoloId) {
      this.filtroReporte.fecha = ''; 
      this.filtroReporte.fechaHasta = ''; // Resetea ambas fechas al buscar por ID puro
    }
  }

  generarReporte(): void {
    const parametrosBackend = {
      fechaStr: this.filtroReporte.fecha,
      fechaHastaStr: this.filtroReporte.fechaHasta,
      productoId: this.productoSeleccionado && this.productoSeleccionado.productoID > 0
        ? Number(this.productoSeleccionado.productoID)
        : null
    };

    let fechaDesdeDate: Date | null = null;
    let fechaHastaDate: Date | null = null;
    
    // Parseo seguro de rango de fechas si el switch "Solo producto" no está activo
    if (!this.enviarSoloId) {
      if (parametrosBackend.fechaStr) {
        const [y1, m1, d1] = parametrosBackend.fechaStr.split('-').map(Number);
        fechaDesdeDate = new Date(y1, m1 - 1, d1, 0, 0, 0);
      }
      if (parametrosBackend.fechaHastaStr) {
        const [y2, m2, d2] = parametrosBackend.fechaHastaStr.split('-').map(Number);
        fechaHastaDate = new Date(y2, m2 - 1, d2, 23, 59, 59); // Seteado al último segundo del rango
      }
    }

    // 🌟 CORREGIDO: Ahora pasamos las tres variables en el orden exacto que espera tu servicio HTTP
    this.ventaService
      .getVentasFiltro(fechaDesdeDate, fechaHastaDate, parametrosBackend.productoId) 
      .subscribe({
        next: (ventasDtoLista) => {
          this.listaVentasFiltradas = ventasDtoLista || [];
          this.expandedRows = {}; 
          this.cdr.detectChanges(); // Fuerza la actualización para pintar la grilla de comprobantes
        },
        error: (err) => {
          console.error('❌ Error al recuperar las ventas filtradas:', err);
        }
      });
  }

  /* =========================================================
      ACCIONES: ANULAR VENTA
  ========================================================= */
  anularVenta(ventaId: number): void {
    if (!ventaId || this.cargando) return;

    this.cargando = true;
    this.cdr.markForCheck();

    this.ventaService.anular(ventaId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Anulación Exitosa',
          detail: 'La venta ha sido anulada y el stock fue restaurado.'
        });
        
        this.cargando = false;
        this.generarReporte();
        this.cargarResumen();
      },
      error: (err) => {
        console.error('Error al anular la venta:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.mensaje || 'No se pudo procesar la anulación de la venta.'
        });
        
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  descargarBoleta(ventaId: number): void {
  if (!ventaId || this.cargando) return;

  this.cargando = true;
  this.cdr.markForCheck();

  this.ventaService.getVentaPorId(ventaId).subscribe({
    next: (venta: VentaDto) => {
      if (!venta) {
        throw new Error('La API respondió con datos vacíos.');
      }

      // 1. Cálculo Dinámico de Altura (Añadimos espacio para las líneas de IGV y Subtotal)
      const anchoTicket = 80;
      const altoBase = 105; // Incrementado ligeramente para el desglose fiscal
      const altoPorProducto = 10; 
      const altoTotal = altoBase + (venta.detalles.length * altoPorProducto);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [anchoTicket, altoTotal]
      });

      let y = 12; 
      const margenX = 6;
      const derechaX = anchoTicket - margenX;

      // 2. ENCABEZADO: VersLun Store
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42); 
      doc.text('VersLun Store', anchoTicket / 2, y, { align: 'center' });
      
      y += 5;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); 
      doc.text('--- COMPROBANTE ELECTRÓNICO ---', anchoTicket / 2, y, { align: 'center' });
      
      y += 5;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`${venta.tipoComprobante.toUpperCase()} N° ${venta.numeroComprobante}`, anchoTicket / 2, y, { align: 'center' });

      y += 6;
      // 3. BLOQUE DE INFORMACIÓN
      doc.setDrawColor(226, 232, 240); 
      doc.setLineWidth(0.3);
      doc.line(margenX, y, derechaX, y); 

      y += 5;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85); 
      
      const fechaFormateada = new Date(venta.fechaRegistro).toLocaleString('es-PE', { timeZone: 'America/Lima' });
      const clienteFinal = (!venta.nombreCliente || venta.nombreCliente.toLowerCase() === 'undefined') 
        ? 'Público General' 
        : venta.nombreCliente;

      doc.text(`Fecha de Emisión : ${fechaFormateada}`, margenX, y);
      y += 4.5;
      doc.text(`Cliente          : ${clienteFinal}`, margenX, y);

      y += 4;
      doc.line(margenX, y, derechaX, y); 
      
      y += 5;
      // 4. CABECERA DE LA TABLA
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); 
      
      doc.text('DESCRIPCIÓN', margenX, y);
      doc.text('CANT', margenX + 38, y, { align: 'center' });
      doc.text('P.U.', margenX + 50, y, { align: 'right' });
      doc.text('TOTAL', derechaX, y, { align: 'right' });

      y += 2.5;
      doc.line(margenX, y, derechaX, y); 

      // 5. LISTADO DE PRODUCTOS
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      
      venta.detalles.forEach(d => {
        y += 5.5;
        doc.setTextColor(15, 23, 42); 
        
        let nombreProducto = d.nombreProducto;
        if (nombreProducto.length > 20) {
          nombreProducto = nombreProducto.substring(0, 18) + '..';
        }
        
        doc.text(nombreProducto, margenX, y);
        
        doc.setTextColor(71, 85, 105); 
        doc.text(d.cantidad.toString(), margenX + 38, y, { align: 'center' });
        doc.text(`S/ ${d.precioUnitario.toFixed(2)}`, margenX + 50, y, { align: 'right' });
        
        doc.setTextColor(15, 23, 42); 
        doc.text(`S/ ${d.subtotal.toFixed(2)}`, derechaX, y, { align: 'right' });
      });

      y += 5;
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.setDrawColor(148, 163, 184); 
      doc.line(margenX, y, derechaX, y);
      
      y += 6;
      // 6. 🇵🇪 SECCIÓN FISCAL: DESGLOSE DE IGV (18%)
      doc.setLineDashPattern([], 0); 
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);

      // Fórmulas de desglose peruano
      const gravada = venta.total / 1.18;
      const igv = venta.total - gravada;

      doc.text('Op. Gravada:', margenX, y);
      doc.text(`S/ ${gravada.toFixed(2)}`, derechaX, y, { align: 'right' });
      
      y += 4.5;
      doc.text('IGV (18%):', margenX, y);
      doc.text(`S/ ${igv.toFixed(2)}`, derechaX, y, { align: 'right' });
      
      y += 5.5;
      doc.line(margenX, y, derechaX, y); // Separador previo al total

      y += 5;
      // 7. TOTAL NETO DESTACADO
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('TOTAL GENERAL:', margenX, y);
      doc.text(`S/ ${venta.total.toFixed(2)}`, derechaX, y, { align: 'right' });

      y += 6;
      // 8. MÉTODOS DE PAGO UTILIZADOS
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      if (venta.esEfectivo) {
        doc.text(`Pago en Efectivo: S/ ${venta.montoEfectivo?.toFixed(2)}`, margenX, y);
        y += 4;
      }
      if (venta.esDigital) {
        doc.text(`Pago Digital: S/ ${venta.montoDigital?.toFixed(2)}`, margenX, y);
        y += 4;
      }

      // 9. PIE DE PÁGINA
      y += 10;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184); 
      doc.text('¡Gracias por su preferencia!', anchoTicket / 2, y, { align: 'center' });

      // 🚀 Exportar PDF original
      doc.save(`Boleta_${venta.numeroComprobante || ventaId}.pdf`);

      this.messageService.add({
        severity: 'success',
        summary: 'Descarga Completada',
        detail: 'Boleta con desglose de IGV (18%) generada con éxito.'
      });

      this.cargando = false;
      this.cdr.markForCheck();
    },
    error: (err) => {
      console.error('❌ Error al generar el PDF con IGV:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo procesar el desglose fiscal.'
      });
      this.cargando = false;
      this.cdr.markForCheck();
    }
  });
}

  /* =========================================================
      CÁLCULOS DEL REPORTE
  ========================================================= */
  calcularTotalEfectivo(): number {
    if (!this.listaVentasFiltradas) return 0;
    return this.listaVentasFiltradas
      .filter(v => v.esEfectivo)
      .reduce((sum, v) => sum + (v.montoEfectivo || v.total || 0), 0);
  }

  calcularTotalDigital(): number {
    if (!this.listaVentasFiltradas) return 0;
    return this.listaVentasFiltradas
      .filter(v => v.esDigital)
      .reduce((sum, v) => sum + (v.montoDigital || v.total || 0), 0);
  }

  calcularTotalGeneral(): number {
    if (!this.listaVentasFiltradas) return 0;
    return this.listaVentasFiltradas.reduce((sum, v) => sum + (v.total || 0), 0);
  }

  /* =========================================================
      ACTUALIZACIÓN RÁPIDA DE STOCK (NUEVO FORMULARIO)
  ========================================================= */
  editarProducto(id: number): void {    
    this.productoService.getById(id).subscribe({
      next: (producto) => {
        if (producto) {
          this.stockOriginal = producto.stock ?? 0;
          
          this.nuevoProducto = {
            ...(producto as unknown as ProductoDto),
            stockMinimo: producto.stockMinimo ?? 0,
            nombreMarca: (producto as any).nombreMarca || '',
            nombreTipo: (producto as any).nombreTipo || '',
            tipoProducto: (producto as any).tipoProducto || '',
            unidadMedida: (producto as any).unidadMedida || '',
            abreviatura: (producto as any).abreviatura || ''
          }; 
          
          this.nuevoProducto.stock = 0; 

          // Seteamos la cadena de texto limpia una sola vez para inyectar al ngModel del HTML
          this.nombreProductoFormateado = this.nuevoProducto.nombre + 
            (this.nuevoProducto.abreviatura ? ' - ' + this.nuevoProducto.abreviatura : '');

          this.verModalStock = true;
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('❌ Error al recuperar el detalle:', err)
    });
  }

  guardarStockRapido(): void {    
    const cantidadAIngresar = this.nuevoProducto.stock ?? 0;  
    
    if (cantidadAIngresar <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acción Inválida',
        detail: 'La cantidad a adicionar debe ser mayor a cero.'
      });
      return;
    }   

    const stockFinalCalculado = this.stockOriginal + cantidadAIngresar;  
    const productoId = this.nuevoProducto.productoID || (this.nuevoProducto as any).id;  

    this.productoService.actualizarStock(productoId, stockFinalCalculado).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: '¡Operación Exitosa!',
          detail: `El inventario se actualizó correctamente. Se agregaron +${cantidadAIngresar} unidades. Total: ${stockFinalCalculado}`,
          life: 4000
        });
        
        this.cerrarModalStock();
        this.cargarResumen(); 
      },
      error: (err) => {
        console.error('❌ Error al actualizar parcialmente el stock:', err);
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error de Servidor',
          detail: 'No se pudo guardar la nueva cantidad en el sistema. Inténtelo nuevamente.',
          life: 5000
        });
      }
    });
  }

  cerrarModalStock(): void {
    this.verModalStock = false;
    this.nuevoProducto = this.initProducto();
    this.nombreProductoFormateado = '';
    this.cdr.detectChanges();
  }

  /* =========================================================
      INITIALIZADORES DE CONTROL
  ========================================================= */
  initProducto(): ProductoDto {
    return {
      productoID: 0,
      nombre: '',
      stock: 0,
      precio: 0,
      stockMinimo: 0, 
      nombreMarca: '',
      nombreTipo: '',
      tipoProducto: '',
      unidadMedida: '',
      abreviatura: ''
    };
  }
}