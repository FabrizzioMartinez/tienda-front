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
    AutoCompleteModule
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
      MODAL REPORTE
  ========================================================= */
  verModalReporte = false;
  listaVentasFiltradas: VentaDto[] = [];
  enviarSoloId: boolean = false;

  /* =========================================================
      EXPANSIÓN DE FILAS
  ========================================================= */
  expandedRows: any = {};

  /* =========================================================
      FILTROS
  ========================================================= */
  filtroReporte = {
    fecha: '',
    productoId: null as number | null
  };

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

  /**
   * Obtiene un objeto Date nativo seteado exactamente en la hora de Perú
   */
  private getJavaDatePeru(): Date {
    const stringPeru = new Date().toLocaleString('en-US', { timeZone: 'America/Lima' });
    return new Date(stringPeru);
  }

  /**
   * Retorna la fecha de Perú formateada directamente en "YYYY-MM-DD"
   */
  private getFechaStringPeru(): string {
    const opciones = { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
    const formateador = new Intl.DateTimeFormat('fr-CA', opciones); // 'fr-CA' entrega YYYY-MM-DD de forma nativa
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
    // PRODUCTOS
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

    // MARCAS
    this.marcaService.getActivas().subscribe({
      next: (marcas) => {
        this.totalMarcas = marcas.length;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar marcas:', err);
      }
    });

    // VENTAS DEL DÍA
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

  /* =========================================================
      VENTAS DEL DÍA (USANDO ZONA HORARIA LIMA)
  ========================================================= */
  cargarVentasDelDia(): void {
    // Corregido: Ya no usa la hora local del dispositivo del cliente
    const hoyPeru = this.getJavaDatePeru();

    this.ventaService
      .getPorFecha(hoyPeru)
      .subscribe({
        next: (ventas) => {
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
      ABRIR MODAL (SETEA FILTRO EN FECHA PERÚ)
  ========================================================= */
  abrirModalReporte(): void {
    // Corregido: Ya no usa .toISOString() que causaba saltos de día no deseados
    this.filtroReporte.fecha = this.getFechaStringPeru();
    this.filtroReporte.productoId = null;
    this.listaVentasFiltradas = [];
    this.verModalReporte = true;
    this.cdr.markForCheck();

    // Evitar foco automático en el calendario
    setTimeout(() => {
      if (this.btnCancelar && this.btnCancelar.nativeElement) {
        this.btnCancelar.nativeElement.focus();
      }
    }, 250);
  }

  /* =========================================================
      CERRAR MODAL
  ========================================================= */
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
      this.filtroReporte.fecha = ''; // Cambiado de null a cadena vacía
    }
  }
  generarReporte(): void {
    

    const parametrosBackend = {
      fechaStr: this.filtroReporte.fecha,
      // Extraemos el ID directamente del objeto seleccionado por el AutoComplete
      productoId: this.productoSeleccionado && this.productoSeleccionado.productoID > 0
        ? Number(this.productoSeleccionado.productoID)
        : null
    };

    // REGLA NUEVA: Si el check "enviarSoloId" está activo, limpiamos la fecha (la mandamos null)
    // De lo contrario, calculamos la fecha normal sin desfases.
    let fechaDate: Date | null = null;
    
    if (!this.enviarSoloId) {
      const [year, month, day] = parametrosBackend.fechaStr.split('-').map(Number);
      fechaDate = new Date(year, month - 1, day, 0, 0, 0);
    } else {
      console.log('Búsqueda por ID puro: Se limpia el filtro de fecha.');
    }

    // Enviamos fechaDate (que puede ser Date o null) junto al ID del producto
    this.ventaService
      .getVentasFiltro(fechaDate, parametrosBackend.productoId)
      .subscribe({
        next: (ventasDtoLista) => {
          this.listaVentasFiltradas = ventasDtoLista || [];
          this.expandedRows = {}; // Reset de la fila expandida
          this.cdr.detectChanges(); // Forzamos actualización de vista con OnPush
        },
        error: (err) => {
          console.error('Error al recuperar ventas:', err);
        }
      });
  }
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
}