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

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
    

    // 2. Cargar catálogos
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
    this.nuevoProducto.fechaModificacion = new Date();
    
    this.productoService.guardar(this.nuevoProducto).subscribe({
      next: () => {
        this.verModal = false;
        this.mostrarMensaje('Producto guardado exitosamente');
        this.nuevoProducto = this.initProducto();
        this.cargarDatos();
      },
      error: (err) => console.error('Error al guardar:', err)
    });
  }

  editarProducto(id: number): void {
    this.productoService.getById(id).subscribe(producto => {
      this.nuevoProducto = { ...producto };
      this.verModal = true;
      this.cdr.detectChanges();
    });
  }

  private mostrarMensaje(mensaje: string): void {
    this.mensajeToast = mensaje;
    this.mostrarToast = true;
    setTimeout(() => this.mostrarToast = false, 3000);
  }

  private initProducto(): Producto {
    return {
      productoID: 0, nombre: '', precio: 0, stock: 0, stockMinimo: 0,
      activo: true, fechaModificacion: new Date()
    };
  }
}