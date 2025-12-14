import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, UserCog, UserPlus, Trash2, Eye, EyeOff, Edit, Power, PowerOff } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { adminAPI } from "../services/api";

// Predefined departments list
const DEPARTMENTS = [
  'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'DS', 'ISE', 'MBA', 'MCA', 'Other'
];

function Moderators() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role || "admin";

  const [moderators, setModerators] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDept, setSelectedDept] = useState('');
  const [customDept, setCustomDept] = useState('');
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [editingModerator, setEditingModerator] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    password: "",
  });

  useEffect(() => {
    fetchModerators();
  }, []);

  const fetchModerators = async () => {
    try {
      const response = await adminAPI.getModerators();
      if (response.data.success) {
        setModerators(response.data.moderators || []);
      }
    } catch (error) {
      console.error("Error fetching moderators:", error);
      alert("Error loading moderators");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddDepartment = () => {
    const deptToAdd = selectedDept === 'Other' ? customDept.trim().toUpperCase() : selectedDept;
    if (deptToAdd && !selectedDepts.includes(deptToAdd)) {
      setSelectedDepts([...selectedDepts, deptToAdd]);
      setSelectedDept('');
      setCustomDept('');
    }
  };

  const handleRemoveDepartment = (dept) => {
    setSelectedDepts(selectedDepts.filter(d => d !== dept));
  };

  const handleAddModerator = async (e) => {
    e.preventDefault();

    if (selectedDepts.length === 0) {
      alert("Please select at least one department");
      return;
    }

    try {
      const response = await adminAPI.createModerator({
        ...formData,
        departments: selectedDepts,
      });

      if (response.data.success) {
        alert("Moderator added successfully!");
        setFormData({ username: "", email: "", fullName: "", password: "" });
        setSelectedDepts([]);
        setIsAddDialogOpen(false);
        fetchModerators();
      }
    } catch (error) {
      console.error("Error adding moderator:", error);
      alert(error.response?.data?.message || "Error adding moderator");
    }
  };

  const handleEditModerator = (moderator) => {
    setEditingModerator(moderator);
    setFormData({
      username: moderator.username || '',
      email: moderator.email || '',
      fullName: moderator.fullName || '',
      password: '',
    });
    setSelectedDepts(moderator.departments || []);
    setIsEditDialogOpen(true);
  };

  const handleUpdateModerator = async (e) => {
    e.preventDefault();

    if (selectedDepts.length === 0) {
      alert("Please select at least one department");
      return;
    }

    try {
      const updateData = {
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
        departments: selectedDepts,
      };

      const response = await adminAPI.updateModerator(editingModerator._id, updateData);

      if (response.data.success) {
        alert("Moderator updated successfully!");
        setFormData({ username: "", email: "", fullName: "", password: "" });
        setSelectedDepts([]);
        setEditingModerator(null);
        setIsEditDialogOpen(false);
        fetchModerators();
      }
    } catch (error) {
      console.error("Error updating moderator:", error);
      alert(error.response?.data?.message || "Error updating moderator");
    }
  };

  const handleToggleStatus = async (moderatorId) => {
    try {
      const response = await adminAPI.toggleModeratorStatus(moderatorId);
      if (response.data.success) {
        alert(response.data.message);
        fetchModerators();
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      alert(error.response?.data?.message || "Error toggling moderator status");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/${role}/dashboard`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserCog className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Moderators</h1>
                  <p className="text-slate-600">Manage portal moderators and their departments</p>
                </div>
              </div>

              {/* Add Moderator Dialog */}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Moderator
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Moderator</DialogTitle>
                    <DialogDescription>
                      Create a new moderator account with department assignments
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddModerator} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          placeholder="johndoe"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Department Selection */}
                    <div>
                      <Label>Departments</Label>
                      <div className="flex gap-2 mt-2">
                        <Select value={selectedDept} onValueChange={setSelectedDept}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {DEPARTMENTS.map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {selectedDept === 'Other' && (
                          <Input
                            placeholder="Enter department"
                            value={customDept}
                            onChange={(e) => setCustomDept(e.target.value)}
                            className="flex-1"
                          />
                        )}

                        <Button type="button" onClick={handleAddDepartment} variant="outline">
                          Add
                        </Button>
                      </div>

                      {/* Selected Departments */}
                      {selectedDepts.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {selectedDepts.map(dept => (
                            <span
                              key={dept}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                            >
                              {dept}
                              <button
                                type="button"
                                onClick={() => handleRemoveDepartment(dept)}
                                className="ml-2 text-indigo-600 hover:text-indigo-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddDialogOpen(false);
                          setFormData({ username: "", email: "", fullName: "", password: "" });
                          setSelectedDepts([]);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        Add Moderator
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Edit Moderator Dialog */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Moderator</DialogTitle>
                    <DialogDescription>
                      Update moderator details and department assignments
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdateModerator} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-username">Username</Label>
                        <Input
                          id="edit-username"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-fullName">Full Name</Label>
                        <Input
                          id="edit-fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Department Selection */}
                    <div>
                      <Label>Departments</Label>
                      <div className="flex gap-2 mt-2">
                        <Select value={selectedDept} onValueChange={setSelectedDept}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {DEPARTMENTS.map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {selectedDept === 'Other' && (
                          <Input
                            placeholder="Enter department"
                            value={customDept}
                            onChange={(e) => setCustomDept(e.target.value)}
                            className="flex-1"
                          />
                        )}

                        <Button type="button" onClick={handleAddDepartment} variant="outline">
                          Add
                        </Button>
                      </div>

                      {/* Selected Departments */}
                      {selectedDepts.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {selectedDepts.map(dept => (
                            <span
                              key={dept}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                            >
                              {dept}
                              <button
                                type="button"
                                onClick={() => handleRemoveDepartment(dept)}
                                className="ml-2 text-indigo-600 hover:text-indigo-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditDialogOpen(false);
                          setEditingModerator(null);
                          setFormData({ username: "", email: "", fullName: "", password: "" });
                          setSelectedDepts([]);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        Update Moderator
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Moderators List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {moderators.length === 0 ? (
            <div className="p-12 text-center">
              <UserCog className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                No moderators found
              </h3>
              <p className="text-slate-500 mb-4">
                Get started by adding your first moderator
              </p>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Moderator
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Moderator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Departments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {moderators.map((moderator) => (
                    <tr key={moderator._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <UserCog className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {moderator.fullName}
                            </div>
                            <div className="text-sm text-slate-500">
                              @{moderator.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {moderator.email}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {moderator.departments?.map((dept, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                              {dept}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${moderator.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                          {moderator.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditModerator(moderator)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Edit moderator"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(moderator._id)}
                            className={moderator.isActive ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                            title={moderator.isActive ? "Deactivate" : "Activate"}
                          >
                            {moderator.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Moderators;
