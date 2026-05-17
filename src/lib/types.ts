
import { Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  name: string;
  email: string;
  qrCode?: string;
  role: 'borrower' | 'admin';
  borrowerType?: 'student' | 'teacher';
  studentId?: string;
  profilePic?: string;
  course?: string;
  missingItemCount?: number;
  restrictionNote?: string;
}

export interface Apparatus {
  id: string;
  name: string;
  stock: number;
  /** Total available units (admin-modifiable). Must be >= stock */
  total?: number;
  category: string;
  location: string;
  description?: string;
}

export interface TransactionItem {
  itemId: string;
  name: string;
  quantity: number;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  items: TransactionItem[];
  status: 'active' | 'returned';
  borrowTime: Timestamp;
  deadline: string; // ISO String
  returnTime?: Timestamp;
}

export interface AdminSession {
  email: string;
  isAdmin: boolean;
}
