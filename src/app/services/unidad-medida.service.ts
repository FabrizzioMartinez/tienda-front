import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfig } from '../config/config';
import { UnidadMedida, UnidadMedidaDto } from '../models/unidad-medida.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class UnidadMedidaService {
  private apiUrl = `${AppConfig.API_BASE_URL}/unidadesmedida`;

  constructor(private http: HttpClient) { }

  // Obtiene todas las unidades (usando DTO para optimizar)
  getTodas(): Observable<UnidadMedidaDto[]> {
    return this.http.get<ApiResponse<UnidadMedidaDto[]>>(`${this.apiUrl}`)
      .pipe(map(response => response.data));
  }

  // Registra o Actualiza
  guardar(unidad: UnidadMedida): Observable<UnidadMedida> {
    return this.http.post<ApiResponse<UnidadMedida>>(`${this.apiUrl}/guardar`, unidad)
      .pipe(map(response => response.data));
  }
}