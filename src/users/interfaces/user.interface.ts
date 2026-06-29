export interface IUser {
  user_id?: number;
  full_name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  is_deleted: boolean;
}
