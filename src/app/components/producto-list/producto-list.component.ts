import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
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
    InputNumberModule
  ],
  templateUrl: './producto-list.component.html',
  styleUrl: './producto-list.component.css',
})
export class ProductoListComponent implements OnInit {
  /* =========================================================
      CATÁLOGOS Y LISTAS
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
      MÉTODO CORREGIDO: EDICIÓN COMPLETA DEL MAESTRO
  ========================================================= */
  editarProducto(id: number): void {    
    this.productoService.getById(id).subscribe({
      next: (productoDto) => {
        if (productoDto) {
          // 🔄 Seteamos el estado para que el formulario se configure en modo Edición
          this.esEdicion = true;

          // 🌟 Mapeamos del DTO plano que nos da la API hacia la entidad Producto del formulario
          this.nuevoProducto = {
            productoID: productoDto.productoID,
            nombre: productoDto.nombre,
            precio: productoDto.precio,
            stock: productoDto.stock,
            stockMinimo: productoDto.stockMinimo,
            activo: true,
            fechaModificacion: new Date(),
            // Extraemos los IDs que van a alimentar los p-select mapeados por "optionValue"
            marcaID: (productoDto as any).marcaID,        
            tipoProductoID: (productoDto as any).tipoProductoID, 
            unidadMedidaID: (productoDto as any).unidadMedidaID  
          };

          // 🔓 Abrimos el diálogo integral y forzamos renderizado para evitar desajustes en PrimeNG
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