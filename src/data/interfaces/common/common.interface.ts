import { TBitFieldValue } from "../../types/common/common.type";

export interface IRolePermissionAccess {
  id_menu_item: number;
  access: number[];
}
export interface IQueryPagination {
    per_page_rows: number;
    current_page: number;
    order_by: string;
    sort_by: string;
    is_active?: TBitFieldValue;
    total_pages: number;
    total_items: number;
    search_text?: string;
  }

  export interface TResponseReturn {
    code: number;
    status: string;
    message: string;
    data: any;
  }
  

export interface create_wishlist_product {
  product_id: number;
  user_id: number;
  folder_id: number;
  created_at: any;
  created_by: number;
}