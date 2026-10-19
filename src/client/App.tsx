import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout, ToastMessage } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { GeneratorPage } from './pages/GeneratorPage';
import { CardEditorPage } from './pages/CardEditorPage';
import { GalleryPage } from './pages/GalleryPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ExportCenterPage } from './pages/ExportCenterPage';
import { apiClient, SystemStatusResponse } from './services/apiClient';
import { PlayingCard, Project } from '../shared/types';
import { INITIAL_DEMO_CARDS, INITIAL_DEMO_PROJECTS } from '../shared/demoData';

export const App: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatusResponse | null>(null);
  const [projects, setProjects] = useState<Project[]>(INITIAL_DEMO_PROJECTS);
  const [cards, setCards] = useState<PlayingCard[]>(INITIAL_DEMO_CARDS);
  const [selectedCard, setSelectedCard] = useState<PlayingCard | null>(
    INITIAL_DEMO_CARDS[0]
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback(
    (text: string, type: 'info' | 'success' | 'error' = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshAllData = useCallback(async () => {
    try {
      const [statusData, projList, cardList] = await Promise.all([
        apiClient.getStatus(),
        apiClient.listProjects(),
        apiClient.listCards(),
      ]);
      setSystemStatus(statusData);
      if (projList.length > 0) setProjects(projList);
      if (cardList.length > 0) {
        setCards(cardList);
        setSelectedCard((prev) =>
          prev ? cardList.find((c) => c.id === prev.id) || cardList[0] : cardList[0]
        );
      }
    } catch {
      // Fallback to demo data if server is warming up
    }
  }, []);

  useEffect(() => {
    void refreshAllData();
  }, [refreshAllData]);

  const handleCardUpsert = useCallback((card: PlayingCard) => {
    setCards((prev) => {
      const exists = prev.some((c) => c.id === card.id);
      if (exists) {
        return prev.map((c) => (c.id === card.id ? card : c));
      }
      return [card, ...prev];
    });
    setSelectedCard(card);
    void refreshAllData();
  }, [refreshAllData]);

  return (
    <BrowserRouter>
      <Layout
        systemStatus={systemStatus}
        toasts={toasts}
        onDismissToast={dismissToast}
      >
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                cards={cards}
                onSelectCardForEdit={(card) => setSelectedCard(card)}
              />
            }
          />
          <Route
            path="/generator"
            element={
              <GeneratorPage
                projects={projects}
                activeCard={selectedCard}
                onCardGenerated={handleCardUpsert}
                onSelectCardForEdit={(card) => setSelectedCard(card)}
                onDeckCreated={() => void refreshAllData()}
                notify={notify}
              />
            }
          />
          <Route
            path="/editor"
            element={
              <CardEditorPage
                cards={cards}
                selectedCard={selectedCard}
                onSelectCard={(card) => setSelectedCard(card)}
                onCardUpdated={handleCardUpsert}
                notify={notify}
              />
            }
          />
          <Route
            path="/gallery"
            element={
              <GalleryPage
                projects={projects}
                cards={cards}
                onCardUpdated={handleCardUpsert}
                onSelectCardForEdit={(card) => setSelectedCard(card)}
                onProjectsChanged={() => void refreshAllData()}
                notify={notify}
              />
            }
          />
          <Route
            path="/projects"
            element={
              <ProjectsPage
                projects={projects}
                cards={cards}
                systemStatus={systemStatus}
                onProjectsChanged={() => void refreshAllData()}
                onSelectCardForEdit={(card) => setSelectedCard(card)}
                notify={notify}
              />
            }
          />
          <Route
            path="/export"
            element={
              <ExportCenterPage
                projects={projects}
                cards={cards}
                notify={notify}
              />
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};
