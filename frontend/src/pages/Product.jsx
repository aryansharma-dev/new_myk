import {useContext, useEffect, useMemo, useRef, useState} from "react";
import { useNavigate, useParams } from "react-router-dom";
import ShopContext from '../context/ShopContextInstance';
import { getProductImageArray, getPrimaryProductImage } from "../utils/productImages";
import usePageMetadata from "../hooks/usePageMetadata";

const Product = () => {
  const { productId } = useParams();
  const { productMap, ensureProductLoaded, currency, addToCart } = useContext(ShopContext);
  const navigate = useNavigate();

  const [productData, setProductData] = useState(() =>
    (productId && productMap?.get(String(productId))) || null
  );
  const [image, setImage] = useState("");
  const [size, setSize] = useState("");
  const [loading, setLoading] = useState(!productData);
  const [error, setError] = useState(null);
  const pendingRequestRef = useRef(null);

  useEffect(() => {
    setSize("");
  }, [productId]);

  useEffect(() => {
    if (!productId) {
      setProductData(null);
      setImage("");
      setLoading(false);
      setError("Invalid product");
      return;
    }

    const id = String(productId);
    const cached = productMap?.get(id);
    if (cached) {
      setProductData(cached);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const loadProduct = async () => {
      try {
        if (pendingRequestRef.current) {
          await pendingRequestRef.current;
          return;
        }
        const promise = ensureProductLoaded(id);
        pendingRequestRef.current = promise;
        const result = await promise;
        if (!result) {
          setError("Product not found.");
          setProductData(null);
          return;
        }
        setProductData(result);
        setError(null);
      } catch (err) {
        console.error("Failed to load product", err);
        setError(err?.message || "Failed to load product.");
        setProductData(null);
      } finally {
        pendingRequestRef.current = null;
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, productMap, ensureProductLoaded]);

  useEffect(() => {
    if (!productData) {
      setImage("");
      return;
    }
    const imgs = getProductImageArray(productData);
    setImage((prev) => {
      if (prev && imgs.includes(prev)) {
        return prev;
      }
      return imgs[0] || "";
    });
  }, [productData]);

  const categoryName = useMemo(
    () => String(productData?.category || "").trim().toLowerCase(),
    [productData?.category]
  );
  const isJewellery = useMemo(
    () => ["jewellery", "jewelry", "jewelery"].includes(categoryName),
    [categoryName]
  );

  const images = useMemo(() => getProductImageArray(productData), [productData]);
  const selectedImage = image || getPrimaryProductImage(productData);
  const availableSizes = useMemo(() => {
    if (!Array.isArray(productData?.sizes)) return [];
    return productData.sizes.filter((s) => typeof s === "string" && s.trim().length > 0);
  }, [productData?.sizes]);

  const metaDescription = useMemo(() => {
    if (productData?.description) {
      return productData.description;
    }
    if (productData?.name) {
      return `Shop ${productData.name} online from TinyMillion.`;
    }
    return "Explore product details from TinyMillion.";
  }, [productData]);

  const productStructuredData = useMemo(() => {
    if (!productData) return undefined;
    const price = Number(productData.price);
    const offer = Number.isFinite(price)
      ? {
          '@type': 'Offer',
          priceCurrency: 'INR',
          price,
          availability: 'https://schema.org/InStock',
        }
      : undefined;

    return ({ absoluteCanonical, pageDescription, absoluteImage }) => [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        '@id': `${absoluteCanonical}#product`,
        url: absoluteCanonical,
        name: productData.name || 'TinyMillion Product',
        description: pageDescription,
        image: absoluteImage,
        category: productData.category,
        brand: 'TinyMillion',
        offers: offer,
      },
    ];
  }, [productData]);

  usePageMetadata({
    title: productData?.name || "Product Details",
    description: metaDescription,
    keywords: `${productData?.name || "TinyMillion product"}, TinyMillion product details, buy online`,
    canonical: `/product/${productId}`,
    image: selectedImage,
    structuredData: productStructuredData,
  });

  if (loading) {
    return <div className="p-8">Loading product details...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          type="button"
          onClick={() => navigate("/collection")}
          className="underline text-sm"
        >
          Browse other products
        </button>
      </div>
    );
  }

  if (!productData) {
    return <div className="p-8">Product unavailable.</div>;
  }

  const handleAddToCart = async () => {
    if (!isJewellery && !size) {
      alert("Please select a size before adding to cart");
      return;
    }
    const sizeToSend = isJewellery ? undefined : size;
    try {
      await addToCart(productData?._id, sizeToSend, productData?.category);
      navigate("/cart");
    } catch (error) {
      console.error("Failed to add item to cart", error);
    }
  };

  return (
    <div className="border-t-2 pt-10">
      {/* Desktop: 2 columns; Mobile: stacked */}
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-12">

        {/* LEFT: Thumbnails (fixed 1/5 width on desktop) */}
        <div className="w-full sm:basis-1/5 sm:shrink-0">
          {/* Mobile: horizontal scroll; Desktop: vertical list */}
          <div className="flex gap-3 overflow-x-auto sm:flex-col sm:overflow-y-auto sm:max-h-[520px] pr-1">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                onClick={() => setImage(img)}
                alt={`${productData?.name || "Product"} thumbnail ${idx + 1}`}
                loading="lazy"
                decoding="async"
                className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded cursor-pointer flex-none border"
              />
            ))}
          </div>
        </div>

        {/* RIGHT: Main image + info (fixed 4/5 width on desktop) */}
        <div className="w-full sm:basis-4/5">
          {selectedImage && (
            <img
              src={selectedImage}
              alt={productData?.name || "Product"}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="w-[300px] sm:w-[70%] h-auto object-cover rounded mx-auto mb-6"
            />
          )}

          {/* Info */}
          <h1 className="font-medium text-2xl mt-2">{productData?.name || 'Product'}</h1>
          <p className="mt-5 text-3xl font-medium">
            {currency}
            {productData?.price ?? ''}
          </p>
          <p className="mt-5 text-gray-500 md:w-4/5">
            {productData?.description || "Product details will be updated soon."}
          </p>
         
          {/* Sizes (hidden for jewellery) */}
          {!isJewellery && availableSizes.length > 0 && (
            <div className="flex flex-col gap-4 my-8">
              <p>Select Size</p>
              <div className="flex gap-2">
                {availableSizes.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setSize(s)}
                    className={`border py-2 px-4 bg-gray-100 ${s === size ? "border-orange-500" : ""}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            className="bg-black text-white px-8 py-3 text-sm active:bg-gray-700"
          >
            ADD TO CART
          </button>

          <hr className="mt-8 sm:w-4/5" />
          <div className="text-sm text-gray-500 mt-5 flex flex-col gap-1">
            <p>100% Original product.</p>
            <p>Cash on delivery is available on this product.</p>
            <p>Easy return and exchange policy within 7 days.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Product;
