import { TUserType } from "../common/common.type";

export type ICreateUserJWT = (
  id: number,
  data: any,
  userType: TUserType
) => {
  token: string;
  refreshToken: string;
};