<script>
	import axios from 'axios'
	import {
		Input,
		Spinner,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte'
	import { SearchOutline } from 'flowbite-svelte-icons'
	import { goto } from '$app/navigation'
	import { selected_conference_store } from '../stores/app-store.js'
	import { SCRAP_API_URL } from '$env/static/public';

	let search = $state('')

	let loading = $state(false)
	let conferences = $state(null)

	async function find_conference() {
		if (search.length === 0) {
			return
		}

		loading = true
		const response = await axios.post(`${SCRAP_API_URL}/find-conference`, { name: search })

		loading = false

		if (response.status === 200) {
			conferences = await response.data
		}
	}

	function select_conference(conference) {
		selected_conference_store.update(() => {
			return {
				conference_name: conference.venue,
				conference_acronym: conference.acronym,
			}
		})

		goto(`/conference/${conference.acronym}`)
	}
</script>

<svelte:head>
	<title>Home</title>
</svelte:head>

<div class="mx-auto my-10 w-3/4 md:w-1/2">
	<Input
		placeholder="Search for a conference..."

		bind:value={search}
		on:keydown={(event) => { if (event.key === 'Enter') find_conference() }}
	>
		<SearchOutline slot="left" />
	</Input>
</div>

{#if loading === true}
	<Spinner />
{:else if conferences === null}
	<p></p>
{:else if conferences.length === 0}
	<p>No conferences found</p>
{:else}
	<Table hoverable={true}>
		<TableHead>
			<TableHeadCell>Conference name</TableHeadCell>
			<TableHeadCell>Acronym</TableHeadCell>
			<TableHeadCell>Type</TableHeadCell>
		</TableHead>
		<TableBody>
			{#each conferences as conference}
				<TableBodyRow on:click={() => select_conference(conference)} class="cursor-pointer">
					<TableBodyCell><span class="font-bold">{conference.venue}</span></TableBodyCell>
					<TableBodyCell>{conference.acronym}</TableBodyCell>
					<TableBodyCell>{conference.type}</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
{/if}