import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ToastType =
  | 'success'
  | 'error';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    @if (message()) {
      <div
        class="toast-container"
        role="status"
        aria-live="polite"
      >
        <div
          class="toast"
          [class.toast--success]="type() === 'success'"
          [class.toast--error]="type() === 'error'"
        >
          <span class="toast__icon">
            @if (type() === 'success') {
              ✓
            } @else {
              !
            }
          </span>

          <span class="toast__message">
            {{ message() }}
          </span>

          <button
            class="toast__close"
            type="button"
            aria-label="Close notification"
            (click)="closed.emit()"
          >
            ×
          </button>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastComponent {
  readonly message = input('');
  readonly type = input<ToastType>('success');

  readonly closed = output<void>();
}