import { ClienteDto } from './cliente.model';

/**
 * Representa un producto dentro de una venta
 */
export interface DetalleVentaDto {
  productoID: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

/**
 * DTO para crear una nueva venta (Maestro-Detalle)
 * Este objeto es el que enviarás al controlador [HttpPost("registrar")]
 */
export interface VentaCreateDto {
  clienteID: number;
  clienteNombre: string; 
  tipoComprobante: string;
  numeroComprobante: string;
  total: number;
  esCredito: boolean;
  fechaRegistro: Date;
  tipoDocumento: string;
  
  // 🚀 NUEVOS CAMPOS DE PAGO
  esEfectivo: boolean;
  montoEfectivo: number | null;
  esDigital: boolean;
  montoDigital: number | null;

  detalles: DetalleVentaDto[];
}

/**
 * DTO para visualizar los detalles completos de una venta
 */
export interface VentaDto {
  ventaID: number;
  clienteID: number;
  cliente?: ClienteDto; 
  nombreCliente:string;
  tipoComprobante: string;
  numeroComprobante: string;
  total: number;
  esCredito: boolean;
  fechaRegistro: Date;

  // 🚀 NUEVOS CAMPOS DE PAGO
  esEfectivo: boolean;
  montoEfectivo: number | null;
  esDigital: boolean;
  montoDigital: number | null;

  detalles: DetalleVentaDto[];
}