export interface Cliente {
  clienteID: number;
  nombreRazonSocial: string;
  numeroDocumento: string;
  tipoDocumento: string;
  email?: string;
  telefono?: string;
}

// Ahora usamos el nombre ClienteDto para reflejar exactamente 
// lo que viaja desde tu API (C# DTO) hacia el cliente.
export interface ClienteDto {
  clienteID: number;
  nombreRazonSocial: string;
  numeroDocumento: string;
  tipoDocumentoCode: string;  // 👈 Cambiado aquí
  tipoDocumentoTexto: string; // 👈 Cambiado aquí
  email?: string;
  telefono?: string;
}