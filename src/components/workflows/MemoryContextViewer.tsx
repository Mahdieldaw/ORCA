import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Pin, PinOff, Search } from 'lucide-react';
// If you add Tabs primitives later, import them from shadcn/ui

// TODO: Replace with shadcn/ui Tabs primitives when available in your project
function Tabs({ value, onValueChange, children, className }: any) {
  return <div className={className}>{children}</div>;
}
function TabsList({ children, className }: any) {
  return <div className={cn('flex space-x-2 border-b mb-2', className)}>{children}</div>;
}
function TabsTrigger({ value, activeValue, onClick, children, className }: any) {
  return (
    <Button
      type="button"
      variant={value === activeValue ? 'secondary' : 'ghost'}
      size="sm"
      className={cn('rounded-b-none', className, value === activeValue && 'border-b-2 border-primary')}
      onClick={onClick}
      aria-selected={value === activeValue}
      tabIndex={0}
    >
      {children}
    </Button>
  );
}

export interface MemoryContextViewerProps {
  workflowId: string | null;
}

type MemoryItem = {
  id: string;
  content: string;
  source: string;
  timestamp: string;
  isPinned: boolean;
};

export const MemoryContextViewer: React.FC<MemoryContextViewerProps> = ({ workflowId }) => {
  const [activeTab, setActiveTab] = useState<'context' | 'memory'>('context');
  const [search, setSearch] = useState('');
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
  // TODO: Fetch memory items from API based on props (e.g., workflowId)

  const togglePin = (id: string) => {
    setMemoryItems(items =>
      items.map(item =>
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      )
    );
    // TODO: Call API mutation to update pinned status
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredMemory = search
    ? memoryItems.filter(item =>
        item.content.toLowerCase().includes(search.toLowerCase()) ||
        item.source.toLowerCase().includes(search.toLowerCase())
      )
    : memoryItems;

  return (
    <Card className="h-[calc(100vh-8rem)] flex flex-col">
      <CardHeader className="border-b p-4">
        <CardTitle className="text-base">Memory Context</CardTitle>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList>
            <TabsTrigger
              value="context"
              activeValue={activeTab}
              onClick={() => setActiveTab('context')}
            >
              Context
            </TabsTrigger>
            <TabsTrigger
              value="memory"
              activeValue={activeTab}
              onClick={() => setActiveTab('memory')}
            >
              Memory
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4">
        {activeTab === 'context' ? (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-cyan-900 border border-blue-100 dark:border-cyan-800 p-3 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 dark:text-cyan-300 mb-1">Current Context</h3>
              <p className="text-xs text-blue-700 dark:text-cyan-300/70">
                This panel shows relevant context for the current stage in your workflow. Pin items to keep them accessible across stages.
              </p>
            </div>
            {memoryItems.filter(item => item.isPinned).length === 0 && (
              <div className="text-xs text-muted-foreground">No pinned items.</div>
            )}
            {memoryItems.filter(item => item.isPinned).map(item => (
              <div key={item.id} className="p-3 rounded-lg border bg-muted dark:bg-muted/50">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-medium text-muted-foreground">{item.source}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePin(item.id)}
                    aria-label={item.isPinned ? 'Unpin this item' : 'Pin this item'}
                  >
                    {item.isPinned ? (
                      <Pin className="w-4 h-4 text-yellow-500" fill="currentColor" />
                    ) : (
                      <PinOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-sm mb-1 text-foreground">{item.content}</p>
                <div className="text-xs text-muted-foreground">{formatDate(item.timestamp)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search in memory..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-8"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
            {filteredMemory.length === 0 && (
              <div className="text-xs text-muted-foreground">No memory items found.</div>
            )}
            {filteredMemory.map(item => (
              <div key={item.id} className={cn(
                'p-3 rounded-lg border bg-muted dark:bg-muted/50 transition-colors',
                'hover:bg-accent dark:hover:bg-accent/50'
              )}>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-medium text-muted-foreground">{item.source}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePin(item.id)}
                    aria-label={item.isPinned ? 'Unpin this item' : 'Pin this item'}
                  >
                    {item.isPinned ? (
                      <Pin className="w-4 h-4 text-yellow-500" fill="currentColor" />
                    ) : (
                      <PinOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-sm mb-1 text-foreground">{item.content}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{formatDate(item.timestamp)}</span>
                  <Button variant="link" size="sm" className="text-xs px-0 h-6">Insert</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t p-4">
        <Button className="w-full" variant="secondary">Add Note</Button>
      </CardFooter>
    </Card>
  );
};