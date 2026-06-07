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

  // Obtener fecha en zona horaria de Perú
  const fechaPeru = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(fecha);

  // en-CA devuelve YYYY-MM-DD
  const params = new HttpParams().set('fecha', fechaPeru);

  return this.http
    .get<ApiResponse<VentaDto[]>>(`${this.apiUrl}/por-fecha`, { params })
    .pipe(map(response => response.data));
}

getVentasFiltro(fecha: Date | null, fechaHasta: Date | null, productoId?: number | null): Observable<VentaDto[]> {
  let params = new HttpParams();

  // 🕒 Formateador regional para asegurar que la fecha mantenga la zona horaria de Perú
  const formateadorPeru = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  // 1. Seteamos Fecha Desde (fecha)
  if (fecha) {
    const fechaInicioPeru = formateadorPeru.format(fecha);
    params = params.set('fecha', fechaInicioPeru);
  }

  // 2. 📅 NUEVO: Seteamos Fecha Hasta (fechaHasta)
  if (fechaHasta) {
    const fechaFinPeru = formateadorPeru.format(fechaHasta);
    params = params.set('fechaHasta', fechaFinPeru);
  }

  // 3. Seteamos el ID del Producto
  if (productoId && productoId > 0) {
    params = params.set('productoId', productoId.toString());
  }

  // 🚀 CRÍTICO: Agregado el retorno del HTTP GET mapeando la estructura de tu API C# ({ data: ... })
  return this.http.get<{ data: VentaDto[] }>(`${this.apiUrl}/filtrar`, { params })
    .pipe(
      map(response => response.data || [])
    );
}
anular(id: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/anular/${id}`);
}
}