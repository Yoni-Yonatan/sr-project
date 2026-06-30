import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

const rowBase = "border-b border-secondary hover:bg-secondary/50 transition";
const headerBase = "text-left py-3 px-4 font-semibold text-gray-400";

const Karats = () => {
  const [karats, setKarats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingKarat, setEditingKarat] = useState(null);
  const [formData, setFormData] = useState({
    jewelry_type: 'Gold',
    name: '',
  });

  useEffect(() => {
    fetchKarats();
  }, []);

  const fetchKarats = async () => {
    try {
      const response = await api.getKarats();
      setKarats(response.data);
    } catch (error) {
      toast.error('Failed to fetch karats');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingKarat) {
        await api.updateKarat(editingKarat.id, formData);
        toast.success('Karat updated');
      } else {
        await api.addKarat(formData);
        toast.success('Karat added');
      }
      resetForm();
      fetchKarats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (karat) => {
    setEditingKarat(karat);
    setFormData({
      jewelry_type: karat.jewelry_type,
      name: karat.name,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.deleteKarat(id);
      toast.success('Karat deleted');
      fetchKarats();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const resetForm = () => {
    setFormData({ jewelry_type: 'Gold', name: '' });
    setEditingKarat(null);
    setShowForm(false);
  };

  const goldKarats = karats.filter(k => k.jewelry_type === 'Gold');
  const diamondKarats = karats.filter(k => k.jewelry_type === 'Diamond');

  const renderGrid = (items, type) => (
    <div className="mb-8">
      <h3 className={`text-lg font-semibold mb-4 ${
        type === 'Gold' ? 'text-gold' : 'text-blue-400'
      }`}>
        {type} Karats
      </h3>
      {/* Mobile: horizontal scroll chips */}
      <div className="flex lg:hidden gap-2 overflow-x-auto pb-2">
        {items.map(karat => (
          <div key={karat.id} className="flex-shrink-0 card px-4 py-3 flex items-center space-x-3">
            <span className="font-medium text-white whitespace-nowrap">{karat.name}</span>
            <div className="flex space-x-1">
              <button onClick={() => handleEdit(karat)}
                className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-lg">
                <FiEdit2 size={14} />
              </button>
              <button onClick={() => handleDelete(karat.id)}
                className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg">
                <FiTrash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-gray-400 text-sm py-4">No {type} karats added yet</p>
        )}
      </div>
      {/* Desktop: table */}
      <div className="hidden lg:block card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-secondary">
              <th className="text-left py-3 px-4 font-semibold text-gray-400">Name</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(karat => (
              <tr key={karat.id} className="border-b border-secondary hover:bg-secondary/50">
                <td className="py-3 px-4 font-medium text-white">{karat.name}</td>
                <td className="py-3 px-4">
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => handleEdit(karat)}
                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg">
                      <FiEdit2 />
                    </button>
                    <button onClick={() => handleDelete(karat.id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan="2" className="text-center py-8 text-gray-400">
                  No {type} karats added yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Karats</h2>
          <p className="text-gray-400 mt-1">Manage gold and diamond karat types</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0">
          <FiPlus />
          <span>Add Karat</span>
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4 text-white">
            {editingKarat ? 'Edit Karat' : 'Add New Karat'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Jewelry Type</label>
                <select name="jewelry_type" value={formData.jewelry_type}
                  onChange={(e) => setFormData({...formData, jewelry_type: e.target.value})}
                  className="input-field">
                  <option value="Gold">Gold</option>
                  <option value="Diamond">Diamond</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input type="text" name="name" value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input-field" placeholder="e.g., 24K, 22K, 18K" required />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">
                {editingKarat ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading karats...</p>
        </div>
      ) : (
        <>
          {renderGrid(goldKarats, 'Gold')}
          {renderGrid(diamondKarats, 'Diamond')}
        </>
      )}
    </div>
  );
};

export default Karats;