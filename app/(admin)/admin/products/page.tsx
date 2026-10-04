import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/admin/card";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusPill } from "@/components/admin/status-pill";
import { ButtonLink } from "@/components/ui/button";
import { RowActions } from "@/components/admin/row-actions";
import { listProducts } from "@/lib/db/admin";
import { deleteProduct, toggleProductVisible } from "@/app/actions/content";

/** Admin → Products (FR-A4). */
export const metadata = { title: "Products" };

const BADGE_LABEL: Record<string, string> = {
  coming_soon: "Coming soon",
  new: "New",
  popular: "Popular",
};

export default async function AdminProductsPage() {
  const products = await listProducts();

  return (
    <>
      <PageHeader
        title="Products"
        description="Ready-made systems shown on the site."
        actions={
          <ButtonLink href="/admin/products/new" size="sm">
            <Plus aria-hidden className="size-4" />
            New product
          </ButtonLink>
        }
      />

      <div className="mt-6">
        {products.length === 0 ? (
          <EmptyState
            title="No products yet"
            description="Add a ready-made system to show it on the home page."
            action={
              <ButtonLink href="/admin/products/new" size="sm">
                Add a product
              </ButtonLink>
            }
          />
        ) : (
          <Card className="p-0 sm:p-0">
            <ul className="divide-border divide-y">
              {products.map((product) => (
                <li
                  key={product.id}
                  className="flex flex-wrap items-center gap-3 p-4 sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-body text-navy rounded-input font-semibold underline-offset-4 hover:underline"
                      >
                        {product.name}
                      </Link>
                      {product.badge !== "none" && (
                        <StatusPill tone="info">
                          {BADGE_LABEL[product.badge]}
                        </StatusPill>
                      )}
                      {!product.visible && (
                        <StatusPill tone="neutral">Hidden</StatusPill>
                      )}
                    </div>
                    <p className="text-small text-slate mt-0.5 truncate">
                      /products/{product.slug}
                      {product.pricingText ? ` — ${product.pricingText}` : ""}
                    </p>
                  </div>

                  <RowActions
                    editHref={`/admin/products/${product.id}`}
                    visible={product.visible}
                    onToggle={toggleProductVisible.bind(null, product.id)}
                    onDelete={deleteProduct.bind(null, product.id)}
                    deleteLabel={`Delete ${product.name}`}
                  />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </>
  );
}
