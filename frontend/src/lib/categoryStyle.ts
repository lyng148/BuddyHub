const CATEGORY_STYLES: Record<string, { bg: string; color: string }> = {
  'Ăn uống': { bg: '#fff0e6', color: '#e05d28' },
  'Học nhóm': { bg: '#e8f2ff', color: '#2b6cb0' },
  'Board Games': { bg: '#f3ecff', color: '#7c4dbd' },
  'Thể thao': { bg: '#e7faf6', color: '#159096' },
  'Giao lưu': { bg: '#fff8e8', color: '#b7791f' },
  'Giao lưu・tự học': { bg: '#fff8e8', color: '#b7791f' },
  Khác: { bg: '#f4f5f7', color: '#5d6271' },
}

const DEFAULT_STYLE = { bg: '#fff0e6', color: '#e05d28' }

export function getCategoryStyle(categoryName: string) {
  return CATEGORY_STYLES[categoryName] ?? DEFAULT_STYLE
}
