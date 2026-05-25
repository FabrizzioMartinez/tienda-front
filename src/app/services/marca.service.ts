import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfig } from '../config/config';

// Importaciones de modelos con las rutas que definimos según tu estructura de carpetas
import { MarcaDto } from '../models/marca.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class MarcaService {
  // Construcción de la URL base para el controlador de marcas
  private apiUrl = `${AppConfig.API_BASE_URL}/marcas`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la lista de marcas que están marcadas como activas en el sistema.
   * Utiliza el DTO para asegurar que solo recibimos los campos necesarios.
   */
  getActivas(): Observable<MarcaDto[]> {
    return this.http.get<ApiResponse<MarcaDto[]>>(`${this.apiUrl}/activas`)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Registra una nueva marca o actualiza una existente.
   * Espera un objeto de tipo MarcaDto y devuelve el resultado guardado.
   */
  guardar(marca: MarcaDto): Observable<MarcaDto> {
    return this.http.post<ApiResponse<MarcaDto>>(`${this.apiUrl}/guardar`, marca)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Realiza un borrado lógico de una marca en la base de datos
   * pasando el estado 'activo' a false.
   */
  deshabilitar(id: number): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}/deshabilitar`, {});
  }
}