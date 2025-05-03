import { useState, useRef, useEffect } from 'react';
// import { useWorkflow } from '../../context/useWorkflow'; // Remove old context
import { useWorkflowStore } from '@/store/workflowStore'; // Import Zustand store
import { useGetWorkflowDetail } from '@/hooks/useWorkflows'; // Correct hook import path
import { useGetExecutions } from '@/hooks/useExecutions'; // Import hook for executions
import { StageDetail, ExecutionLog } from '@/services/apiClient'; // Import correct types
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'; // Added ScrollBar
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SunIcon, MoonIcon, EyeIcon, SaveIcon, PlayIcon, RefreshCwIcon, PanelLeftOpenIcon, PanelRightOpenIcon, WorkflowIcon } from 'lucide-react'; // Added WorkflowIcon

import { StageBox } from './StageBox';
import { StagePreviewOverlay } from './StagePreviewOverlay';
import { StageDetailView } from './StageDetailView';
import { MemoryContextViewer } from './MemoryContextViewer';

// Rename component
export const WorkflowStageRail = () => {
  // Zustand state and actions
  const activeWorkflowId = useWorkflowStore((state) => state.activeWorkflowId);
  const currentStageOrder = useWorkflowStore((state) => state.activeStageOrder);
  const isOverviewMode = useWorkflowStore((state) => state.isOverviewMode);
  const setActiveStageOrder = useWorkflowStore((state) => state.setActiveStageOrder);
  const setIsOverviewMode = useWorkflowStore((state) => state.setIsOverviewMode);
  const showMemoryPanel = useWorkflowStore((state) => state.showMemoryPanel);
  const setShowMemoryPanel = useWorkflowStore((state) => state.setShowMemoryPanel);

  // Fetch workflow details
  const { data: workflow, isLoading: isLoadingWorkflow, error: workflowError } = useGetWorkflowDetail(activeWorkflowId);
  // Fetch executions for the active workflow
  const { data: executions, isLoading: isLoadingExecutions, error: executionsError } = useGetExecutions(activeWorkflowId);

  // Validation results are part of the ExecutionLog, no separate fetch needed for now
  // const validationResults: Record<string, any> = {}; // Placeholder removed

  // Local UI state (consider moving some to Zustand if needed globally)
  const [hoverStageId, setHoverStageId] = useState<number | null>(null); // Assuming stage order is number
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0, side: 'right' as 'left' | 'right' });
  const railRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  // const [showSidePanel, setShowSidePanel] = useState(window.innerWidth > 1024); // Replaced by Zustand showMemoryPanel
  const [activeTab, setActiveTab] = useState<'prompt' | 'output' | 'validator' | 'snapshots'>('prompt');
  // const [darkMode, setDarkMode] = useState(true); // Remove local dark mode state, rely on Orca's theme

  // Handle responsive states
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      // setShowSidePanel(window.innerWidth > 1024); // Replaced by Zustand
      // Automatically show/hide memory panel based on screen size if desired
      if (window.innerWidth <= 1024 && showMemoryPanel) {
        setShowMemoryPanel(false);
      } else if (window.innerWidth > 1024 && !showMemoryPanel) {
        // Optionally auto-show on larger screens
        // setShowMemoryPanel(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, [showMemoryPanel, setShowMemoryPanel]);

  // Ensure overview mode is off when viewing details (stage selected)
  useEffect(() => {
    if (currentStageOrder !== null) {
      setIsOverviewMode(false);
    }
  }, [currentStageOrder, setIsOverviewMode]);

  // Scroll active stage into view when changing stages
  useEffect(() => {
    if (currentStageOrder !== null && railRef.current) {
      // Use stage order or ID depending on how StageBox is keyed/identified
      const activeElement = railRef.current.querySelector(`[data-stage-order="${currentStageOrder}"]`);
      activeElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentStageOrder]);

  // --- Data Loading/Error Handling ---
  if (isLoadingWorkflow || isLoadingExecutions) {
    return <div className="p-4">Loading workflow data...</div>; // Replace with Skeleton loader
  }

  if (workflowError || executionsError || !workflow) {
    const errorMessage = workflowError?.message || executionsError?.message || 'Workflow or execution data not found';
    return <div className="p-4 text-destructive">Error loading data: {errorMessage}</div>;
  }
  // --- End Data Loading/Error Handling ---

  const handleStageMouseEnter = (stageOrder: number) => { // Assuming hover uses order
    if (!railRef.current) return;

    const stageElement = railRef.current.querySelector(`[data-stage-order="${stageOrder}"]`);
    if (stageElement) {
      const rect = stageElement.getBoundingClientRect();

      // Position overlay to the right of the stage rail
      setOverlayPosition({
        x: rect.right + 16,
        y: rect.top,
        side: 'right'
      });
    }

    setHoverStageId(stageOrder);
  };

  const handleStageMouseLeave = () => {
    setHoverStageId(null);
  };

  const currentStage = currentStageOrder !== null
    ? workflow.stages.find(stage => stage.order === currentStageOrder)
    : null;

  const hoveredStage = hoverStageId !== null
    ? workflow.stages.find(stage => stage.order === hoverStageId)
    : null;

  // Find the latest log for the hovered stage
  const hoveredStageLog = hoveredStage && executions
    ? executions
        .filter(log => log.stageId === hoveredStage.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] // Get the most recent log for the hovered stage
    : null;

  // Find the latest log for the currently selected stage
  const currentStageLog = currentStage && executions
    ? executions
        .filter(log => log.stageId === currentStage.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] // Get the most recent log for the stage
    : null;
  const currentStageValidation = currentStage
    ? validationResults[currentStage.id] // Assuming validation results are keyed by stage ID
    : null;

  // Remove themeClasses object - rely on shadcn/ui and Orca's theme
  // const themeClasses = { ... };

  return (
    // Use theme classes from globals.css or shadcn/ui's theme provider
    <div className="w-full min-h-screen bg-background text-foreground transition-colors duration-200 flex flex-col">
      {/* Sticky top navigation bar - Use shadcn components */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6 py-2">
        {/* Replace with Orca's standard header/breadcrumb if available */}
        <div className="flex items-center gap-4 flex-grow">
          <h1 className="text-xl font-semibold truncate max-w-xs" title={workflow.name}>{workflow.name}</h1>
          <span className="text-muted-foreground">|</span>
          {/* TODO: Replace with Model Selector component if exists and make functional */}
          <Select defaultValue="gpt-4" disabled>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4">GPT-4</SelectItem>
              <SelectItem value="claude-3">Claude-3</SelectItem>
              <SelectItem value="gemini">Gemini</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          {/* Integrate Orca's Theme Toggle */}
          {/* <Button variant="outline" size="icon" onClick={() => console.log('Toggle Theme')}>
            <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button> */}
          <Button
            variant="outline"
            onClick={() => setIsOverviewMode(!isOverviewMode)}
          >
            <EyeIcon className="mr-2 h-4 w-4" />
            {isOverviewMode ? "Detail View" : "Overview"}
          </Button>
          <Button>
            <SaveIcon className="mr-2 h-4 w-4" />
            Save Snapshot
          </Button>
          {/* Button to toggle Memory Panel */}
          {!isMobile && (
             <Button variant="outline" size="icon" onClick={() => setShowMemoryPanel(!showMemoryPanel)}>
               {showMemoryPanel ? <PanelRightOpenIcon className="h-5 w-5" /> : <PanelLeftOpenIcon className="h-5 w-5" />}
               <span className="sr-only">Toggle Memory Panel</span>
             </Button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow p-4 sm:px-6 sm:py-0 md:gap-8">
        {isOverviewMode ? (
          // Workflow Overview Mode - Graph Visualization
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Workflow Graph</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-120px)]">
              {/* Workflow Graph Visualization - Placeholder */}
              <div className="relative flex-grow border rounded-lg flex justify-center items-center bg-muted/40 mb-6">
                <div className="text-center text-muted-foreground">
                  {/* Placeholder Icon */}
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                  </svg>
                  <p className="text-lg font-medium">Workflow Visualization</p>
                  <p className="mt-1 text-sm">Connect nodes and visualize the complete workflow path</p>
                </div>
              </div>

              <h3 className="text-lg font-medium mb-3">Stage Cards</h3>
              <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <div className="flex w-max space-x-4 p-4">
                  {workflow.stages.map((stage) => (
                    <TooltipProvider key={stage.order} delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {/* Assuming StageBox is refactored to accept order */}
                          <div data-stage-order={stage.order}>
                             <StageBox
                               stage={stage}
                               // Pass order instead of id if StageBox uses order
                               onMouseEnter={() => handleStageMouseEnter(stage.order)}
                               onMouseLeave={handleStageMouseLeave}
                             />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>{stage.name}</p>
                          <p className="text-xs text-muted-foreground">{stage.summary}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
                {/* <ScrollBar orientation="horizontal" /> */}
              </ScrollArea>
            </CardContent>
            {/* Optional Footer */}
          </Card>
        ) : (
          // Detail Mode (Layout using flex/grid)
          <div className="flex gap-6 h-full">
            {/* Left Column - Vertical Stage Rail */}
            <Card
              ref={railRef} // Keep ref for scrolling
              className="hidden md:flex md:flex-col w-[220px] lg:w-[280px] h-[calc(100vh-8rem)]" // Adjust height based on header
            >
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-lg">Stages</CardTitle>
              </CardHeader>
              <ScrollArea className="flex-grow">
                <CardContent className="p-2 space-y-1">
                  {workflow.stages.map((stage) => (
                    <Button
                      key={stage.id} // Use stage.id as key
                      data-stage-order={stage.order} // Keep data-stage-order for scrolling
                      className="transition-all duration-150"
                    >
                      <StageBox
                        stage={stage}
                        latestLog={executions?.find(log => log.stageId === stage.id && log.executionId === workflow.latestExecutionId) ?? null} // Pass latest log for this stage from the latest execution
                        onMouseEnter={() => handleStageMouseEnter(stage.order)} // Pass order for hover logic
                        onMouseLeave={handleStageMouseLeave}
                      />
                    </div>
                  ))}
                </CardContent>
              </ScrollArea>
            </Card>

            {/* Center Column - Stage Detail View with Tabs */}
            <div className="flex-1 h-[calc(100vh-8rem)]"> {/* Adjust height */} 
              {currentStage ? (
                <Card className="h-full flex flex-col">
                  <CardHeader className="border-b p-4">
                    <div className="flex items-center mb-4">
                      {/* Icon */}
                      <span className="text-2xl mr-3" aria-hidden="true">{currentStage.icon || '📄'}</span>
                      <div>
                        <CardTitle className="text-lg">{currentStage.name}</CardTitle>
                        {/* Status Badge */}
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${currentStage.status === 'Complete' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : currentStage.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                          {currentStage.status}
                        </span>
                      </div>
                    </div>

                    {/* Tab navigation using shadcn Tabs */}
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="prompt">Prompt</TabsTrigger>
                        <TabsTrigger value="output">Output</TabsTrigger>
                        <TabsTrigger value="validator">Validator</TabsTrigger>
                        <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </CardHeader>

                  <ScrollArea className="flex-grow">
                    <CardContent className="p-4">
                      {/* StageDetailView needs refactoring too */}
                      <StageDetailView
                        stage={currentStage}
                        activeTab={activeTab}
                      />
                    </CardContent>
                  </ScrollArea>

                  <div className="border-t p-4 flex justify-between items-center">
                    <div>
                      {currentStage.validatorStatus && (
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-muted-foreground mr-2">Validator:</span>
                          {/* Validator Badge */}
                          <span className={`px-2 py-0.5 text-xs rounded-lg ${currentStage.validatorStatus === 'Pass' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : currentStage.validatorStatus === 'Fail' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 'bg-muted text-muted-foreground'}`}>
                            {currentStage.validatorStatus}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-3">
                      <Button variant="outline">
                        <RefreshCwIcon className="mr-2 h-4 w-4" />
                        Retry
                      </Button>
                      <Button
                        disabled={currentStage.status === 'In Progress'}
                        // Add onClick handler for running the stage
                      >
                        <PlayIcon className="mr-2 h-4 w-4" />
                        Run
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="h-full flex flex-col items-center justify-center border-dashed">
                  <div className="text-muted-foreground text-lg mb-2">No stage selected</div>
                  <p className="text-muted-foreground text-center max-w-xs">
                    Select a stage from the left panel to view its details.
                  </p>
                </Card>
              )}
            </div>

            {/* Right Column - Memory Context Viewer (Conditionally Rendered) */}
            {showMemoryPanel && (
              <div className="hidden lg:block w-[300px] xl:w-[350px] h-[calc(100vh-8rem)]"> {/* Adjust height */} 
                {/* MemoryContextViewer needs refactoring too */}
                <MemoryContextViewer />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Preview Overlay - Needs refactoring */}
      {hoveredStage && hoverStageId !== null && !isMobile && !isOverviewMode && (
        <StagePreviewOverlay
          stage={hoveredStage}
          latestLog={hoveredStageLog} // Pass the latest log for the hovered stage
          position={overlayPosition}
        />
      )}
    </div>
  );