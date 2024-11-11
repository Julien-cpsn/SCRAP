import { persisted } from 'svelte-persisted-store'

// First param `preferences` is the local storage key.
// Second param is the initial value.
export const selected_conference_store = persisted('selected-conference', {
	conference_name: null,
	conference_acronym: null,
	keywords: ''
})