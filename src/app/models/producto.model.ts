// src/app/core/models/producto.model.ts

// 1. DTO para la búsqueda rápida (ej. barra de autocompletado)
export interface ProductoBusquedaDto {
  productoID: number;
  nombre: string;
  precio: number;
  stock: number;
  tamaño: string;
}

// 2. DTO para la gestión detallada (ej. tabla principal de inventario)
export interface ProductoDto {
  productoID: number;
  nombre: string;
  precio: number;
  stock: number;
  nombreMarca: string;
  nombreTipo: string;
  tipoProducto: string;
  unidadMedida: string;
  abreviatura: string;
  stockMinimo: number;

  // 🌟 Campos relacionales declarados como opcionales / nullables
  marcaID?: number | null;
  tipoProductoID?: number | null;
  unidadMedidaID?: number | null;
}

// 3. Entidad completa (Úsala solo para formularios de registro o edición profunda)
export interface Producto {
  productoID: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  stockMinimo: number;
  activo: boolean;
  marcaID?: number;
  tipoProductoID?: number;
  unidadMedidaID?: number;
  valorVolumen?: number;
  fechaModificacion: Date;
}