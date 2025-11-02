import { useCallback, useEffect, useState } from "react"; // Fix: rely on hooks directly instead of default React import to satisfy lint.
import { toast } from "react-toastify";
import { currency } from "../assets/constants"; // Fix: correct module path so Vite can resolve during build.
import { api } from "../lib/api";
import { simplePropTypes } from "../lib/simplePropTypes";

const List = ({ token }) => {
  const [list, setList] = useState([]);

  const fetchList = useCallback(async () => {
    try {
      const data = await api("/product/list");
      if (data.success) {
        const products = data?.data?.products || data.products || [];
        setList(products.slice().reverse()); // Fix: reverse a cloned array to avoid mutating cached API results.
      } else {
        toast.error(data.message || "Failed to load products");
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message);
    }
    // Fix: memoize fetchList so useEffect can safely include it as a dependency.
  }, []);

  const removeProduct = async (id) => {
    try {
      const data = await api("/product/remove", {
        method: "POST",
        body: { id },
      });
      if (data.success) {
        toast.success(data.message || "Product removed");
        await fetchList();
      } else {
        toast.error(data.message || "Failed to remove product");
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (token) {
      fetchList();
    }
    // Fix: include fetchList dependency to satisfy exhaustive-deps rule.
  }, [fetchList, token]);

  return (
    <>
      <p className="mb-2">All Products List</p>
      <div className="flex flex-col gap-2">
        <div className="hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b className="text-center">Action</b>
        </div>

        {list.map((item) => {
          const firstImg =
            Array.isArray(item.images) && item.images.length
              ? item.images[0]
              : "";
          return (
            <div
              className="grid grid-cols-[1fr_3fr_1fr] md:grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center gap-2 py-1 px-2 border text-sm"
              key={item._id}
            >
              <img
                className="w-12 h-12 object-cover"
                src={
                  firstImg ||
                  "https://dummyimage.com/48x48/eee/aaa&text=No+Img"
                }
                alt={item.name}
              />
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>
                {currency}
                {item.price}
              </p>
              <p
                onClick={() => removeProduct(item._id)}
                className="text-right md:text-center cursor-pointer text-lg"
                title="Remove product"
              >
                x
              </p>
            </div>
          );
        })}
         {!list.length && (
          <div className="py-10 text-center text-gray-500 border">No products yet.</div>
        )}
      </div>
    </>
  );
};

export default List;

List.propTypes = {
  token: simplePropTypes.string, // Fix: ensure prop validation is wired to the helper for lint compliance.
};
