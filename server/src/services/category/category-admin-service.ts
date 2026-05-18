import type { CategorySummary } from "@pb138/shared/schemas/wager";
import { HttpError } from "../../errors";
import * as categoryRepository from "../../repositories/wagers/category-repository";

export async function createCategory(name: string): Promise<CategorySummary> {
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new HttpError(400, "Category name is required");
  }

  const existing = await categoryRepository.findCategoryByNameCaseInsensitive(normalizedName);
  if (existing) {
    throw new HttpError(409, "Category with this name already exists");
  }

  return categoryRepository.createCategory(normalizedName);
}

export async function deleteCategory(categoryId: number): Promise<void> {
  const existingCategory = await categoryRepository.findCategoryById(categoryId);
  if (!existingCategory) {
    throw new HttpError(404, "Category not found");
  }

  const [hasBets, hasWagers] = await Promise.all([
    categoryRepository.hasAnyBetsInCategory(categoryId),
    categoryRepository.hasAnyWagersInCategory(categoryId),
  ]);

  if (hasBets) {
    throw new HttpError(409, "Cannot delete category with existing bets");
  }

  if (hasWagers) {
    throw new HttpError(409, "Cannot delete category used by existing wagers");
  }

  await categoryRepository.deleteCategoryById(categoryId);
}
