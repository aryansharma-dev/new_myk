import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cartData: { type: Object, default: {} },

    // 🆕 NEW FIELDS FOR SUB-ADMIN
    role: { 
        type: String, 
        enum: ['customer', 'subadmin', 'admin'], 
        default: 'customer' 
    },
    miniStoreId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MiniStore',
        default: null 
    }
}, { minimize: false });

const userModel = mongoose.models.User || mongoose.model('User', userSchema);

export default userModel;