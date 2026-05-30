"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface DeletionConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  itemName: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
}

export default function DeletionConfirmDialog({
  open,
  title,
  description,
  itemName,
  confirmLabel = "Delete",
  onCancel,
  onConfirm,
}: DeletionConfirmDialogProps) {
  const [leftNumber, setLeftNumber] = useState(0);
  const [rightNumber, setRightNumber] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const nextLeft = Math.floor(Math.random() * 8) + 1;
    const nextRight = Math.floor(Math.random() * 8) + 1;
    setLeftNumber(nextLeft);
    setRightNumber(nextRight);
    setAnswer("");
    setSubmitting(false);
  }, [open]);

  const correctAnswer = useMemo(() => leftNumber + rightNumber, [leftNumber, rightNumber]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (Number(answer) !== correctAnswer) {
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md border border-destructive/20 shadow-2xl rounded-2xl bg-card overflow-hidden">
        <CardHeader className="p-6 border-b border-border bg-destructive/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold text-destructive">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description} <span className="font-semibold text-foreground">"{itemName}"</span>
          </p>
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Math check to continue</p>
            <p className="text-sm text-muted-foreground">
              What is {leftNumber} + {rightNumber}?
            </p>
            <Input
              type="number"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter answer"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={submitting || Number(answer) !== correctAnswer}>
              {submitting ? "Deleting..." : confirmLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}