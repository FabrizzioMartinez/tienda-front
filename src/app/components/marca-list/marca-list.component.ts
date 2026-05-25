import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarcaService } from '../../services/marca.service';
import { MarcaDto } from '../../models/marca.model';

@Component({
  selector: 'app-marca-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './marca-list.component.html',
  styleUrl: './marca-list.component.css',
})
export class MarcaListComponent implements OnInit {
  listaMarcas: MarcaDto[] = [];
  nuevaMarca: MarcaDto = { marcaID: 0, nombre: '', activo: true };
  
  verModal: boolean = false;
  verModalConfirmar: boolean = false;
  terminoBusqueda: string = '';
  mostrarToast: boolean = false;
  mensajeToast: string = '';
  idMarcaParaEliminar: number | null = null;

  constructor(
    private marcaService: MarcaService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.cargarMarcas();
  }

  // Getter para el buscador (Requerido por tu HTML)
  get marcasFiltradas(): MarcaDto[] {
    if (!this.terminoBusqueda.trim()) {
      return this.listaMarcas;
    }
    return this.listaMarcas.filter(m => 
      m.nombre.toLowerCase().includes(this.terminoBusqueda.toLowerCase())
    );
  }

  cargarMarcas(): void {
    this.marcaService.getActivas().subscribe({
      next: (data) => {
        this.listaMarcas = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar marcas:', err)
    });
  }

  registrarMarca(): void {
    if (!this.nuevaMarca.nombre.trim()) return;

    this.marcaService.guardar(this.nuevaMarca).subscribe({
      next: () => {
        this.verModal = false; 
        this.mostrarMensaje('Registro exitoso');
        this.nuevaMarca = { marcaID: 0, nombre: '' ,activo: true};
        this.cargarMarcas();
      },
      error: (err) => console.error('Error al registrar:', err)
    });
  }

  solicitarConfirmacion(id: number): void {
    if (!id) return;
    this.idMarcaParaEliminar = id;
    this.verModalConfirmar = true;
  }

  confirmarEliminacion(): void {
    if (!this.idMarcaParaEliminar) return;

    this.marcaService.deshabilitar(this.idMarcaParaEliminar).subscribe({
      next: () => {
        this.verModalConfirmar = false;
        this.idMarcaParaEliminar = null;
        this.mostrarMensaje('Marca deshabilitada exitosamente');
        this.cargarMarcas();
      },
      error: (err) => console.error('Error al deshabilitar:', err)
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
}