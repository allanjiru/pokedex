import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({ selector: 'app-pokedex-toolbar', standalone: true, template: `
  <div class="pokedex-toolbar">
    <div class="pokedex-toolbar__left">
      <div class="pokedex-toolbar__search-wrapper"><span class="pokedex-toolbar__search-icon">⌕</span><input class="pokedex-toolbar__search-input" placeholder="Search by name" [value]="search" (input)="onSearch($any($event.target).value)"/><button aria-label="Clear search" class="pokedex-toolbar__clear-button" (click)="onSearch('')">×</button></div>
      <div class="pokedex-toolbar__select-wrapper"><select class="pokedex-toolbar__select" [value]="selectedType" (change)="selectedType = $any($event.target).value; typeChanged.emit(selectedType)"><option value="all">All types</option><option value="grass">Grass</option><option value="fire">Fire</option><option value="water">Water</option><option value="poison">Poison</option><option value="flying">Flying</option><option value="electric">Electric</option><option value="bug">Bug</option></select></div>
    </div>
    <div class="pokedex-toolbar__right"><span class="pokedex-toolbar__counter">Showing 1-{{ Math.min(pageSize, totalResults) }} of {{ totalResults || 0 }}</span><div class="pokedex-toolbar__select-wrapper"><select class="pokedex-toolbar__page-size" [(value)]="pageSize"><option [value]="10">10 per page</option><option [value]="25">25 per page</option><option [value]="50">50 per page</option></select></div></div>
  </div>
` })
export class PokedexToolbarComponent {
  @Input() totalResults = 0; @Output() searchChanged = new EventEmitter<string>(); @Output() typeChanged = new EventEmitter<string>();
  search = ''; selectedType = 'all'; pageSize = 10; Math = Math;
  onSearch(value: string): void { this.search = value; this.searchChanged.emit(value); }
}
