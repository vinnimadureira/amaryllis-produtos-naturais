const ProductCardSkeleton = () => (
  <div className="bg-card rounded-2xl overflow-hidden shadow-soft border border-border/70">
    <div className="aspect-square w-full shimmer-block" />
    <div className="p-2.5 sm:p-4 space-y-2 sm:space-y-3">
      <div className="h-2.5 sm:h-3 w-16 sm:w-20 rounded shimmer-block" />
      <div className="h-4 sm:h-5 w-3/4 rounded shimmer-block" />
      <div className="hidden sm:block h-3.5 w-full rounded shimmer-block" />
      <div className="flex items-center justify-between pt-1 sm:pt-2">
        <div className="h-4 sm:h-6 w-14 sm:w-20 rounded shimmer-block" />
        <div className="h-7 sm:h-9 w-12 sm:w-20 rounded-full shimmer-block" />
      </div>
    </div>
  </div>
);

export default ProductCardSkeleton;
