import type { CategorySummary } from "@pb138/shared/schemas/wager";
import { HttpError } from "../../errors";
import * as categoryRepository from "../../repositories/wagers/category-repository";

export async function createCategory(name: string): Promise<CategorySummary> {
  const normalizedName = name.trim();

  if (!normalizedName) {
    throw new HttpError({
      status: 400,
      code: "BAD_REQUEST",
      message: "Category name is required",
    });
  }

  const existing = await categoryRepository.findCategoryByNameCaseInsensitive(normalizedName);

  if (existing) {
    throw new HttpError({
      status: 409,
      code: "CATEGORY_ALREADY_EXISTS",
      message: "Category with this name already exists",
    });
  }

  return categoryRepository.createCategory(normalizedName);
}

export async function deleteCategory(categoryId: number): Promise<void> {
  const existingCategory = await categoryRepository.findCategoryById(categoryId);

  if (!existingCategory) {
    throw new HttpError({
      status: 404,
      code: "CATEGORY_NOT_FOUND",
      message: "Category not found",
    });
  }

  const [hasBets, hasWagers] = await Promise.all([
    categoryRepository.hasAnyBetsInCategory(categoryId),
    categoryRepository.hasAnyWagersInCategory(categoryId),
  ]);

  if (hasBets || hasWagers) {
    throw new HttpError({
      status: 409,
      code: "CATEGORY_IN_USE",
      message: "Cannot delete category while it is used by existing wagers or bets",
    });
  }

  await categoryRepository.deleteCategoryById(categoryId);
}