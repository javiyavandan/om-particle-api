import { ActiveStatus } from "../utils/app-enumeration";

export function generateRandomKey(length: number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export const statusUpdateValue = (data: any) => {
    switch (data.dataValues.is_active) {
        case ActiveStatus.Active:
            return ActiveStatus.InActive;
        case ActiveStatus.InActive:
            return ActiveStatus.Active;
        default:
            break;
    }
}

export const generateSlug = (name: string) =>  {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}