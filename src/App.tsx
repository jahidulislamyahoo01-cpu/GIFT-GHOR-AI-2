import React, { useState, useEffect } from 'react';
import { StorefrontPreview } from './components/StorefrontPreview';
import { AdminDashboard } from './components/AdminDashboard';
import { GiftGhorChatWidget } from './components/GiftGhorChatWidget';

export default function App() {
  const [currentView, setCurrentView] = useState<'storefront' | 'admin' | 'widget_only'>(() => {
    // Check URL parameters or pathname
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'widget') {
      return 'widget_only';
    }
    if (params.get('view') === 'admin' || window.location.pathname === '/admin') {
      return 'admin';
    }
    return 'storefront';
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'widget') {
        setCurrentView('widget_only');
      } else if (params.get('view') === 'admin' || window.location.pathname === '/admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('storefront');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view: 'storefront' | 'admin') => {
    setCurrentView(view);
    const url = new URL(window.location.href);
    if (view === 'admin') {
      url.searchParams.set('view', 'admin');
      url.searchParams.delete('mode');
    } else {
      url.searchParams.delete('view');
      url.searchParams.delete('mode');
    }
    window.history.pushState({}, '', url.toString());
  };

  // If iframe or standalone embed mode
  if (currentView === 'widget_only') {
    // Add a class to body so index.css makes it transparent
    document.documentElement.classList.add('widget-mode');
    document.body.classList.add('widget-mode');
    
    // We render the widget WITHOUT standalone so it can use the floating button internally
    // and broadcast postMessage states.
    return (
      <div className="w-full h-full bg-transparent flex items-end justify-end">
        <GiftGhorChatWidget isIframeEmbed={true} />
      </div>
    );
  } else {
    document.documentElement.classList.remove('widget-mode');
    document.body.classList.remove('widget-mode');
  }

  // Admin Dashboard Mode
  if (currentView === 'admin') {
    return <AdminDashboard onGoToStorefront={() => navigateTo('storefront')} />;
  }

  // Default: Storefront Preview with floating Widget
  return <StorefrontPreview onGoToAdmin={() => navigateTo('admin')} />;
}
