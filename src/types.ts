export interface Item {
  id: string;
  name: string;
  total: number;
  issued: number;
  available: number;
  imageUrl: string;
}

export interface Entry {
  name: string;
  place: string;
  phone: string;
  remarks: string;
  items: string[];
  dealerName: string;
  issueDate: string;
} 