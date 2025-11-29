import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Plus, X, Save, Award } from 'lucide-react';

export default function SkillsForm({ skills = [], onUpdate }) {
  const [skillsList, setSkillsList] = useState(skills);
  const [newSkill, setNewSkill] = useState('');
  const [category, setCategory] = useState('technical');

  useEffect(() => {
    setSkillsList(skills);
  }, [skills]);

  const categories = {
    technical: 'Technical Skills',
    soft: 'Soft Skills',
    languages: 'Programming Languages',
    tools: 'Tools & Frameworks',
    other: 'Other Skills'
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) {
      alert('Please enter a skill');
      return;
    }

    const skill = {
      id: Date.now(),
      name: newSkill.trim(),
      category: category
    };

    const updated = [...skillsList, skill];
    setSkillsList(updated);
    setNewSkill('');
    
    if (onUpdate) {
      onUpdate(updated);
    }
  };

  const handleDeleteSkill = (id) => {
    const updated = skillsList.filter(skill => skill.id !== id);
    setSkillsList(updated);
    
    if (onUpdate) {
      onUpdate(updated);
    }
  };

  const getSkillsByCategory = (cat) => {
    return skillsList.filter(skill => skill.category === cat);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
        <CardDescription>Add and manage your skills across different categories</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <Award className="inline-block mr-2 h-4 w-4" />
            You can update your skills anytime to match your growing expertise.
          </p>
        </div>

        {/* Add New Skill */}
        <div className="space-y-4 border rounded-lg p-4 bg-blue-50">
          <h3 className="font-semibold">Add New Skill</h3>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(categories).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1">
              <Label htmlFor="skillName">Skill Name</Label>
              <Input
                id="skillName"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="e.g., React, Python, Communication"
                onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleAddSkill} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Skill
              </Button>
            </div>
          </div>
        </div>

        {/* Display Skills by Category */}
        <div className="space-y-6">
          {Object.entries(categories).map(([catKey, catLabel]) => {
            const categorySkills = getSkillsByCategory(catKey);
            if (categorySkills.length === 0) return null;

            return (
              <div key={catKey} className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">{catLabel}</h3>
                <div className="flex flex-wrap gap-2">
                  {categorySkills.map((skill) => (
                    <Badge
                      key={skill.id}
                      variant="secondary"
                      className="text-sm px-3 py-2 flex items-center gap-2"
                    >
                      {skill.name}
                      <button
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="hover:text-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {skillsList.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No skills added yet.</p>
            <p className="text-sm">Start adding your skills above.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
