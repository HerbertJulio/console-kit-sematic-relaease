<script setup>
  import {
    EDGE_CERTIFICATE,
    TRUSTED_CA_CERTIFICATE
  } from '@/services/digital-certificates-services'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import PrimeButton from 'primevue/button'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import InputText from 'primevue/inputtext'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import { useField } from 'vee-validate'
  import { computed, ref } from 'vue'

  const props = defineProps({
    digitalCertificates: {
      type: Array,
      required: true
    },
    edgeApplicationsData: {
      type: Array,
      required: true
    },
    hasDomainName: {
      type: Boolean,
      required: false,
      default: false
    },
    loadingEdgeApplications: {
      type: Boolean
    }
  })

  const { value: name } = useField('name')
  const { value: cnames } = useField('cnames')
  const { value: cnameAccessOnly } = useField('cnameAccessOnly')
  const { value: edgeApplication } = useField('edgeApplication')
  const { value: edgeCertificate } = useField('edgeCertificate')
  const { value: mtlsIsEnabled } = useField('mtlsIsEnabled')

  const { value: domainName } = useField('domainName')

  const { value: mtlsTrustedCertificate } = useField('mtlsTrustedCertificate')

  const edgeCertificates = computed(() => {
    return props.digitalCertificates.filter((certificate) => certificate.type === EDGE_CERTIFICATE)
  })

  const trustedCACertificates = computed(() => {
    return props.digitalCertificates.filter(
      (certificate) => certificate.type === TRUSTED_CA_CERTIFICATE
    )
  })

  const edgeApplicationOptions = computed(() => {
    return props.edgeApplicationsData.map((edgeApp) => ({ name: edgeApp.name, value: edgeApp.id }))
  })

  const edgeCertificatesOptions = computed(() => {
    const defaultCertificate = [
      { name: 'Azion (SAN)', value: 0 },
      { name: "Let's Encrypt", value: 'lets_encrypt' }
    ]
    const parsedCertificates = edgeCertificates.value?.map((certificate) => ({
      name: certificate.name,
      value: certificate.id
    }))

    return [...defaultCertificate, ...parsedCertificates]
  })

  const trustedCACertificatesOptions = computed(() => {
    return trustedCACertificates.value.map((certificate) => ({
      name: certificate.name,
      value: certificate.id
    }))
  })

  const mtlsModeRadioOptions = ref([
    {
      title: 'Enforce',
      subtitle: `Blocks the client certificate during the TLS handshake if the uploaded Trusted CA can't be validated.`,
      inputValue: 'enforce'
    },
    {
      title: 'Permissive',
      subtitle: `Attempts to verify the client certificate, but will allow the TLS handshake even if
              the Trusted CA can't be validated. Check which client certificate attempted the
              request in Edge Firewall, if necessary.`,
      inputValue: 'permissive'
    }
  ])

  const isLoadingEdgeApplications = computed(() => {
    return props.loadingEdgeApplications
  })
</script>

<template>
  <form-horizontal
    title="General"
    description="Check the details of the Azion domain, including the domain address to access the application, and modify digital certificate options."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          placeholder="My domain"
          :value="name"
          description="Give a unique and descriptive name to identify the domain."
        />
      </div>
    </template>
  </form-horizontal>

  <form-horizontal
    title="Domain"
    description="The domain URL attributed by Azion."
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <label
          for="domainName"
          class="text-color text-base font-medium"
        >
          Domain
        </label>
        <div
          class="flex gap-6 md:align-items-center max-sm:flex-col max-sm:align-items-baseline max-sm:gap-3"
        >
          <span class="p-input-icon-right w-full flex max-w-lg flex-col items-start gap-2">
            <i class="pi pi-lock" />
            <InputText
              id="domainName"
              data-testid="edit-domains-form__domain-field__input"
              v-model="domainName"
              type="text"
              class="flex flex-col w-full"
              :feedback="false"
              disabled
            />
          </span>
          <PrimeButton
            icon="pi pi-clone"
            outlined
            data-testid="edit-domains-form__domain-field__copy-button"
            type="button"
            aria-label="Copy to Clipboard"
            label="Copy to Clipboard"
            :disabled="!props.hasDomainName"
            @click="$emit('copyDomainName', { name: domainName })"
          />
        </div>
      </div>
    </template>
  </form-horizontal>

  <form-horizontal
    title="Settings"
    description="Determine the edge application of the domain and its digital certificate. To link an existing domain to an application, add it to the CNAME field and block access to the application via the Azion domain."
  >
    <template #inputs>
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <FieldDropdown
          label="Edge Application"
          required
          name="edgeApplication"
          :options="edgeApplicationOptions"
          :loading="isLoadingEdgeApplications"
          :disabled="isLoadingEdgeApplications"
          optionLabel="name"
          optionValue="value"
          :value="edgeApplication"
          filter
          appendTo="self"
          placeholder="Select an edge application"
        />
      </div>

      <FieldSwitchBlock
        nameField="cnameAccessOnly"
        name="cnameAccessOnly"
        auto
        :isCard="false"
        title="CNAME Access Only"
        subtitle="Check this option to make the application accessible only through the domains listed in the CNAME field. Attempts to access the application through the Azion domain will be blocked."
      />

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldTextArea
          label="CNAME"
          data-testid="domains-form__cnames-field"
          :required="cnameAccessOnly"
          name="cnames"
          rows="2"
          :value="cnames"
          description="List of CNAMEs to associate to the Azion domain. Separate each entry in a new line."
        />
      </div>

      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <FieldDropdown
          label="Digital Certificate"
          name="edgeCertificate"
          :options="edgeCertificatesOptions"
          :loading="!edgeCertificatesOptions.length"
          :disabled="!edgeCertificatesOptions.length"
          optionLabel="name"
          optionValue="value"
          :value="edgeCertificate"
          filter
          appendTo="self"
          placeholder="Select a certificate"
        />
      </div>
    </template>
  </form-horizontal>

  <form-horizontal
    title="Mutual Authentication Settings"
    description="Enable Mutual Authentication (mTLS) to require that both client and server present an authentication protocol to each other."
  >
    <template #inputs>
      <FieldSwitchBlock
        nameField="mtlsIsEnabled"
        name="mtlsIsEnabled"
        auto
        :isCard="false"
        title="Mutual Authentication"
      />

      <div v-if="mtlsIsEnabled">
        <div class="flex flex-col gap-3">
          <FieldGroupRadio
            nameField="mtlsVerification"
            :isCard="true"
            label="Mode"
            :options="mtlsModeRadioOptions"
          />
        </div>
      </div>

      <div
        v-if="mtlsIsEnabled"
        class="flex flex-col w-full sm:max-w-xs gap-2"
      >
        <FieldDropdown
          label="Trusted CA Certificate"
          required
          name="mtlsTrustedCertificate"
          :options="trustedCACertificatesOptions"
          :loading="!trustedCACertificatesOptions.length"
          :disabled="!mtlsIsEnabled"
          optionLabel="name"
          optionValue="value"
          :value="mtlsTrustedCertificate"
          filter
          placeholder="Select a Trusted CA certificate"
          description="Mutual Authentification requires a Trusted CA Certificate. Go to Digital Certificates to upload one."
        />
      </div>
    </template>
  </form-horizontal>

  <form-horizontal title="Status">
    <template #inputs>
      <FieldSwitchBlock
        data-testid="edit-domains-form__active-field"
        nameField="active"
        name="active"
        auto
        :isCard="false"
        title="Active"
      />
    </template>
  </form-horizontal>
</template>
