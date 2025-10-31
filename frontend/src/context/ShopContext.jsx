import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api, { backendUrl } from "../lib/api";
import ShopContext from "./ShopContextInstance";

const isBrowser = typeof window !== "undefined";
const CART_STORAGE_KEY = "tm_cart_state";
const LEGACY_CART_KEY = "guest_cart";

const cloneCart = (value) => {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch (err) {
      // fall through to JSON clone
    }
  }
  try {
    return JSON.parse(JSON.stringify(value || {}));
  } catch (_) {
    return {};
  }
};

const normaliseCart = (input = {}) => {
  if (!input || typeof input !== "object") return {};
  const result = {};
  for (const [productId, sizes] of Object.entries(input)) {
    if (!sizes || typeof sizes !== "object") continue;
    const sizeEntries = {};
    for (const [sizeKey, qtyValue] of Object.entries(sizes)) {
      const size = String(sizeKey || "").trim();
      const qty = Number(qtyValue);
      if (!size || !Number.isFinite(qty) || qty <= 0) continue;
      sizeEntries[size] = qty;
    }
    if (Object.keys(sizeEntries).length) {
      result[String(productId)] = sizeEntries;
    }
  }
  return result;
};

const mergeCartData = (base = {}, incoming = {}) => {
  const merged = normaliseCart(base);
  const incomingNormalised = normaliseCart(incoming);
  for (const [productId, sizes] of Object.entries(incomingNormalised)) {
    if (!merged[productId]) merged[productId] = {};
    for (const [size, qty] of Object.entries(sizes)) {
      if (!merged[productId][size]) {
        merged[productId][size] = qty;
      }
    }
  }
  return merged;
};

const readCartFromStorage = () => {
  if (!isBrowser) return {};
  let cart = {};
  for (const key of [CART_STORAGE_KEY, LEGACY_CART_KEY]) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      cart = mergeCartData(cart, parsed);
    } catch (err) {
      console.warn(`Failed to parse cart from ${key}`, err);
    }
  }
  return cart;
};

const persistCart = (cart) => {
  if (!isBrowser) return;
  const normalised = normaliseCart(cart);
  try {
    if (Object.keys(normalised).length) {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalised));
    } else {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }
    window.localStorage.removeItem(LEGACY_CART_KEY);
  } catch (err) {
    console.warn("Failed to persist cart", err);
  }
};

const resolveDeliveryFee = () => {
  const raw = import.meta.env.VITE_DELIVERY_FEE ?? 10;
  const value = Number(raw);
  if (Number.isFinite(value) && value >= 0) return value;
  return 10;
};

const normaliseProductRecord = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  const priceValue = Number(raw?.price ?? 0);
  return {
    ...raw,
    price: Number.isFinite(priceValue) && priceValue >= 0 ? priceValue : 0,
  };
};

const resolvePagination = (pagination, fallbackPage, fallbackLimit, count) => {
  if (!pagination || typeof pagination !== "object") {
    const hasMoreFallback = Number(count) === fallbackLimit && fallbackLimit > 0;
    return {
      page: fallbackPage,
      limit: fallbackLimit,
      total: Number(count) || 0,
      totalPages: null,
      hasMore: hasMoreFallback,
    };
  }

  const safePage = Number(pagination.page);
  const safeLimit = Number(pagination.limit);
  const safeTotal = Number(pagination.total);
  const safeTotalPages = Number(pagination.totalPages);

  return {
    page: Number.isFinite(safePage) && safePage > 0 ? safePage : fallbackPage,
    limit: Number.isFinite(safeLimit) && safeLimit > 0 ? safeLimit : fallbackLimit,
    total: Number.isFinite(safeTotal) && safeTotal >= 0 ? safeTotal : Number(count) || 0,
    totalPages: Number.isFinite(safeTotalPages) && safeTotalPages >= 0 ? safeTotalPages : null,
    hasMore: Boolean(pagination.hasMore),
  };
};

const ShopContextProvider = ({ children }) => {
  const currency = "₹";
  const delivery_fee = resolveDeliveryFee();

  const [cartItems, setCartItems] = useState(() => normaliseCart(readCartFromStorage()));
  const [products, setProducts] = useState([]);
  const [productMap, setProductMap] = useState(() => new Map());
  const [productPagination, setProductPagination] = useState(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [token, setToken] = useState(() => {
    if (!isBrowser) return "";
    try {
      return (
        window.localStorage.getItem("token") ||
        window.sessionStorage.getItem("token") ||
        ""
      );
    } catch (_) {
      return window.localStorage.getItem("token") || "";
    }
  });
  const navigate = useNavigate();

  const productRequestCacheRef = useRef(new Map());
  
  const cartMetrics = useMemo(() => {
    let subtotal = 0;
    let totalCount = 0;

    for (const [productId, sizes] of Object.entries(cartItems || {})) {
      const product = productMap.get(productId);
      const price = Number(product?.price ?? 0);
      if (!Number.isFinite(price) || price <= 0) continue;

      for (const qtyValue of Object.values(sizes || {})) {
        const qty = Number(qtyValue);
        if (!Number.isFinite(qty) || qty <= 0) continue;
        totalCount += qty;
        subtotal += price * qty;
      }
    }

    if (!Number.isFinite(subtotal)) {
      subtotal = 0;
    }

    const shipping = subtotal > 0 ? delivery_fee : 0;
    const total = subtotal + shipping;

    return { subtotal, shipping, total, count: totalCount };
  }, [cartItems, productMap, delivery_fee]);

  const isJewelleryCategory = (cat) => {
    if (!cat) return false;
    const c = String(cat).trim().toLowerCase();
    return c === "jewellery" || c === "jewelry" || c === "jewelery";
  };

  const addToCart = async (itemId, size, categoryOptional) => {
    const productId = String(itemId);
    let category = categoryOptional;
    if (!category) {
      const found = productMap.get(productId);
      if (found) category = found.category;
    }
    const isJewellery = isJewelleryCategory(category);
    if (!isJewellery && !size) {
      toast.error("Select Product Size");
      return;
    }
    const sizeKey = isJewellery ? "nosize" : String(size).trim();
    if (!sizeKey) {
      toast.error("Select Product Size");
      return;
    }
    let nextQuantity = 1;
    setCartItems((prev) => {
      const cartData = cloneCart(prev);
      if (!cartData[productId]) cartData[productId] = {};
      const current = Number(cartData[productId][sizeKey] || 0);
      const updated = Number.isFinite(current) && current >= 0 ? current + 1 : 1;
      cartData[productId][sizeKey] = updated;
      nextQuantity = updated;
      return cartData;
    });

    if (token) {
      try {
        await api.post("/api/cart/update", {
          itemId: productId,
          size: sizeKey,
          quantity: nextQuantity,
        });
      } catch (error) {
        console.error("addToCart failed", error);
        toast.error(error?.response?.data?.message || error.message);
      }
    }
  };

  const updateQuantity = async (itemId, size, quantity) => {
    const productId = String(itemId);
    const sizeKey = String(size || "").trim() || "nosize";
    const qtyNumber = Number(quantity);

    setCartItems((prev) => {
      const cartData = cloneCart(prev);
      if (!cartData[productId]) cartData[productId] = {};

      if (!Number.isFinite(qtyNumber) || qtyNumber <= 0) {
        delete cartData[productId][sizeKey];
      } else {
        cartData[productId][sizeKey] = qtyNumber;
      }

      if (cartData[productId] && Object.keys(cartData[productId]).length === 0) {
        delete cartData[productId];
      }

      return cartData;
    });

    if (token) {
      try {
        await api.post("/api/cart/update", { itemId, size, quantity });
      } catch (error) {
        console.error("updateQuantity failed", error);
        toast.error(error?.response?.data?.message || error.message);
      }
    }
  };

  const getCartCount = () => cartMetrics.count;

  const getCartAmount = () => cartMetrics.subtotal;

  const getCartSummary = () => ({
    subtotal: cartMetrics.subtotal,
    shipping: cartMetrics.shipping,
    total: cartMetrics.total,
  });

  const mergeProductsIntoState = useCallback((incoming, append) => {
    if (!Array.isArray(incoming) || incoming.length === 0) {
      if (!append) {
        setProducts([]);
        setProductMap(new Map());
      }
      return;
    }

    setProductMap((prev) => {
      const next = append ? new Map(prev) : new Map();
      incoming.forEach((product) => {
        if (product?._id) {
          next.set(String(product._id), product);
        }
      });
      return next;
    });

    setProducts((prev) => {
      if (!append) {
        return incoming;
      }

      const base = [...prev];
      const indexById = new Map();
      base.forEach((item, index) => {
        if (item?._id) {
          indexById.set(String(item._id), index);
        }
      });

      incoming.forEach((product) => {
        const id = product?._id ? String(product._id) : "";
        if (!id) return;
        if (indexById.has(id)) {
          const idx = indexById.get(id);
          base[idx] = product;
        } else {
          indexById.set(id, base.length);
          base.push(product);
        }
        });

      return base;
    });
  }, []);

  const getProductsData = useCallback(
    async ({ page = 1, limit = 30, append = false } = {}) => {
      setIsLoadingProducts(true);
      try {
        const { data } = await api.get("/api/product/list", {
          params: { page, limit },
        });

        if (data.success) {
          const list = data?.data?.products || data.products || [];
          const normalisedProducts = list
            .map((item) => normaliseProductRecord(item))
            .filter(Boolean);

          mergeProductsIntoState(normalisedProducts, append);

          const pagination = data?.data?.pagination || data.pagination || null;
          setProductPagination(resolvePagination(pagination, page, limit, normalisedProducts.length));

          return normalisedProducts;
        }

        toast.error(data.message || "Failed to load products");
        return [];
      } catch (error) {
        console.error("getProductsData failed", error);
        toast.error(error?.response?.data?.message || error.message);
        return [];
      } finally {
        setIsLoadingProducts(false);
      }
    },
    [mergeProductsIntoState]
  );

  const loadNextProductsPage = useCallback(async () => {
    if (!productPagination || !productPagination.hasMore) {
      return null;
    }
    const currentPage = Number(productPagination.page) || 1;
    const limit = Number(productPagination.limit) || 30;
    return getProductsData({ page: currentPage + 1, limit, append: true });
  }, [getProductsData, productPagination]);

  const ensureProductLoaded = useCallback(
    async (productId) => {
      const id = String(productId || "").trim();
      if (!id) return null;

      if (productMap.has(id)) {
        return productMap.get(id);
      }

      const cache = productRequestCacheRef.current;
      if (cache.has(id)) {
        return cache.get(id);
      }

      const fetchPromise = (async () => {
        try {
          const { data } = await api.post("/api/product/single", { productId: id });
          if (!data?.success) {
            toast.error(data?.message || "Product unavailable");
            return null;
          }

          const rawProduct = data?.data?.product || data.product || null;
          const product = normaliseProductRecord(rawProduct);
          if (!product) return null;

          mergeProductsIntoState([product], true);
          return product;
        } catch (error) {
          console.error("ensureProductLoaded failed", error);
          toast.error(error?.response?.data?.message || error.message);
          return null;
        } finally {
          cache.delete(id);
        }
      })();

      cache.set(id, fetchPromise);
      return fetchPromise;
    },
    [mergeProductsIntoState, productMap]
  );

  const getUserCart = async (tok) => {
    if (!tok) return;
    try {
      const { data } = await api.post("/api/cart/get");
      if (data.success) {
        const serverCart = normaliseCart(data?.data?.cartData || data.cartData || {});
        setCartItems((prev) => mergeCartData(serverCart, prev));
      }
    } catch (error) {
      console.error("getUserCart failed", error);
      const status = error?.response?.status;
      if (status === 401) {
        if (isBrowser) {
          try {
            window.localStorage.removeItem("token");
            window.sessionStorage.removeItem("token");
          } catch (_) {
            // ignore storage errors
          }
        }
        setToken("");
        setCartItems({});
        toast.error("Session expired. Please login again.");
      } else {
        toast.error(error?.response?.data?.message || error.message);
      }
    }
  };

  useEffect(() => {
    getProductsData();
  }, [getProductsData]);

  useEffect(() => {
    if (!isBrowser) return;

    const storedToken =
      window.localStorage.getItem("token") ||
      window.sessionStorage.getItem("token");

    if (!token && storedToken) {
      setToken(storedToken);
      return;
    }

    if (token) {
      window.localStorage.setItem("token", token);
      try {
        window.sessionStorage.setItem("token", token);
      } catch (_) {
        // ignore session storage errors
      }
      getUserCart(token);
    } else {
      window.localStorage.removeItem("token");
      try {
        window.sessionStorage.removeItem("token");
      } catch (_) {
        // ignore session storage errors
      }
    }
  }, [token]);

  useEffect(() => {
    persistCart(cartItems);
  }, [cartItems]);

  const value = {
    products,
    productMap,
    productPagination,
    isLoadingProducts,
    currency,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    setCartItems,
    addToCart,
    getCartCount,
    updateQuantity,
    getCartAmount,
    getCartSummary,
    navigate,
    backendUrl,
    api,
    token,
    setToken,
    getProductsData,
    loadNextProductsPage,
    loadNextPage: loadNextProductsPage,
    ensureProductLoaded,
  };

  return (
    <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
  );
};

ShopContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ShopContextProvider;