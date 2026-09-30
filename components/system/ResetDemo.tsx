"use client";

import * as React from "react";
import { toast } from "sonner";

import { resetDemo } from "@/lib/seed";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** One visible button so a demo can be run twice. */
export function ResetDemo({ className }: { className?: string }) {
  const [busy, setBusy] = React.useState(false);

  async function run() {
    setBusy(true);
    resetDemo();
    toast.success("Demo data restored");
    setTimeout(() => window.location.reload(), 400);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          Reset demo data
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset demo data?</DialogTitle>
          <DialogDescription>
            Every record created, edited or deleted in this browser is removed and the original
            seeded state is restored.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" disabled={busy} onClick={run}>
            {busy ? "Resetting…" : "Reset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
