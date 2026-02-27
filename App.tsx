
import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import MasterData from './components/MasterData';
import Transactions from './components/Transactions';
import Reports from './components/Reports';
import Sidebar from './components/Sidebar';
import Settings from './components/Settings';
import Modal from './components/Modal';
import { Page } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage<boolean>('isLoggedIn', false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [appKey, setAppKey] = useState(0);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    content: React.ReactNode | null;
  }>({ isOpen: false, title: '', content: null });

  const showModal = (title: string, content: React.ReactNode) => {
    setModal({ isOpen: true, title, content });
  };
  const hideModal = () => {
    setModal({ isOpen: false, title: '', content: null });
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const forceReRender = () => {
    setAppKey(prevKey => prevKey + 1);
  };
  
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard key={appKey} showModal={showModal} hideModal={hideModal} />;
      case 'master':
        return <MasterData key={appKey} />;
      case 'transaksi':
        return <Transactions key={appKey} />;
      case 'laporan':
        return <Reports key={appKey} showModal={showModal} />;
       case 'settings':
        return <Settings key={appKey} />;
      default:
        return <Dashboard key={appKey} showModal={showModal} hideModal={hideModal} />;
    }
  };

  return (
    <div className="relative min-h-screen md:flex bg-gray-100 font-sans">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        onLogout={handleLogout} 
        onRestoreSuccess={forceReRender}
        showModal={showModal}
        hideModal={hideModal}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="md:hidden flex justify-between items-center mb-4">
            <span className="text-xl font-bold text-brand-primary">Manajemen Disiplin</span>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-md bg-gray-200 text-gray-800">
                <Menu className="h-6 w-6" />
            </button>
        </div>
        {renderPage()}
      </main>
      <Modal isOpen={modal.isOpen} onClose={hideModal} title={modal.title}>
        {modal.content}
      </Modal>
    </div>
  );
};

export default App;
