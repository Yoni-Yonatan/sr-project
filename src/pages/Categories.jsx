import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiBox, FiLayers, FiEdit2, FiTrash2, FiChevronDown, FiChevronRight } from 'react-icons/fi';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  
  const [formData, setFormData] = useState({
    mainCategory: '',
    subCategory: '',
    specificType: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.getCategories();
      setCategories(response.data);
      
      // Auto-expand all level 0 and level 1 nodes by default to match screenshot look
      const toExpand = new Set();
      response.data.filter(c => c.level === 0 || c.level === 1).forEach(c => toExpand.add(c.id));
      setExpandedNodes(toExpand);
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (name, level, parentId) => {
    const fd = new FormData();
    fd.append('name', name);
    fd.append('level', level);
    fd.append('jewelry_type', 'Gold'); // default
    if (parentId) fd.append('parent_id', parentId);
    
    const res = await api.addCategory(fd);
    return res.data;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.mainCategory.trim()) return toast.error('Main Category is required');
    
    setSaving(true);
    try {
      let currentParentId = null;

      // 1. Process Main Category (Level 0)
      const mainName = formData.mainCategory.trim();
      let mainCat = categories.find(c => c.name.toLowerCase() === mainName.toLowerCase() && c.level === 0);
      if (!mainCat) {
        mainCat = await createCategory(mainName, 0, null);
      }
      currentParentId = mainCat.id;

      // 2. Process Subcategory (Level 1)
      const subName = formData.subCategory.trim();
      if (subName) {
        let subCat = categories.find(c => c.name.toLowerCase() === subName.toLowerCase() && c.parent_id === currentParentId);
        if (!subCat) {
          subCat = await createCategory(subName, 1, currentParentId);
        }
        currentParentId = subCat.id;

        // 3. Process Specific Type (Level 2)
        const typeName = formData.specificType.trim();
        if (typeName) {
          let specType = categories.find(c => c.name.toLowerCase() === typeName.toLowerCase() && c.parent_id === currentParentId);
          if (!specType) {
            await createCategory(typeName, 2, currentParentId);
          }
        }
      }

      toast.success('Category path saved');
      setFormData({ mainCategory: '', subCategory: '', specificType: '' });
      await fetchCategories();
    } catch (err) {
      toast.error('Failed to save category path');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? It will delete all subcategories inside it as well.')) return;
    try {
      await api.deleteCategory(id);
      toast.success('Category deleted');
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Delete failed');
    }
  };

  const handleEdit = (category) => {
    // For simplicity, editing populates the form path
    // A complete edit would require more complex state, but the form path is a good start
    if (category.level === 0) {
      setFormData({ mainCategory: category.name, subCategory: '', specificType: '' });
    } else if (category.level === 1) {
      const parent = categories.find(c => c.id === category.parent_id);
      setFormData({ mainCategory: parent?.name || '', subCategory: category.name, specificType: '' });
    } else if (category.level === 2) {
      const parent = categories.find(c => c.id === category.parent_id);
      const grandParent = categories.find(c => c.id === parent?.parent_id);
      setFormData({ mainCategory: grandParent?.name || '', subCategory: parent?.name || '', specificType: category.name });
    }
  };

  const toggleExpand = (id) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const mainCategories = categories.filter(c => c.level === 0);
  const getChildren = (parentId) => categories.filter(c => c.parent_id === parentId);

  const numCategories = mainCategories.length;
  const numSubcategories = categories.filter(c => c.level === 1).length;
  const numTypes = categories.filter(c => c.level === 2).length;
  const totalCategories = categories.length;

  // Datalists options
  const mainOptions = [...new Set(categories.filter(c => c.level === 0).map(c => c.name))];
  const subOptions = formData.mainCategory 
    ? categories.filter(c => c.level === 1 && categories.find(p => p.id === c.parent_id && p.name.toLowerCase() === formData.mainCategory.toLowerCase())).map(c => c.name)
    : [];
  const typeOptions = formData.subCategory
    ? categories.filter(c => c.level === 2 && categories.find(p => p.id === c.parent_id && p.name.toLowerCase() === formData.subCategory.toLowerCase())).map(c => c.name)
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Categories</h2>
          <p className="text-gray-400 mt-1 text-sm">Manage gold category hierarchy</p>
        </div>
        <button className="bg-gold hover:bg-yellow-400 text-secondary font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors">
          <FiPlus className="text-lg" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-secondary rounded-xl p-6 border border-white/5 shadow-xl relative overflow-hidden">
            <h3 className="text-lg font-semibold text-white mb-6">Create Category Path</h3>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Main Category</label>
                <div className="relative">
                  <input
                    list="main-categories"
                    value={formData.mainCategory}
                    onChange={e => setFormData({...formData, mainCategory: e.target.value})}
                    placeholder="Select or enter main category"
                    className="w-full bg-primary/80 border border-white/10 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-gold transition-colors appearance-none"
                  />
                  <datalist id="main-categories">
                    {mainOptions.map((opt, i) => <option key={i} value={opt} />)}
                  </datalist>
                  <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Subcategory</label>
                <div className="relative">
                  <input
                    list="sub-categories"
                    value={formData.subCategory}
                    onChange={e => setFormData({...formData, subCategory: e.target.value})}
                    placeholder="Optional: add subcategory"
                    className="w-full bg-primary/80 border border-white/10 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-gold transition-colors appearance-none"
                  />
                  <datalist id="sub-categories">
                    {subOptions.map((opt, i) => <option key={i} value={opt} />)}
                  </datalist>
                  <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Specific Type</label>
                <div className="relative">
                  <input
                    list="type-categories"
                    value={formData.specificType}
                    onChange={e => setFormData({...formData, specificType: e.target.value})}
                    placeholder="Optional: add specific type"
                    className="w-full bg-primary/80 border border-white/10 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-gold transition-colors appearance-none"
                  />
                  <datalist id="type-categories">
                    {typeOptions.map((opt, i) => <option key={i} value={opt} />)}
                  </datalist>
                  <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="w-full bg-gold hover:bg-yellow-400 text-secondary font-bold py-3 px-4 rounded-lg transition-colors mt-2 disabled:opacity-70"
              >
                {saving ? 'Saving...' : 'Save Category'}
              </button>
            </form>
          </div>

          {/* Stats Boxes */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-secondary rounded-xl p-4 border border-white/5 flex flex-col justify-center items-center">
              <div className="flex items-center space-x-2 mb-1 text-gold">
                <FiBox />
                <span className="text-xl font-bold text-white">{numCategories}</span>
              </div>
              <span className="text-xs text-gray-500">Categories</span>
            </div>
            <div className="bg-secondary rounded-xl p-4 border border-white/5 flex flex-col justify-center items-center">
              <div className="flex items-center space-x-2 mb-1 text-gold">
                <FiPlus className="border border-gold rounded-full p-0.5" />
                <span className="text-xl font-bold text-white">{numSubcategories}</span>
              </div>
              <span className="text-xs text-gray-500">Subcategories</span>
            </div>
            <div className="bg-secondary rounded-xl p-4 border border-white/5 flex flex-col justify-center items-center">
              <div className="flex items-center space-x-2 mb-1 text-gold">
                <FiLayers />
                <span className="text-xl font-bold text-white">{numTypes}</span>
              </div>
              <span className="text-xs text-gray-500">Types</span>
            </div>
          </div>
        </div>

        {/* Right Column: Hierarchy Preview */}
        <div className="lg:col-span-8 bg-secondary rounded-xl p-6 border border-white/5 shadow-xl flex flex-col min-h-[600px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">Hierarchy Preview</h3>
            <span className="bg-primary px-3 py-1 rounded-full text-xs text-gray-400 border border-white/5">
              {totalCategories} categories
            </span>
          </div>

          {totalCategories === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center pb-10">
              <div className="w-32 h-32 rounded-full border border-dashed border-gray-600 flex items-center justify-center mb-6">
                <div className="text-gold opacity-80">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="10" y="3" width="4" height="4" rx="1"></rect>
                    <path d="M12 7v4"></path>
                    <path d="M6 11h12"></path>
                    <path d="M6 11v2"></path>
                    <path d="M18 11v2"></path>
                    <rect x="4" y="13" width="4" height="4" rx="1"></rect>
                    <rect x="16" y="13" width="4" height="4" rx="1"></rect>
                    <path d="M12 11v2"></path>
                    <rect x="10" y="13" width="4" height="4" rx="1"></rect>
                  </svg>
                </div>
              </div>
              <h4 className="text-xl font-bold text-white mb-2">No categories yet</h4>
              <p className="text-gray-400 text-sm mb-6">Create your first category path to start the hierarchy.</p>
              <button className="border border-gold/50 text-gold hover:bg-gold/10 font-medium py-2 px-6 rounded-lg flex items-center space-x-2 transition-colors">
                <FiPlus />
                <span>Add first category</span>
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 space-y-1">
              {mainCategories.map((main, index) => {
                const subcats = getChildren(main.id);
                const isExpanded = expandedNodes.has(main.id);
                
                return (
                  <div key={main.id} className="mb-2">
                    {/* Level 0: Main Category */}
                    <div className="flex items-center justify-between py-2 px-3 hover:bg-primary/40 rounded-lg group transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="text-gold">
                          <FiBox />
                        </div>
                        <span className="font-bold text-white text-sm">
                          {index + 1}. {main.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-xs text-gray-500">{subcats.length} subcategory{subcats.length !== 1 && 's'}</span>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(main)} className="p-1.5 bg-primary rounded text-gray-400 hover:text-white"><FiEdit2 size={14}/></button>
                          <button onClick={() => handleDelete(main.id)} className="p-1.5 bg-primary/50 text-red-500/70 hover:text-red-400 rounded"><FiTrash2 size={14}/></button>
                        </div>
                      </div>
                    </div>

                    {/* Level 1 & 2 */}
                    <div className="ml-6 border-l border-white/5 pl-2">
                      {subcats.length === 0 ? (
                        <div className="py-2 pl-6 text-xs text-gray-600 italic">No subcategories</div>
                      ) : (
                        subcats.map((sub) => {
                          const types = getChildren(sub.id);
                          const isSubExpanded = expandedNodes.has(sub.id);
                          
                          return (
                            <div key={sub.id} className="mt-1">
                              {/* Level 1 */}
                              <div className="flex items-center justify-between py-1.5 px-2 hover:bg-primary/40 rounded-lg group transition-colors">
                                <div className="flex items-center space-x-2 text-sm text-gray-300">
                                  <button onClick={() => toggleExpand(sub.id)} className="text-gold hover:text-yellow-400 p-0.5">
                                    {isSubExpanded ? <FiChevronDown size={14} /> : <FiPlus size={14} />}
                                  </button>
                                  <span>{sub.name}</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <span className="text-xs text-gray-500">{types.length} items</span>
                                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(sub)} className="p-1.5 bg-primary rounded text-gray-400 hover:text-white"><FiEdit2 size={14}/></button>
                                    <button onClick={() => handleDelete(sub.id)} className="p-1.5 bg-primary/50 text-red-500/70 hover:text-red-400 rounded"><FiTrash2 size={14}/></button>
                                  </div>
                                </div>
                              </div>

                              {/* Level 2: Pill tags */}
                              {isSubExpanded && types.length > 0 && (
                                <div className="ml-7 mt-2 mb-3 flex flex-wrap gap-2">
                                  {types.map(type => (
                                    <div key={type.id} className="group relative flex items-center bg-primary border border-white/5 px-3 py-1 rounded-full text-xs text-gray-400 hover:border-gold/30 hover:text-gray-300 transition-all cursor-default">
                                      <span>{type.name}</span>
                                      
                                      {/* Invisible hit area for hover actions that reveals buttons on hover */}
                                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-secondary border border-white/10 rounded-md p-1 shadow-lg flex items-center space-x-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-10">
                                        <button onClick={() => handleEdit(type)} className="p-1 text-gray-400 hover:text-white bg-primary rounded"><FiEdit2 size={12}/></button>
                                        <button onClick={() => handleDelete(type.id)} className="p-1 text-red-500/70 hover:text-red-400 bg-primary rounded"><FiTrash2 size={12}/></button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {isSubExpanded && types.length === 0 && (
                                <div className="ml-7 py-1 text-xs text-gray-600 italic">No items</div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default Categories;
