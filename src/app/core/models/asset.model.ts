export class Asset {
    public id!: number; // BIGINT UNSIGNED
    
    // Identificadores
    public inventoryNumber!: string; // INV-2026-00001
    public barcode?: string; // Opcional en BD

    // Descripción
    public description!: string; // NOT NULL
    public brand?: string;  //marca
    public model?: string;  
    public serialNumber?: string;
    public notes?: string;

    // Relaciones (IDs de los catálogos)
    public categoryId!: number; // FK a categories
    public locationId?: number; // Puede ser NULL si no tiene ubicación
    public invoiceId?: number;  // FK a invoices

    // Fechas (Se manejan como string en formato YYYY-MM-DD para los inputs de tipo date)
    public invoiceDate?: string; 
    public entryDate!: string; // NOT NULL

    // Estados (Basados en tus ENUMS)
    public conditionStatus: 'GOOD' | 'REGULAR' | 'BAD' = 'GOOD';
    public lifecycleStatus: 'REGISTERED' | 'AVAILABLE' | 'ASSIGNED' | 'IN_MAINTENANCE' | 'IN_WARRANTY' | 'DECOMMISSIONED' = 'REGISTERED';

    // Auditoría
    public createdAt?: string;
    public updatedAt?: string;
    public createdBy!: number; // ID del usuario que registra
    public updatedBy!: number;

    constructor() {
        // Puedes inicializar valores por defecto si lo deseas
    }
}