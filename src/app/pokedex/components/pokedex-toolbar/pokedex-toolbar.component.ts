import { Component, input, output, computed } from '@angular/core';

@Component({
    selector: 'app-pokedex-toolbar',
    standalone: true,
    template: `
    <div class="pokedex-toolbar">
        <div class="pokedex-toolbar__left">
            <div class="pokedex-toolbar__search-wrapper">
                <span class="pokedex-toolbar__search-icon">⌕</span>
                <input class="pokedex-toolbar__search-input" placeholder="Search by name" [value]="search" (input)="onSearch($event)"/>
                <button aria-label="Clear search" class="pokedex-toolbar__clear-button" (click)="onClearSearch()">×</button>
            </div>
            <div class="pokedex-toolbar__select-wrapper">
                <select class="pokedex-toolbar__select" [value]="selectedType" (change)="onTypeChange($event)">
                    <option value="all">All types</option>
                    <option value="grass">Grass</option>
                    <option value="fire">Fire</option>
                    <option value="water">Water</option>
                    <option value="poison">Poison</option>
                    <option value="flying">Flying</option>
                    <option value="electric">Electric</option>
                    <option value="bug">Bug</option>
                </select>
            </div>
        </div>
        <div class="pokedex-toolbar__right">
            <span class="pokedex-toolbar__counter">{{ counterText() }}</span>
            <div class="pokedex-toolbar__select-wrapper">
                <select class="pokedex-toolbar__page-size" [value]="pageSize().toString()" (change)="onPageSizeChange($event)">
                    <option value="10">10 per page</option>
                    <option value="25">25 per page</option>
                    <option value="50">50 per page</option>
                </select>
            </div>
        </div>
      </div>
    `
})
export class PokedexToolbarComponent {
    readonly totalResults = input<number>(0);
    readonly pageSize = input<number>(10);

    readonly searchChanged = output<string>();
    readonly typeChanged = output<string>();
    readonly pageSizeChanged = output<number>();

    search = '';
    selectedType = 'all';

    readonly counterText = computed(() => {
        const total = this.totalResults();
        if (total === 0) {
            return 'Showing 0 of 0';
        }
        const currentSize = this.pageSize();
        const currentPage = this.page();
        const start = (currentPage - 1) * currentSize + 1;
        const end = Math.min(currentPage * currentSize, total);
        return `Showing ${start}-${end} of ${total}`;
    });

    onSearch(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.search = value;
        this.searchChanged.emit(value);
    }

    onClearSearch(): void {
        this.search = '';
        this.searchChanged.emit('');
    }

    onTypeChange(event: Event): void {
        const value = (event.target as HTMLSelectElement).value;
        this.selectedType = value;
        this.typeChanged.emit(value);
    }

    onPageSizeChange(event: Event): void {
        const value = Number((event.target as HTMLSelectElement).value);
        this.pageSizeChanged.emit(value);
    }
}