<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Edit Team"
        data-testid="teams-permissions__edit-view__page-heading"
      />
    </template>
    <template #content>
      <EditFormBlock
        @on-load-fail="handleLoadFail"
        :editService="props.editTeamPermissionService"
        :loadService="props.loadTeamPermissionService"
        :updatedRedirect="updatedRedirect"
        :schema="validationSchema"
      >
        <template #form>
          <FormFieldsTeamPermissions :listPermissionService="props.listPermissionService" />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarTemplate
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { useRouter } from 'vue-router'
  import FormFieldsTeamPermissions from './FormFields/FormFieldsTeamPermissions.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'

  import * as yup from 'yup'
  const props = defineProps({
    editTeamPermissionService: {
      type: Function,
      required: true
    },
    loadTeamPermissionService: {
      type: Function,
      required: true
    },
    listPermissionService: {
      type: Function,
      required: true
    },
    updatedRedirect: {
      type: String,
      required: true
    }
  })

  const router = useRouter()

  const handleLoadFail = () => {
    router.push({ name: 'teams-permission' })
  }

  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field'),
    permissions: yup.array().required('Permission is a required field').min(1),
    isActive: yup.boolean()
  })
</script>
