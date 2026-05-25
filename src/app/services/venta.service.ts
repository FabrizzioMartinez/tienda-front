import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // Asegúrate de importar HttpParams
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfig } from '../config/config';
import { VentaDto, VentaCreateDto } from '../models/venta.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class VentaService {
  private apiUrl = `${AppConfig.API_BASE_URL}/ventas`;

  constructor(private http: HttpClient) { }

  /**
   * Registra una nueva venta.
   */
  registrar(venta: VentaCreateDto): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/registrar`, venta)
      .pipe(map(response => response.data));
  }

  /**
   * Obtiene las ventas de una fecha específica.
   * @param fecha Objeto Date de JavaScript
   */
  getPorFecha(fecha: Date): Observable<VentaDto[]> {
    // Convertimos la fecha a formato ISO (YYYY-MM-DD) para que C# la reciba correctamente
    const fechaFormateada = fecha.toISOString().split('T')[0];
    
    // Usamos HttpParams para enviar la fecha como query parameter
    const params = new HttpParams().set('fecha', fechaFormateada);

    return this.http.get<ApiResponse<VentaDto[]>>(`${this.apiUrl}/por-fecha`, { params })
      .pipe(map(response => response.data));
  }
}