import { useState } from 'react';
import RoleGroupManagement from './RoleGroupManagement';
import RoleManagementSettings from './RoleManagementSettings';
import { Users, UserCog } from 'lucide-react';

type TabType = 'groups' | 'legacy';

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabItem[] = [
  {
    id: 'groups',
    label: 'Nhóm phân quyền',
    icon: Users,
  },
  {
    id: 'legacy',
    label: 'Phân quyền cũ (Legacy)',
    icon: UserCog,
  },
];

export default function RoleManagementSettingsWrapper() {
  const [activeTab, setActiveTab] = useState<TabType>('groups');

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  transition-colors duration-200
                  ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'groups' ? (
          <RoleGroupManagement />
        ) : (
          <RoleManagementSettings />
        )}
      </div>
    </div>
  );
}

