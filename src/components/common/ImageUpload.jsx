import { useEffect, useId, useState } from "react";
import { ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_MB = 2;

// Image picker with a preview. Shows `currentUrl` until a new file is chosen.
export default function ImageUpload({ value, onChange, currentUrl, accept = "image/png,image/jpeg", invalid }) {
  const id = useId();
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const pick = (file) => {
    setError(null);
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`The image must be under ${MAX_MB} MB.`);
      return;
    }
    onChange(file);
  };

  const shown = preview ?? currentUrl;

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className={cn(
          "flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/40 text-sm text-muted-foreground transition-colors hover:bg-muted",
          (invalid || error) && "border-destructive",
        )}
      >
        {shown ? (
          <img src={shown} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2">
            <ImagePlus className="size-6" />
            Choose an image (PNG or JPG, up to {MAX_MB} MB)
          </span>
        )}
      </label>
      <input id={id} type="file" accept={accept} className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
      {shown && (
        <label htmlFor={id} className="cursor-pointer text-sm font-medium text-primary hover:underline">
          Change image
        </label>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
