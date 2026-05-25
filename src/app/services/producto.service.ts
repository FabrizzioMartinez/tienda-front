import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfig } from '../config/config';
import { ApiResponse } from '../models/api-response.model';
import { Producto, ProductoDto, ProductoBusquedaDto } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = `${AppConfig.API_BASE_URL}/productos`; 

  constructor(private http: HttpClient) { }

  // 1. Apunta a la nueva ruta /listado
  getProductos(): Observable<ProductoDto[]> {
    return this.http.get<ApiResponse<ProductoDto[]>>(`${this.apiUrl}/listado`)
      .pipe(map(response => response.data));
  }

  // 2. Apunta a la ruta /buscar (query ya viene en el parámetro)
  buscarProductos(query: string): Observable<ProductoBusquedaDto[]> {
    return this.http.get<ApiResponse<ProductoBusquedaDto[]>>(`${this.apiUrl}/buscar?q=${query}`)
      .pipe(map(response => response.data));
  }

  // 3. Crear o actualizar (ruta /guardar)
  guardar(producto: Producto): Observable<Producto> {
    return this.http.post<ApiResponse<Producto>>(`${this.apiUrl}/guardar`, producto)
      .pipe(map(response => response.data));
  }

  // 4. Apunta a la nueva ruta /detalle/{id}
  getById(id: number): Observable<Producto> {
    return this.http.get<ApiResponse<Producto>>(`${this.apiUrl}/detalle/${id}`)
      .pipe(map(response => response.data));
  }
}