import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

const FundingOverview: React.FC = () => {
  const fundingData = {
    totalReceived: 500,
    totalGiven: 50,
    pendingFunds: 450,
    monthlyGrowth: 250
  };

  const recentTransactions = [
    { project: 'AI Code Review Tool', amount: 300, type: 'received', date: '2 days ago', status: 'completed' },
    { project: 'IoT Home Automation', amount: 100, type: 'given', date: '5 days ago', status: 'completed' },
    { project: 'Mental Health Tracker', amount: 100, type: 'received', date: '1 week ago', status: 'pending' },
    { project: 'Blockchain Voting', amount: 100, type: 'received', date: '2 weeks ago', status: 'completed' }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Funding Overview</h2>
        <p className="text-sm text-gray-600 mt-1">Track your financial progress</p>
      </div>
      
      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-700" />
              <span className="text-sm font-medium text-green-700">Received</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">${fundingData.totalReceived.toLocaleString()}</p>
          </div>
          
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingDown className="w-5 h-5 text-blue-700" />
              <span className="text-sm font-medium text-blue-700">Given</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">${fundingData.totalGiven.toLocaleString()}</p>
          </div>
        </div>

        {/* Growth Indicator */}
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-purple-700" />
              <span className="text-sm font-medium text-purple-700">Monthly Growth</span>
            </div>
            <span className="text-lg font-bold text-purple-700">+{fundingData.monthlyGrowth}%</span>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {recentTransactions.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    transaction.type === 'received' ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{transaction.project}</p>
                    <p className="text-xs text-gray-500">{transaction.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    transaction.type === 'received' ? 'text-green-700' : 'text-blue-700'
                  }`}>
                    {transaction.type === 'received' ? '+' : '-'}${transaction.amount.toLocaleString()}
                  </p>
                  <p className={`text-xs ${
                    transaction.status === 'completed' ? 'text-gray-600' : 'text-gray-500'
                  }`}>
                    {transaction.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundingOverview;