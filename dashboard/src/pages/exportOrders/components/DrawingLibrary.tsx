import { ImageIcon } from "lucide-react";

const drawings = Array.from({ length: 6 });

export default function DrawingLibrary() {
  return (
    <div className="rounded-lg border bg-background">

      <div className="border-b px-5 py-4 flex justify-between">

        <h2 className="font-semibold text-lg">
          Drawing Library
        </h2>

        <span className="text-sm text-muted-foreground">
          6 Drawings
        </span>

      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 p-5">

        {drawings.map((_, index) => (

          <div
            key={index}
            className="border rounded-lg overflow-hidden hover:shadow cursor-pointer"
          >

            <div className="h-36 bg-muted flex items-center justify-center">

              <ImageIcon
                size={40}
                className="text-muted-foreground"
              />

            </div>

            <div className="p-3">

              <p className="font-medium truncate">
                Drawing-{index + 1}.png
              </p>

              <p className="text-xs text-muted-foreground">
                2.4 MB
              </p>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}