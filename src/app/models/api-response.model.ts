// src/app/core/models/api-response.model.ts
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
}

// src/app/core/models/marca.model.ts
export interface MarcaDto {
  marcaID: number;
  nombre: string;
}