import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { SubmitEvent } from "react";
import { createWagerRequestSchema, type CategorySummary } from "../../../shared/src/schemas/wager";
import { Button } from "../components/ui/button";
import { Card, CardDescription, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { createWagerRequestSchema } from "@pb138/shared/schemas/wager";


function toErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const value = error as {
      response?: { data?: unknown };
      message?: unknown;
    };

    if (typeof value.response?.data === "string" && value.response.data.trim()) {
      return value.response.data;
    }

    if (value.response?.data && typeof value.response.data === "object") {
      const data = value.response.data as { message?: unknown };
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message;
      }
    }

    if (typeof value.message === "string" && value.message.trim()) {
      return value.message;
    }
  }

  return "Unable to create wager";
}

function getCreatedWagerId(result: unknown): number | null {
  if (!result || typeof result !== "object") {
    return null;
  }

  const payload = result as { id?: unknown; data?: { id?: unknown } };
  const candidate = payload.id ?? payload.data?.id;

  return typeof candidate === "number" && Number.isInteger(candidate) ? candidate : null;
}

export function NewWagerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [outcomes, setOutcomes] = useState("Yes,No");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const isSuspended = Boolean(user?.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now());

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      try {
        setIsLoadingCategories(true);
        const response = await fetch("/api/wagers/categories", { signal: controller.signal });
        const json = (await response.json().catch(() => null)) as { data?: CategorySummary[]; message?: string } | null;

        if (!response.ok) {
          throw new Error(json?.message ?? "Unable to load categories");
        }

        const loadedCategories = json?.data ?? [];
        setCategories(loadedCategories);
        if (loadedCategories.length > 0) {
          setSelectedCategoryId(String(loadedCategories[0].id));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErrorMessage(toErrorMessage(error));
      } finally {
        setIsLoadingCategories(false);
      }
    }

    void loadCategories();

    return () => controller.abort();
  }, []);

  const parsedOutcomes = useMemo(
    () => outcomes.split(",").map((item) => item.trim()).filter(Boolean),
    [outcomes],
  );

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (isSuspended) {
      setErrorMessage("Suspended users cannot create wagers.");
      return;
    }

    const categoryId = Number(selectedCategoryId);
    const parsed = createWagerRequestSchema.safeParse({
      title,
      description: description || undefined,
      categoryId,
      isPublic: true,
      outcomes: parsedOutcomes.map((outcome) => ({ title: outcome })),
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Invalid form data");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/wagers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await response.json().catch(() => null)) as { data?: { id?: number }; id?: number; message?: string } | null;

      if (!response.ok) {
        throw new Error(json?.message ?? "Unable to create wager");
      }

      const createdWagerId = getCreatedWagerId(json);
      if (createdWagerId) {
        await navigate({ to: `/wagers/${createdWagerId}` });
      }
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardTitle>Create Wager</CardTitle>
      <CardDescription className="mt-2">
        Use the authenticated account on the backend. Suspended users cannot create new wagers.
      </CardDescription>

      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-2">
          <label className="text-sm text-slate-300" htmlFor="title">Title</label>
          <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} required />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-slate-300" htmlFor="description">Description</label>
          <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-slate-300" htmlFor="categoryId">Category</label>
          <select
            id="categoryId"
            value={selectedCategoryId}
            onChange={(event) => setSelectedCategoryId(event.target.value)}
            disabled={isLoadingCategories || categories.length === 0}
            className="rounded border border-slate-700 bg-slate-900 p-2 text-white"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-slate-300" htmlFor="outcomes">Outcomes (comma separated)</label>
          <Input id="outcomes" value={outcomes} onChange={(event) => setOutcomes(event.target.value)} required />
        </div>

        {isSuspended && <p className="text-sm text-amber-200">Suspended users cannot create wagers.</p>}
        {errorMessage && <p className="text-sm text-rose-300">{errorMessage}</p>}

        <Button disabled={isSubmitting || isSuspended || isLoadingCategories || categories.length === 0} type="submit">
          {isSubmitting ? "Creating..." : "Create Wager"}
        </Button>
      </form>
    </Card>
  );
}
