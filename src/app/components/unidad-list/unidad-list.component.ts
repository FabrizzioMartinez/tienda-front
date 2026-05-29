import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UnidadMedidaService } from '../../services/unidad-medida.service';
import { UnidadMedida, UnidadMedidaDto } from '../../models/unidad-medida.model';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-unidad-list',
  standalone: true,
  imports: [CommonModule, FormsModule,TableModule],
  templateUrl: './unidad-list.component.html',
  styleUrl: './unidad-list.component.css',
})
export class UnidadListComponent implements OnInit {
  // Ahora usamos DTO para el listado, más eficiente
  listaUnidades: UnidadMedidaDto[] = [];
  // Entidad completa para el formulario de registro
  nuevaUnidad: UnidadMedida = { unidadMedidaID: 0, nombre: '', abreviatura: '', activo: true };

  verModal: boolean = false;
  terminoBusqueda: string = '';
  mostrarToast: boolean = false;
  mensajeToast: string = '';

  constructor(
    private unidadService: UnidadMedidaService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.cargarUnidades();
  }

  // Actualizado para llamar a getTodas()
  cargarUnidades(): void {
    this.unidadService.getTodas().subscribe({
      next: (data) => {
        this.listaUnidades = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar unidades:', err)
    });
  }

  // Getter actualizado para filtrar el DTO
  get unidadesFiltradas(): UnidadMedidaDto[] {
    if (!this.terminoBusqueda.trim()) {
      return this.listaUnidades;
    }
    return this.listaUnidades.filter(u => 
      u.nombre.toLowerCase().includes(this.terminoBusqueda.toLowerCase())
    );
  }

  // Actualizado para llamar a guardar()
  registrarUnidad(): void {
    if (!this.nuevaUnidad.nombre.trim() || !this.nuevaUnidad.abreviatura.trim()) return;

    this.unidadService.guardar(this.nuevaUnidad).subscribe({
      next: () => {
        this.verModal = false;
        this.mostrarMensaje('Unidad registrada con éxito');
        this.nuevaUnidad = { unidadMedidaID: 0, nombre: '', abreviatura: '', activo: true };
        this.cargarUnidades();
      },
      error: (err) => console.error('Error al registrar:', err)
    });
  }
  // 🧼 Método para cerrar el formulario y resetear limpiamente todos los campos
  cerrarModal(): void {
    this.verModal = false;
    this.nuevaUnidad = { 
      unidadMedidaID: 0, 
      nombre: '', 
      abreviatura: '', 
      activo: true 
    };
    this.cdr.markForCheck();
  }

  // Método auxiliar para no repetir código de Toast
  private mostrarMensaje(mensaje: string): void {
    this.mensajeToast = mensaje;
    this.mostrarToast = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.mostrarToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }
}