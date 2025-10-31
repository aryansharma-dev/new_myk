// frontend/src/components/ProductItem.jsx
import PropTypes from "prop-types";
import {useContext, useMemo} from "react";
import ShopContext from '../context/ShopContextInstance';
import { Link } from "react-router-dom";
import { getProductImageArray } from "../utils/productImages";

const ProductItem = ({ id, image, name, price }) => {
  const { currency } = useContext(ShopContext);

  const normalizedImages = useMemo(() => {
    if (Array.isArray(image) || typeof image === "string") {
      return getProductImageArray({ images: image, image });
    }
    if (image && typeof image === "object") {
      return getProductImageArray(image);
    }
    return [];
  }, [image]);

  const imgSrc = useMemo(() => (normalizedImages.length > 0 ? normalizedImages[0] : ""), [normalizedImages]);

  return (
    <Link
      onClick={() => window.scrollTo(0, 0)}
      className="text-gray-700 cursor-pointer"
      to={`/product/${id}`}
    >
      <div className="overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={name || "Product"}
            loading="lazy"
            decoding="async"
            width={400}
            height={400}
            className="hover:scale-110 transition ease-in-out w-full h-auto object-cover"
          />
        ) : (
          // agar image missing ho to placeholder div
          <div className="w-full h-56 bg-gray-100 flex items-center justify-center">
            No image
          </div>
        )}
      </div>
      <p className="pt-3 pb-1 text-sm">{name || "Product"}</p>
      <p className="text-sm font-medium">
        {currency}
         {price ?? ""}
      </p>
    </Link>
  );
};

ProductItem.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  image: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.shape({ images: PropTypes.oneOfType([PropTypes.array, PropTypes.string]) }),
    PropTypes.object,
  ]),
  name: PropTypes.string,
  price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default ProductItem;
