import React, { useState } from 'react';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority?: 'high' | 'medium' | 'low';
  category?: 'prescription' | 'follow-up' | 'test' | 'referral' | 'other';
  createdAt: Date;
}

interface TasksPanelProps {
  sessionId?: string;
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
}

export const TasksPanel: React.FC<TasksPanelProps> = ({ sessionId: _sessionId, tasks, onTasksChange }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const addTask = () => {
    if (newTaskText.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        text: newTaskText.trim(),
        completed: false,
        priority: 'medium',
        category: 'other',
        createdAt: new Date(),
      };
      onTasksChange([...tasks, newTask]);
      setNewTaskText('');
      setIsAddingTask(false);
    }
  };

  const toggleTask = (taskId: string) => {
    onTasksChange(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (taskId: string) => {
    onTasksChange(tasks.filter(task => task.id !== taskId));
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 border-l-4 border-red-500';
      case 'medium': return 'bg-yellow-50 border-l-4 border-yellow-500';
      case 'low': return 'bg-blue-50 border-l-4 border-blue-500';
      default: return 'bg-pink-50';
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Tasks</h2>
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
            </svg>
          </button>
        </div>
        <span className="text-xs text-gray-500">A total</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-start space-x-3 p-3 rounded-lg group hover:opacity-90 transition-colors ${getPriorityColor(task.priority)}`}
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task.id)}
              className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {task.text}
              </p>
            </div>
            <button
              onClick={() => deleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        {isAddingTask ? (
          <div className="p-3 bg-gray-50 rounded-lg">
            <textarea
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  addTask();
                }
                if (e.key === 'Escape') {
                  setIsAddingTask(false);
                  setNewTaskText('');
                }
              }}
              placeholder="Enter task description..."
              className="w-full px-2 py-1 text-sm border-none bg-transparent focus:outline-none resize-none"
              rows={2}
              autoFocus
            />
            <div className="flex justify-end space-x-2 mt-2">
              <button
                onClick={() => {
                  setIsAddingTask(false);
                  setNewTaskText('');
                }}
                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={addTask}
                className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingTask(true)}
            className="w-full p-3 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg border border-dashed border-gray-300 flex items-center justify-center space-x-2"
          >
            <span>+</span>
            <span>New task</span>
          </button>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Tasks will be archived in 30 days
        </p>
      </div>
    </div>
  );
};
