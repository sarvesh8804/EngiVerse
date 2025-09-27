import React from 'react';
import { TrendingUp, Target, Award, Zap } from 'lucide-react';

const MetricsCards: React.FC = () => {
  const metrics = [
    {
      title: 'Adopted Projects',
      value: '4',
      change: '+4 this month',
      icon: Target,
      trend: 'up'
    },
    {
      title: 'Total Contributions',
      value: '17',
      change: '+17 this week',
      icon: TrendingUp,
      trend: 'up'
    },
    {
      title: 'Completed Milestones',
      value: '2',
      change: '1 pending',
      icon: Award,
      trend: 'neutral'
    },
    {
      title: 'Skill Level',
      value: '46%',
      change: '+46% this month',
      icon: Zap,
      trend: 'up'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{metric.value}</p>
              <p className={`text-sm ${
                metric.trend === 'up' ? 'text-green-600' : 
                metric.trend === 'down' ? 'text-red-500' : 'text-gray-500'
              }`}>
                {metric.change}
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl">
              <metric.icon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsCards;