import { useState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataTable from "@/components/common/DataTable";
import FormField from "@/components/common/FormField";
import SearchInput from "@/components/common/SearchInput";
import StatusBadge from "@/components/common/StatusBadge";
import { Can } from "@/features/auth/permissions";
import { useCan } from "@/features/auth/useCan";
import { useListParams } from "@/hooks/useListParams";
import { fieldErrors } from "@/lib/api";
import { useGetGenresQuery, useSaveGenreMutation } from "./gamesApi";

export default function GenresTab() {
  const list = useListParams();
  const search = list.get("q");
  const { data, isLoading, isFetching, error, refetch } = useGetGenresQuery({ page: list.page, search });
  const [editing, setEditing] = useState(null); // genre, or {} for a new one
  const canEdit = useCan("edit_genres");

  const columns = [
    { key: "name", header: "Name", cell: (genre) => <span className="font-medium">{genre.name}</span> },
    { key: "slug", header: "Key", cell: (genre) => <code className="text-xs text-muted-foreground">{genre.slug}</code> },
    { key: "status", header: "Status", cell: (genre) => <StatusBadge status={genre.status} /> },
    ...(canEdit
      ? [
          {
            key: "actions",
            header: <span className="sr-only">Actions</span>,
            className: "w-12 text-right",
            cell: (genre) => (
              <Button variant="ghost" size="icon-sm" aria-label={`Edit ${genre.name}`} onClick={() => setEditing(genre)}>
                <Pencil />
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={data?.items}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        onRetry={refetch}
        emptyTitle={search ? "No genres match your search" : "No genres yet"}
        pagination={{ page: list.page, totalPages: data?.totalPages ?? 1, total: data?.total, onPageChange: list.setPage }}
        toolbar={
          <>
            <SearchInput value={search} onChange={(q) => list.set({ q })} placeholder="Search genres" />
            <Can permission="create_genres">
              <Button className="sm:ml-auto" onClick={() => setEditing({})}>
                <Plus /> Add genre
              </Button>
            </Can>
          </>
        }
      />
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-sm">
          {editing && <GenreForm key={editing.id ?? "new"} genre={editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function GenreForm({ genre, onDone }) {
  const [values, setValues] = useState({ name: genre.name ?? "", status: genre.status ?? "active" });
  const [save, { isLoading, error }] = useSaveGenreMutation();
  const errors = fieldErrors(error);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await save({ id: genre.id, ...values, name: values.name.trim() }).unwrap();
      toast.success(genre.id ? "Genre updated" : "Genre added");
      onDone();
    } catch {
      // inline or toast
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{genre.id ? "Edit genre" : "Add a genre"}</DialogTitle>
      </DialogHeader>
      <FormField label="Name" htmlFor="genre-name" error={errors.name}>
        <Input id="genre-name" required value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
      </FormField>
      <FormField label="Status" error={errors.status}>
        <Select value={values.status} onValueChange={(status) => setValues({ ...values, status })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}
