<script>
	import '../app.css';
	import { DarkMode, Navbar, NavBrand } from 'flowbite-svelte';
</script>

<Navbar class="fixed top-0 z-50 bg-gray-200 dark:bg-gray-900 shadow-sm shadow-gray-200 dark:shadow-gray-700">
	<NavBrand href="/">
		<span class="text-primary-700 font-extrabold">SCRAP</span>
		<span class="text-black dark:text-white font-thin hidden md:block">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
		<span class="hidden md:block">
			<span class="text-primary-500">&#123;S&#125;</span>earch in
			<span class="text-primary-500">&#123;C&#125;</span>onferences for
			<span class="text-primary-500">&#123;R&#125;</span>essources
			<span class="text-primary-500">&#123;A&#125;</span>nd
			<span class="text-primary-500">&#123;P&#125;</span>ublications</span>
	</NavBrand>

	<DarkMode />
</Navbar>
<div style="height: 60px"></div>

<slot />