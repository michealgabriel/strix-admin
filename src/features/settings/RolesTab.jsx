import { useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DataTable from "@/components/common/DataTable";
import FormField from "@/components/common/FormField";
import { useCan } from "@/features/auth/useCan";
import { fieldErrors } from "@/lib/api";
import { groupPermissions, permissionLabel } from "./permissionGroups";
import { useDeleteRoleMutation, useGetPermissionsQuery, useGetRolesQuery, useSaveRoleMutation } from "./settingsApi";

export default function RolesTab() {
  const { data: roles = [], isLoading, isFetching, error, refetch } = useGetRolesQuery();
  const canEdit = useCan("edit_roles");
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [remove, removing] = useDeleteRoleMutation();

  const columns = [
    {
      key: "name",
      header: "Role",
      cell: (r) => (
        <div className="min-w-0">
          <p className="font-medium">{r.name}</p>
          {r.description && <p className="truncate text-sm text-muted-foreground">{r.description}</p>}
        </div>
      ),
    },
    { key: "permissions", header: "Permissions", cell: (r) => r.permissions?.length ?? 0 },
    ...(canEdit
      ? [
          {
            key: "actions",
            header: <span className="sr-only">Actions</span>,
            className: "w-24 text-right",
            cell: (r) => (
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon-sm" aria-label={`Edit ${r.name}`} onClick={() => setEditing(r)}>
                  <Pencil />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label={`Delete ${r.name}`} onClick={() => setToDelete(r)}>
                  <Trash2 />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={roles}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        onRetry={refetch}
        toolbar={
          <>
            <p className="text-sm text-muted-foreground">A role is a set of permissions. Each admin has one role; the owner has every permission.</p>
            {canEdit && (
              <Button className="sm:ml-auto" onClick={() => setEditing({})}>
                <Plus /> Add role
              </Button>
            )}
          </>
        }
      />
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
          {editing && <RoleForm key={editing.id ?? "new"} role={editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Delete the ${toDelete?.name} role?`}
        description="A role that admins still have can't be deleted. Move them to another role first."
        confirmLabel="Delete role"
        destructive
        busy={removing.isLoading}
        onConfirm={async () => {
          try {
            await remove(toDelete.id).unwrap();
            toast.success("Role deleted");
            setToDelete(null);
          } catch {
            // toast from the store
          }
        }}
      />
    </>
  );
}

function RoleForm({ role, onDone }) {
  const { data: permissions = [] } = useGetPermissionsQuery();
  const groups = useMemo(() => groupPermissions(permissions), [permissions]);
  const [values, setValues] = useState({
    name: role.name ?? "",
    description: role.description ?? "",
    permission_ids: new Set((role.permissions ?? []).map((p) => p.id)),
  });
  const [save, { isLoading, error }] = useSaveRoleMutation();
  const errors = fieldErrors(error);

  const toggle = (ids, on) => {
    const next = new Set(values.permission_ids);
    for (const id of ids) on ? next.add(id) : next.delete(id);
    setValues({ ...values, permission_ids: next });
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      await save({
        id: role.id,
        name: values.name.trim(),
        description: values.description.trim() || null,
        permission_ids: [...values.permission_ids],
      }).unwrap();
      toast.success(role.id ? "Role updated" : "Role added");
      onDone();
    } catch {
      // inline or toast
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{role.id ? `Edit ${role.name}` : "Add a role"}</DialogTitle>
      </DialogHeader>
      <FormField label="Name" htmlFor="r-name" error={errors.name}>
        <Input id="r-name" required value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
      </FormField>
      <FormField label="Description" htmlFor="r-desc" error={errors.description}>
        <Textarea id="r-desc" rows={2} value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} />
      </FormField>
      <div className="space-y-3">
        <p className="text-sm font-medium">
          Permissions <span className="font-normal text-muted-foreground">({values.permission_ids.size} selected)</span>
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((group) => {
            const ids = group.items.map((p) => p.id);
            const all = ids.every((id) => values.permission_ids.has(id));
            const some = !all && ids.some((id) => values.permission_ids.has(id));
            return (
              <fieldset key={group.label} className="space-y-2 rounded-lg border p-3">
                <legend className="sr-only">{group.label}</legend>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox checked={all ? true : some ? "indeterminate" : false} onCheckedChange={(on) => toggle(ids, on === true)} />
                  {group.label}
                </label>
                <div className="space-y-1.5 pl-6">
                  {group.items.map((permission) => (
                    <label key={permission.id} className="flex items-start gap-2 text-sm" title={permission.description ?? undefined}>
                      <Checkbox
                        className="mt-0.5"
                        checked={values.permission_ids.has(permission.id)}
                        onCheckedChange={(on) => toggle([permission.id], on === true)}
                      />
                      <span>{permissionLabel(permission.name)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })}
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="animate-spin" />}
          Save role
        </Button>
      </DialogFooter>
    </form>
  );
}
