<script setup>
  import PrimeButton from 'primevue/button'
  import advancedFilter from '@/templates/advanced-filter'
  import { computed, ref, watch } from 'vue'
  import { MAP_SERVICE_OPERATION } from '@modules/real-time-metrics/constants'
  import { GetRelevantField } from '@/modules/real-time-metrics/filters'

  const {
    getDatasetAvailableFilters,
    infoAvailableFiltersCurrent,
    getIsLoadingFilters,
    dashboardCurrent,
    currentFilters
  } = props.moduleGetters

  const { setTimeRange, filterDatasetUpdate, createAndFilter, loadCurrentReports, resetFilters } =
    props.moduleActions

  const emit = defineEmits(['clearHash'])
  const props = defineProps({
    playgroundOpener: {
      type: Function,
      required: true
    },
    moduleActions: {
      type: Object,
      required: true
    },
    moduleGetters: {
      type: Object,
      required: true
    },
    filterData: {
      type: Object,
      required: true
    },
    groupData: {
      type: Object,
      required: true
    },
    userUTC: {
      type: String,
      required: true
    },
    filterHash: {
      type: String,
      required: true
    }
  })
  const refAdvancedFilter = ref('')

  const disabledFilter = computed(() => {
    return getIsLoadingFilters({ filters: props.filterData })
  })

  const currentDashboard = computed(() => {
    return dashboardCurrent({ group: props.groupData })
  })

  const optionsFields = computed(() => {
    const infoOptions = infoAvailableFiltersCurrent({ filters: props.filterData })
    const options = getDatasetAvailableFilters({ filters: props.filterData })

    if (!options.length) return []
    if (!infoOptions) return []

    const { dataset } = currentDashboard.value

    const newOptions = options.map(({ label, operator, value }) => {
      const info = infoOptions[dataset][value]
      const mostRelevant = GetRelevantField(label, dataset)
      return {
        label,
        value,
        mostRelevant,
        description: info?.description,
        operator: operator.map((op) => ({
          value: op.value,
          type: op.type,
          props: {
            placeholder: info?.placeholder,
            services: MAP_SERVICE_OPERATION[`${value}${op.value}`] || []
          }
        }))
      }
    })
    sortFields(newOptions)
    return newOptions
  })

  const decodeFilter = (filters) => {
    if (!filters) return {}
    return JSON.parse(atob(filters))
  }

  const getTimeFilterInHash = () => {
    const { external } = decodeFilter(props.filterHash)
    return external
  }

  const setTimeFilter = (tsRange) => {
    const filterFromHash = getTimeFilterInHash()

    if (filterFromHash) {
      setTimeRange({
        tsRangeBegin: filterFromHash.tsRange.begin,
        tsRangeEnd: filterFromHash.tsRange.end,
        meta: { option: 'custom' }
      })

      return emit('clearHash')
    }

    return setTimeRange({
      tsRangeBegin: tsRange.begin,
      tsRangeEnd: tsRange.end,
      meta: tsRange.meta
    })
  }

  const getTimeFilter = () => {
    const { external } = decodeFilter(props.filterHash)

    if (!external) return { ...currentFilters({ filters: props.filterData }) }

    return { tsRange: { ...external.tsRange } }
  }

  const timeFilter = computed({
    get: () => {
      return getTimeFilter()
    },
    set: ({ tsRange }) => {
      if (!tsRange?.meta) return
      setTimeFilter(tsRange)
    }
  })

  const sortFields = (fields) => {
    const notRelevant = -1
    fields.sort((fieldA, fieldB) => {
      if (fieldA.mostRelevant === notRelevant && fieldB.mostRelevant !== notRelevant) {
        return 1
      }

      if (fieldA.mostRelevant !== notRelevant && fieldB.mostRelevant === notRelevant) {
        return -1
      }

      if (fieldA.mostRelevant !== fieldB.mostRelevant) {
        return fieldA.mostRelevant - fieldB.mostRelevant
      }

      return fieldA.label.localeCompare(fieldB.label)
    })
  }

  const applyFilter = async (filter) => {
    resetFilters()

    filter?.forEach((item) => {
      const field = `${item.valueField}${item.operator}`
      const alias = `${item.operator}`
      if (item.operator === 'In') {
        filterDatasetUpdate({
          fieldName: field,
          fieldAlias: `${alias}`,
          in: item.value.map((domain) => ({
            sourceId: domain.value,
            sourceName: domain.label
          })),
          meta: {
            inputType: '[String]',
            fieldPrefix: `${alias}_`
          }
        })
        return
      }

      if (item.operator === 'Range') {
        createAndFilter({
          [field]: {
            begin: item.value.begin,
            end: item.value.end,
            meta: {
              inputType: item.type
            }
          }
        })
        return
      }

      createAndFilter({
        [field]: {
          value: item.value,
          meta: {
            inputType: item.type
          }
        }
      })
    })

    await loadCurrentReports(props.userUTC)
  }

  watch(
    () => currentDashboard.value,
    async () => {
      refAdvancedFilter.value.clearDisplayFilter()
    }
  )
</script>

<template>
  <div class="flex w-full flex-column gap-6 md:gap-2 md:flex-row">
    <advancedFilter
      :disabled="disabledFilter"
      :fieldsInFilter="optionsFields"
      hashLess
      :filterHash="filterHash"
      v-model:externalFilter="timeFilter"
      ref="refAdvancedFilter"
      @applyFilter="applyFilter"
    />
    <div class="flex align-items-center w-full md:max-w-fit">
      <PrimeButton
        class="h-auto w-full md:max-w-fit"
        outlined
        size="small"
        icon-pos="right"
        icon="pi pi-external-link"
        label="Open in GraphiQL Playground"
        @click="props.playgroundOpener()"
      />
    </div>
  </div>
</template>
