import { ImageIcon } from "lucide-react";
import type { ImageExpData } from "@/lib/experiment-types";

interface ImagePreviewCardProps {
  data: ImageExpData;
}

export function ImagePreviewCard({ data }: ImagePreviewCardProps) {
  const src = `data:${data.mimeType};base64,${data.base64}`;

  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <ImageIcon className="h-4 w-4 text-blue-400 shrink-0" />
        <span className="text-sm font-semibold text-blue-400 truncate">{data.filename}</span>
        <span className="ml-auto shrink-0 text-xs text-muted-foreground bg-black/30 px-2 py-0.5 rounded-full">
          {data.mimeType.split("/")[1]?.toUpperCase()}
        </span>
      </div>
      <div className="flex gap-4 items-start">
        <img
          src={src}
          alt={data.filename}
          className="h-28 w-28 rounded-lg object-cover border border-white/10 shrink-0"
        />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Image attached — the AI will perform visual analysis including object recognition, pattern detection, and scientific interpretation. Ask it to describe or analyze what it sees.
        </p>
      </div>
    </div>
  );
}
