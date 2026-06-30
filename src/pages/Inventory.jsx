import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiFilter, FiX } from 'react-icons/fi';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [karats, setKarats] = useState([]);
  const [filteredKarats, setFilteredKarats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [filters, setFilters] = useState({
    karat: '',
    jewelry_type: '',
    status: '',
  });
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    jewelry_type: 'Gold',
    category_id: '',
    karat_id: '',
    base_price: '',
    current_price: '',
    weight_grams: '',
    is_sold: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchFilteredInventory();
  }, [filters]);

  useEffect(() => {
    if (formData.jewelry_type) {
      const filtered = karats.filter(k => k.jewelry_type === formData.jewelry_type);
      setFilteredKarats(filtered);
    }
  }, [formData.jewelry_type, karats]);

  useEffect(() => {
    if (currentPrice) {
      setFormData(prev => ({ ...prev, current_price: currentPrice }));
    }
  }, [currentPrice]);

  const fetchData = async () => {
    try {
      const [invRes, catRes, karatRes, priceRes] = await Promise.all([
        api.getInventory(),
        api.getCategories(),
        api.getKarats(),
        api.getCurrentPrice(),
      ]);
      setInventory(invRes.data);
      setCategories(catRes.data);
      setKarats(karatRes.data);
      if (priceRes.data) {
        setCurrentPrice(priceRes.data.amount);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredInventory = async () => {
    try {
      const params = {};
      if (filters.karat) params.karat = filters.karat;
      if (filters.jewelry_type) params.jewelry_type = filters.jewelry_type;
      if (filters.status) params.status = filters.status;
      
      const response = await api.getInventory(params);
      setInventory(response.data);
    } catch (error) {
      console.error('Filter error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        base_price: parseFloat(formData.base_price),
        weight_grams: parseFloat(formData.weight_grams),
      };

      if (editingItem) {
        await api.updateInventory(editingItem.id, data);
        toast.success('Item updated');
      } else {
        await api.addInventory(data);
        toast.success('Item added');
      }
      resetForm();
      fetchFilteredInventory();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      date: item.date,
      jewelry_type: item.jewelry_type,
      category_id: item.category_id,
      karat_id: item.karat_id,
      base_price: item.base_price,
      current_price: item.current_price,
      weight_grams: item.weight_grams,
      is_sold: item.is_sold,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.deleteInventory(id);
      toast.success('Item deleted');
      fetchFilteredInventory();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      jewelry_type: 'Gold',
      category_id: '',
      karat_id: '',
      base_price: '',
      current_price: currentPrice,
      weight_grams: '',
      is_sold: false,
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const clearFilters = () => {
    setFilters({ karat: '', jewelry_type: '', status: '' });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Inventory</h2>
          <p className="text-gray-400 mt-1">Manage gold and diamond inventory</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0">
          <FiPlus />
          <span>Add Item</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
          <FiFilter className="text-gray-500 hidden sm:block" />
          <select value={filters.jewelry_type} onChange={(e) => setFilters({...filters, jewelry_type: e.target.value})}
            className="input-field w-full sm:w-auto">
            <option value="">All Types</option>
            <option value="Gold">Gold</option>
            <option value="Diamond">Diamond</option>
          </select>
          <select value={filters.karat} onChange={(e) => setFilters({...filters, karat: e.target.value})}
            className="input-field w-full sm:w-auto">
            <option value="">All Karats</option>
            {karats.map(k => (
              <option key={k.id} value={k.id}>{k.name}</option>
            ))}
          </select>
          <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="input-field w-full sm:w-auto">
            <option value="">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="sold">Sold</option>
          </select>
          {(filters.karat || filters.jewelry_type || filters.status) && (
            <button onClick={clearFilters} className="text-red-400 hover:text-red-300 flex items-center space-x-1">
              <FiX />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4 text-white">
            {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                <input type="date" value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Jewelry Type</label>
                <select value={formData.jewelry_type}
                  onChange={(e) => setFormData({...formData, jewelry_type: e.target.value, karat_id: ''})}
                  className="input-field">
                  <option value="Gold">Gold</option>
                  <option value="Diamond">Diamond</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Karat</label>
                <select value={formData.karat_id}
                  onChange={(e) => setFormData({...formData, karat_id: e.target.value})}
                  className="input-field" required>
                  <option value="">Select Karat</option>
                  {filteredKarats.map(k => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                <select value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  className="input-field">
                  <option value="">Select Category</option>
                  
                  {categories.filter(c => c.jewelry_type === formData.jewelry_type)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                  }
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Base Price</label>
                <input type="number" step="0.01" value={formData.base_price}
                  onChange={(e) => setFormData({...formData, base_price: e.target.value})}
                  className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Current Price (auto)</label>
                <input type="number" step="0.01" value={formData.current_price}
                  className="input-field bg-primary border-secondary text-gray-300" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Weight (grams)</label>
                <input type="number" step="0.001" value={formData.weight_grams}
                  onChange={(e) => setFormData({...formData, weight_grams: e.target.value})}
                  className="input-field" required />
              </div>
              {editingItem && (
                <div className="flex items-center">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={formData.is_sold}
                      onChange={(e) => setFormData({...formData, is_sold: e.target.checked})}
                      className="w-5 h-5 text-gold rounded" />
                    <span className="text-sm font-medium text-gray-300">Mark as Sold</span>
                  </label>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">
                {editingItem ? 'Update' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inventory Cards */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {inventory.map(item => (
            <div key={item.id} className={`card relative ${
              item.is_sold ? 'opacity-60' : ''
            }`}>
              {item.is_sold && (
                <div className="absolute top-4 right-4 bg-red-500/80 text-white px-3 py-1 rounded-full text-xs font-bold">
                  SOLD
                </div>
              )}
              {!item.is_sold && (
                <div className="absolute top-4 right-4 bg-green-500/80 text-white px-3 py-1 rounded-full text-xs font-bold">
                  IN STOCK
                </div>
              )}
              
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  item.jewelry_type === 'Gold' ? 'bg-gold/20 text-gold' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {item.jewelry_type}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <h4 className="font-semibold text-lg text-white">{item.karat_name}</h4>
                <p className="text-gray-400 text-sm">{item.category_name || 'Uncategorized'}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Weight:</span>
                  <span className="font-semibold text-gray-200">{item.weight_grams}g</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Base Price:</span>
                  <span className="font-semibold text-gray-200">{formatCurrency(item.base_price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Current Price:</span>
                  <span className="font-semibold text-gold">{formatCurrency(item.current_price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Date:</span>
                  <span className="font-semibold text-gray-200">{new Date(item.date).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-secondary">
                <button onClick={() => handleEdit(item)}
                  className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg">
                  <FiEdit2 />
                </button>
                <button onClick={() => handleDelete(item.id)}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}

          {inventory.length === 0 && (
            <div className="col-span-full text-center py-16">
              <FiPackage className="mx-auto text-gray-600" size={64} />
              <p className="mt-4 text-gray-400 text-lg">No inventory items found</p>
              <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
                Add First Item
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Inventory;