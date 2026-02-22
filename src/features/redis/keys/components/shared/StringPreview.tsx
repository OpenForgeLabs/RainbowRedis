"use client";

type StringPreviewProps = {
  preview: string;
};

export function StringPreview({ preview }: StringPreviewProps) {
  return (
    <tr>
      <td className="px-6 py-4" colSpan={3}>
        <div className="flex flex-col gap-3 rounded-lg border border-border-dark bg-background/40 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase tracking-widest">String Preview</span>
            <span className="font-mono">
              {preview === "—" ? "0 chars" : `${preview.length} chars`}
            </span>
          </div>
          <pre className="whitespace-pre-wrap font-mono text-xs text-slate-200">
            {preview}
          </pre>
        </div>
      </td>
    </tr>
  );
}
