/**
 * Configurações de Allowlist para Presets de Restrição
 * 
 * Esta estrutura facilita a manutenção futura. Para adicionar novas missões autorizadas,
 * basta incluí-las nos arrays correspondentes.
 */
export const EVENTUAL_INSTRUCTOR_ALLOWLIST = {
  // Curso de Piloto Privado
  PPA: {
    keywords: ['PPA', 'PRIVADO'],
    authorizedMissions: [
      'PS01', 'PS02', 'PS03', 'PS07', 'PS08', 'PS13', 
      'AP01', 'AP02', 'AP03', 'AP05', 
      'NOT01', 'NAV01', 'NAV03', 'NAV04', 'NAV05'
    ]
  },
  
  // Curso de Piloto Comercial
  PCA: {
    keywords: ['PCA', 'COMERCIAL'],
    authorizedMissions: ['AD01', 'AP01', 'NAV', 'NOT01'],
    excludedMissions: ['NAV X1', 'NAV X2'] // Exceções específicas para PCA
  },
  
  // Curso de Instrutor de Voo / CFI
  INVA_CFI: {
    keywords: ['INVA', 'INSTRUTOR DE VOO', 'CFI', 'FORMAÇÃO DE INSTRUTOR'],
    authorizedMissions: [] // Nenhuma missão autorizada (restringir todas)
  },
  
  // Aperfeiçoamento Contínuo
  APERFEICOAMENTO: {
    keywords: ['APERFEIÇOAMENTO', 'CONTÍNUO'],
    isAllAuthorized: true,
    evaluationKeywords: ['AVAL', 'CHEQUE', 'EXAME', 'TESTE'] // Restringir missões de avaliação
  },
  
  // Voos Administrativos
  ADMIN: {
    keywords: ['ADMIN', 'ADMINISTRATIVOS'],
    authorizedMissions: ['INCENTIVO'] // Apenas Voo de Incentivo
  }
};

/**
 * Códigos de Missões para Presets de Aeronave
 */
export const AIRCRAFT_PRESET_CODES = {
  // Preset Somente Diurna: Missões proibidas (Noturnas)
  DIURNA_ONLY_RESTRICTED: [
    'NOT01', 'NOT02', 'NOT 01', 'NOT 02', 'NOT 03'
  ],

  // Preset VFR Only (Não IFR): Missões proibidas (IFR)
  VFR_ONLY_RESTRICTED: [
    'IFR 01 - MANOBRAS BÁSICAS', 'IFR 02 - MANOBRAS BÁSICAS', 'IFR 03 - MANOBRAS BÁSICAS',
    'IFR 04 - NAVEGAÇÃO E PROCEDIMENTOS', 'IFR 05 - NAVEGAÇÃO E PROCEDIMENTOS', 'IFR 06 - NAVEGAÇÃO E PROCEDIMENTOS', 'IFR 07 - NAVEGAÇÃO E PROCEDIMENTOS', 'IFR 08 - NAVEGAÇÃO E PROCEDIMENTOS', 'IFR 09 - NAVEGAÇÃO E PROCEDIMENTOS',
    'IFR 10 - NAVEGAÇÃO'
  ]
};
