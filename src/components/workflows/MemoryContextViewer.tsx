import { useState, useEffect } from 'react';

type MemoryItem = {
  id: string;
  content: string;
  source: string;
  timestamp: string;
  isPinned: boolean;
};

export const MemoryContextViewer = () => {
  const [activeTab, setActiveTab] = useState<'context' | 'memory'>('context');
  const [darkMode, setDarkMode] = useState(true); // Match the main interface
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([
    {
      id: '1',
      content: 'The primary objective is to design a user-friendly interface for managing prompt workflows.',
      source: 'Initial Requirements',
      timestamp: '2023-09-15T10:30:00',
      isPinned: true
    },
    {
      id: '2',
      content: 'Each stage should have validation steps to ensure quality outputs.',
      source: 'Design Meeting',
      timestamp: '2023-09-16T14:45:00',
      isPinned: false
    },
    {
      id: '3',
      content: 'The system should record snapshots at key points in the workflow.',
      source: 'Technical Specification',
      timestamp: '2023-09-17T09:15:00',
      isPinned: true
    },
    {
      id: '4',
      content: 'Users should be able to restore from previous snapshots to explore alternative paths.',
      source: 'User Story',
      timestamp: '2023-09-18T11:20:00',
      isPinned: false
    }
  ]);

  // Check for dark mode preference in localStorage or from parent component
  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setDarkMode(isDarkMode);
    
    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);

  const togglePin = (id: string) => {
    setMemoryItems(items => 
      items.map(item => 
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      )
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Theme classes
  const themeClasses = {
    card: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    text: darkMode ? 'text-gray-100' : 'text-gray-800',
    textSecondary: darkMode ? 'text-gray-300' : 'text-gray-600',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-500',
    border: darkMode ? 'border-gray-700' : 'border-gray-200',
    highlight: darkMode ? 'bg-cyan-900 text-cyan-300' : 'bg-blue-50 text-blue-600',
    itemBg: darkMode ? 'bg-gray-700' : 'bg-gray-50',
    hoverBg: darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
    buttonText: darkMode ? 'text-cyan-300' : 'text-blue-600',
    buttonHover: darkMode ? 'hover:text-cyan-100' : 'hover:text-blue-700',
    inputBg: darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300',
    tabActive: darkMode ? 'bg-gray-700 text-gray-100 border-gray-600 border-b-transparent' : 
                        'bg-gray-100 text-gray-800 border-gray-200 border-b-transparent',
    tabInactive: darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
  };

  return (
    <div className={`${themeClasses.card} rounded-xl shadow-lg h-[calc(100vh-8rem)] flex flex-col border ${themeClasses.border}`}>
      <div className={`border-b ${themeClasses.border} p-4`}>
        <h2 className={`font-medium ${themeClasses.text}`}>Memory Context</h2>
        
        {/* Tab navigation */}
        <div className="flex mt-2">
          <button 
            className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-t-lg ${
              activeTab === 'context' 
                ? themeClasses.tabActive
                : themeClasses.tabInactive
            }`}
            onClick={() => setActiveTab('context')}
          >
            Context
          </button>
          <button 
            className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-t-lg ml-2 ${
              activeTab === 'memory' 
                ? themeClasses.tabActive
                : themeClasses.tabInactive
            }`}
            onClick={() => setActiveTab('memory')}
          >
            Memory
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {activeTab === 'context' ? (
          <div className="space-y-4">
            <div className={`${darkMode ? 'bg-cyan-900 border-cyan-800' : 'bg-blue-50 border-blue-100'} p-3 rounded-lg border`}>
              <h3 className={`text-sm font-medium ${darkMode ? 'text-cyan-300' : 'text-blue-800'} mb-1`}>Current Context</h3>
              <p className={`text-xs ${darkMode ? 'text-cyan-300/70' : 'text-blue-700'}`}>
                This panel shows relevant context for the current stage in your workflow.
                Pin items to keep them accessible across stages.
              </p>
            </div>

            {memoryItems.filter(item => item.isPinned).map(item => (
              <div key={item.id} className={`p-3 rounded-lg border ${themeClasses.border} ${themeClasses.itemBg}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-xs font-medium ${themeClasses.textMuted}`}>{item.source}</span>
                  <button 
                    onClick={() => togglePin(item.id)}
                    className="text-yellow-500 hover:text-yellow-300"
                    aria-label={item.isPinned ? "Unpin this item" : "Pin this item"}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                </div>
                <p className={`text-sm ${themeClasses.text} mb-1`}>{item.content}</p>
                <div className={`text-xs ${themeClasses.textMuted}`}>{formatDate(item.timestamp)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search in memory..."
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-cyan-500 focus:border-cyan-500 ${themeClasses.inputBg} ${themeClasses.text}`}
              />
              <svg className={`w-4 h-4 ${themeClasses.textMuted} absolute right-3 top-2.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {memoryItems.map(item => (
              <div key={item.id} className={`p-3 rounded-lg border ${themeClasses.border} transition-colors ${themeClasses.hoverBg}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-xs font-medium ${themeClasses.textMuted}`}>{item.source}</span>
                  <button 
                    onClick={() => togglePin(item.id)}
                    className={item.isPinned ? "text-yellow-500 hover:text-yellow-300" : `${themeClasses.textMuted} hover:text-yellow-500`}
                    aria-label={item.isPinned ? "Unpin this item" : "Pin this item"}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                </div>
                <p className={`text-sm ${themeClasses.text} mb-1`}>{item.content}</p>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${themeClasses.textMuted}`}>{formatDate(item.timestamp)}</span>
                  <button className={`text-xs ${themeClasses.buttonText} ${themeClasses.buttonHover}`}>Insert</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`border-t ${themeClasses.border} p-4`}>
        <button className={`w-full px-4 py-2 ${themeClasses.itemBg} ${themeClasses.hoverBg} rounded-lg transition-colors text-sm ${themeClasses.text}`}>
          Add Note
        </button>
      </div>
    </div>
  );
};