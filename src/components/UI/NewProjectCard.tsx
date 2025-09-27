import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, TrendingUp, Star, CheckCircle } from 'lucide-react';
import { Project } from '../../types';
import { useApp } from '../../context/AppContext';
import { toast } from 'react-toastify';

interface ProjectCardProps {
  project: Project;
  showAdoptButton?: boolean;
}

const NewProjectCard: React.FC<ProjectCardProps> = ({ project, showAdoptButton = true }) => {
  const { adoptProject, isDarkMode, user } = useApp();

  const handleAdopt = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (user.projects.includes(project.id)) {
      toast.info('You have already adopted this project!');
      return;
    }

    adoptProject(project.id);
    toast.success(`Successfully adopted ${project.title}! Redirecting to GitHub...`);

    // Open the GitHub repo in a new tab if available
    if (project.githubUrl) {
      setTimeout(() => {
        window.open(project.githubUrl, '_blank', 'noopener,noreferrer');
      }, 1200); // Give user a moment to see the toast
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return isDarkMode ? 'text-green-400 bg-green-900/20' : 'text-green-700 bg-green-100';
      case 'Intermediate': return isDarkMode ? 'text-yellow-400 bg-yellow-900/20' : 'text-yellow-700 bg-yellow-100';
      case 'Advanced': return isDarkMode ? 'text-red-400 bg-red-900/20' : 'text-red-700 bg-red-100';
      default: return isDarkMode ? 'text-gray-400 bg-gray-900/20' : 'text-gray-700 bg-gray-100';
    }
  };

  const isAdopted = user.projects.includes(project.id);

  return (
    <div className={`group rounded-xl shadow-sm border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700 hover:shadow-blue-500/10' 
        : 'bg-white border-gray-200 hover:shadow-blue-500/10'
    }`}>
      <Link to={`/projects/${project.id}`} className="block">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className={`text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {project.title}
              </h3>
              <p className={`text-sm line-clamp-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {project.shortDescription}
              </p>
            </div>
            {isAdopted && (
              <CheckCircle className="h-5 w-5 text-green-500 ml-2 flex-shrink-0" />
            )}
          </div>

          {/* Tech Stack */}
          <div className="flex flex-wrap gap-2 mb-4">
            {project.techStack.slice(0, 3).map((tech, index) => (
              <span
                key={index}
                className={`px-2 py-1 text-xs rounded-full ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {tech}
              </span>
            ))}
            {project.techStack && project.techStack.length > 3 && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                +{project.techStack.length - 3} more
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Progress
              </span>
              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                {project.progress}%
              </span>
            </div>
            <div className={`w-full bg-gray-200 rounded-full h-2 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Users className={`h-4 w-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {Array.isArray(project.contributors) ? project.contributors.length : 0}
                </span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(project.difficulty)}`}>
                {project.difficulty}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Calendar className={`h-4 w-4 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                {project.lastActivity ? new Date(project.lastActivity).toLocaleDateString() : ''}
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Adopt Button */}
      {showAdoptButton && !isAdopted && (
        <div className="px-6 pb-6">
          <button
            onClick={handleAdopt}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 group"
          >
            <Star className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span>Adopt Project</span>
          </button>
        </div>
      )}

      {isAdopted && (
        <div className="px-6 pb-6">
          <div className="w-full py-2 px-4 bg-green-600 text-white rounded-lg flex items-center justify-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Adopted</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewProjectCard;