import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { SubmitEvent } from "react";
import { useCreateWager, useListWagers } from "../api/gen/hooks";
import { Button } from "../components/ui/button";
import { Card, CardDescription, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { createWagerRequestSchema } from "../../../shared/src/schemas/wager";


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

export function NewWagerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const listWagers = useListWagers();
  const createWager = useCreateWager({
    mutation: {
      onSuccess: async (result) => {
        await queryClient.invalidateQueries({ queryKey: listWagers.queryKey });
        const createdWagerId = result.data?.id;

        if (createdWagerId) {
          await navigate({ to: `/wagers/${createdWagerId}` });
        }
      },
      onError: async (error) => {
        console.error("[createWager mutation error]", error);
        const message = toErrorMessage(error);

        setErrorMessage(message);
      },
    },
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [createdById, setCreatedById] = useState("");
  const [outcomes, setOutcomes] = useState("Yes,No");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const suggestedIds = useMemo(() => {
    const firstWager = listWagers.data?.data[0];
    return {
      categoryId: firstWager ? String(firstWager.categoryId) : "",
      createdById: firstWager ? String(firstWager.createdById) : "",
    };
  }, [listWagers.data]);

  useEffect(() => {
    if (!categoryId && suggestedIds.categoryId) {
      setCategoryId(suggestedIds.categoryId);
    }

    if (!createdById && suggestedIds.createdById) {
      setCreatedById(suggestedIds.createdById);
    }
  }, [categoryId, createdById, suggestedIds]);

  const parsedOutcomes = useMemo(
    () => outcomes.split(",").map((item) => item.trim()).filter(Boolean),
    [outcomes],
  );

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = createWagerRequestSchema.safeParse({
      title,
      description: description || undefined,
      categoryId: Number(categoryId),
      createdById: Number(createdById),
      isPublic: true,
      outcomes: parsedOutcomes.map((outcome) => ({ title: outcome })),
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Invalid form data");
      return;
    }

    try {
      await createWager.mutateAsync({ data: parsed.data });
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardTitle>Create Wager</CardTitle>
      <CardDescription className="mt-2">Use zod-validated form payload, then persist via generated Kubb mutation hook.</CardDescription>

      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-2">
          <label className="text-sm text-slate-300" htmlFor="title">Title</label>
          <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} required />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-slate-300" htmlFor="description">Description</label>
          <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm text-slate-300" htmlFor="categoryId">Category ID</label>
            <Input id="categoryId" type="number" min={1} value={categoryId} onChange={(event) => setCategoryId(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-slate-300" htmlFor="createdById">Creator User ID</label>
            <Input id="createdById" type="number" min={1} value={createdById} onChange={(event) => setCreatedById(event.target.value)} />
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-slate-300" htmlFor="outcomes">Outcomes (comma separated)</label>
          <Input id="outcomes" value={outcomes} onChange={(event) => setOutcomes(event.target.value)} required />
        </div>

        {errorMessage && <p className="text-sm text-rose-300">{errorMessage}</p>}

        <Button disabled={createWager.isPending} type="submit">
          {createWager.isPending ? "Creating..." : "Create Wager"}
        </Button>
      </form>
    </Card>
  );
}
