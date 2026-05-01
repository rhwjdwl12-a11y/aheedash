export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: string;
  added_at: string;
}

export interface TaskAssignee {
  task_id: string;
  user_id: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  color: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  memo: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  client_id: string | null;
  title: string;
  type: "제안서" | "기획안" | "결과보고서" | "기타" | null;
  status: "진행중" | "검토" | "완료" | "보류";
  duration_type: "단기" | "중기" | "장기" | null;
  start_date: string | null;
  deadline: string | null;
  budget: number | null;
  fee: number | null;
  progress: number;
  description: string | null;
  business_amount: number | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectBudget {
  id: string;
  project_id: string;
  group_name: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  qty_unit: string;
  count: number;
  count_unit: string;
  vat_included: boolean;
  note: string;
  order_index: number;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  status: "todo" | "doing" | "review" | "done";
  due_date: string | null;
  assignee: string | null;
  memo: string | null;
  order_index: number;
  created_at: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_done: boolean;
  order_index: number;
  created_at: string;
}

export interface FileAttachment {
  id: string;
  project_id: string;
  filename: string;
  storage_path: string;
  file_type: string | null;
  file_size: number | null;
  thumbnail_url: string | null;
  uploaded_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  event_date: string;
  end_date: string | null;
  all_day: boolean;
  type: "마감" | "미팅" | "제출" | "기타";
  reminder_d3: boolean;
  reminder_d1: boolean;
  memo: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  project_id: string;
  amount: number;
  status: "예정" | "청구" | "입금" | "연체";
  issued_at: string | null;
  paid_at: string | null;
  memo: string | null;
  created_at: string;
}

export interface StickyNote {
  id: string;
  user_id: string;
  content: string;
  category: string | null;
  due_label: string | null;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  rotation: number;
  color_key: "yellow" | "pink" | "green" | "beige" | "gray";
  archived_at: string | null;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      clients: { Row: Client; Insert: Omit<Client, "id" | "created_at">; Update: Partial<Client> };
      projects: { Row: Project; Insert: Omit<Project, "id" | "created_at" | "updated_at">; Update: Partial<Project> };
      tasks: { Row: Task; Insert: Omit<Task, "id" | "created_at">; Update: Partial<Task> };
      files: { Row: FileAttachment; Insert: Omit<FileAttachment, "id" | "uploaded_at">; Update: Partial<FileAttachment> };
      events: { Row: Event; Insert: Omit<Event, "id" | "created_at">; Update: Partial<Event> };
      invoices: { Row: Invoice; Insert: Omit<Invoice, "id" | "created_at">; Update: Partial<Invoice> };
      sticky_notes: { Row: StickyNote; Insert: Omit<StickyNote, "id" | "created_at">; Update: Partial<StickyNote> };
    };
  };
};
