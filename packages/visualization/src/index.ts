import type { GraphObject } from '@mathboard/shared';

export interface PlotDataPoint {
  x: number;
  y: number;
}

export interface PlotSeries {
  name: string;
  points: PlotDataPoint[];
  color?: string;
  type?: 'line' | 'scatter';
}

export interface GraphRenderSpec {
  title?: string;
  xDomain: [number, number];
  yDomain?: [number, number];
  series: PlotSeries[];
  annotations?: {
    x: number;
    y: number;
    text: string;
  }[];
}

export function createGraphSpecFromObject(graphObj: GraphObject): GraphRenderSpec {
  return {
    title: `Graph of ${graphObj.expression}`,
    xDomain: graphObj.domain,
    series: [
      {
        name: graphObj.expression,
        points: [],
        type: 'line',
      },
    ],
  };
}
