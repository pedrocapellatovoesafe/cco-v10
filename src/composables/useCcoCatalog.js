import api from '../services/api'

/**
 * Composable for managing catalog entities (Invas, Bars, Students, etc.)
 */
export function useCcoCatalog({ state, refs }) {
  const { 
    INVAS, ALUNOS, MODELOS, MISSOES, RESTRICTS, STATUSES, 
    BASES, SITUACOES, CURSOS, BARRAS, AERONAVES 
  } = refs

  // --- INVAS ---
  function fetchInvas() {
    const mes = `${state.calendarYear}-${String(state.calendarMonthIdx + 1).padStart(2, '0')}`
    return api.get(`/invas?mes=${mes}`)
      .then(response => {
        INVAS.value = response.data?.data || response.data || []
        return true
      })
      .catch(error => {
        console.error('Error fetching invas:', error)
        return false
      })
  }

  async function saveInva(p) {
    state.globalLoading = true
    try {
      const r = await api.post('/invas', p)
      await fetchInvas()
      return { success: true, data: r.data }
    } catch (e) {
      return { success: false, error: e.response?.data?.message || e.message }
    } finally {
      state.globalLoading = false
    }
  }

  async function updateInva(id, p) {
    state.globalLoading = true
    try {
      const r = await api.put(`/invas/${id}`, p)
      await fetchInvas()
      return { success: true, data: r.data }
    } catch (e) {
      return { success: false, error: e.response?.data?.message || e.message }
    } finally {
      state.globalLoading = false
    }
  }

  async function deleteInva(id) {
    state.globalLoading = true
    try {
      await api.delete(`/invas/${id}`)
      await fetchInvas()
      return { success: true }
    } catch (e) {
      return { success: false, error: e.response?.data?.message || e.message }
    } finally {
      state.globalLoading = false
    }
  }

  // --- BARRAS ---
  function fetchBars() { 
    return api.get('/barras?includeInactive=1').then(r => { BARRAS.value = r.data?.data || r.data; return true }) 
  }
  
  function fetchBarDetail(id) { 
    return api.get(`/barras/${id}?includeInactive=1`).then(r => r.data?.data || r.data) 
  }

  async function saveBarra(p) {
    state.globalLoading = true
    try {
      const r = await api.post('/barras', p)
      await fetchBars()
      return { success: true, data: r.data?.data || r.data }
    } catch (e) {
      return { success: false, error: e.response?.data?.message || e.message }
    } finally {
      state.globalLoading = false
    }
  }

  async function updateBarra(id, p) {
    state.globalLoading = true
    try {
      const r = await api.put(`/barras/${id}`, p)
      await fetchBars()
      return { success: true, data: r.data?.data || r.data }
    } catch (e) {
      return { success: false, error: e.response?.data?.message || e.message }
    } finally {
      state.globalLoading = false
    }
  }

  async function deleteBarra(id) {
    state.globalLoading = true
    try {
      await api.delete(`/barras/${id}`)
      await fetchBars()
      return { success: true }
    } catch (e) {
      return { success: false, error: e.response?.data?.message || e.message }
    } finally {
      state.globalLoading = false
    }
  }

  // --- HORARIOS ---
  async function saveHorario(p) {
    state.globalLoading = true
    try {
      const r = await api.post('/barras-horarios', p)
      await fetchBars()
      return { success: true, data: r.data }
    } catch (e) {
      return { success: false, error: e.response?.data?.message || e.message }
    } finally {
      state.globalLoading = false
    }
  }

  async function updateHorario(id, p) {
    state.globalLoading = true
    try {
      const r = await api.put(`/barras-horarios/${id}`, p)
      await fetchBars()
      return { success: true, data: r.data }
    } catch (e) {
      return { success: false, error: e.response?.data?.message || e.message }
    } finally {
      state.globalLoading = false
    }
  }

  async function deleteHorario(id) {
    state.globalLoading = true
    try {
      await api.delete(`/barras-horarios/${id}`)
      await fetchBars()
      return { success: true }
    } catch (e) {
      return { success: false, error: e.response?.data?.message || e.message }
    } finally {
      state.globalLoading = false
    }
  }

  // --- ALUNOS ---
  function fetchAlunos() {
    return api.get('/alunos').then(r => { ALUNOS.value = r.data?.data || r.data; return true })
  }

  // --- MODELOS ---
  function fetchModelos() {
    return api.get('/modelo-aeronaves').then(r => { MODELOS.value = r.data?.data || r.data; return true })
  }

  // --- MISSOES ---
  function fetchMissoes() { 
    return api.get('/missoes').then(r => { MISSOES.value = r.data?.data || r.data; return true }) 
  }

  async function saveMissao(p) {
    state.globalLoading = true
    try {
      const r = await api.post('/missoes', p)
      await fetchCursos() 
      await fetchMissoes()
      return { success: true, data: r.data?.data || r.data }
    } catch (e) {
      return { success: false, error: e.response?.data?.message || e.message }
    } finally {
      state.globalLoading = false
    }
  }

  async function updateMissao(id, p) {
    state.globalLoading = true
    try {
      const r = await api.put(`/missoes/${id}`, p)
      await fetchCursos()
      await fetchMissoes()
      return { success: true, data: r.data?.data || r.data }
    } catch (e) {
      return { success: false, error: e.response?.data?.message || e.message }
    } finally {
      state.globalLoading = false
    }
  }

  async function deleteMissao(id) {
    state.globalLoading = true
    try {
      await api.delete(`/missoes/${id}`)
      await fetchCursos()
      await fetchMissoes()
      return { success: true }
    } catch (e) {
      return { success: false, error: e.response?.data?.message || e.message }
    } finally {
      state.globalLoading = false
    }
  }

  // --- CURSOS ---
  function fetchCursos() { 
    return api.get('/cursos').then(r => { CURSOS.value = r.data?.data || r.data; return true }) 
  }

  async function saveCurso(p) {
    state.globalLoading = true
    try {
      const r = await api.post('/cursos', p)
      await fetchCursos()
      return { success: true, data: r.data?.data || r.data }
    } catch (e) {
      return { success: false, error: e.response?.data?.message || e.message }
    } finally {
      state.globalLoading = false
    }
  }

  async function updateCurso(id, p) {
    state.globalLoading = true
    try {
      const r = await api.put(`/cursos/${id}`, p)
      await fetchCursos()
      return { success: true, data: r.data?.data || r.data }
    } catch (e) {
      return { success: false, error: e.response?.data?.message || e.message }
    } finally {
      state.globalLoading = false
    }
  }

  async function deleteCurso(id) {
    state.globalLoading = true
    try {
      await api.delete(`/cursos/${id}`)
      await fetchCursos()
      return { success: true }
    } catch (e) {
      return { success: false, error: e.response?.data?.message || e.message }
    } finally {
      state.globalLoading = false
    }
  }

  // --- RESTRICOES ---
  function fetchRestricoes() {
    return api.get('/restricoes').then(r => { RESTRICTS.value = r.data?.data || r.data; return true })
  }

  async function saveRestriction(p) {
    state.globalLoading = true
    try {
      const r = await api.post('/restricoes', p)
      await fetchRestricoes()
      return { success: true, data: r.data }
    } catch (e) {
      return { success: false, error: e.response?.data?.message || e.message }
    } finally {
      state.globalLoading = false
    }
  }

  async function importRestrictions(restricoes) {
    state.globalLoading = true
    try {
      const r = await api.post('/restricoes/import', { restricoes })
      await fetchRestricoes()
      return { success: true, data: r.data }
    } catch (e) {
      return { success: false, error: e.response?.data?.message || e.message }
    } finally {
      state.globalLoading = false
    }
  }

  async function updateRestriction(id, p) {
    state.globalLoading = true
    try {
      const r = await api.put(`/restricoes/${id}`, p)
      await fetchRestricoes()
      return { success: true, data: r.data }
    } catch (e) {
      return { success: false, error: e.response?.data?.message || e.message }
    } finally {
      state.globalLoading = false
    }
  }

  async function deleteRestriction(id) {
    state.globalLoading = true
    try {
      await api.delete(`/restricoes/${id}`)
      await fetchRestricoes()
      return { success: true }
    } catch (e) {
      return { success: false, error: e.message }
    } finally {
      state.globalLoading = false
    }
  }

  async function bulkDeleteRestrictions(ids) {
    state.globalLoading = true
    try {
      const r = await api.post('/restricoes/bulk-delete', { ids })
      await fetchRestricoes()
      return { success: true, data: r.data }
    } catch (e) {
      return { success: false, error: e.response?.data?.message || e.message }
    } finally {
      state.globalLoading = false
    }
  }

  // --- AERONAVES ---
  function fetchAeronaves() {
    return api.get('/aeronaves').then(r => { 
      AERONAVES.value = r.data?.data || r.data; 
      return true 
    })
  }

  async function updateAeronave(id, p) {
    state.globalLoading = true
    try {
      const r = await api.put(`/aeronaves/${id}`, p)
      await fetchAeronaves()
      return { success: true, data: r.data }
    } catch (e) {
      return { success: false, error: e.response?.data?.message || e.message }
    } finally {
      state.globalLoading = false
    }
  }

  // --- BASE LISTS ---
  function fetchBases() { return api.get('/bases').then(r => { BASES.value = r.data?.data || r.data; return true }) }
  function fetchSituacoes() { return api.get('/situacao-invas').then(r => { SITUACOES.value = r.data?.data || r.data; return true }) }
  function fetchStatuses() { 
    return api.get('/status-slots').then(r => { 
      STATUSES.value = r.data?.data || r.data; 
      return true 
    }) 
  }

  // --- AVAILABILITY (ESCALA TRABALHO) ---
  async function saveAvailability(p) { 
    state.globalLoading = true
    try { 
      const r = await api.post('/escala-trabalhos', p)
      await fetchInvas()
      return { success: true, data: r.data } 
    } catch (e) { 
      return { success: false, error: e.response?.data?.message || e.message } 
    } finally { 
      state.globalLoading = false 
    } 
  }
  
  async function updateAvailability(id, p) { 
    state.globalLoading = true
    try { 
      const r = await api.put(`/escala-trabalhos/${id}`, p)
      await fetchInvas()
      return { success: true, data: r.data } 
    } catch (e) { 
      return { success: false, error: e.response?.data?.message || e.message } 
    } finally { 
      state.globalLoading = false 
    } 
  }

  async function saveInvaBarra(p) {
    state.globalLoading = true
    try {
      const r = await api.post('/inva-barras', p)
      return { success: true, data: r.data?.data || r.data }
    } catch (e) {
      return { success: false, error: e.response?.data?.message || e.message }
    } finally {
      state.globalLoading = false
    }
  }

  async function deleteInvaBarra(id) {
    state.globalLoading = true
    try {
      const r = await api.delete(`/inva-barras/${id}`)
      return { success: true, data: r.data }
    } catch (e) {
      return { success: false, error: e.response?.data?.message || e.message }
    } finally {
      state.globalLoading = false
    }
  }

  async function fetchInvaBarras() {
    try {
      const r = await api.get('/inva-barras')
      return r.data?.data || r.data || []
    } catch (e) {
      console.error('Error fetching inva-barras:', e)
      return []
    }
  }

  return {
    fetchInvas, saveInva, updateInva, deleteInva,
    fetchBars, fetchBarDetail, saveBarra, updateBarra, deleteBarra,
    saveHorario, updateHorario, deleteHorario,
    fetchAlunos, fetchModelos, fetchMissoes, saveMissao, updateMissao, deleteMissao,
    fetchCursos, saveCurso, updateCurso, deleteCurso,
    fetchRestricoes, saveRestriction, importRestrictions, updateRestriction, deleteRestriction, bulkDeleteRestrictions,
    fetchAeronaves, updateAeronave,
    fetchBases, fetchSituacoes, fetchStatuses,
    saveAvailability, updateAvailability,
    saveInvaBarra, deleteInvaBarra, fetchInvaBarras
  }
}
