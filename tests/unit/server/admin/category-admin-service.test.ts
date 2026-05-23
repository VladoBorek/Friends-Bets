import { describe, it, expect, vi, beforeEach } from "vitest";
import * as categoryAdminService from "@server/services/category/category-admin-service";
import * as categoryRepository from "@server/repositories/wagers/category-repository";
import { HttpError } from "@server/errors";

vi.mock("@server/repositories/wagers/category-repository");

describe("category-admin-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCategory", () => {
    it("successfully creates a new category", async () => {
      const name = "Sports";
      vi.mocked(categoryRepository.findCategoryByNameCaseInsensitive).mockResolvedValue(null);
      vi.mocked(categoryRepository.createCategory).mockResolvedValue({ id: 1, name });

      const result = await categoryAdminService.createCategory(name);

      expect(categoryRepository.createCategory).toHaveBeenCalledWith(name);
      expect(result.name).toBe(name);
    });

    it("throws HttpError if category already exists", async () => {
      vi.mocked(categoryRepository.findCategoryByNameCaseInsensitive).mockResolvedValue({ id: 1, name: "Sports" });

      await expect(categoryAdminService.createCategory("Sports")).rejects.toThrow(HttpError);
      await expect(categoryAdminService.createCategory("Sports")).rejects.toMatchObject({
        status: 409,
        code: "CATEGORY_ALREADY_EXISTS"
      });
    });

    it("throws HttpError if name is empty", async () => {
      await expect(categoryAdminService.createCategory("   ")).rejects.toThrow(HttpError);
    });
  });

  describe("deleteCategory", () => {
    it("successfully deletes category if not in use", async () => {
      vi.mocked(categoryRepository.findCategoryById).mockResolvedValue({ id: 1, name: "Empty" });
      vi.mocked(categoryRepository.hasAnyBetsInCategory).mockResolvedValue(false);
      vi.mocked(categoryRepository.hasAnyWagersInCategory).mockResolvedValue(false);
      vi.mocked(categoryRepository.deleteCategoryById).mockResolvedValue();

      await categoryAdminService.deleteCategory(1);

      expect(categoryRepository.deleteCategoryById).toHaveBeenCalledWith(1);
    });

    it("throws HttpError if category has bets", async () => {
      vi.mocked(categoryRepository.findCategoryById).mockResolvedValue({ id: 1, name: "Used" });
      vi.mocked(categoryRepository.hasAnyBetsInCategory).mockResolvedValue(true);
      vi.mocked(categoryRepository.hasAnyWagersInCategory).mockResolvedValue(false);

      await expect(categoryAdminService.deleteCategory(1)).rejects.toThrow(HttpError);
      await expect(categoryAdminService.deleteCategory(1)).rejects.toMatchObject({
        status: 409,
        code: "CATEGORY_IN_USE"
      });
    });

    it("throws HttpError if category has wagers", async () => {
      vi.mocked(categoryRepository.findCategoryById).mockResolvedValue({ id: 1, name: "Used" });
      vi.mocked(categoryRepository.hasAnyBetsInCategory).mockResolvedValue(false);
      vi.mocked(categoryRepository.hasAnyWagersInCategory).mockResolvedValue(true);

      await expect(categoryAdminService.deleteCategory(1)).rejects.toThrow(HttpError);
    });

    it("throws HttpError if category not found", async () => {
      vi.mocked(categoryRepository.findCategoryById).mockResolvedValue(null);

      await expect(categoryAdminService.deleteCategory(999)).rejects.toThrow(HttpError);
      await expect(categoryAdminService.deleteCategory(999)).rejects.toMatchObject({
        status: 404,
        code: "CATEGORY_NOT_FOUND"
      });
    });
  });
});
