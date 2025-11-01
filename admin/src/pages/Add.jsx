import { useEffect, useState } from "react"; // Fixed: remove unused default React import flagged by lint.
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import { api } from "../lib/api";

const Add = () => {
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [image3, setImage3] = useState(null);
  const [image4, setImage4] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Men");
  const [subCategory, setSubCategory] = useState("Topwear");
  const [bestseller, setBestseller] = useState(false);
  const [sizes, setSizes] = useState([]);

  useEffect(() => {
    if (category === "Jewellery") setSizes([]);
    // Fixed: expand effect for clarity after lint-driven refactor.
  }, [category]);

   const resetForm = () => {
    setName(""); setDescription(""); setPrice("");
    setCategory("Men"); setSubCategory("Topwear"); setBestseller(false); setSizes([]);
    setImage1(null); setImage2(null); setImage3(null); setImage4(null);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!image1 && !image2 && !image3 && !image4) return toast.error("Please upload at least one image");
    if (category !== "Jewellery" && sizes.length === 0) return toast.error("Select at least one size");
    if (!name.trim() || !description.trim()) return toast.error("Name & description are required");

    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("description", description);
      fd.append("price", price);
      fd.append("category", category);
      fd.append("subCategory", subCategory);
      fd.append("bestseller", bestseller ? "true" : "false");
      fd.append("sizes", JSON.stringify(sizes));
      if (image1) fd.append("image1", image1);
      if (image2) fd.append("image2", image2);
      if (image3) fd.append("image3", image3);
      if (image4) fd.append("image4", image4);

      const data = await api("/product/add", {
        method: "POST",
        body: fd,
        maxBodyLength: Infinity,
      });

      if (data?.success) {
        toast.success(data.message || "Product added");
        resetForm();
      } else {
        toast.error(data?.message || "Something went wrong");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Error");
    }
  };

  const toggleSize = (size) => {
    setSizes((prev) => prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]);
  };

  return (
    <form onSubmit={onSubmitHandler} className="flex flex-col w-full items-start gap-3">
      <div>
        <p className="mb-2">Upload Image</p>
        <div className="flex gap-2">
          <label htmlFor="image1">
            <img className="w-20" src={image1 ? URL.createObjectURL(image1) : assets.upload_area} alt="" />
            <input onChange={(e) => setImage1(e.target.files[0] || null)} type="file" id="image1" hidden />
          </label>
          <label htmlFor="image2">
            <img className="w-20" src={image2 ? URL.createObjectURL(image2) : assets.upload_area} alt="" />
            <input onChange={(e) => setImage2(e.target.files[0] || null)} type="file" id="image2" hidden />
          </label>
          <label htmlFor="image3">
            <img className="w-20" src={image3 ? URL.createObjectURL(image3) : assets.upload_area} alt="" />
            <input onChange={(e) => setImage3(e.target.files[0] || null)} type="file" id="image3" hidden />
          </label>
          <label htmlFor="image4">
            <img className="w-20" src={image4 ? URL.createObjectURL(image4) : assets.upload_area} alt="" />
            <input onChange={(e) => setImage4(e.target.files[0] || null)} type="file" id="image4" hidden />
          </label>
        </div>
      </div>

      <div className="w-full">
        <p className="mb-2">Product name</p>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full max-w-[500px] px-3 py-2" type="text" placeholder="Type here" required />
      </div>

      <div className="w-full">
        <p className="mb-2">Product description</p>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full max-w-[500px] px-3 py-2" placeholder="Write content here" required />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:gap-8">
        <div>
          <p className="mb-2">Product category</p>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2">
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Kids">Kids</option>
            <option value="Jewellery">Jewellery</option>
          </select>
        </div>

        <div>
          <p className="mb-2">Sub category</p>
          <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="w-full px-3 py-2">
            <option value="Topwear">Topwear</option>
            <option value="Bottomwear">Bottomwear</option>
            <option value="Winterwear">Winterwear</option>
            <option value="Girlish">Girlish</option>
          </select>
        </div>

        <div>
          <p className="mb-2">Product Price</p>
                   <input value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-3 py-2 sm:w-[120px]" type="number" placeholder="25" min="0" step="0.01" />
        </div>
      </div>

      {category !== "Jewellery" && (
        <div>
          <p className="mb-2">Product Sizes</p>
          <div className="flex gap-3">
            {["S", "M", "L", "XL", "XXL"].map((size) => (
              <button type="button" key={size} onClick={() => toggleSize(size)} className={`${sizes.includes(size) ? "bg-pink-100" : "bg-slate-200"} px-3 py-1 cursor-pointer rounded`}>
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <input onChange={() => setBestseller((p) => !p)} checked={bestseller} type="checkbox" id="bestseller" />
        <label className="cursor-pointer" htmlFor="bestseller">Add to bestseller</label>
      </div>

      <button type="submit" className="w-28 py-3 mt-4 bg-black text-white">ADD</button>
    </form>
  );
};

export default Add;
