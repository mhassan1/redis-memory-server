export type DebugFn = (...args: any[]) => any;
export type DebugPropT = boolean;

export interface DownloadProgressT {
  current: number;
  length: number;
  totalMb: number;
  lastPrintedAt: number;
}

export type CallbackFn = (...args: any[]) => any;

export { SpawnOptions } from 'child_process';

export interface RedisMemoryInstancePropBaseT {
  args?: string[];
  port?: number | null;
}

export interface RedisMemoryInstancePropT extends RedisMemoryInstancePropBaseT {
  ip?: string; // for binding to all IP addresses set it to `::,0.0.0.0`, by default '127.0.0.1'
}

export type ErrorVoidCallback = (err: any) => void;
export type EmptyVoidCallback = () => void;
