/**
 * Image helpers for local static asset mapping and Plan B fallback configuration
 */

export interface ImageFallbackConfig {
  label: string;
  path: string;
}

export const CLINIC_IMAGES: Record<string, ImageFallbackConfig> = {
  recepcao: {
    label: 'Recepção',
    path: 'images/recepcao.jpg'
  },
  espera: {
    label: 'Lounge de Espera',
    path: 'images/espera.jpg'
  },
  procedimentos: {
    label: 'Sala de Procedimentos',
    path: 'images/procedimentos.jpg'
  },
  consultorio: {
    label: 'Consultório de Avaliação',
    path: 'images/consultorio.jpg'
  },
  dermocosmeticos: {
    label: 'Linha de Dermocosméticos',
    path: 'images/dermocosmeticos.jpg'
  },
  circulacao: {
    label: 'Circulação & Arquitetura',
    path: 'images/circulacao.jpg'
  }
};

export function isValidImagePath(path: string): boolean {
  return typeof path === 'string' && path.startsWith('images/') && path.endsWith('.jpg');
}

export function getImageFallback(name: string): ImageFallbackConfig | undefined {
  return CLINIC_IMAGES[name];
}
