import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiChevronRight, FiChevronDown, FiImage, FiX, FiCornerDownRight } from 'react-icons/fi';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    jewelry_type: 'Gold',
    category_name: '',
    level: 0,
    parent_id: '',
    name: '',
  });
  const fileInputRef = useRef(null);

  // Hierarchical selector state - bottom up: grandchild -> child -> parent -> grandparent
  const [selectedGrandParent, setSelectedGrandParent] = useState('');
  const [selectedParent, setSelectedParent] = useState('');
  const [selectedChild, setSelectedChild] = useState('');
  const [selectedGrandChild, setSelectedGrandChild] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState({});

  // Auto-populate form from hierarchy selection
  useEffect(() => {
    if (selectedGrandChild) {
      const gc = categories.find(c => c.id === parseInt(selectedGrandChild));
      if (gc) {
        setFormData(prev => ({
          ...prev,
          level: gc.level + 1,
          parent_id: gc.id.toString(),
          jewelry_type: gc.jewelry_type,
        }));
      }
    } else if (selectedChild) {
      const c = categories.find(c => c.id === parseInt(selectedChild));
      if (c) {
        setFormData(prev => ({
          ...prev,
          level: c.level + 1,
          parent_id: c.id.toString(),
          jewelry_type: c.jewelry_type,
        }));
      }
    } else if (selectedParent) {
      const p = categories.find(c => c.id === parseInt(selectedParent));
      if (p) {
        setFormData(prev => ({
          ...prev,
          level: p.level + 1,
          parent_id: p.id.toString(),
          jewelry_type: p.jewelry_type,
        }));
      }
    } else if (selectedGrandParent) {
      const gp = categories.find(c => c.id === parseInt(selectedGrandParent));
      if (gp) {
        setFormData(prev => ({
          ...prev,
          level: gp.level + 1,
          parent_id: gp.id.toString(),
          jewelry_type: gp.jewelry_type,
        }));
      }
    } else {
      // Reset to defaults when nothing selected
      setFormData(prev => ({
        ...prev,
        level: 0,
        parent_id: '',
      }));
    }
  }, [selectedGrandParent, selectedParent, selectedChild, selectedGrandChild, categories]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.getCategories();
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  // Build hierarchy
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

  // Get items by parent
  const getChildren = (parentId) => {
    return categories.filter(c => c.parent_id === parentId);
  };

  // Get all root items (grand parents - level 0)
  const grandParents = categories.filter(c => c.level === 0);

  // Get parents of a grandparent
  const getParentsOf = (grandParentId) => getChildren(grandParentId);

  // Get children of a parent
  const getChildrenOf = (parentId) => getChildren(parentId);

  // Get grandchildren of a child
  const getGrandChildrenOf = (childId) => getChildren(childId);

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append('jewelry_type', formData.jewelry_type);
      submitData.append('category_name', formData.category_name);
      submitData.append('level', formData.level);
      submitData.append('parent_id', formData.parent_id || '');
      submitData.append('name', formData.name);
      if (selectedImage) submitData.append('image', selectedImage);

      if (editingCategory) {
        await api.updateCategory(editingCategory.id, submitData);
        toast.success('Category updated');
      } else {
        await api.addCategory(submitData);
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
    setImagePreview(category.image ? `/uploads/${category.image}` : null);
    setSelectedImage(null);
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
    setFormData({ jewelry_type: 'Gold', category_name: '', level: 0, parent_id: '', name: '' });
    setSelectedImage(null);
    setImagePreview(null);
    setEditingCategory(null);
    setShowForm(false);
    setSelectedGrandParent('');
    setSelectedParent('');
    setSelectedChild('');
    setSelectedGrandChild('');
    setDropdownOpen({});
  };

  const toggleExpand = (id) => {
    setExpandedRows(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleDropdown = (key) => {
    setDropdownOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getFullPath = (category) => {
    const path = [];
    let current = category;
    while (current) {
      path.unshift(current.name);
      current = categories.find(c => c.id === current.parent_id);
    }
    return path.join(' → ');
  };

  // Render the hierarchical selector - bottom up flow
  const renderHierarchySelector = () => {
    const parents = selectedGrandParent ? getParentsOf(parseInt(selectedGrandParent)) : [];
    const children = selectedParent ? getChildrenOf(parseInt(selectedParent)) : [];
    const grandchildren = selectedChild ? getGrandChildrenOf(parseInt(selectedChild)) : [];

    // Build the path string
    const pathParts = [];
    if (selectedGrandParent) pathParts.push(categories.find(c => c.id === parseInt(selectedGrandParent))?.name);
    if (selectedParent) pathParts.push(categories.find(c => c.id === parseInt(selectedParent))?.name);
    if (selectedChild) pathParts.push(categories.find(c => c.id === parseInt(selectedChild))?.name);
    if (selectedGrandChild) pathParts.push(categories.find(c => c.id === parseInt(selectedGrandChild))?.name);

    return (
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
          <FiCornerDownRight className="mr-2 text-gold" />
          Select Category Hierarchy (Bottom → Top)
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1: Grand Parent (Level 0) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <span className="inline-block w-6 h-6 rounded-full bg-gold text-primary text-xs font-bold text-center leading-6 mr-1">1</span>
              Grand Parent
            </label>
            <div className="relative">
              <button type="button" onClick={() => toggleDropdown('gp')}
                className="input-field flex items-center justify-between text-left">
                <span className="truncate flex items-center">
                  {selectedGrandParent && categories.find(c => c.id === parseInt(selectedGrandParent))?.image && (
                    <img src={`/uploads/${categories.find(c => c.id === parseInt(selectedGrandParent)).image}`} alt="" className="w-5 h-5 rounded object-cover mr-2" />
                  )}
                  {selectedGrandParent ? categories.find(c => c.id === parseInt(selectedGrandParent))?.name : 'Select Grand Parent'}
                </span>
                <FiChevronDown className={`ml-2 transition-transform ${dropdownOpen.gp ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen.gp && (
                <div className="absolute z-50 w-full mt-1 bg-secondary border border-gold/30 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  <button type="button" onClick={() => {
                    setSelectedGrandParent(''); setSelectedParent(''); setSelectedChild(''); setSelectedGrandChild('');
                    setDropdownOpen(prev => ({ ...prev, gp: false }));
                  }} className="w-full px-4 py-2 text-left text-gray-400 hover:bg-gold/20 hover:text-white transition">— None —</button>
                  {grandParents.map(item => (
                    <button key={item.id} type="button" onClick={() => {
                      setSelectedGrandParent(item.id.toString());
                      setSelectedParent(''); setSelectedChild(''); setSelectedGrandChild('');
                      setDropdownOpen(prev => ({ ...prev, gp: false }));
                    }}
                      className={`w-full px-4 py-2 text-left hover:bg-gold/20 hover:text-white transition flex items-center ${selectedGrandParent === item.id.toString() ? 'bg-gold/20 text-gold' : 'text-gray-300'}`}>
                      {item.image && <img src={`/uploads/${item.image}`} alt="" className="w-5 h-5 rounded object-cover mr-2 flex-shrink-0" />}
                      <span className="truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Parent (Level 1) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <span className="inline-block w-6 h-6 rounded-full bg-gold text-primary text-xs font-bold text-center leading-6 mr-1">2</span>
              Parent
            </label>
            <div className="relative">
              <button type="button" onClick={() => selectedGrandParent && toggleDropdown('p')}
                className={`input-field flex items-center justify-between text-left ${!selectedGrandParent ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!selectedGrandParent}>
                <span className="truncate flex items-center">
                  {selectedParent && categories.find(c => c.id === parseInt(selectedParent))?.image && (
                    <img src={`/uploads/${categories.find(c => c.id === parseInt(selectedParent)).image}`} alt="" className="w-5 h-5 rounded object-cover mr-2" />
                  )}
                  {selectedParent ? categories.find(c => c.id === parseInt(selectedParent))?.name : (selectedGrandParent ? 'Select Parent' : 'Choose Grand Parent first')}
                </span>
                <FiChevronDown className={`ml-2 transition-transform ${dropdownOpen.p ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen.p && selectedGrandParent && (
                <div className="absolute z-50 w-full mt-1 bg-secondary border border-gold/30 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  <button type="button" onClick={() => {
                    setSelectedParent(''); setSelectedChild(''); setSelectedGrandChild('');
                    setDropdownOpen(prev => ({ ...prev, p: false }));
                  }} className="w-full px-4 py-2 text-left text-gray-400 hover:bg-gold/20 hover:text-white transition">— None —</button>
                  {parents.map(item => (
                    <button key={item.id} type="button" onClick={() => {
                      setSelectedParent(item.id.toString());
                      setSelectedChild(''); setSelectedGrandChild('');
                      setDropdownOpen(prev => ({ ...prev, p: false }));
                    }}
                      className={`w-full px-4 py-2 text-left hover:bg-gold/20 hover:text-white transition flex items-center ${selectedParent === item.id.toString() ? 'bg-gold/20 text-gold' : 'text-gray-300'}`}>
                      {item.image && <img src={`/uploads/${item.image}`} alt="" className="w-5 h-5 rounded object-cover mr-2 flex-shrink-0" />}
                      <span className="truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Child (Level 2) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <span className="inline-block w-6 h-6 rounded-full bg-gold text-primary text-xs font-bold text-center leading-6 mr-1">3</span>
              Child
            </label>
            <div className="relative">
              <button type="button" onClick={() => selectedParent && toggleDropdown('c')}
                className={`input-field flex items-center justify-between text-left ${!selectedParent ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!selectedParent}>
                <span className="truncate flex items-center">
                  {selectedChild && categories.find(c => c.id === parseInt(selectedChild))?.image && (
                    <img src={`/uploads/${categories.find(c => c.id === parseInt(selectedChild)).image}`} alt="" className="w-5 h-5 rounded object-cover mr-2" />
                  )}
                  {selectedChild ? categories.find(c => c.id === parseInt(selectedChild))?.name : (selectedParent ? 'Select Child' : 'Choose Parent first')}
                </span>
                <FiChevronDown className={`ml-2 transition-transform ${dropdownOpen.c ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen.c && selectedParent && (
                <div className="absolute z-50 w-full mt-1 bg-secondary border border-gold/30 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  <button type="button" onClick={() => {
                    setSelectedChild(''); setSelectedGrandChild('');
                    setDropdownOpen(prev => ({ ...prev, c: false }));
                  }} className="w-full px-4 py-2 text-left text-gray-400 hover:bg-gold/20 hover:text-white transition">— None —</button>
                  {children.map(item => (
                    <button key={item.id} type="button" onClick={() => {
                      setSelectedChild(item.id.toString());
                      setSelectedGrandChild('');
                      setDropdownOpen(prev => ({ ...prev, c: false }));
                    }}
                      className={`w-full px-4 py-2 text-left hover:bg-gold/20 hover:text-white transition flex items-center ${selectedChild === item.id.toString() ? 'bg-gold/20 text-gold' : 'text-gray-300'}`}>
                      {item.image && <img src={`/uploads/${item.image}`} alt="" className="w-5 h-5 rounded object-cover mr-2 flex-shrink-0" />}
                      <span className="truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Step 4: Grand Child (Level 3) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <span className="inline-block w-6 h-6 rounded-full bg-gold text-primary text-xs font-bold text-center leading-6 mr-1">4</span>
              Grand Child
            </label>
            <div className="relative">
              <button type="button" onClick={() => selectedChild && toggleDropdown('gc')}
                className={`input-field flex items-center justify-between text-left ${!selectedChild ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!selectedChild}>
                <span className="truncate flex items-center">
                  {selectedGrandChild && categories.find(c => c.id === parseInt(selectedGrandChild))?.image && (
                    <img src={`/uploads/${categories.find(c => c.id === parseInt(selectedGrandChild)).image}`} alt="" className="w-5 h-5 rounded object-cover mr-2" />
                  )}
                  {selectedGrandChild ? categories.find(c => c.id === parseInt(selectedGrandChild))?.name : (selectedChild ? 'Select Grand Child' : 'Choose Child first')}
                </span>
                <FiChevronDown className={`ml-2 transition-transform ${dropdownOpen.gc ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen.gc && selectedChild && (
                <div className="absolute z-50 w-full mt-1 bg-secondary border border-gold/30 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  <button type="button" onClick={() => {
                    setSelectedGrandChild('');
                    setDropdownOpen(prev => ({ ...prev, gc: false }));
                  }} className="w-full px-4 py-2 text-left text-gray-400 hover:bg-gold/20 hover:text-white transition">— None —</button>
                  {grandchildren.map(item => (
                    <button key={item.id} type="button" onClick={() => {
                      setSelectedGrandChild(item.id.toString());
                      setDropdownOpen(prev => ({ ...prev, gc: false }));
                    }}
                      className={`w-full px-4 py-2 text-left hover:bg-gold/20 hover:text-white transition flex items-center ${selectedGrandChild === item.id.toString() ? 'bg-gold/20 text-gold' : 'text-gray-300'}`}>
                      {item.image && <img src={`/uploads/${item.image}`} alt="" className="w-5 h-5 rounded object-cover mr-2 flex-shrink-0" />}
                      <span className="truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Path visualization */}
        <div className="mt-4 p-3 bg-primary/50 rounded-lg border border-gold/20">
          <div className="flex items-center flex-wrap gap-1 text-sm">
            <span className="text-gray-400 mr-2">Hierarchy:</span>
            {pathParts.length === 0 ? (
              <span className="text-gray-500 italic">Select from the dropdowns above</span>
            ) : (
              <>
                {pathParts.map((part, i) => (
                  <React.Fragment key={i}>
                    <span className="text-gold font-semibold">{part}</span>
                    {i < pathParts.length - 1 && <span className="text-gray-500 mx-1">←</span>}
                  </React.Fragment>
                ))}
              </>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            <FiCornerDownRight className="inline mr-1" />
            Select from bottom (most specific) to top (most general). The last selected item is where the new category will be added.
          </p>
        </div>
      </div>
    );
  };

  const renderHierarchy = (items) => {
    return items.map(item => (
      <React.Fragment key={item.id}>
        <tr className="border-b border-secondary hover:bg-secondary/50 transition">
          <td className="py-3 px-4">
            <div className="flex items-center" style={{ paddingLeft: `${item.hierarchyLevel * 30}px` }}>
              {item.children.length > 0 && (
                <button onClick={() => toggleExpand(item.id)} className="mr-2 text-gold hover:text-white transition">
                  {expandedRows.includes(item.id) ? <FiChevronDown /> : <FiChevronRight />}
                </button>
              )}
              {item.image ? (
                <img src={`/uploads/${item.image}`} alt={item.name} className="w-8 h-8 rounded-lg object-cover mr-3 border border-gold/30" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center mr-3 border border-gold/30">
                  <FiImage className="text-gray-500 text-sm" />
                </div>
              )}
              <div>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold mr-2 ${
                  item.jewelry_type === 'Gold' ? 'bg-gold/20 text-gold' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {item.jewelry_type}
                </span>
                <span className="font-medium text-white">{item.name}</span>
              </div>
            </div>
          </td>
          <td className="py-3 px-4 text-gray-300">{item.category_name || '-'}</td>
          <td className="py-3 px-4">
            <span className="px-2 py-1 bg-gold/10 text-gold rounded text-xs font-medium">Level {item.level}</span>
          </td>
          <td className="py-3 px-4 text-gray-400 text-sm">{getFullPath(item)}</td>
          <td className="py-3 px-4">
            <div className="flex space-x-2">
              <button onClick={() => handleEdit(item)} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition"><FiEdit2 /></button>
              <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"><FiTrash2 /></button>
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
          <p className="text-gray-400 mt-1">Manage hierarchical categories with images</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0">
          <FiPlus />
          <span>{showForm ? 'Hide Form' : 'Add Category'}</span>
        </button>
      </div>

      {/* Hierarchy Selector */}
      {renderHierarchySelector()}

      {/* Add/Edit Form */}
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
                <input type="text" name="category_name" value={formData.category_name}
                  onChange={(e) => setFormData({...formData, category_name: e.target.value})}
                  className="input-field" placeholder="e.g. Rings, Necklaces" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input type="text" name="name" value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input-field" required placeholder="Category name" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Level</label>
                <select name="level" value={formData.level}
                  onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})}
                  className="input-field">
                  <option value={0}>Level 0 (Grand Parent)</option>
                  <option value={1}>Level 1 (Parent)</option>
                  <option value={2}>Level 2 (Child)</option>
                  <option value={3}>Level 3 (Grand Child)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Parent Item</label>
                <select name="parent_id" value={formData.parent_id}
                  onChange={(e) => setFormData({...formData, parent_id: e.target.value || ''})}
                  className="input-field">
                  <option value="">None (Root)</option>
                  {categories.filter(c => c.id !== editingCategory?.id).map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {'--'.repeat(cat.level)} {cat.name} ({cat.jewelry_type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Image</label>
                <div className="flex items-center space-x-3">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="category-image" />
                  <label htmlFor="category-image"
                    className="input-field flex items-center justify-center cursor-pointer hover:border-gold transition py-2 px-3">
                    <FiImage className="mr-2 text-gold" />
                    <span className="text-gray-400 text-sm truncate">{selectedImage ? selectedImage.name : 'Choose image...'}</span>
                  </label>
                  {imagePreview && (
                    <div className="relative flex-shrink-0">
                      <img src={imagePreview} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-gold/30" />
                      <button type="button" onClick={clearImage}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition">
                        <FiX className="text-xs text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Parent Indicator */}
            {(selectedGrandChild || selectedChild || selectedParent || selectedGrandParent) && (
              <div className="col-span-full p-3 bg-gold/10 border border-gold/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FiCornerDownRight className="text-gold" />
                    <span className="text-sm font-medium text-gold">Selected Parent from Hierarchy:</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    {selectedGrandChild && (
                      <span className="text-white">
                        {categories.find(c => c.id === parseInt(selectedGrandChild))?.name} (Level {categories.find(c => c.id === parseInt(selectedGrandChild))?.level + 1})
                      </span>
                    )}
                    {selectedChild && !selectedGrandChild && (
                      <span className="text-white">
                        {categories.find(c => c.id === parseInt(selectedChild))?.name} (Level {categories.find(c => c.id === parseInt(selectedChild))?.level + 1})
                      </span>
                    )}
                    {selectedParent && !selectedChild && !selectedGrandChild && (
                      <span className="text-white">
                        {categories.find(c => c.id === parseInt(selectedParent))?.name} (Level {categories.find(c => c.id === parseInt(selectedParent))?.level + 1})
                      </span>
                    )}
                    {selectedGrandParent && !selectedParent && !selectedChild && !selectedGrandChild && (
                      <span className="text-white">
                        {categories.find(c => c.id === parseInt(selectedGrandParent))?.name} (Level {categories.find(c => c.id === parseInt(selectedGrandParent))?.level + 1})
                      </span>
                    )}
                    <button type="button" onClick={() => {
                      setSelectedGrandParent(''); setSelectedParent(''); setSelectedChild(''); setSelectedGrandChild('');
                      setDropdownOpen({});
                    }} className="text-gray-400 hover:text-white text-sm">
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">{editingCategory ? 'Update' : 'Add'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {hierarchyData.map((item) => (
              <MobileCard key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} categories={categories} />
            ))}
            {categories.length === 0 && (
              <div className="text-center py-12 text-gray-400">No categories found</div>
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
                  <th className="text-left py-3 px-4 font-semibold text-gray-400">Path</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {renderHierarchy(hierarchyData)}
              </tbody>
            </table>
            {categories.length === 0 && (
              <div className="text-center py-12 text-gray-400">No categories found</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Mobile Card Component
const MobileCard = ({ item, onEdit, onDelete, categories, depth = 0 }) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = categories.filter(c => c.parent_id === item.id).length > 0;

  const getFullPath = (category) => {
    const path = [];
    let current = category;
    while (current) {
      path.unshift(current.name);
      current = categories.find(c => c.id === current.parent_id);
    }
    return path.join(' → ');
  };

  return (
    <>
      <div className="card p-4" style={{ marginLeft: `${depth * 16}px` }}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            {item.image ? (
              <img src={`/uploads/${item.image}`} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-gold/30" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center border border-gold/30">
                <FiImage className="text-gray-500" />
              </div>
            )}
            <div>
              <div className="flex items-center">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold mr-2 ${
                  item.jewelry_type === 'Gold' ? 'bg-gold/20 text-gold' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {item.jewelry_type}
                </span>
                <span className="font-medium text-white">{item.name}</span>
              </div>
              <span className="text-xs text-gray-500">{getFullPath(item)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-gray-400">{item.category_name || '—'}</span>
          <span className="text-gold text-xs">Level {item.level}</span>
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-secondary">
          {hasChildren && (
            <button onClick={() => setExpanded(!expanded)} className="text-sm text-gold flex items-center">
              {expanded ? <FiChevronDown className="mr-1" /> : <FiChevronRight className="mr-1" />}
              {categories.filter(c => c.parent_id === item.id).length} children
            </button>
          )}
          <div className="flex space-x-2 ml-auto">
            <button onClick={() => onEdit(item)} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg"><FiEdit2 /></button>
            <button onClick={() => onDelete(item.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><FiTrash2 /></button>
          </div>
        </div>
      </div>
      {expanded && categories
        .filter(c => c.parent_id === item.id)
        .map(child => (
          <MobileCard key={child.id} item={child} onEdit={onEdit} onDelete={onDelete} categories={categories} depth={depth + 1} />
        ))}
    </>
  );
};

export default Categories;
