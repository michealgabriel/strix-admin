import { useState } from "react";
import { useSelector } from "react-redux";
import { KeyRound, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DataTable from "@/components/common/DataTable";
import FormField from "@/components/common/FormField";
import SecretReveal from "@/components/common/SecretReveal";
import StatusBadge from "@/components/common/StatusBadge";
import { selectAdmin } from "@/features/auth/authSlice";
import { useCan } from "@/features/auth/useCan";
import { useListParams } from "@/hooks/useListParams";
import { fieldErrors } from "@/lib/api";
import {
  useDeleteAdminMutation,
  useGetAdminsQuery,
  useGetRolesQuery,
  useResetAdminPasswordMutation,
  useSaveAdminMutation,
} from "./settingsApi";

export default function AdminsTab() {
  const me = useSelector(selectAdmin);
  const list = useListParams();
  const { data, isLoading, isFetching, error, refetch } = useGetAdminsQuery({ page: list.page });
  const canCreate = useCan("create_system_admins");
  const canEdit = useCan("edit_system_admins");
  const canDelete = useCan("delete_system_admins");
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [toReset, setToReset] = useState(null);
  const [secret, setSecret] = useState(null); // { name, password }
  const [remove, removing] = useDeleteAdminMutation();
  const [reset, resetting] = useResetAdminPasswordMutation();

  // Only the owner may touch the owner account; nobody removes themselves
  const editable = (admin) => !admin.is_base || me?.is_base;

  const columns = [
    {
      key: "name",
      header: "Admin",
      cell: (a) => (
        <div className="min-w-0">
          <p className="truncate font-medium">
            {a.name} {a.id === me?.id && <span className="text-muted-foreground">(you)</span>}
          </p>
          <p className="truncate text-sm text-muted-foreground">{a.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (a) => (a.is_base ? <Badge>Owner</Badge> : (a.role?.name ?? "—")),
    },
    { key: "status", header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "w-12 text-right",
      cell: (a) =>
        editable(a) && (canEdit || canDelete) ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${a.name}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onSelect={() => setEditing(a)}>
                  <Pencil /> Edit
                </DropdownMenuItem>
              )}
              {canEdit && a.id !== me?.id && (
                <DropdownMenuItem onSelect={() => setToReset(a)}>
                  <KeyRound /> Reset password
                </DropdownMenuItem>
              )}
              {canDelete && a.id !== me?.id && (
                <DropdownMenuItem variant="destructive" onSelect={() => setToDelete(a)}>
                  <Trash2 /> Remove
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null,
    },
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
        pagination={{ page: list.page, totalPages: data?.totalPages ?? 1, total: data?.total, onPageChange: list.setPage }}
        toolbar={
          <>
            <p className="text-sm text-muted-foreground">People who can sign in to this dashboard.</p>
            {canCreate && (
              <Button className="sm:ml-auto" onClick={() => setEditing({})}>
                <Plus /> Add admin
              </Button>
            )}
          </>
        }
      />

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          {editing && (
            <AdminForm
              key={editing.id ?? "new"}
              admin={editing}
              isMe={editing.id === me?.id}
              onDone={(created) => {
                setEditing(null);
                if (created) setSecret(created);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!secret} onOpenChange={(open) => !open && setSecret(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Temporary password for {secret?.name}</DialogTitle>
            <DialogDescription>
              Send it to them privately. It is shown only once. They should change it from their account menu after signing in.
            </DialogDescription>
          </DialogHeader>
          {secret && <SecretReveal value={secret.password} />}
          <DialogFooter>
            <Button onClick={() => setSecret(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toReset}
        onOpenChange={(open) => !open && setToReset(null)}
        title={`Reset ${toReset?.name}'s password?`}
        description="They are signed out everywhere, and you get a new temporary password to send them."
        confirmLabel="Reset password"
        busy={resetting.isLoading}
        onConfirm={async () => {
          try {
            const result = await reset(toReset.id).unwrap();
            setSecret({ name: toReset.name, password: result.temporary_password });
            setToReset(null);
          } catch {
            // toast from the store
          }
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Remove ${toDelete?.name}?`}
        description="They are signed out and can no longer use the dashboard. To pause access instead, set them to inactive."
        confirmLabel="Remove admin"
        destructive
        busy={removing.isLoading}
        onConfirm={async () => {
          try {
            await remove(toDelete.id).unwrap();
            toast.success("Admin removed");
            setToDelete(null);
          } catch {
            // toast from the store
          }
        }}
      />
    </>
  );
}

function AdminForm({ admin, isMe, onDone }) {
  const { data: roles = [] } = useGetRolesQuery();
  const [values, setValues] = useState({
    name: admin.name ?? "",
    email: admin.email ?? "",
    role_id: admin.role_id ? String(admin.role_id) : "",
    status: admin.status ?? "active",
  });
  const [save, { isLoading, error }] = useSaveAdminMutation();
  const errors = fieldErrors(error);
  const set = (key) => (e) => setValues({ ...values, [key]: e?.target ? e.target.value : e });

  const submit = async (event) => {
    event.preventDefault();
    try {
      const body = { name: values.name.trim(), role_id: Number(values.role_id), status: values.status };
      if (admin.id) {
        await save({ id: admin.id, ...body }).unwrap();
        toast.success("Admin updated");
        onDone();
      } else {
        const result = await save({ ...body, email: values.email.trim() }).unwrap();
        toast.success("Admin added");
        onDone({ name: body.name, password: result.temporary_password });
      }
    } catch {
      // inline or toast
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{admin.id ? `Edit ${admin.name}` : "Add an admin"}</DialogTitle>
        {!admin.id && (
          <DialogDescription>You'll get a temporary password to send them once the account is created.</DialogDescription>
        )}
      </DialogHeader>
      <FormField label="Name" htmlFor="a-name" error={errors.name}>
        <Input id="a-name" required value={values.name} onChange={set("name")} />
      </FormField>
      <FormField label="Email" htmlFor="a-email" error={errors.email}>
        <Input id="a-email" type="email" required disabled={!!admin.id} value={values.email} onChange={set("email")} />
      </FormField>
      {!admin.is_base && (
        <FormField label="Role" error={errors.role_id} hint="The role decides which pages and actions they get.">
          <Select value={values.role_id} onValueChange={set("role_id")} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={String(role.id)}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}
      {!isMe && (
        <FormField label="Status" error={errors.status} hint="Inactive admins can't sign in.">
          <Select value={values.status} onValueChange={set("status")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onDone()} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !values.role_id}>
          {isLoading && <Loader2 className="animate-spin" />}
          {admin.id ? "Save" : "Add admin"}
        </Button>
      </DialogFooter>
    </form>
  );
}
