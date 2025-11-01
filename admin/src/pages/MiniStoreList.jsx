import { useCallback, useEffect, useState } from "react"; // Fixed: add useCallback to satisfy hooks lint without default React import.
import { toast } from "react-toastify";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function MiniStoreList() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState("all"); // all, active, inactive
  const navigate = useNavigate();

  const loadStores = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filterActive !== "all") params.isActive = filterActive === "active";

      const response = await api("/ministores/admin/all", { params });
      
      if (response.success) {
        setStores(response.stores || []);
      } else {
        toast.error(response.message || "Failed to load stores");
      }
    } catch (e) {
      const message = e?.response?.data?.message || e.message;
      toast.error("Error loading stores: " + message);
      console.error("Load stores error:", e);
    } finally {
      setLoading(false);
    }
  // Fixed: memoize loadStores so useEffect dependency list stays accurate.
  }, [filterActive, searchTerm]);

  useEffect(() => {
    loadStores();
  // Fixed: include memoized loadStores dependency per exhaustive-deps rule.
  }, [loadStores]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadStores();
  };

  const toggleStatus = async (id) => {
    // Optimistic UI update: toggle locally first
    setStores(prev => prev.map(s => s._id === id ? { ...s, toggling: true } : s));
    try {
      // call backend
      const response = await api(`/ministores/admin/${id}/toggle`, { method: "PATCH" });
      if (response.success) {
        toast.success(`Store ${response.isActive ? 'activated' : 'deactivated'} successfully`);
        // update single store state
        setStores(prev => prev.map(s => s._id === id ? { ...s, isActive: !!response.isActive, toggling: false } : s));
      } else {
        toast.error(response.message || 'Toggle failed');
        setStores(prev => prev.map(s => s._id === id ? { ...s, toggling: false } : s));
      }
    } catch (e) {
      const message = e?.response?.data?.message || e.message;
      toast.error("Error toggling status: " + message);
      setStores(prev => prev.map(s => s._id === id ? { ...s, toggling: false } : s));
    }
  };

  const deleteStore = async (id, displayName) => {
    if (!confirm(`Are you sure you want to delete "${displayName}"?\n\nThis will also delete the associated sub-admin user account.`)) {
      return;
    }

    try {
      const response = await api(`/ministores/admin/${id}`, { 
        method: "DELETE" 
      });
      
      if (response.success) {
        toast.success("Store and user deleted successfully");
        loadStores();
      }
    } catch (e) {
      const message = e?.response?.data?.message || e.message;
      toast.error("Error deleting store: " + message);
    }
  };

  const [activityModal, setActivityModal] = useState(false);
  const [activityData, setActivityData] = useState(null);

  const viewActivity = async (id) => {
    try {
      const res = await api(`/ministores/admin/${id}/activity`);
      if (res.success) {
        setActivityData(res.data);
        setActivityModal(true);
      } else {
        toast.error(res.message || 'Failed to fetch activity');
      }
    } catch (e) {
      const message = e?.response?.data?.message || e.message;
      toast.error('Error fetching activity: ' + message);
    }
  };

  const filteredStores = stores.filter(store => {
    if (filterActive === "active" && !store.isActive) return false;
    if (filterActive === "inactive" && store.isActive) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Mini Stores Management</h1>
        <button
          onClick={() => navigate("/ministores/add")}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
        >
          + Create New Store
        </button>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or slug..."
            className="flex-1 border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Search
          </button>
        </form>

        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Stores</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{stores.length}</div>
          <div className="text-sm text-blue-800">Total Stores</div>
        </div>
        <div className="bg-green-50 p-4 rounded border border-green-200">
          <div className="text-2xl font-bold text-green-600">
            {stores.filter(s => s.isActive).length}
          </div>
          <div className="text-sm text-green-800">Active</div>
        </div>
        <div className="bg-red-50 p-4 rounded border border-red-200">
          <div className="text-2xl font-bold text-red-600">
            {stores.filter(s => !s.isActive).length}
          </div>
          <div className="text-sm text-red-800">Inactive</div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto bg-white rounded border">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3 text-left text-sm font-semibold">Store Name</th>
              <th className="p-3 text-left text-sm font-semibold">Slug</th>
              <th className="p-3 text-left text-sm font-semibold">Sub-Admin Email</th>
              <th className="p-3 text-left text-sm font-semibold">Products</th>
              <th className="p-3 text-left text-sm font-semibold">Status</th>
              <th className="p-3 text-left text-sm font-semibold">Created</th>
              <th className="p-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStores.map((store) => (
              <tr key={store._id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {store.avatarUrl && (
                      <img 
                        src={store.avatarUrl} 
                        alt={store.displayName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    <span className="font-medium">{store.displayName}</span>
                  </div>
                </td>
                <td className="p-3 text-sm text-gray-600">
                  <code className="bg-gray-100 px-2 py-1 rounded">{store.slug}</code>
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {store.userId?.email || "N/A"}
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {store.products?.length || 0}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    store.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {store.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {store.createdAt 
                    ? new Date(store.createdAt).toLocaleDateString() 
                    : "N/A"}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <a
                      href={`https://tinymillion.com/${store.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View
                    </a>
                  <button
                    onClick={() => toggleStatus(store._id)}
                      className={`text-sm px-2 py-1 rounded ${
                        store.isActive
                          ? 'text-orange-600 hover:bg-orange-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {store.toggling ? (
                        <span className="inline-flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle></svg>
                          Updating...
                        </span>
                      ) : (store.isActive ? 'Disable' : 'Enable')}
                    </button>
                    <button
                      onClick={() => deleteStore(store._id, store.displayName)}
                      className="text-red-600 hover:bg-red-50 text-sm px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => viewActivity(store._id)}
                      className="text-sm px-2 py-1 rounded text-blue-600 hover:bg-blue-50"
                    >
                      View Activity
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredStores.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-2">No stores found</p>
            <button
              onClick={() => navigate("/ministores/add")}
              className="text-blue-600 hover:underline"
            >
              Create your first store
            </button>
          </div>
        )}
      </div>

      {activityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow max-w-3xl w-full p-6 overflow-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Store Activity</h3>
              <button onClick={() => setActivityModal(false)} className="text-gray-500">Close</button>
            </div>
            {activityData ? (
              <div className="space-y-3 text-sm">
                <div><strong>Total Products:</strong> {activityData.totalProducts}</div>
                <div><strong>Total Orders:</strong> {activityData.totalOrders}</div>
                <div><strong>Last Login:</strong> {activityData.lastLogin ? new Date(activityData.lastLogin).toLocaleString() : 'N/A'}</div>
                <div>
                  <h4 className="font-medium">Recent Activity</h4>
                  <ul className="list-disc pl-6 mt-2">
                    {activityData.recentActivity.map((a, idx) => (
                      <li key={idx}>
                        <strong>{a.action}</strong> — {a.timestamp ? new Date(a.timestamp).toLocaleString() : 'N/A'} {a.details?.name ? `: ${a.details.name}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div>Loading...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
