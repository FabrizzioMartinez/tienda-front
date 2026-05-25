// src/app/core/models/tipo-producto.model.ts

// Esta es la entidad completa por si la necesitas en algún momento
export interface TipoProducto {
  tipoProductoID: number;
  nombre: string;
  activo: boolean;
}

// Este es el DTO que usaremos en los servicios para que el API sea más ligera
export interface TipoProductoDto {
  tipoProductoID: number;
  nombre: string;
  activo:boolean;
}