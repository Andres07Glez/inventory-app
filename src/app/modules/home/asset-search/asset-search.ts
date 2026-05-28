import { Component, inject, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { AssetSearchResult } from '../../../core/models/asset-assignment.model';
import { AssetSearchService } from '../../../core/services/assetSearch/AssetSearchService.service';
import { AutoCompleteCompleteEvent } from 'primeng/types/autocomplete';
import { AutoCompleteModule } from 'primeng/autocomplete';

type PrimeSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;

@Component({
  selector: 'app-asset-search-input',
  standalone: true,
  imports: [FormsModule, AutoCompleteModule, TagModule],
  templateUrl: './asset-search.html',
  styleUrl:    './asset-search.scss',
})
export class AssetSearchInput {
 
  /** Valor enlazable con ngModel desde el padre */
  readonly value    = model<AssetSearchResult | null>(null);
  readonly disabled = input<boolean>(false);
  readonly placeholder = input<string>('Buscar por núm. inventario, descripción o serie…');
 
  /** Emite cada vez que el usuario selecciona un bien */
  readonly assetSelected = output<AssetSearchResult>();
  /** Emite cuando el usuario limpia la selección */
  readonly assetCleared  = output<void>();
 
  private readonly searchService = inject(AssetSearchService);
 
  readonly suggestions = signal<AssetSearchResult[]>([]);
  readonly searching   = signal(false);
 
  onSearch(event: AutoCompleteCompleteEvent): void {
    const q = event.query?.trim();
    if (!q || q.length < 2) {
      this.suggestions.set([]);
      return;
    }
    this.searching.set(true);
    this.searchService.search(q).subscribe({
      next: results => { this.suggestions.set(results); this.searching.set(false); },
      error: ()      => { this.suggestions.set([]);    this.searching.set(false); },
    });
  }
 
  onSelect(asset: AssetSearchResult): void {
    this.value.set(asset);
    this.assetSelected.emit(asset);
  }
 
  onClear(): void {
    this.value.set(null);
    this.assetCleared.emit();
  }
 
  getConditionSeverity(status: string): string {
    const map: Record<string, string> = { GOOD: 'success', REGULAR: 'warn', BAD: 'danger' };
    return map[status] ?? 'secondary';
  }
 
  getConditionLabel(status: string): string {
    const map: Record<string, string> = { GOOD: 'Bueno', REGULAR: 'Regular', BAD: 'Malo' };
    return map[status] ?? status;
  }
  
  getSeverity(status: string): PrimeSeverity {
  switch (status) {
    case 'ACTIVO': 
      return 'success';
    case 'MANTENIMIENTO': 
      return 'warn';
    case 'BAJA': 
      return 'danger';
    default: 
      return 'info';
  }
}

}
