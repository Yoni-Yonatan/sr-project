import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiUserX, FiUserCheck, FiSearch } from 'react-icons/fi';
import EmployeeModal from '../components/Modals/EmployeeModal';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.getEmployees();
      setEmployees(response.data);
    } catch (error) {
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    setShowModal(true);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setShowModal(true);
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.toggleEmployeeStatus(id);
      toast.success('Status updated');
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.phone_number?.includes(searchTerm)
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Employees</h2>
          <p className="text-gray-400 mt-1">Manage employee accounts</p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0">
          <FiPlus />
          <span>Add Employee</span>
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading employees...</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {filteredEmployees.map((employee) => (
              <div key={employee.id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {employee.photo ? (
                      <img src={`/uploads/${employee.photo}`} alt="" 
                        className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center">
                        <span className="text-primary font-bold">
                          {employee.full_name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white">{employee.full_name}</p>
                      <p className="text-sm text-gray-400">{employee.phone_number}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    employee.is_active 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {employee.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-500">Branch: </span>
                    <span className="text-gray-300">{employee.branch_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Sales: </span>
                    <span className="text-gold font-semibold">${parseFloat(employee.sales) ? parseFloat(employee.sales).toFixed(2) : '0.00'}</span>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-3 pt-3 border-t border-secondary">
                  <button
                    onClick={() => handleEdit(employee)}
                    className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(employee.id)}
                    className={`p-2 rounded-lg transition ${
                      employee.is_active
                        ? 'text-red-400 hover:bg-red-500/20'
                        : 'text-green-400 hover:bg-green-500/20'
                    }`}
                    title={employee.is_active ? 'Disable' : 'Enable'}
                  >
                    {employee.is_active ? <FiUserX /> : <FiUserCheck />}
                  </button>
                </div>
              </div>
            ))}
            {filteredEmployees.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No employees found
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary">
                  <th className="text-left py-3 px-4 font-semibold text-gray-400">Employee</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-400">Phone</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-400">Branch</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-400">Sales</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-400">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b border-secondary hover:bg-secondary/50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        {employee.photo ? (
                          <img src={`/uploads/${employee.photo}`} alt="" 
                            className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center">
                            <span className="text-primary font-bold">
                              {employee.full_name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="font-medium text-white">{employee.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{employee.phone_number}</td>
                    <td className="py-3 px-4 text-gray-300">{employee.branch_name}</td>
                    <td className="py-3 px-4 text-gray-300 font-semibold text-gold">${parseFloat(employee.sales) ? parseFloat(employee.sales).toFixed(2) : '0.00'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        employee.is_active 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {employee.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(employee)}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(employee.id)}
                          className={`p-2 rounded-lg transition ${
                            employee.is_active
                              ? 'text-red-400 hover:bg-red-500/20'
                              : 'text-green-400 hover:bg-green-500/20'
                          }`}
                          title={employee.is_active ? 'Disable' : 'Enable'}
                        >
                          {employee.is_active ? <FiUserX /> : <FiUserCheck />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredEmployees.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No employees found
              </div>
            )}
          </div>
        </>
      )}

      {showModal && (
        <EmployeeModal
          employee={editingEmployee}
          onClose={() => setShowModal(false)}
          onRefresh={fetchEmployees}
        />
      )}
    </div>
  );
};

export default Employees;