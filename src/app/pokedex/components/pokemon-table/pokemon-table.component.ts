import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { Pokemon } from '../../models/pokemon.model';
import { typeClass } from '../../utils/pokemon.utils';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SortKey } from '../../state/pokemon.selectors';

@Component({
  selector: 'app-pokemon-table',
  standalone: true,
  imports: [PaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
      <div class="pokemon-table-card">
        <div class="pokemon-table-card__scroll-container">
          <table class="pokemon-table">
            <thead class="pokemon-table__head">
              <tr>
                <th class="pokemon-table__th sprite-col">Sprite</th>
                <th class="pokemon-table__th sortable" (click)="sort.emit('name')">Name ↕</th>
                <th class="pokemon-table__th">Types</th>
                <th class="pokemon-table__th sortable" (click)="sort.emit('hp')">HP ↕</th>
                <th class="pokemon-table__th sortable" (click)="sort.emit('attack')">ATK ↕</th>
                <th class="pokemon-table__th sortable" (click)="sort.emit('defense')">DEF ↕</th>
                <th class="pokemon-table__th sortable" (click)="sort.emit('specialAttack')">SPA ↕</th>
                <th class="pokemon-table__th sortable" (click)="sort.emit('specialDefense')">SPD ↕</th>
                <th class="pokemon-table__th sortable" (click)="sort.emit('speed')">SPE ↕</th>
                <th class="pokemon-table__th sortable" (click)="sort.emit('total')">TOTAL ↕</th>
              </tr>
            </thead>
            <tbody class="pokemon-table__tbody">
            @for (pokemon of pokemon(); track pokemon.id) { 
              <tr class="pokemon-table__row" [class.pokemon-table__row--selected]="selected()?.id === pokemon.id" (click)="selectedChange.emit(pokemon)">
                <td class="pokemon-table__td pokemon-table__td--sprite">
                  <img class="pokemon-table__sprite-img" [src]="pokemon.sprite" [alt]="pokemon.name"/>
                </td>
                <td class="pokemon-table__td">
                  <span class="pokemon-table__species-name">{{ pokemon.name }}</span>
                </td>
                <td class="pokemon-table__td ">
                  <span class="pokemon-table__types-wrapper">
                    @for (type of pokemon.types; track type) { 
                      <span class="type-badge" [class]="typeClass(type)">{{ type }}</span> }</span>
                </td>
                @for (stat of statKeys; track stat) { 
                  <td class="pokemon-table__td">
                    {{ stat === 'total' ? total(pokemon) : pokemon.stats[stat] }}
                  </td> 
                }
              </tr> }
            </tbody>
          </table>
        </div>
        <app-pagination 
          [total]="totalCount()" 
          [page]="page()" 
          [pageSize]="pageSize()" 
          (pageChange)="pageChange.emit($event)" 
          (pageSizeChange)="pageSizeChange.emit($event)" 
        />
      </div>
    `
})
export class PokemonTableComponent {
  // --- Modern Angular Signals Inputs ---
  readonly pokemon = input<Pokemon[]>([]);
  readonly team = input<Pokemon[]>([]);
  readonly selected = input<Pokemon | null>(null);
  readonly totalCount = input<number>(0);
  readonly page = input<number>(1);
  readonly pageSize = input<number>(20);

  // --- Outputs ---
  readonly selectedChange = output<Pokemon>();
  readonly addPokemon = output<Pokemon>();
  readonly sort = output<SortKey>();
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly statKeys = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed', 'total'] as const;
  readonly typeClass = typeClass;

  total(pokemon: Pokemon): number {
    return Object.values(pokemon.stats).reduce((sum, value) => sum + value, 0);
  }

  inTeam(pokemon: Pokemon): boolean {
    return this.team().some((member) => member.id === pokemon.id);
  }
}
