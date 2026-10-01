import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Pokemon, typeClass } from '../models';
import { PaginationComponent } from '../pagination/pagination.component';

@Component({ selector: 'app-pokemon-table', standalone: true, imports: [PaginationComponent], template: `
  <div class="pokemon-table-card"><div class="pokemon-table-card__scroll-container"><table class="pokemon-table"><thead><tr><th class="pokemon-table__th sprite-col">Sprite</th><th class="pokemon-table__th sortable" (click)="sortBy('name')">Name ↕</th><th class="pokemon-table__th">Types</th><th class="pokemon-table__th numeric" (click)="sortBy('hp')">HP ↕</th><th class="pokemon-table__th numeric" (click)="sortBy('atk')">ATK ↕</th><th class="pokemon-table__th numeric" (click)="sortBy('def')">DEF ↕</th><th class="pokemon-table__th numeric" (click)="sortBy('spa')">SPA ↕</th><th class="pokemon-table__th numeric" (click)="sortBy('spd')">SPD ↕</th><th class="pokemon-table__th numeric" (click)="sortBy('spe')">SPE ↕</th><th class="pokemon-table__th numeric" (click)="sortBy('total')">TOTAL ↕</th><th></th></tr></thead><tbody>
    @for (pokemon of sortedPokemon; track pokemon.id) { <tr class="pokemon-table__row" [class.pokemon-table__row--selected]="selected?.id === pokemon.id" (click)="selectedChange.emit(pokemon)"><td class="pokemon-table__td"><img class="pokemon-table__sprite-img" [src]="pokemon.sprite" [alt]="pokemon.name"/></td><td class="pokemon-table__td"><span class="pokemon-table__species-name">{{ pokemon.name }}</span><span class="pokemon-table__species-id">#{{ pokemon.id.toString().padStart(3, '0') }}</span></td><td class="pokemon-table__td"><span class="pokemon-table__types-wrapper">@for (type of pokemon.types; track type) { <span class="type-badge" [class]="typeClass(type)">{{ type }}</span> }</span></td>@for (stat of statKeys; track stat) { <td class="pokemon-table__td numeric">{{ stat === 'total' ? total(pokemon) : pokemon.stats[stat] }}</td> }<td class="pokemon-table__td"><button class="pokemon-table__add-btn" [disabled]="inTeam(pokemon)" (click)="$event.stopPropagation(); addPokemon.emit(pokemon)">{{ inTeam(pokemon) ? 'In team' : '+ Add' }}</button></td></tr> }
  </tbody></table></div><app-pagination [total]="totalCount" /></div>
` })
export class PokemonTableComponent {
  @Input() pokemon: Pokemon[] = []; @Input() team: Pokemon[] = []; @Input() selected: Pokemon | null = null; @Output() selectedChange = new EventEmitter<Pokemon>(); @Output() addPokemon = new EventEmitter<Pokemon>();
  statKeys = ['hp', 'atk', 'def', 'spa', 'spd', 'spe', 'total'] as const; sortKey: string = 'total'; descending = true; typeClass = typeClass;
  get sortedPokemon(): Pokemon[] { return [...this.pokemon].sort((a, b) => { const av = this.sortKey === 'name' ? a.name : this.sortKey === 'total' ? this.total(a) : a.stats[this.sortKey as keyof Pokemon['stats']]; const bv = this.sortKey === 'name' ? b.name : this.sortKey === 'total' ? this.total(b) : b.stats[this.sortKey as keyof Pokemon['stats']]; return (av < bv ? -1 : av > bv ? 1 : 0) * (this.descending ? -1 : 1); }); }
  get totalCount(): number { return 300; }
  total(pokemon: Pokemon): number { return Object.values(pokemon.stats).reduce((sum, value) => sum + value, 0); }
  inTeam(pokemon: Pokemon): boolean { return this.team.some((member) => member.id === pokemon.id); }
  sortBy(key: string): void { if (this.sortKey === key) this.descending = !this.descending; else { this.sortKey = key; this.descending = false; } }
}
