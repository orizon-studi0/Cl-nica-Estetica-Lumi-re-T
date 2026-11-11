/**
 * Image helpers for local static asset mapping and fallback configuration
 */

export interface ImageFallbackConfig {
  icon: string;
  label: string;
  path: string;
}

export const CLINIC_IMAGES: Record<string, ImageFallbackConfig> = {
  recepcao: {
    icon: 'reception',
    label: 'Recepção Lumière',
    path: 'imagens/recepcao.jpg'
  },
  espera: {
    icon: 'sofa',
    label: 'Lounge de Espera',
    path: 'imagens/espera.jpg'
  },
  procedimentos: {
    icon: 'maca',
    label: 'Sala de Procedimentos',
    path: 'imagens/procedimentos.jpg'
  },
  consultorio: {
    icon: 'mesa',
    label: 'Consultório de Avaliação',
    path: 'imagens/consultorio.jpg'
  },
  dermocosmeticos: {
    icon: 'frasco',
    label: 'Linha de Dermocosméticos',
    path: 'imagens/dermocosmeticos.jpg'
  },
  circulacao: {
    icon: 'porta',
    label: 'Circulação & Arquitetura',
    path: 'imagens/circulacao.jpg'
  }
};

export function isValidImagePath(path: string): boolean {
  return typeof path === 'string' && path.startsWith('imagens/') && path.endsWith('.jpg');
}

export function getImageFallback(name: string): ImageFallbackConfig | undefined {
  return CLINIC_IMAGES[name];
}
