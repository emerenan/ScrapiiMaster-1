import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DetectedElement } from "@/lib/types";

interface ElementPreviewDialogProps {
  element: DetectedElement;
  onClose: () => void;
}

export function ElementPreviewDialog({ element, onClose }: ElementPreviewDialogProps) {
  return (
    <Dialog open={!!element} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <span className="material-icons text-primary mr-2">{element.icon}</span>
            Element Preview: {element.name}
          </DialogTitle>
          <DialogDescription>
            Preview how the element will be extracted from the page.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-1">Element Details</h4>
            <div className="bg-muted p-3 rounded-md text-sm">
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <div className="text-text/70">Type:</div>
                <div className="font-mono">{element.type}</div>
                
                <div className="text-text/70">CSS Selector:</div>
                <div className="font-mono text-xs break-all">{element.selector}</div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1">Preview</h4>
            <div className="border border-border rounded-md p-4 flex items-center justify-center min-h-[100px] bg-white">
              <div className="text-center">
                <span className="material-icons text-2xl text-primary/50 mb-2">{element.icon}</span>
                <p className="text-sm text-text/70">Preview not available in this view</p>
              </div>
            </div>
            <p className="text-xs text-text/50 mt-1">
              Note: Real data preview is available in the Chrome extension when running on a webpage.
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
