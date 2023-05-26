export interface DepFile {
  id: string;
  value: string;
  enabled: boolean;
  type: 'auto' | 'manual';
  file: string; // this is the new property that will hold the absolute path
}