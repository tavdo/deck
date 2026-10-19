import axios from 'axios';
import {
  CardDesignSpec,
  DeckConfig,
  FullDeckGenerateRequest,
  GenerationJob,
  PlayingCard,
  Project,
  SingleCardGenerateRequest,
} from '../../shared/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

export interface SystemStatusResponse {
  status: string;
  geminiConfigured: boolean;
  activeModel: string;
  supportedModels: Array<{
    id: string;
    nameKa: string;
    descriptionKa: string;
    estimatedCostPerImageUsd: number;
  }>;
  storageDriver: string;
  databaseMode: string;
  maxDeckSize: number;
  dailyLimit: number;
}

export const apiClient = {
  async getStatus(): Promise<SystemStatusResponse> {
    const { data } = await api.get<SystemStatusResponse>('/status');
    return data;
  },

  async listProjects(): Promise<Project[]> {
    const { data } = await api.get<{ projects: Project[] }>('/projects');
    return data.projects;
  },

  async getProject(projectId: string): Promise<{
    project: Project;
    cards: PlayingCard[];
    activeJob: GenerationJob | null;
  }> {
    const { data } = await api.get(`/projects/${projectId}`);
    return data;
  },

  async createProject(payload: {
    name: string;
    description?: string;
    deckConfig?: DeckConfig;
  }): Promise<Project> {
    const { data } = await api.post<{ project: Project }>('/projects', payload);
    return data.project;
  },

  async updateProject(
    projectId: string,
    payload: {
      name?: string;
      description?: string;
      deckConfig?: Partial<DeckConfig>;
    }
  ): Promise<Project> {
    const { data } = await api.patch<{ project: Project }>(`/projects/${projectId}`, payload);
    return data.project;
  },

  async duplicateProject(projectId: string): Promise<Project> {
    const { data } = await api.post<{ project: Project }>(`/projects/${projectId}/duplicate`);
    return data.project;
  },

  async deleteProject(projectId: string): Promise<void> {
    await api.delete(`/projects/${projectId}`);
  },

  async listCards(params?: {
    projectId?: string;
    style?: string;
    favorite?: boolean;
    search?: string;
  }): Promise<PlayingCard[]> {
    const { data } = await api.get<{ cards: PlayingCard[] }>('/cards', { params });
    return data.cards;
  },

  async getCard(cardId: string): Promise<PlayingCard> {
    const { data } = await api.get<{ card: PlayingCard }>(`/cards/${cardId}`);
    return data.card;
  },

  async generateSingleCard(payload: SingleCardGenerateRequest): Promise<{
    card: PlayingCard;
    generationMetadata: any;
  }> {
    const { data } = await api.post('/cards/generate', payload);
    return data;
  },

  async regenerateCard(
    cardId: string,
    payload?: {
      subjectDescription?: string;
      customPrompt?: string;
      illustrationStyle?: string;
      paletteId?: string;
      ornamentMotif?: 'vine' | 'geometric' | 'arch' | 'manuscript';
      complexityLevel?: 'minimal' | 'balanced' | 'royal-intricate';
      modelId?: string;
      noteKa?: string;
    }
  ): Promise<{ card: PlayingCard; generationMetadata: any }> {
    const { data } = await api.post(`/cards/${cardId}/regenerate`, payload || {});
    return data;
  },

  async updateCard(
    cardId: string,
    payload: {
      titleKa?: string;
      subjectDescription?: string;
      isFavorite?: boolean;
      illustrationUrl?: string;
      designSpec?: Partial<CardDesignSpec>;
    }
  ): Promise<PlayingCard> {
    const { data } = await api.patch<{ card: PlayingCard }>(`/cards/${cardId}`, payload);
    return data.card;
  },

  async estimateDeckCost(deckConfig: DeckConfig): Promise<{
    cardCount: number;
    estimate: {
      perCardUsd: number;
      totalUsd: number;
      modelNameKa: string;
      resolutionMultiplier: number;
    };
  }> {
    const { data } = await api.post('/decks/estimate', deckConfig);
    return data;
  },

  async generateCompleteDeck(payload: FullDeckGenerateRequest): Promise<{
    project: Project;
    job: GenerationJob;
    cards: PlayingCard[];
  }> {
    const { data } = await api.post('/decks/generate', payload);
    return data;
  },

  async getGenerationJob(jobId: string): Promise<{
    job: GenerationJob;
    project: Project;
    cards: PlayingCard[];
  }> {
    const { data } = await api.get(`/generation-jobs/${jobId}`);
    return data;
  },

  async retryGenerationJob(jobId: string): Promise<{
    job: GenerationJob;
    cards: PlayingCard[];
  }> {
    const { data } = await api.post(`/generation-jobs/${jobId}/retry`);
    return data;
  },

  async cancelOrPauseGenerationJob(
    jobId: string,
    mode: 'cancel' | 'pause' = 'cancel'
  ): Promise<{
    job: GenerationJob;
    cards: PlayingCard[];
  }> {
    const { data } = await api.post(`/generation-jobs/${jobId}/cancel`, { mode });
    return data;
  },

  getPdfExportUrl(
    projectId: string,
    options: {
      layout: 'print-sheet' | 'one-per-page';
      pageSize: 'A4' | 'LETTER' | 'SRA3';
      cardWidthMm: number;
      cardHeightMm: number;
      bleedMm: number;
      safeMarginMm: number;
      cropMarks: boolean;
      cardBack: boolean;
    }
  ): string {
    const q = new URLSearchParams({
      format: 'pdf',
      layout: options.layout,
      pageSize: options.pageSize,
      cardWidthMm: String(options.cardWidthMm),
      cardHeightMm: String(options.cardHeightMm),
      bleedMm: String(options.bleedMm),
      safeMarginMm: String(options.safeMarginMm),
      cropMarks: String(options.cropMarks),
      cardBack: String(options.cardBack),
    });
    return `/api/projects/${projectId}/export?${q.toString()}`;
  },
};
