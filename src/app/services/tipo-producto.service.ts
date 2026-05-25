import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfig } from '../config/config';

// Importamos tanto la entidad (si se necesita para edición completa) como el DTO
import { TipoProducto, TipoProductoDto } from '../models/tipo-producto.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class TipoProductoService {
  private apiUrl = `${AppConfig.API_BASE_URL}/tiposproducto`;

  constructor(private http: HttpClient) { }

  // 1. Obtener clasificaciones activas (usando DTO)
  getActivos(): Observable<TipoProductoDto[]> {
    return this.http.get<ApiResponse<TipoProductoDto[]>>(`${this.apiUrl}/activos`)
      .pipe(map(response => response.data));
  }

  // 2. Registrar o Actualizar (Upsert)
  guardar(tipo: TipoProducto): Observable<TipoProducto> {
    return this.http.post<ApiResponse<TipoProducto>>(`${this.apiUrl}/guardar`, tipo)
      .pipe(map(response => response.data));
  }

  // 3. Deshabilitar (Inactivar)
  deshabilitar(id: number): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}/inactivar`, {});
  }
}