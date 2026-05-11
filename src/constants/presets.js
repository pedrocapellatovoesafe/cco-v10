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
