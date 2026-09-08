import type { Categories } from '../types'

export function categorySubcategories(categories: Categories, categoryId: string) {
  return categories.find((category) => category.category_id === categoryId)?.sub_category_list?.filter((subcategory) => subcategory.enable) ?? []
}
