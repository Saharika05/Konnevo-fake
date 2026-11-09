"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { friendlyMessage } from "@/lib/api/client";
import { accountService } from "@/lib/services/account";
import { ME_KEY, useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountSection() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useSession();
  const [open, setOpen] = React.useState(false);
  const [typed, setTyped] = React.useState("");

  const remove = useMutation({
    mutationFn: accountService.deleteAccount,
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(ME_KEY, null);
      toast.success("Your account was deleted");
      router.replace("/");
    },
    onError: (error) => toast.error(friendlyMessage(error)),
  });

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm text-muted">Signed in as</p>
        <p className="font-bold">{user?.email}</p>
        <Button className="mt-4" variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </div>

      <div className="rounded-2xl border border-danger/40 bg-danger-soft/40 p-5">
        <h3 className="font-bold text-danger-text">Delete my account</h3>
        <p className="mt-1 text-sm text-muted">
          This removes your profile, projects, matches and teams for good. It cannot be undone.
        </p>
        <Button className="mt-4" variant="danger" onClick={() => setOpen(true)}>
          Delete my account
        </Button>
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setTyped("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              Everything on your account will be removed for good. Type DELETE to confirm.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="confirm-delete">Type DELETE</Label>
            <Input
              id="confirm-delete"
              autoComplete="off"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={remove.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="danger"
              disabled={typed !== "DELETE" || remove.isPending}
              onClick={() => remove.mutate()}
            >
              {remove.isPending ? "Deleting..." : "Delete for good"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
