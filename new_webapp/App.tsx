import React, { useState } from 'react';
import { AppView, SourceMetadata } from './types';
import { SourceLoader } from './views/SourceLoader';
import { Workspace } from './views/Workspace';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.SOURCE_LOADER);
  const [currentSource, setCurrentSource] = useState<SourceMetadata | null>(null);

  const handleSourceLoaded = (source: SourceMetadata) => {
    setCurrentSource(source);
    setCurrentView(AppView.TRANSCRIPT_VIEW);
  };

  const handleBackToLoader = () => {
    setCurrentSource(null);
    setCurrentView(AppView.SOURCE_LOADER);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 selection:bg-primary-500/30">
      {currentView === AppView.SOURCE_LOADER && (
        <SourceLoader 
            onSourceLoaded={handleSourceLoaded} 
        />
      )}
      
      {currentView === AppView.TRANSCRIPT_VIEW && currentSource && (
        <Workspace 
          source={currentSource} 
          onBack={handleBackToLoader} 
        />
      )}
    </div>
  );
};

export default App;