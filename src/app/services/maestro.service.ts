import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfig } from '../config/config'; // 👈 Tus imports estándar
import { MaestroTablaDetalleDto } from '../models/maestro-tabla-detalle.model'; // Ajusta la ruta a tus modelos

@Injectable({
  providedIn: 'root'
})
export class MaestroService {
  
  // Usamos el AppConfig tal como lo haces en tus otros servicios
  private apiUrl = `${AppConfig.API_BASE_URL}/maestros`; 

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la lista de opciones de un catálogo maestro (Ej: 'TIPO_DOC')
   */
  obtenerDetallesPorCodigo(codigo: string): Observable<MaestroTablaDetalleDto[]> {
    return this.http.get<MaestroTablaDetalleDto[]>(`${this.apiUrl}/detalles/${codigo}`).pipe(
      map((response: MaestroTablaDetalleDto[]) => {
        // Por si necesitas ordenar, mutar o transformar los datos antes de enviarlos al componente
        return response;
      })
    );
  }
}