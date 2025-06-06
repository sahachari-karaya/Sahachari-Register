export interface Item {
  id: string;
  name: string;
  total: number;
  issued: number;
  available: number;
  imageUrl: string;
}

export interface Entry {
  id: string;
  name: string;
  place: string;
  phone: string;
  remarks?: string;
  items: string[];
  dealerName?: string;
  issueDate: string;
  type: 'issue' | 'return';
}

export interface ItemCardProps {
  item: Item;
  onEdit?: (item: Item) => void;
}

export interface AddEntryProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (entry: Omit<Entry, 'id'>) => void;
  items: Item[];
} 