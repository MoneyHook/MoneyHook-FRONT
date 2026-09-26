import { AlertCircle, Tags } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Skeleton } from '@/shared/components/ui/skeleton'

import { SettingsSection } from '../../components/settings-section'
import { useCategorySettings } from '../api/use-category-settings'

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'カテゴリとサブカテゴリを取得できませんでした。'
}

export function CategorySettings({
  showHeader = true,
}: {
  showHeader?: boolean
}) {
  const { categoriesQuery, setVisibility } = useCategorySettings()
  const [pendingSubcategoryId, setPendingSubcategoryId] = useState<
    string | null
  >(null)
  const categories = useMemo(
    () =>
      categoriesQuery.data?.status === 200
        ? (categoriesQuery.data.data.category_list ?? [])
        : [],
    [categoriesQuery.data],
  )
  const changeVisibility = async (
    subcategoryId: string,
    enable: boolean,
    visibleSubcategoryCount: number,
  ) => {
    if (!enable && visibleSubcategoryCount <= 1) return

    setPendingSubcategoryId(subcategoryId)
    try {
      await setVisibility(subcategoryId, enable)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'サブカテゴリの表示設定を保存できませんでした。',
      )
    } finally {
      setPendingSubcategoryId(null)
    }
  }

  return (
    <SettingsSection
      description="取引の入力時に表示するサブカテゴリをカテゴリごとに設定できます。"
      icon={Tags}
      showHeader={showHeader}
      title="カテゴリ・サブカテゴリ"
      titleId="category-settings-title"
    >
      {categoriesQuery.isPending ? (
        <div
          aria-label="カテゴリを読み込んでいます"
          className="space-y-4"
          role="status"
        >
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : null}

      {categoriesQuery.isError && !categoriesQuery.data ? (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertTitle>カテゴリを読み込めません</AlertTitle>
            <AlertDescription>
              {errorMessage(categoriesQuery.error)}
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => void categoriesQuery.refetch()}
            size="lg"
            type="button"
            variant="outline"
          >
            もう一度試す
          </Button>
        </div>
      ) : null}

      {!categoriesQuery.isPending &&
      (!categoriesQuery.isError || categoriesQuery.data) ? (
        categories.length ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              カテゴリごとに少なくとも1つのサブカテゴリを表示する必要があります。
            </p>
            <Accordion collapsible type="single">
              {categories.map((category) => {
                const visibleSubcategoryCount =
                  category.sub_category_list.filter(
                    (subcategory) => subcategory.enable,
                  ).length

                return (
                  <AccordionItem
                    className="overflow-hidden rounded-xl border not-last:mb-3 not-last:border-b"
                    key={category.category_id}
                    value={category.category_id}
                  >
                    <AccordionTrigger className="bg-muted/40 px-4 py-3 text-base hover:no-underline sm:px-5">
                      <span className="min-w-0 truncate">
                        {category.category_name}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      {category.sub_category_list.length ? (
                        <ul className="divide-y">
                          {category.sub_category_list.map((subcategory) => {
                            const isLastVisibleSubcategory =
                              subcategory.enable &&
                              visibleSubcategoryCount === 1
                            return (
                              <li
                                className="flex min-h-14 items-center gap-3 px-4 py-3 sm:px-5"
                                key={subcategory.sub_category_id}
                              >
                                <span className="min-w-0 flex-1 truncate text-sm font-medium sm:text-base">
                                  {subcategory.sub_category_name}
                                </span>
                                <label
                                  className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-muted-foreground"
                                  htmlFor={`subcategory-${subcategory.sub_category_id}`}
                                >
                                  <Checkbox
                                    checked={subcategory.enable}
                                    disabled={
                                      pendingSubcategoryId !== null ||
                                      isLastVisibleSubcategory
                                    }
                                    id={`subcategory-${subcategory.sub_category_id}`}
                                    onCheckedChange={(checked) =>
                                      void changeVisibility(
                                        subcategory.sub_category_id,
                                        checked === true,
                                        visibleSubcategoryCount,
                                      )
                                    }
                                  />
                                  表示する
                                </label>
                              </li>
                            )
                          })}
                        </ul>
                      ) : (
                        <p className="px-4 py-5 text-sm text-muted-foreground sm:px-5">
                          サブカテゴリがありません。
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed px-4 py-8 text-center">
            <Tags
              aria-hidden="true"
              className="mx-auto mb-3 size-6 text-muted-foreground"
            />
            <p className="font-medium">カテゴリがありません</p>
          </div>
        )
      ) : null}
    </SettingsSection>
  )
}
