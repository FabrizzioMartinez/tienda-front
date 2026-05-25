import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfig } from '../config/config';

// Importaciones de modelos
import { ClienteDto } from '../models/cliente.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  // Construcción de la URL base para el controlador de clientes
  private apiUrl = `${AppConfig.API_BASE_URL}/clientes`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la lista completa de clientes registrados.
   */
  listar(): Observable<ClienteDto[]> {
  return this.http.get<any>(`${this.apiUrl}`)
    .pipe(
      map(res => res?.data ?? [])
    );
}

  /**
   * Registra un nuevo cliente en el sistema.
   */
  registrar(cliente: ClienteDto): Observable<ApiResponse<ClienteDto>> {
  return this.http.post<ApiResponse<ClienteDto>>(
    `${this.apiUrl}/registrar`,
    cliente
  );
}
}