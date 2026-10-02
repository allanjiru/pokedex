import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pagination">
      <span class="pagination__info">
        Showing {{ startItem }} to {{ endItem }} of {{ total() }} entries
      </span>
      <div class="pagination__controls">
        <select 
          class="pokedex-toolbar__page-size"
          [value]="pageSize().toString()" 
          aria-label="Items per page"
          (change)="onPageSizeChange($event)">
          <option value="10">10 per page</option>
          <option value="25">25 per page</option>
          <option value="50">50 per page</option>
        </select>

        <button 
          class="pagination__button" 
          [disabled]="page() <= 1" 
          (click)="changePage(page() - 1)">
          Previous
        </button>

        @for (p of displayedPages; track p) {
          @if (p === -1) {
            <span class="pagination__ellipsis">...</span>
          } @else {
            <button 
              class="pagination__page-number" 
              [class.pagination__page-number--active]="p === page()"
              (click)="changePage(p)">
              {{ p }}
            </button>
          }
        }

        <button 
          class="pagination__button" 
          [disabled]="page() >= totalPages" 
          (click)="changePage(page() + 1)">
          Next
        </button>
      </div>
    </div>
  `
})
export class PaginationComponent {
  private static readonly SUPPORTED_SIZES = [10, 25, 50];

  readonly total = input<number>(0);
  readonly page = input<number>(1);
  readonly pageSize = input<number>(10);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  get totalPages(): number {
    return Math.ceil(this.total() / this.pageSize()) || 1;
  }

  get startItem(): number {
    if (this.total() === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  }

  get endItem(): number {
    return Math.min(this.page() * this.pageSize(), this.total());
  }

  get displayedPages(): number[] {
    const totalP = this.totalPages;
    const current = this.page();
    const pages: number[] = [];

    if (totalP <= 7) {
      for (let i = 1; i <= totalP; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        pages.push(1, 2, 3, 4, 5, -1, totalP);
      } else if (current >= totalP - 3) {
        pages.push(1, -1, totalP - 4, totalP - 3, totalP - 2, totalP - 1, totalP);
      } else {
        pages.push(1, -1, current - 1, current, current + 1, -1, totalP);
      }
    }
    return pages;
  }

  changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages && newPage !== this.page()) {
      this.pageChange.emit(newPage);
    }
  }

  onPageSizeChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const newSize = Number(selectElement.value);
    
    // Explicitly validate against supported sizes
    if (PaginationComponent.SUPPORTED_SIZES.includes(newSize) && newSize !== this.pageSize()) {
      this.pageSizeChange.emit(newSize);
    }
  }
}