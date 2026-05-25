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

  nuevoCliente: ClienteDto = this.initCliente();

  tiposDocumento = [
    { label: 'DNI', value: 'DNI' },
    { label: 'RUC', value: 'RUC' },
    { label: 'CE', value: 'CE' },
    { label: 'PAS', value: 'PAS' }
  ];

  constructor(
    private clienteService: ClienteService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  // =========================
  // INIT CLIENTE
  // =========================
  private initCliente(): ClienteDto {
    return {
      clienteID: 0,
      nombreRazonSocial: '',
      numeroDocumento: '',
      tipoDocumento: '',
      email: '',
      telefono: ''
    };
  }

  // =========================
  // LISTAR CLIENTES
  // =========================
  cargarClientes(): void {
    this.clienteService.listar().subscribe({
      next: (data: ClienteDto[]) => {

        this.clientes = data ?? [];

        // 🔥 FIX REAL NG0100 (PrimeNG + Angular sync)
        this.cdr.detectChanges();
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
  // MODAL
  // =========================
  abrirModal(): void {
    this.nuevoCliente = this.initCliente();
    this.displayModal = true;
  }

  cerrarModal(): void {
    this.displayModal = false;
  }

  // =========================
  // GUARDAR CLIENTE
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
          detail: 'Cliente registrado correctamente',
          life: 3000
        });

        this.displayModal = false;

        // 🔥 recarga segura sin NG0100
        setTimeout(() => {
          this.cargarClientes();
        });
      },

      error: (err) => {

        if (err?.status === 409) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Duplicado',
            detail: err?.error?.message || 'Ya existe un cliente con ese documento',
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