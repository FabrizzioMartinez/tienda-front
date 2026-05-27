import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { ClienteService } from '../../services/cliente.service';
import { ClienteDto } from '../../models/cliente.model';
import { MaestroService } from '../../services/maestro.service';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './cliente-list.component.html',
  styleUrl: './cliente-list.component.css'
})
export class ClienteListComponent implements OnInit {

  clientes: ClienteDto[] = [];
  displayModal: boolean = false;

  // 🔥 1. Inicializamos con una función diferida o vacía para evitar el error del constructor
  nuevoCliente!: ClienteDto;

  // 👈 Aseguramos que arranque como arreglo vacío para evitar 'undefined'
  tiposDocumento: any[] = []; 

  constructor(
    private clienteService: ClienteService,
    private maestroService: MaestroService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    // 🔥 2. Ejecutamos la inicialización básica segura aquí
    this.nuevoCliente = this.initCliente();
  }

  ngOnInit(): void {
    this.cargarTiposDocumento(); // 👈 Carga el catálogo maestro desde PostgreSQL
    this.cargarClientes();
  }

  // =========================
  // INIT CLIENTE (Corregido y blindado)
  // =========================
  private initCliente(): ClienteDto {
    // 🔍 Validamos de manera segura si la propiedad existe y tiene elementos
    const defecto = (this.tiposDocumento && this.tiposDocumento.length > 0) 
      ? this.tiposDocumento[0].value 
      : ''; // Si el API no ha respondido, inicia temporalmente en vacío para no romper Angular
    
    return {
      clienteID: 0,
      nombreRazonSocial: '',
      numeroDocumento: '',
      tipoDocumentoCode: defecto, 
      tipoDocumentoTexto: '',
      email: '',
      telefono: ''
    };
  }

  // =========================
  // CARGAR CATÁLOGO MAESTRO (BD)
  // =========================
  cargarTiposDocumento(): void {
  this.maestroService.obtenerDetallesPorCodigo('TIPO_DOC').subscribe({
    next: (data) => {
      
      // 💡 Forzamos a que se ejecute justo después de que Angular termine de chequear el HTML
      setTimeout(() => {
        this.tiposDocumento = data.map(d => ({
          label: d.code,
          value: d.valor 
        }));
        
        if (this.nuevoCliente.clienteID === 0 && this.tiposDocumento.length > 0) {
          this.nuevoCliente.tipoDocumentoCode = this.tiposDocumento[0].value;
        }
        
        this.cdr.detectChanges(); // Le avisamos a Angular que dibuje los nuevos valores
      });

    },
    error: (err) => console.error(err)
  });
}
// =========================
  // OPTIMIZACIÓN DE TABLA
  // =========================
  trackByClienteId(index: number, cliente: ClienteDto): number {
    return cliente.clienteID;
  }

  // =========================
  // LISTAR CLIENTES
  // =========================
  cargarClientes(): void {
    this.clienteService.listar().subscribe({
      next: (data: ClienteDto[]) => {
        setTimeout(() => {
          this.clientes = data ?? [];
          this.cdr.detectChanges(); 
        });
      },
      error: (err) => {
        console.error('Error cargando clientes:', err);
        this.clientes = [];

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los clientes',
          life: 3000
        });
      }
    });
  }

  // =========================
  // MODAL / ACCIONES
  // =========================
  abrirModal(): void {
    this.nuevoCliente = this.initCliente();
    this.displayModal = true;
  }

  editarCliente(cliente: ClienteDto): void {
    this.nuevoCliente = { ...cliente };
    this.displayModal = true;
  }

  cerrarModal(): void {
    this.displayModal = false;
  }

  // =========================
  // GUARDAR / ACTUALIZAR CLIENTE
  // =========================
  guardarCliente(): void {
    this.clienteService.registrar(this.nuevoCliente).subscribe({
      next: (res: any) => {

        if (!res) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Sin respuesta del servidor',
            life: 3000
          });
          return;
        }

        if (res.success === false) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Validación',
            detail: res.message,
            life: 3000
          });
          return;
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: res.message || 'Operación realizada correctamente',
          life: 3000
        });

        this.displayModal = false;

        setTimeout(() => {
          this.cargarClientes();
        });
      },

      error: (err) => {
        if (err?.status === 409 || err?.status === 400) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: err?.error?.message || 'Hubo un problema con los datos del cliente',
            life: 3000
          });
          return;
        }

        console.error('Error inesperado:', err);

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ocurrió un error inesperado',
          life: 3000
        });
      }
    });
  }
}