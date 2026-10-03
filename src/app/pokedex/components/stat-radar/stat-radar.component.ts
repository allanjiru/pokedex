import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  input
} from '@angular/core';
import Chart from 'chart.js/auto';
import { ChartConfiguration, ChartType } from 'chart.js';
import { PokemonStats } from '../../models/pokemon.model';

@Component({
  selector: 'app-stat-radar',
  standalone: true,
  template: `
    <div class="stat-radar">
      <canvas
        #radarCanvas
        aria-label="Pokémon base stats radar chart"
        role="img"
      ></canvas>
    </div>
  `,
  styles: [`
    .stat-radar {
      position: relative;
      width: 100%;
      height: 250px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatRadarComponent implements AfterViewInit, OnDestroy {
  readonly stats = input<PokemonStats | null>(null);

  @ViewChild('radarCanvas')
  private readonly radarCanvas?: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  constructor() {
    // React to signal updates after the chart is already initialized
    effect(() => {
      const currentStats = this.stats();
      if (this.chart) {
        this.chart.data.datasets[0].data = this.getStatValues(currentStats);
        this.chart.update();
      }
    });
  }

  ngAfterViewInit(): void {
    // Small timeout ensures the DOM layout pass is complete and canvas dimensions are painted
    setTimeout(() => {
      this.createChart();
    });
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private createChart(): void {
    const canvas = this.radarCanvas?.nativeElement;
    if (!canvas || this.chart) {
      return;
    }

    const stats = this.stats();
    this.chart = new Chart(canvas, this.getChartConfiguration(stats));
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private getChartConfiguration(
    stats: PokemonStats | null
  ): ChartConfiguration<ChartType> {
    return {
      type: 'radar',
      data: {
        labels: ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'],
        datasets: [
          {
            label: 'Base Stats',
            data: this.getStatValues(stats),
            backgroundColor: 'rgba(59, 130, 246, 0.25)',
            borderColor: '#3b82f6',
            borderWidth: 2,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#ffffff',
            pointRadius: 3,
            pointHoverRadius: 5,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 400
        },
        scales: {
          r: {
            beginAtZero: true,
            min: 0,
            max: 150,
            ticks: {
              stepSize: 30,
              display: true,
              color: '#94a3b8',
              showLabelBackdrop: false
            },
            pointLabels: {
              color: '#f8fafc',
              font: {
                size: 11,
                weight: 500
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.15)'
            },
            angleLines: {
              color: 'rgba(255, 255, 255, 0.15)'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true
          }
        }
      }
    };
  }

  private getStatValues(stats: PokemonStats | null): number[] {
    if (!stats) {
      return [0, 0, 0, 0, 0, 0];
    }

    return [
      stats.hp,
      stats.attack,
      stats.defense,
      stats.specialAttack,
      stats.specialDefense,
      stats.speed
    ];
  }
}