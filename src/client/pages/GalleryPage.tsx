import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Heart,
  Sliders,
  Eye,
  Copy,
  Trash2,
  X,
  Sparkles,
  Filter,
} from 'lucide-react';
import { CardRenderer } from '../components/CardRenderer';
import {
  ILLUSTRATION_STYLES,
  PlayingCard,
  Project,
  SUIT_METADATA,
} from '../../shared/types';
import { apiClient } from '../services/apiClient';

export const GalleryPage: React.FC<{
  projects: Project[];
  cards: PlayingCard[];
  onCardUpdated: (card: PlayingCard) => void;
  onSelectCardForEdit: (card: PlayingCard) => void;
  onProjectsChanged: () => void;
  notify: (text: string, type?: 'info' | 'success' | 'error') => void;
}> = ({
  projects,
  cards,
  onCardUpdated,
  onSelectCardForEdit,
  onProjectsChanged,
  notify,
}) => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [originFilter, setOriginFilter] = useState<'all' | 'ai' | 'demo'>('all');

  const [detailCard, setDetailCard] = useState<PlayingCard | null>(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState<Project | null>(
    null
  );

  const filteredCards = cards.filter((card) => {
    if (selectedProjectId !== 'all' && card.projectId !== selectedProjectId) {
      return false;
    }
    if (selectedStyle !== 'all' && card.illustrationStyle !== selectedStyle) {
      return false;
    }
    if (onlyFavorites && !card.isFavorite) {
      return false;
    }
    if (originFilter === 'ai' && card.isDemo) {
      return false;
    }
    if (originFilter === 'demo' && !card.isDemo) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        card.titleKa.toLowerCase().includes(q) ||
        card.subjectDescription.toLowerCase().includes(q) ||
        card.rank.toLowerCase().includes(q) ||
        card.suit.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleToggleFavorite = async (card: PlayingCard) => {
    try {
      const updated = await apiClient.updateCard(card.id, {
        isFavorite: !card.isFavorite,
      });
      onCardUpdated(updated);
      if (detailCard?.id === updated.id) {
        setDetailCard(updated);
      }
      notify(
        updated.isFavorite
          ? 'დაემატა რჩეულ კარტებში.'
          : 'ამოღებულია რჩეულებიდან.',
        'info'
      );
    } catch {
      notify('რჩეულის სტატუსის შეცვლა ვერ მოხერხდა.', 'error');
    }
  };

  const handleDuplicateProject = async (projectId: string) => {
    try {
      await apiClient.duplicateProject(projectId);
      onProjectsChanged();
      notify('პროექტი და მისი კარტები წარმატებით დუბლირდა.', 'success');
    } catch {
      notify('პროექტის დუბლირება ვერ მოხერხდა.', 'error');
    }
  };

  const handleConfirmedDeleteProject = async () => {
    if (!confirmDeleteProject) return;
    try {
      await apiClient.deleteProject(confirmDeleteProject.id);
      setConfirmDeleteProject(null);
      if (selectedProjectId === confirmDeleteProject.id) {
        setSelectedProjectId('all');
      }
      onProjectsChanged();
      notify('პროექტი წაიშალა.', 'info');
    } catch {
      notify('პროექტის წაშლა ვერ მოხერხდა.', 'error');
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2.25rem' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>
            ბანქოს გალერეა და კოლექციები
          </h1>
          <p style={{ color: 'var(--color-stone)', fontSize: '0.9rem' }}>
            დაათვალიერეთ შენახული პროექტები, სადემონსტრაციო ნიმუშები და Gemini AI-ით შექმნილი კარტები
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => navigate('/generator')}>
          <Sparkles size={17} />
          <span>ახალი კარტის შექმნა</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="luxury-panel"
        style={{
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          alignItems: 'end',
        }}
      >
        {/* Search Input */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">ძიება დასახელებით ან თემით</label>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              color="var(--color-stone)"
              style={{ position: 'absolute', left: '0.75rem', top: '0.78rem' }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.3rem' }}
              placeholder="მაგ: მეფე, თამარი, ვაზი..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Project Filter */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">პროექტი / დასტა</label>
          <select
            className="form-select"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="all">ყველა პროექტი ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.isDemo ? '(დემო)' : '(AI)'}
              </option>
            ))}
          </select>
        </div>

        {/* Style Filter */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">მხატვრული სტილი</label>
          <select
            className="form-select"
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
          >
            <option value="all">ყველა სტილი</option>
            {ILLUSTRATION_STYLES.map((st) => (
              <option key={st.id} value={st.id}>
                {st.nameKa}
              </option>
            ))}
          </select>
        </div>

        {/* Origin Filter (AI vs Demo) & Favorite Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            style={{ flex: 1 }}
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value as any)}
            aria-label="წყაროს ფილტრი"
          >
            <option value="all">ყველა წყარო</option>
            <option value="ai">მხოლოდ AI გენერირებული</option>
            <option value="demo">მხოლოდ დემო ნიმუშები</option>
          </select>

          <button
            className={`btn ${onlyFavorites ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setOnlyFavorites((f) => !f)}
            title="მხოლოდ რჩეული კარტები"
          >
            <Heart
              size={16}
              fill={onlyFavorites ? 'var(--color-gold)' : 'none'}
            />
            <span>რჩეულები</span>
          </button>
        </div>
      </div>

      {/* Selected Project Quick Actions Strip */}
      {selectedProjectId !== 'all' && (
        <div
          className="luxury-panel"
          style={{
            padding: '1rem 1.35rem',
            marginBottom: '1.75rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          {(() => {
            const proj = projects.find((p) => p.id === selectedProjectId);
            if (!proj) return null;
            return (
              <>
                <div>
                  <span
                    className={`badge ${proj.isDemo ? 'badge-demo' : 'badge-gold'}`}
                    style={{ marginBottom: '0.3rem' }}
                  >
                    {proj.isDemo ? 'სადემონსტრაციო პროექტი' : 'სამომხმარებლო პროექტი'}
                  </span>
                  <h3 style={{ fontSize: '1.15rem' }}>{proj.name}</h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--color-stone)' }}>
                    {proj.description}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDuplicateProject(proj.id)}
                  >
                    <Copy size={14} />
                    <span>პროექტის დუბლირება</span>
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setConfirmDeleteProject(proj)}
                  >
                    <Trash2 size={14} />
                    <span>პროექტის წაშლა</span>
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <div
          className="luxury-panel"
          style={{ padding: '4rem 1.5rem', textAlign: 'center' }}
        >
          <Filter
            size={38}
            color="var(--color-gold)"
            style={{ marginBottom: '0.85rem' }}
          />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>
            კარტები ვერ მოიძებნა
          </h3>
          <p style={{ color: 'var(--color-stone)', marginBottom: '1.25rem' }}>
            შეცვალეთ ძიების პარამეტრები ან შექმენით ახალი კარტი გენერატორში.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedProjectId('all');
              setSelectedStyle('all');
              setOnlyFavorites(false);
              setOriginFilter('all');
            }}
          >
            ფილტრების გასუფთავება
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="luxury-panel card-showcase-item"
              style={{
                padding: '1.15rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{ cursor: 'pointer' }}
                onClick={() => setDetailCard(card)}
              >
                <CardRenderer
                  id={`gal-${card.id}`}
                  rank={card.rank}
                  suit={card.suit}
                  illustrationUrl={card.illustrationUrl}
                  designSpec={card.designSpec}
                  titleKa={card.titleKa}
                  scale={0.7}
                />
              </div>

              <div style={{ width: '100%', marginTop: '0.9rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.35rem',
                  }}
                >
                  <span
                    className={`badge ${
                      card.isDemo ? 'badge-demo' : 'badge-gold'
                    }`}
                  >
                    {card.isDemo ? 'დემო ნიმუში' : 'AI შექმნილი'}
                  </span>

                  <button
                    onClick={() => handleToggleFavorite(card)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: card.isFavorite ? 'var(--color-gold)' : 'var(--color-stone)',
                    }}
                    aria-label="რჩეულებში დამატება"
                  >
                    <Heart
                      size={18}
                      fill={card.isFavorite ? 'var(--color-gold)' : 'none'}
                    />
                  </button>
                </div>

                <h3 style={{ fontSize: '0.96rem', marginBottom: '0.25rem' }}>
                  {card.titleKa}
                </h3>
                <p
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--color-stone)',
                    marginBottom: '0.85rem',
                    minHeight: '2.3rem',
                  }}
                >
                  {card.subjectDescription.slice(0, 75)}
                  {card.subjectDescription.length > 75 ? '…' : ''}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setDetailCard(card)}
                  >
                    <Eye size={14} />
                    <span>დეტალები</span>
                  </button>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      onSelectCardForEdit(card);
                      navigate('/editor');
                    }}
                  >
                    <Sliders size={14} />
                    <span>რედაქტორი</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Card Detail Modal */}
      {detailCard && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <span
                  className={`badge ${
                    detailCard.isDemo ? 'badge-demo' : 'badge-gold'
                  }`}
                >
                  {detailCard.isDemo ? 'სადემონსტრაციო ნიმუში' : 'Gemini AI გენერირებული'}
                </span>
                <h3 style={{ fontSize: '1.35rem', marginTop: '0.3rem' }}>
                  {detailCard.titleKa}
                </h3>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setDetailCard(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <CardRenderer
                  id={`modal-${detailCard.id}`}
                  rank={detailCard.rank}
                  suit={detailCard.suit}
                  illustrationUrl={detailCard.illustrationUrl}
                  designSpec={detailCard.designSpec}
                  titleKa={detailCard.titleKa}
                  scale={0.85}
                />
              </div>

              <div style={{ fontSize: '0.88rem' }}>
                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ color: 'var(--color-gold)', fontWeight: 700 }}>
                    თემატიკა და აღწერა:
                  </div>
                  <p style={{ color: 'var(--color-ivory-muted)', marginTop: '0.25rem' }}>
                    {detailCard.subjectDescription}
                  </p>
                </div>

                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ color: 'var(--color-gold)', fontWeight: 700 }}>
                    ტექნიკური მონაცემები:
                  </div>
                  <p style={{ color: 'var(--color-stone)', marginTop: '0.2rem' }}>
                    მასტი: {SUIT_METADATA[detailCard.suit]?.nameKa} ({detailCard.rank})
                  </p>
                  <p style={{ color: 'var(--color-stone)' }}>
                    მოდელი: {detailCard.modelId}
                  </p>
                  <p style={{ color: 'var(--color-stone)' }}>
                    ფიზიკური ზომა: {detailCard.exportMetadata?.widthMm || 63}×
                    {detailCard.exportMetadata?.heightMm || 88} მმ
                  </p>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ color: 'var(--color-gold)', fontWeight: 700 }}>
                    გამოყენებული Prompt:
                  </div>
                  <div
                    style={{
                      padding: '0.6rem',
                      background: 'rgba(15,13,14,0.85)',
                      borderRadius: 'var(--radius-sm)',
                      border: 'var(--border-gold-thin)',
                      fontSize: '0.76rem',
                      color: 'var(--color-stone)',
                      maxHeight: '100px',
                      overflowY: 'auto',
                      marginTop: '0.3rem',
                    }}
                  >
                    {detailCard.promptUsed}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const target = detailCard;
                      setDetailCard(null);
                      onSelectCardForEdit(target);
                      navigate('/editor');
                    }}
                  >
                    <Sliders size={16} />
                    <span>რედაქტორში გახსნა</span>
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={() => handleToggleFavorite(detailCard)}
                  >
                    <Heart
                      size={16}
                      fill={detailCard.isFavorite ? 'var(--color-gold)' : 'none'}
                    />
                    <span>{detailCard.isFavorite ? 'რჩეულია' : 'რჩეულებში'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {confirmDeleteProject && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>
              პროექტის წაშლის დადასტურება
            </h3>
            <p style={{ color: 'var(--color-ivory-muted)', marginBottom: '1.5rem', fontSize: '0.92rem' }}>
              ნამდვილად გსურთ წაშალოთ პროექტი <strong>„{confirmDeleteProject.name}“</strong> და მასში
              შემავალი ყველა კარტი? ეს მოქმედება შეუქცევადია.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteProject(null)}
              >
                გაუქმება
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmedDeleteProject}
              >
                <Trash2 size={16} />
                <span>დიახ, წაშალე პროექტი</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
