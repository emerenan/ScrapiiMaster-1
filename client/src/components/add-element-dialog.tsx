import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DetectedElement } from "@/lib/types";

interface AddElementDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (element: Omit<DetectedElement, 'id'>) => void;
}

export function AddElementDialog({ open, onClose, onAdd }: AddElementDialogProps) {
  const [name, setName] = useState("");
  const [selector, setSelector] = useState("");
  const [type, setType] = useState<DetectedElement["type"]>("text");
  
  const getIconForType = (type: DetectedElement["type"]): string => {
    switch (type) {
      case "text": return "title";
      case "price": return "attach_money";
      case "image": return "image";
      case "rating": return "star";
      case "url": return "link";
      case "custom": return "code";
      default: return "code";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && selector) {
      onAdd({
        name,
        selector,
        type,
        icon: getIconForType(type),
        selected: true
      });
      
      // Reset form
      setName("");
      setSelector("");
      setType("text");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Custom Element</DialogTitle>
          <DialogDescription>
            Define a new element to extract from the page.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="element-name" className="text-right">
                Name
              </Label>
              <Input
                id="element-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Product Title"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="element-selector" className="text-right">
                CSS Selector
              </Label>
              <Input
                id="element-selector"
                value={selector}
                onChange={(e) => setSelector(e.target.value)}
                className="col-span-3"
                placeholder="e.g. .product-title, #price"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="element-type" className="text-right">
                Type
              </Label>
              <Select value={type} onValueChange={(value) => setType(value as DetectedElement["type"])}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-4 text-xs text-text/60 pl-[calc(25%+16px)]">
              <div className="flex items-center mt-1">
                <span className="material-icons text-sm mr-1">{getIconForType(type)}</span>
                <span>Icon preview for this element type</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Element</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
