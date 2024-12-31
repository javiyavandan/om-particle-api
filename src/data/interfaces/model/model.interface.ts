import { TUserType } from "../../types/common/common.type";

export interface IAppUser {
  username: string;
  pass_hash: string;
  user_type: TUserType;
  refresh_token?: string;
  created_at: Date;
  modified_by?: number;
  modified_at?: Date;
}
