import { z } from 'zod'

import type {
  Household,
  HouseholdMember,
  HouseholdReference,
} from '@/shared/api/generated/model'

const householdSchema = z.object({
  household_id: z.string(),
  name: z.string(),
  state: z.enum(['active', 'archived']),
  version: z.number(),
  created_at: z.string(),
  archived_at: z.string().nullable(),
  role: z.string(),
  member_id: z.string(),
})
const memberSchema = z.object({
  member_id: z.string(),
  household_id: z.string(),
  role: z.enum(['admin', 'member']),
  state: z.enum(['active', 'left', 'archived']),
  display_name: z.string(),
  joined_at: z.string(),
  left_at: z.string().nullable(),
})
const referenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  category_id: z.string().nullable(),
  payment_type_id: z.string().nullable(),
  payment_date: z.number().nullable(),
  closing_date: z.number().nullable(),
  active: z.boolean(),
  version: z.number(),
})
const familyDataSchema = z.object({
  family: householdSchema,
  members: z.array(memberSchema),
  payments: z.array(referenceSchema),
  subcategories: z.array(referenceSchema),
})

export type FamilyData = {
  family: Household
  members: HouseholdMember[]
  payments: HouseholdReference[]
  subcategories: HouseholdReference[]
}

export function isHouseholdList(value: unknown): value is Household[] {
  return z.array(householdSchema).safeParse(value).success
}

export function isFamilyData(value: unknown): value is FamilyData {
  return familyDataSchema.safeParse(value).success
}
