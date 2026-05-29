import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './producto-list.component.html',
  styleUrl: './producto-list.component.css',
})
export class ProductoListComponent implements OnInit {
  listaProductos: ProductoDto[] = []; // Usamos el DTO de lista
  listaMarcas: MarcaDto[] = [];
  listaTipos: TipoProductoDto[] = [];
  listaUnidades: UnidadMedidaDto[] = [];

  nuevoProducto: Producto = this.initProducto();
  
  verModal: boolean = false;
  terminoBusqueda: string = '';
  mostrarToast: boolean = false;
  mensajeToast: string = '';
  esEdicion: boolean = false;

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

  cargarDatos(): void {
    // 1. Cargar productos con DTO
    this.productoService.getProductos().subscribe(data => {
      this.listaProductos = data || [];
      this.cdr.detectChanges();
    });
    
    // 2. Cargar catálogos relacionales
    this.marcaService.getActivas().subscribe(data => this.listaMarcas = data);
    this.tipoService.getActivos().subscribe(data => this.listaTipos = data);
    this.unidadService.getTodas().subscribe(data => this.listaUnidades = data);
  }

  get productosFiltrados(): ProductoDto[] {
    if (!this.terminoBusqueda.trim()) return this.listaProductos;
    return this.listaProductos.filter(p => 
      p.nombre.toLowerCase().includes(this.terminoBusqueda.toLowerCase())
    );
  }

  registrarProducto(): void {
    if (!this.nuevoProducto.nombre?.trim()) return;

    this.nuevoProducto.fechaModificacion = new Date();
    
    this.productoService.guardar(this.nuevoProducto).subscribe({
      next: () => {
        this.mostrarMensaje('Producto guardado exitosamente');
        this.cerrarModal(); // 🧼 Cierra el modal y limpia de raíz cajas y selectores relacionales
        this.cargarDatos();
      },
      error: (err) => console.error('Error al guardar:', err)
    });
  }

  editarProducto(id: number): void {
    this.productoService.getById(id).subscribe(producto => {
      this.nuevoProducto = { ...producto };
      
      // 🚀 Envolvemos el cambio de estado en un setTimeout para solucionar el NG0100
      setTimeout(() => {
        this.esEdicion = true;
        this.verModal = true;
        this.cdr.detectChanges(); // Le avisamos a Angular que dibuje el modal en el próximo ciclo
      });
      
    });
  }

  private mostrarMensaje(mensaje: string): void {
    this.mensajeToast = mensaje;
    this.mostrarToast = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.mostrarToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  // 📦 Inicializador base estructurado de la entidad Producto
  private initProducto(): Producto {
    return {
      productoID: 0,
      nombre: '',
      precio: 0,
      stock: 0,
      stockMinimo: 0,
      activo: true,
      fechaModificacion: new Date(),
      marcaID: undefined,        // 👈 Inicializado en undefined para resetear los placeholders del HTML
      tipoProductoID: undefined, // 👈 Inicializado en undefined para resetear los placeholders del HTML
      unidadMedidaID: undefined  // 👈 Inicializado en undefined para resetear los placeholders del HTML
    };
  }

  // 🧼 Cierra y limpia por completo el formulario relacional de productos
  cerrarModal(): void {
  this.verModal = false;
  this.esEdicion = false; // 👈 Reseteamos el modo edición a falso
  this.nuevoProducto = this.initProducto();
  this.cdr.markForCheck();
}
}