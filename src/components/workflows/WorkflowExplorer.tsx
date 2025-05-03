import { useState, useRef, useEffect } from 'react';
import { useWorkflow } from '../../context/useWorkflow';
import { StageBox } from './StageBox';
import { StagePreviewOverlay } from './StagePreviewOverlay';
import { StageDetailView } from './StageDetailView';
import { MemoryContextViewer } from './MemoryContextViewer';

export const WorkflowExplorer = () => {
  const { workflow, currentStageId, isOverviewMode, setIsOverviewMode, setCurrentStageId } = useWorkflow();
  const [hoverStageId, setHoverStageId] = useState<string | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0, side: 'right' as 'left' | 'right' });
  const railRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showSidePanel, setShowSidePanel] = useState(window.innerWidth > 1024);
  const [activeTab, setActiveTab] = useState<'prompt' | 'output' | 'validator' | 'snapshots'>('prompt');
  const [darkMode, setDarkMode] = useState(true); // Start with dark mode enabled to match image
  
  // Handle responsive states
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setShowSidePanel(window.innerWidth > 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Ensure overview mode is off when viewing details
  useEffect(() => {
    if (currentStageId) {
      setIsOverviewMode(false);
    }
  }, [currentStageId, setIsOverviewMode]);

  // Scroll active stage into view when changing stages
  useEffect(() => {
    if (currentStageId && railRef.current) {
      const activeElement = railRef.current.querySelector(`[data-stage-id="${currentStageId}"]`);
      activeElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentStageId]);

  const handleStageMouseEnter = (stageId: string) => {
    if (!railRef.current) return;
    
    const stageElement = railRef.current.querySelector(`[data-stage-id="${stageId}"]`);
    if (stageElement) {
      const rect = stageElement.getBoundingClientRect();
      
      // Position overlay to the right of the stage rail
      setOverlayPosition({ 
        x: rect.right + 16,
        y: rect.top,
        side: 'right'
      });
    }
    
    setHoverStageId(stageId);
  };

  const handleStageMouseLeave = () => {
    setHoverStageId(null);
  };

  const currentStage = currentStageId 
    ? workflow.stages.find(stage => stage.id === currentStageId)
    : null;

  const hoveredStage = hoverStageId
    ? workflow.stages.find(stage => stage.id === hoverStageId)
    : null;

  // Generate theme classes based on dark mode state
  const themeClasses = {
    background: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    card: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    text: darkMode ? 'text-gray-100' : 'text-gray-800',
    textSecondary: darkMode ? 'text-gray-300' : 'text-gray-600',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-500',
    highlight: darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-50 text-blue-600',
    highlightHover: darkMode ? 'hover:bg-blue-800' : 'hover:bg-blue-100',
    buttonPrimary: darkMode ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-blue-600 hover:bg-blue-700',
    buttonSecondary: darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200',
    border: darkMode ? 'border-gray-700' : 'border-gray-200',
    navBg: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    leftBorder: darkMode ? 'border-l-cyan-500' : 'border-l-blue-500',
    tabActive: darkMode ? 'border-cyan-500 text-cyan-300' : 'border-blue-500 text-blue-600',
    tabInactive: darkMode ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
  };

  return (
    <div className={`w-full min-h-screen ${themeClasses.background} transition-colors duration-200`}>
      {/* Sticky top navigation bar */}
      <div className={`sticky top-0 z-10 ${themeClasses.navBg} shadow-md border-b px-4 py-3`}>
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className={`text-xl font-semibold ${themeClasses.text}`}>{workflow.name}</h1>
            <span className={`text-sm ${themeClasses.textMuted}`}>|</span>
            <select className={`text-sm border ${themeClasses.border} rounded-md px-2 py-1 ${themeClasses.card} ${themeClasses.text}`}>
              <option>GPT-4</option>
              <option>Claude-3</option>
              <option>Gemini</option>
            </select>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full ${themeClasses.buttonSecondary} transition-colors`}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fillRule="evenodd" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            <button 
              className={`text-sm ${themeClasses.highlight} ${themeClasses.highlightHover} px-3 py-1.5 rounded-md transition-colors`}
              onClick={() => setIsOverviewMode(!isOverviewMode)}
            >
              {isOverviewMode ? "Detail View" : "Overview"}
            </button>
            <button className={`text-sm ${themeClasses.buttonPrimary} text-white px-3 py-1.5 rounded-md transition-colors`}>
              Save Snapshot
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {isOverviewMode ? (
          // Workflow Overview Mode - Graph Visualization
          <div className={`${themeClasses.card} rounded-xl shadow-lg p-6 border`}>
            <h2 className={`text-lg font-medium mb-4 ${themeClasses.text}`}>Workflow Graph</h2>
            
            {/* Workflow Graph Visualization - Based on the reference image */}
            <div className="relative w-full h-[60vh] mb-8 overflow-auto">
              {/* This would be replaced with an actual graph visualization component */}
              <div className="flex justify-center items-center h-full">
                <div className={`text-center ${themeClasses.textSecondary}`}>
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                  </svg>
                  <p className="text-lg font-medium">Workflow Visualization</p>
                  <p className="mt-2">Connect nodes and visualize the complete workflow path</p>
                </div>
              </div>
            </div>
            
            <h2 className={`text-lg font-medium mb-4 ${themeClasses.text}`}>Stage Cards</h2>
            <div className="flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory">
              {workflow.stages.map((stage) => (
                <div key={stage.id} data-stage-id={stage.id} className="snap-center">
                  <StageBox
                    stage={stage}
                    onMouseEnter={handleStageMouseEnter}
                    onMouseLeave={handleStageMouseLeave}
                  />
                </div>
              ))}
            </div>

            {hoveredStage && hoverStageId && !isMobile && (
              <StagePreviewOverlay
                stage={hoveredStage}
                position={overlayPosition}
              />
            )}
          </div>
        ) : (
          // Detail Mode (3-column layout)
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column - Vertical Stage Rail */}
            <div 
              ref={railRef}
              className={`md:col-span-3 lg:col-span-2 ${themeClasses.card} rounded-xl shadow-lg h-[calc(100vh-8rem)] overflow-y-auto border`}
            >
              <div className={`p-4 border-b ${themeClasses.border}`}>
                <h2 className={`font-medium ${themeClasses.text}`}>Stages</h2>
              </div>
              <div className="space-y-2 p-2">
                {workflow.stages.map((stage) => (
                  <div 
                    key={stage.id} 
                    data-stage-id={stage.id}
                    className="transition-all duration-150"
                  >
                    <div 
                      className={`p-3 rounded-lg cursor-pointer flex items-center transition-all
                        ${currentStageId === stage.id 
                          ? `${darkMode ? 'bg-gray-700' : 'bg-blue-50'} border-l-4 ${themeClasses.leftBorder}` 
                          : `border-l-4 border-transparent ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                      `}
                      onClick={() => setCurrentStageId(stage.id)}
                      onMouseEnter={() => !isMobile && handleStageMouseEnter(stage.id)}
                      onMouseLeave={() => !isMobile && handleStageMouseLeave()}
                    >
                      <div 
                        className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${
                          stage.status === 'Complete' ? 'bg-green-500' : 
                          stage.status === 'In Progress' ? 'bg-cyan-500' : 
                          stage.status === 'Failed' ? 'bg-red-500' : 'bg-gray-400'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <span className={`mr-2 text-lg ${darkMode ? 'text-cyan-400' : ''}`} aria-hidden="true">{stage.icon}</span>
                          <p className={`font-medium truncate text-sm ${themeClasses.text}`}>{stage.name}</p>
                        </div>
                        {currentStageId === stage.id && (
                          <p className={`text-xs ${themeClasses.textMuted} mt-1 line-clamp-2`}>{stage.summary}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Center Column - Stage Detail View with Tabs */}
            <div className="md:col-span-9 lg:col-span-7">
              {currentStage ? (
                <div className={`${themeClasses.card} rounded-xl shadow-lg h-[calc(100vh-8rem)] flex flex-col border`}>
                  <div className={`border-b ${themeClasses.border} p-4`}>
                    <div className="flex items-center">
                      <span className={`text-2xl mr-3 ${darkMode ? 'text-cyan-300' : ''}`} aria-hidden="true">{currentStage.icon}</span>
                      <div>
                        <h2 className={`font-semibold text-lg ${themeClasses.text}`}>{currentStage.name}</h2>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                          currentStage.status === 'Complete' ? 'bg-green-900 text-green-300' : 
                          currentStage.status === 'In Progress' ? 'bg-cyan-900 text-cyan-300' : 
                          'bg-red-900 text-red-300'
                        }`}>
                          {currentStage.status}
                        </span>
                      </div>
                    </div>
                    
                    {/* Tab navigation */}
                    <div className={`flex border-b ${themeClasses.border} mt-4`}>
                      <button 
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                          activeTab === 'prompt' 
                            ? themeClasses.tabActive
                            : themeClasses.tabInactive
                        }`}
                        onClick={() => setActiveTab('prompt')}
                      >
                        Prompt
                      </button>
                      <button 
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                          activeTab === 'output' 
                            ? themeClasses.tabActive
                            : themeClasses.tabInactive
                        }`}
                        onClick={() => setActiveTab('output')}
                      >
                        Output
                      </button>
                      <button 
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                          activeTab === 'validator' 
                            ? themeClasses.tabActive
                            : themeClasses.tabInactive
                        }`}
                        onClick={() => setActiveTab('validator')}
                      >
                        Validator
                      </button>
                      <button 
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                          activeTab === 'snapshots' 
                            ? themeClasses.tabActive
                            : themeClasses.tabInactive
                        }`}
                        onClick={() => setActiveTab('snapshots')}
                      >
                        Snapshots
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex-1 overflow-y-auto">
                    <StageDetailView 
                      stage={currentStage} 
                      activeTab={activeTab} 
                    />
                  </div>

                  <div className={`border-t ${themeClasses.border} p-4 flex justify-between items-center`}>
                    <div>
                      {currentStage.validatorStatus && (
                        <div className="flex items-center">
                          <span className={`text-sm font-medium ${themeClasses.textSecondary} mr-2`}>Validator:</span>
                          <span className={`px-2 py-0.5 text-xs rounded-lg ${
                            currentStage.validatorStatus === 'Pass' ? 'bg-green-900 text-green-300' : 
                            currentStage.validatorStatus === 'Fail' ? 'bg-red-900 text-red-300' : 
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {currentStage.validatorStatus}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-3">
                      <button
                        className={`px-4 py-2 ${themeClasses.buttonSecondary} rounded-lg transition-colors`}
                        aria-label="Retry this stage"
                      >
                        Retry
                      </button>
                      <button
                        className={`px-4 py-2 ${themeClasses.buttonPrimary} text-white rounded-lg transition-colors shadow-sm`}
                        disabled={currentStage.status === 'In Progress'}
                        aria-label="Run this stage"
                      >
                        Run
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`${themeClasses.card} rounded-xl shadow-lg p-8 flex flex-col items-center justify-center h-[calc(100vh-8rem)] border`}>
                  <div className={`${themeClasses.textMuted} text-lg mb-4`}>No stage selected</div>
                  <p className={`${themeClasses.textSecondary} text-center max-w-md`}>
                    Select a stage from the left panel to view its details and manage its content.
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Memory Context Viewer (Hidden on mobile and medium screens) */}
            {showSidePanel && (
              <div className="hidden lg:block lg:col-span-3">
                <MemoryContextViewer />
              </div>
            )}

            {/* Mobile toggle for memory panel */}
            {!showSidePanel && !isMobile && currentStage && (
              <button
                onClick={() => setShowSidePanel(true)}
                className={`fixed bottom-6 right-6 ${themeClasses.buttonPrimary} text-white p-3 rounded-full shadow-lg transition-colors`}
                aria-label="Show memory panel"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Preview Overlay for Stage Rail hover */}
      {hoveredStage && hoverStageId && !isMobile && !isOverviewMode && (
        <StagePreviewOverlay
          stage={hoveredStage}
          position={overlayPosition}
        />
      )}
    </div>
  );
};