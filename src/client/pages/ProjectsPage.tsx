import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderPlus,
  Edit3,
  Copy,
  Trash2,
  Play,
  Download,
  Palette,
  Check,
  X,
  CreditCard,
} from 'lucide-react';
import { CardRenderer } from '../components/CardRenderer';
import {
  COLOR_PALETTES,
  ILLUSTRATION_STYLES,
  PlayingCard,
  Project,
} from '../../shared/types';
import { apiClient, SystemStatusResponse } from '../services/apiClient';

export const ProjectsPage: React.FC<{
  projects: Project[];
  cards: PlayingCard[];
  systemStatus: SystemStatusResponse | null;
  onProjectsChanged: () => void;
  onSelectCardForEdit: (card: PlayingCard) => void;
  notify: (text: string, type?: 'info' | 'success' | 'error') => void;
}> = ({
  projects,
  cards,
  systemStatus,
  onProjectsChanged,
  onSelectCardForEdit,
  notify,
}) => {
  const navigate = useNavigate();

  const [newProjName, setNewProjName] = useState<string>('');
  const [newProjDesc, setNewProjDesc] = useState<string>('');
  const [newProjStyle, setNewProjStyle] = useState<string>('royal-enamel');
  const [newProjPalette, setNewProjPalette] = useState<string>('saperavi-gold');

  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editThemeStyle, setEditThemeStyle] = useState<string>('');
  const [expandedProjId, setExpandedProjId] = useState<string | null>(
    projects[0]?.id || null
  );
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) {
      notify('გთხოვთ მიუთითოთ პროექტის სახელი.', 'error');
      return;
    }

    try {
      const created = await apiClient.createProject({
        name: newProjName.trim(),
        description: newProjDesc.trim() || 'საავტორო ქართული ბანქოს პროექტი',
        deckConfig: {
          deckType: '52',
          suits: ['guli', 'aguri', 'jvari', 'piki'],
          ranks: ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'],
          includeJoker: false,
          jokerCount: 0,
          includeCardBack: true,
          illustrationStyle: newProjStyle,
          paletteId: newProjPalette,
          ornamentMotif: 'vine',
          complexityLevel: 'royal-intricate',
          cardWidthMm: 63,
          cardHeightMm: 88,
          imageQuality: '1K',
          modelId: 'gemini-nano-banana-2.1',
        },
      });
      setNewProjName('');
      setNewProjDesc('');
      setExpandedProjId(created.id);
      onProjectsChanged();
      notify(`შეიქმნა ახალი პროექტი: ${created.name}`, 'success');
    } catch {
      notify('პროექტის შექმნა ვერ მოხერხდა.', 'error');
    }
  };

  const handleStartEditProject = (proj: Project) => {
    setEditingProjId(proj.id);
    setEditName(proj.name);
    setEditThemeStyle(proj.deckConfig?.illustrationStyle || 'royal-enamel');
  };

  const handleSaveProjectEdit = async (proj: Project) => {
    try {
      await apiClient.updateProject(proj.id, {
        name: editName.trim() || proj.name,
        deckConfig: {
          ...proj.deckConfig,
          illustrationStyle: editThemeStyle,
        },
      });
      setEditingProjId(null);
      onProjectsChanged();
      notify('პროექტის სახელი და დიზაინის თემა განახლდა.', 'success');
    } catch {
      notify('პროექტის განახლება ვერ მოხერხდა.', 'error');
    }
  };

  const handleDuplicate = async (projectId: string) => {
    try {
      await apiClient.duplicateProject(projectId);
      onProjectsChanged();
      notify('პროექტის ასლი წარმატებით შეიქმნა.', 'success');
    } catch {
      notify('დუბლირება ვერ მოხერხდა.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      await apiClient.deleteProject(projectToDelete.id);
      setProjectToDelete(null);
      onProjectsChanged();
      notify('პროექტი წაიშალა.', 'info');
    } catch {
      notify('წაშლა ვერ მოხერხდა.', 'error');
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2.25rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>
          ჩემი პროექტები და პარამეტრები
        </h1>
        <p style={{ color: 'var(--color-stone)', fontSize: '0.92rem' }}>
          მართეთ თქვენი ბანქოს პროექტები, შეცვალეთ დიზაინის თემა, გააგრძელეთ დაუსრულებელი
          გენერაცია ან მოამზადეთ ექსპორტისთვის
        </p>
      </div>

      <div className="workspace-grid">
        {/* Left Sidebar: Create New Project & Studio Configuration Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <form
            className="luxury-panel"
            style={{ padding: '1.5rem' }}
            onSubmit={handleCreateProject}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              <FolderPlus size={19} color="var(--color-gold)" />
              <h3 style={{ fontSize: '1.12rem' }}>ახალი პროექტის შექმნა</h3>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-proj-name">
                პროექტის დასახელება
              </label>
              <input
                id="new-proj-name"
                type="text"
                className="form-input"
                placeholder="მაგ: კოლხური საგანძურის დასტა..."
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-proj-desc">
                აღწერა
              </label>
              <textarea
                id="new-proj-desc"
                className="form-textarea"
                rows={2}
                placeholder="მოკლე აღწერა პროექტის კონცეფციის შესახებ..."
                value={newProjDesc}
                onChange={(e) => setNewProjDesc(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-proj-style">
                დიზაინის თემა / სტილი
              </label>
              <select
                id="new-proj-style"
                className="form-select"
                value={newProjStyle}
                onChange={(e) => setNewProjStyle(e.target.value)}
              >
                {ILLUSTRATION_STYLES.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.nameKa}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-proj-palette">
                ფერთა პალიტრა
              </label>
              <select
                id="new-proj-palette"
                className="form-select"
                value={newProjPalette}
                onChange={(e) => setNewProjPalette(e.target.value)}
              >
                {COLOR_PALETTES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nameKa}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <FolderPlus size={17} />
              <span>პროექტის შექმნა</span>
            </button>
          </form>

          {/* Studio Environment & Account Status */}
          <div className="luxury-panel" style={{ padding: '1.4rem', fontSize: '0.86rem' }}>
            <h4
              style={{
                fontSize: '1rem',
                color: 'var(--color-gold)',
                marginBottom: '0.75rem',
              }}
            >
              სტუდიისა და გარემოს პარამეტრები
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-stone)' }}>სამუშაო რეჟიმი:</span>
                <strong>
                  {systemStatus?.geminiConfigured
                    ? 'Gemini Live API'
                    : 'ლოკალური სტუდიის სესია'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-stone)' }}>აქტიური მოდელი:</span>
                <strong>{systemStatus?.activeModel || 'gemini-nano-banana-2.1'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-stone)' }}>მონაცემთა ბაზა:</span>
                <strong>PostgreSQL ({systemStatus?.databaseMode || 'active'})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-stone)' }}>დასტის მაქს. ზომა:</span>
                <strong>{systemStatus?.maxDeckSize || 54} კარტი</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: List of Projects with Inline Rename, Theme Change, Resume & Saved Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {projects.map((proj) => {
            const projCards = cards.filter((c) => c.projectId === proj.id);
            const isEditing = editingProjId === proj.id;
            const isExpanded = expandedProjId === proj.id;

            return (
              <div key={proj.id} className="luxury-panel" style={{ padding: '1.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '250px' }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                        marginBottom: '0.45rem',
                      }}
                    >
                      <span
                        className={`badge ${
                          proj.isDemo ? 'badge-demo' : 'badge-gold'
                        }`}
                      >
                        {proj.isDemo ? 'დემო კოლექცია' : 'სამომხმარებლო პროექტი'}
                      </span>
                      <span className="badge badge-wine">
                        {projCards.length} კარტი
                      </span>
                      {proj.status === 'incomplete' && (
                        <span className="badge badge-gold">დაუსრულებელი გენერაცია</span>
                      )}
                    </div>

                    {isEditing ? (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '0.75rem',
                          marginTop: '0.6rem',
                          marginBottom: '0.6rem',
                        }}
                      >
                        <input
                          type="text"
                          className="form-input"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          aria-label="პროექტის ახალი სახელი"
                        />
                        <select
                          className="form-select"
                          value={editThemeStyle}
                          onChange={(e) => setEditThemeStyle(e.target.value)}
                          aria-label="დიზაინის თემა"
                        >
                          {ILLUSTRATION_STYLES.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.nameKa}
                            </option>
                          ))}
                        </select>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleSaveProjectEdit(proj)}
                          >
                            <Check size={14} />
                            <span>შენახვა</span>
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setEditingProjId(null)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                          {proj.name}
                        </h3>
                        <p style={{ fontSize: '0.86rem', color: 'var(--color-stone)' }}>
                          {proj.description}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleStartEditProject(proj)}
                      title="სახელისა და დიზაინის თემის შეცვლა"
                    >
                      <Edit3 size={14} />
                      <span>შეცვლა</span>
                    </button>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDuplicate(proj.id)}
                      title="პროექტის დუბლირება"
                    >
                      <Copy size={14} />
                      <span>ასლი</span>
                    </button>

                    {proj.activeJobId && proj.status === 'incomplete' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() =>
                          navigate(`/generator?mode=deck&jobId=${proj.activeJobId}`)
                        }
                      >
                        <Play size={14} />
                        <span>გენერაციის გაგრძელება</span>
                      </button>
                    )}

                    <button
                      className="btn btn-gold btn-sm"
                      onClick={() => navigate(`/export?projectId=${proj.id}`)}
                    >
                      <Download size={14} />
                      <span>ექსპორტი</span>
                    </button>

                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setProjectToDelete(proj)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Toggle Saved Cards View */}
                <div
                  style={{
                    marginTop: '1rem',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid rgba(198,161,91,0.16)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-stone)' }}>
                    დიზაინის თემა:{' '}
                    {ILLUSTRATION_STYLES.find(
                      (s) => s.id === proj.deckConfig?.illustrationStyle
                    )?.nameKa || 'ტიხრული მინანქარი'}
                  </span>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      setExpandedProjId(isExpanded ? null : proj.id)
                    }
                  >
                    <CreditCard size={14} />
                    <span>
                      {isExpanded
                        ? 'კარტების დამალვა'
                        : `შენახული კარტების ნახვა (${projCards.length})`}
                    </span>
                  </button>
                </div>

                {/* Expanded Saved Cards Grid */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '1.25rem',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
                      gap: '1rem',
                    }}
                  >
                    {projCards.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-stone)' }}>
                        ამ პროექტში ჯერ კარტები არ არის.
                      </p>
                    ) : (
                      projCards.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            padding: '0.75rem',
                            background: 'rgba(15,13,14,0.65)',
                            border: 'var(--border-gold-thin)',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            onSelectCardForEdit(c);
                            navigate('/editor');
                          }}
                        >
                          <CardRenderer
                            id={`proj-card-${c.id}`}
                            rank={c.rank}
                            suit={c.suit}
                            illustrationUrl={c.illustrationUrl}
                            designSpec={c.designSpec}
                            titleKa={c.titleKa}
                            scale={0.5}
                          />
                          <div
                            style={{
                              marginTop: '0.5rem',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              textAlign: 'center',
                            }}
                          >
                            {c.titleKa}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Project Confirmation Modal */}
      {projectToDelete && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>
              პროექტის წაშლა
            </h3>
            <p style={{ color: 'var(--color-ivory-muted)', marginBottom: '1.5rem' }}>
              დარწმუნებული ხართ, რომ გსურთ წაშალოთ პროექტი{' '}
              <strong>„{projectToDelete.name}“</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setProjectToDelete(null)}
              >
                გაუქმება
              </button>
              <button className="btn btn-danger" onClick={handleConfirmDelete}>
                <Trash2 size={16} />
                <span>წაშლა</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
