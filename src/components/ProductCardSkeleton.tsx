const ProductCardSkeleton = () => (
  <div className="bg-card rounded-lg overflow-hidden shadow-soft">
    <div className="aspect-square w-full shimmer-block" />
    <div className="p-4 space-y-3">
      <div className="h-3 w-20 rounded shimmer-block" />
      <div className="h-5 w-3/4 rounded shimmer-block" />
      <div className="h-4 w-full rounded shimmer-block" />
      <div className="h-4 w-2/3 rounded shimmer-block" />
      <div className="flex items-center justify-between pt-2">
        <div className="h-6 w-20 rounded shimmer-block" />
        <div className="h-9 w-20 rounded-md shimmer-block" />
      </div>
    </div>
  </div>
);

export default ProductCardSkeleton;
