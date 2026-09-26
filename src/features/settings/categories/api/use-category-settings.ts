import { useQueryClient } from '@tanstack/react-query'

import {
  getGetCategoryWithSubCategoryListQueryKey,
  useGetCategoryWithSubCategoryList,
} from '@/shared/api/generated/category/category'
import type { CategoryWithSubcategoryResponse } from '@/shared/api/generated/model'
import { useEditSubCategory } from '@/shared/api/generated/sub-category/sub-category'
import { clearCategoryReferenceCache } from '@/shared/lib/category-reference-cache'

type CategoryQueryData =
  | {
      data: CategoryWithSubcategoryResponse
      headers: Headers
      status: 200
    }
  | undefined

function updateVisibility(
  current: CategoryQueryData,
  subcategoryId: string,
  enable: boolean,
): CategoryQueryData {
  if (!current) return current
  return {
    ...current,
    data: {
      ...current.data,
      category_list:
        current.data.category_list?.map((category) => ({
          ...category,
          sub_category_list: category.sub_category_list.map((subcategory) =>
            subcategory.sub_category_id === subcategoryId
              ? { ...subcategory, enable }
              : subcategory,
          ),
        })) ?? null,
    },
  }
}

export function useCategorySettings() {
  const queryClient = useQueryClient()
  const categoriesQuery = useGetCategoryWithSubCategoryList()
  const editMutation = useEditSubCategory()

  const setVisibility = async (subcategoryId: string, enable: boolean) => {
    const queryKey = getGetCategoryWithSubCategoryListQueryKey()
    await queryClient.cancelQueries({ queryKey })
    const previous = queryClient.getQueryData<CategoryQueryData>(queryKey)
    queryClient.setQueryData<CategoryQueryData>(queryKey, (current) =>
      updateVisibility(current, subcategoryId, enable),
    )

    try {
      const response = await editMutation.mutateAsync({
        data: { sub_category_id: subcategoryId, is_enable: enable },
      })
      if (response.status !== 200) {
        throw new Error('サブカテゴリの表示設定を保存できませんでした。')
      }
      clearCategoryReferenceCache()
      await queryClient.invalidateQueries({ queryKey })
    } catch (error) {
      queryClient.setQueryData(queryKey, previous)
      throw error
    }
  }

  return { categoriesQuery, editMutation, setVisibility }
}
