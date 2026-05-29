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

import { ProductoDto } from '../../models/producto.model';
import { VentaDto } from '../../models/venta.model';

import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-dashboard',
  standalone: true,
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
    ButtonModule
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
        animate('280ms cubic-bezier(0.4, 0, 0.2, 1)') // 👈 Curva de aceleración de Apple/Google
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

  /* =========================================================
      MODAL REPORTE
  ========================================================= */

  verModalReporte = false;

  listaVentasFiltradas: VentaDto[] = [];

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
    private router: Router
  ) {}

  /* =========================================================
      INIT
  ========================================================= */

  ngOnInit(): void {

    this.cargarResumen();

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

    // cerrar si ya está abierto
    if (this.expandedRows[key]) {

      delete this.expandedRows[key];

    } else {

      // modo single
      this.expandedRows = {};

      this.expandedRows[key] = true;

    }

    // 🔥 IMPORTANTE PARA ONPUSH
    this.expandedRows = { ...this.expandedRows };

    // 🔥 FORZAR RENDER
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

        this.productosCriticos =
          lista.filter(p => p.stock <= p.stockMinimo);

        this.totalAlertas =
          this.productosCriticos.length;

        this.cdr.markForCheck();

      },

      error: (err) => {

        console.error(
          'Error al cargar productos:',
          err
        );

      }

    });

    // MARCAS

    this.marcaService.getActivas().subscribe({

      next: (marcas) => {

        this.totalMarcas = marcas.length;

        this.cdr.markForCheck();

      },

      error: (err) => {

        console.error(
          'Error al cargar marcas:',
          err
        );

      }

    });

    // VENTAS DEL DÍA

    this.cargarVentasDelDia();

  }

  /* =========================================================
      VENTAS DEL DÍA
  ========================================================= */

  cargarVentasDelDia(): void {

    const hoy = new Date();

    this.ventaService
      .getPorFecha(hoy)
      .subscribe({

        next: (ventas) => {

          this.ventasDia =
            ventas.reduce(
              (acumulado, venta) =>
                acumulado + venta.total,
              0
            );

          this.cdr.markForCheck();

        },

        error: (err) => {

          console.error(
            'Error al cargar ventas del día:',
            err
          );

        }

      });

  }

  /* =========================================================
      ABRIR MODAL
  ========================================================= */

  abrirModalReporte(): void {

    const hoy =
      new Date()
        .toISOString()
        .split('T')[0];

    this.filtroReporte.fecha = hoy;

    this.filtroReporte.productoId = null;

    this.listaVentasFiltradas = [];

    this.verModalReporte = true;

    this.cdr.markForCheck();

    // evitar foco automático calendario

    setTimeout(() => {

      if (
        this.btnCancelar &&
        this.btnCancelar.nativeElement
      ) {

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

  }

  /* =========================================================
      GENERAR REPORTE
  ========================================================= */

  generarReporte(): void {

    if (!this.filtroReporte.fecha) {

      console.warn(
        'Debe seleccionar una fecha válida.'
      );

      return;

    }

    const parametrosBackend = {

      fechaStr: this.filtroReporte.fecha,

      productoId:
        this.filtroReporte.productoId &&
        this.filtroReporte.productoId > 0
          ? Number(this.filtroReporte.productoId)
          : null

    };

    const [year, month, day] =
      parametrosBackend.fechaStr
        .split('-')
        .map(Number);

    const fechaDate =
      new Date(
        year,
        month - 1,
        day,
        0,
        0,
        0
      );

    this.ventaService
      .getVentasFiltro(
        fechaDate,
        parametrosBackend.productoId
      )
      .subscribe({

        next: (ventasDtoLista) => {

          this.listaVentasFiltradas =
            ventasDtoLista || [];
            

        

          // reset expansión
          this.expandedRows = {};

          this.cdr.detectChanges();

        },

        error: (err) => {

          console.error(
            'Error al recuperar ventas:',
            err
          );

        }

      });

  }

}
