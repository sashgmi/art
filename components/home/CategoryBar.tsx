import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  categories: {
    id: string;
    name: string;
    slug: string;
  }[];
  activeCategoryId?: string;
}

// Inline SVG icons per slug (simple strokes)
function CategoryIcon({ slug }: { slug: string }) {
  const cls = "h-5 w-5 stroke-current fill-none";
  const sw = "1.5";

  switch (slug) {
    case "mobilier":
      return (
        <svg className={cls} viewBox="0 0 24 24" strokeWidth={sw}>
          <rect x="2" y="13" width="20" height="5" rx="1" />
          <path d="M4 13V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
          <path d="M4 18v2M20 18v2" />
        </svg>
      );
    case "tableaux-peintures":
      return (
        <svg className={cls} viewBox="0 0 24 24" strokeWidth={sw}>
          <rect x="3" y="3" width="18" height="14" rx="1" />
          <path d="M3 20h18M8 20v-3M16 20v-3" />
        </svg>
      );
    case "sculptures-bronzes":
      return (
        <svg className={cls} viewBox="0 0 24 24" strokeWidth={sw}>
          <path d="M12 3c-2 4-4 6-4 10a4 4 0 0 0 8 0c0-4-2-6-4-10z" />
          <path d="M8 21h8" />
        </svg>
      );
    case "arts-decoratifs":
      return (
        <svg className={cls} viewBox="0 0 24 24" strokeWidth={sw}>
          <path d="M12 2l2 5h5l-4 3 1.5 5L12 12l-4.5 3L9 10 5 7h5z" />
        </svg>
      );
    case "ceramique-porcelaine":
      return (
        <svg className={cls} viewBox="0 0 24 24" strokeWidth={sw}>
          <path d="M8 3h8l1 9a5 5 0 0 1-10 0L8 3z" />
          <path d="M6 21h12M8 3H6a2 2 0 0 0 0 4h1" />
        </svg>
      );
    case "argenterie-orfevrerie":
      return (
        <svg className={cls} viewBox="0 0 24 24" strokeWidth={sw}>
          <path d="M12 2l1.5 4.5H18l-3.75 2.7 1.5 4.5L12 11.1l-3.75 2.6 1.5-4.5L6 6.5h4.5z" />
          <path d="M12 13v9" />
        </svg>
      );
    case "horlogerie":
      return (
        <svg className={cls} viewBox="0 0 24 24" strokeWidth={sw}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
          <path d="M9 2h6M9.5 22h5" />
        </svg>
      );
    case "bijoux-joaillerie":
      return (
        <svg className={cls} viewBox="0 0 24 24" strokeWidth={sw}>
          <path d="M6 3h12l3 5-9 13L3 8z" />
          <path d="M3 8h18M6 3l3 5M18 3l-3 5" />
        </svg>
      );
    default:
      return (
        <svg className={cls} viewBox="0 0 24 24" strokeWidth={sw}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
  }
}

export default function CategoryBar({ categories, activeCategoryId }: Props) {
  return (
    <div className="border-b border-border bg-white mt-3">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex items-stretch justify-between">
          {/* "Tous" tab */}
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-3 text-[11px] border-b-2 transition-colors flex-1",
              !activeCategoryId
                ? "border-gold-500 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <svg className="h-5 w-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="1.5">
              <path d="M3 12l9-9 9 9" />
              <path d="M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9" />
            </svg>
            <span className="whitespace-nowrap">Tous</span>
          </Link>

          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalogue?categoryId=${cat.id}`}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-3 text-[11px] border-b-2 transition-colors flex-1",
                activeCategoryId === cat.id
                  ? "border-gold-500 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <CategoryIcon slug={cat.slug} />
              <span className="whitespace-nowrap">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
