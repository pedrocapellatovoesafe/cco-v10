<template>
  <div class="rest-card list-card">
    <div class="card-header">
      <h3>📋 Regras Ativas</h3>
    </div>
    
    <!-- Filtros de Busca -->
    <div class="list-filters">
      <div class="filter-row">
        <select v-model="filters.type" class="filter-select mini">
          <option value="">Todos os Tipos</option>
          <option value="aluno_inva">Aluno x INVA</option>
          <option value="ae_missao">AE x Missão</option>
          <option value="inva_missao">INVA x Missão</option>
          <option value="mod_missao">Modelo x Missão</option>
          <option value="inva_only">INVA</option>
          <option value="aluno_only">Aluno</option>
        </select>
        
        <select v-model="filters.alunoId" class="filter-select">
          <option :value="null">Todos os Alunos</option>
          <option v-for="a in store.state.ALUNOS" :key="a.id" :value="a.id">{{ a.nome }}</option>
        </select>

        <select v-model="filters.invaId" class="filter-select">
          <option :value="null">Todos os INVAs</option>
          <option v-for="i in store.state.INVAS" :key="i.id" :value="i.id">{{ i.nome }}</option>
        </select>
        
        <button class="btn-clear-filters" @click="clearFilters" title="Limpar Filtros">✕</button>
      </div>
    </div>

    <div class="card-body scrollable">
      <!-- Review de Batch se existir -->
      <div v-if="batchList.length > 0" class="batch-review-area">
        <div class="batch-header">
          <h4>⚠️ Revisão de Lote ({{ batchList.length }} itens)</h4>
          <p>Remova os itens que NÃO deseja restringir antes de salvar.</p>
        </div>
        <div class="batch-items">
          <div v-for="(g, idx) in groupedBatch" :key="idx" class="batch-item">
            <span class="batch-text">
              {{ g.count > 1 ? `[Lote x${g.count}] ` : '' }}
              {{ g.displayNome }}
            </span>
            <button class="btn-remove-batch" @click="$emit('remove-group-from-batch', g)">✕</button>
          </div>
        </div>
        <div class="batch-footer">
          <button class="btn-save-batch" @click="$emit('save-batch')" :disabled="isSavingBatch">
            {{ isSavingBatch ? 'Processando Lote...' : 'Confirmar e Salvar Tudo' }}
          </button>
          <button class="btn-cancel-batch" @click="$emit('cancel-batch')">Cancelar Lote</button>
        </div>
      </div>

      <div v-if="filteredRestricts.length === 0 && batchList.length === 0" class="empty-list">
        Nenhuma restrição encontrada para os filtros selecionados.
      </div>
      <div v-for="r in filteredRestricts" :key="r.id" class="restrict-item">
        <div class="restrict-info">
          <h4>{{ r.nome }}</h4>
          <p class="restrict-obs">{{ r.observacao }}</p>
          <div class="restrict-tags">
            <span v-if="r.is_aluno_inva || r.isAlunoInva" class="tag tag-blue">Aluno x INVA</span>
            <span v-else-if="r.isAeronave && r.isMissao" class="tag tag-orange">AE x Missão</span>
            <span v-else-if="r.isInva && r.isMissao" class="tag tag-purple">INVA x Missão</span>
            <span v-else-if="r.isModelo && r.isMissao" class="tag tag-teal">Modelo x Missão</span>
            <span v-else-if="r.isInva" class="tag tag-gray">INVA</span>
            <span v-else-if="r.isAluno" class="tag tag-gray">Aluno</span>
            <span v-else class="tag tag-gray">Geral</span>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn-edit" @click="$emit('edit', r)" title="Editar">✏️</button>
          <button class="btn-delete" @click="$emit('delete', r.id)" title="Excluir">🗑️</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, inject } from 'vue'

const store = inject('store')
const props = defineProps({
  batchList: { type: Array, default: () => [] },
  isSavingBatch: { type: Boolean, default: false }
})
const emit = defineEmits(['edit', 'delete', 'save-batch', 'cancel-batch', 'remove-group-from-batch'])

const filters = reactive({
  type: '',
  alunoId: null,
  invaId: null
})

const filteredRestricts = computed(() => {
  return store.state.RESTRICTS.filter(r => {
    if (filters.type) {
      if (filters.type === 'aluno_inva' && !(r.isAlunoInva || r.is_aluno_inva)) return false
      if (filters.type === 'ae_missao' && !(r.isAeronave && r.isMissao)) return false
      if (filters.type === 'inva_missao' && !(r.isInva && r.isMissao)) return false
      if (filters.type === 'mod_missao' && !(r.isModelo && r.isMissao)) return false
      if (filters.type === 'inva_only' && !(r.isInva && !r.isMissao && !r.isAlunoInva)) return false
      if (filters.type === 'aluno_only' && !(r.isAluno && !r.isAlunoInva)) return false
    }
    if (filters.alunoId) {
      const rid = r.alunoId || r.aluno_id
      if (rid != filters.alunoId) return false
    }
    if (filters.invaId) {
      const rid = r.inva_id || r.invaId
      if (rid != filters.invaId) return false
    }
    return true
  })
})

const groupedBatch = computed(() => {
  const map = new Map()
  props.batchList.forEach(item => {
    let cleanName = item.nome
      .replace(/^\[Preset\]\s+.*?\s+-\s+Restrição\s+/, '')
      .replace(/^\[Preset ANAC\]\s+.*?\s+-\s+Restrição\s+/, '')
      .replace(/^Restrição automática:\s+Instrutor de Solo\s+\((.*)\)$/, '$1')
      .replace(/^\[Preset AE\]\s+.*?\s+-\s+(.*?)\s+\((.*)\)$/, '$1 ($2)')
    const key = `${item.missaoId || 'no-miss'}-${item.isInva}-${item.isAeronave}-${item.isModelo}-${cleanName}`
    if (!map.has(key)) {
      map.set(key, { ...item, count: 0, displayNome: cleanName })
    }
    map.get(key).count++
  })
  return Array.from(map.values())
})

function clearFilters() {
  filters.type = ''
  filters.alunoId = null
  filters.invaId = null
}
</script>

<style scoped>
.rest-card {
  background: #fff;
  border: 1px solid #dae2ec;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}
.card-header {
  padding: 16px 22px;
  background: #f8fafc;
  border-bottom: 1px solid #dae2ec;
}
.card-header h3 { margin: 0; font-size: 15px; color: #1d2951; font-weight: 800; }
.list-filters {
  padding: 12px 22px;
  background: #f1f5f9;
  border-bottom: 1px solid #dae2ec;
}
.filter-row { display: flex; align-items: center; gap: 8px; }
.filter-select {
  flex: 1; padding: 8px 10px; border: 1px solid #d8dee8; border-radius: 6px;
  font-size: 12px; color: #1d2951; background: #fff; outline: none;
}
.filter-select.mini { flex: 0 0 130px; }
.btn-clear-filters {
  background: #e2e8f0; color: #64748b; border: none; width: 28px; height: 28px;
  border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 12px; transition: all 0.2s;
}
.btn-clear-filters:hover { background: #cbd5e1; color: #1d2951; }

.card-body { padding: 22px; }
.card-body.scrollable { max-height: calc(100vh - 250px); overflow-y: auto; }

.restrict-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px; border-bottom: 1px solid #f1f5f9;
}
.restrict-item:last-child { border-bottom: none; }
.restrict-info { flex: 1; margin-right: 15px; }
.restrict-info h4 { margin: 0 0 6px; font-size: 14px; color: #1d2951; font-weight: 700; }
.restrict-obs { margin: 0 0 10px; font-size: 12px; color: #64748b; line-height: 1.4; }
.restrict-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tag { font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 99px; text-transform: uppercase; }
.tag-blue { background: #eff6ff; color: #3b82f6; }
.tag-orange { background: #fff7ed; color: #f97316; }
.tag-purple { background: #faf5ff; color: #a855f7; }
.tag-teal { background: #f0fdfa; color: #14b8a6; }
.tag-gray { background: #f1f5f9; color: #64748b; }

.item-actions { display: flex; gap: 8px; flex-shrink: 0; }
.btn-edit, .btn-delete { background: none; border: none; font-size: 16px; cursor: pointer; opacity: 0.6; transition: all 0.2s; }
.btn-edit:hover, .btn-delete:hover { opacity: 1; transform: scale(1.15); }

/* Batch Review Area */
.batch-review-area {
  background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 12px;
  padding: 16px; margin-bottom: 24px;
}
.batch-header h4 { margin: 0 0 4px; color: #92400e; font-size: 14px; font-weight: 800; }
.batch-header p { margin: 0 0 12px; color: #b45309; font-size: 12px; }
.batch-items {
  max-height: 200px; overflow-y: auto; background: rgba(255, 255, 255, 0.5);
  border-radius: 8px; padding: 8px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 4px;
}
.batch-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 10px; background: #fff; border: 1px solid #fde68a; border-radius: 6px; font-size: 11px;
}
.batch-text { color: #1d2951; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
.btn-remove-batch { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 12px; padding: 0 4px; }
.batch-footer { display: flex; gap: 10px; }
.btn-save-batch { flex: 2; padding: 10px; background: #059669; color: #fff; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; }
.btn-cancel-batch { flex: 1; padding: 10px; background: #e2e8f0; color: #475569; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; }

.empty-list { padding: 40px; text-align: center; color: #64748b; font-style: italic; font-size: 14px; }
</style>
