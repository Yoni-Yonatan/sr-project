import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiChevronRight, FiChevronDown } from 'react-icons/fi';

const rowBase = "border-b border-secondary hover:bg-secondary/50 transition";
const cellBase = "py-3 px-4 text-gray-300";
const headerBase = "text-left py-3 px-4 font-semibold text-gray-400";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);
  const [formData, setFormData] = useState({
    jewelry_type: 'Gold',
    category_name: '',
    level: 0,
    parent_id: '',
    name: '',
  });
  const [existingCategories, setExistingCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.getCategories();
      setCategories(response.data);
      
      // Extract unique category names for dropdown
      const uniqueCategories = [...new Set(response.data.map(c => c.category_name).filter(Boolean))];
      setExistingCategories(uniqueCategories);
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, formData);
        toast.success('Category updated');
      } else {
        await api.addCategory(formData);
        toast.success('Category added');
      }
      resetForm();
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      jewelry_type: category.jewelry_type,
      category_name: category.category_name || '',
      level: category.level,
      parent_id: category.parent_id || '',
      name: category.name,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.deleteCategory(id);
      toast.success('Category deleted');
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Delete failed');
    }
  };

  const resetForm = () => {
    setFormData({
      jewelry_type: 'Gold',
      category_name: '',
      level: 0,
      parent_id: '',
      name: '',
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  const toggleExpand = (id) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const buildHierarchy = (items, parentId = null, level = 0) => {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        children: buildHierarchy(items, item.id, level + 1),
        hierarchyLevel: level,
      }));
  };

  const hierarchyData = buildHierarchy(categories);

  const renderHierarchy = (items) => {
    return items.map(item => (
      <React.Fragment key={item.id}>
        <tr className="border-b border-secondary hover:bg-secondary/50 transition">
          <td className="py-3 px-4">
            <div className="flex items-center" style={{ paddingLeft: `${item.hierarchyLevel * 30}px` }}>
              {item.children.length > 0 && (
                <button onClick={() => toggleExpand(item.id)} className="mr-2">
                  {expandedRows.includes(item.id) ? <FiChevronDown /> : <FiChevronRight />}
                </button>
              )}
              <span className={`px-2 py-1 rounded text-xs font-semibold mr-2 ${
                item.jewelry_type === 'Gold' ? 'bg-gold/20 text-gold' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {item.jewelry_type}
              </span>
              <span className="font-medium text-white">{item.name}</span>
            </div>
          </td>
          <td className="py-3 px-4 text-gray-300">{item.category_name || '-'}</td>
          <td className="py-3 px-4 text-gray-300">Level {item.level}</td>
          <td className="py-3 px-4">
            <div className="flex space-x-2">
              <button onClick={() => handleEdit(item)}
                className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg">
                <FiEdit2 />
              </button>
              <button onClick={() => handleDelete(item.id)}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                <FiTrash2 />
              </button>
            </div>
          </td>
        </tr>
        {expandedRows.includes(item.id) && renderHierarchy(item.children)}
      </React.Fragment>
    ));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Categories & Types</h2>
          <p className="text-gray-400 mt-1">Manage gold and diamond categories</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0">
          <FiPlus />
          <span>Add Category</span>
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4 text-white">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <label className="block text-sm font-medium text-gray-300 mb-1">Category Name</label>
                {existingCategories.length > 0 ? (
                  <select name="category_name" value={formData.category_name}
                    onChange={(e) => setFormData({...formData, category_name: e.target.value})}
                    className="input-field">
                    <option value="">Select Category</option>
                    {existingCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" name="category_name" value={formData.category_name}
                    onChange={(e) => setFormData({...formData, category_name: e.target.value})}
                    className="input-field" placeholder="Enter new category" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input type="text" name="name" value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input-field" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Level</label>
                <input type="number" name="level" value={formData.level}
                  onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})}
                  className="input-field" min="0" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Parent Item</label>
                <select name="parent_id" value={formData.parent_id}
                  onChange={(e) => setFormData({...formData, parent_id: e.target.value || null})}
                  className="input-field">
                  <option value="">None (Root)</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name} ({cat.jewelry_type})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">
                {editingCategory ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      category.jewelry_type === 'Gold' ? 'bg-gold/20 text-gold' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {category.jewelry_type}
                    </span>
                    <span className="font-medium text-white">{category.name}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-400">{category.category_name || '—'}</span>
                  <span className="text-gray-500">Level {category.level}</span>
                </div>
                <div className="flex justify-end space-x-2 pt-3 border-t border-secondary">
                  <button onClick={() => handleEdit(category)}
                    className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg">
                    <FiEdit2 />
                  </button>
                  <button onClick={() => handleDelete(category.id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No categories found
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary">
                  <th className="text-left py-3 px-4 font-semibold text-gray-400">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-400">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-400">Level</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {renderHierarchy(hierarchyData)}
              </tbody>
            </table>
            {categories.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No categories found
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Categories;