// src/app/core/models/unidad-medida.model.ts

export interface UnidadMedida {
  unidadMedidaID: number;
  nombre: string;       
  abreviatura: string;  
  activo: boolean;
}

// Este es el objeto optimizado para el listado (frontend)
export interface UnidadMedidaDto {
  unidadMedidaID: number;
  nombre: string;
  abreviatura: string;
  activo: boolean;
}