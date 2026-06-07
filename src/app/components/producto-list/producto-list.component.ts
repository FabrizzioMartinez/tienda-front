import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener // 🌟 Importado para el atajo de teclado F2
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Servicios y Modelos
import { ProductoService } from '../../services/producto.service';
import { MarcaService } from '../../services/marca.service';
import { TipoProductoService } from '../../services/tipo-producto.service';
import { UnidadMedidaService } from '../../services/unidad-medida.service';

import { Producto, ProductoDto } from '../../models/producto.model';
import { MarcaDto } from '../../models/marca.model';
import { TipoProductoDto } from '../../models/tipo-producto.model';
import { UnidadMedidaDto } from '../../models/unidad-medida.model';

import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { AutoCompleteModule } from 'primeng/autocomplete';

@Component({
  selector: 'app-producto-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush, 
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    DialogModule,
    SelectModule,
    ButtonModule,
    InputNumberModule,
    AutoCompleteModule
  ],
  templateUrl: './producto-list.component.html',
  styleUrl: './producto-list.component.css',
})
export class ProductoListComponent implements OnInit {
  /* =========================================================
      CATÁLOGOS Y LISTAS MAESTRAS
  ========================================================= */
  listaProductos: ProductoDto[] = []; 
  listaMarcas: MarcaDto[] = [];
  listaTipos: TipoProductoDto[] = [];
  listaUnidades: UnidadMedidaDto[] = [];

  /* =========================================================
      MODAL: GESTIÓN INTEGRAL (CREAR / EDITAR COMPLETO)
  ========================================================= */
  verModal: boolean = false;
  esEdicion: boolean = false;
  nuevoProducto: Producto = this.initProducto();

  /* =========================================================
      🌟 PROPIEDADES PARA LOS COMPONENTS AUTOCOMPLETE
  ========================================================= */
  // Modelos visuales tipados como any para asimilar estados de texto transitorios
  marcaSeleccionada: any = null;
  categoriaSeleccionada: any = null;
  unidadSeleccionada: any = null;

  // Listas dinámicas de sugerencias filtradas en tiempo real
  sugerenciasMarcas: MarcaDto[] = [];
  sugerenciasCategorias: TipoProductoDto[] = [];
  sugerenciasUnidades: UnidadMedidaDto[] = [];

  /* =========================================================
      ESTADOS COMUNES
  ========================================================= */
  terminoBusqueda: string = '';
  mostrarToast: boolean = false;
  mensajeToast: string = '';

  constructor(
    private productoService: ProductoService,
    private marcaService: MarcaService,
    private tipoService: TipoProductoService,
    private unidadService: UnidadMedidaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  /* =========================================================
      🌟 ESCUCHADOR DE TECLADO GLOBAL (ATAJO F2)
  ========================================================= */
  @HostListener('window:keydown', ['$event'])
  manejarAtajoTeclado(event: KeyboardEvent): void {
    if (event.key === 'F2') {
      event.preventDefault(); // Evita conflictos con funciones nativas del navegador

      if (!this.verModal) {
        this.esEdicion = false; // Forzamos creación de ficha técnica limpia
        this.verModal = true;
        this.cdr.detectChanges(); // Fuerza renderizado inmediato en ChangeDetection OnPush
      }
    }
  }

  /* =========================================================
      CARGA DE DATOS
  ========================================================= */
  cargarDatos(): void {
    this.productoService.getProductos().subscribe({
      next: (data) => {
        this.listaProductos = data || [];
        this.cdr.markForCheck(); 
      },
      error: (err) => console.error(err)
    });
    
    this.marcaService.getActivas().subscribe({
      next: (data) => {
        this.listaMarcas = data || [];
        this.cdr.markForCheck(); 
      },
      error: (err) => console.error(err)
    });

    this.tipoService.getActivos().subscribe({
      next: (data) => {
        this.listaTipos = data || [];
        this.cdr.markForCheck();
      },
      error: (err) => console.error(err)
    });

    this.unidadService.getTodas().subscribe({
      next: (data) => {
        this.listaUnidades = data || [];
        this.cdr.markForCheck();
      },
      error: (err) => console.error(err)
    });
  }

  get productosFiltrados(): ProductoDto[] {
    if (!this.terminoBusqueda.trim()) return this.listaProductos;
    const busqueda = this.terminoBusqueda.toLowerCase();
    return this.listaProductos.filter(p => p.nombre.toLowerCase().includes(busqueda));
  }

  /* =========================================================
      🌟 MÉTODOS DE FILTRADO REACTIVO PARA AUTOCOMPLETE
  ========================================================= */
  filtrarMarcas(event: any): void {
    const query = (event.query || '').toLowerCase();
    this.sugerenciasMarcas = this.listaMarcas.filter(m => 
      m.nombre.toLowerCase().includes(query)
    );
  }

  filtrarCategorias(event: any): void {
    const query = (event.query || '').toLowerCase();
    this.sugerenciasCategorias = this.listaTipos.filter(c => 
      c.nombre.toLowerCase().includes(query)
    );
  }

  filtrarUnidades(event: any): void {
    const query = (event.query || '').toLowerCase();
    this.sugerenciasUnidades = this.listaUnidades.filter(u => 
      u.nombre.toLowerCase().includes(query) || 
      (u.abreviatura && u.abreviatura.toLowerCase().includes(query))
    );
  }

  /* =========================================================
      ACCIONES: FORMULARIO PRINCIPAL (GUARDAR / REGISTRAR)
  ========================================================= */
  registrarProducto(): void {
    if (!this.nuevoProducto.nombre?.trim()) return;

    this.nuevoProducto.nombre = this.nuevoProducto.nombre
      .trim()
      .toLowerCase()
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ');

    this.nuevoProducto.fechaModificacion = new Date();
    
    this.productoService.guardar(this.nuevoProducto).subscribe({
      next: () => {
        const mensaje = this.esEdicion ? 'Producto actualizado con éxito' : 'Producto guardado exitosamente';
        this.mostrarMensaje(mensaje);
        this.cerrarModal(); 
        this.cargarDatos();
      },
      error: (err) => console.error('Error al guardar:', err)
    });
  }

  /* =========================================================
      MÉTODO DE EDICIÓN ADAPTADO A AUTOCOMPLETE
  ========================================================= */
  editarProducto(id: number): void {    
    this.productoService.getById(id).subscribe({
      next: (productoDto) => {
        if (productoDto) {
          this.esEdicion = true;

          // 1. Mapeamos la entidad Producto para el envío final de datos
          this.nuevoProducto = {
            productoID: productoDto.productoID,
            nombre: productoDto.nombre,
            precio: productoDto.precio,
            stock: productoDto.stock,
            stockMinimo: productoDto.stockMinimo,
            activo: true,
            fechaModificacion: new Date(),
            marcaID: productoDto.marcaID ?? undefined,        
            tipoProductoID: productoDto.tipoProductoID ?? undefined, 
            unidadMedidaID: productoDto.unidadMedidaID ?? undefined  
          };

          // 2. Reconstruimos los objetos seleccionados para que el AutoComplete pinte los textos
          if (productoDto.marcaID) {
            this.marcaSeleccionada = this.listaMarcas.find(m => m.marcaID === productoDto.marcaID) || {
              marcaID: productoDto.marcaID,
              nombre: productoDto.nombreMarca || ''
            };
          }

          if (productoDto.tipoProductoID) {
            this.categoriaSeleccionada = this.listaTipos.find(c => c.tipoProductoID === productoDto.tipoProductoID) || {
              tipoProductoID: productoDto.tipoProductoID,
              nombre: productoDto.nombreTipo || productoDto.tipoProducto || ''
            };
          }

          if (productoDto.unidadMedidaID) {
            this.unidadSeleccionada = this.listaUnidades.find(u => u.unidadMedidaID === productoDto.unidadMedidaID) || {
              unidadMedidaID: productoDto.unidadMedidaID,
              nombre: productoDto.unidadMedida || '',
              abreviatura: productoDto.abreviatura || ''
            };
          }

          // 🔓 Abrimos el diálogo integral y forzamos renderizado inmediato
          this.verModal = true;
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('❌ Error al recuperar la ficha del producto:', err)
    });
  }

  /* =========================================================
      AYUDANTES Y TOAST
  ========================================================= */
  private mostrarMensaje(mensaje: string): void {
    this.mensajeToast = mensaje;
    this.mostrarToast = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.mostrarToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  cerrarModal(): void {
    this.verModal = false;
    this.esEdicion = false; 
    this.nuevoProducto = this.initProducto();

    // Reseteamos de forma segura las variables de control del AutoComplete
    this.marcaSeleccionada = null;
    this.categoriaSeleccionada = null;
    this.unidadSeleccionada = null;
    this.sugerenciasMarcas = [];
    this.sugerenciasCategorias = [];
    this.sugerenciasUnidades = [];

    this.cdr.detectChanges();
  }

  transformarTitleCase(valor: string): void {
    if (!valor) {
      this.nuevoProducto.nombre = '';
      return;
    }

    this.nuevoProducto.nombre = valor
      .split(' ')
      .map(palabra => {
        if (!palabra) return '';
        return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
      })
      .join(' ');

    this.cdr.markForCheck();
  }

  /* =========================================================
      INICIALIZADORES DE ENTIDADES
  ========================================================= */
  private initProducto(): Producto {
    return {
      productoID: 0,
      nombre: '',
      precio: 0,
      stock: 0,
      stockMinimo: 0,
      activo: true,
      fechaModificacion: new Date(),
      marcaID: undefined,        
      tipoProductoID: undefined, 
      unidadMedidaID: undefined  
    };
  }
}