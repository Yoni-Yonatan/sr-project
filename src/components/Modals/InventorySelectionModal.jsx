import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiSearch, FiInfo, FiImage, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const InventorySelectionModal = ({
  inventory,
  categories,
  karats,
  currentPrice,
  onClose,
  onSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedKarat, setSelectedKarat] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const [selectedItem, setSelectedItem] = useState(null);
  const [itemWeight, setItemWeight] = useState('');
  const [itemDiscount, setItemDiscount] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(val || 0).replace('ETB', '').trim() + ' ETB';

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchSearch = item.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.karat_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.jewelry_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id?.toString().includes(searchTerm);
      
      const matchType = selectedType ? item.jewelry_type === selectedType : true;
      const matchKarat = selectedKarat ? item.karat_name === selectedKarat : true;
      const matchCategory = selectedCategory ? item.category_name === selectedCategory : true;
      const matchStatus = selectedStatus === 'In Stock' ? !item.is_sold : (selectedStatus === 'Sold' ? item.is_sold : true);

      return matchSearch && matchType && matchKarat && matchCategory && matchStatus;
    });
  }, [inventory, searchTerm, selectedType, selectedKarat, selectedCategory, selectedStatus]);

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const paginatedItems = filteredInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSelect = (item) => {
    setSelectedItem(item);
    setItemWeight(''); // reset or default to item.weight_grams
    setItemDiscount(0);
  };

  const handleConfirmSelection = () => {
    if (!selectedItem) return;
    onSelect({
      ...selectedItem,
      saleWeight: parseFloat(itemWeight) || 0,
      saleDiscount: parseFloat(itemDiscount) || 0
    });
  };

  // Extract unique types from inventory if not provided directly
  const uniqueTypes = [...new Set(inventory.map(i => i.jewelry_type).filter(Boolean))];

  return createPortal(
    <div className="modal-overlay z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="modal-content !p-0 max-w-[1200px] w-full bg-[#1A1A1A] border border-[#333] shadow-2xl flex flex-col h-[90vh] rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-[#333]">
          <h3 className="text-xl font-semibold text-white">Add Item from Inventory</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#333] rounded-lg text-gray-400 transition"><FiX size={20} /></button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          
          {/* Left Panel */}
          <div className="flex-1 border-r border-[#333] flex flex-col overflow-hidden bg-[#111]">
            <div className="p-4 sm:p-6 pb-2">
              <h4 className="text-gold font-medium mb-4 flex items-center gap-2">
                1. Search Inventory
              </h4>
              
              <div className="relative mb-4">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search by item name, ID, karat, category..."
                  value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-[#1A1A1A] border border-[#333] text-white pl-10 pr-4 py-2.5 rounded-lg focus:border-gold focus:outline-none transition text-sm" />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Jewelry Type</label>
                  <select value={selectedType} onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-[#1A1A1A] border border-[#333] text-white px-3 py-2 rounded-lg focus:border-gold focus:outline-none transition text-sm appearance-none">
                    <option value="">All Types</option>
                    {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Karat</label>
                  <select value={selectedKarat} onChange={(e) => { setSelectedKarat(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-[#1A1A1A] border border-[#333] text-white px-3 py-2 rounded-lg focus:border-gold focus:outline-none transition text-sm appearance-none">
                    <option value="">All Karats</option>
                    {karats.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Category</label>
                  <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-[#1A1A1A] border border-[#333] text-white px-3 py-2 rounded-lg focus:border-gold focus:outline-none transition text-sm appearance-none">
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Status</label>
                  <select value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-[#1A1A1A] border border-[#333] text-white px-3 py-2 rounded-lg focus:border-gold focus:outline-none transition text-sm appearance-none">
                    <option value="">All</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Sold">Sold</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 custom-scrollbar">
              <div className="space-y-3">
                {paginatedItems.map((inv) => (
                  <div key={inv.id} 
                    className={`flex items-center p-3 rounded-xl border transition cursor-pointer ${
                      selectedItem?.id === inv.id ? 'border-gold bg-gold/5' : 'border-[#333] hover:border-gray-600 bg-[#1A1A1A]'
                    }`}
                    onClick={() => handleSelect(inv)}>
                    <div className="w-16 h-16 bg-[#111] rounded-lg border border-[#333] flex items-center justify-center flex-shrink-0 mr-4">
                      {/* Placeholder Image */}
                      <FiImage className="text-gray-600 text-xl" />
                    </div>
                    
                    <div className="flex-1 grid grid-cols-12 gap-2">
                      <div className="col-span-12 lg:col-span-3">
                        <p className="text-white font-medium text-sm truncate">{inv.category_name} - {inv.karat_name}</p>
                        <p className="text-gray-500 text-xs">ID: INV-{inv.id}</p>
                      </div>
                      
                      <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500 block">Type</span>
                          <span className="text-gray-300">{inv.jewelry_type || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Category</span>
                          <span className="text-gray-300">{inv.category_name || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Karat</span>
                          <span className="text-gray-300">{inv.karat_name || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Weight</span>
                          <span className="text-gray-300">{inv.weight_grams} g</span>
                        </div>
                      </div>

                      <div className="col-span-12 lg:col-span-3 grid grid-cols-1 gap-1 text-xs border-l border-[#333] pl-3">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Base Price / g</span>
                          <span className="text-gray-300">{formatCurrency(inv.base_price || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Current Price / g</span>
                          <span className="text-gray-300">{formatCurrency(inv.current_price || currentPrice)}</span>
                        </div>
                      </div>
                      
                      <div className="col-span-12 lg:col-span-2 flex flex-col items-end justify-center space-y-2 border-l border-[#333] pl-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${inv.is_sold ? 'bg-red-500' : 'bg-green-500'}`}></div>
                          <span className="text-xs text-gray-400">{inv.is_sold ? 'Sold' : 'In Stock'}</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleSelect(inv); }}
                          className={`text-xs px-4 py-1.5 rounded-lg border transition ${
                            selectedItem?.id === inv.id ? 'border-gold text-gold bg-gold/10' : 'border-[#444] text-gray-300 hover:border-gold hover:text-gold'
                          }`}>
                          Select
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {paginatedItems.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-[#333] rounded-xl text-gray-500">
                    No items found matching the criteria.
                  </div>
                )}
              </div>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-[#333] flex justify-between items-center text-sm">
                <span className="text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + (paginatedItems.length > 0 ? 1 : 0)} to {Math.min(currentPage * itemsPerPage, filteredInventory.length)} of {filteredInventory.length} items
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 border border-[#333] rounded hover:bg-[#222] disabled:opacity-50 text-gray-400">
                    <FiChevronLeft />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button 
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded text-xs transition ${
                        currentPage === page ? 'bg-gold/10 text-gold border border-gold' : 'text-gray-400 hover:bg-[#222]'
                      }`}>
                      {page}
                    </button>
                  ))}
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 border border-[#333] rounded hover:bg-[#222] disabled:opacity-50 text-gray-400">
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="w-full lg:w-[400px] flex flex-col bg-[#1A1A1A]">
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
              <h4 className="text-gold font-medium mb-6">Selected Item Preview</h4>
              
              {selectedItem ? (
                <div className="space-y-6">
                  {/* Big Image Box */}
                  <div className="w-full aspect-video bg-[#111] rounded-xl border border-[#333] flex items-center justify-center shadow-inner">
                    <FiImage className="text-gray-600 text-5xl" />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-white">{selectedItem.category_name} - {selectedItem.karat_name}</h2>
                    <p className="text-gray-500 text-sm mt-1">ID: INV-{selectedItem.id}</p>
                  </div>

                  <div className="space-y-3 py-4 border-y border-[#333]">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2">💍 Jewelry Type</span>
                      <span className="text-gray-300">{selectedItem.jewelry_type || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2">📁 Category</span>
                      <span className="text-gray-300">{selectedItem.category_name || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2">✨ Karat</span>
                      <span className="text-gray-300">{selectedItem.karat_name || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2">⚖️ Weight</span>
                      <span className="text-gray-300">{selectedItem.weight_grams} g</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2 pt-2 border-t border-[#333]/50">
                      <span className="text-gray-500 flex items-center gap-2">💰 Base Price / g</span>
                      <span className="text-gray-300">{formatCurrency(selectedItem.base_price || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2">💲 Current Selling Price / g</span>
                      <span className="text-gray-300 font-medium">{formatCurrency(selectedItem.current_price || currentPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2 pt-2 border-t border-[#333]/50">
                      <span className="text-gray-500 flex items-center gap-2">📦 Status</span>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${selectedItem.is_sold ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <span className="text-gray-300">{selectedItem.is_sold ? 'Sold' : 'In Stock'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 flex gap-3 text-sm">
                    <FiInfo className="text-gold flex-shrink-0 mt-0.5" />
                    <div className="w-full">
                      <p className="text-gold font-medium mb-1">Selecting this item will auto-fill sale details</p>
                      <p className="text-gray-400 text-xs mb-3">You can adjust the final weight and discount here before adding to cart.</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Sale Weight (g) *</label>
                          <input type="number" step="0.001" min="0" 
                            value={itemWeight} onChange={(e) => setItemWeight(e.target.value)}
                            placeholder={selectedItem.weight_grams}
                            className="w-full bg-[#111] border border-[#333] text-white px-3 py-2 rounded-lg focus:border-gold focus:outline-none text-sm transition" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Discount</label>
                          <input type="number" step="0.01" min="0" 
                            value={itemDiscount} onChange={(e) => setItemDiscount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-[#111] border border-[#333] text-white px-3 py-2 rounded-lg focus:border-gold focus:outline-none text-sm transition" />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <FiImage className="text-5xl mb-4 text-[#333]" />
                  <p className="text-sm">Select an item from the list to preview details.</p>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="p-6 border-t border-[#333] flex justify-end gap-3 bg-[#111]">
              <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-[#222] transition border border-[#333]">
                Cancel
              </button>
              <button 
                onClick={handleConfirmSelection}
                disabled={!selectedItem || !itemWeight}
                className="px-6 py-2.5 rounded-lg text-sm font-medium bg-gold text-[#111] hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                Select Item
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};

export default InventorySelectionModal;
