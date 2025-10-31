import userModel from "../models/userModel.js";

// Add products to the user's cart. The user ID can be provided in
// req.body.userId or (preferably) derived from req.userId when using
// the auth middleware. The cart is stored on the user document as
// `cartData`, with sizes as keys and quantities as values.
const addToCart = async (req, res) => {
  try {
    const { itemId, size } = req.body;
    // prefer userId from auth middleware; fall back to body
    const userId = req.body.userId || req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authorized" });
    }

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }
    let cartData = userData.cartData || {};

    // Default to "nosize" if no size is provided
    const sizeKey = size && size !== "" ? size : "nosize";

    if (cartData[itemId]) {
      if (cartData[itemId][sizeKey]) {
        cartData[itemId][sizeKey] += 1;
      } else {
        cartData[itemId][sizeKey] = 1;
      }
    } else {
      cartData[itemId] = {};
      cartData[itemId][sizeKey] = 1;
    }

    await userModel.findByIdAndUpdate(userId, { cartData });
    return res.json({ success: true, message: "Added To Cart" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// Update quantity for a given item/size in the user's cart
const updateCart = async (req, res) => {
  try {
    const { itemId, size, quantity } = req.body;
    const userId = req.body.userId || req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authorized" });
    }
    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }
    let cartData = userData.cartData || {};
    const sizeKey = size && size !== "" ? size : "nosize";
    if (!cartData[itemId]) {
      cartData[itemId] = {};
    }
    cartData[itemId][sizeKey] = quantity;
    await userModel.findByIdAndUpdate(userId, { cartData });
    return res.json({ success: true, message: "Cart Updated" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// Retrieve the user's cart data
const getUserCart = async (req, res) => {
  try {
    const userId = req.body.userId || req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authorized" });
    }
    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }
    const cartData = userData.cartData || {};
    return res.json({ success: true, cartData });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

export { addToCart, updateCart, getUserCart };