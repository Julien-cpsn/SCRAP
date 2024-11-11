export const load = ({ params }) => {
	return {
		acronym: params.slug.toLowerCase()
	}
}