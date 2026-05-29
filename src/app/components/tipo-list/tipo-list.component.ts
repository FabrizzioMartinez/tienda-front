import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TipoProductoService } from '../../services/tipo-producto.service';
import { TipoProducto, TipoProductoDto } from '../../models/tipo-producto.model';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-tipo-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: './tipo-list.component.html',
  styleUrl: './tipo-list.component.css',
})
export class TipoListComponent implements OnInit {
  // Ahora usamos el DTO para el listado
  listaTipos: TipoProductoDto[] = []; 
  // Entidad completa para el formulario de registro/edición
  nuevoTipo: TipoProducto = { tipoProductoID: 0, nombre: '', activo: true };

  verModal: boolean = false;
  terminoBusqueda: string = '';
  mostrarToast: boolean = false;
  mensajeToast: string = '';

  constructor(
    private tipoProductoService: TipoProductoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarTipos();
  }

  // Actualizado para llamar al nuevo método del servicio
  cargarTipos(): void {
    this.tipoProductoService.getActivos().subscribe({
      next: (data) => {
        this.listaTipos = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar clasificaciones:', err)
    });
  }

  // Getter actualizado para usar el DTO
  get tiposFiltrados(): TipoProductoDto[] {
    if (!this.terminoBusqueda.trim()) {
      return this.listaTipos;
    }
    return this.listaTipos.filter(t => 
      t.nombre.toLowerCase().includes(this.terminoBusqueda.toLowerCase())
    );
  }

  // Actualizado para llamar a guardar()
  registrarTipo(): void {
    if (!this.nuevoTipo.nombre.trim()) return;

    this.tipoProductoService.guardar(this.nuevoTipo).subscribe({
      next: () => {
        this.mostrarMensaje('Clasificación registrada con éxito');
        this.cerrarModal(); // 🧼 Usamos el método unificado para cerrar y limpiar limpito
        this.cargarTipos();
      },
      error: (err) => console.error('Error al registrar:', err)
    });
  }

  // Método auxiliar reutilizable
  private mostrarMensaje(mensaje: string): void {
    this.mensajeToast = mensaje;
    this.mostrarToast = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.mostrarToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  // 🧼 Método optimizado para cerrar el modal y resetear la entidad de forma segura
  cerrarModal(): void {
    this.verModal = false;
    this.nuevoTipo = { tipoProductoID: 0, nombre: '', activo: true }; // Resetea con la estructura correcta
    this.cdr.markForCheck();
  }
}