<script>
	import axios from 'axios'
	import {
		ArrowKeyDown,
		ArrowKeyUp,
		Button,
		Input,
		Modal, Progressbar,
		SpeedDial,
		SpeedDialButton,
		Spinner,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Textarea, Toast,
		Tooltip
	} from 'flowbite-svelte'
	import {
		ArrowLeftOutline,
		BadgeCheckOutline,
		CloseCircleOutline,
		DownloadSolid,
		FileExportOutline,
		FileSearchOutline,
		SearchOutline
	} from 'flowbite-svelte-icons'
	import { selected_conference_store } from '../../../stores/app-store.js'
	import { sineOut } from 'svelte/easing'
	import { SCRAP_API_URL, SCRAP_HUB_URL } from '$env/static/public';

	let name = $selected_conference_store.conference_name
	let acronym = $selected_conference_store.conference_acronym
	let keywords = $selected_conference_store.keywords

	let publications = $state([])
	let search = $state('')
	let matching_sort = $state('asc')
	let year_sort = $state(null)
	let filtered_publications = () => {
		let tmp = publications.filter((publication) => publication.title.toLowerCase().includes(search.toLowerCase()))

		switch (matching_sort) {
			case 'asc':
				tmp = tmp.sort((a, b) => (a.matching === b.matching)? 0 : a.matching? -1 : 1)
				break
			case 'desc':
				tmp = tmp.sort((a, b) => (a.matching === b.matching)? 0 : a? 1 : -1)
				break
		}

		switch (year_sort) {
			case 'asc':
				tmp = tmp.sort((a, b) => parseInt(b.year) - parseInt(a.year))
				break
			case 'desc':
				tmp = tmp.sort((a, b) => parseInt(a.year) - parseInt(b.year))
				break
		}

		return tmp
	}

	let open_row = $state(null)
	let promise = $state(find_publications())

	let keywords_popup = $state(false)
	let processing = $state(false)
	let processing_percentage = $state(0.0)

	async function find_publications() {
		if (acronym === null) {
			return
		}

		const response = await axios.post(`${SCRAP_API_URL}/find-publications`, { acronym: acronym.toLowerCase() })

		if (response.status === 200) {
			publications = await response.data.map(publication => {
				return {
					matching: false,
					...publication
				}
			})
		}
	}

	async function toggle_row(index) {
		if (open_row === index) {
			open_row = null
		}
		else {
			open_row = index

			//const response = await axios.post('http://localhost:8011/retrieve-abstract', { doi: publications[i].doi })
		}
	}

	function next_matching_sort() {
		switch (matching_sort) {
			case null:
				matching_sort = 'desc'
				break
			case 'asc':
				matching_sort = null
				break
			case 'desc':
				matching_sort = 'asc'
				break
		}
	}

	function next_year_sort() {
		switch (year_sort) {
			case null:
				year_sort = 'desc'
				break
			case 'asc':
				year_sort = null
				break
			case 'desc':
				year_sort = 'asc'
				break
		}
	}

	async function ask_chat_gpt() {
		if (keywords === undefined || keywords === '') {
			return
		}

		processing = true

		processing_percentage = 0.0
		const filtered_publications_tmp = filtered_publications()
		const total_publications = filtered_publications_tmp.length
		const step = 50 * 100 / total_publications
		const batch_size = 50
		let processed = -1

		while (processed < total_publications) {
			let start = processed + 1
			let end = Math.min(processed + batch_size, total_publications)

			let batch_str = ''

			const batch = filtered_publications_tmp.slice(start, end)

			for (let publication of batch) {
				batch_str += `- ${publication.title}\n`
			}

			const response = await axios.post(
				`${SCRAP_API_URL}/ask-chat-gpt`,
				{
					publications: batch_str,
					keywords: keywords
				})

			const titles = response.data.titles

			for (const title of titles) {
				for (let publication of publications) {
					if (publication.title === title) {
						publication.matching = true
					}
				}
			}

			processed = end;
			processing_percentage += step
		}

		processing = false
	}

	function export_to_csv() {
		let csv = 'title,authors,year,doi'

		for (const publication of filtered_publications()) {
			let authors_str = ''
			if (publication.authors !== undefined) {
				if (Array.isArray(publication.authors.author)) {
					publication.authors.author.forEach((author, index) => {
						authors_str += author.text

						if (index !== publication.authors.author.length - 1) {
							authors_str += ';'
						}
					})
				}
				else {
					authors_str = publication.authors.author.text
				}
			}
			csv += `${publication.title},${authors_str},${publication.year},${publication.doi}\n`
		}

		const element = document.createElement('a');
		element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
		element.setAttribute('download', `${acronym}-publications.csv`);

		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
	}
</script>

<svelte:head>
	<title>{acronym} | Publications</title>
</svelte:head>

<div class="flex flex-col">
	<div class="flex flex-col md:flex-row items-center justify-between mx-3 my-5">
		<div class="flex flex-row items-center justify-start">
			<Button outline size="sm" href="/" class="flex flex-col md:flex-row items-center justify-start">
				<ArrowLeftOutline />&nbsp;
				Go back
			</Button>
			<span class="text-black dark:text-white ml-3">
				<span class="font-bold">{ name }&nbsp;</span>
				<br class="md:hidden">
				<span class="font-thin">({publications.length} publications)</span>
			</span>
		</div>
		<div class="mt-4 w-full md:mt-0 md:w-auto">
			<Input
				placeholder="Search in title..."

				bind:value={search}
			>
				<SearchOutline slot="left" />
			</Input>
		</div>
	</div>
	<div class="w-full">
		{#await promise}
			<div class="mx-auto">
				<Spinner />
			</div>
		{:then _}
			<Table hoverable={true}>
				<TableHead>
					<TableHeadCell on:click={next_matching_sort} class="cursor-pointer">
						<div class="flex flex-row">
							Matching&nbsp;
							{#if (matching_sort === 'asc')}
								<ArrowKeyUp />
							{:else if (matching_sort === 'desc')}
								<ArrowKeyDown />
							{/if}
						</div>
					</TableHeadCell>
					<TableHeadCell>Title</TableHeadCell>
					<TableHeadCell on:click={next_year_sort} class="cursor-pointer">
						<div class="flex flex-row">
							Year&nbsp;
							{#if (year_sort === 'asc')}
								<ArrowKeyDown />
							{:else if (year_sort === 'desc')}
								<ArrowKeyUp />
							{/if}
						</div>
					</TableHeadCell>
					<TableHeadCell>DOI</TableHeadCell>
					<TableHeadCell>Download</TableHeadCell>
				</TableHead>
				<TableBody tableBodyClass="divide-y">
					{#each filtered_publications() as publication, i}
						<TableBodyRow on:click={() => toggle_row(i)}>
							<TableBodyCell>
								<div class="w-full flex justify-center items-center">
									{#if publication.matching}
										<BadgeCheckOutline color="green"></BadgeCheckOutline>
										<Tooltip placement='right'>Matches given keywords</Tooltip>
									{:else}
										<CloseCircleOutline color="red"></CloseCircleOutline>
										<Tooltip placement='right'>Does not match given keywords</Tooltip>
									{/if}
								</div>
							</TableBodyCell>
							<TableBodyCell><span class="font-bold">{publication.title}</span></TableBodyCell>
							<TableBodyCell class="opacity-60">{publication.year}</TableBodyCell>
							<TableBodyCell class="opacity-60 underline"><a href={publication.ee}>{publication.ee}</a></TableBodyCell>
							<TableBodyCell class="underline">
								<div class="w-full flex justify-center items-center">
									<a target="_blank" href={`${SCRAP_HUB_URL}${publication.doi}`}><DownloadSolid></DownloadSolid></a>
								</div>
							</TableBodyCell>
						</TableBodyRow>

						{#if open_row === i}
							<TableBodyRow>
								<TableBodyCell colspan="4" class="p-0">
									<div class="px-5 py-5 bg-gray-100 dark:bg-gray-700">
										<div class="flex flex-col">
											<div>
												<span class="font-bold">Authors:</span>
												{#if publication.authors !== undefined}
													{#each publication.authors.author as author, i}
														{author.text}

														{#if i < publication.authors.author.length - 1}
															,&nbsp;
														{/if}
													{/each}
												{/if}
											</div>

										</div>
									</div>
								</TableBodyCell>
							</TableBodyRow>
						{/if}
					{/each}
				</TableBody>
			</Table>
		{/await}
	</div>
</div>

<SpeedDial defaultClass="fixed end-6 bottom-6">
	<SpeedDialButton name="Find matching publications" on:click={() => (keywords_popup = true)}>
		<FileSearchOutline />
	</SpeedDialButton>
	<SpeedDialButton name="Export to CSV" on:click={export_to_csv}>
		<FileExportOutline />
	</SpeedDialButton>
</SpeedDial>

{#if processing}
	<Toast dismissable={false} contentClass="fixed bottom-5 inset-x-0 mx-auto flex flex-row items-center justify-center bg-gray-100 dark:bg-gray-700 px-4 py-4 w-1/4 rounded-md">
		<span class="pr-4" style="border-right: 1px solid rgba(0, 0, 0, 0.1)">Processing</span>
		<div class="ml-4 w-full">
			<Progressbar animate progress={processing_percentage} tweenDuration={1000} easing={sineOut}/>
		</div>
	</Toast>
{/if}

<Modal bind:open={keywords_popup} size="sm" class="px-2" autoclose>
	<div class="text-center">
		<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">Enter the keywords or concept you want to match</h3>

		<Textarea class="h-32 mb-4" placeholder={ "- Cancer\n- Mitochondria\n- ..." } style="resize: none;" bind:value={$selected_conference_store.keywords}/>

		<Button color="red" class="me-2" on:click={ask_chat_gpt}>Match publications</Button>
		<Button color="alternative">No, cancel</Button>
	</div>
</Modal>

<!--
{
    "authors": {
        "author": [
            {
                "@pid": "87/8037",
                "text": "Henry Corrigan-Gibbs"
            },
            {
                "@pid": "32/10400-1",
                "text": "David J. Wu 0001"
            },
            {
                "@pid": "b/DanBoneh",
                "text": "Dan Boneh"
            }
        ]
    },
    "title": "Quantum Operating Systems.",
    "venue": "HotOS",
    "pages": "76-81",
    "year": "2017",
    "type": "Conference and Workshop Papers",
    "access": "closed",
    "key": "conf/hotos/Corrigan-GibbsW17",
    "doi": "10.1145/3102980.3102993",
    "ee": "https://doi.org/10.1145/3102980.3102993",
    "url": "https://dblp.org/rec/conf/hotos/Corrigan-GibbsW17"
}-->