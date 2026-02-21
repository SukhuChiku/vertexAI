export interface Part {
  part_number: string;
  description: string;
  category: string;
  current_stock: number;
  reorder_point: number;
  unit_of_measure: string;
  location: string;
}